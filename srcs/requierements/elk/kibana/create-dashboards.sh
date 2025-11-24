#!/bin/bash
set -e

ELASTIC_PASSWORD="${ELASTICSEARCH_PASSWORD:-changeme}"
KIBANA_URL="http://kibana:5601"
ES_URL="http://elasticsearch:9200"


# Wait for Kibana
until curl -s -f "${KIBANA_URL}/app/home" > /dev/null 2>&1; do
	echo "Kibana not ready yet, waiting..."
	sleep 5
done
sleep 10


# Check for existing logs
LOGS_COUNT=$(curl -s -u "elastic:${ELASTIC_PASSWORD}" "${ES_URL}/logs-*/_count" 2>/dev/null | grep -o '"count":[0-9]*' | cut -d: -f2 || echo "0")

if [ -z "$LOGS_COUNT" ] || [ "$LOGS_COUNT" -eq "0" ]; then
	echo "No logs found yet. Generating dummy log to initialize index..."
	
	# Create a dummy log entry to initialize the index with proper mappings
	CURRENT_DATE=$(date -u +"%Y.%m.%d")
	CURRENT_TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")
	
	curl -s -X POST "${ES_URL}/logs-${CURRENT_DATE}/_doc" \
		-u "elastic:${ELASTIC_PASSWORD}" \
		-H "Content-Type: application/json" \
		-d "{
			\"@timestamp\": \"${CURRENT_TIMESTAMP}\",
			\"@version\": \"1\",
			\"service\": \"kibana-setup\",
			\"level\": \"info\",
			\"event\": \"dashboard_provisioning_start\",
			\"message\": \"Kibana dashboard provisioning started\",
			\"host\": \"kibana-setup\",
			\"type\": \"system\",
			\"username\": \"system\",
			\"ip_address\": \"127.0.0.1\"
		}" > /dev/null
	
	sleep 2
	
	# Verify log was created
	LOGS_COUNT=$(curl -s -u "elastic:${ELASTIC_PASSWORD}" "${ES_URL}/logs-*/_count" 2>/dev/null | grep -o '"count":[0-9]*' | cut -d: -f2 || echo "0")
fi

echo "Found ${LOGS_COUNT} log entries in Elasticsearch"


# Create index pattern
curl -s -X POST "${KIBANA_URL}/api/saved_objects/index-pattern/logs-star?overwrite=true" \
-u "elastic:${ELASTIC_PASSWORD}" \
-H "kbn-xsrf: true" \
-H "Content-Type: application/json" \
-d '{
	"attributes": {
	"title": "logs-*",
	"timeFieldName": "@timestamp"
	}
}' | jq -r '.id'


# Refresh fields
curl -s -X POST "${KIBANA_URL}/api/index_patterns/index_pattern/logs-star/refresh_fields" \
-u "elastic:${ELASTIC_PASSWORD}" \
-H "kbn-xsrf: true" > /dev/null


# Create Visualizations

# Viz 1: Events by Type (Pie)
curl -s -X POST "${KIBANA_URL}/api/saved_objects/visualization/events-by-type?overwrite=true" \
-u "elastic:${ELASTIC_PASSWORD}" \
-H "kbn-xsrf: true" \
-H "Content-Type: application/json" \
-d '{
	"attributes": {
	"title": "Events by Type",
	"visState": "{\"title\":\"Events by Type\",\"type\":\"pie\",\"params\":{\"type\":\"pie\",\"addTooltip\":true,\"addLegend\":true,\"legendPosition\":\"right\",\"isDonut\":true,\"labels\":{\"show\":false,\"values\":true,\"last_level\":true,\"truncate\":100}},\"aggs\":[{\"id\":\"1\",\"enabled\":true,\"type\":\"count\",\"schema\":\"metric\",\"params\":{}},{\"id\":\"2\",\"enabled\":true,\"type\":\"terms\",\"schema\":\"segment\",\"params\":{\"field\":\"event.keyword\",\"size\":20,\"order\":\"desc\",\"orderBy\":\"1\"}}]}",
	"uiStateJSON": "{}",
	"description": "Distribution of log events by type",
	"version": 1,
	"kibanaSavedObjectMeta": {
		"searchSourceJSON": "{\"index\":\"logs-star\",\"query\":{\"query\":\"\",\"language\":\"kuery\"},\"filter\":[]}"
	}
	}
}' > /dev/null

# Viz 2: Events Timeline (Area)
curl -s -X POST "${KIBANA_URL}/api/saved_objects/visualization/events-timeline?overwrite=true" \
-u "elastic:${ELASTIC_PASSWORD}" \
-H "kbn-xsrf: true" \
-H "Content-Type: application/json" \
-d '{
	"attributes": {
	"title": "Events Timeline",
	"visState": "{\"title\":\"Events Timeline\",\"type\":\"area\",\"params\":{\"type\":\"area\",\"grid\":{\"categoryLines\":false},\"categoryAxes\":[{\"id\":\"CategoryAxis-1\",\"type\":\"category\",\"position\":\"bottom\",\"show\":true,\"style\":{},\"scale\":{\"type\":\"linear\"},\"labels\":{\"show\":true,\"filter\":true,\"truncate\":100},\"title\":{}}],\"valueAxes\":[{\"id\":\"ValueAxis-1\",\"name\":\"LeftAxis-1\",\"type\":\"value\",\"position\":\"left\",\"show\":true,\"style\":{},\"scale\":{\"type\":\"linear\",\"mode\":\"normal\"},\"labels\":{\"show\":true,\"rotate\":0,\"filter\":false,\"truncate\":100},\"title\":{\"text\":\"Count\"}}],\"seriesParams\":[{\"show\":true,\"type\":\"area\",\"mode\":\"stacked\",\"data\":{\"label\":\"Count\",\"id\":\"1\"},\"drawLinesBetweenPoints\":true,\"showCircles\":true,\"interpolate\":\"linear\",\"valueAxis\":\"ValueAxis-1\"}],\"addTooltip\":true,\"addLegend\":true,\"legendPosition\":\"right\",\"times\":[],\"addTimeMarker\":false,\"thresholdLine\":{\"show\":false,\"value\":10,\"width\":1,\"style\":\"full\",\"color\":\"#E7664C\"}},\"aggs\":[{\"id\":\"1\",\"enabled\":true,\"type\":\"count\",\"schema\":\"metric\",\"params\":{}},{\"id\":\"2\",\"enabled\":true,\"type\":\"date_histogram\",\"schema\":\"segment\",\"params\":{\"field\":\"@timestamp\",\"timeRange\":{\"from\":\"now-24h\",\"to\":\"now\"},\"useNormalizedEsInterval\":true,\"scaleMetricValues\":false,\"interval\":\"auto\",\"drop_partials\":false,\"min_doc_count\":1,\"extended_bounds\":{}}},{\"id\":\"3\",\"enabled\":true,\"type\":\"terms\",\"schema\":\"group\",\"params\":{\"field\":\"event.keyword\",\"size\":10,\"order\":\"desc\",\"orderBy\":\"1\"}}]}",
	"uiStateJSON": "{}",
	"description": "Timeline of events over time",
	"version": 1,
	"kibanaSavedObjectMeta": {
		"searchSourceJSON": "{\"index\":\"logs-star\",\"query\":{\"query\":\"\",\"language\":\"kuery\"},\"filter\":[]}"
	}
	}
}' > /dev/null

# Viz 3: Log Levels (Pie)
curl -s -X POST "${KIBANA_URL}/api/saved_objects/visualization/log-levels?overwrite=true" \
-u "elastic:${ELASTIC_PASSWORD}" \
-H "kbn-xsrf: true" \
-H "Content-Type: application/json" \
-d '{
	"attributes": {
	"title": "Log Levels",
	"visState": "{\"title\":\"Log Levels\",\"type\":\"pie\",\"params\":{\"type\":\"pie\",\"addTooltip\":true,\"addLegend\":true,\"legendPosition\":\"right\",\"isDonut\":false,\"labels\":{\"show\":true,\"values\":true,\"last_level\":true,\"truncate\":100}},\"aggs\":[{\"id\":\"1\",\"enabled\":true,\"type\":\"count\",\"schema\":\"metric\",\"params\":{}},{\"id\":\"2\",\"enabled\":true,\"type\":\"terms\",\"schema\":\"segment\",\"params\":{\"field\":\"level.keyword\",\"size\":5,\"order\":\"desc\",\"orderBy\":\"1\"}}]}",
	"uiStateJSON": "{}",
	"description": "Distribution by log level (info, warn, error)",
	"version": 1,
	"kibanaSavedObjectMeta": {
		"searchSourceJSON": "{\"index\":\"logs-star\",\"query\":{\"query\":\"\",\"language\":\"kuery\"},\"filter\":[]}"
	}
	}
}' > /dev/null

# Viz 4: Events by Service (Donut)
curl -s -X POST "${KIBANA_URL}/api/saved_objects/visualization/events-by-service?overwrite=true" \
-u "elastic:${ELASTIC_PASSWORD}" \
-H "kbn-xsrf: true" \
-H "Content-Type: application/json" \
-d '{
	"attributes": {
	"title": "Events by Service",
	"visState": "{\"title\":\"Events by Service\",\"type\":\"pie\",\"params\":{\"type\":\"pie\",\"addTooltip\":true,\"addLegend\":true,\"legendPosition\":\"right\",\"isDonut\":true,\"labels\":{\"show\":false,\"values\":true,\"last_level\":true,\"truncate\":100}},\"aggs\":[{\"id\":\"1\",\"enabled\":true,\"type\":\"count\",\"schema\":\"metric\",\"params\":{}},{\"id\":\"2\",\"enabled\":true,\"type\":\"terms\",\"schema\":\"segment\",\"params\":{\"field\":\"service.keyword\",\"size\":10,\"order\":\"desc\",\"orderBy\":\"1\"}}]}",
	"uiStateJSON": "{}",
	"description": "Events split by service",
	"version": 1,
	"kibanaSavedObjectMeta": {
		"searchSourceJSON": "{\"index\":\"logs-star\",\"query\":{\"query\":\"\",\"language\":\"kuery\"},\"filter\":[]}"
	}
	}
}' > /dev/null

# Viz 5: Top Active Users (Bar)
curl -s -X POST "${KIBANA_URL}/api/saved_objects/visualization/top-active-users?overwrite=true" \
-u "elastic:${ELASTIC_PASSWORD}" \
-H "kbn-xsrf: true" \
-H "Content-Type: application/json" \
-d '{
	"attributes": {
	"title": "Top Active Users",
	"visState": "{\"title\":\"Top Active Users\",\"type\":\"horizontal_bar\",\"params\":{\"type\":\"histogram\",\"grid\":{\"categoryLines\":false},\"categoryAxes\":[{\"id\":\"CategoryAxis-1\",\"type\":\"category\",\"position\":\"left\",\"show\":true,\"style\":{},\"scale\":{\"type\":\"linear\"},\"labels\":{\"show\":true,\"filter\":true,\"truncate\":100},\"title\":{}}],\"valueAxes\":[{\"id\":\"ValueAxis-1\",\"name\":\"LeftAxis-1\",\"type\":\"value\",\"position\":\"bottom\",\"show\":true,\"style\":{},\"scale\":{\"type\":\"linear\",\"mode\":\"normal\"},\"labels\":{\"show\":true,\"rotate\":0,\"filter\":false,\"truncate\":100},\"title\":{\"text\":\"Count\"}}],\"seriesParams\":[{\"show\":true,\"type\":\"histogram\",\"mode\":\"normal\",\"data\":{\"label\":\"Count\",\"id\":\"1\"},\"valueAxis\":\"ValueAxis-1\",\"drawLinesBetweenPoints\":true,\"lineWidth\":2,\"showCircles\":true}],\"addTooltip\":true,\"addLegend\":true,\"legendPosition\":\"right\",\"times\":[],\"addTimeMarker\":false,\"labels\":{\"show\":false},\"thresholdLine\":{\"show\":false,\"value\":10,\"width\":1,\"style\":\"full\",\"color\":\"#E7664C\"}},\"aggs\":[{\"id\":\"1\",\"enabled\":true,\"type\":\"count\",\"schema\":\"metric\",\"params\":{}},{\"id\":\"2\",\"enabled\":true,\"type\":\"terms\",\"schema\":\"segment\",\"params\":{\"field\":\"username.keyword\",\"size\":10,\"order\":\"desc\",\"orderBy\":\"1\",\"missingBucket\":false,\"missingBucketLabel\":\"Missing\"}}]}",
	"uiStateJSON": "{}",
	"description": "Most active users by event count (excludes system events)",
	"version": 1,
	"kibanaSavedObjectMeta": {
		"searchSourceJSON": "{\"index\":\"logs-star\",\"query\":{\"query\":\"NOT username:system\",\"language\":\"kuery\"},\"filter\":[]}"
	}
	}
}' > /dev/null

# Viz 6: Security Events (Filter: warn/error)
curl -s -X POST "${KIBANA_URL}/api/saved_objects/visualization/security-events?overwrite=true" \
-u "elastic:${ELASTIC_PASSWORD}" \
-H "kbn-xsrf: true" \
-H "Content-Type: application/json" \
-d '{
	"attributes": {
	"title": "Security Events",
	"visState": "{\"title\":\"Security Events\",\"type\":\"line\",\"params\":{\"type\":\"line\",\"grid\":{\"categoryLines\":false},\"categoryAxes\":[{\"id\":\"CategoryAxis-1\",\"type\":\"category\",\"position\":\"bottom\",\"show\":true,\"style\":{},\"scale\":{\"type\":\"linear\"},\"labels\":{\"show\":true,\"filter\":true,\"truncate\":100},\"title\":{}}],\"valueAxes\":[{\"id\":\"ValueAxis-1\",\"name\":\"LeftAxis-1\",\"type\":\"value\",\"position\":\"left\",\"show\":true,\"style\":{},\"scale\":{\"type\":\"linear\",\"mode\":\"normal\"},\"labels\":{\"show\":true,\"rotate\":0,\"filter\":false,\"truncate\":100},\"title\":{\"text\":\"Count\"}}],\"seriesParams\":[{\"show\":true,\"type\":\"line\",\"mode\":\"normal\",\"data\":{\"label\":\"Count\",\"id\":\"1\"},\"valueAxis\":\"ValueAxis-1\",\"drawLinesBetweenPoints\":true,\"lineWidth\":2,\"showCircles\":true}],\"addTooltip\":true,\"addLegend\":true,\"legendPosition\":\"right\",\"times\":[],\"addTimeMarker\":false,\"thresholdLine\":{\"show\":false,\"value\":10,\"width\":1,\"style\":\"full\",\"color\":\"#E7664C\"}},\"aggs\":[{\"id\":\"1\",\"enabled\":true,\"type\":\"count\",\"schema\":\"metric\",\"params\":{}},{\"id\":\"2\",\"enabled\":true,\"type\":\"date_histogram\",\"schema\":\"segment\",\"params\":{\"field\":\"@timestamp\",\"timeRange\":{\"from\":\"now-24h\",\"to\":\"now\"},\"useNormalizedEsInterval\":true,\"scaleMetricValues\":false,\"interval\":\"auto\",\"drop_partials\":false,\"min_doc_count\":1,\"extended_bounds\":{}}},{\"id\":\"3\",\"enabled\":true,\"type\":\"terms\",\"schema\":\"group\",\"params\":{\"field\":\"event.keyword\",\"size\":5,\"order\":\"desc\",\"orderBy\":\"1\"}}]}",
	"uiStateJSON": "{}",
	"description": "Failed logins, SQL injection attempts, and security events",
	"version": 1,
	"kibanaSavedObjectMeta": {
		"searchSourceJSON": "{\"index\":\"logs-star\",\"query\":{\"query\":\"level:(warn OR error)\",\"language\":\"kuery\"},\"filter\":[]}"
	}
	}
}' > /dev/null

# Viz 7: Event Count (Metric)
curl -s -X POST "${KIBANA_URL}/api/saved_objects/visualization/total-events?overwrite=true" \
-u "elastic:${ELASTIC_PASSWORD}" \
-H "kbn-xsrf: true" \
-H "Content-Type: application/json" \
-d '{
	"attributes": {
	"title": "Total Events",
	"visState": "{\"title\":\"Total Events\",\"type\":\"metric\",\"params\":{\"addTooltip\":true,\"addLegend\":false,\"type\":\"metric\",\"metric\":{\"percentageMode\":false,\"useRanges\":false,\"colorSchema\":\"Green to Red\",\"metricColorMode\":\"None\",\"colorsRange\":[{\"from\":0,\"to\":10000}],\"labels\":{\"show\":true},\"invertColors\":false,\"style\":{\"bgFill\":\"#000\",\"bgColor\":false,\"labelColor\":false,\"subText\":\"\",\"fontSize\":60}}},\"aggs\":[{\"id\":\"1\",\"enabled\":true,\"type\":\"count\",\"schema\":\"metric\",\"params\":{}}]}",
	"uiStateJSON": "{}",
	"description": "Total number of logged events",
	"version": 1,
	"kibanaSavedObjectMeta": {
		"searchSourceJSON": "{\"index\":\"logs-star\",\"query\":{\"query\":\"\",\"language\":\"kuery\"},\"filter\":[]}"
	}
	}
}' > /dev/null


# Create Dashboard
curl -s -X POST "${KIBANA_URL}/api/saved_objects/dashboard/main-dashboard?overwrite=true" \
-u "elastic:${ELASTIC_PASSWORD}" \
-H "kbn-xsrf: true" \
-H "Content-Type: application/json" \
-d '{
	"attributes": {
	"title": "Security & Monitoring",
	"hits": 0,
	"description": "Comprehensive logging dashboard for ft_transcendence application",
	"panelsJSON": "[{\"version\":\"7.17.25\",\"gridData\":{\"x\":0,\"y\":0,\"w\":48,\"h\":12,\"i\":\"1\"},\"panelIndex\":\"1\",\"embeddableConfig\":{},\"panelRefName\":\"panel_0\"},{\"version\":\"7.17.25\",\"gridData\":{\"x\":0,\"y\":12,\"w\":24,\"h\":15,\"i\":\"2\"},\"panelIndex\":\"2\",\"embeddableConfig\":{},\"panelRefName\":\"panel_1\"},{\"version\":\"7.17.25\",\"gridData\":{\"x\":24,\"y\":12,\"w\":24,\"h\":15,\"i\":\"3\"},\"panelIndex\":\"3\",\"embeddableConfig\":{},\"panelRefName\":\"panel_2\"},{\"version\":\"7.17.25\",\"gridData\":{\"x\":0,\"y\":27,\"w\":16,\"h\":12,\"i\":\"4\"},\"panelIndex\":\"4\",\"embeddableConfig\":{},\"panelRefName\":\"panel_3\"},{\"version\":\"7.17.25\",\"gridData\":{\"x\":16,\"y\":27,\"w\":16,\"h\":12,\"i\":\"5\"},\"panelIndex\":\"5\",\"embeddableConfig\":{},\"panelRefName\":\"panel_4\"},{\"version\":\"7.17.25\",\"gridData\":{\"x\":32,\"y\":27,\"w\":16,\"h\":12,\"i\":\"6\"},\"panelIndex\":\"6\",\"embeddableConfig\":{},\"panelRefName\":\"panel_5\"},{\"version\":\"7.17.25\",\"gridData\":{\"x\":0,\"y\":39,\"w\":10,\"h\":8,\"i\":\"7\"},\"panelIndex\":\"7\",\"embeddableConfig\":{},\"panelRefName\":\"panel_6\"}]",
	"optionsJSON": "{\"hidePanelTitles\":false,\"useMargins\":true}",
	"version": 1,
	"timeRestore": false,
	"kibanaSavedObjectMeta": {
		"searchSourceJSON": "{\"query\":{\"query\":\"\",\"language\":\"kuery\"},\"filter\":[]}"
	}
	},
	"references": [
	{"name": "panel_0", "type": "visualization", "id": "events-timeline"},
	{"name": "panel_1", "type": "visualization", "id": "events-by-type"},
	{"name": "panel_2", "type": "visualization", "id": "security-events"},
	{"name": "panel_3", "type": "visualization", "id": "log-levels"},
	{"name": "panel_4", "type": "visualization", "id": "events-by-service"},
	{"name": "panel_5", "type": "visualization", "id": "top-active-users"},
	{"name": "panel_6", "type": "visualization", "id": "total-events"}
	]
}' > /dev/null


# Create a completion log
CURRENT_DATE=$(date -u +"%Y.%m.%d")
CURRENT_TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")

curl -s -X POST "${ES_URL}/logs-${CURRENT_DATE}/_doc" \
	-u "elastic:${ELASTIC_PASSWORD}" \
	-H "Content-Type: application/json" \
	-d "{
		\"@timestamp\": \"${CURRENT_TIMESTAMP}\",
		\"@version\": \"1\",
		\"service\": \"kibana-setup\",
		\"level\": \"info\",
		\"event\": \"dashboard_provisioning_complete\",
		\"message\": \"Kibana dashboards successfully provisioned with ${LOGS_COUNT} initial logs\",
		\"host\": \"kibana-setup\",
		\"type\": \"system\",
		\"username\": \"system\",
		\"ip_address\": \"127.0.0.1\"
	}" > /dev/null


echo "Access Kibana at: http://localhost:5601"
echo "Login: elastic / ${ELASTIC_PASSWORD}"
echo "Total events in Elasticsearch: ${LOGS_COUNT}"

