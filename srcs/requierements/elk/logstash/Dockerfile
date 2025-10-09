# Logstash collecte, transforme et envoie les logs vers Elasticsearch
FROM docker.elastic.co/logstash/logstash:8.15.0

# Copie des fichiers de pipeline avec permissions correctes
# Pipeline : définit les sources (input), filtres (filter) et destinations (output) des logs
# --chown=logstash:logstash : assure que l'utilisateur logstash peut lire les fichiers
COPY --chown=logstash:logstash pipeline/ /usr/share/logstash/pipeline/

# Copie de la configuration principale de Logstash
# logstash.yml : paramètres du cluster, monitoring, API, etc.
COPY --chown=logstash:logstash config/logstash.yml /usr/share/logstash/config/

# Démarrage de Logstash avec lecture automatique des pipelines
# Logstash charge tous les fichiers .conf dans /usr/share/logstash/pipeline/
CMD ["/usr/share/logstash/bin/logstash"]