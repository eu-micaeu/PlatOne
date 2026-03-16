# PlatOne

Projeto com frontend React/Vite e backend Go.

## Integracao Steam (OpenID + Sync)

Para sincronizar conquistas Steam por usuario:

1. Defina a chave da Steam Web API no ambiente do backend:

   ```bash
   export STEAM_API_KEY="sua_chave"
   ```

2. Suba os servicos com Docker Compose.

3. No app logado, use os endpoints:

   - `POST /api/steam/connect` inicia o fluxo OpenID e retorna URL de login Steam.
   - `GET /api/steam/callback` recebe o retorno da Steam e vincula o `steamId` ao usuario.
   - `GET /api/steam/status` mostra se o usuario atual esta com Steam conectada.
   - `POST /api/steam/disconnect` remove o vinculo Steam.
   - `POST /api/sync/me` sincroniza conquistas usando o `steamId` vinculado.

Observacoes:

- O backend Go continua expondo `POST /api/sync/{userID}` e agora espera um SteamID64.
- Se o perfil/conquistas da Steam estiverem privados, a API pode nao retornar dados.

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
