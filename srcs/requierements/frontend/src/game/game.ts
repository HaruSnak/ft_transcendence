// src/game/game.ts
console.log('🎮 Loading game.ts...');

class SimplePongGame {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private startBtn: HTMLButtonElement;
    private messageDiv: HTMLDivElement;
    
    // Game state
    private leftPaddle = { x: 0, y: 250, width: 10, height: 100 };
    private rightPaddle = { x: 790, y: 250, width: 10, height: 100 };
    private ball = { x: 400, y: 300, dx: 2, dy: 2, size: 10 };
    private gameRunning = false;
    private animationId: number | null = null;
    
    // Controls
    private keys: Set<string> = new Set();

    constructor(canvas: HTMLCanvasElement, startBtn: HTMLButtonElement, messageDiv: HTMLDivElement) {
        this.canvas = canvas;
        this.startBtn = startBtn;
        this.messageDiv = messageDiv;
        this.ctx = canvas.getContext('2d')!;
        
        // Event listeners
        window.addEventListener('keydown', (e) => this.keys.add(e.key));
        window.addEventListener('keyup', (e) => this.keys.delete(e.key));
        
        this.startBtn.addEventListener('click', () => this.startGame());
        
        this.draw(); // Initial draw
    }

    startGame() {
        if (this.gameRunning) return;
        
        this.gameRunning = true;
        this.startBtn.disabled = true;
        this.messageDiv.classList.add('hidden');
        this.gameLoop();
    }

    private gameLoop() {
        this.update();
        this.draw();
        
        if (this.gameRunning) {
            this.animationId = requestAnimationFrame(() => this.gameLoop());
        }
    }

    private update() {
        // Move paddles
        if (this.keys.has('w') && this.leftPaddle.y > 0) {
            this.leftPaddle.y -= 5;
        }
        if (this.keys.has('s') && this.leftPaddle.y < 500) {
            this.leftPaddle.y += 5;
        }
        
        // For now, simple AI for right paddle
        if (this.ball.y < this.rightPaddle.y + 50 && this.rightPaddle.y > 0) {
            this.rightPaddle.y -= 3;
        }
        if (this.ball.y > this.rightPaddle.y + 50 && this.rightPaddle.y < 500) {
            this.rightPaddle.y += 3;
        }
        
        // Move ball
        this.ball.x += this.ball.dx;
        this.ball.y += this.ball.dy;
        
        // Ball collision with top/bottom
        if (this.ball.y <= 0 || this.ball.y >= 600) {
            this.ball.dy = -this.ball.dy;
        }
        
        // Ball collision with paddles
        if (this.ball.x <= 10 && this.ball.y >= this.leftPaddle.y && this.ball.y <= this.leftPaddle.y + 100) {
            this.ball.dx = -this.ball.dx;
        }
        if (this.ball.x >= 790 && this.ball.y >= this.rightPaddle.y && this.ball.y <= this.rightPaddle.y + 100) {
            this.ball.dx = -this.ball.dx;
        }
        
        // Score
        if (this.ball.x < 0) {
            this.endGame('You Lose!');
        }
        if (this.ball.x > 800) {
            this.endGame('You Win!');
        }
    }

    private draw() {
        // Clear canvas
        this.ctx.fillStyle = '#0a0a0b';
        this.ctx.fillRect(0, 0, 800, 600);
        
        // Draw paddles
        this.ctx.fillStyle = 'white';
        this.ctx.fillRect(this.leftPaddle.x, this.leftPaddle.y, this.leftPaddle.width, this.leftPaddle.height);
        this.ctx.fillRect(this.rightPaddle.x, this.rightPaddle.y, this.rightPaddle.width, this.rightPaddle.height);
        
        // Draw ball
        this.ctx.fillRect(this.ball.x - this.ball.size/2, this.ball.y - this.ball.size/2, this.ball.size, this.ball.size);
        
        // Draw center line
        this.ctx.setLineDash([5, 15]);
        this.ctx.beginPath();
        this.ctx.moveTo(400, 0);
        this.ctx.lineTo(400, 600);
        this.ctx.strokeStyle = 'white';
        this.ctx.stroke();
        this.ctx.setLineDash([]);
    }

    private endGame(message: string) {
        this.gameRunning = false;
        this.startBtn.disabled = false;
        this.messageDiv.textContent = message;
        this.messageDiv.classList.remove('hidden');
        
        // Reset positions
        this.leftPaddle.y = 250;
        this.rightPaddle.y = 250;
        this.ball.x = 400;
        this.ball.y = 300;
        this.ball.dx = 2;
        this.ball.dy = 2;
        
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    cleanupGame() {
        this.gameRunning = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        window.removeEventListener('keydown', (e) => this.keys.add(e.key));
        window.removeEventListener('keyup', (e) => this.keys.delete(e.key));
    }
}

let pongGame: SimplePongGame | null = null;

// ==================== INITIALISATION and UPDATE ====================

// Initialiser le jeu
export function initGame()
{
    console.log('🎮 Initializing game...');
    if (pongGame) {
        console.log('🎮 Cleaning up existing game...');
        pongGame.cleanupGame();
    }
    
    const canvas = document.getElementById('pongCanvas') as HTMLCanvasElement;
    const startBtn = document.getElementById('startGameButton') as HTMLButtonElement;
    const messageDiv = document.getElementById('gameMessageWinOrLose') as HTMLDivElement;
    
    console.log('🎮 Game elements found:', {
        canvas: !!canvas,
        startBtn: !!startBtn,
        messageDiv: !!messageDiv
    });
    
    if (canvas && startBtn && messageDiv) {
        console.log('🎮 Creating new PongGame instance...');
        pongGame = new SimplePongGame(canvas, startBtn, messageDiv);
        console.log('✅ Game initialized successfully');
    } else {
        console.log('❌ Game initialization failed: missing DOM elements');
    }
}

export function cleanUpGame() {
    console.log('🧹 Cleaning up game...');
	pongGame?.cleanupGame();
	pongGame = null;
    console.log('✅ Game cleaned up');
}