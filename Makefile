SHELL := /bin/bash
MAKEFLAGS += --no-print-directory



# ===============================
#   TRANSCENDANCE MAKEFILE (COLOR)
# ===============================

COMPOSE_FILE = srcs/docker-compose.yml

# Couleurs ANSI
RESET=\033[0m
BOLD=\033[1m
DIM=\033[2m
RED=\033[31m
GREEN=\033[32m
YELLOW=\033[33m
BLUE=\033[34m
MAGENTA=\033[35m
CYAN=\033[36m
WHITE=\033[37m

# Spinner function
define spinner
	echo -n "⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏"
	sleep 1
	echo -n "\b\b\b\b\b\b\b\b\b\b          \b\b\b\b\b\b\b\b\b\b"
endef

.PHONY: menu dev up down build logs ps install clean reset-db kill-ports help full-clean
.DEFAULT_GOAL := menu

menu:
	@clear || true
	@while true; do \
		echo -e ""; \
		echo -e "$(CYAN)$(BOLD)╔═════════════════════════════════════════════════════════════════╗$(RESET)"; \
		echo -e "$(CYAN)$(BOLD)║                  🚀 $(MAGENTA)TRANSCENDANCE DEV MENU$(CYAN) 🚀                   ║$(RESET)"; \
		echo -e "$(CYAN)$(BOLD)╠═════════════════════════════════════════════════════════════════╣$(RESET)"; \
		echo -e "$(CYAN)$(BOLD)║$(RESET)   $(GREEN)1.$(RESET) $(BOLD)Lancer l'application (dev)$(RESET)                                 $(CYAN)║$(RESET)"; \
		echo -e "$(CYAN)$(BOLD)║$(RESET)   $(YELLOW)2.$(RESET) Installer les dépendances                                  $(CYAN)║$(RESET)"; \
		echo -e "$(CYAN)$(BOLD)║$(RESET)   $(BLUE)3.$(RESET) Nettoyer le projet (clean)                                 $(CYAN)║$(RESET)"; \
		echo -e "$(CYAN)$(BOLD)║$(RESET)   $(RED)4.$(RESET) Reset DB (docker volumes)                                  $(CYAN)║$(RESET)"; \
		echo -e "$(CYAN)$(BOLD)║$(RESET)   $(MAGENTA)5.$(RESET) Afficher les logs                                          $(CYAN)║$(RESET)"; \
		echo -e "$(CYAN)$(BOLD)║$(RESET)   $(WHITE)6.$(RESET) Nettoyage complet                                          $(CYAN)║$(RESET)"; \
		echo -e "$(CYAN)$(BOLD)║$(RESET)   $(WHITE)0.$(RESET) Quitter                                                    $(CYAN)║$(RESET)"; \
		echo -e "$(CYAN)$(BOLD)╚═════════════════════════════════════════════════════════════════╝$(RESET)"; \
		echo -e ""; \
		printf "$(BOLD)Votre choix: $(RESET)"; read choice; \
		case $$choice in \
			1) make dev ;; \
			2) make install ;; \
			3) make clean ;; \
			4) make reset-db ;; \
			5) make logs ;; \
			6) make full-clean ;; \
			0) echo -e "$(GREEN)$(BOLD)Au revoir !$(RESET)"; exit 0 ;; \
			*) echo -e "$(RED)❌ Choix invalide !$(RESET)"; sleep 1 ;; \
		esac; \
	done

dev:
	@echo -e "$(BLUE)🚀 Starting dev environment with Docker...$(RESET)"
	@$(MAKE) up


up:
	@echo -e "$(BLUE)🔧 Building and starting containers...$(RESET)"
	@echo -n "$(CYAN)⏳ Processing$(RESET) "
	@$(call spinner)
	@docker compose -f $(COMPOSE_FILE) up --build --detach > .compose.log 2>&1 \
		&& echo -e "$(GREEN)✅ Containers are up!$(RESET)" \
		|| (echo -e "$(RED)❌ Docker-compose failed. See .compose.log for details.$(RESET)" && tail -n 30 .compose.log)

down:
	docker compose -f $(COMPOSE_FILE) down --volumes --remove-orphans


build:
	@echo -e "$(BLUE)🔨 Building docker images...$(RESET)"
	@echo -n "$(CYAN)⏳ Building$(RESET) "
	@$(call spinner)
	@docker compose -f $(COMPOSE_FILE) build --no-cache > .compose.log 2>&1 \
		&& echo -e "$(GREEN)✅ Build complete.$(RESET)" \
		|| (echo -e "$(RED)❌ Build failed. See .compose.log for details.$(RESET)" && tail -n 30 .compose.log)

logs:
	docker compose -f $(COMPOSE_FILE) logs -f --tail=200

ps:
	docker compose -f $(COMPOSE_FILE) ps

install:
	@echo -e "$(YELLOW)📦 Installing frontend and backend dependencies...$(RESET)"
	@echo -n "$(CYAN)⏳ Installing$(RESET) "
	@$(call spinner)
	@cd srcs/requierements/frontend && npm ci --silent || true
	@cd srcs/services/user-service && npm ci --silent || true
	@cd srcs/services/auth-service && npm ci --silent || true
	@echo -e "$(GREEN)✅ Installation complete.$(RESET)"

clean:
	@echo -e "$(BLUE)🧹 Cleaning build artifacts and node_modules...$(RESET)"
	@echo -n "$(CYAN)⏳ Cleaning$(RESET) "
	@$(call spinner)
	@rm -rf srcs/requierements/frontend/dist srcs/services/*/dist || true
	@rm -rf srcs/requierements/frontend/node_modules srcs/services/*/node_modules || true
	@echo -e "$(GREEN)✅ Clean complete.$(RESET)"

kill-ports:
	@echo "$(RED)🔪 Freeing ports 3000, 3001, 3002 (if in use)...$(RESET)"
	@if command -v lsof >/dev/null 2>&1; then \
		lsof -ti:3000 | xargs -r kill -9 || true; \
		lsof -ti:3001 | xargs -r kill -9 || true; \
		lsof -ti:3002 | xargs -r kill -9 || true; \
	else \
		powershell -Command "Get-NetTCPConnection -LocalPort 3000,3001,3002 -ErrorAction SilentlyContinue | ForEach-Object { Try { Stop-Process -Id $_.OwningProcess -Force } Catch { } }" || true; \
	fi
	@echo "$(GREEN)✅ Ports freed.$(RESET)"

reset-db:
	@echo -e "$(RED)💥 Resetting database (removing docker volumes)...$(RESET)"
	@echo -n "$(CYAN)⏳ Resetting$(RESET) "
	@$(call spinner)
	@docker compose -f $(COMPOSE_FILE) down --volumes --remove-orphans
	@echo -e "$(GREEN)✅ Database reset.$(RESET)"

full-clean:
	@echo -e "$(RED)🗑️  Performing full cleanup (containers, images, volumes, networks)...$(RESET)"
	@echo -n "$(CYAN)⏳ Cleaning$(RESET) "
	@$(call spinner)
	@docker compose -f $(COMPOSE_FILE) down --volumes --remove-orphans --rmi all || true
	@docker system prune -f || true
	@rm -rf .compose.log || true
	@echo -e "$(GREEN)✅ Full cleanup complete.$(RESET)"

help:
	@echo ""
	@echo "make menu        # Menu interactif (défaut)"
	@echo "make dev         # Lancer l'app (docker-compose up)"
	@echo "make up          # docker-compose up -d"
	@echo "make down        # docker-compose down"
	@echo "make build       # docker-compose build"
	@echo "make logs        # docker-compose logs -f"
	@echo "make ps          # docker-compose ps"
	@echo "make install     # npm install partout"
	@echo "make clean       # Supprimer node_modules et dist"
	@echo "make reset-db    # Supprimer volumes docker"
	@echo "make full-clean  # Nettoyage complet (images, volumes, etc.)"
	@echo "make kill-ports  # Libérer ports 3000/3001/3002"
	@echo "make help        # Ce message"
