# Subir a aplicação em modo Desenvolvimento
up-dev:
	docker compose -f docker-compose.dev.yml up -d

# Apagar a aplicação de Desenvolvimento
down-dev:
	docker compose -f docker-compose.dev.yml down

# Restartar ambiente de Desenvolvimento
restart-dev: down-dev up-dev

# Subir a aplicação em modo Produção
up-prod:
	docker compose -f docker-compose.prod.yml up -d --build

# Apagar a aplicação de Produção
down-prod:
	docker compose -f docker-compose.prod.yml down

# Restartar ambiente de Produção
restart-prod: down-prod up-prod

# Rodar os testes com cobertura
tests:
	@echo "🔍 Rodando testes do backend com cobertura..."
	cd backend/go && go test ./... -cover
