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
	private readonly PADDLE_SPEED = 3;				// Vitesse des paddles
	private readonly BALL_SPEED = 1;				// Vitesse de la balle (fixe, pas de changement) | 2.7
	private readonly WINNING_SCORE = 1;			// Score pour gagner la partie | 10

	// Stocker les touches
	private readonly keys: Set<string> = new Set();

	// Canvas et contexte/bouttons
	public canvas!: HTMLCanvasElement;
	private ctx!: CanvasRenderingContext2D;

	// ==================== État du jeu ====================
	private readonly INITIAL_PADDLE_Y = this.CANVAS_HEIGHT / 2 - this.PADDLE_HEIGHT / 2; // Position verticale initiale des paddles
	private readonly BALL_CENTER_X = this.CANVAS_WIDTH / 2;                        // Centre horizontal de la balle
	private readonly BALL_CENTER_Y = this.CANVAS_HEIGHT / 2;                       // Centre vertical de la balle
	private readonly SCORE_LEFT_X = this.CANVAS_WIDTH / 4;                         // Position X du score gauche
	private readonly SCORE_RIGHT_X = 3 * this.CANVAS_WIDTH / 4;                    // Position X du score droit
	private readonly PADDLE_MAX_Y = this.CANVAS_HEIGHT - this.PADDLE_HEIGHT;            // Limite supérieure des paddles
	private readonly RIGHT_PADDLE_STARTING_X_POSITION = this.CANVAS_WIDTH - this.PADDLE_WIDTH; // Position horizontale initiale du paddle droit
	//private readonly TARGET_POSITION_OFFSET = this.PADDLE_HEIGHT / 2;              // Décalage pour centrer la position cible du bot
	private readonly LEFT_PADDLE_EDGE = this.PADDLE_WIDTH;                         // Bord gauche du paddle gauche
	private readonly RIGHT_PADDLE_EDGE = this.CANVAS_WIDTH - this.PADDLE_WIDTH;         // Bord droit du paddle droit
	private leftPaddle: Paddle = { x: 0, y: this.INITIAL_PADDLE_Y, score: 0 };
	private rightPaddle: Paddle = { x: this.RIGHT_PADDLE_STARTING_X_POSITION, y: this.INITIAL_PADDLE_Y, score: 0 };
	private ball: Ball = { x: this.BALL_CENTER_X, y: this.BALL_CENTER_Y, speed_x: this.BALL_SPEED, speed_y: this.BALL_SPEED };
	private gameRunning = false;    // Jeu en cours
	private gamePaused = false;     // Jeu en pause
	private gameBotGM = false;		// Gamemode Bot
	private gameLocalGM = false;	// Gamemode Local
	private gameTournamentGM = false;	// Gamemode Tournament
	private animationFrameId: number; // ID de l'animation
	private botDelay = 300;         // Délai initial du bot en ms (0.3 seconde, facile)
	private whoWin: 'left' | 'right' | 'null';
	private currentMatch: [TournamentPlayer, TournamentPlayer];

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
		
		window.addEventListener('keydown', (e) => this.keys.add(e.key));
		window.addEventListener('keyup', (e) => this.keys.delete(e.key));
	}

	// ==================== START and PAUSE ====================

	private showPreGameMessage() {
		this.divMessageWinOrLose.classList.remove('hidden');
		this.divMessageWinOrLose.style.color = 'oklch(98.7% 0.022 95.277)';
		const player1Name = (this.currentMatch?.[0]?.displayName ? this.currentMatch[0].displayName : 'You');
		const player2Name = (this.currentMatch?.[1]?.displayName ? this.currentMatch[1].displayName : 'Bot');
	    this.divMessageWinOrLose.innerHTML = `
			<div class="text-center">
				<div class="text-l font-bold mb-2">${player1Name} vs ${player2Name}</div>
				<div class="text-xl">Press 'start game' when you are ready!</div>
			</div>
    	`;	
		return ;
	}

	private drawPlayerNames() {
		if (this.gameBotGM) {
			this.ctx.fillText(`You`, this.SCORE_LEFT_X, 50);
			this.ctx.fillText(`Bot`, this.SCORE_RIGHT_X, 50);
		}
		else if (this.gameLocalGM || this.gameTournamentGM) {
			this.ctx.fillText(this.currentMatch[0].displayName, this.SCORE_LEFT_X, 50);
			this.ctx.fillText(this.currentMatch[1].displayName, this.SCORE_RIGHT_X, 50);
		}
	}

	// Dessiner le jeu
	public draw() {
		if (!this.ctx)
			return;
		this.ctx.clearRect(0, 0, this.CANVAS_WIDTH, this.CANVAS_HEIGHT);
		if (!this.gameRunning) {
			this.showPreGameMessage();
			return ;
		}
		this.ctx.fillStyle = "white";
		this.ctx.fillRect(this.leftPaddle.x, this.leftPaddle.y, this.PADDLE_WIDTH, this.PADDLE_HEIGHT);
		this.ctx.fillRect(this.rightPaddle.x, this.rightPaddle.y, this.PADDLE_WIDTH, this.PADDLE_HEIGHT);
		this.ctx.font = '30px Arial';
		this.drawPlayerNames();
		this.divScoreInGame.querySelector('span').textContent = `${this.rightPaddle.score} - ${this.leftPaddle.score}`;
		this.ctx.fillStyle = "red";
		this.ctx.fillRect(this.ball.x - this.BALL_SIZE / 2, this.ball.y - this.BALL_SIZE / 2, this.BALL_SIZE, this.BALL_SIZE);
	}

	// Gérer les touches du joueur
	private handleInput() {
		if (this.keys.has('w') && this.leftPaddle.y > 0)
			this.leftPaddle.y -= this.PADDLE_SPEED;
		if (this.keys.has('s') && this.leftPaddle.y < this.PADDLE_MAX_Y)
			this.leftPaddle.y += this.PADDLE_SPEED;
		if ((this.gameLocalGM || this.gameTournamentGM && this.currentMatch[1].displayName != 'Bot')
			&& this.keys.has('ArrowUp') && this.rightPaddle.y > 0)
			this.rightPaddle.y -= this.PADDLE_SPEED;
		if ((this.gameLocalGM || this.gameTournamentGM && this.currentMatch[1].displayName != 'Bot')
			&& this.keys.has('ArrowDown') && this.rightPaddle.y < this.PADDLE_MAX_Y)
			this.rightPaddle.y += this.PADDLE_SPEED;
	}


	// Mettre à jour le jeu
	private update() {
		if (!this.gameRunning || this.gamePaused)
			return;

		// Vérifier si un joueur a gagné
		if (this.leftPaddle.score >= this.WINNING_SCORE || this.rightPaddle.score >= this.WINNING_SCORE) {
			this.endGame();
			return;
		}

		// Déplacer la balle dans les deux directions
		this.ball.x += this.ball.speed_x;
		this.ball.y += this.ball.speed_y;

		// Rebondir sur les murs
		if (this.ball.y < 0 || this.ball.y > this.CANVAS_HEIGHT)
			this.ball.speed_y = -this.ball.speed_y;

		// Collisions avec les paddles
		if (this.ball.x < this.LEFT_PADDLE_EDGE && this.ball.y > this.leftPaddle.y && this.ball.y < this.leftPaddle.y + this.PADDLE_HEIGHT) {
			this.ball.speed_x = -this.ball.speed_x;
		}
		if (this.ball.x > this.RIGHT_PADDLE_EDGE && this.ball.y > this.rightPaddle.y && this.ball.y < this.rightPaddle.y + this.PADDLE_HEIGHT) {
			this.ball.speed_x = -this.ball.speed_x;
		}

		// Points et reset
		if (this.ball.x < 0) {
			this.rightPaddle.score++;
			//adjustBotDifficulty();
			this.resetBall();
		}
		if (this.ball.x > this.CANVAS_WIDTH) {
			this.leftPaddle.score++;
			//this.adjustBotDifficulty();
			this.resetBall();
		}

		this.handleInput(); // Joueur
		if (this.gameBotGM)	// Bot Gamemode
			console.log('GameBot');
		if (this.gameTournamentGM)
			console.log('GameTournament');
			//this.moveBot();
		this.draw();
		this.animationFrameId = requestAnimationFrame(() => this.update());
	}

	// ==================== START and PAUSE ====================
	
	// Timer pour start le lancement du jeu
	private startCountdown(callback: () => void): void {
		let countdown = 3;
		
		const countdownInterval = setInterval(() => {
			const text = countdown > 0 ? countdown.toString() : 'GO!';

			this.ctx.clearRect(0, 0, this.CANVAS_WIDTH, this.CANVAS_HEIGHT);
			this.ctx.save();
			this.ctx.fillStyle = countdown > 0 ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 255, 0, 0.9)';
			this.ctx.font = 'bold 120px Arial';
			this.ctx.textAlign = 'center';
			this.ctx.textBaseline = 'middle';
			this.ctx.fillText(text, this.CANVAS_WIDTH / 2, this.CANVAS_HEIGHT / 2);
			this.ctx.restore();
			countdown--;
			if (countdown < -1) {
				clearInterval(countdownInterval);
				callback();
			}
		}, 1000);
	}

	// Lancer le jeu
	public startGame() {
		if (!this.gameRunning) {
			console.log(`start jeu`);
			this.resetGameState();
			this.buttonStart.disabled = true;
			this.divMessageWinOrLose.classList.add('hidden');
			this.startCountdown(() => {
				this.gameRunning = true;
				this.gamePaused = false;
				this.divScoreInGame.style.display = 'block';
				this.update();
				this.buttonPause.disabled = false;
			});
		}
	}

	// Mettre en pause ou reprendre
	public pauseGame() {
		if (this.gameRunning) {
			if (!this.gamePaused) {
			this.gamePaused = true;
			this.buttonPause.textContent = 'Resume';
			}
			else {
			this.gamePaused = false;
			this.buttonPause.textContent = 'Pause';
			this.update();
			}
		}
	}

	// ==================== RESET, CLEAN and END ====================
	// Réinitialiser la balle et les paddles après un goal
	private resetBall() {
		this.ball.x = this.BALL_CENTER_X;
		this.ball.y = this.BALL_CENTER_Y;
		this.ball.speed_x = -this.ball.speed_x; // Inverser la direction horizontale
		this.ball.speed_y = Math.random() > 0.5 ? this.BALL_SPEED : -this.BALL_SPEED; // Direction verticale aléatoire
		this.leftPaddle.y = this.INITIAL_PADDLE_Y;  // Réinitialiser le paddle gauche
		this.rightPaddle.y = this.INITIAL_PADDLE_Y; // Réinitialiser le paddle droit
	}

	// Réinitialiser l'état
	private resetGameState() {
		this.leftPaddle = { x: 0, y: this.INITIAL_PADDLE_Y, score: 0 };
		this.rightPaddle = { x: this.RIGHT_PADDLE_STARTING_X_POSITION, y: this.INITIAL_PADDLE_Y, score: 0 };
		this.ball = { x: this.BALL_CENTER_X, y: this.BALL_CENTER_Y, speed_x: this.BALL_SPEED, speed_y: this.BALL_SPEED };
		this.gameRunning = false;
		this.botDelay = 300; // Réinitialiser le délai du bot
		if (this.animationFrameId)
			cancelAnimationFrame(this.animationFrameId);
	}

	// Réinitialiser le jeu
	public cleanupGame() {
		this.gameRunning = false;
		this.gamePaused = false;
		this.whoWin = 'null';
		this.divMessageWinOrLose.classList.add('hidden');
		if (this.animationFrameId)
			cancelAnimationFrame(this.animationFrameId);
		this.resetGameState();
		if (this.buttonStart) {
			this.buttonStart.disabled = false;
			this.buttonStart.removeEventListener('click', this.startGame);
		}
		if (this.buttonPause) {
			this.buttonPause.disabled = false;
			this.buttonPause.removeEventListener('click', this.pauseGame);
		}
		this.divScoreInGame.querySelector('span').textContent = `0 - 0`;
	}

	// Terminer la partie et afficher le message
	private endGame() {
		this.gameRunning = false;
		this.divMessageWinOrLose.classList.remove('hidden');
		this.divMessageWinOrLose.style.color = 'rgba(0, 255, 0, 0.9)';
		if (this.leftPaddle.score >= this.WINNING_SCORE) {
			const winnerName = this.currentMatch?.[0]?.displayName || 'You';
			this.divMessageWinOrLose.textContent = `🎉 ${winnerName} WINS!`;
			this.whoWin = 'left';
		}
		else {
			const winnerName = this.currentMatch?.[1]?.displayName || 'Bot';
			this.divMessageWinOrLose.textContent = `🎉 ${winnerName} WINS!`;
			this.whoWin = 'right';
		}
		this.ctx.clearRect(0, 0, this.CANVAS_WIDTH, this.CANVAS_HEIGHT);
	}

	// ==================== GETTER, SETTER ====================

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

	public setMatchesPlayers(player1: [TournamentPlayer, TournamentPlayer]) {
		this.currentMatch = player1;
	}

	public getWhoWin() {
		return (this.whoWin);
	}

	public async getStatusGame() {
		return (this.gameRunning);
	}

	public getScoreTwoPlayers(player1: TournamentPlayer, player2: TournamentPlayer) {
		player1.tournamentStats.score = this.leftPaddle.score;
		player2.tournamentStats.score = this.rightPaddle.score;
	}
}