# Image officielle Elasticsearch 8.15.0 avec support SSL/TLS et X-Pack Security
FROM docker.elastic.co/elasticsearch/elasticsearch:8.15.0

# Copie du fichier de configuration personnalisé pour le cluster
COPY elasticsearch.yml /usr/share/elasticsearch/config/elasticsearch.yml
# Script d'initialisation pour configurer l'Index Lifecycle Management (ILM)
COPY init-ilm.sh /usr/share/elasticsearch/init-ilm.sh

# Passage en root pour configurer les permissions
USER root
# Configuration des permissions pour les répertoires critiques
# - data : stockage des index et documents
# - logs : fichiers de logs Elasticsearch
# - config : fichiers de configuration
# Rend le script ILM exécutable
RUN chown -R elasticsearch:elasticsearch /usr/share/elasticsearch/data && \
    chown -R elasticsearch:elasticsearch /usr/share/elasticsearch/logs && \
    chown -R elasticsearch:elasticsearch /usr/share/elasticsearch/config && \
    chmod +x /usr/share/elasticsearch/init-ilm.sh

# Génération du keystore pour sécuriser les mots de passe
# Le keystore chiffre les credentials sensibles (API keys, etc.)
RUN /usr/share/elasticsearch/bin/elasticsearch-keystore create

# Retour à l'utilisateur elasticsearch (sécurité)
USER elasticsearch

# Exposition des ports
# 9200 : API REST HTTP (requêtes de recherche et indexation)
# 9300 : Communication inter-nœuds (cluster transport protocol)
EXPOSE 9200 9300

# Démarrage d'Elasticsearch avec initialisation ILM
# 1. Lance Elasticsearch en arrière-plan (&)
# 2. Attend 30 secondes que le cluster soit prêt (sleep 30)
# 3. Exécute le script ILM pour configurer les politiques de rétention
# 4. Attend la fin du processus Elasticsearch (wait)
CMD ["sh", "-c", "elasticsearch & sleep 30 && /usr/share/elasticsearch/init-ilm.sh && wait"]