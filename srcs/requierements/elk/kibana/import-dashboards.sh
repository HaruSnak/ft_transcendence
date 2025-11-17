#!/bin/bash
set -e

# Get Elasticsearch password from environment or use default
ELASTIC_PASSWORD="${ELASTICSEARCH_PASSWORD:-changeme}"

echo "Waiting for Kibana to be ready..."
until curl -s -f "http://kibana:5601/app/home" > /dev/null 2>&1; do
    echo "Kibana not ready yet, waiting..."
    sleep 5
done

echo "Kibana is ready. Waiting additional 10 seconds for full initialization..."
sleep 10

echo "Creating index pattern with field refresh..."
# First, ensure logs exist in Elasticsearch
LOGS_COUNT=$(curl -s -u "elastic:${ELASTIC_PASSWORD}" "http://elasticsearch:9200/logs-*/_count" | grep -o '"count":[0-9]*' | cut -d: -f2)
echo "Found $LOGS_COUNT log entries in Elasticsearch"

# Create/update index pattern with field refresh
curl -s -X POST "http://kibana:5601/api/saved_objects/index-pattern/logs-*?overwrite=true" \
  -u "elastic:${ELASTIC_PASSWORD}" \
  -H "kbn-xsrf: true" \
  -H "Content-Type: application/json" \
  -d '{
    "attributes": {
      "title": "logs-*",
      "timeFieldName": "@timestamp"
    }
  }' > /dev/null

echo "Refreshing index pattern fields..."
curl -s -X POST "http://kibana:5601/api/index_patterns/index_pattern/logs-*/refresh_fields" \
  -u "elastic:${ELASTIC_PASSWORD}" \
  -H "kbn-xsrf: true" > /dev/null

echo "Importing visualizations and dashboards..."
RESULT=$(curl -s -X POST "http://kibana:5601/api/saved_objects/_import?overwrite=true" \
  -u "elastic:${ELASTIC_PASSWORD}" \
  -H "kbn-xsrf: true" \
  --form file=@/saved_objects/export.ndjson)

echo "$RESULT"

if echo "$RESULT" | grep -q "success.*true"; then
    echo ""
    echo "✅ Saved objects imported successfully!"
    echo "   Access Kibana at: http://localhost:5601"
    echo "   Login: elastic / ${ELASTIC_PASSWORD}"
    echo "   Navigate to: Dashboards → ft_transcendence Logging Overview"
    exit 0
else
    echo "❌ Import may have failed. Check response above."
    exit 1
fi
