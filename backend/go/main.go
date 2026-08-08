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
	emailSvc := service.NewEmailService()

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

	// Steam API Key management endpoints
	mux.HandleFunc("POST /api/users/{userID}/steam-api-key", func(w http.ResponseWriter, r *http.Request) {
		userID := r.PathValue("userID")
		var req struct {
			SteamAPIKey string `json:"steam_api_key"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Payload inválido", http.StatusBadRequest)
			return
		}

		coll := db.Collection("users")
		filter := bson.M{"_id": userID}
		update := bson.M{"$set": bson.M{"steam_api_key": strings.TrimSpace(req.SteamAPIKey)}}
		result, err := coll.UpdateOne(r.Context(), filter, update)
		if err != nil {
			http.Error(w, "Erro ao atualizar chave de API", http.StatusInternalServerError)
			return
		}
		if result.MatchedCount == 0 {
			http.Error(w, "Usuário não encontrado", http.StatusNotFound)
			return
		}

		w.WriteHeader(http.StatusNoContent)
	})

	mux.HandleFunc("GET /api/users/{userID}/steam-api-key", func(w http.ResponseWriter, r *http.Request) {
		userID := r.PathValue("userID")

		coll := db.Collection("users")
		var user models.User
		filter := bson.M{"_id": userID}
		if err := coll.FindOne(r.Context(), filter).Decode(&user); err != nil {
			if err == mongo.ErrNoDocuments {
				http.Error(w, "Usuário não encontrado", http.StatusNotFound)
				return
			}
			http.Error(w, "Erro ao buscar usuário", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"has_steam_api_key": user.SteamAPIKey != "",
		})
	})

	// Envia o código de verificação por e-mail (OTP)
	mux.HandleFunc("POST /api/auth/send-verification", func(w http.ResponseWriter, r *http.Request) {
		var req struct {
			Email string `json:"email"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil || !service.ValidateEmailFormat(req.Email) {
			http.Error(w, "Endereço de e-mail inválido ou mal formatado", http.StatusBadRequest)
			return
		}

		code, err := service.GenerateOTPCode()
		if err != nil {
			http.Error(w, "Erro ao gerar código de segurança", http.StatusInternalServerError)
			return
		}

		verification := models.EmailVerification{
			Email:     req.Email,
			Code:      code,
			Attempts:  0,
			ExpiresAt: time.Now().Add(15 * time.Minute),
			CreatedAt: time.Now(),
		}

		coll := db.Collection("email_verifications")
		opts := options.Update().SetUpsert(true)
		filter := bson.M{"email": req.Email}
		update := bson.M{"$set": verification}

		if _, err := coll.UpdateOne(r.Context(), filter, update, opts); err != nil {
			http.Error(w, "Erro ao registrar código de verificação", http.StatusInternalServerError)
			return
		}

		go func() {
			if err := emailSvc.SendVerificationOTP(req.Email, code); err != nil {
				log.Printf("Erro ao enviar e-mail OTP para %s: %v", req.Email, err)
			}
		}()

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]string{
			"message": "Código de verificação enviado com sucesso!",
		})
	})

	// Valida o código informado pelo usuário
	mux.HandleFunc("POST /api/auth/verify-code", func(w http.ResponseWriter, r *http.Request) {
		var req struct {
			Email string `json:"email"`
			Code  string `json:"code"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.Email == "" || req.Code == "" {
			http.Error(w, "E-mail e código são obrigatórios", http.StatusBadRequest)
			return
		}

		coll := db.Collection("email_verifications")
		var v models.EmailVerification
		err := coll.FindOne(r.Context(), bson.M{"email": req.Email}).Decode(&v)
		if err != nil {
			http.Error(w, "Nenhum código pendente encontrado para este e-mail", http.StatusBadRequest)
			return
		}

		// Checa se o código expirou (15 min)
		if time.Now().After(v.ExpiresAt) {
			coll.DeleteOne(r.Context(), bson.M{"email": req.Email})
			http.Error(w, "O código de verificação expirou. Solicite um novo código.", http.StatusUnauthorized)
			return
		}

		// Limite de tentativas contra ataques de força bruta
		if v.Attempts >= 5 {
			coll.DeleteOne(r.Context(), bson.M{"email": req.Email})
			http.Error(w, "Número máximo de tentativas excedido. Solicite um novo código.", http.StatusTooManyRequests)
			return
		}

		// Compara o código de segurança
		if v.Code != req.Code {
			coll.UpdateOne(r.Context(), bson.M{"email": req.Email}, bson.M{"$inc": bson.M{"attempts": 1}})
			http.Error(w, "Código de verificação incorreto", http.StatusUnauthorized)
			return
		}

		// Sucesso: atualiza status do usuário e remove o registro temporário
		usersColl := db.Collection("users")
		usersColl.UpdateOne(r.Context(), bson.M{"email": req.Email}, bson.M{"$set": bson.M{"is_email_verified": true}})
		coll.DeleteOne(r.Context(), bson.M{"email": req.Email})

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]string{
			"message": "E-mail verificado com sucesso!",
		})
	})

	listenAddr := ":8085"

	log.Printf("Serviço PlatOne iniciado com sucesso na porta %s", listenAddr)
	log.Fatal(http.ListenAndServe(listenAddr, corsMiddleware(mux)))
}
