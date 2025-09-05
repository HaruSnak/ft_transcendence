// src/game.ts

import { PongGameUI } from './PongGameUI.js';

let gameUIInstance: PongGameUI | null = null;

// ==================== INITIALISATION and UPDATE ====================

// Initialiser le jeu
export function initGame()
{
    if (gameUIInstance) {
        gameUIInstance.getCleanUpGame();
    }
	gameUIInstance = new PongGameUI();
}

export function cleanUpGame() {
	gameUIInstance?.getCleanUpGame();
	gameUIInstance = null;
}

/*// ==================== BOT ====================
// Faire bouger le bot
function moveBot() {
	if (!gameRunning || gamePaused)
		return;

	// Position cible : centre du paddle aligné avec la balle
	const targetVerticalPosition = ball.y - TARGET_POSITION_OFFSET;

	// Simuler un délai (si le temps est écoulé, bouger)
	if (Math.random() < 0.2 * (1000 / botDelay)) // Probabilité ajustée
	{
		console.log('Bot bouge, targetY:', targetVerticalPosition, 'currentY:', rightPaddle.y); // Débogage
		if (targetVerticalPosition > rightPaddle.y && rightPaddle.y < PADDLE_MAX_Y)
			rightPaddle.y += PADDLE_SPEED;
		else if (targetVerticalPosition < rightPaddle.y && rightPaddle.y > 0)
			rightPaddle.y -= PADDLE_SPEED;
	}
}

// Ajuster la difficulté du bot par intervalles de score
function adjustBotDifficulty() {
	const totalScore = leftPaddle.score + rightPaddle.score;
	if (totalScore == 1) 
		botDelay = 280; // Facile (0-4 points)
	else if (totalScore == 2) 
		botDelay = 260; // Moyen (5-9 points, augmenté pour être moins dur)
	else 
		botDelay = 250; // Difficile (10+ points, fixé pour éviter l'inbattabilité)
	console.log('Nouveau délai du bot:', botDelay); // Débogage
}*/