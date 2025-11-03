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
	private canvasContainer = document.getElementById('canvas-container') as HTMLDivElement;

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

	// ==================== Gestion des timers ====================
	private activeTimers: number[] = []; // Liste des setTimeout actifs

	// ==================== Event Listeners (références pour nettoyage) ====================
	private boundHandlePractice: () => void;
	private boundHandleLocal: () => Promise<void>;
	private boundHandleTournament: () => Promise<void>;
	private boundHandleAddLogin: () => Promise<void>;
	private boundHandleLaunchGame: () => Promise<void>;
	private boundHandleStart: () => void;
	private boundHandlePause: () => void;

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
		
		// Création des références de fonctions pour pouvoir les supprimer plus tard
		this.boundHandlePractice = () => {
			this.updateControlsMessage("Controls: W/S for left paddle | Arrow Up/Down for right paddle");
			this.updateScreen();
			this.pongGame.setModeGame('gameBotGM');
		};
		this.boundHandleLocal = async () => {
			this.updateControlsMessage("Controls: W/S for left paddle | Arrow Up/Down for right paddle");
			this.currentMode = 'local';
			this.clearAllProfiles(); // Nettoyer au changement de mode
			await this.handleAuthentication();
		};
		this.boundHandleTournament = async () => {
			this.updateControlsMessage("Controls: W/S for left paddle | Arrow Up/Down for right paddle");
			this.currentMode = 'tournament';
			this.clearAllProfiles(); // Nettoyer au changement de mode
			await this.handleAuthentication();
		};
		this.boundHandleAddLogin = async () => await this.handleAuthentication();
		this.boundHandleLaunchGame = async () => await this.leaderboardTournament();
		this.boundHandleStart = () => this.pongGame.startGame();
		this.boundHandlePause = () => this.pongGame.pauseGame();
		
		this.listenButtons();
		
		// Initialiser l'état caché de tous les éléments du jeu
		// Pour éviter qu'ils apparaissent au chargement initial de la page
		this.initializeHiddenState();
	}

	/*
	Initialise tous les éléments de l'interface en état caché
	Note: Les éléments principaux sont déjà cachés via CSS (class="hidden")
	Cette méthode s'assure que les éléments dynamiques restent cachés
	*/
	private initializeHiddenState() {
		// Ces éléments ne sont pas cachés par défaut en HTML, on les cache ici
		this.buttonLaunchGame.style.display = 'none';
	}

	/*
	Affiche le menu principal et masque les autres interfaces
	Réinitialise le mode de jeu actuel à null
	Appelée lors de l'accès à la page game ou après un cleanup
	*/
	public showMainMenu() {
		this.divInterfaceMainMenu.style.display = 'block';
		this.divInterfaceLogin.style.display = 'none';
		this.divScoreInGame.style.display = 'none';
		this.divScoreInGame.classList.add('hidden');
		this.canvasContainer.classList.add('hidden');
		this.divInterfaceInGame.classList.add('hidden');
		this.currentMode = null;
		this.updateControlsMessage("Choose a game mode from the following!");
	}

	/*
	Met à jour le message de contrôle affiché dans le paragraphe principal
	@param message - Le message à afficher
	*/
	private updateControlsMessage(message: string) {
		const pElement = document.getElementById('game').querySelector('p') as HTMLElement;
		if (pElement) {
			pElement.textContent = message;
			pElement.style.display = 'block';
		}
	}

	/*
		Retourne le gestionnaire approprié selon le mode actuel
	*/
	private getCurrentManager(): TournamentManager | OneVsOneManager {
		return (this.currentMode === 'tournament' ? this.tournaments : this.oneVsOne);
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
			const timerId = window.setTimeout(() => {
				label.style.color = ``;
				input.style.borderColor = ``;
				errorMsg.textContent = ``;
			}, 2000);
			this.activeTimers.push(timerId);
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
		Crée un élément DOM représentant un joueur à partir du template HTML
		Clone le template et remplit les données dynamiques (username, type)
		Cette méthode est optimale : rapide, maintenable et professionnelle
	*/
	private createPlayerElement(username: string, type: string): HTMLElement {
		const profileTemplate = document.getElementById('profile-template') as HTMLTemplateElement;
		
		// Le template est toujours disponible car le DOM est chargé avant l'appel
		const profileClone = profileTemplate.content.cloneNode(true) as DocumentFragment;
		const playerDiv = profileClone.firstElementChild as HTMLElement;

		// Forcer la bordure noire avec du CSS inline (priorité maximale sur Tailwind)
		playerDiv.style.outline = '2px solid #000000';
		playerDiv.style.outlineOffset = '-2px';
		playerDiv.style.borderColor = '#000000';
		
		// Remplir les données utilisateur
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
			// Récupérer le joueur connecté depuis le manager
			const players = currentManager.getPlayers();
			if (players.length > 0) {
				// Vérifier si le profil existe déjà dans l'interface
				const existingProfiles = this.divProfileUser.querySelectorAll('.profile-username');
				const connectedPlayer = players[0];
				const alreadyDisplayed = Array.from(existingProfiles).some(
					profile => profile.textContent === connectedPlayer.displayName
				);
				
				if (alreadyDisplayed) {
					return ;
				}
				
				const ply = this.createPlayerElement(connectedPlayer.displayName, 'User Session');
				this.divProfileUser.appendChild(ply);
			} else {
				console.warn('Player connected but not found in manager');
			}
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
		this.divInterfaceLogin.style.display = 'flex';
		(document.getElementById('game').querySelector('p') as HTMLElement).style.display = 'none'
		
		// Vérifier et afficher le joueur actif (session) seulement s'il n'est pas déjà affiché
		await this.isPlayerActive();

		this.updateLaunchButtonVisibility();
		if (this.inputLoginGM.value)
		{
			if (!this.verificationUserName(this.inputLoginGM.value))
				return ;
			
			const currentManager = this.getCurrentManager();
			
			// Vérifier si ce joueur n'est pas déjà dans la liste
			const existingProfiles = this.divProfileUser.querySelectorAll('.profile-username');
			const alreadyExists = Array.from(existingProfiles).some(
				profile => profile.textContent === this.inputLoginGM.value
			);
			
			if (alreadyExists) {
				this.uiSuccessFullOrError(false, [`username`]);
				return ;
			}
			
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
			// Ajouter des contraintes de largeur sans écraser les classes internes
			firstPly.style.maxWidth = '200px';
			firstPly.style.minWidth = '150px';
			
			// image versus
			const vsDiv = document.createElement('div');
			vsDiv.className = 'flex items-center justify-center flex-shrink-0';
			const vsImage = document.createElement('img');
			vsImage.src = 'assets/versus.png';
			vsImage.width = 40;
			vsImage.height = 40;
			vsImage.alt = 'VS';
			vsDiv.appendChild(vsImage);
			
			const secondPly = this.createPlayerElement(match[1].displayName, match[1].type);
			// Ajouter des contraintes de largeur sans écraser les classes internes
			secondPly.style.maxWidth = '200px';
			secondPly.style.minWidth = '150px';
			
			matchContainer.appendChild(firstPly);
			matchContainer.appendChild(vsDiv);
			matchContainer.appendChild(secondPly);
			this.divProfileUser.appendChild(matchContainer);
		});
		const tournamentTimerId = window.setTimeout(async () => {
			this.divInterfaceLogin.style.display = 'none';
			this.updateScreen();
			await this.tournaments.startTournament(this.pongGame, matches);
		}, 6000);
		this.activeTimers.push(tournamentTimerId);
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
			return ;
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
		// Ajouter des contraintes de largeur sans écraser les classes internes
		firstPly.style.maxWidth = '200px';
		firstPly.style.minWidth = '150px';
		
		const vsDiv = document.createElement('div');
		vsDiv.className = 'flex items-center justify-center flex-shrink-0';
		const vsImage = document.createElement('img');
		vsImage.src = 'assets/versus.png';
		vsImage.width = 40;
		vsImage.height = 40;
		vsImage.alt = 'VS';
		vsDiv.appendChild(vsImage);
		
		const secondPly = this.createPlayerElement(players[1].displayName, players[1].type);
		// Ajouter des contraintes de largeur sans écraser les classes internes
		secondPly.style.maxWidth = '200px';
		secondPly.style.minWidth = '150px';
		
		matchContainer.appendChild(firstPly);
		matchContainer.appendChild(vsDiv);
		matchContainer.appendChild(secondPly);
		this.divProfileUser.appendChild(matchContainer);

		const matchTimerId = window.setTimeout(async () => {
			this.divInterfaceLogin.style.display = 'none';
			this.updateScreen();
			await this.oneVsOne.startMatch(this.pongGame);
		}, 3000);
		this.activeTimers.push(matchTimerId);
	}

	/*
		Bascule l'interface vers l'écran de jeu
		Masque le menu principal et affiche le canvas + contrôles du jeu
	*/
	private updateScreen() {
		this.divInterfaceMainMenu.style.display = 'none';
		this.canvasContainer.classList.remove('hidden');
		this.divInterfaceInGame.classList.remove('hidden');
	}

	/*
		Configure tous les écouteurs d'événements pour les boutons
		Gère les clics pour : sélection de mode, authentification, contrôles de jeu
		Utilise addEventListener() pour chaque bouton de l'interface
		Utilise des références de fonctions pour pouvoir les supprimer lors du cleanup
	*/
	public listenButtons() {
		this.buttonPractice.addEventListener('click', this.boundHandlePractice);
		this.buttonPlyLocal.addEventListener('click', this.boundHandleLocal);
		this.buttonTournament.addEventListener('click', this.boundHandleTournament);
		this.buttonAddLogin.addEventListener('click', this.boundHandleAddLogin);
		this.buttonLaunchGame.addEventListener('click', this.boundHandleLaunchGame);
		this.buttonStart.addEventListener('click', this.boundHandleStart);
		this.buttonPause.addEventListener('click', this.boundHandlePause);
	}

	/*
		Supprime tous les écouteurs d'événements des boutons
		Appelée lors du cleanup pour éviter les fuites mémoire
		et l'accumulation de listeners lors des réinitialisations
	*/
	private removeEventListeners() {
		this.buttonPractice.removeEventListener('click', this.boundHandlePractice);
		this.buttonPlyLocal.removeEventListener('click', this.boundHandleLocal);
		this.buttonTournament.removeEventListener('click', this.boundHandleTournament);
		this.buttonAddLogin.removeEventListener('click', this.boundHandleAddLogin);
		this.buttonLaunchGame.removeEventListener('click', this.boundHandleLaunchGame);
		this.buttonStart.removeEventListener('click', this.boundHandleStart);
		this.buttonPause.removeEventListener('click', this.boundHandlePause);
	}

	/*
		Annule tous les setTimeout/setInterval actifs
		Évite que des actions planifiées s'exécutent après la fermeture de la page
	*/
	private clearAllTimers() {
		this.activeTimers.forEach(timerId => {
			window.clearTimeout(timerId);
		});
		this.activeTimers = [];
	}

	/*
		Nettoie complètement l'état du jeu et réinitialise l'interface
		Ferme les interfaces de login, efface les joueurs, reset les managers
		Appelée lors du changement de page ou de mode de jeu
	*/
	public getCleanUpGame() {
		// Suppression des event listeners pour éviter les fuites mémoire
		this.removeEventListeners();
		this.clearAllTimers();
		this.pongGame.cleanupGame();
		this.currentMode = null;
		if (this.tournaments) this.tournaments.clearPlayers();
		if (this.oneVsOne) this.oneVsOne.clearPlayers();
		
		this.divInterfaceLogin.style.display = 'none';
		this.divInterfaceMainMenu.style.display = 'block';
		this.divInterfaceInGame.classList.add('hidden');
		this.canvasContainer.classList.add('hidden');
		this.divScoreInGame.style.display = 'none';
		this.divScoreInGame.classList.add('hidden');
		this.divMessageWinOrLose.classList.add('hidden');
		
		this.clearAllProfiles();
		const profileTitle = this.divProfileUser.querySelector('h3') as HTMLElement;
		if (profileTitle) {
			profileTitle.className = 'col-span-2 text-lg text-center font-medium text-slate-800 mb-2';
			profileTitle.textContent = 'Game room';
		}

		this.divProfileUser.className = 'grid grid-cols-2 gap-4 p-8 pt-6 place-items-center';
		const uiLogin = this.divInterfaceLogin.querySelector('.ui-login') as HTMLDivElement;
		const separator = this.divInterfaceLogin.querySelector('.separator') as HTMLDivElement;
		if (uiLogin) uiLogin.style.display = '';
		if (separator) separator.style.display = '';
		this.inputLoginGM.value = '';
		this.inputPasswordGM.value = '';
		
		// Réinitialisation des styles des champs (en cas d'erreurs précédentes)
		// Note: on ne peut pas appeler clearStatusVisual ici car ça crée de nouveaux timers
		const usernameContainer = this.divInterfaceLogin.querySelector('.input-username-ui');
		const passwordContainer = this.divInterfaceLogin.querySelector('.input-password-ui');
		if (usernameContainer) {
			(usernameContainer.querySelector('label') as HTMLLabelElement).style.color = '';
			(usernameContainer.querySelector('input') as HTMLInputElement).style.borderColor = '';
			(usernameContainer.querySelector('p') as HTMLElement).textContent = '';
		}
		if (passwordContainer) {
			(passwordContainer.querySelector('label') as HTMLLabelElement).style.color = '';
			(passwordContainer.querySelector('input') as HTMLInputElement).style.borderColor = '';
			(passwordContainer.querySelector('p') as HTMLElement).textContent = '';
		}
		this.buttonLaunchGame.style.display = 'none';
		console.log("status " + this.buttonPause.value);
		this.buttonPause.value = 'Pause';
		this.updateControlsMessage("Choose a game mode from the following!");
	}
}