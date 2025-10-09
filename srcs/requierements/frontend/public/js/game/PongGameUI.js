import { PongGame } from './PongBase.js';
import { TournamentManager } from './TournamentManager.js';
import { OneVsOneManager } from './LocalModeManager.js';
import { SecurityUtils } from '../SecurityUtils.js';
export class PongGameUI extends SecurityUtils {
    /*
    Constructeur - Initialise tous les composants du jeu
    Crée l'instance du jeu Pong et les gestionnaires de modes
    Configure les écouteurs d'événements et affiche le menu principal
    */
    constructor() {
        super();
        // ==================== Éléments d'interface - Gameplay ====================
        // Boutons de contrôle du jeu pendant la partie
        this.buttonStart = document.getElementById('buttonStartGame');
        this.buttonPause = document.getElementById('buttonPauseGame');
        // Conteneurs d'affichage pendant la partie
        this.divInterfaceInGame = document.getElementById('ingame-button');
        this.divMessageWinOrLose = document.getElementById('gameMessageWinOrLose');
        this.divScoreInGame = document.getElementById('scoreInGame');
        // ==================== Éléments d'interface - Menu principal ====================
        // Sélection du mode de jeu (Practice contre IA / Local 1v1 / Tournament)
        this.divInterfaceMainMenu = document.getElementById('main-menu-game');
        this.buttonPractice = document.getElementById('buttonPracticeGame'); // Mode IA
        this.buttonPlyLocal = document.getElementById('buttonPlyLocalGame'); // Mode 1v1
        this.buttonTournament = document.getElementById('buttonTournamentGame'); // Mode Tournoi
        // ==================== Éléments d'interface - Système de login ====================
        // Formulaire d'authentification des joueurs
        this.inputLoginGM = document.getElementById('inputLoginGM');
        this.inputPasswordGM = document.getElementById('inputPasswordGM');
        this.buttonAddLogin = document.getElementById('buttonAddLogginGM');
        this.buttonLaunchGame = document.getElementById('buttonLaunchGame');
        // Affichage des profils utilisateurs connectés
        this.divProfileUser = document.getElementById('profile-user');
        this.divInterfaceLogin = document.getElementById('menu-add-login');
        // État actuel du mode de jeu
        this.currentMode = null;
        this.pongGame = new PongGame(this.buttonStart, this.buttonPause, this.divMessageWinOrLose, this.divScoreInGame);
        this.tournaments = new TournamentManager;
        this.oneVsOne = new OneVsOneManager;
        this.listenButtons();
        this.showMainMenu();
    }
    /*
    Affiche le menu principal et masque les autres interfaces
    Réinitialise le mode de jeu actuel à null
    */
    showMainMenu() {
        this.divInterfaceMainMenu.style.display = 'block';
        this.divScoreInGame.style.display = 'none';
        this.pongGame.canvas.style.display = 'none';
        this.divInterfaceInGame.style.display = 'none';
        this.currentMode = null;
    }
    /*
    Retourne le gestionnaire approprié selon le mode actuel
    @returns TournamentManager si mode tournoi, sinon OneVsOneManager
    */
    getCurrentManager() {
        return this.currentMode === 'tournament' ? this.tournaments : this.oneVsOne;
    }
    /*
    Réinitialise visuellement les champs du formulaire (couleurs et textes)
    Utilise setTimeout() pour un délai de 2 secondes avant le reset
    @param fields - Tableau des champs à réinitialiser ('username' ou 'password')
    */
    clearStatusVisual(fields) {
        fields.forEach(fieldsType => {
            const container = this.divInterfaceLogin.querySelector(`.input-${fieldsType}-ui`);
            const label = container.querySelector(`label`);
            const input = container.querySelector(`input`);
            const errorMsg = container.querySelector('p');
            setTimeout(() => {
                label.style.color = ``;
                input.style.borderColor = ``;
                errorMsg.textContent = ``;
            }, 2000);
        });
    }
    /*
    Affiche visuellement le succès ou l'erreur de l'authentification
    Change les couleurs des champs (vert pour succès, rouge pour erreur)
    Affiche les messages d'erreur appropriés selon le contexte
    @param isSuccess - true si l'authentification a réussi
    @param fields - Champs concernés par le feedback visuel
    */
    uiSuccessFullOrError(isSuccess, fields) {
        fields.forEach(fieldsType => {
            const container = this.divInterfaceLogin.querySelector(`.input-${fieldsType}-ui`);
            const label = container.querySelector(`label`);
            const input = container.querySelector(`input`);
            const errorMsg = container.querySelector('p');
            const color = isSuccess ? '#10b981' : '#ef4444';
            label.style.color = color;
            input.style.borderColor = color;
            errorMsg.textContent = ``;
            if (!isSuccess) {
                if (!fields.includes('password')) {
                    this.divInterfaceLogin.querySelector(`.input-password-ui p`).textContent = ``;
                    this.clearStatusVisual(['password']);
                    errorMsg.textContent = `Username already taken or invalid`;
                }
                else {
                    this.divInterfaceLogin.querySelector(`.input-username-ui p`).textContent = ``;
                    errorMsg.textContent = `Password does not match username`;
                }
            }
            else if (isSuccess && fieldsType === 'username')
                this.clearStatusVisual(['username', 'password']);
            input.value = ``;
        });
    }
    /*
    Valide le nom d'utilisateur selon les règles définies
    Utilise validateUsername() de SecurityUtils (classe parente)
    Affiche les messages d'erreur appropriés en cas d'échec
    @param username - Le nom d'utilisateur à valider
    @returns true si valide, false sinon
    */
    verificationUserName(username) {
        const validationCode = this.validateUsername(username);
        if (validationCode === 0) {
            return (true);
        }
        const inputPassword = this.divInterfaceLogin.querySelector('.input-password-ui p');
        if (inputPassword) {
            inputPassword.textContent = '';
        }
        this.clearStatusVisual(['password']);
        const errorMsg = this.divInterfaceLogin.querySelector('.input-username-ui p');
        if (errorMsg) {
            const message = PongGameUI.USERNAME_ERROR_MESSAGES.get(validationCode) || 'Erreur inconnue';
            errorMsg.textContent = message;
        }
        return (false);
    }
    /*
        Supprime tous les éléments de profil affichés (sauf le titre h3)
        Utilise querySelectorAll() avec sélecteur CSS pour cibler les profils
    */
    clearAllProfiles() {
        const profiles = this.divProfileUser.querySelectorAll('div:not(h3)');
        profiles.forEach(profile => profile.remove());
    }
    /*
        Crée un élément DOM représentant un joueur à partir d'un template
        Clone le template HTML et remplit les données (username, type)
    */
    createPlayerElement(username, type) {
        const profileTemplate = document.getElementById('profile-template');
        const profileClone = profileTemplate.content.cloneNode(true);
        const playerDiv = profileClone.firstElementChild;
        playerDiv.className += ' w-48 h-16 min-w-48 max-w-48';
        profileClone.querySelector('.profile-username').textContent = username;
        profileClone.querySelector('.profile-type').textContent = type;
        return (playerDiv);
    }
    /*
        Vérifie si un joueur est déjà connecté et l'affiche
        Utilise le gestionnaire actuel pour vérifier la session active
        Ajoute le profil à l'interface si une session est trouvée
    */
    async isPlayerActive() {
        const currentManager = this.getCurrentManager();
        const check = await currentManager.isPlayerConnected();
        if (!check)
            return;
        else {
            const ply = this.createPlayerElement(this.inputLoginGM.value, 'User Session');
            this.divProfileUser.appendChild(ply);
        }
    }
    /*
        Gère l'authentification des joueurs (Guest ou User avec mot de passe)
        Supporte les deux modes : Tournament et Local
        Valide les données, crée les profils et met à jour l'interface
        Utilise le gestionnaire approprié selon currentMode
    */
    async handleAuthentication() {
        this.divInterfaceMainMenu.style.display = 'none';
        this.divInterfaceLogin.style.display = 'block';
        document.getElementById('game').querySelector('p').style.display = 'none';
        this.isPlayerActive();
        this.updateLaunchButtonVisibility();
        if (this.inputLoginGM.value) {
            if (!this.verificationUserName(this.inputLoginGM.value))
                return;
            const currentManager = this.getCurrentManager();
            if (!this.inputPasswordGM.value) {
                const result = await currentManager.initDataPlayer('Guest', this.inputLoginGM.value);
                if (!result) {
                    this.uiSuccessFullOrError(false, [`username`]);
                }
                else {
                    const plyGuest = this.createPlayerElement(this.inputLoginGM.value, 'Guest');
                    this.divProfileUser.appendChild(plyGuest);
                    this.uiSuccessFullOrError(true, [`username`]);
                }
            }
            else {
                const resultLogin = await currentManager.initDataPlayer('User', this.inputLoginGM.value, this.inputPasswordGM.value);
                if (resultLogin) {
                    const plyUser = this.createPlayerElement(this.inputLoginGM.value, 'Login');
                    this.divProfileUser.appendChild(plyUser);
                    this.uiSuccessFullOrError(true, [`username`, `password`]);
                }
                else {
                    this.uiSuccessFullOrError(false, [`username`, `password`]);
                }
            }
            await this.updateLaunchButtonVisibility();
        }
    }
    /*
        Gère l'affichage du bouton de lancement selon le mode et nombre de joueurs
        Tournament : Affiche le bouton si 3+ joueurs sont inscrits
        Local 1v1 : Lance automatiquement le leaderboard quand 2 joueurs sont prêts
    */
    async updateLaunchButtonVisibility() {
        const currentManager = this.getCurrentManager();
        const playerCount = currentManager.getNbrAllUsers();
        console.log(playerCount); // delete
        if (this.currentMode === 'tournament' && playerCount >= 3) {
            this.buttonLaunchGame.style.display = 'block';
            this.buttonLaunchGame.textContent = '🏆 Launch Tournament';
        }
        else if (this.currentMode === 'local' && playerCount === 2) {
            await this.leaderboard1v1();
        }
    }
    /*
        Affiche l'écran de leaderboard avant le tournoi avec tous les matchs
        Crée visuellement les paires de joueurs avec image "VS"
        Lance automatiquement le tournoi après 6 secondes (setTimeout)
        Utilise TournamentManager.createMatches() et startTournament()
    */
    async leaderboardTournament() {
        this.clearAllProfiles();
        const matches = this.tournaments.createMatches();
        this.divInterfaceLogin.querySelector('.ui-login').style.display = 'none';
        this.divInterfaceLogin.querySelector('.separator').style.display = 'none';
        this.divProfileUser.className = 'grid grid-cols-1 gap-4 p-6 pt-6';
        const title = this.divProfileUser.querySelector('h3');
        if (title) {
            title.className = 'col-span-1 text-lg text-center font-medium text-slate-800 mb-2';
        }
        matches.forEach(match => {
            const matchContainer = document.createElement('div');
            matchContainer.className = 'flex items-center justify-center gap-4 p-4 bg-slate-50 rounded-lg border';
            const firstPly = this.createPlayerElement(match[0].displayName, match[0].type);
            // image versus
            const vsDiv = document.createElement('div');
            vsDiv.className = 'flex items-center justify-center';
            const vsImage = document.createElement('img');
            vsImage.src = 'src/game/assets/versus.png';
            vsImage.width = 40;
            vsImage.height = 40;
            vsImage.alt = 'VS';
            vsDiv.appendChild(vsImage);
            const secondPly = this.createPlayerElement(match[1].displayName, match[1].type);
            matchContainer.appendChild(firstPly);
            matchContainer.appendChild(vsDiv);
            matchContainer.appendChild(secondPly);
            this.divProfileUser.appendChild(matchContainer);
        });
        setTimeout(async () => {
            this.divInterfaceLogin.style.display = 'none';
            this.updateScreen();
            this.pongGame.setModeGame('gameTournamentGM');
            await this.tournaments.startTournament(this.pongGame, matches);
        }, 6000);
    }
    /*
        Affiche l'écran de match 1v1 avec les deux joueurs face à face
        Vérifie qu'exactement 2 joueurs sont présents
        Lance automatiquement le match après 3 secondes (setTimeout)
        Utilise OneVsOneManager.startMatch()
    */
    async leaderboard1v1() {
        this.clearAllProfiles();
        const players = this.oneVsOne.getPlayers();
        if (players.length !== 2) {
            console.error('Exactly 2 players required for 1v1 mode');
            return;
        }
        this.divInterfaceLogin.querySelector('.ui-login').style.display = 'none';
        this.divInterfaceLogin.querySelector('.separator').style.display = 'none';
        this.divProfileUser.className = 'grid grid-cols-1 gap-4 p-6 pt-6';
        const title = this.divProfileUser.querySelector('h3');
        if (title) {
            title.className = 'col-span-1 text-lg text-center font-medium text-slate-800 mb-2';
            title.textContent = '1v1 MATCH';
        }
        const matchContainer = document.createElement('div');
        matchContainer.className = 'flex items-center justify-center gap-4 p-4 bg-slate-50 rounded-lg border';
        const firstPly = this.createPlayerElement(players[0].displayName, players[0].type);
        const vsDiv = document.createElement('div');
        vsDiv.className = 'flex items-center justify-center';
        const vsImage = document.createElement('img');
        vsImage.src = 'src/game/assets/versus.png';
        vsImage.width = 40;
        vsImage.height = 40;
        vsImage.alt = 'VS';
        vsDiv.appendChild(vsImage);
        const secondPly = this.createPlayerElement(players[1].displayName, players[1].type);
        matchContainer.appendChild(firstPly);
        matchContainer.appendChild(vsDiv);
        matchContainer.appendChild(secondPly);
        this.divProfileUser.appendChild(matchContainer);
        setTimeout(async () => {
            this.divInterfaceLogin.style.display = 'none';
            this.updateScreen();
            this.pongGame.setModeGame('gameLocalGM');
            await this.oneVsOne.startMatch(this.pongGame);
        }, 3000);
    }
    /*
        Bascule l'interface vers l'écran de jeu
        Masque le menu principal et affiche le canvas + contrôles du jeu
    */
    updateScreen() {
        this.divInterfaceMainMenu.style.display = 'none';
        this.pongGame.canvas.style.display = 'block';
        this.divInterfaceInGame.style.display = 'block';
    }
    /*
        Configure tous les écouteurs d'événements pour les boutons
        Gère les clics pour : sélection de mode, authentification, contrôles de jeu
        Utilise addEventListener() pour chaque bouton de l'interface
    */
    listenButtons() {
        this.buttonPractice.addEventListener('click', () => {
            this.updateScreen();
            this.pongGame.setModeGame('gameBotGM');
        });
        this.buttonPlyLocal.addEventListener('click', async () => {
            this.currentMode = 'local';
            await this.handleAuthentication();
        });
        this.buttonTournament.addEventListener('click', async () => {
            this.currentMode = 'tournament';
            await this.handleAuthentication();
        });
        this.buttonAddLogin.addEventListener('click', async () => await this.handleAuthentication());
        this.buttonLaunchGame.addEventListener('click', async () => await this.leaderboardTournament());
        this.buttonStart.addEventListener('click', () => this.pongGame.startGame());
        this.buttonPause.addEventListener('click', () => this.pongGame.pauseGame());
    }
    /*
        Nettoie complètement l'état du jeu et réinitialise l'interface
        Ferme les interfaces de login, efface les joueurs, reset les managers
        Appelée lors du changement de page ou de mode de jeu
    */
    getCleanUpGame() {
        this.divInterfaceLogin.style.display = 'none';
        this.pongGame.cleanupGame();
        this.currentMode = null;
        if (this.tournaments)
            this.tournaments.clearPlayers();
        if (this.oneVsOne)
            this.oneVsOne.clearPlayers();
        this.divProfileUser.innerHTML = '';
    }
}
// ==================== Messages d'erreur ====================
// Map des codes d'erreur pour la validation des noms d'utilisateur
PongGameUI.USERNAME_ERROR_MESSAGES = new Map([
    [-1, 'Username trop court ou trop long (min 3 caractères et max 10 caractères)'],
    [-2, 'Username ne peut contenir que des lettres et chiffres'],
    [-3, 'Username interdit']
]);
