//import { match } from 'assert';
import { PongGame } from './PongBase.js';
import { TournamentManager } from './TournamentManager.js';
import { OneVsOneManager } from './LocalModeManager.js';
import { SecurityUtils } from '../SecurityUtils.js';
export class PongGameUI extends SecurityUtils {
    constructor() {
        super();
        // Gameplay
        this.buttonStart = document.getElementById('buttonStartGame');
        this.buttonPause = document.getElementById('buttonPauseGame');
        //protected buttonReset = document.getElementById('buttonResetGame') as HTMLButtonElement;
        this.divInterfaceInGame = document.getElementById('ingame-button');
        this.divMessageWinOrLose = document.getElementById('gameMessageWinOrLose');
        this.divScoreInGame = document.getElementById('scoreInGame');
        // Gamemode (IA/1vs1/Tournament)
        this.divInterfaceMainMenu = document.getElementById('main-menu-game');
        this.buttonPractice = document.getElementById('buttonPracticeGame');
        this.buttonPlyLocal = document.getElementById('buttonPlyLocalGame');
        this.buttonTournament = document.getElementById('buttonTournamentGame');
        // Add-Login system
        this.inputLoginGM = document.getElementById('inputLoginGM');
        this.inputPasswordGM = document.getElementById('inputPasswordGM');
        this.buttonAddLogin = document.getElementById('buttonAddLogginGM');
        this.buttonLaunchGame = document.getElementById('buttonLaunchGame');
        this.divProfileUser = document.getElementById('profile-user');
        this.divInterfaceLogin = document.getElementById('menu-add-login');
        this.currentMode = null;
        this.pongGame = new PongGame(this.buttonStart, this.buttonPause, this.divMessageWinOrLose, this.divScoreInGame);
        this.tournaments = new TournamentManager;
        this.oneVsOne = new OneVsOneManager;
        this.listenButtons();
        this.showMainMenu();
    }
    showMainMenu() {
        this.divInterfaceMainMenu.style.display = 'block';
        this.divScoreInGame.style.display = 'none';
        this.pongGame.canvas.style.display = 'none';
        this.divInterfaceInGame.style.display = 'none';
        this.currentMode = null;
    }
    // 🆕 Fonction pour obtenir le manager actuel selon le mode
    getCurrentManager() {
        return this.currentMode === 'tournament' ? this.tournaments : this.oneVsOne;
    }
    // Fonction pour clear texte + couleur de l'UI login
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
    // Fonction qui gere le cas frontend des msg d'error UI
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
    clearAllProfiles() {
        const profiles = this.divProfileUser.querySelectorAll('div:not(h3)');
        profiles.forEach(profile => profile.remove());
    }
    // Une fois le systeme bien foutu, mettre en place le replace des images profiles user
    createPlayerElement(username, type) {
        const profileTemplate = document.getElementById('profile-template');
        const profileClone = profileTemplate.content.cloneNode(true);
        const playerDiv = profileClone.firstElementChild;
        playerDiv.className += ' w-48 h-16 min-w-48 max-w-48';
        profileClone.querySelector('.profile-username').textContent = username;
        profileClone.querySelector('.profile-type').textContent = type;
        return (playerDiv);
    }
    // A FAIRE
    async isPlayerActive() {
        const currentManager = this.getCurrentManager();
        const check = await currentManager.isPlayerConnected();
        if (!check)
            return;
        else {
            const ply = this.createPlayerElement(this.inputLoginGM.value, 'User Session');
            this.divProfileUser.appendChild(ply);
            //this.uiSuccessFullOrError(true, [`username`]);
        }
    }
    // 🔧 Fonction modifiée pour supporter les deux modes
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
    // 🆕 Fonction pour gérer la visibilité des boutons de lancement
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
    // Interface de leaderboard apres la validation des players
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
    updateScreen() {
        this.divInterfaceMainMenu.style.display = 'none';
        this.pongGame.canvas.style.display = 'block';
        this.divInterfaceInGame.style.display = 'block';
    }
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
PongGameUI.USERNAME_ERROR_MESSAGES = new Map([
    [-1, 'Username trop court ou trop long (min 3 caractères et max 10 caractères)'],
    [-2, 'Username ne peut contenir que des lettres et chiffres'],
    [-3, 'Username interdit']
]);
