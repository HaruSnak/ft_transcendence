DOCKER_COMPOSE = docker-compose
DOCKER_COMPOSE_FILE = ./srcs/docker-compose.yml
DATA_PATH = ./srcs/volumes

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