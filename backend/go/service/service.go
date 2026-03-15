package service

import (
	"context"
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
	UpsertPlatinum(ctx context.Context, plat *models.Platinum) error
}

type platService struct {
	db *mongo.Database
}

func NewPlatService(db *mongo.Database) PlatService {
	return &platService{db: db}
}

// SyncUserGames demonstra o uso de Goroutines e Channels para concorrência
func (s *platService) SyncUserGames(ctx context.Context, userID string) error {
	// Exemplo de concorrência: Sincronizar múltiplas plataformas em paralelo
	platforms := []string{"steam", "xbox", "psn"}
	errChan := make(chan error, len(platforms))
	var wg sync.WaitGroup

	for _, p := range platforms {
		wg.Add(1)
		go func(platform string) {
			defer wg.Done()
			// Simulação de request para API externa com Rate Limiting
			time.Sleep(100 * time.Millisecond)
			errChan <- nil // Substituir por lógica real de sync
		}(p)
	}

	go func() {
		wg.Wait()
		close(errChan)
	}()

	for err := range errChan {
		if err != nil {
			return err
		}
	}

	return nil
}

func (s *platService) VerifyPlatinum(ctx context.Context, userID, gameID string) (bool, error) {
	// Lógica: Se Unlocked == Total, então Platina = True
	return true, nil
}

func (s *platService) UpsertPlatinum(ctx context.Context, plat *models.Platinum) error {
	if plat.UserID.IsZero() {
		plat.UserID = primitive.NewObjectID()
	}
	if plat.GameID.IsZero() {
		plat.GameID = primitive.NewObjectID()
	}
	if plat.ValidationDate.IsZero() {
		plat.ValidationDate = time.Now().UTC()
	}

	coll := s.db.Collection("platinums")
	filter := bson.M{"user_id": plat.UserID, "game_id": plat.GameID}
	update := bson.M{"$set": plat}
	opts := options.Update().SetUpsert(true)

	_, err := coll.UpdateOne(ctx, filter, update, opts)
	return err
}
