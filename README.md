<div align="center">
  <img src="./frontend/react/public/Logo - Preto.svg" alt="PlatOne Logo" width="120" />
</div>

# PlatOne

[![CI - Test Automation](https://github.com/micael/PlatOne/actions/workflows/test.yml/badge.svg)](https://github.com/micael/PlatOne/actions/workflows/test.yml)
[![CD - Deploy Automation](https://github.com/micael/PlatOne/actions/workflows/deploy.yml/badge.svg)](https://github.com/micael/PlatOne/actions/workflows/deploy.yml)

A platform for tracking progress and achievements in games, focusing on visibility of progress, synchronization with Steam, and public profile sharing.

## What is PlatOne?

PlatOne organizes each player's achievement journey into a single dashboard:

- Consolidated overview of games, progress, and platinum trophies.
- Timeline of recent activities per game.
- Detailed breakdown of unlocked and pending achievements.
- Public profile to share performance with others.

Instead of a static tracker, the goal is to offer a gamer identity layer with synchronized data from the connected platform.

## 🚀 Ambientes & Instâncias MongoDB (Dev & Prod)

O PlatOne utiliza instâncias isoladas do MongoDB para Desenvolvimento e Produção:

- **Desenvolvimento** (`platone_dev`): Porta `27017`, volume `mongodb_data_dev`.
- **Produção** (`platone_prod`): Porta `27018`, volume `mongodb_data_prod`.

### Comandos do Makefile

```bash
# Modo Desenvolvimento
make up-dev       # Inicia containers dev (MongoDB Dev + Backend + Frontend)
make down-dev     # Para containers dev
make restart-dev  # Reinicia ambiente dev

# Modo Produção
make up-prod      # Builda e inicia containers prod (MongoDB Prod + Backend + Frontend)
make down-prod    # Para containers prod
make restart-prod # Reinicia ambiente prod

# Executar testes
make tests        # Executa testes unitários do backend Go
```

## ⚙️ CI/CD Pipeline (Padrão SpeakUp)

1. **[CI - Test Automation](file:///.github/workflows/test.yml)** (`.github/workflows/test.yml`):
   - Executa em todos os `push` e `pull_request` para a branch `main`.
   - Executa os testes automatizados do backend Go com verificação de cobertura (`go test ./... -v -coverprofile=coverage.out`).

2. **[CD - Deploy Automation](file:///.github/workflows/deploy.yml)** (`.github/workflows/deploy.yml`):
   - Executado automaticamente após a conclusão com sucesso do pipeline de testes na branch `main`.
   - Roda em um runner **`self-hosted`**.
   - Realiza a limpeza de arquivos do root, sincronização com o repositório (`git pull origin main`) e o deploy automatizado dos containers via `docker compose -f docker-compose.prod.yml up -d --build`.


