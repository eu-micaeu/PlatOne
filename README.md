# PlatOne

Projeto com frontend React/Vite e backend Go.

## Estrutura

- `frontend/`: aplicação React + Vite + servidor Node de desenvolvimento (`server.ts`)
- `backend/`: código Go
- `deployments/docker-compose.yml`: ambiente Docker Compose para desenvolvimento

## Desenvolvimento com Docker (hot reload)

Pré-requisito: Docker + Docker Compose.

1. Suba o ambiente:

   ```bash
   docker compose -f deployments/docker-compose.yml up --build
   ```

2. Acesse no navegador:

   ```
   http://localhost:3000
   ```

As alterações em arquivos dentro de `frontend/` são refletidas automaticamente (modo desenvolvedor).

## Desenvolvimento sem Docker

1. Entre na pasta do frontend:

   ```bash
   cd frontend
   ```

2. Instale as dependências:

   ```bash
   npm install
   ```

3. Rode em modo dev:

   ```bash
   npm run dev
   ```
