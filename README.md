# PlatOne

Plataforma para acompanhar progresso de conquistas em jogos, com foco em visibilidade de evolucao, sincronizacao com Steam e compartilhamento de perfil publico.

## O que e o PlatOne

O PlatOne organiza a jornada de conquistas de cada jogador em um unico painel:

- Visao consolidada de jogos, progresso e platinas.
- Timeline de atividades recentes por jogo.
- Detalhamento de conquistas desbloqueadas e pendentes.
- Perfil publico para compartilhar desempenho com outras pessoas.

Em vez de um tracker estatico, o objetivo e oferecer uma camada de identidade gamer com dados sincronizados da plataforma conectada.

## Principais recursos

### Conta e sessao

- Cadastro e login com sessao por token.
- Sessao persistente para retorno rapido ao dashboard.
- Area de configuracoes para gerenciamento da conta.

### Integracao Steam

- Conexao de conta via fluxo OpenID.
- Vinculo de SteamID ao usuario autenticado.
- Sincronizacao das conquistas para atualizacao de estatisticas e status dos jogos.

### Dashboard de progresso

- Cards de estatisticas (platinas, total de jogos, recorte mensal).
- Filtros por status e plataforma.
- Visualizacao em grade ou lista.
- Abertura de detalhes por jogo com progresso de conquistas.

### Perfil publico

- Pagina publica por nome de perfil.
- Exibicao de estatisticas e biblioteca sincronizada.
- Consulta publica das conquistas de um jogo desse perfil.

## Como a plataforma funciona

1. O usuario cria conta e autentica no PlatOne.
2. O usuario conecta a conta Steam pelo fluxo OpenID.
3. O sistema armazena o SteamID vinculado ao usuario.
4. Uma sincronizacao consulta biblioteca e conquistas na Steam.
5. O backend calcula progresso e status de platina por jogo.
6. O frontend apresenta os dados no dashboard e no perfil publico.

## Arquitetura da plataforma

- Frontend React/Vite: experiencia de uso, dashboard, perfil, autenticacao e configuracoes.
- Servidor Node (BFF): autentica usuarios, gerencia sessoes e orquestra chamadas para o backend Go.
- Backend Go: integra com Steam Web API, processa conquistas e persiste dados consolidados.
- MongoDB: armazenamento de usuarios, sessoes, estados OpenID e registros de progresso.

## Endpoints de produto (visao funcional)

### Identidade e conta

- `POST /api/auth/register`: cria conta.
- `POST /api/auth/login`: inicia sessao.
- `GET /api/auth/me`: retorna usuario autenticado.
- `POST /api/auth/logout`: encerra sessao.
- `DELETE /api/auth/account`: remove conta do usuario.

### Steam

- `POST /api/steam/connect`: inicia conexao OpenID.
- `GET /api/steam/callback`: finaliza vinculo Steam apos retorno da Steam.
- `GET /api/steam/status`: informa estado de conexao da Steam.
- `POST /api/steam/disconnect`: remove o vinculo Steam.
- `POST /api/sync/me`: sincroniza conquistas do usuario conectado.

### Dados de progresso

- `GET /api/platinums`: lista jogos sincronizados e progresso.
- `GET /api/stats`: retorna metricas gerais.
- `GET /api/games/:gameId/achievements`: detalha conquistas do jogo do usuario autenticado.

### Perfil publico

- `GET /api/public/profile/:profileName`: perfil, stats e biblioteca publica.
- `GET /api/public/profile/:profileName/games/:gameId/achievements`: conquistas de jogo no perfil publico.

## Escopo atual

- Fonte principal de sincronizacao: Steam.
- Estrutura pensada para expansao futura para outras plataformas (ex.: Xbox e PSN).
- Se perfil/conquistas da Steam estiverem privados, a API pode nao retornar dados suficientes para sincronizacao completa.

## Docker Compose

### Desenvolvimento

- Suba o ambiente com hot reload usando `docker compose -f docker-compose.dev.yml up --build`.
- O frontend fica disponivel em `http://localhost:${FRONTEND_PORT}` e o backend em `http://localhost:${BACKEND_PORT}`.
- O MongoDB fica exposto localmente na porta `27017` por padrao.

### Producao

- Gere e suba as imagens com `docker compose -f docker-compose.prod.yml up -d --build`.
- Nesse modo o frontend roda em `NODE_ENV=production`, serve o bundle de `dist` e conversa internamente com o backend.
- O backend nao e publicado externamente no compose de producao; o acesso esperado e via frontend/BFF.
- Antes de subir em producao, ajuste pelo menos `APP_BASE_URL`, `STEAM_API_KEY`, `DATABASE_URL` e as portas no arquivo `.env`.
