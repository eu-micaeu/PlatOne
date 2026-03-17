package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// User representa o jogador e suas conexões
type User struct {
	ID        primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	Username  string             `bson:"username" json:"username"`
	Email     string             `bson:"email" json:"email"`
	Platforms PlatformAccounts   `bson:"platforms" json:"platforms"`
	CreatedAt time.Time          `bson:"created_at" json:"created_at"`
}

type PlatformAccounts struct {
	Steam *SteamAccount `bson:"steam,omitempty" json:"steam,omitempty"`
	Xbox  *XboxAccount  `bson:"xbox,omitempty" json:"xbox,omitempty"`
	PSN   *PSNAccount   `bson:"psn,omitempty" json:"psn,omitempty"`
}

type SteamAccount struct {
	SteamID    string    `bson:"steam_id" json:"steam_id"`
	ProfileURL string    `bson:"profile_url" json:"profile_url"`
	LastSync   time.Time `bson:"last_sync" json:"last_sync"`
}

type XboxAccount struct {
	XUID     string    `bson:"xuid" json:"xuid"`
	Gamertag string    `bson:"gamertag" json:"gamertag"`
	LastSync time.Time `bson:"last_sync" json:"last_sync"`
}

type PSNAccount struct {
	AccountId string    `bson:"account_id" json:"account_id"`
	OnlineId  string    `bson:"online_id" json:"online_id"`
	LastSync  time.Time `bson:"last_sync" json:"last_sync"`
}

// Game representa um jogo em uma plataforma específica
type Game struct {
	ID                primitive.ObjectID     `bson:"_id,omitempty" json:"id"`
	Title             string                 `bson:"title" json:"title"`
	Platform          string                 `bson:"platform" json:"platform"` // steam, xbox, psn
	ExternalID        string                 `bson:"external_id" json:"external_id"`
	TotalAchievements int                    `bson:"total_achievements" json:"total_achievements"`
	Metadata          map[string]interface{} `bson:"metadata" json:"metadata"` // Dados específicos da API
}

// Platinum registra a conquista de 100%
type Platinum struct {
	ID             primitive.ObjectID     `bson:"_id,omitempty" json:"id"`
	UserID         primitive.ObjectID     `bson:"user_id" json:"user_id"`
	GameID         primitive.ObjectID     `bson:"game_id" json:"game_id"`
	Platform       string                 `bson:"platform" json:"platform"`
	UnlockedCount  int                    `bson:"unlocked_count" json:"unlocked_count"`
	IsPlatinum     bool                   `bson:"is_platinum" json:"is_platinum"`
	ValidationDate time.Time              `bson:"validation_date" json:"validation_date"`
	Metadata       map[string]interface{} `bson:"metadata,omitempty" json:"metadata,omitempty"`
}

// AchievementStatus representa o estado de uma conquista em um jogo específico.
type AchievementStatus struct {
	ID          string     `json:"id"`
	Name        string     `json:"name"`
	Description string     `json:"description,omitempty"`
	Icon        string     `json:"icon,omitempty"`
	IconGray    string     `json:"iconGray,omitempty"`
	Hidden      bool       `json:"hidden"`
	Achieved    bool       `json:"achieved"`
	UnlockTime  *time.Time `json:"unlockTime,omitempty"`
}
