import { TournamentPlayer } from './PlayerManager.js'

// ==================== Types pour organiser les données ====================
interface Paddle {
	x: number;		// Position horizontale
	y: number;		// Position verticale
	score: number;	// Score
}

interface Ball {
	x: number;			// Position horizontale
	y: number;			// Position verticale
	speed_x: number;		// Vitesse horizontale
	speed_y: number;		// Vitesse verticale
}

export class PongGame {
	// ==================== Configuration du Pong ====================
	private readonly CANVAS_WIDTH = 800;			// Largeur du canvas
	private readonly CANVAS_HEIGHT = 600;			// Hauteur du canvas
	private readonly PADDLE_WIDTH = 10;			// Largeur des paddles
	private readonly PADDLE_HEIGHT = 100;			// Hauteur des paddles
	private readonly BALL_SIZE = 12;				// Taille de la balle
	private readonly PADDLE_SPEED = 6;				// Vitesse des paddles
	private readonly BALL_SPEED = 4;				// Vitesse de la balle (fixe, pas de changement) | 2.7
	private readonly WINNING_SCORE = 3;			// Score pour gagner la partie | 10

	// Stocker les touches
	private readonly keys: Set<string> = new Set();

	// Canvas et contexte/bouttons
	public canvas!: HTMLCanvasElement;
	private ctx!: CanvasRenderingContext2D;

	// ==================== Constantes de positionnement ====================
	private readonly INITIAL_PADDLE_Y = this.CANVAS_HEIGHT / 2 - this.PADDLE_HEIGHT / 2; // Position verticale initiale des paddles
	private readonly BALL_CENTER_X = this.CANVAS_WIDTH / 2;                        // Centre horizontal de la balle
	private readonly BALL_CENTER_Y = this.CANVAS_HEIGHT / 2;                       // Centre vertical de la balle
	private readonly PADDLE_MAX_Y = this.CANVAS_HEIGHT - this.PADDLE_HEIGHT;       // Limite supérieure des paddles
	private readonly RIGHT_PADDLE_STARTING_X_POSITION = this.CANVAS_WIDTH - this.PADDLE_WIDTH; // Position horizontale initiale du paddle droit

	// ==================== Zones de collision ====================
	private readonly LEFT_PADDLE_EDGE = this.PADDLE_WIDTH;                         // Bord gauche du paddle gauche
	private readonly RIGHT_PADDLE_EDGE = this.CANVAS_WIDTH - this.PADDLE_WIDTH;    // Bord droit du paddle droit

	// ==================== État des entités de jeu ====================
	private leftPaddle: Paddle = { x: 0, y: this.INITIAL_PADDLE_Y, score: 0 };
	private rightPaddle: Paddle = { x: this.RIGHT_PADDLE_STARTING_X_POSITION, y: this.INITIAL_PADDLE_Y, score: 0 };
	private ball: Ball = { x: this.BALL_CENTER_X, y: this.BALL_CENTER_Y, speed_x: this.BALL_SPEED, speed_y: this.BALL_SPEED };

	// ==================== État du jeu et modes ====================
	private gameRunning = false;         // Jeu en cours
	private gamePaused = false;          // Jeu en pause
	private gameBotGM = false;           // Gamemode Bot
	private gameLocalGM = false;         // Gamemode Local
	private gameTournamentGM = false;    // Gamemode Tournament
	private animationFrameId: number;    // ID de l'animation
	private whoWin: 'left' | 'right' | 'null';
	private currentMatch: [TournamentPlayer, TournamentPlayer];

	// ==================== Module IA ====================
	private lastAITime = 0;
	private aiTargetY = this.INITIAL_PADDLE_Y;		// Position cible prédite par l'IA
	private aiPredictedBallY = this.BALL_CENTER_Y;	// Position Y prédite de la balle
	private aiUpdateInterval = 1000;				// L'IA met à jour sa vue chaque seconde
	private aiReactionDelay = 0.20;					// Délai de réaction pour simuler un comportement humain

	/**
		Constructeur - Initialise le jeu Pong avec les éléments DOM
		Configure le canvas et le contexte de rendu 2D
		Ajoute les écouteurs d'événements clavier avec addEventListener()
	*/
	constructor(
		private buttonStart: HTMLButtonElement,
		private buttonPause: HTMLButtonElement,
		private divMessageWinOrLose: HTMLDivElement,
		private divScoreInGame: HTMLDivElement,
	) {
		// Initialiser canvas et contexte
		this.canvas = document.getElementById('pongCanvas') as HTMLCanvasElement;
		this.ctx = this.canvas.getContext('2d') as CanvasRenderingContext2D;
		this.whoWin = 'null';
		
		window.addEventListener('keydown', (e) => {
			if ((this.gameBotGM || (this.gameTournamentGM && this.currentMatch?.[1]?.displayName === 'Bot')) && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) return;
			this.keys.add(e.key);
		});
		window.addEventListener('keyup', (e) => {
			if ((this.gameBotGM || (this.gameTournamentGM && this.currentMatch?.[1]?.displayName === 'Bot')) && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) return;
			this.keys.delete(e.key);
		});
	}

	// ==================== START and PAUSE ====================

	/**
		Affiche le message de pré-jeu avant le début d'une partie
		Utilise innerHTML pour créer dynamiquement le contenu HTML
		Affiche les noms des joueurs ou valeurs par défaut ('You' vs 'Bot')
	*/
	private showPreGameMessage() {
		this.divMessageWinOrLose.classList.remove('hidden');
		this.divMessageWinOrLose.style.color = 'rgba(255, 255, 255, 0.95)';
		const player1Name = (this.currentMatch?.[0]?.displayName ? this.currentMatch[0].displayName : 'You');
		const player2Name = (this.currentMatch?.[1]?.displayName ? this.currentMatch[1].displayName : 'Bot');
		this.divMessageWinOrLose.innerHTML = `
			<div class="text-center">
				<div class="text-5xl font-bold mb-4 text-white drop-shadow-lg">${player1Name} <span class="text-orange-400">vs</span> ${player2Name}</div>
				<div class="text-2xl text-gray-100 font-medium">Press 'Start Game' when ready!</div>
			</div>
		`;
	}

	/**
		Dessine les noms des joueurs en haut du canvas
		Affiche 'You' vs 'Bot' en mode Bot, sinon les noms réels des joueurs
		Utilise ctx.fillText() pour le rendu texte
	*/
	private drawPlayerNames() {
		if (this.gameBotGM) {
			this.ctx.fillText(`You`, (this.CANVAS_WIDTH / 4), 50);
			this.ctx.fillText(`Bot`, (3 * this.CANVAS_WIDTH / 4), 50);
		}
		else if (this.gameLocalGM || this.gameTournamentGM) {
			this.ctx.fillText(this.currentMatch[0].displayName, (this.CANVAS_WIDTH / 4), 50);
			this.ctx.fillText(this.currentMatch[1].displayName, (3 * this.CANVAS_WIDTH / 4), 50);
		}
	}

	/**
		Dessine tous les éléments du jeu sur le canvas
		Efface le canvas avec clearRect(), dessine les paddles, la balle et les scores
		Utilise fillRect() pour les formes rectangulaires et fillText() pour le texte
		Appelée à chaque frame de l'animation via requestAnimationFrame()
	*/
	public draw() {
		if (!this.ctx)
			return ;
		this.ctx.clearRect(0, 0, this.CANVAS_WIDTH, this.CANVAS_HEIGHT);
		if (!this.gameRunning) {
			this.showPreGameMessage();
			return ;
		}
		// Dessiner le dégradé d'arrière-plan
		const gradient = this.ctx.createLinearGradient(0, 0, this.CANVAS_WIDTH, this.CANVAS_HEIGHT);
		gradient.addColorStop(0, '#659999');
		gradient.addColorStop(1, '#f4791f');
		this.ctx.fillStyle = gradient;
		this.ctx.fillRect(0, 0, this.CANVAS_WIDTH, this.CANVAS_HEIGHT);
		
		// Tracer une ligne centrale blanche et nette avec une ombre subtile
		this.ctx.strokeStyle = '#ffffff';
		this.ctx.lineWidth = 2;
		this.ctx.setLineDash([10, 10]);
		this.ctx.shadowColor = '#ffffff';
		this.ctx.shadowBlur = 2;
		this.ctx.beginPath();
		this.ctx.moveTo(this.CANVAS_WIDTH / 2, 0);
		this.ctx.lineTo(this.CANVAS_WIDTH / 2, this.CANVAS_HEIGHT);
		this.ctx.stroke();
		this.ctx.setLineDash([]);
		this.ctx.shadowBlur = 0; // Reset shadow
		
		this.ctx.fillStyle = "#ffffff"; // Paddles blanc pour un contraste maximal
		this.ctx.shadowColor = '#000000';
		this.ctx.shadowBlur = 2;
		this.ctx.fillRect(this.leftPaddle.x, this.leftPaddle.y, this.PADDLE_WIDTH, this.PADDLE_HEIGHT);
		this.ctx.fillRect(this.rightPaddle.x, this.rightPaddle.y, this.PADDLE_WIDTH, this.PADDLE_HEIGHT);
		this.ctx.shadowBlur = 0; // Reset shadow
		this.ctx.font = '30px Arial';
		this.ctx.fillStyle = "#ffffff"; // Texte blanc
		this.drawPlayerNames();
		this.divScoreInGame.querySelector('span').textContent = `${this.leftPaddle.score} - ${this.rightPaddle.score}`;
		this.ctx.fillStyle = "#ffffff"; // Balle blanche
		this.ctx.shadowColor = '#ffffff';
		this.ctx.shadowBlur = 3;
		this.ctx.beginPath();
		this.ctx.arc(this.ball.x, this.ball.y, this.BALL_SIZE / 2, 0, 2 * Math.PI);
		this.ctx.fill();
		this.ctx.shadowBlur = 0;
	}

	/**
		Gère les inputs clavier des joueurs via le Set keys
		Joueur gauche : touches W/S, Joueur droit : flèches haut/bas
		En mode Bot, l'IA simule les touches fléchées pour contrôler le paddle droit
		Vérifie les limites du terrain pour empêcher les paddles de sortir
	*/
	private handleInput() {
		// Joueur gauche (touches W/S)
		if (this.keys.has('w') && this.leftPaddle.y > 0)
			this.leftPaddle.y -= this.PADDLE_SPEED;
		if (this.keys.has('s') && this.leftPaddle.y < this.PADDLE_MAX_Y)
			this.leftPaddle.y += this.PADDLE_SPEED;
		
		// Joueur droit (touches fléchées)
		// En mode Local ou Tournoi (sans Bot), le joueur humain contrôle le paddle droit
		// En mode Bot, l'IA contrôle le paddle droit via les touches fléchées simulées
		if (this.keys.has('ArrowUp') && this.rightPaddle.y > 0)
			this.rightPaddle.y -= this.PADDLE_SPEED;
		if (this.keys.has('ArrowDown') && this.rightPaddle.y < this.PADDLE_MAX_Y)
			this.rightPaddle.y += this.PADDLE_SPEED;	
	}

	/**
		Boucle principale du jeu - Met à jour la physique et l'état du jeu
		Gère le mouvement de la balle, les collisions, les scores et les inputs
		Appelle l'IA en mode Bot avec updateAI()
		Utilise requestAnimationFrame() pour créer la boucle d'animation
	*/
	private update() {
		if (!this.gameRunning || this.gamePaused)
			return ;

		// Vérifier si un joueur a gagné
		if (this.leftPaddle.score >= this.WINNING_SCORE || this.rightPaddle.score >= this.WINNING_SCORE) {
			this.endGame();
			return ;
		}

		// Déplacer la balle dans les deux directions
		this.ball.x += this.ball.speed_x;
		this.ball.y += this.ball.speed_y;

		// Rebondir sur les murs haut et bas
		if (this.ball.y <= 0) {
			this.ball.y = 0;
			this.ball.speed_y = Math.abs(this.ball.speed_y); // Forcer vers le bas
		}
		if (this.ball.y >= this.CANVAS_HEIGHT) {
			this.ball.y = this.CANVAS_HEIGHT;
			this.ball.speed_y = -Math.abs(this.ball.speed_y); // Forcer vers le haut
		}

		// Collision avec le paddle GAUCHE
		if (this.ball.speed_x < 0 && this.ball.x - this.BALL_SIZE / 2 <= this.LEFT_PADDLE_EDGE &&
				this.ball.y >= this.leftPaddle.y && this.ball.y <= this.leftPaddle.y + this.PADDLE_HEIGHT) {
			this.ball.speed_x = Math.abs(this.ball.speed_x);
			this.ball.x = this.LEFT_PADDLE_EDGE + this.BALL_SIZE / 2;
		}
		
		// Collision avec le paddle DROIT
		if (this.ball.speed_x > 0 && this.ball.x + this.BALL_SIZE / 2 >= this.RIGHT_PADDLE_EDGE &&
				this.ball.y >= this.rightPaddle.y && this.ball.y <= this.rightPaddle.y + this.PADDLE_HEIGHT) {
			this.ball.speed_x = -Math.abs(this.ball.speed_x);
			this.ball.x = this.RIGHT_PADDLE_EDGE - this.BALL_SIZE / 2;
		}

		// Points et reset
		if (this.ball.x < 0) {
			this.rightPaddle.score++;
			if (this.gameBotGM)
				this.adjustAIDifficulty();
			this.resetBall();
		}
		if (this.ball.x > this.CANVAS_WIDTH) {
			this.leftPaddle.score++;
			if (this.gameBotGM)
				this.adjustAIDifficulty();
			this.resetBall();
		}

		this.handleInput(); // Joueur
		if (this.gameBotGM || (this.gameTournamentGM && this.currentMatch?.[1]?.displayName === 'Bot'))
			this.updateAI();
		this.draw();
		this.animationFrameId = requestAnimationFrame(() => this.update());
	}

	// ==================== START and PAUSE ====================
	
	/**
		Affiche un compte à rebours visuel avant le début du jeu
		Utilise setInterval() pour compter de 3 à 0 puis affiche 'GO!'
		Sauvegarde/restaure le contexte canvas avec save() et restore()
	*/
	private startCountdown(callback: () => void): void {
		let countdown = 3;
		
		const countdownInterval = setInterval(() => {
			const text = countdown > 0 ? countdown.toString() : 'GO!';

			this.ctx.clearRect(0, 0, this.CANVAS_WIDTH, this.CANVAS_HEIGHT);
			this.ctx.fillStyle = countdown > 0 ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 255, 0, 0.9)';
			this.ctx.font = 'bold 120px Arial';
			this.ctx.textAlign = 'center';
			this.ctx.textBaseline = 'middle';
			this.ctx.fillText(text, this.CANVAS_WIDTH / 2, this.CANVAS_HEIGHT / 2);
			countdown--;
			if (countdown < -1) {
				clearInterval(countdownInterval);
				callback();
			}
		}, 1000);
	}

	/**
		Lance une nouvelle partie de jeu
		Réinitialise l'état, affiche le compte à rebours puis démarre la boucle update()
		Configure les boutons et définit une direction aléatoire pour la balle
	*/
	public startGame() {
		if (!this.gameRunning) {
			this.resetGameState();
			this.buttonStart.disabled = true;
			this.divMessageWinOrLose.classList.add('hidden');
			this.startCountdown(() => {
				this.gameRunning = true;
				this.gamePaused = false;
				this.divScoreInGame.style.display = 'block';
				this.ball.speed_y = Math.random() > 0.5 ? this.BALL_SPEED : -this.BALL_SPEED;
				this.buttonStart.classList.add('hidden');
				this.update();
				this.buttonPause.disabled = false;
			});
		}
	}

	/**
		Met le jeu en pause ou le reprend
		Change le texte du bouton entre 'Pause' et 'Resume'
		Relance update() lors de la reprise
	*/
	public pauseGame() {
		if (this.gameRunning) {
			if (!this.gamePaused) {
			this.gamePaused = true;
			this.buttonPause.textContent = 'Play';
			}
			else {
			this.gamePaused = false;
			this.buttonPause.textContent = 'Pause';
			this.update();
			}
		}
	}

	// ==================== RESET, CLEAN and END ====================
	
	/**
		Réinitialise la position de la balle et des paddles après un but
		Inverse la direction horizontale de la balle
		Génère une direction verticale aléatoire avec Math.random()
	*/
	private resetBall() {
		this.ball.x = this.BALL_CENTER_X;
		this.ball.y = this.BALL_CENTER_Y;
		this.ball.speed_x = -this.ball.speed_x; // Inverser la direction horizontale
		this.ball.speed_y = Math.random() > 0.5 ? this.BALL_SPEED : -this.BALL_SPEED; // Direction verticale aléatoire
		this.leftPaddle.y = this.INITIAL_PADDLE_Y;  // Réinitialiser le paddle gauche
		this.rightPaddle.y = this.INITIAL_PADDLE_Y; // Réinitialiser le paddle droit
	}

	/**
		Réinitialise complètement l'état du jeu
		Remet les paddles, la balle et l'IA à leurs valeurs initiales
		Annule l'animation frame en cours avec cancelAnimationFrame()
		Nettoie les touches simulées par l'IA
	*/
	private resetGameState() {
		this.leftPaddle = { x: 0, y: this.INITIAL_PADDLE_Y, score: 0 };
		this.rightPaddle = { x: this.RIGHT_PADDLE_STARTING_X_POSITION, y: this.INITIAL_PADDLE_Y, score: 0 };
		this.ball = { x: this.BALL_CENTER_X, y: this.BALL_CENTER_Y, speed_x: this.BALL_SPEED, speed_y: this.BALL_SPEED };
		this.gameRunning = false;
		this.lastAITime = 0;
		this.aiTargetY = this.INITIAL_PADDLE_Y;
		this.aiPredictedBallY = this.BALL_CENTER_Y;
		this.aiReactionDelay = 0.20;
		this.keys.delete('ArrowUp');
		this.keys.delete('ArrowDown');
		if (this.animationFrameId)
			cancelAnimationFrame(this.animationFrameId);
	}

	/**
		Nettoie complètement le jeu lors d'un changement de page ou mode
		Arrête l'animation, réinitialise l'état, supprime les event listeners
		Remet le score à zéro dans l'interface
	*/
	public cleanupGame() {
		this.gameRunning = false;
		this.gamePaused = false;
		this.whoWin = 'null';
		
		// Réinitialiser les modes de jeu
		this.gameBotGM = false;
		this.gameLocalGM = false;
		this.gameTournamentGM = false;
		
		this.divMessageWinOrLose.classList.add('hidden');
		// Nettoyer les touches de l'IA
		this.keys.delete('ArrowUp');
		this.keys.delete('ArrowDown');
		if (this.animationFrameId)
			cancelAnimationFrame(this.animationFrameId);
		this.resetGameState();
		
		// Effacer le canvas visuellement
		this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
		
		if (this.buttonStart) {
			this.buttonStart.disabled = false;
			this.buttonStart.removeEventListener('click', this.startGame);
		}
		if (this.buttonPause) {
			this.buttonPause.disabled = false;
			this.buttonPause.textContent = 'Pause';
			this.buttonPause.removeEventListener('click', this.pauseGame);
		}
		this.buttonStart.classList.remove('hidden');
		this.divScoreInGame.querySelector('span').textContent = `0 - 0`;
	}

	/**
		Termine la partie et affiche le message de victoire
		Détermine le gagnant en comparant les scores au WINNING_SCORE
		Affiche le nom du gagnant avec le score final de manière professionnelle
		Efface le canvas avec clearRect()
	*/
	private endGame() {
		this.gameRunning = false;
		this.divMessageWinOrLose.classList.remove('hidden');
		const isPlayerLoss = (this.gameBotGM && this.rightPaddle.score >= this.WINNING_SCORE);
		this.divMessageWinOrLose.style.color = isPlayerLoss ? 'rgba(239, 10, 10, 0.9)' : 'rgba(0, 255, 0, 0.9)';
		const finalScore = `${this.leftPaddle.score} - ${this.rightPaddle.score}`;
		const title = isPlayerLoss ? 'Défaite' : 'Victoire !';
		if (this.leftPaddle.score >= this.WINNING_SCORE) {
			const winnerName = this.currentMatch?.[0]?.displayName || 'Vous';
			this.divMessageWinOrLose.innerHTML = `
				<div class="text-center">
					<div class="text-5xl font-bold mb-3">${title}</div>
					<div class="text-xl">${winnerName} remporte la partie</div>
					<div class="text-lg opacity-75">Score final : ${finalScore}</div>
				</div>
			`;
			this.whoWin = 'left';
		}
		else {
			const winnerName = this.currentMatch?.[1]?.displayName || 'Bot';
			this.divMessageWinOrLose.innerHTML = `
				<div class="text-center">
					<div class="text-5xl font-bold mb-3">${title}</div>
					<div class="text-xl">${winnerName} remporte la partie</div>
					<div class="text-lg opacity-75">Score final : ${finalScore}</div>
				</div>
			`;
			this.whoWin = 'right';
		}
		this.ctx.clearRect(0, 0, this.CANVAS_WIDTH, this.CANVAS_HEIGHT);
		if (this.gameBotGM || this.gameLocalGM) {
			setTimeout(() => {
				window.location.reload();
			}, 3000);
		}
	}

	// ==================== INTELLIGENCE ARTIFICIELLE ====================
	private updateAI() {
		const currentTime = Date.now();
		
		if (currentTime - this.lastAITime >= this.aiUpdateInterval) {
			this.lastAITime = currentTime;
			this.aiPredictedBallY = this.predictBallPosition();
			const aiPredictionError = (Math.random() - 0.5) * this.PADDLE_HEIGHT * this.aiReactionDelay;
			this.aiTargetY = this.aiPredictedBallY + aiPredictionError;
			this.aiTargetY = Math.max(0, Math.min(this.PADDLE_MAX_Y, this.aiTargetY));
		}
		const paddleCenter = this.rightPaddle.y + this.PADDLE_HEIGHT / 2;
		const tolerance = 10; // Zone morte pour éviter les oscillations

		if (paddleCenter > this.aiTargetY + tolerance) {
			if (!this.keys.has('ArrowUp')) {
				this.keys.add('ArrowUp');
			}
			this.keys.delete('ArrowDown');
		}
		else if (paddleCenter < this.aiTargetY - tolerance) {
			if (!this.keys.has('ArrowDown')) {
				this.keys.add('ArrowDown');
			}
			this.keys.delete('ArrowUp');
		}
		else {
			this.keys.delete('ArrowUp');
			this.keys.delete('ArrowDown');
		}
	}

	// Prédit la position Y de la balle quand elle atteindra le côté droit du terrain
	// En simulant tous les rebonds sur les murs horizontaux
	private predictBallPosition(): number {
		if (this.ball.speed_x < 0) {
			return (this.CANVAS_HEIGHT / 2);
		}
		let simBallX = this.ball.x;
		let simBallY = this.ball.y;
		let simSpeedX = this.ball.speed_x;
		let simSpeedY = this.ball.speed_y;

		while (simBallX < this.RIGHT_PADDLE_EDGE) {
			simBallX += simSpeedX;
			simBallY += simSpeedY;
			if (simBallY <= 0 || simBallY >= this.CANVAS_HEIGHT) {
				simSpeedY = -simSpeedY;
				simBallY = Math.max(0, Math.min(this.CANVAS_HEIGHT, simBallY));
			}
		}
		return (simBallY - this.PADDLE_HEIGHT / 2);
	}

	// Ajuste dynamiquement la difficulté de l'IA en fonction de sa performance
	private adjustAIDifficulty() {
		const scoreDifference = this.rightPaddle.score - this.leftPaddle.score;

		if (scoreDifference > 2) {
			this.aiReactionDelay = Math.min(0.4, this.aiReactionDelay + 0.05);
		}
		else if (scoreDifference < -2) {
			this.aiReactionDelay = Math.max(0.15, this.aiReactionDelay - 0.05);
		}
	}
	
	// ==================== GETTER, SETTER ====================

	/**
		Définit le mode de jeu actif parmi les 3 modes disponibles
		Utilise un switch/case pour activer le bon flag
	*/
	public setModeGame(gamemode: 'gameBotGM' | 'gameLocalGM' | 'gameTournamentGM') {
		this.gameBotGM = false;
		this.gameLocalGM = false;
		this.gameTournamentGM = false;
		switch (gamemode) {
			case 'gameBotGM':
				this.gameBotGM = true;
				break;
			case 'gameLocalGM':
				this.gameLocalGM = true;
				break;
			case 'gameTournamentGM':
				this.gameTournamentGM = true;
				break;
			default:
				break;
		}
	}

	/**
		Définit les deux joueurs pour le match en cours
	*/
	public setMatchesPlayers(player1: [TournamentPlayer, TournamentPlayer]) {
		this.currentMatch = player1;
	}

	/**
		Retourne le gagnant de la partie
	*/
	public getWhoWin() {
		return (this.whoWin);
	}

	/**
		Retourne l'état actuel du jeu (en cours ou non)
	*/
	public getStatusGame(): boolean {
		return this.gameRunning;
	}

	/*
		Met à jour les scores des deux joueurs dans leurs statistiques de tournoi
	*/
	public getScoreTwoPlayers(player1: TournamentPlayer, player2: TournamentPlayer) {
		player1.tournamentStats.score = this.leftPaddle.score;
		player2.tournamentStats.score = this.rightPaddle.score;
	}
}