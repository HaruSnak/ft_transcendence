DOCKER_COMPOSE = docker-compose
DOCKER_COMPOSE_FILE = ./srcs/docker-compose.yml
DATA_PATH = ./srcs/volumes

.PHONY: all build up down clean fclean re logs status install build-frontend start-services stop-services run

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

clean: down
	@echo "Cleaning up containers and images..."
	docker system prune -af

fclean: clean
	@echo "Full cleanup including volumes..."
	cd ./srcs && $(DOCKER_COMPOSE) -f docker-compose.yml down -v
	docker volume rm -f srcs_es_data srcs_grafana_db srcs_prometheus_db srcs_logs_pipeline srcs_logs_config || true
	@sudo rm -rf $(DATA_PATH)

re: fclean all

logs:
	cd ./srcs && $(DOCKER_COMPOSE) -f docker-compose.yml logs -f

status:
	cd ./srcs && $(DOCKER_COMPOSE) -f docker-compose.yml ps

# Non-Docker targets
install:
	@echo "Installing dependencies..."
	@cd srcs/requierements/services/auth-service && npm install >nul 2>&1
	@cd srcs/requierements/services/chat-service && npm install >nul 2>&1
	@cd srcs/requierements/services/game-service && npm install >nul 2>&1
	@cd srcs/requierements/services/user-service && npm install >nul 2>&1
	@cd srcs/requierements/frontend && npm install >nul 2>&1
	@echo "Dependencies installed."

build-frontend:
	@echo "Building frontend..."
	@cd srcs/requierements/frontend && npm run build-css >nul 2>&1 && npm run build-ts >nul 2>&1
	@echo "Frontend built."

start-services:
	@echo "Starting services..."
	@start /B cmd /C "cd srcs\requierements\services\auth-service && node srcs/server.js" >nul 2>&1
	@start /B cmd /C "cd srcs\requierements\services\chat-service && node srcs/server.js" >nul 2>&1
	@start /B cmd /C "cd srcs\requierements\services\game-service && node srcs/server.js" >nul 2>&1
	@start /B cmd /C "cd srcs\requierements\services\user-service && node srcs/server.js" >nul 2>&1
	@start /B cmd /C "cd srcs\requierements\frontend && node server.js" >nul 2>&1
	@echo "Services started. Access http://localhost:8081"

stop-services:
	@echo "Stopping services..."
	@taskkill /F /IM node.exe >nul 2>&1
	@echo "Services stopped."

run: install build-frontend start-services