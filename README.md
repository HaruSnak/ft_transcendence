<img src="readme/ft_transcendence.png" alt="ft_transcendence" width="900"/>

<div align="center">

# ft_transcendence
### A Full-Stack Web Application for Online Pong with Tournaments and Chat at 42 School

[![Contributors][contributors-shield]][contributors-url]
[![Forks][forks-shield]][forks-url]
[![Stargazers][stars-shield]][stars-url]
[![Issues][issues-shield]][issues-url]
[![License][license-shield]][license-url]

</div>

---

## 🇬🇧 English

<details>
<summary><b>📖 Click to expand/collapse English version</b></summary>

### 📖 About

**ft_transcendence** is a compulsory project for 42 School students. It consists of creating a full-stack web application implementing an online Pong game with tournaments, live chat, and user management. The application features multiplayer gameplay, AI opponents, real-time communication, and comprehensive DevOps monitoring.

This project teaches:
- Full-stack web development with microservices architecture
- Backend development with Node.js and Fastify
- Frontend development with TypeScript and modern frameworks
- Database management and authentication
- Real-time communication with WebSockets
- DevOps practices including containerization, logging, and monitoring
- Security best practices and HTTPS implementation

### 🧠 Skills Learned

By completing the ft_transcendence project, students develop essential skills in web development and DevOps:

- **Microservices Architecture**: Designing and implementing scalable backend services.
- **RESTful APIs and WebSockets**: Building robust APIs for communication between services.
- **Database Integration**: Using SQLite for data persistence with proper CRUD operations.
- **Frontend Frameworks**: Developing SPAs with TypeScript, Tailwind CSS, and HTML5 Canvas.
- **Authentication & Security**: Implementing JWT-based auth, XSS protection, and HTTPS.
- **Game Development**: Creating real-time multiplayer games with AI opponents.
- **DevOps Stack**: Setting up ELK for logging, Prometheus/Grafana for monitoring.
- **Containerization**: Using Docker and Docker Compose for deployment.
- **Tournament Systems**: Implementing bracket-based tournaments with match tracking.
- **Real-Time Features**: Live chat and game synchronization.

## Approach
This project was developed collaboratively by a team of three: Astoll, Powlar, and HaruSnak. We divided the work to cover all major requirements:

- **Astoll** handled the database backend and user management with authentication.
- **Powlar** managed the frontend framework and live chat functionality.
- **HaruSnak** took care of the DevOps infrastructure, backend framework, AI opponent, tournaments, and security features.

The application follows a microservices architecture with independent services communicating via APIs, all containerized for easy deployment.

### **Features**

**Microservices Backend:** *Node.js/Fastify services for auth, chat, game, and user management.*<br>

**Real-Time Gameplay:** *Multiplayer Pong with AI opponents and tournament support.*<br>

**Live Chat:** *WebSocket-based messaging with global and private channels.*<br>

**DevOps Monitoring:** *ELK stack for logging, Prometheus/Grafana for metrics.*<br>

**Security & HTTPS:** *JWT authentication, input validation, and SSL encryption.*<br>

**Tournament System:** *Bracket-based tournaments with match statistics.*<br>

### **Features to be added:**

**Advanced AI:** *More sophisticated AI difficulty levels and learning algorithms.*<br>

**Mobile Support:** *Responsive design for mobile devices.*<br>

**Spectator Mode:** *Allow users to watch ongoing matches.*<br>

**Custom Game Modes:** *Additional variations of Pong gameplay.*<br>

### 📋 Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
- [Project Structure](#project-structure)
- [Development](#development)
- [Credits](#credits)

<a name="features"></a>

### ✨ Features

- **Full-Stack Web Application** with microservices architecture
- **Real-Time Pong Game** with multiplayer and AI opponents
- **Tournament System** with bracket management and statistics
- **Live Chat** with WebSocket communication
- **User Management** with JWT authentication and profiles
- **DevOps Stack** including ELK, Prometheus, and Grafana
- **Docker Deployment** with containerized services
- **Security Features** with HTTPS, XSS protection, and input validation

<a name="installation"></a>

### 🚀 Installation

```bash
# Clone the repository
git clone https://github.com/HaruSnak/42-ft_transcendence
cd 42-ft_transcendence

# Start all services
make all
```

<a name="usage"></a>

### 💻 Usage

Access the application:
- **Frontend**: https://localhost:8443
- **Kibana**: http://localhost:5601
- **Grafana**: http://localhost:3010
- **Prometheus**: http://localhost:9090

Controls (in game):
- **Arrow Keys or WASD**: Move paddle
- **Mouse**: Navigate UI

<a name="project-structure"></a>

### 📂 Project Structure

```
42-ft_transcendence/
├── Makefile                    # Build script
├── docker-compose.yml          # Docker orchestration
├── LICENSE                     # License file
├── README.md                   # This file
├── README-Template.md          # Template for README
├── readme/                     # README assets
├── srcs/                       # Source code
│   ├── requirements/
│   │   ├── elk/                # ELK stack configs
│   │   ├── frontend/           # Frontend application
│   │   ├── grafana/            # Grafana dashboards
│   │   ├── nginx/              # Nginx config
│   │   ├── prometheus/         # Monitoring configs
│   │   └── services/           # Backend services
│   │       ├── chat-service/
│   │       ├── user-service/
│   │       └── ...
└── ...
```

<a name="development"></a>

### 🔧 Development

#### Prerequisites
- Docker and Docker Compose
- Node.js (for local development)

#### Environment Setup
```bash
# Configure environment variables
cp .env.example .env
# Edit .env with your settings

# Build and run
make build
make up
```

#### Testing
```bash
# Health checks
curl http://localhost:3001/health  # Chat service
curl http://localhost:3003/health  # User service

# API testing
curl https://localhost:8443/api/auth/login
```

### 📚 API Reference

#### Main Services
- **Auth Service**: User authentication and JWT management
- **Chat Service**: Real-time messaging via WebSockets
- **Game Service**: Pong game logic and tournament management
- **User Service**: User profiles and statistics

#### Key Endpoints
- `POST /api/auth/login` - User login
- `GET /api/game/matches` - Get match history
- `WS /api/chat` - WebSocket chat connection

### 👨‍🎓 Note
<p align="left">
<img width="198" height="171" alt="image" src="https://github.com/user-attachments/assets/2c722f1b-b820-4dd7-b813-ccaaa2600c3c" />

</p>

<a name="credits"></a>

### 📖 Credits

- **Documentation Fastify** : [Fastify.dev](https://fastify.dev/)
- **Documentation Docker** : [Docker.com](https://docs.docker.com/)
- **Documentation JavaScript** : [Developer Mozilla](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
- **Documentation TypeScript** : [Typescriptlang](https://www.typescriptlang.org/docs/)
- **Documentation attacks XXS** : [Owasp](https://owasp.org/www-community/attacks/xss/)
- **Documentation SQL Injection** : [Owasp](https://owasp.org/www-community/attacks/SQL_Injection)
- **Stack ELK** : [Elastic.co](https://www.elastic.co/)

### 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

</details>

---

## 🇫🇷 Français

<details>
<summary><b>📖 Cliquez pour développer/réduire la version française</b></summary>

### 📖 À propos

**ft_transcendence** est un projet obligatoire pour les étudiants de l'école 42. Il s'agit de créer une application web full-stack implémentant un jeu Pong en ligne avec tournois, chat en direct et gestion des utilisateurs. L'application propose un gameplay multijoueur, des adversaires IA, une communication en temps réel et une surveillance DevOps complète.

Ce projet enseigne :
- Le développement web full-stack avec architecture microservices
- Le développement backend avec Node.js et Fastify
- Le développement frontend avec TypeScript et frameworks modernes
- La gestion de base de données et l'authentification
- La communication en temps réel avec WebSockets
- Les pratiques DevOps incluant la conteneurisation, les logs et la surveillance
- Les meilleures pratiques de sécurité et l'implémentation HTTPS

### 🧠 Compétences acquises

En complétant le projet ft_transcendence, les étudiants développent des compétences essentielles en développement web et DevOps :

- **Architecture Microservices** : Concevoir et implémenter des services backend évolutifs.
- **APIs RESTful et WebSockets** : Construire des APIs robustes pour la communication entre services.
- **Intégration Base de Données** : Utiliser SQLite pour la persistance des données avec opérations CRUD appropriées.
- **Frameworks Frontend** : Développer des SPAs avec TypeScript, Tailwind CSS et HTML5 Canvas.
- **Authentification & Sécurité** : Implémenter une auth basée JWT, protection XSS et HTTPS.
- **Développement de Jeux** : Créer des jeux multijoueurs en temps réel avec adversaires IA.
- **Stack DevOps** : Configurer ELK pour les logs, Prometheus/Grafana pour les métriques.
- **Conteneurisation** : Utiliser Docker et Docker Compose pour le déploiement.
- **Systèmes de Tournois** : Implémenter des tournois à base de brackets avec suivi des matchs.
- **Fonctionnalités Temps Réel** : Chat en direct et synchronisation de jeu.

## Approche
Ce projet a été développé de manière collaborative par une équipe de trois personnes : Astoll, Powlar et HaruSnak. Nous avons divisé le travail pour couvrir toutes les exigences majeures :

- **Astoll** s'est occupé du backend base de données et de la gestion des utilisateurs avec authentification.
- **Powlar** a géré le framework frontend et les fonctionnalités de chat en direct.
- **HaruSnak** s'est chargé de l'infrastructure DevOps, du framework backend, de l'adversaire IA, des tournois et des fonctionnalités de sécurité.

L'application suit une architecture microservices avec des services indépendants communiquant via des APIs, tous conteneurisés pour un déploiement facile.

### **Fonctionnalités**

**Backend Microservices :** *Services Node.js/Fastify pour l'auth, le chat, le jeu et la gestion des utilisateurs.*<br>

**Gameplay Temps Réel :** *Pong multijoueur avec adversaires IA et support des tournois.*<br>

**Chat en Direct :** *Messagerie basée WebSocket avec canaux globaux et privés.*<br>

**Surveillance DevOps :** *Stack ELK pour les logs, Prometheus/Grafana pour les métriques.*<br>

**Sécurité & HTTPS :** *Authentification JWT, validation des entrées et chiffrement SSL.*<br>

**Système de Tournois :** *Tournois à base de brackets avec statistiques des matchs.*<br>

### **Fonctionnalités à ajouter :**

**IA Avancée :** *Niveaux de difficulté IA plus sophistiqués et algorithmes d'apprentissage.*<br>

**Support Mobile :** *Design responsive pour appareils mobiles.*<br>

**Mode Spectateur :** *Permettre aux utilisateurs de regarder les matchs en cours.*<br>

**Modes de Jeu Personnalisés :** *Variations supplémentaires du gameplay Pong.*<br>

### 📋 Table des matières

- [Caractéristiques](#caractéristiques)
- [Installation](#installation-1)
- [Utilisation](#utilisation)
- [Structure du projet](#structure-du-projet)
- [Développement](#développement)
- [Crédits](#crédits-1)

<a name="caractéristiques"></a>

### ✨ Caractéristiques

- **Application Web Full-Stack** avec architecture microservices
- **Jeu Pong Temps Réel** avec multijoueur et adversaires IA
- **Système de Tournois** avec gestion des brackets et statistiques
- **Chat en Direct** avec communication WebSocket
- **Gestion des Utilisateurs** avec authentification JWT et profils
- **Stack DevOps** incluant ELK, Prometheus et Grafana
- **Déploiement Docker** avec services conteneurisés
- **Fonctionnalités de Sécurité** avec HTTPS, protection XSS et validation des entrées

<a name="installation-1"></a>

### 🚀 Installation

```bash
# Cloner le dépôt
git clone https://github.com/HaruSnak/42-ft_transcendence
cd 42-ft_transcendence

# Démarrer tous les services
make all
```

<a name="utilisation"></a>

### 💻 Utilisation

Accéder à l'application :
- **Frontend** : https://localhost:8443
- **Kibana** : http://localhost:5601
- **Grafana** : http://localhost:3010
- **Prometheus** : http://localhost:9090

Contrôles (dans le jeu) :
- **Flèches ou WASD** : Déplacer la raquette

- **Souris** : Naviguer dans l'interface

<a name="structure-du-projet"></a>

### 📂 Structure du projet

```
42-ft_transcendence/
├── Makefile                    # Script de build
├── docker-compose.yml          # Orchestration Docker
├── LICENSE                     # Fichier de licence
├── README.md                   # Ce fichier
├── README-Template.md          # Template pour README
├── readme/                     # Ressources README
├── srcs/                       # Code source
│   ├── requirements/
│   │   ├── elk/                # Configs ELK
│   │   ├── frontend/           # Application frontend
│   │   ├── grafana/            # Dashboards Grafana
│   │   ├── nginx/              # Config Nginx
│   │   ├── prometheus/         # Configs surveillance
│   │   └── services/           # Services backend
│   │       ├── chat-service/
│   │       ├── user-service/
│   │       └── ...
└── ...
```

<a name="développement"></a>

### 🔧 Développement

#### Prérequis
- Docker et Docker Compose
- Node.js (pour développement local)

#### Configuration de l'environnement
```bash
# Configurer les variables d'environnement
cp .env.example .env
# Éditer .env avec vos paramètres

# Construire et exécuter
make build
make up
```

#### Tests
```bash
# Vérifications de santé
curl http://localhost:3001/health  # Service chat
curl http://localhost:3003/health  # Service utilisateur

# Tests API
curl https://localhost:8443/api/auth/login
```

### 📚 Référence API

#### Services principaux
- **Service Auth** : Authentification utilisateur et gestion JWT
- **Service Chat** : Messagerie temps réel via WebSockets
- **Service Jeu** : Logique du jeu Pong et gestion des tournois
- **Service Utilisateur** : Profils utilisateur et statistiques

#### Endpoints clés
- `POST /api/auth/login` - Connexion utilisateur
- `GET /api/game/matches` - Obtenir l'historique des matchs
- `WS /api/chat` - Connexion WebSocket chat

### 👨‍🎓 Note
<p align="left">
<img width="198" height="171" alt="image" src="https://github.com/user-attachments/assets/c6611943-f93e-4905-9548-4a6dbce0a951" />

</p>

<a name="crédits-1"></a>

### 📖 Crédits

- **Documentation Fastify** : [Fastify.dev](https://fastify.dev/)
- **Documentation Docker** : [Docker.com](https://docs.docker.com/)
- **Documentation JavaScript** : [Developer Mozilla](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
- **Documentation TypeScript** : [Typescriptlang](https://www.typescriptlang.org/docs/)
- **Documentation attacks XXS** : [Owasp](https://owasp.org/www-community/attacks/xss/)
- **Documentation SQL Injection** : [Owasp](https://owasp.org/www-community/attacks/SQL_Injection)
- **Stack ELK** : [Elastic.co](https://www.elastic.co/)


### 📄 Licence

Ce projet est sous licence **MIT** - voir le fichier [LICENSE](LICENSE) pour plus de détails.

</details>

---

[contributors-shield]: https://img.shields.io/github/contributors/HaruSnak/42-ft_transcendence.svg?style=for-the-badge
[contributors-url]: https://github.com/HaruSnak/42-ft_transcendence/graphs/contributors
[forks-shield]: https://img.shields.io/github/forks/HaruSnak/42-ft_transcendence.svg?style=for-the-badge
[forks-url]: https://github.com/HaruSnak/42-ft_transcendence/network/members
[stars-shield]: https://img.shields.io/github/stars/HaruSnak/42-ft_transcendence.svg?style=for-the-badge
[stars-url]: https://github.com/HaruSnak/42-ft_transcendence/stargazers
[issues-shield]: https://img.shields.io/github/issues/HaruSnak/42-ft_transcendence.svg?style=for-the-badge
[issues-url]: https://github.com/HaruSnak/42-ft_transcendence/issues
[linkedin-shield]: https://img.shields.io/badge/-LinkedIn-black.svg?style=for-the-badge&logo=linkedin&colorB=555
[linkedin-url]: https://www.linkedin.com/in/shany-moreno-5a863b2aa
[license-shield]: https://img.shields.io/github/license/HaruSnak/42-ft_transcendence.svg?style=for-the-badge
[license-url]: https://github.com/HaruSnak/42-ft_transcendence/blob/master/LICENSE
