DOCKER_COMPOSE = docker-compose
DOCKER_COMPOSE_FILE = ./srcs/docker-compose.yml
DATA_PATH = ./srcs/volumes

# Chemins des node_modules
NODE_MODULES_PATHS = \
	./srcs/requierements/frontend/node_modules \
	./srcs/requierements/services/chat-service/node_modules \
	./srcs/requierements/services/user-service/node_modules

.PHONY: all build up down clean fclean re logs

all: build up

build:
	@echo "Building Docker images..."
	mkdir -p ./srcs/volumes/prometheus_db ./srcs/volumes/grafana_db
	@echo "Building frontend assets locally (Node.js 18)..."
	@cd ./srcs/requierements/frontend && npm ci && npm run build && npm run build-css
	@echo "Frontend assets built successfully."
	$(DOCKER_COMPOSE) -f $(DOCKER_COMPOSE_FILE) build

up:
	@echo "Starting containers..."
	cd ./srcs && $(DOCKER_COMPOSE) -f docker-compose.yml up -d

down:
	@echo "Stopping containers..."
	cd ./srcs && $(DOCKER_COMPOSE) -f docker-compose.yml down

clean: down
	@echo "Cleaning up containers and images..."
	docker system prune -af

# Nettoyage complet : volumes Docker + node_modules pour un rebuild 100% propre
fclean: clean
	@echo "Full cleanup including volumes and node_modules..."
	cd ./srcs && $(DOCKER_COMPOSE) -f docker-compose.yml down -v
	docker volume rm -f srcs_es_data srcs_grafana_db srcs_prometheus_db || true
	@echo "Removing volume directories with Docker..."
	@if [ -d "$(DATA_PATH)" ]; then \
		docker run --rm -v "$$(pwd)/$(DATA_PATH):/data" alpine find /data -mindepth 1 -delete 2>/dev/null || true; \
	fi
	@echo "Removing all node_modules directories..."
	@for dir in $(NODE_MODULES_PATHS); do \
		if [ -d "$$dir" ]; then \
			echo "  Removing $$dir..."; \
			rm -rf "$$dir"; \
		fi; \
	done
	@echo "Removing frontend builder image..."
	@docker rmi frontend-builder 2>/dev/null || true
	@echo "Full cleanup complete. Run 'make' to rebuild from scratch."

re: fclean all

logs:
	cd ./srcs && $(DOCKER_COMPOSE) -f docker-compose.yml logs -f

status:
	cd ./srcs && $(DOCKER_COMPOSE) -f docker-compose.yml ps