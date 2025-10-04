# Frontend Architecture Documentation

## 📁 Structure du projet

```
src/
├── services/                    # Services métier et API
│   ├── api/
│   │   └── user_api_service.ts          # Service API pour les utilisateurs
│   └── socket/                  # Services de communication temps réel
│       ├── socket_connection.ts         # Connexion Socket.IO de base
│       ├── online_users_manager.ts      # Gestion des utilisateurs en ligne
│       ├── chat_messages_manager.ts     # Gestion des messages et DM
│       ├── user_blocking_manager.ts     # Système de blocage d'utilisateurs
│       └── index.ts                     # Point d'entrée des services socket
├── pages/                       # Pages de l'application
│   ├── livechat/
│   │   ├── chat_ui_manager.ts           # Interface utilisateur du chat
│   │   └── index.ts                     # Point d'entrée du chat
│   ├── login.ts                 # Page de connexion
│   ├── signup.ts                # Page d'inscription
│   ├── profile.ts               # Page de profil utilisateur
│   └── ...
├── utils/                       # Utilitaires et constantes
│   ├── data_types.ts            # Types TypeScript
│   └── app_constants.ts         # Constantes de l'application
├── components/                  # Composants réutilisables
├── game/                        # Logique du jeu
├── index.ts                     # Point d'entrée principal
└── style.css                    # Styles globaux
```

## 🔧 Services

### SocketServiceManager (`services/socket/index.ts`)
**Responsabilité** : Gestionnaire principal des services de communication temps réel
- Initialise tous les services socket
- Fournit une API unifiée pour les fonctionnalités socket

**Méthodes principales** :
- `sendMessage(text: string)` - Envoie un message
- `blockUser(username: string)` - Bloque un utilisateur
- `unblockUser(username: string)` - Débloque un utilisateur
- `isUserBlocked(username: string)` - Vérifie si un utilisateur est bloqué
- `getCurrentChat()` - Récupère la conversation active

### UserApiService (`services/api/user_api_service.ts`)
**Responsabilité** : Gestion des appels API utilisateur
- Authentification et profils
- Système de blocage

**Méthodes principales** :
- `getUserProfile()` - Récupère le profil de l'utilisateur connecté
- `getUserByUsername(username)` - Récupère le profil d'un utilisateur par nom
- `blockUser(userId)` / `unblockUser(userId)` - Gestion du blocage

## 📱 Pages

### ChatInterfaceManager (`pages/livechat/chat_ui_manager.ts`)
**Responsabilité** : Interface utilisateur du chat
- Gestion du formulaire de messages
- Boutons de blocage/déblocage
- Initialisation de la liste des DM

### Profile Page (`pages/profile.ts`)
**Responsabilité** : Affichage et édition des profils utilisateur
- Support des profils propres et d'autres utilisateurs
- Masquage des boutons d'action pour les profils externes

## 🎯 Principes de conception

### Séparation des responsabilités
Chaque service/fichier a une responsabilité claire et unique :
- **Connection** : Connexion socket uniquement
- **UserManagement** : Liste des utilisateurs en ligne
- **MessageHandling** : Messages et conversations
- **BlockingSystem** : Logique de blocage

### Nommage explicite
- Fonctions : `sendMessage()`, `blockUser()`, `loadBlockedUsers()`
- Variables : `currentUser`, `messageHistory`, `blockedUsers`
- Constantes : `SOCKET_EVENTS`, `UI_ELEMENTS`, `STORAGE_KEYS`

### Architecture modulaire
- Services indépendants et testables
- Imports clairs et explicites
- Singleton pour les services globaux

## 🔄 Flux de données

1. **Connexion** : `SocketServiceManager` → `SocketConnectionService`
2. **Messages** : Interface → `MessageHandlingService` → Socket
3. **Utilisateurs** : Socket events → `UserManagementService` → Interface
4. **Blocage** : Interface → `BlockingSystemService` → API → Socket

Cette architecture rend le code maintenable, testable et facile à comprendre pour une évaluation !