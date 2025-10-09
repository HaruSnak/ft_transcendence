import { PongGame } from './PongBase.js'
import { TournamentManager } from './TournamentManager.js'
import { OneVsOneManager } from './LocalModeManager.js'
import { SecurityUtils } from '../SecurityUtils.js'

export class PongGameUI extends SecurityUtils {
	// ==================== Éléments d'interface - Gameplay ====================
	// Boutons de contrôle du jeu pendant la partie
	protected buttonStart = document.getElementById('buttonStartGame') as HTMLButtonElement;
	protected buttonPause = document.getElementById('buttonPauseGame') as HTMLButtonElement;
	
	// Conteneurs d'affichage pendant la partie
	private	divInterfaceInGame = document.getElementById('ingame-button') as HTMLDivElement;
	protected divMessageWinOrLose = document.getElementById('gameMessageWinOrLose') as HTMLDivElement;
	protected divScoreInGame = document.getElementById('scoreInGame') as HTMLDivElement;

	// ==================== Éléments d'interface - Menu principal ====================
	// Sélection du mode de jeu (Practice contre IA / Local 1v1 / Tournament)
	protected divInterfaceMainMenu = document.getElementById('main-menu-game') as HTMLDivElement;
	private buttonPractice = document.getElementById('buttonPracticeGame') as HTMLButtonElement;    // Mode IA
	private buttonPlyLocal = document.getElementById('buttonPlyLocalGame') as HTMLButtonElement;    // Mode 1v1
	private buttonTournament = document.getElementById('buttonTournamentGame') as HTMLButtonElement; // Mode Tournoi

	// ==================== Éléments d'interface - Système de login ====================
	// Formulaire d'authentification des joueurs
	private inputLoginGM = document.getElementById('inputLoginGM') as HTMLInputElement;
	private inputPasswordGM = document.getElementById('inputPasswordGM') as HTMLInputElement;
	private	buttonAddLogin = document.getElementById('buttonAddLogginGM') as HTMLButtonElement;
	private buttonLaunchGame = document.getElementById('buttonLaunchGame') as HTMLButtonElement;
	
	// Affichage des profils utilisateurs connectés
	private divProfileUser = document.getElementById('profile-user') as HTMLDivElement;
	private divInterfaceLogin = document.getElementById('menu-add-login') as HTMLDivElement;

	// ==================== Gestionnaires de jeu ====================
	// Instance principale du jeu Pong
	private pongGame: PongGame
	
	// Gestionnaires de modes de jeu
	private tournaments: TournamentManager;  // Gère le mode tournoi (3+ joueurs)
	private oneVsOne: OneVsOneManager;       // Gère le mode 1v1 (2 joueurs)
	
	// État actuel du mode de jeu
	private currentMode: 'tournament' | 'local' | null = null;

	// ==================== Messages d'erreur ====================
	// Map des codes d'erreur pour la validation des noms d'utilisateur
	private static readonly USERNAME_ERROR_MESSAGES = new Map([
		[-1, 'Username trop court ou trop long (min 3 caractères et max 10 caractères)'],
		[-2, 'Username ne peut contenir que des lettres et chiffres'],
		[-3, 'Username interdit']
	]);

	/*
	Constructeur - Initialise tous les composants du jeu
	Crée l'instance du jeu Pong et les gestionnaires de modes
	Configure les écouteurs d'événements et affiche le menu principal
	*/
	constructor() {
		super();
		this.pongGame = new PongGame(
			this.buttonStart,
			this.buttonPause,
			this.divMessageWinOrLose,
			this.divScoreInGame
		);
		this.tournaments = new TournamentManager;
		this.oneVsOne = new OneVsOneManager;
		this.listenButtons();
		this.showMainMenu();
	}

	/*
	Affiche le menu principal et masque les autres interfaces
	Réinitialise le mode de jeu actuel à null
	*/
	private showMainMenu() {
		this.divInterfaceMainMenu.style.display = 'block';
		this.divScoreInGame.style.display = 'none'
		this.pongGame.canvas.style.display = 'none';
		this.divInterfaceInGame.style.display = 'none';
		this.currentMode = null;
	}

	/*
	Retourne le gestionnaire approprié selon le mode actuel
	@returns TournamentManager si mode tournoi, sinon OneVsOneManager
	*/
	private getCurrentManager(): TournamentManager | OneVsOneManager {
		return this.currentMode === 'tournament' ? this.tournaments : this.oneVsOne;
	}

	/*
	Réinitialise visuellement les champs du formulaire (couleurs et textes)
	Utilise setTimeout() pour un délai de 2 secondes avant le reset
	@param fields - Tableau des champs à réinitialiser ('username' ou 'password')
	*/
	private clearStatusVisual(fields: ('username' | 'password')[]) {
		fields.forEach(fieldsType => {
			const container = this.divInterfaceLogin.querySelector(`.input-${fieldsType}-ui`);
			const label = container.querySelector(`label`) as HTMLLabelElement;
			const input = container.querySelector(`input`) as HTMLInputElement;
			const errorMsg = container.querySelector('p') as HTMLElement;
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
	private uiSuccessFullOrError(isSuccess: boolean, fields: ('username' | 'password')[]) {
		fields.forEach(fieldsType => {
			const container = this.divInterfaceLogin.querySelector(`.input-${fieldsType}-ui`);
			const label = container.querySelector(`label`) as HTMLLabelElement;
			const input = container.querySelector(`input`) as HTMLInputElement;
			const errorMsg = container.querySelector('p') as HTMLElement;
			const color = isSuccess ? '#10b981' : '#ef4444';

			label.style.color = color;
			input.style.borderColor = color;
			errorMsg.textContent = ``;
			if (!isSuccess) {
				if (!fields.includes('password')) {
					(this.divInterfaceLogin.querySelector(`.input-password-ui p`) as HTMLElement).textContent = ``;
					this.clearStatusVisual(['password']);
					errorMsg.textContent = `Username already taken or invalid`;
				}
				else {
					(this.divInterfaceLogin.querySelector(`.input-username-ui p`) as HTMLElement).textContent = ``;
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
	private verificationUserName(username: string): boolean {
		const validationCode = this.validateUsername(username);
		if (validationCode === 0) {
			return (true);
		}
		const inputPassword = this.divInterfaceLogin.querySelector('.input-password-ui p') as HTMLElement;
		if (inputPassword) {
			inputPassword.textContent = '';
		}
		this.clearStatusVisual(['password']);
		const errorMsg = this.divInterfaceLogin.querySelector('.input-username-ui p') as HTMLElement;
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
	private clearAllProfiles() {
		const profiles = this.divProfileUser.querySelectorAll('div:not(h3)');
		profiles.forEach(profile => profile.remove());
	}

	/*
		Crée un élément DOM représentant un joueur à partir d'un template
		Clone le template HTML et remplit les données (username, type)
	*/
	private createPlayerElement(username: string, type: string): HTMLElement {
		const profileTemplate = document.getElementById('profile-template') as HTMLTemplateElement;
		const profileClone = profileTemplate.content.cloneNode(true) as DocumentFragment;
		const playerDiv = profileClone.firstElementChild as HTMLElement;

		playerDiv.className += ' w-48 h-16 min-w-48 max-w-48';
		(profileClone.querySelector('.profile-username') as HTMLElement).textContent = username;
		(profileClone.querySelector('.profile-type') as HTMLElement).textContent = type;
		return (playerDiv);
	}

	/*
		Vérifie si un joueur est déjà connecté et l'affiche
		Utilise le gestionnaire actuel pour vérifier la session active
		Ajoute le profil à l'interface si une session est trouvée
	*/
	private async isPlayerActive() {
		const currentManager = this.getCurrentManager();
		const check = await currentManager.isPlayerConnected();
		if (!check)
			return ;
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
	private async handleAuthentication() {
		this.divInterfaceMainMenu.style.display = 'none';
		this.divInterfaceLogin.style.display = 'block';
		(document.getElementById('game').querySelector('p') as HTMLElement).style.display = 'none'
		this.isPlayerActive();

		this.updateLaunchButtonVisibility();
		if (this.inputLoginGM.value)
		{
			if (!this.verificationUserName(this.inputLoginGM.value))
				return ;
			
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
				if (resultLogin)
				{
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
	private async updateLaunchButtonVisibility() {
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
	private async leaderboardTournament() {
		this.clearAllProfiles();
		const matches = this.tournaments.createMatches();
		(this.divInterfaceLogin.querySelector('.ui-login') as HTMLDivElement).style.display = 'none';
		(this.divInterfaceLogin.querySelector('.separator') as HTMLDivElement).style.display = 'none';
		this.divProfileUser.className = 'grid grid-cols-1 gap-4 p-6 pt-6';
		const title = this.divProfileUser.querySelector('h3') as HTMLElement;
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
	private async leaderboard1v1() {
		this.clearAllProfiles();
		const players = this.oneVsOne.getPlayers();
		
		if (players.length !== 2) {
			console.error('Exactly 2 players required for 1v1 mode');
			return;
		}

		(this.divInterfaceLogin.querySelector('.ui-login') as HTMLDivElement).style.display = 'none';
		(this.divInterfaceLogin.querySelector('.separator') as HTMLDivElement).style.display = 'none';
		this.divProfileUser.className = 'grid grid-cols-1 gap-4 p-6 pt-6';
		const title = this.divProfileUser.querySelector('h3') as HTMLElement;
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
	private updateScreen() {
		this.divInterfaceMainMenu.style.display = 'none';
		this.pongGame.canvas.style.display = 'block';
		this.divInterfaceInGame.style.display = 'block';
	}

	/*
		Configure tous les écouteurs d'événements pour les boutons
		Gère les clics pour : sélection de mode, authentification, contrôles de jeu
		Utilise addEventListener() pour chaque bouton de l'interface
	*/
	public listenButtons() {
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
	public getCleanUpGame() {
		this.divInterfaceLogin.style.display = 'none';
		this.pongGame.cleanupGame();
		this.currentMode = null;
		if (this.tournaments) this.tournaments.clearPlayers();
		if (this.oneVsOne) this.oneVsOne.clearPlayers();
		this.divProfileUser.innerHTML = '';
	}
}