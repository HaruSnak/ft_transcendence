FROM prom/prometheus:latest

COPY prometheus.yml /etc/prometheus/prometheus.yml
COPY alert_rules.yml /etc/prometheus/alert_rules.yml

EXPOSE 9090

# Démarrage de Prometheus avec :
# - Fichier de configuration personnalisé
# - Chemin de stockage des données time-series
# - Bibliothèques et templates pour la console web
# - Rétention des données de 200 heures
# - Activation du rechargement de configuration via API
CMD ["--config.file=/etc/prometheus/prometheus.yml", "--storage.tsdb.path=/prometheus", "--web.console.libraries=/etc/prometheus/console_libraries", "--web.console.templates=/etc/prometheus/consoles", "--storage.tsdb.retention.time=200h", "--web.enable-lifecycle"]