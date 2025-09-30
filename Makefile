# ═══════════════════════════════════════════════════════════════════════════════
#                           🚀 TRANSCENDANCE MAKEFILE 🚀
# ═══════════════════════════════════════════════════════════════════════════════

MAKEFLAGS += --no-print-directory

# ┌─────────────────────────────────────────────────────────────────────────────┐
# │                            🎨 COULEURS & STYLES                             │
# └─────────────────────────────────────────────────────────────────────────────┘
BOLD = \033[1m
DIM = \033[2m
RESET = \033[0m
RED = \033[31m
GREEN = \033[32m
YELLOW = \033[33m
BLUE = \033[34m
MAGENTA = \033[35m
CYAN = \033[36m
WHITE = \033[37m

# ┌─────────────────────────────────────────────────────────────────────────────┐
# │                         ⚙️ COMMANDES CROSS-PLATFORM                        │
# └─────────────────────────────────────────────────────────────────────────────┘
ifeq ($(OS),Windows_NT)
    RM = rmdir /S /Q
    KILL_NODE = taskkill /F /IM node.exe >nul 2>&1 || true
    KILL_3001 = taskkill /F /PID $(shell netstat -ano | findstr :3001 | findstr LISTENING | head -1 | awk '{print $$5}') >nul 2>&1 || true
    KILL_3002 = taskkill /F /PID $(shell netstat -ano | findstr :3002 | findstr LISTENING | head -1 | awk '{print $$5}') >nul 2>&1 || true
    KILL_3003 = taskkill /F /PID $(shell netstat -ano | findstr :3003 | findstr LISTENING | head -1 | awk '{print $$5}') >nul 2>&1 || true
    KILL_3004 = taskkill /F /PID $(shell netstat -ano | findstr :3004 | findstr LISTENING | head -1 | awk '{print $$5}') >nul 2>&1 || true
    KILL_8081 = taskkill /F /PID $(shell netstat -ano | findstr :8081 | findstr LISTENING | head -1 | awk '{print $$5}') >nul 2>&1 || true
else
    RM = rm -rf
    KILL_NODE = pkill -f node > /dev/null 2>&1 || true
    KILL_3001 = bash -c 'pids=$$(lsof -ti:3001 2>/dev/null); if [ -n "$$pids" ]; then echo "$$pids" | xargs kill -9 2>/dev/null; fi' 2>/dev/null
    KILL_3002 = bash -c 'pids=$$(lsof -ti:3002 2>/dev/null); if [ -n "$$pids" ]; then echo "$$pids" | xargs kill -9 2>/dev/null; fi' 2>/dev/null
    KILL_3003 = bash -c 'pids=$$(lsof -ti:3003 2>/dev/null); if [ -n "$$pids" ]; then echo "$$pids" | xargs kill -9 2>/dev/null; fi' 2>/dev/null
    KILL_3004 = bash -c 'pids=$$(lsof -ti:3004 2>/dev/null); if [ -n "$$pids" ]; then echo "$$pids" | xargs kill -9 2>/dev/null; fi' 2>/dev/null
    KILL_8081 = bash -c 'pids=$$(lsof -ti:8081 2>/dev/null); if [ -n "$$pids" ]; then echo "$$pids" | xargs kill -9 2>/dev/null; fi' 2>/dev/null
endif

.SILENT:
.DEFAULT_GOAL := menu

# ═══════════════════════════════════════════════════════════════════════════════
#                            🎯 MENU INTERACTIF
# ═══════════════════════════════════════════════════════════════════════════════

menu:
	@echo ""
	@echo "$(CYAN)$(BOLD) ╔════════════════════════════════════════════════════════════╗$(RESET)"
	@echo "$(CYAN)$(BOLD) ║                    🚀 TRANSCENDANCE                        ║$(RESET)"
	@echo "$(CYAN)$(BOLD) ╠════════════════════════════════════════════════════════════╣$(RESET)"
	@echo "$(CYAN)$(BOLD) ║                                                            ║$(RESET)"
	@echo "$(CYAN) ║$(WHITE)  $(BOLD)1.$(RESET) $(GREEN)Lancer l'application$(RESET)                                   $(CYAN)║$(RESET)"
	@echo "$(CYAN) ║$(WHITE)  $(BOLD)2.$(RESET) $(YELLOW)Installer les dépendances$(RESET)                              $(CYAN)║$(RESET)"
	@echo "$(CYAN) ║$(WHITE)  $(BOLD)3.$(RESET) $(RED)Arrêter les services$(RESET)                                   $(CYAN)║$(RESET)"
	@echo "$(CYAN) ║$(WHITE)  $(BOLD)4.$(RESET) $(RED)Nettoyer le projet$(RESET)                                     $(CYAN)║$(RESET)"
	@echo "$(CYAN) ║$(WHITE)  $(BOLD)5.$(RESET) $(MAGENTA)Nettoyer les ports$(RESET)                                     $(CYAN)║$(RESET)"
	@echo "$(CYAN) ║$(WHITE)  $(BOLD)6.$(RESET) $(BLUE)Vérifier les ports$(RESET)                                     $(CYAN)║$(RESET)"
	@echo "$(CYAN) ║$(WHITE)  $(BOLD)7.$(RESET) $(BLUE)Construire le frontend$(RESET)                                 $(CYAN)║$(RESET)"
	@echo "$(CYAN) ║$(WHITE)  $(BOLD)0.$(RESET) $(DIM)Quitter$(RESET)                                                $(CYAN)║$(RESET)"
	@echo "$(CYAN)$(BOLD) ║                                                            ║$(RESET)"
	@echo "$(CYAN)$(BOLD) ╠════════════════════════════════════════════════════════════╣$(RESET)"
	@echo "$(CYAN) ║$(WHITE)  $(DIM)Auth: http://localhost:3004$(RESET)                               $(CYAN)║$(RESET)"
	@echo "$(CYAN) ║$(WHITE)  $(DIM)Chat: http://localhost:3001$(RESET)                               $(CYAN)║$(RESET)"
	@echo "$(CYAN) ║$(WHITE)  $(DIM)Game: http://localhost:3002$(RESET)                               $(CYAN)║$(RESET)"
	@echo "$(CYAN) ║$(WHITE)  $(DIM)User: http://localhost:3003$(RESET)                               $(CYAN)║$(RESET)"
	@echo "$(CYAN) ║$(WHITE)  $(DIM)Frontend: http://localhost:8081$(RESET)                           $(CYAN)║$(RESET)"
	@echo "$(CYAN)$(BOLD) ╚════════════════════════════════════════════════════════════╝$(RESET)"
	@echo ""
	@while true; do \
		read -p "Votre choix: " choice; \
		case $$choice in \
			1) echo ""; make run; break ;; \
			2) echo ""; make install; echo "Appuyez sur Entrée pour revenir au menu..."; read dummy; make menu; break ;; \
			3) echo ""; make stop-services; echo "Appuyez sur Entrée pour revenir au menu..."; read dummy; make menu; break ;; \
			4) echo ""; make clean; echo "Appuyez sur Entrée pour revenir au menu..."; read dummy; make menu; break ;; \
			5) echo ""; make clean-ports; echo "Appuyez sur Entrée pour revenir au menu..."; read dummy; make menu; break ;; \
			6) echo ""; make check-ports; echo "Appuyez sur Entrée pour revenir au menu..."; read dummy; make menu; break ;; \
			7) echo ""; make build-frontend; echo "Appuyez sur Entrée pour revenir au menu..."; read dummy; make menu; break ;; \
			0) echo "$(GREEN)$(BOLD)Au revoir ! 👋$(RESET)"; break ;; \
			*) echo "$(RED)❌ Choix invalide ! Veuillez choisir entre 0-7.$(RESET)"; echo "" ;; \
		esac \
	done

# ═══════════════════════════════════════════════════════════════════════════════
#                            🚀 COMMANDES PRINCIPALES
# ═══════════════════════════════════════════════════════════════════════════════

run:
	@echo ""
	@echo "$(YELLOW)🔍 Vérification des dépendances...$(RESET)"
	@if [ ! -d "srcs/requierements/services/user-service/node_modules" ]; then \
		echo "$(YELLOW)📦 Installation des dépendances manquantes...$(RESET)"; \
		make install > /dev/null 2>&1; \
	fi
	@if [ ! -d "srcs/requierements/frontend/node_modules" ]; then \
		echo "$(YELLOW)📦 Installation des dépendances frontend manquantes...$(RESET)"; \
		cd srcs/requierements/frontend && npm install > /dev/null 2>&1; \
	fi
	@echo "$(BLUE)🏗️ Construction du frontend...$(RESET)"
	@cd srcs/requierements/frontend && npm run build-css > /dev/null 2>&1 && npm run build-ts > /dev/null 2>&1
	@echo ""
	@echo "╔══════════════════════════════════════════════════════════════╗"
	@echo "║                   🎉 APPLICATION LANCÉE ! 🎉                 ║"
	@echo "╚══════════════════════════════════════════════════════════════╝"
	@echo ""
	@bash -c '\
	echo "📡 Démarrage des services..."; \
	# pkill -f node 2>/dev/null || true; \
	cd /mnt/c/Users/Powlar/Desktop/ft_transcendence/srcs/requierements/services/user-service && mkdir -p data && chmod 755 data; \
	cd /mnt/c/Users/Powlar/Desktop/ft_transcendence/srcs/requierements/services/user-service && nohup node srcs/server.js > user-service.log 2>&1 & \
	sleep 3; \
	cd /mnt/c/Users/Powlar/Desktop/ft_transcendence/srcs/requierements/services/auth-service && nohup node srcs/server.js > /dev/null 2>&1 & \
	cd /mnt/c/Users/Powlar/Desktop/ft_transcendence/srcs/requierements/services/chat-service && nohup node srcs/server.js > /dev/null 2>&1 & \
	cd /mnt/c/Users/Powlar/Desktop/ft_transcendence/srcs/requierements/services/game-service && nohup node srcs/server.js > /dev/null 2>&1 & \
	cd /mnt/c/Users/Powlar/Desktop/ft_transcendence/srcs/requierements/frontend && nohup node server.js > /dev/null 2>&1 & \
	sleep 3; \
	cd /mnt/c/Users/Powlar/Desktop/ft_transcendence/srcs/requierements/services/user-service && bash create-user.sh powlar powlar@example.com password "Powlar" 2>/dev/null || true; \
	echo "✅ Services démarrés en arrière-plan"; \
	echo "🌐 Accédez à http://localhost:8081"; \
	echo "⚠️  Utilisez '\''make stop-services'\'' pour arrêter" \
	'

install:
	@echo ""
	@echo "$(YELLOW)$(BOLD) ╔══════════════════════════════════════════════════════════════╗$(RESET)"
	@echo "$(YELLOW)$(BOLD) ║                 📦 INSTALLATION DES DÉPENDANCES 📦           ║$(RESET)"
	@echo "$(YELLOW)$(BOLD) ╚══════════════════════════════════════════════════════════════╝$(RESET)"
	@echo ""
	@echo "$(BLUE)$(BOLD) 🔧 Installation auth-service...$(RESET)"
	@cd srcs/requierements/services/auth-service && npm install >nul 2>&1
	@echo "$(GREEN)$(BOLD) ✅ Auth-service installé$(RESET)"
	@echo "$(BLUE)$(BOLD) 💬 Installation chat-service...$(RESET)"
	@cd srcs/requierements/services/chat-service && npm install >nul 2>&1
	@echo "$(GREEN)$(BOLD) ✅ Chat-service installé$(RESET)"
	@echo "$(BLUE)$(BOLD) 🎮 Installation game-service...$(RESET)"
	@cd srcs/requierements/services/game-service && npm install >nul 2>&1
	@echo "$(GREEN)$(BOLD) ✅ Game-service installé$(RESET)"
	@echo "$(BLUE)$(BOLD) 👤 Installation user-service...$(RESET)"
	@bash -c "sudo apt-get update && sudo apt-get install -y build-essential python3 make g++" >/dev/null 2>&1
	@cd srcs/requierements/services/user-service && npm install >/dev/null 2>&1 && npm rebuild bcrypt >/dev/null 2>&1 && npm rebuild sqlite3 >/dev/null 2>&1
	@echo "$(GREEN)$(BOLD) ✅ User-service installé$(RESET)"
	@echo "$(BLUE)$(BOLD) 🌐 Installation frontend...$(RESET)"
	@cd srcs/requierements/frontend && npm install >nul 2>&1
	@echo "$(GREEN)$(BOLD) ✅ Frontend installé$(RESET)"
	@echo ""
	@echo "$(GREEN)$(BOLD) ╔══════════════════════════════════════════════════════════════╗$(RESET)"
	@echo "$(GREEN)$(BOLD) ║                   🎉 INSTALLATION TERMINÉE ! 🎉              ║$(RESET)"
	@echo "$(GREEN)$(BOLD) ╚══════════════════════════════════════════════════════════════╝$(RESET)"
	@echo ""

build-frontend:
	@echo "$(BLUE)$(BOLD) 🏗️  Construction du frontend...$(RESET)"
	@cd srcs/requierements/frontend && npm run build-css >nul 2>&1 && npm run build-ts >nul 2>&1
	@echo "$(GREEN)$(BOLD) ✅ Frontend construit$(RESET)"

start-services:
	@echo ""
	@echo "$(BLUE)$(BOLD) 📡 Démarrage des services...$(RESET)"
ifeq ($(OS),Windows_NT)
	@start /B cmd /C "cd srcs\requierements\services\auth-service && node srcs/server.js" >nul 2>&1
	@start /B cmd /C "cd srcs\requierements\services\chat-service && node srcs/server.js" >nul 2>&1
	@start /B cmd /C "cd srcs\requierements\services\game-service && node srcs/server.js" >nul 2>&1
	@start /B cmd /C "cd srcs\requierements\services\user-service && node srcs/server.js" >nul 2>&1
	@start /B cmd /C "cd srcs\requierements\frontend && node server.js" >nul 2>&1
else
	@cd srcs/requierements/services/auth-service && nohup node srcs/server.js > /dev/null 2>&1 &
	@cd srcs/requierements/services/chat-service && nohup node srcs/server.js > /dev/null 2>&1 &
	@cd srcs/requierements/services/game-service && nohup node srcs/server.js > /dev/null 2>&1 &
	@cd srcs/requierements/services/user-service && nohup node srcs/server.js > /dev/null 2>&1 &
	@cd srcs/requierements/frontend && nohup node server.js > /dev/null 2>&1 &
endif
	@echo "$(GREEN)$(BOLD) ✅ Services démarrés$(RESET)"
	@echo "$(CYAN)$(BOLD) 🌐 Accédez à http://localhost:8081$(RESET)"

stop-services:
	@echo ""
	@echo "$(RED)$(BOLD) 🛑 Arrêt des services...$(RESET)"
	@$(KILL_3001)
	@$(KILL_3002)
	@$(KILL_3003)
	@$(KILL_3004)
	@$(KILL_8081)
	@$(KILL_NODE)
	@echo "$(GREEN)$(BOLD) ✅ Services arrêtés$(RESET)"
	@echo ""

clean-ports:
	@echo "$(RED)$(BOLD)🧹 Nettoyage des ports de service...$(RESET)"
	@bash -c '\
	pids=$$(lsof -ti:3001 2>/dev/null); if [ -n "$$pids" ]; then echo "$$pids" | xargs kill -9 2>/dev/null; fi;\
	pids=$$(lsof -ti:3002 2>/dev/null); if [ -n "$$pids" ]; then echo "$$pids" | xargs kill -9 2>/dev/null; fi;\
	pids=$$(lsof -ti:3003 2>/dev/null); if [ -n "$$pids" ]; then echo "$$pids" | xargs kill -9 2>/dev/null; fi;\
	pids=$$(lsof -ti:3004 2>/dev/null); if [ -n "$$pids" ]; then echo "$$pids" | xargs kill -9 2>/dev/null; fi;\
	pids=$$(lsof -ti:8081 2>/dev/null); if [ -n "$$pids" ]; then echo "$$pids" | xargs kill -9 2>/dev/null; fi;\
	'
	@echo "$(GREEN)$(BOLD)✅ Ports nettoyés$(RESET)"

check-ports:
	@echo "$(BLUE)$(BOLD)🔍 Vérification de l'état des ports...$(RESET)"
	@echo ""
	@bash -c '\
	check_port() { \
		local port=$$1; \
		local service=$$2; \
		if lsof -i :$$port >/dev/null 2>&1; then \
			echo "❌ Port $$port ($$service) : OCCUPÉ"; \
		else \
			echo "✅ Port $$port ($$service) : LIBRE"; \
		fi; \
	}; \
	check_port 3001 "chat-service"; \
	check_port 3002 "game-service"; \
	check_port 3003 "user-service"; \
	check_port 3004 "auth-service"; \
	check_port 8081 "frontend"; \
	'
	@echo ""

clean:
	@echo "$(RED)$(BOLD) 🧹 Nettoyage violent en cours...$(RESET)"
	@echo "$(YELLOW) 🔫 Libération des ports...$(RESET)"
	@echo "$(CYAN)  - Arrêt des processus sur port 3001 (chat-service)$(RESET)"
	@$(KILL_3001) 2>/dev/null
	@echo "$(CYAN)  - Arrêt des processus sur port 3002 (game-service)$(RESET)"
	@$(KILL_3002) 2>/dev/null
	@echo "$(CYAN)  - Arrêt des processus sur port 3003 (user-service)$(RESET)"
	@$(KILL_3003) 2>/dev/null
	@echo "$(CYAN)  - Arrêt des processus sur port 3004 (auth-service)$(RESET)"
	@$(KILL_3004) 2>/dev/null
	@echo "$(CYAN)  - Arrêt des processus sur port 8081 (frontend)$(RESET)"
	@$(KILL_8081) 2>/dev/null
	@echo "$(CYAN)  - Arrêt de tous les processus Node.js restants$(RESET)"
	@$(KILL_NODE) 2>/dev/null
	@echo "$(YELLOW) 🗑️  Suppression des fichiers...$(RESET)"
	@echo "$(CYAN)  - Nettoyage auth-service (node_modules, dist)$(RESET)"
	@cd srcs/requierements/services/auth-service && $(RM) node_modules dist 2>/dev/null || true
	@echo "$(CYAN)  - Nettoyage chat-service (node_modules, dist)$(RESET)"
	@cd srcs/requierements/services/chat-service && $(RM) node_modules dist 2>/dev/null || true
	@echo "$(CYAN)  - Nettoyage game-service (node_modules, dist)$(RESET)"
	@cd srcs/requierements/services/game-service && $(RM) node_modules dist 2>/dev/null || true
	@echo "$(CYAN)  - Nettoyage user-service (node_modules, dist, data)$(RESET)"
	@cd srcs/requierements/services/user-service && $(RM) node_modules dist data 2>/dev/null || true
	@echo "$(CYAN)  - Nettoyage frontend (node_modules, dist, public)$(RESET)"
	@cd srcs/requierements/frontend && $(RM) node_modules dist public 2>/dev/null || true
	@echo "$(GREEN)$(BOLD) ╔══════════════════════════════════════════════════════════════╗$(RESET)"
	@echo "$(GREEN)$(BOLD) ║                        🧹 NETTOYAGE VIOLENT TERMINÉ 🧹               ║$(RESET)"
	@echo "$(GREEN)$(BOLD) ╠══════════════════════════════════════════════════════════════╣$(RESET)"
	@echo "$(GREEN)$(BOLD) ║                                                              ║$(RESET)"
	@echo "$(GREEN)$(BOLD) ║$(RESET)  $(GREEN)$(BOLD)✅ Tous les ports libérés (3001-3004, 8081)$(RESET)             $(GREEN)$(BOLD)║$(RESET)"
	@echo "$(GREEN)$(BOLD) ║$(RESET)  $(GREEN)$(BOLD)✅ Tous les processus Node.js tués$(RESET)                      $(GREEN)$(BOLD)║$(RESET)"
	@echo "$(GREEN)$(BOLD) ║$(RESET)  $(GREEN)$(BOLD)✅ node_modules supprimés$(RESET)                                 $(GREEN)$(BOLD)║$(RESET)"
	@echo "$(GREEN)$(BOLD) ║$(RESET)  $(GREEN)$(BOLD)✅ Fichiers build supprimés$(RESET)                               $(GREEN)$(BOLD)║$(RESET)"
	@echo "$(GREEN)$(BOLD) ║                                                              ║$(RESET)"
	@echo "$(GREEN)$(BOLD) ║$(RESET)  $(WHITE)$(BOLD)⚡ Tapez make pour relancer le menu$(RESET)                         $(GREEN)$(BOLD)║$(RESET)"
	@echo "$(GREEN)$(BOLD) ║                                                              ║$(RESET)"
	@echo "$(GREEN)$(BOLD) ╚══════════════════════════════════════════════════════════════╝$(RESET)"
	@echo ""

# ═══════════════════════════════════════════════════════════════════════════════
#                            🐳 DOCKER (EXISTANT)
# ═══════════════════════════════════════════════════════════════════════════════

DOCKER_COMPOSE = docker-compose
DOCKER_COMPOSE_FILE = ./srcs/docker-compose.yml
DATA_PATH = ./srcs/volumes

all: build up

build:
	@echo "Building Docker images..."
	mkdir -p ./srcs/volumes/es_data ./srcs/volumes/logstash/logs_pipeline ./srcs/volumes/logstash/logs_config ./srcs/volumes/prometheus_db ./srcs/volumes/grafana_db
	$(DOCKER_COMPOSE) -f $(DOCKER_COMPOSE_FILE) build

up:
	@echo "Starting containers..."
	@docker network rm srcs_app_network srcs_promgraf_network srcs_elk_network > /dev/null 2>&1 || true
	@cd ./srcs && $(DOCKER_COMPOSE) -f docker-compose.yml up -d

down:
	@echo "Stopping containers..."
	cd ./srcs && $(DOCKER_COMPOSE) -f docker-compose.yml down

clean-docker: down
	@echo "Cleaning up containers and images..."
	docker system prune -af

fclean: clean-docker
	@echo "Full cleanup including volumes..."
	cd ./srcs && $(DOCKER_COMPOSE) -f docker-compose.yml down -v
	docker volume rm -f srcs_es_data srcs_grafana_db srcs_prometheus_db srcs_logs_pipeline srcs_logs_config || true
	@sudo rm -rf $(DATA_PATH)

re: fclean all

logs:
	cd ./srcs && $(DOCKER_COMPOSE) -f docker-compose.yml logs -f

status:
	cd ./srcs && $(DOCKER_COMPOSE) -f docker-compose.yml ps

.PHONY: menu run install build-frontend start-services stop-services clean all build up down clean-docker fclean re logs status