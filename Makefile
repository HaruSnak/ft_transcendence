SHELL :		echo -e "$(CYAN)$(BOLD)║$(RESET)   $(GREEN)1.$(RESET) $(BOLD)Lancer l'application (dev)$(RESET)                                 $(CYAN)║$(RESET)"; \
		echo -e "$(CYAN)$(BOLD)║$(RESEfull-clean:
	@echo "$(RED)🗑️  Performing full cleanup (containers, images, volumes, networks, and local artifacts)...$(RESET)"
	@echo -n "$(CYAN)⏳ Cleaning$(RESET) "
	@$(call spinner)
	@echo ""
	@echo "$(CYAN)  → Removing local artifacts...$(RESET)"
	@echo "    Removing frontend dist and node_modules..."
	@rm -rf srcs/requierements/frontend/dist || true
	@rm -rf srcs/requierements/frontend/node_modules || true
	@echo "    Removing chat-service artifacts..."
	@rm -rf srcs/requierements/services/chat-service/node_modules || true
	@rm -rf srcs/requierements/services/chat-service/node_module || true
	@rm -rf srcs/requierements/services/chat-service/dist || true
	@echo "    Removing game-service artifacts..."
	@rm -rf srcs/requierements/services/game-service/node_modules || true
	@rm -rf srcs/requierements/services/game-service/node_module || true
	@rm -rf srcs/requierements/services/game-service/dist || true
	@echo "    Removing user-service artifacts..."
	@rm -rf srcs/requierements/services/user-service/node_modules || true
	@rm -rf srcs/requierements/services/user-service/node_module || true
	@rm -rf srcs/requierements/services/user-service/dist || true
	@echo "    Removing auth-service artifacts..."
	@rm -rf srcs/requierements/services/auth-service/node_modules || true
	@rm -rf srcs/requierements/services/auth-service/node_module || true
	@rm -rf srcs/requierements/services/auth-service/dist || true
	@echo "$(CYAN)  → Cleaning Docker...$(RESET)"
	@docker compose -f $(COMPOSE_FILE) down --volumes --remove-orphans --rmi all || true
	@docker system prune -f > /dev/null 2>&1 || true
	@rm -rf .compose.log || true
	@echo "$(GREEN)✅ Full cleanup complete.$(RESET)"ELLOW)2.$(RESET) Installer les dépendances                                  $(CYAN)║$(RESET)"; \
		echo -e "$(CYAN)$(BOLD)║$(RESET)   $(BLUE)3.$(RESET) Construire les images Docker                                 $(CYAN)║$(RESET)"; \
		echo -e "$(CYAN)$(BOLD)║$(RESET)   $(RED)4.$(RESET) Nettoyer complètement                                     $(CYAN)║$(RESET)"; \
		echo -e "$(CYAN)$(BOLD)║$(RESET)   $(MAGENTA)5.$(RESET) Reset DB (docker volumes)                                  $(CYAN)║$(RESET)"; \
		echo -e "$(CYAN)$(BOLD)║$(RESET)   $(WHITE)6.$(RESET) Afficher les logs                                          $(CYAN)║$(RESET)"; \
		echo -e "$(CYAN)$(BOLD)║$(RESET)   $(WHITE)7.$(RESET) Nettoyer Docker                                               $(CYAN)║$(RESET)"; \
		echo -e "$(CYAN)$(BOLD)║$(RESET)   $(WHITE)0.$(RESET) Quitter                                                    $(CYAN)║$(RESET)"; \
		echo -e "$(CYAN)$(BOLD)║$(RESET)   $(WHITE)8.$(RESET) Construire les images Docker                                 $(CYAN)║$(RESET)"; \
		echo -e "$(CYAN)$(BOLD)║$(RESET)   $(WHITE)0.$(RESET) Quitter                                                    $(CYAN)║$(RESET)"; \/bin/bash
MAKEFLAGS += --no-print-directory



# ========================		echo -e "$(CYAN)$(BOLD)║$(RESET)   $(MAGENTA)5.$(RESET) Afficher les logs                                               $(CYAN)║$(RESET)"; \
		echo -e "$(CYAN)$(BOLD)║$(RESET)   $(WHITE)6.$(RESET) Nettoyage complet                                               $(CYAN)║$(RESET)"; \
		echo -e "$(CYAN)$(BOLD)║$(RESET)   $(WHITE)7.$(RESET) Nettoyer Docker                                                $(CYAN)║$(RESET)"; \
		echo -e "$(CYAN)$(BOLD)║$(RESET)   $(WHITE)0.$(RESET) Quitter                                                         $(CYAN)║$(RESET)"; \====
#   TRANSCENDANCE MAKEFILE (COLOR)
# ===============================

# ===============================

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
	for i in 1 2 3 4; do \
		case $$i in \
			1) printf "$(CYAN) | $(RESET)\b\b\b" ;; \
			2) printf "$(CYAN) / $(RESET)\b\b\b" ;; \
			3) printf "$(CYAN) - $(RESET)\b\b\b" ;; \
			4) printf "$(CYAN) \\ $(RESET)\b\b\b" ;; \
		esac; \
		sleep 0.2; \
	done
endef

.PHONY: menu dev build install full-clean reset-db
.DEFAULT_GOAL := menu

menu:
	@clear || true
	@while true; do \
		echo ""; \
		echo "$(CYAN)$(BOLD)╔═════════════════════════════════════════════════════════════════╗$(RESET)"; \
		echo "$(CYAN)$(BOLD)║                  🚀 $(MAGENTA)TRANSCENDANCE DEV MENU$(CYAN) 🚀                   ║$(RESET)"; \
		echo "$(CYAN)$(BOLD)╠═════════════════════════════════════════════════════════════════╣$(RESET)"; \
		echo "$(CYAN)$(BOLD)║$(RESET)   $(GREEN)1.$(BOLD) Lancer l'application (dev)$(RESET)                                 $(CYAN)║$(RESET)"; \
		echo "$(CYAN)$(BOLD)║$(RESET)   $(YELLOW)2.$(BOLD) Installer les dépendances (npm)$(RESET)                            $(CYAN)║$(RESET)"; \
		echo "$(CYAN)$(BOLD)║$(RESET)   $(BLUE)3.$(BOLD) Construire les images Docker                               $(CYAN)║$(RESET)"; \
		echo "$(CYAN)$(BOLD)║$(RESET)   $(RED)4.$(BOLD) Nettoyer complètement                                      $(CYAN)║$(RESET)"; \
		echo "$(CYAN)$(BOLD)║$(RESET)   $(MAGENTA)5.$(BOLD) Reset DB (docker volumes)                                  $(CYAN)║$(RESET)"; \
		echo "$(CYAN)$(BOLD)║$(RESET)   $(WHITE)0.$(BOLD) Quitter                                                    $(CYAN)║$(RESET)"; \
		echo "$(CYAN)$(BOLD)╚═════════════════════════════════════════════════════════════════╝$(RESET)"; \
		echo ""; \
		printf "$(BOLD)Votre choix: $(RESET)"; read choice; \
		case $$choice in \
			1) make dev ;; \
			2) make install ;; \
			3) make build ;; \
			4) make full-clean ;; \
			5) make reset-db ;; \
			0) echo "$(GREEN)$(BOLD)Au revoir !$(RESET)"; exit 0 ;; \
			*) echo "$(RED)❌ Choix invalide !$(RESET)"; sleep 1 ;; \
		esac; \
	done

dev:
	@echo "$(BLUE)🚀 Starting dev environment with Docker...$(RESET)"
	@$(MAKE) up


up:
	@echo "$(BLUE)🔧 Building and starting containers...$(RESET)"
	@echo -n "$(CYAN)⏳ Processing$(RESET) "
	@$(call spinner)
	@docker compose -f $(COMPOSE_FILE) up --build --detach > .compose.log 2>&1 \
		&& echo "$(GREEN)✅ Containers are up!$(RESET)" \
		|| (echo "$(RED)❌ Docker-compose failed. See .compose.log for details.$(RESET)" && tail -n 30 .compose.log)

build:

down:
	docker compose -f $(COMPOSE_FILE) down --volumes --remove-orphans


build:
	@echo "$(BLUE)🔨 Building docker images...$(RESET)"
	@trap 'kill 0' INT; \
	for service in chat-service game-service user-service auth-service nginx elasticsearch logstash; do \
		echo "$(CYAN)  → Building $$service...$(RESET)"; \
		( while true; do $(call spinner); done ) & SPINNER_PID=$$! ; \
		docker compose -f $(COMPOSE_FILE) build $$service --no-cache > /dev/null 2>&1 ; \
		kill $$SPINNER_PID 2>/dev/null ; printf "\b\b\b   \b\b\b" ; \
		if [ $$? -eq 0 ]; then echo "$(GREEN)✅ $$service built$(RESET)"; else echo "$(RED)❌ $$service failed$(RESET)"; fi ; \
	done
	@echo "$(GREEN)✅ All builds complete.$(RESET)"

install:
	@echo "$(YELLOW)📦 Installing frontend and backend dependencies...$(RESET)"
	@echo "$(CYAN)  → Installing frontend...$(RESET)"
	@cd srcs/requierements/frontend && npm ci --silent || true
	@echo "$(CYAN)  → Installing user-service...$(RESET)"
	@cd srcs/requierements/services/user-service && npm ci --silent || true
	@echo "$(CYAN)  → Installing auth-service...$(RESET)"
	@cd srcs/requierements/services/auth-service && npm ci --silent || true
	@echo "$(CYAN)  → Installing chat-service...$(RESET)"
	@cd srcs/requierements/services/chat-service && npm ci --silent || true
	@echo "$(CYAN)  → Installing game-service...$(RESET)"
	@cd srcs/requierements/services/game-service && npm ci --silent || true
	@echo "$(GREEN)✅ Installation complete.$(RESET)"

reset-db:
	@echo "$(RED)💥 Resetting database (removing docker volumes)...$(RESET)"
	@echo -n "$(CYAN)⏳ Resetting$(RESET) "
	@$(call spinner)
	@docker compose -f $(COMPOSE_FILE) down --volumes --remove-orphans
	@echo "$(GREEN)✅ Database reset.$(RESET)"

full-clean:
	@echo "$(RED)🗑️  Performing full cleanup (containers, images, volumes, networks, deps)...$(RESET)"
	@echo -n "$(CYAN)⏳ Cleaning$(RESET) "
	@$(call spinner)
	@docker compose -f $(COMPOSE_FILE) down --volumes --remove-orphans --rmi all > /dev/null 2>&1 || true
	@RECLAIMED=$$(docker system prune -f 2>&1 | grep "Total reclaimed" || echo "No space reclaimed"); \
	echo "$(CYAN)  → $$RECLAIMED$(RESET)"
	@rm -rf .compose.log || true
	@echo "$(CYAN)  → Removing frontend node_modules and dist...$(RESET)"
	@rm -rf srcs/requierements/frontend/node_modules || true
	@rm -rf srcs/requierements/frontend/dist || true
	@echo "$(CYAN)  → Removing services node_modules and dist...$(RESET)"
	@find srcs/requierements/services -name "node_modules" -type d -exec rm -rf {} \; 2>/dev/null || true
	@find srcs/requierements/services -name "dist" -type d -exec rm -rf {} \; 2>/dev/null || true
	@echo "$(GREEN)✅ Full cleanup complete.$(RESET)"
