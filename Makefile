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
	mkdir -p ./srcs/volumes/es_data ./srcs/volumes/logstash/logs_pipeline ./srcs/volumes/logstash/logs_config ./srcs/volumes/prometheus_db ./srcs/volumes/grafana_db
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
	docker volume rm -f srcs_es_data srcs_grafana_db srcs_prometheus_db srcs_logs_pipeline srcs_logs_config || true
	@sudo rm -rf $(DATA_PATH)
	@echo "Removing all node_modules directories..."
	@for dir in $(NODE_MODULES_PATHS); do \
		if [ -d "$$dir" ]; then \
			echo "  Removing $$dir..."; \
			rm -rf "$$dir"; \
		fi; \
	done
	@echo "Full cleanup complete. Run 'make' to rebuild from scratch."

re: fclean all

logs:
	cd ./srcs && $(DOCKER_COMPOSE) -f docker-compose.yml logs -f

status:
	cd ./srcs && $(DOCKER_COMPOSE) -f docker-compose.yml ps