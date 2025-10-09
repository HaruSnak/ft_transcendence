#!/bin/bash
# Attendre qu'Elasticsearch soit prêt
until curl -k -u elastic:elasticpassword https://localhost:9200/_cluster/health?wait_for_status=yellow; do
  echo "Waiting for Elasticsearch..."
  sleep 5
done

# Créer une politique de rétention pour les logs (ex. supprimer après 30 jours)
curl -k -u elastic:elasticpassword -X PUT "https://localhost:9200/_ilm/policy/logs-retention-policy" -H 'Content-Type: application/json' -d'
{
  "policy": {
    "phases": {
      "hot": {
        "actions": {}
      },
      "delete": {
        "min_age": "30d",
        "actions": {
          "delete": {}
        }
      }
    }
  }
}'

echo "ILM policy created."