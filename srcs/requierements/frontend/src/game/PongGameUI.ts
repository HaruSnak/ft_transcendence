import { PongGame } from './PongGame.js'
import { TournamentManager } from './Tournament.js'

export class PongGameUI {

	// Gameplay
	protected buttonStart = document.getElementById('buttonStartGame') as HTMLButtonElement;
	protected buttonPause = document.getElementById('buttonPauseGame') as HTMLButtonElement;
	protected buttonReset = document.getElementById('buttonResetGame') as HTMLButtonElement;
	protected divInterfaceInGame = document.getElementById('ingame-button') as HTMLDivElement;
	protected divMessageWinOrLose = document.getElementById('gameMessageWinOrLose') as HTMLDivElement;

	// Gamemode (IA/1vs1/Tournament)
	protected divInterfaceMainMenu = document.getElementById('main-menu-game') as HTMLDivElement;
	private buttonPractice = document.getElementById('buttonPracticeGame') as HTMLButtonElement;
	private buttonPlyLocal = document.getElementById('buttonPlyLocalGame') as HTMLButtonElement;
	private buttonTournament = document.getElementById('buttonTournamentGame') as HTMLButtonElement;

	// Add-Login system
	private inputLoginGM = document.getElementById('inputLoginGM') as HTMLInputElement;
	private inputPasswordGM = document.getElementById('inputPasswordGM') as HTMLInputElement;
	private	buttonAddLogin = document.getElementById('buttonAddLogginGM') as HTMLButtonElement;
	private divProfileUser = document.getElementById('profile-user') as HTMLDivElement;
	private divInterfaceLogin = document.getElementById('menu-add-login') as HTMLDivElement;

	private pongGame: PongGame
	private tournaments: TournamentManager;

	constructor() {
		this.pongGame = new PongGame(
			this.buttonStart,
			this.buttonPause,
			this.buttonReset,
			this.divMessageWinOrLose,
			this.divInterfaceInGame,
			this.divInterfaceMainMenu
		);
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
	profileUser(username: string, type: string) {
		const profileTemplate = document.getElementById('profile-template') as HTMLTemplateElement;
		const profileClone = profileTemplate.content.cloneNode(true) as DocumentFragment;
		
		(profileClone.querySelector('.profile-username') as HTMLElement).textContent = username;
		console.log(type + " type: " + typeof(type));
		(profileClone.querySelector('.profile-type') as HTMLElement).textContent = type;
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
			else
				if (this.tournaments.initDataPlayer('login', this.inputLoginGM.value, this.inputPasswordGM.value))
				{
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