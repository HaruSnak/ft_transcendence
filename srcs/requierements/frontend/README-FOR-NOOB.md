# 🚀 Guide Ultra-Simple pour les Débutants

## 📂 Que fait chaque fichier ?

### Services (Logique métier)
- **`user_api_service.ts`** → Gère tous les appels à l'API pour les utilisateurs (profil, blocage, etc.)
- **`socket_connection.ts`** → Se connecte au serveur de chat en temps réel
- **`online_users_manager.ts`** → Affiche et gère la liste des utilisateurs connectés
- **`chat_messages_manager.ts`** → Envoie et reçoit les messages du chat
- **`user_blocking_manager.ts`** → Bloque et débloque les utilisateurs

### Pages (Interfaces utilisateur)
- **`login.ts`** → Page de connexion
- **`signup.ts`** → Page d'inscription
- **`profile.ts`** → Affiche le profil des utilisateurs
- **`chat_ui_manager.ts`** → Interface du chat (boutons, formulaire, etc.)

### Utilitaires (Outils)
- **`data_types.ts`** → Définit les types de données (User, Message, etc.)
- **`app_constants.ts`** → Contient toutes les constantes (URLs, noms d'éléments HTML)

### Fichiers principaux
- **`index.ts`** → Lance l'application et gère la navigation
- **`style.css`** → Styles visuels de l'application

## 🎯 Comment ça marche ?

1. **L'utilisateur se connecte** → `login.ts` vérifie les identifiants
2. **Il voit les utilisateurs en ligne** → `online-users-manager.ts` affiche la liste
3. **Il clique sur un utilisateur** → `chat-messages-manager.ts` démarre une conversation
4. **Il peut bloquer quelqu'un** → `user-blocking-manager.ts` gère le blocage

## 📖 Pour comprendre le code :

**Ouvre n'importe quel fichier** → Lis le nom du fichier → Tu sais déjà ce qu'il fait ! 😊

Exemples :
- `chat-messages-manager.ts` → Gère les messages du chat
- `user-blocking-manager.ts` → Gère le blocage des utilisateurs
- `online-users-manager.ts` → Gère les utilisateurs en ligne

C'est tout ! Le code est maintenant organisé pour que même un débutant comprenne immédiatement. 🎉