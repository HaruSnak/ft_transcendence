#!/bin/bash

echo "📋 === Liste des utilisateurs ==="
echo

# Récupérer les données
USERS=$(docker exec user-service sqlite3 /srcs/data/transcendence.db "SELECT id, username, email, display_name, is_online, wins, losses FROM users ORDER BY id;")

# Header
printf "%-4s %-25s %-30s %-30s %-8s %-6s %-7s\n" "ID" "USERNAME" "EMAIL" "DISPLAY NAME" "ONLINE" "WINS" "LOSSES"
echo "--------------------------------------------------------------------------------------------------------"

# Afficher les données
while IFS='|' read -r id username email display_name is_online wins losses; do
    status="⚫"
    if [ "$is_online" = "1" ]; then
        status="🟢"
    fi
    printf "%-4s %-25s %-30s %-30s %-8s %-6s %-7s\n" "$id" "$username" "$email" "$display_name" "$status" "$wins" "$losses"
done <<< "$USERS"

echo
echo "Total: $(docker exec user-service sqlite3 /srcs/data/transcendence.db 'SELECT COUNT(*) FROM users;') utilisateurs"
