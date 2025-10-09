# 📚 Documentation Guide - ft_transcendence Frontend

## 🎯 Vue d'ensemble

Ce guide liste tous les fichiers à documenter pour l'évaluation des modules suivants :

- **Major Module: Live Chat**
- **Minor Module: Framework/Toolkit (Tailwind CSS + TypeScript)**
- **Major Module: User Management**

**Note :** Cette documentation couvre uniquement le frontend. Backend et base de données ne sont pas inclus.

---

## 📋 MODULE 1: LIVE CHAT

### Objectifs du module :
- ✅ Messages directs entre utilisateurs
- ✅ Système de blocage d'utilisateurs
- ✅ Invitations aux parties Pong via chat
- ✅ Notifications tournoi
- ✅ Accès aux profils via interface chat

### Fichiers à documenter :

#### 🔹 `src/pages/livechat/index.ts`
**Rôle :** Point d'entrée du module Live Chat
**À documenter :**
- Fonction `initLiveChat()`
- Vérification d'authentification
- Initialisation du ChatInterfaceManager

#### 🔹 `src/pages/livechat/chat_ui_manager.ts`
**Rôle :** Gestionnaire principal de l'interface chat
**À documenter :**
- Classe `ChatInterfaceManager`
- Méthodes d'initialisation du chat
- Gestion des messages (envoi/réception)
- Système d'invitation aux parties
- Gestion des boutons (block/invite)

#### 🔹 `src/services/socket/index.ts`
**Rôle :** Service WebSocket principal
**À documenter :**
- Export des services socket
- Gestion des connexions
- Événements socket

#### 🔹 `src/services/socket/socket_connection.ts`
**Rôle :** Gestionnaire de connexion WebSocket
**À documenter :**
- Établissement de la connexion
- Gestion des reconnexions
- Authentification socket

#### 🔹 `src/services/socket/chat_messages_manager.ts`
**Rôle :** Gestionnaire des messages chat
**À documenter :**
- Envoi/réception de messages
- Format des messages
- Gestion des erreurs

#### 🔹 `src/services/socket/online_users_manager.ts`
**Rôle :** Gestionnaire des utilisateurs en ligne
**À documenter :**
- Liste des utilisateurs connectés
- Événements de connexion/déconnexion
- Mise à jour en temps réel

#### 🔹 `src/services/socket/user_blocking_manager.ts`
**Rôle :** Système de blocage d'utilisateurs
**À documenter :**
- Liste des utilisateurs bloqués
- Logique de blocage/déblocage
- Filtrage des messages

#### 🔹 `src/services/tournament_ping_service.ts`
**Rôle :** Service de notifications tournoi
**À documenter :**
- Notifications de prochains matchs
- Intégration avec le système de chat

---

## 📋 MODULE 2: FRAMEWORK/TOOLKIT

### Objectifs du module :
- ✅ Utilisation de TypeScript
- ✅ Utilisation de Tailwind CSS
- ✅ Architecture frontend propre

### Fichiers à documenter :

#### 🔹 `src/index.ts`
**Rôle :** Point d'entrée principal de l'application
**À documenter :**
- Imports des modules principaux
- Fonction `showPage()` (navigation)
- Initialisations des services
- Gestion des routes/hash

#### 🔹 `src/style.css`
**Rôle :** Feuille de styles principale avec Tailwind CSS
**À documenter :**
- Configuration Tailwind
- Classes utilitaires utilisées
- Thème personnalisé (variables CSS)

---

## 📋 MODULE 3: USER MANAGEMENT

### Objectifs du module :
- ✅ Authentification (login/signup)
- ✅ Gestion des profils utilisateurs
- ✅ Système d'amis et statut en ligne
- ✅ Avatars et informations personnelles
- ✅ Historique des matchs et statistiques
- ✅ Gestion des noms d'utilisateur/email dupliqués

### Fichiers à documenter :

#### 🔹 `src/pages/login.ts`
**Rôle :** Page de connexion
**À documenter :**
- Fonction `initLogin()`
- Validation des champs
- Gestion des erreurs
- Redirections après connexion

#### 🔹 `src/pages/signup.ts`
**Rôle :** Page d'inscription
**À documenter :**
- Fonction `initSignup()`
- Validation des données
- Gestion des doublons (username/email)
- Sécurité des mots de passe

#### 🔹 `src/pages/profile/index.ts`
**Rôle :** Point d'entrée du module profil
**À documenter :**
- Fonction `initProfile()`
- Vérifications d'accès

#### 🔹 `src/pages/profile/profile_manager.ts`
**Rôle :** Gestionnaire complet du profil utilisateur
**À documenter :**
- Classe `ProfileManager`
- Chargement des données profil
- Édition du profil (nom, email, mot de passe)
- Upload d'avatar
- Historique des matchs
- Statistiques (victoires/défaites)
- Suppression de compte

#### 🔹 `src/services/api/user_api_service.ts`
**Rôle :** Service API pour les utilisateurs
**À documenter :**
- Méthodes CRUD utilisateur
- Gestion des erreurs API
- Authentification des requêtes

#### 🔹 `src/SecurityUtils.ts` & `src/utils/SecurityUtils.ts`
**Rôle :** Utilitaires de sécurité
**À documenter :**
- Validation des données
- Sanitisation des inputs
- Gestion des mots de passe
- Protection XSS

#### 🔹 `src/utils/friends_manager.ts`
**Rôle :** Gestionnaire du système d'amis
**À documenter :**
- Classe `FriendsManager`
- Stockage persistant des amis
- Méthodes CRUD amis
- Événements de mise à jour

#### 🔹 `src/components/online_friends_widget.ts`
**Rôle :** Composant UI pour les amis en ligne
**À documenter :**
- Classe `OnlineFriendsWidget`
- Rendu de la liste d'amis
- Interactions utilisateur
- Intégration avec le socket

#### 🔹 `src/utils/data_types.ts`
**Rôle :** Types TypeScript de l'application
**À documenter :**
- Interfaces utilisateur
- Types de messages
- Types de jeu/tournoi

#### 🔹 `src/utils/app_constants.ts`
**Rôle :** Constantes de l'application
**À documenter :**
- Valeurs de configuration
- Clés de stockage
- Limites et contraintes

---

## 📝 STRUCTURE DE DOCUMENTATION RECOMMANDÉE

Pour chaque fichier, documenter :

### 1. **Vue d'ensemble**
- Rôle et responsabilité
- Relations avec autres modules

### 2. **API Publique**
- Fonctions/classes exportées
- Paramètres et retours
- Événements émis

### 3. **Logique métier**
- Algorithmes importants
- Gestion d'état
- Persistance des données

### 4. **Intégrations**
- Services utilisés
- Événements écoutés/émis
- API endpoints

### 5. **Sécurité**
- Validation des données
- Authentification
- Sanitisation

### 6. **Tests et edge cases**
- Gestion d'erreurs
- États limites

---

## 🔍 POINTS IMPORTANTS À METTRE EN ÉVIDENCE

- **Architecture modulaire** et séparation des responsabilités
- **Utilisation de TypeScript** : types, interfaces, sécurité
- **Tailwind CSS** : classes utilitaires, responsive design
- **WebSocket** : communication temps réel
- **Sécurité** : validation, sanitisation, authentification
- **UX/UI** : gestion d'état, feedback utilisateur
- **Performance** : optimisation, gestion mémoire

---

## 📊 MÉTRIQUES DE COUVERTURE

- **Live Chat** : 8 fichiers
- **Framework** : 2 fichiers
- **User Management** : 10 fichiers
- **Total** : **20 fichiers** à documenter

---

## 🎯 CHECKLIST DE VALIDATION

- [ ] **Live Chat** : Messages directs, blocage, invitations, notifications, profils
- [ ] **Framework** : TypeScript + Tailwind CSS utilisés correctement
- [ ] **User Management** : Auth, profils, amis, stats, historique

**Bonne chance pour ta documentation !** 🚀</content>
<parameter name="old_string"># 📚 Documentation Guide - ft_transcendence Frontend

## 🎯 Vue d'ensemble

Ce guide liste tous les fichiers à documenter pour l'évaluation des modules suivants :

- **Major Module: Live Chat**
- **Minor Module: Framework/Toolkit (Tailwind CSS + TypeScript)**
- **Major Module: User Management**

---

## 📋 MODULE 1: LIVE CHAT

### Objectifs du module :
- ✅ Messages directs entre utilisateurs
- ✅ Système de blocage d'utilisateurs
- ✅ Invitations aux parties Pong via chat
- ✅ Notifications tournoi
- ✅ Accès aux profils via interface chat

### Fichiers à documenter :

#### 🔹 `src/pages/livechat/index.ts`
**Rôle :** Point d'entrée du module Live Chat
**À documenter :**
- Fonction `initLiveChat()`
- Vérification d'authentification
- Initialisation du ChatInterfaceManager

#### 🔹 `src/pages/livechat/chat_ui_manager.ts`
**Rôle :** Gestionnaire principal de l'interface chat
**À documenter :**
- Classe `ChatInterfaceManager`
- Méthodes d'initialisation du chat
- Gestion des messages (envoi/réception)
- Système d'invitation aux parties
- Gestion des boutons (block/invite)

#### 🔹 `src/services/socket/index.ts`
**Rôle :** Service WebSocket principal
**À documenter :**
- Export des services socket
- Gestion des connexions
- Événements socket

#### 🔹 `src/services/socket/socket_connection.ts`
**Rôle :** Gestionnaire de connexion WebSocket
**À documenter :**
- Établissement de la connexion
- Gestion des reconnexions
- Authentification socket

#### 🔹 `src/services/socket/chat_messages_manager.ts`
**Rôle :** Gestionnaire des messages chat
**À documenter :**
- Envoi/réception de messages
- Format des messages
- Gestion des erreurs

#### 🔹 `src/services/socket/online_users_manager.ts`
**Rôle :** Gestionnaire des utilisateurs en ligne
**À documenter :**
- Liste des utilisateurs connectés
- Événements de connexion/déconnexion
- Mise à jour en temps réel

#### 🔹 `src/services/socket/user_blocking_manager.ts`
**Rôle :** Système de blocage d'utilisateurs
**À documenter :**
- Liste des utilisateurs bloqués
- Logique de blocage/déblocage
- Filtrage des messages

#### 🔹 `src/services/tournament_ping_service.ts`
**Rôle :** Service de notifications tournoi
**À documenter :**
- Notifications de prochains matchs
- Intégration avec le système de chat

---

## 📋 MODULE 2: FRAMEWORK/TOOLKIT

### Objectifs du module :
- ✅ Utilisation de TypeScript
- ✅ Utilisation de Tailwind CSS
- ✅ Architecture frontend propre

### Fichiers à documenter :

#### 🔹 `src/index.ts`
**Rôle :** Point d'entrée principal de l'application
**À documenter :**
- Imports des modules principaux
- Fonction `showPage()` (navigation)
- Initialisations des services
- Gestion des routes/hash

#### 🔹 `src/style.css`
**Rôle :** Feuille de styles principale avec Tailwind CSS
**À documenter :**
- Configuration Tailwind
- Classes utilitaires utilisées
- Thème personnalisé (variables CSS)

---

## 📋 MODULE 3: USER MANAGEMENT

### Objectifs du module :
- ✅ Authentification (login/signup)
- ✅ Gestion des profils utilisateurs
- ✅ Système d'amis et statut en ligne
- ✅ Avatars et informations personnelles
- ✅ Historique des matchs et statistiques
- ✅ Gestion des noms d'utilisateur/email dupliqués

### Fichiers à documenter :

#### 🔹 `src/pages/login.ts`
**Rôle :** Page de connexion
**À documenter :**
- Fonction `initLogin()`
- Validation des champs
- Gestion des erreurs
- Redirections après connexion

#### 🔹 `src/pages/signup.ts`
**Rôle :** Page d'inscription
**À documenter :**
- Fonction `initSignup()`
- Validation des données
- Gestion des doublons (username/email)
- Sécurité des mots de passe

#### 🔹 `src/pages/profile/index.ts`
**Rôle :** Point d'entrée du module profil
**À documenter :**
- Fonction `initProfile()`
- Vérifications d'accès

#### 🔹 `src/pages/profile/profile_manager.ts`
**Rôle :** Gestionnaire complet du profil utilisateur
**À documenter :**
- Classe `ProfileManager`
- Chargement des données profil
- Édition du profil (nom, email, mot de passe)
- Upload d'avatar
- Historique des matchs
- Statistiques (victoires/défaites)
- Suppression de compte

#### 🔹 `src/services/api/user_api_service.ts`
**Rôle :** Service API pour les utilisateurs
**À documenter :**
- Méthodes CRUD utilisateur
- Gestion des erreurs API
- Authentification des requêtes

#### 🔹 `src/SecurityUtils.ts` & `src/utils/SecurityUtils.ts`
**Rôle :** Utilitaires de sécurité
**À documenter :**
- Validation des données
- Sanitisation des inputs
- Gestion des mots de passe
- Protection XSS

#### 🔹 `src/utils/friends_manager.ts`
**Rôle :** Gestionnaire du système d'amis
**À documenter :**
- Classe `FriendsManager`
- Stockage persistant des amis
- Méthodes CRUD amis
- Événements de mise à jour

#### 🔹 `src/components/online_friends_widget.ts`
**Rôle :** Composant UI pour les amis en ligne
**À documenter :**
- Classe `OnlineFriendsWidget`
- Rendu de la liste d'amis
- Interactions utilisateur
- Intégration avec le socket

#### 🔹 `src/utils/data_types.ts`
**Rôle :** Types TypeScript de l'application
**À documenter :**
- Interfaces utilisateur
- Types de messages
- Types de jeu/tournoi

#### 🔹 `src/utils/app_constants.ts`
**Rôle :** Constantes de l'application
**À documenter :**
- Valeurs de configuration
- Clés de stockage
- Limites et contraintes

---

## 🎯 FICHIERS GAME LIÉS AUX MODULES

### (À documenter seulement si pertinents pour les modules ci-dessus)

#### 🔹 `src/game/TournamentManager.ts`
**Lié à :** Notifications tournoi dans le chat
**À documenter :** Logique de création des matchs, notifications

#### 🔹 `src/game/PlayerManager.ts`
**Lié à :** Profils utilisateurs et statistiques
**À documenter :** Gestion des joueurs, statistiques

---

## 📝 STRUCTURE DE DOCUMENTATION RECOMMANDÉE

Pour chaque fichier, documenter :

### 1. **Vue d'ensemble**
- Rôle et responsabilité
- Relations avec autres modules

### 2. **API Publique**
- Fonctions/classes exportées
- Paramètres et retours
- Événements émis

### 3. **Logique métier**
- Algorithmes importants
- Gestion d'état
- Persistance des données

### 4. **Intégrations**
- Services utilisés
- Événements écoutés/émis
- API endpoints

### 5. **Sécurité**
- Validation des données
- Authentification
- Sanitisation

### 6. **Tests et edge cases**
- Gestion d'erreurs
- États limites

---

## 🔍 POINTS IMPORTANTS À METTRE EN ÉVIDENCE

- **Architecture modulaire** et séparation des responsabilités
- **Utilisation de TypeScript** : types, interfaces, sécurité
- **Tailwind CSS** : classes utilitaires, responsive design
- **WebSocket** : communication temps réel
- **Sécurité** : validation, sanitisation, authentification
- **UX/UI** : gestion d'état, feedback utilisateur
- **Performance** : optimisation, gestion mémoire

---

## 📊 MÉTRIQUES DE COUVERTURE

- **Live Chat** : ~7 fichiers
- **Framework** : 2 fichiers
- **User Management** : ~8 fichiers
- **Total estimé** : ~17 fichiers

**Bon courage pour la documentation !** 🚀</content>
<parameter name="filePath">c:\Users\Powlar\Desktop\ft_transcendence\srcs\requierements\frontend\DOCUMENTATION_GUIDE.md