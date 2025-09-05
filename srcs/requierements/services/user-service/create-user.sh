#!/bin/bash

# Script pour créer un utilisateur personnalisé
# Usage: ./create-user.sh [username] [email] [password] [display_name]

if [ $# -eq 0 ]; then
	echo "=== 👤 Créateur d'utilisateur personnalisé ==="
	echo
	echo "Usage:"
	echo "  ./create-user.sh username email password display_name"
	echo
	echo "Exemple:"
	echo "  ./create-user.sh john john@example.com mypassword 'John Doe'"
	echo
	echo "Ou utilisez la commande curl directement:"
	echo "curl -X POST http://localhost:3003/api/auth/register \\"
	echo "  -H 'Content-Type: application/json' \\"
	echo "  -d '{\"username\":\"VOTRE_USERNAME\",\"email\":\"VOTRE_EMAIL\",\"password\":\"VOTRE_PASSWORD\",\"display_name\":\"VOTRE_NOM\"}'"
	exit 1
fi

USERNAME="$1"
EMAIL="$2" 
PASSWORD="$3"
DISPLAY_NAME="${4:-$USERNAME}"

echo "=== 👤 Création d'utilisateur ==="
echo "Username: $USERNAME"
echo "Email: $EMAIL"
echo "Display Name: $DISPLAY_NAME"
echo

# Créer l'utilisateur
echo "🚀 Création en cours..."
RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST http://localhost:3003/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"$USERNAME\",\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\",\"display_name\":\"$DISPLAY_NAME\"}")

echo "$RESPONSE"
echo

# Extraire le code de statut
HTTP_STATUS=$(echo "$RESPONSE" | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)

if [ "$HTTP_STATUS" = "201" ]; then
	echo "✅ Utilisateur créé avec succès!"
	echo
	echo "Vous pouvez maintenant vous connecter avec:"
	echo "curl -X POST http://localhost:3003/api/auth/login \\"
	echo "  -H 'Content-Type: application/json' \\"
	echo "  -d '{\"username\":\"$USERNAME\",\"password\":\"$PASSWORD\"}'"
else
	echo "❌ Erreur lors de la création (Status: $HTTP_STATUS)"
fi
