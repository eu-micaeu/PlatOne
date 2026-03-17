package main

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"platone/backend/models"
	"platone/backend/service"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func main() {
	mongoURI := os.Getenv("DATABASE_URL")
	if mongoURI == "" {
		mongoURI = os.Getenv("MONGO_URI")
	}
	if mongoURI == "" {
		mongoURI = "mongodb://mongodb:27017"
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	client, err := mongo.Connect(ctx, options.Client().ApplyURI(mongoURI))
	if err != nil {
		log.Fatal("Erro ao conectar ao MongoDB:", err)
	}
	if err := client.Ping(ctx, nil); err != nil {
		log.Fatal("MongoDB não está acessível:", err)
	}

	db := client.Database("platone")
	svc := service.NewPlatService(db)
	friendSvc := service.NewFriendService(db)

	mux := http.NewServeMux()

	mux.HandleFunc("GET /api/platinums", func(w http.ResponseWriter, r *http.Request) {
		coll := db.Collection("platinums")
		cursor, err := coll.Find(r.Context(), bson.M{})
		if err != nil {
			http.Error(w, "Erro ao buscar platinas", http.StatusInternalServerError)
			return
		}
		defer cursor.Close(r.Context())
		var platinums []models.Platinum
		if err := cursor.All(r.Context(), &platinums); err != nil {
			http.Error(w, "Erro ao decodificar platinas", http.StatusInternalServerError)
			return
		}
		if platinums == nil {
			platinums = []models.Platinum{}
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(platinums)
	})

	mux.HandleFunc("GET /api/stats", func(w http.ResponseWriter, r *http.Request) {
		coll := db.Collection("platinums")
		totalGames, _ := coll.CountDocuments(r.Context(), bson.M{})
		totalPlatinums, _ := coll.CountDocuments(r.Context(), bson.M{"is_platinum": true})
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"totalPlatinums": totalPlatinums,
			"totalGames":     totalGames,
			"lastSync":       time.Now(),
		})
	})

	mux.HandleFunc("GET /api/achievements/{userID}/{gameID}", func(w http.ResponseWriter, r *http.Request) {
		userID := r.PathValue("userID")
		gameID := r.PathValue("gameID")

		if userID == "" || gameID == "" {
			http.Error(w, "userID e gameID sao obrigatorios", http.StatusBadRequest)
			return
		}

		achievements, err := svc.GetGameAchievements(r.Context(), userID, gameID)
		if err != nil {
			http.Error(w, "Erro ao buscar conquistas do jogo", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(achievements)
	})

	mux.HandleFunc("POST /api/sync/{userID}", func(w http.ResponseWriter, r *http.Request) {
		userID := r.PathValue("userID")
		go func() {
			bgCtx, bgCancel := context.WithTimeout(context.Background(), 10*time.Minute)
			defer bgCancel()
			if err := svc.SyncUserGames(bgCtx, userID); err != nil {
				log.Printf("Erro na sincronização Steam para steamID=%s: %v", userID, err)
			}
		}()
		w.WriteHeader(http.StatusAccepted)
	})

	mux.HandleFunc("POST /api/platinum", func(w http.ResponseWriter, r *http.Request) {
		var plat models.Platinum
		if err := json.NewDecoder(r.Body).Decode(&plat); err != nil {
			http.Error(w, "Payload inválido", http.StatusBadRequest)
			return
		}
		if err := svc.UpsertPlatinum(r.Context(), &plat); err != nil {
			http.Error(w, "Erro ao salvar platina", http.StatusInternalServerError)
			return
		}
		w.WriteHeader(http.StatusNoContent)
	})

	// Friend endpoints
	mux.HandleFunc("POST /api/friends/request", func(w http.ResponseWriter, r *http.Request) {
		var req struct {
			FromID string `json:"from_id"`
			ToID   string `json:"to_id"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Payload inválido", http.StatusBadRequest)
			return
		}
		if err := friendSvc.SendFriendRequest(r.Context(), req.FromID, req.ToID); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		w.WriteHeader(http.StatusCreated)
	})

	mux.HandleFunc("POST /api/friends/request/{requestID}/accept", func(w http.ResponseWriter, r *http.Request) {
		requestID := r.PathValue("requestID")
		if err := friendSvc.AcceptFriendRequest(r.Context(), requestID); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		w.WriteHeader(http.StatusNoContent)
	})

	mux.HandleFunc("POST /api/friends/request/{requestID}/reject", func(w http.ResponseWriter, r *http.Request) {
		requestID := r.PathValue("requestID")
		if err := friendSvc.RejectFriendRequest(r.Context(), requestID); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		w.WriteHeader(http.StatusNoContent)
	})

	mux.HandleFunc("GET /api/friends/requests/{userID}", func(w http.ResponseWriter, r *http.Request) {
		userID := r.PathValue("userID")
		requests, err := friendSvc.GetFriendRequests(r.Context(), userID)
		if err != nil {
			http.Error(w, "Erro ao buscar pedidos de amizade", http.StatusInternalServerError)
			return
		}
		if requests == nil {
			requests = []models.FriendRequest{}
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(requests)
	})

	mux.HandleFunc("GET /api/friends/{userID}", func(w http.ResponseWriter, r *http.Request) {
		userID := r.PathValue("userID")
		friends, err := friendSvc.GetFriends(r.Context(), userID)
		if err != nil {
			http.Error(w, "Erro ao buscar amigos", http.StatusInternalServerError)
			return
		}
		if friends == nil {
			friends = []models.User{}
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(friends)
	})

	mux.HandleFunc("DELETE /api/friends/{userID}/{friendID}", func(w http.ResponseWriter, r *http.Request) {
		userID := r.PathValue("userID")
		friendID := r.PathValue("friendID")
		if err := friendSvc.RemoveFriend(r.Context(), userID, friendID); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		w.WriteHeader(http.StatusNoContent)
	})

	// Message endpoints
	mux.HandleFunc("POST /api/messages", func(w http.ResponseWriter, r *http.Request) {
		var req struct {
			FromID  string `json:"from_id"`
			ToID    string `json:"to_id"`
			Content string `json:"content"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Payload inválido", http.StatusBadRequest)
			return
		}
		if err := friendSvc.SendMessage(r.Context(), req.FromID, req.ToID, req.Content); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		w.WriteHeader(http.StatusCreated)
	})

	mux.HandleFunc("GET /api/messages/{userID1}/{userID2}", func(w http.ResponseWriter, r *http.Request) {
		userID1 := r.PathValue("userID1")
		userID2 := r.PathValue("userID2")
		messages, err := friendSvc.GetMessages(r.Context(), userID1, userID2)
		if err != nil {
			http.Error(w, "Erro ao buscar mensagens", http.StatusInternalServerError)
			return
		}
		if messages == nil {
			messages = []models.Message{}
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(messages)
	})

	mux.HandleFunc("GET /api/conversations/{userID}", func(w http.ResponseWriter, r *http.Request) {
		userID := r.PathValue("userID")
		conversations, err := friendSvc.GetConversations(r.Context(), userID)
		if err != nil {
			http.Error(w, "Erro ao buscar conversas", http.StatusInternalServerError)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(conversations)
	})

	mux.HandleFunc("PUT /api/messages/{fromID}/{toID}/read", func(w http.ResponseWriter, r *http.Request) {
		fromID := r.PathValue("fromID")
		toID := r.PathValue("toID")
		if err := friendSvc.MarkMessagesAsRead(r.Context(), fromID, toID); err != nil {
			http.Error(w, "Erro ao marcar mensagens como lidas", http.StatusInternalServerError)
			return
		}
		w.WriteHeader(http.StatusNoContent)
	})

	mux.HandleFunc("GET /api/messages/{userID}/unread", func(w http.ResponseWriter, r *http.Request) {
		userID := r.PathValue("userID")
		count, err := friendSvc.GetUnreadCount(r.Context(), userID)
		if err != nil {
			http.Error(w, "Erro ao contar mensagens não lidas", http.StatusInternalServerError)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"unread_count": count,
		})
	})

	port := strings.TrimSpace(os.Getenv("PORT"))
	if port == "" {
		port = "8080"
	}

	listenAddr := ":" + port
	log.Printf("Serviço PlatOne iniciado com sucesso na porta %s", listenAddr)
	log.Fatal(http.ListenAndServe(listenAddr, corsMiddleware(mux)))
}
