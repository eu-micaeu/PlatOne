package service

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"strconv"
	"strings"
	"sync"
	"time"

	"platone/backend/models"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type PlatService interface {
	SyncUserGames(ctx context.Context, userID string) error
	VerifyPlatinum(ctx context.Context, userID, gameID string) (bool, error)
	GetGameAchievements(ctx context.Context, userID, gameID string) ([]models.AchievementStatus, error)
	UpsertPlatinum(ctx context.Context, plat *models.Platinum) error
}

type platService struct {
	db          *mongo.Database
	httpClient  *http.Client
	steamAPIKey string
}

func NewPlatService(db *mongo.Database) PlatService {
	apiKey := strings.TrimSpace(os.Getenv("STEAM_API_KEY"))
	if apiKey == "" {
		apiKey = strings.TrimSpace(os.Getenv("STEAM_WEB_API_KEY"))
	}

	return &platService{
		db: db,
		httpClient: &http.Client{
			Timeout: 15 * time.Second,
		},
		steamAPIKey: apiKey,
	}
}

type steamOwnedGamesResponse struct {
	Response struct {
		Games []steamOwnedGame `json:"games"`
	} `json:"response"`
}

type steamOwnedGame struct {
	AppID      int    `json:"appid"`
	Name       string `json:"name"`
	ImgIconURL string `json:"img_icon_url"`
}

type steamSchemaResponse struct {
	Game struct {
		GameName           string `json:"gameName"`
		AvailableGameStats struct {
			Achievements []steamSchemaAchievement `json:"achievements"`
		} `json:"availableGameStats"`
	} `json:"game"`
}

type steamSchemaAchievement struct {
	APIName     string `json:"name"`
	DisplayName string `json:"displayName"`
	Description string `json:"description"`
	Icon        string `json:"icon"`
	IconGray    string `json:"icongray"`
	Hidden      int    `json:"hidden"`
}

type steamPlayerAchievementsResponse struct {
	PlayerStats struct {
		Success      bool                     `json:"success"`
		ErrorMessage string                   `json:"error"`
		Achievements []steamPlayerAchievement `json:"achievements"`
	} `json:"playerstats"`
}

type steamPlayerAchievement struct {
	APIName    string `json:"apiname"`
	Achieved   int    `json:"achieved"`
	UnlockTime int64  `json:"unlocktime"`
}

// SyncUserGames sincroniza jogos Steam de um usuário e valida 100% de conquistas.
func (s *platService) SyncUserGames(ctx context.Context, userID string) error {
	steamID := strings.TrimSpace(userID)
	if steamID == "" {
		return errors.New("steamID não informado")
	}
	if s.steamAPIKey == "" {
		return errors.New("STEAM_API_KEY não configurada")
	}

	games, err := s.fetchOwnedSteamGames(ctx, steamID)
	if err != nil {
		return fmt.Errorf("erro ao buscar biblioteca Steam: %w", err)
	}
	if len(games) == 0 {
		return nil
	}

	const maxWorkers = 4
	sem := make(chan struct{}, maxWorkers)
	errChan := make(chan error, len(games))
	var processed int
	var wg sync.WaitGroup

	for _, g := range games {
		game := g
		if game.AppID <= 0 {
			continue
		}

		wg.Add(1)
		go func() {
			defer wg.Done()

			select {
			case sem <- struct{}{}:
			case <-ctx.Done():
				errChan <- ctx.Err()
				return
			}
			defer func() { <-sem }()

			if err := s.syncSteamGame(ctx, steamID, game); err != nil {
				errChan <- err
				return
			}

			errChan <- nil
		}()
		processed++
	}

	go func() {
		wg.Wait()
		close(errChan)
	}()

	if processed == 0 {
		return nil
	}

	var failures int
	for err := range errChan {
		if err != nil {
			failures++
		}
	}

	if failures == processed {
		return errors.New("não foi possível sincronizar conquistas da Steam")
	}

	return nil
}

func (s *platService) VerifyPlatinum(ctx context.Context, userID, gameID string) (bool, error) {
	coll := s.db.Collection("platinums")
	filter := bson.M{
		"platform":                  "Steam",
		"metadata.platform_user_id": strings.TrimSpace(userID),
		"metadata.external_id":      strings.TrimSpace(gameID),
	}

	var plat models.Platinum
	if err := coll.FindOne(ctx, filter).Decode(&plat); err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return false, nil
		}
		return false, err
	}

	return plat.IsPlatinum, nil
}

func (s *platService) GetGameAchievements(ctx context.Context, userID, gameID string) ([]models.AchievementStatus, error) {
	steamID := strings.TrimSpace(userID)
	appID := strings.TrimSpace(gameID)

	if steamID == "" || appID == "" {
		return nil, errors.New("steamID e gameID são obrigatórios")
	}

	if s.steamAPIKey == "" {
		return nil, errors.New("STEAM_API_KEY não configurada")
	}

	schema, err := s.fetchSteamSchema(ctx, appID)
	if err != nil {
		return nil, err
	}

	playerData, err := s.fetchSteamPlayerAchievements(ctx, steamID, appID)
	if err != nil {
		return nil, err
	}

	achievements := schema.Game.AvailableGameStats.Achievements
	if len(achievements) == 0 {
		return []models.AchievementStatus{}, nil
	}

	progressByName := make(map[string]steamPlayerAchievement, len(playerData.PlayerStats.Achievements))
	for _, progress := range playerData.PlayerStats.Achievements {
		if progress.APIName == "" {
			continue
		}
		progressByName[progress.APIName] = progress
	}

	result := make([]models.AchievementStatus, 0, len(achievements))
	for _, achievement := range achievements {
		id := strings.TrimSpace(achievement.APIName)
		if id == "" {
			continue
		}

		progress := progressByName[id]
		isAchieved := progress.Achieved == 1

		var unlockTime *time.Time
		if isAchieved && progress.UnlockTime > 0 {
			parsed := time.Unix(progress.UnlockTime, 0).UTC()
			unlockTime = &parsed
		}

		name := strings.TrimSpace(achievement.DisplayName)
		if name == "" {
			name = id
		}

		result = append(result, models.AchievementStatus{
			ID:          id,
			Name:        name,
			Description: strings.TrimSpace(achievement.Description),
			Icon:        strings.TrimSpace(achievement.Icon),
			IconGray:    strings.TrimSpace(achievement.IconGray),
			Hidden:      achievement.Hidden == 1,
			Achieved:    isAchieved,
			UnlockTime:  unlockTime,
		})
	}

	return result, nil
}

func (s *platService) UpsertPlatinum(ctx context.Context, plat *models.Platinum) error {
	if plat.ValidationDate.IsZero() {
		plat.ValidationDate = time.Now().UTC()
	}

	coll := s.db.Collection("platinums")
	filter := buildPlatinumFilter(plat)

	setFields := bson.M{
		"platform":        plat.Platform,
		"unlocked_count":  plat.UnlockedCount,
		"is_platinum":     plat.IsPlatinum,
		"validation_date": plat.ValidationDate,
		"metadata":        plat.Metadata,
	}
	if !plat.UserID.IsZero() {
		setFields["user_id"] = plat.UserID
	}
	if !plat.GameID.IsZero() {
		setFields["game_id"] = plat.GameID
	}

	setOnInsert := bson.M{}
	if plat.UserID.IsZero() {
		setOnInsert["user_id"] = primitive.NewObjectID()
	}
	if plat.GameID.IsZero() {
		setOnInsert["game_id"] = primitive.NewObjectID()
	}

	update := bson.M{"$set": setFields}
	if len(setOnInsert) > 0 {
		update["$setOnInsert"] = setOnInsert
	}

	opts := options.Update().SetUpsert(true)

	_, err := coll.UpdateOne(ctx, filter, update, opts)
	return err
}

func buildPlatinumFilter(plat *models.Platinum) bson.M {
	if plat.Metadata != nil {
		externalID := strings.TrimSpace(toString(plat.Metadata["external_id"]))
		platformUserID := strings.TrimSpace(toString(plat.Metadata["platform_user_id"]))
		if externalID != "" && platformUserID != "" && strings.TrimSpace(plat.Platform) != "" {
			return bson.M{
				"platform":                  plat.Platform,
				"metadata.external_id":      externalID,
				"metadata.platform_user_id": platformUserID,
			}
		}
	}

	if !plat.UserID.IsZero() && !plat.GameID.IsZero() {
		return bson.M{"user_id": plat.UserID, "game_id": plat.GameID}
	}

	if plat.Metadata != nil {
		externalID := strings.TrimSpace(toString(plat.Metadata["external_id"]))
		if externalID != "" && strings.TrimSpace(plat.Platform) != "" {
			return bson.M{"platform": plat.Platform, "metadata.external_id": externalID}
		}
	}

	return bson.M{"_id": primitive.NewObjectID()}
}

func (s *platService) syncSteamGame(ctx context.Context, steamID string, game steamOwnedGame) error {
	appID := strconv.Itoa(game.AppID)

	schema, err := s.fetchSteamSchema(ctx, appID)
	if err != nil {
		return err
	}

	totalAchievements := len(schema.Game.AvailableGameStats.Achievements)
	if totalAchievements == 0 {
		return nil
	}

	playerData, err := s.fetchSteamPlayerAchievements(ctx, steamID, appID)
	if err != nil {
		return err
	}

	unlocked := 0
	for _, achievement := range playerData.PlayerStats.Achievements {
		if achievement.Achieved == 1 {
			unlocked++
		}
	}

	title := strings.TrimSpace(game.Name)
	if title == "" {
		title = strings.TrimSpace(schema.Game.GameName)
	}
	if title == "" {
		title = "Steam App " + appID
	}

	iconURL := steamCapsuleURL(game.AppID)
	fallbackIconURL := steamCommunityIconURL(game.AppID, game.ImgIconURL)
	if iconURL == "" {
		iconURL = fallbackIconURL
	}

	plat := &models.Platinum{
		Platform:       "Steam",
		UnlockedCount:  unlocked,
		IsPlatinum:     unlocked >= totalAchievements,
		ValidationDate: time.Now().UTC(),
		Metadata: map[string]interface{}{
			"title":              title,
			"platform":           "Steam",
			"external_id":        appID,
			"platform_user_id":   steamID,
			"total_achievements": totalAchievements,
			"icon":               iconURL,
			"icon_fallback":      fallbackIconURL,
		},
	}

	return s.UpsertPlatinum(ctx, plat)
}

func (s *platService) fetchOwnedSteamGames(ctx context.Context, steamID string) ([]steamOwnedGame, error) {
	params := url.Values{}
	params.Set("key", s.steamAPIKey)
	params.Set("steamid", steamID)
	params.Set("include_appinfo", "true")
	params.Set("include_played_free_games", "true")

	var payload steamOwnedGamesResponse
	if err := s.callSteamAPI(ctx, "https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/", params, &payload); err != nil {
		return nil, err
	}

	return payload.Response.Games, nil
}

func (s *platService) fetchSteamSchema(ctx context.Context, appID string) (*steamSchemaResponse, error) {
	params := url.Values{}
	params.Set("key", s.steamAPIKey)
	params.Set("appid", appID)
	params.Set("l", "brazilian")

	var payload steamSchemaResponse
	if err := s.callSteamAPI(ctx, "https://api.steampowered.com/ISteamUserStats/GetSchemaForGame/v2/", params, &payload); err != nil {
		return nil, err
	}

	return &payload, nil
}

func (s *platService) fetchSteamPlayerAchievements(ctx context.Context, steamID, appID string) (*steamPlayerAchievementsResponse, error) {
	params := url.Values{}
	params.Set("key", s.steamAPIKey)
	params.Set("steamid", steamID)
	params.Set("appid", appID)
	params.Set("l", "brazilian")

	var payload steamPlayerAchievementsResponse
	if err := s.callSteamAPI(ctx, "https://api.steampowered.com/ISteamUserStats/GetPlayerAchievements/v1/", params, &payload); err != nil {
		return nil, err
	}

	if strings.TrimSpace(payload.PlayerStats.ErrorMessage) != "" {
		return nil, errors.New(payload.PlayerStats.ErrorMessage)
	}

	return &payload, nil
}

func (s *platService) callSteamAPI(ctx context.Context, endpoint string, params url.Values, target interface{}) error {
	if params == nil {
		params = url.Values{}
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, endpoint+"?"+params.Encode(), nil)
	if err != nil {
		return err
	}

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode < http.StatusOK || resp.StatusCode >= http.StatusMultipleChoices {
		body, _ := io.ReadAll(io.LimitReader(resp.Body, 2048))
		return fmt.Errorf("steam api status %d: %s", resp.StatusCode, strings.TrimSpace(string(body)))
	}

	if err := json.NewDecoder(resp.Body).Decode(target); err != nil {
		return err
	}

	return nil
}

func steamCapsuleURL(appID int) string {
	if appID <= 0 {
		return ""
	}

	return "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/" + strconv.Itoa(appID) + "/capsule_616x353.jpg"
}

func steamCommunityIconURL(appID int, iconHash string) string {
	iconHash = strings.TrimSpace(iconHash)
	if appID <= 0 || iconHash == "" {
		return ""
	}

	return "https://media.steampowered.com/steamcommunity/public/images/apps/" + strconv.Itoa(appID) + "/" + iconHash + ".jpg"
}

func toString(value interface{}) string {
	switch v := value.(type) {
	case string:
		return v
	case fmt.Stringer:
		return v.String()
	case int:
		return strconv.Itoa(v)
	case int32:
		return strconv.FormatInt(int64(v), 10)
	case int64:
		return strconv.FormatInt(v, 10)
	case float64:
		return strconv.FormatFloat(v, 'f', -1, 64)
	default:
		return ""
	}
}
