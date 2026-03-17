package service

import (
	"context"
	"errors"
	"fmt"
	"time"

	"platone/backend/models"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type FriendService interface {
	SendFriendRequest(ctx context.Context, fromID, toID string) error
	AcceptFriendRequest(ctx context.Context, requestID string) error
	RejectFriendRequest(ctx context.Context, requestID string) error
	GetFriendRequests(ctx context.Context, userID string) ([]models.FriendRequest, error)
	GetFriends(ctx context.Context, userID string) ([]models.User, error)
	RemoveFriend(ctx context.Context, userID, friendID string) error

	SendMessage(ctx context.Context, fromID, toID, content string) error
	GetMessages(ctx context.Context, userID1, userID2 string) ([]models.Message, error)
	GetConversations(ctx context.Context, userID string) ([]map[string]interface{}, error)
	MarkMessagesAsRead(ctx context.Context, fromID, toID string) error
	GetUnreadCount(ctx context.Context, userID string) (int64, error)
}

type friendService struct {
	db *mongo.Database
}

type authUserRecord struct {
	ID        primitive.ObjectID `bson:"_id"`
	Name      string             `bson:"name"`
	Email     string             `bson:"email"`
	CreatedAt time.Time          `bson:"createdAt"`
}

func NewFriendService(db *mongo.Database) FriendService {
	return &friendService{db: db}
}

func fallbackUsername(userID primitive.ObjectID) string {
	hex := userID.Hex()
	if len(hex) > 6 {
		hex = hex[len(hex)-6:]
	}

	return "Usuario " + hex
}

func (fs *friendService) loadAuthUsersByIDs(ctx context.Context, userIDs []primitive.ObjectID) (map[primitive.ObjectID]models.User, error) {
	usersByID := make(map[primitive.ObjectID]models.User)
	if len(userIDs) == 0 {
		return usersByID, nil
	}

	cursor, err := fs.db.Collection("auth_users").Find(ctx, bson.M{
		"_id": bson.M{"$in": userIDs},
	})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var authUsers []authUserRecord
	if err := cursor.All(ctx, &authUsers); err != nil {
		return nil, err
	}

	for _, authUser := range authUsers {
		usersByID[authUser.ID] = models.User{
			ID:        authUser.ID,
			Username:  authUser.Name,
			Email:     authUser.Email,
			Platforms: models.PlatformAccounts{},
			CreatedAt: authUser.CreatedAt,
		}
	}

	return usersByID, nil
}

// SendFriendRequest envia um pedido de amizade
func (fs *friendService) SendFriendRequest(ctx context.Context, fromID, toID string) error {
	if fromID == toID {
		return errors.New("não é possível enviar pedido de amizade para si mesmo")
	}

	fromOID, err := primitive.ObjectIDFromHex(fromID)
	if err != nil {
		return fmt.Errorf("invalid fromID: %w", err)
	}

	toOID, err := primitive.ObjectIDFromHex(toID)
	if err != nil {
		return fmt.Errorf("invalid toID: %w", err)
	}

	// Verifica se já existe um pedido pendente
	coll := fs.db.Collection("friend_requests")
	existingRequest := coll.FindOne(ctx, bson.M{
		"from_id": fromOID,
		"to_id":   toOID,
		"status":  "pending",
	})
	if existingRequest.Err() == nil {
		return errors.New("já existe um pedido de amizade pendente")
	}

	// Verifica se já são amigos
	friendship := fs.db.Collection("friendships")
	isFriend := friendship.FindOne(ctx, bson.M{
		"$or": []bson.M{
			{"user_id_1": fromOID, "user_id_2": toOID},
			{"user_id_1": toOID, "user_id_2": fromOID},
		},
	})
	if isFriend.Err() == nil {
		return errors.New("já são amigos")
	}

	// Cria o pedido de amizade
	request := models.FriendRequest{
		ID:        primitive.NewObjectID(),
		FromID:    fromOID,
		ToID:      toOID,
		Status:    "pending",
		CreatedAt: time.Now().UTC(),
		UpdatedAt: time.Now().UTC(),
	}

	_, err = coll.InsertOne(ctx, request)
	return err
}

// AcceptFriendRequest aceita um pedido de amizade
func (fs *friendService) AcceptFriendRequest(ctx context.Context, requestID string) error {
	requestOID, err := primitive.ObjectIDFromHex(requestID)
	if err != nil {
		return fmt.Errorf("invalid requestID: %w", err)
	}

	coll := fs.db.Collection("friend_requests")

	// Busca o pedido
	var request models.FriendRequest
	err = coll.FindOne(ctx, bson.M{"_id": requestOID}).Decode(&request)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return errors.New("pedido de amizade não encontrado")
		}
		return err
	}

	if request.Status != "pending" {
		return errors.New("pedido de amizade já foi processado")
	}

	// Atualiza o status do pedido
	_, err = coll.UpdateOne(ctx, bson.M{"_id": requestOID}, bson.M{
		"$set": bson.M{
			"status":     "accepted",
			"updated_at": time.Now().UTC(),
		},
	})
	if err != nil {
		return err
	}

	// Cria a amizade
	friendship := models.Friendship{
		ID:        primitive.NewObjectID(),
		UserID1:   request.FromID,
		UserID2:   request.ToID,
		CreatedAt: time.Now().UTC(),
	}

	_, err = fs.db.Collection("friendships").InsertOne(ctx, friendship)
	return err
}

// RejectFriendRequest rejeita um pedido de amizade
func (fs *friendService) RejectFriendRequest(ctx context.Context, requestID string) error {
	requestOID, err := primitive.ObjectIDFromHex(requestID)
	if err != nil {
		return fmt.Errorf("invalid requestID: %w", err)
	}

	coll := fs.db.Collection("friend_requests")

	result, err := coll.UpdateOne(ctx, bson.M{"_id": requestOID}, bson.M{
		"$set": bson.M{
			"status":     "rejected",
			"updated_at": time.Now().UTC(),
		},
	})
	if err != nil {
		return err
	}

	if result.MatchedCount == 0 {
		return errors.New("pedido de amizade não encontrado")
	}

	return nil
}

// GetFriendRequests obtém os pedidos de amizade pendentes
func (fs *friendService) GetFriendRequests(ctx context.Context, userID string) ([]models.FriendRequest, error) {
	userOID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return nil, fmt.Errorf("invalid userID: %w", err)
	}

	coll := fs.db.Collection("friend_requests")
	cursor, err := coll.Find(ctx, bson.M{
		"to_id":  userOID,
		"status": "pending",
	}, options.Find().SetSort(bson.M{"created_at": -1}))
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var requests []models.FriendRequest
	err = cursor.All(ctx, &requests)
	if err != nil {
		return nil, err
	}

	if requests == nil {
		requests = []models.FriendRequest{}
	}

	fromIDs := make([]primitive.ObjectID, 0, len(requests))
	toIDs := make([]primitive.ObjectID, 0, len(requests))
	for _, request := range requests {
		fromIDs = append(fromIDs, request.FromID)
		toIDs = append(toIDs, request.ToID)
	}

	usersByID, err := fs.loadAuthUsersByIDs(ctx, append(fromIDs, toIDs...))
	if err != nil {
		return nil, err
	}

	for idx := range requests {
		if fromUser, ok := usersByID[requests[idx].FromID]; ok {
			fromCopy := fromUser
			requests[idx].FromUser = &fromCopy
		}

		if toUser, ok := usersByID[requests[idx].ToID]; ok {
			toCopy := toUser
			requests[idx].ToUser = &toCopy
		}
	}

	return requests, nil
}

// GetFriends obtém a lista de amigos de um usuário
func (fs *friendService) GetFriends(ctx context.Context, userID string) ([]models.User, error) {
	userOID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return nil, fmt.Errorf("invalid userID: %w", err)
	}

	coll := fs.db.Collection("friendships")
	cursor, err := coll.Find(ctx, bson.M{
		"$or": []bson.M{
			{"user_id_1": userOID},
			{"user_id_2": userOID},
		},
	})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var friendships []models.Friendship
	err = cursor.All(ctx, &friendships)
	if err != nil {
		return nil, err
	}

	// Coleta os IDs dos amigos
	friendIDs := make([]primitive.ObjectID, 0)
	for _, f := range friendships {
		if f.UserID1 == userOID {
			friendIDs = append(friendIDs, f.UserID2)
		} else {
			friendIDs = append(friendIDs, f.UserID1)
		}
	}

	if len(friendIDs) == 0 {
		return []models.User{}, nil
	}

	usersByID, err := fs.loadAuthUsersByIDs(ctx, friendIDs)
	if err != nil {
		return nil, err
	}

	friends := make([]models.User, 0, len(friendIDs))
	for _, friendID := range friendIDs {
		if friendUser, ok := usersByID[friendID]; ok {
			friends = append(friends, friendUser)
			continue
		}

		friends = append(friends, models.User{
			ID:        friendID,
			Username:  fallbackUsername(friendID),
			Email:     "",
			Platforms: models.PlatformAccounts{},
			CreatedAt: time.Now().UTC(),
		})
	}

	if friends == nil {
		friends = []models.User{}
	}

	return friends, nil
}

// RemoveFriend remove um amigo
func (fs *friendService) RemoveFriend(ctx context.Context, userID, friendID string) error {
	userOID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return fmt.Errorf("invalid userID: %w", err)
	}

	friendOID, err := primitive.ObjectIDFromHex(friendID)
	if err != nil {
		return fmt.Errorf("invalid friendID: %w", err)
	}

	coll := fs.db.Collection("friendships")
	result, err := coll.DeleteOne(ctx, bson.M{
		"$or": []bson.M{
			{"user_id_1": userOID, "user_id_2": friendOID},
			{"user_id_1": friendOID, "user_id_2": userOID},
		},
	})
	if err != nil {
		return err
	}

	if result.DeletedCount == 0 {
		return errors.New("amizade não encontrada")
	}

	return nil
}

// SendMessage envia uma mensagem
func (fs *friendService) SendMessage(ctx context.Context, fromID, toID, content string) error {
	if fromID == toID {
		return errors.New("não é possível enviar mensagem para si mesmo")
	}

	fromOID, err := primitive.ObjectIDFromHex(fromID)
	if err != nil {
		return fmt.Errorf("invalid fromID: %w", err)
	}

	toOID, err := primitive.ObjectIDFromHex(toID)
	if err != nil {
		return fmt.Errorf("invalid toID: %w", err)
	}

	message := models.Message{
		ID:        primitive.NewObjectID(),
		FromID:    fromOID,
		ToID:      toOID,
		Content:   content,
		IsRead:    false,
		CreatedAt: time.Now().UTC(),
	}

	coll := fs.db.Collection("messages")
	_, err = coll.InsertOne(ctx, message)
	return err
}

// GetMessages obtém as mensagens entre dois usuários
func (fs *friendService) GetMessages(ctx context.Context, userID1, userID2 string) ([]models.Message, error) {
	user1OID, err := primitive.ObjectIDFromHex(userID1)
	if err != nil {
		return nil, fmt.Errorf("invalid userID1: %w", err)
	}

	user2OID, err := primitive.ObjectIDFromHex(userID2)
	if err != nil {
		return nil, fmt.Errorf("invalid userID2: %w", err)
	}

	coll := fs.db.Collection("messages")
	cursor, err := coll.Find(ctx, bson.M{
		"$or": []bson.M{
			{"from_id": user1OID, "to_id": user2OID},
			{"from_id": user2OID, "to_id": user1OID},
		},
	}, options.Find().SetSort(bson.M{"created_at": 1}))
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var messages []models.Message
	err = cursor.All(ctx, &messages)
	if err != nil {
		return nil, err
	}

	if messages == nil {
		messages = []models.Message{}
	}

	return messages, nil
}

// GetConversations obtém as conversas de um usuário
func (fs *friendService) GetConversations(ctx context.Context, userID string) ([]map[string]interface{}, error) {
	userOID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return nil, fmt.Errorf("invalid userID: %w", err)
	}

	coll := fs.db.Collection("messages")

	// Aggregation pipeline para obter a última mensagem de cada conversa
	pipeline := mongo.Pipeline{
		{{Key: "$match", Value: bson.M{
			"$or": []bson.M{
				{"from_id": userOID},
				{"to_id": userOID},
			},
		}}},
		{{Key: "$sort", Value: bson.M{"created_at": -1}}},
		{{Key: "$group", Value: bson.M{
			"_id": bson.M{
				"$cond": []interface{}{
					bson.M{"$eq": []interface{}{"$from_id", userOID}},
					"$to_id",
					"$from_id",
				},
			},
			"last_message": bson.M{"$first": "$$ROOT"},
			"unread_count": bson.M{
				"$sum": bson.M{
					"$cond": []interface{}{
						bson.M{
							"$and": []bson.M{
								{"$eq": []interface{}{"$to_id", userOID}},
								{"$eq": []interface{}{"$is_read", false}},
							},
						},
						1,
						0,
					},
				},
			},
		}}},
	}

	cursor, err := coll.Aggregate(ctx, pipeline)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var results []map[string]interface{}
	err = cursor.All(ctx, &results)
	if err != nil {
		return nil, err
	}

	if results == nil {
		results = []map[string]interface{}{}
	}

	return results, nil
}

// MarkMessagesAsRead marca as mensagens como lidas
func (fs *friendService) MarkMessagesAsRead(ctx context.Context, fromID, toID string) error {
	fromOID, err := primitive.ObjectIDFromHex(fromID)
	if err != nil {
		return fmt.Errorf("invalid fromID: %w", err)
	}

	toOID, err := primitive.ObjectIDFromHex(toID)
	if err != nil {
		return fmt.Errorf("invalid toID: %w", err)
	}

	coll := fs.db.Collection("messages")
	_, err = coll.UpdateMany(ctx, bson.M{
		"from_id": fromOID,
		"to_id":   toOID,
		"is_read": false,
	}, bson.M{
		"$set": bson.M{"is_read": true},
	})
	return err
}

// GetUnreadCount obtém a contagem de mensagens não lidas
func (fs *friendService) GetUnreadCount(ctx context.Context, userID string) (int64, error) {
	userOID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return 0, fmt.Errorf("invalid userID: %w", err)
	}

	coll := fs.db.Collection("messages")
	count, err := coll.CountDocuments(ctx, bson.M{
		"to_id":   userOID,
		"is_read": false,
	})
	return count, err
}
