# Kibana Dashboard Auto-Provisioning System

## Overview
Automated dashboard provisioning system that creates comprehensive logging visualizations on first startup, surviving `make fclean` rebuilds.

## Features

### ✅ Instant Startup
- **No 2-minute wait!** If no logs exist, automatically generates dummy logs
- Dashboard creation completes in ~15 seconds (vs 90-120 seconds before)
- Smart log detection: uses existing logs if available, creates dummy logs if not

### ✅ Comprehensive Logging
The system tracks **17 event types** across 2 services:

**User Service Events:**
- `user_register` - New user registration
- `user_register_failed` - Failed registration attempts
- `user_login` - Successful user login
- `user_login_failed` - Failed login attempts (security monitoring)
- `user_logout` - User logout
- `user_profile_update` - Profile modifications
- `user_avatar_upload` - Avatar changes
- `user_block` / `user_unblock` - User blocking actions
- `game_match_created` - New game matches
- `game_invitation_sent` / `game_invitation_response` - Game invitations
- `tournament_match_result` - Tournament outcomes

**Chat Service Events:**
- `chat_connection` / `chat_disconnection` - WebSocket connections
- `chat_register` / `chat_register_failed` - Chat registration
- `sql_injection_blocked` - Security events
- `message_sent` / `message_failed` - Chat messages

### ✅ Dashboards Created

#### 1. **ft_transcendence Logging Overview** (Main Dashboard)
7 visualizations providing comprehensive system overview:
- **Events Timeline** - Area chart showing event distribution over time, grouped by event type
- **Events by Type** - Pie chart of all event types
- **Events by Service** - Donut chart showing service activity distribution
- **Log Levels** - Pie chart of log levels (info/warn/error)
- **Top Active Users** - Horizontal bar chart of most active users
- **Security Events** - Line chart of warnings and errors (security monitoring)
- **Total Events** - Metric counter showing total log count

#### 2. **Security & Monitoring** (Security Dashboard)
Focused security view:
- **Security Events Timeline** - Failed logins, SQL injection attempts, errors
- **Log Levels Distribution** - Quick overview of warning/error ratio
- **Events by Type** - Detailed event breakdown

## Technical Implementation

### Architecture
```
Services (user-service, chat-service)
    ↓ (TCP JSON on port 5000)
Logstash (parsing & enrichment)
    ↓ (HTTP)
Elasticsearch (indexed as logs-YYYY.MM.DD)
    ↓ (Kibana API)
Kibana Dashboards (auto-created on startup)
```

### Auto-Provisioning Script
**Location**: `/srcs/requierements/elk/kibana/create-dashboards.sh`

**Process**:
1. Wait for Kibana to be ready (~10s)
2. Check Elasticsearch for existing logs
3. **If no logs**: Generate dummy system log to initialize index
4. Create index pattern `logs-*` with `@timestamp` field
5. Refresh field mappings (52 fields from Elasticsearch)
6. Create 7 visualizations via Kibana API
7. Create 2 dashboards with panel layouts
8. Log completion event

**Key Innovation**: Dummy log generation
```bash
# Creates initial log if index is empty
curl -X POST "elasticsearch:9200/logs-$(date +%Y.%m.%d)/_doc" \
  -d '{
    "@timestamp": "2025-11-17T15:05:59.000Z",
    "service": "kibana-setup",
    "event": "dashboard_provisioning_start",
    "message": "Kibana dashboard provisioning started"
  }'
```

### Docker Integration
- **Service**: `kibana-setup` (one-shot container)
- **Depends on**: kibana, user-service, chat-service
- **Networks**: elk_network, app_network
- **Restart policy**: `no` (runs once then exits)

### Persistence Strategy
- ✅ **Configuration-as-Code**: All dashboard definitions in script
- ✅ **Survives make fclean**: Script runs on every build
- ✅ **No volume dependencies**: Everything created via API
- ✅ **Idempotent**: Can be re-run safely (overwrites existing)

## Usage

### Access Dashboards
```
URL: http://localhost:5601
Login: elastic / <ELASTIC_PASSWORD from .env>

Direct Links:
- Main: http://localhost:5601/app/dashboards#/view/main-dashboard
- Security: http://localhost:5601/app/dashboards#/view/security-dashboard
```

### After make fclean
```bash
make fclean
make all
# Dashboards automatically recreated!
```

### Manual Dashboard Recreation
```bash
cd srcs/
docker-compose up kibana-setup
```

### Generate Test Logs
```bash
cd srcs/
./test-logging.sh  # Restarts services to trigger logging
```

## System Logs Created

The provisioning system creates its own tracking logs:

1. **dashboard_provisioning_start**
   - Created when no logs exist
   - Initializes index with proper field mappings
   - Service: kibana-setup

2. **dashboard_provisioning_complete**
   - Created after successful dashboard creation
   - Records number of initial logs processed
   - Service: kibana-setup

These appear in the dashboards and help track provisioning history.

## Field Mappings

The system automatically maps **52 fields** including:

**Core Fields**:
- `@timestamp` (date) - Event timestamp
- `service` (keyword) - Service name
- `event` (keyword) - Event type
- `level` (keyword) - Log level
- `message` (text) - Log message

**User Fields**:
- `username`, `email`, `display_name`
- `userId`

**Game Fields**:
- `match_id`, `game_type`
- `player1_id`, `player2_id`, `winner_id`
- `score`

**Security Fields**:
- `ip_address`, `user_agent`
- `error`

## Maintenance

### Re-run Provisioning
If dashboards are deleted or corrupted:
```bash
cd srcs/
docker-compose up kibana-setup
```

### View Provisioning Logs
```bash
docker logs kibana-setup
```

### Check Elasticsearch Logs
```bash
curl -u "elastic:PASSWORD" "http://localhost:9200/logs-*/_search?size=100"
```

### Rebuild Images
```bash
cd srcs/
docker-compose build --no-cache kibana kibana-setup
```

## Performance

- **Initial startup**: ~15 seconds (with dummy log generation)
- **With existing logs**: ~12 seconds
- **Memory**: Kibana setup container exits after completion (no overhead)
- **Index size**: Minimal (logs-YYYY.MM.DD pattern with daily rotation)

## Troubleshooting

### "No data to display" in dashboards
- Check if services are running: `docker-compose ps`
- Generate test data: `./test-logging.sh`
- Verify Elasticsearch has logs: `curl -u elastic:PASSWORD http://localhost:9200/logs-*/_count`

### Dashboards don't appear
- Check kibana-setup logs: `docker logs kibana-setup`
- Verify Elasticsearch is accessible: `docker exec kibana curl -s http://elasticsearch:9200`
- Re-run setup: `docker-compose up kibana-setup`

### Index pattern has no fields
- The script includes automatic field refresh
- If issue persists, delete index pattern and re-run: 
  ```bash
  curl -X DELETE -u elastic:PASSWORD http://localhost:5601/api/saved_objects/index-pattern/logs-star
  docker-compose up kibana-setup
  ```

## Security Notes

⚠️ **Development passwords are in `.env` file**
- Change `ELASTIC_PASSWORD` before production deployment
- Use strong passwords (min 16 chars recommended)
- Consider rotating passwords regularly

## Future Enhancements

Possible improvements:
- [ ] Add more visualization types (heatmaps, gauges)
- [ ] Create user-specific dashboards
- [ ] Add alerting rules for security events
- [ ] Implement log retention policies
- [ ] Add geo-IP visualization for user locations
- [ ] Create game performance analytics dashboard

---

**Created**: November 17, 2025  
**Version**: 2.0 (with instant dummy log generation)  
**Project**: ft_transcendence  
**ELK Stack**: 7.17.25
