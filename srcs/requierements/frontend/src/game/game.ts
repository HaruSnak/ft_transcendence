// src/game/game.ts
console.log('🎮 Loading game.ts...');

import { PongGame } from './PongBase.js';
import { TournamentManager } from './TournamentManager.js';
import { OneVsOneManager } from './LocalModeManager.js';

let pongGame: PongGame | null = null;
let tournamentManager: TournamentManager | null = null;
let localModeManager: OneVsOneManager | null = null;

// ==================== INITIALISATION and UPDATE ====================

// Initialiser le jeu
export function initGame(mode: 'solo' | 'local' | 'tournament' = 'solo')
{
    console.log(`🎮 Initializing game in ${mode} mode...`);
    if (pongGame) {
        console.log('🎮 Cleaning up existing game...');
        pongGame.cleanupGame();
    }
    
    const canvas = document.getElementById('pongCanvas') as HTMLCanvasElement;
    const startBtn = document.getElementById('startGameButton') as HTMLButtonElement;
    const pauseBtn = document.getElementById('pauseGameButton') as HTMLButtonElement;
    const messageDiv = document.getElementById('gameMessageWinOrLose') as HTMLDivElement;
    const scoreDiv = document.getElementById('gameScore') as HTMLDivElement;
    
    console.log('🎮 Game elements found:', {
        canvas: !!canvas,
        startBtn: !!startBtn,
        pauseBtn: !!pauseBtn,
        messageDiv: !!messageDiv,
        scoreDiv: !!scoreDiv
    });
    
    if (canvas && startBtn && pauseBtn && messageDiv && scoreDiv) {
        console.log('🎮 Creating new PongGame instance...');
        pongGame = new PongGame(startBtn, pauseBtn, messageDiv, scoreDiv);
        
        // Set game mode
        if (mode === 'solo') {
            pongGame.setModeGame('gameBotGM');
        } else if (mode === 'local') {
            pongGame.setModeGame('gameLocalGM');
        } else if (mode === 'tournament') {
            pongGame.setModeGame('gameTournamentGM');
        }
        
        // Add event listeners
        startBtn.addEventListener('click', () => pongGame?.startGame());
        pauseBtn.addEventListener('click', () => pongGame?.pauseGame());
        
        pongGame.draw(); // Initial draw
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

export { pongGame };