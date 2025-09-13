import { PongGame } from './PongGame.js';
import { TournamentManager } from './Tournament.js';
export class PongGameUI {
    constructor() {
        // Gameplay
        this.buttonStart = document.getElementById('buttonStartGame');
        this.buttonPause = document.getElementById('buttonPauseGame');
        this.buttonReset = document.getElementById('buttonResetGame');
        this.divInterfaceInGame = document.getElementById('ingame-button');
        this.divMessageWinOrLose = document.getElementById('gameMessageWinOrLose');
        // Gamemode (IA/1vs1/Tournament)
        this.divInterfaceMainMenu = document.getElementById('main-menu-game');
        this.buttonPractice = document.getElementById('buttonPracticeGame');
        this.buttonPlyLocal = document.getElementById('buttonPlyLocalGame');
        this.buttonTournament = document.getElementById('buttonTournamentGame');
        // Add-Login system
        this.inputLoginGM = document.getElementById('inputLoginGM');
        this.inputPasswordGM = document.getElementById('inputPasswordGM');
        this.buttonAddLogin = document.getElementById('buttonAddLogginGM');
        this.divProfileUser = document.getElementById('profile-user');
        this.divInterfaceLogin = document.getElementById('menu-add-login');
        this.pongGame = new PongGame(this.buttonStart, this.buttonPause, this.buttonReset, this.divMessageWinOrLose, this.divInterfaceInGame, this.divInterfaceMainMenu);
        this.tournaments = new TournamentManager;
        this.listenButtons();
        this.showMainMenu();
    }
    showMainMenu() {
        this.divInterfaceMainMenu.style.display = 'block';
        this.pongGame.canvas.style.display = 'none';
        this.divInterfaceInGame.style.display = 'none';
    }
    // Une fois le systeme bien foutu, mettre en place le replace des images profiles user
    profileUser(username, type) {
        const profileTemplate = document.getElementById('profile-template');
        const profileClone = profileTemplate.content.cloneNode(true);
        profileClone.querySelector('.profile-username').textContent = username;
        console.log(type + " type: " + typeof (type));
        profileClone.querySelector('.profile-type').textContent = type;
        this.divProfileUser.appendChild(profileClone);
    }
    handleAuthentication() {
        this.divInterfaceMainMenu.style.display = 'none';
        this.divInterfaceLogin.style.display = 'block';
        //if (true) // Mettre en place une fois la DB faite le systeme de s'il est deja login sur son compte
        if (this.tournaments.)
            if (this.inputLoginGM.value) // securitation du password
             {
                if (!this.inputPasswordGM.value && this.tournaments.initDataPlayer('guest', this.inputLoginGM.value)) {
                    console.log('Guest is good');
                    this.profileUser(this.inputLoginGM.value, 'Guest');
                }
                else if (this.tournaments.initDataPlayer('login', this.inputLoginGM.value, this.inputPasswordGM.value)) {
                    console.log('Login is good');
                    this.profileUser(this.inputLoginGM.value, 'Login');
                }
                //this.updateScreen();
                //this.pongGame.setStatusGame('gameTournamentGM');
            }
    }
    updateScreen() {
        this.divInterfaceMainMenu.style.display = 'none';
        this.pongGame.canvas.style.display = 'block';
        this.divInterfaceInGame.style.display = 'block';
        this.pongGame.draw();
    }
    listenButtons() {
        this.buttonPractice.addEventListener('click', () => {
            this.updateScreen();
            this.pongGame.setStatusGame('gameBotGM');
        });
        this.buttonPlyLocal.addEventListener('click', () => {
            this.updateScreen();
            this.pongGame.setStatusGame('gameLocalGM');
        });
        this.buttonTournament.addEventListener('click', () => {
            this.handleAuthentication();
        });
        this.buttonAddLogin.addEventListener('click', () => this.handleAuthentication());
        this.buttonStart.addEventListener('click', () => this.pongGame.startGame());
        this.buttonPause.addEventListener('click', () => this.pongGame.pauseGame());
        this.buttonReset.addEventListener('click', () => this.pongGame.resetGame());
    }
    getCleanUpGame() {
        this.pongGame.cleanupGame();
    }
}
