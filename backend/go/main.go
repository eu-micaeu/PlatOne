package main

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"os"
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
	mongoURI := os.Getenv("MONGO_URI")
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

	log.Println("Serviço PlatOne iniciado com sucesso na porta :8080")
	log.Fatal(http.ListenAndServe(":8080", corsMiddleware(mux)))
}
