// src/game.ts
// ==================== Configuration du Pong ====================
const CANVAS_WIDTH = 800; // Largeur du canvas
const CANVAS_HEIGHT = 600; // Hauteur du canvas
const PADDLE_WIDTH = 10; // Largeur des paddles
const PADDLE_HEIGHT = 100; // Hauteur des paddles
const BALL_SIZE = 10; // Taille de la balle
const PADDLE_SPEED = 3; // Vitesse des paddles
const BALL_SPEED = 2.5; // Vitesse de la balle (fixe, pas de changement)
const WINNING_SCORE = 3; // Score pour gagner la partie
// ==================== État du jeu ====================
const INITIAL_PADDLE_Y = CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2; // Position verticale initiale des paddles
const BALL_CENTER_X = CANVAS_WIDTH / 2; // Centre horizontal de la balle
const BALL_CENTER_Y = CANVAS_HEIGHT / 2; // Centre vertical de la balle
const SCORE_LEFT_X = CANVAS_WIDTH / 4; // Position X du score gauche
const SCORE_RIGHT_X = 3 * CANVAS_WIDTH / 4; // Position X du score droit
const PADDLE_MAX_Y = CANVAS_HEIGHT - PADDLE_HEIGHT; // Limite supérieure des paddles
const RIGHT_PADDLE_STARTING_X_POSITION = CANVAS_WIDTH - PADDLE_WIDTH; // Position horizontale initiale du paddle droit
const TARGET_POSITION_OFFSET = PADDLE_HEIGHT / 2; // Décalage pour centrer la position cible du bot
const LEFT_PADDLE_EDGE = PADDLE_WIDTH; // Bord gauche du paddle gauche
const RIGHT_PADDLE_EDGE = CANVAS_WIDTH - PADDLE_WIDTH; // Bord droit du paddle droit
let leftPaddle = { x: 0, y: INITIAL_PADDLE_Y, score: 0 };
let rightPaddle = { x: RIGHT_PADDLE_STARTING_X_POSITION, y: INITIAL_PADDLE_Y, score: 0 };
let ball = { x: BALL_CENTER_X, y: BALL_CENTER_Y, speed_x: BALL_SPEED, speed_y: BALL_SPEED };
let gameRunning = false; // Jeu en cours
let gamePaused = false; // Jeu en pause
let animationFrameId; // ID de l'animation
let botDelay = 300; // Délai initial du bot en ms (0.3 seconde, facile)
// Stocker les touches
const keys = new Set();
// Canvas et contexte
const canvas = document.getElementById('pongCanvas');
const ctx = canvas.getContext('2d');
// Écouter les touches
window.addEventListener('keydown', (e) => keys.add(e.key));
window.addEventListener('keyup', (e) => keys.delete(e.key));
// ==================== INITIALISATION and UPDATE ====================
// Dessiner le jeu
function draw() {
    if (!ctx)
        return;
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.fillStyle = "white";
    ctx.fillRect(leftPaddle.x, leftPaddle.y, PADDLE_WIDTH, PADDLE_HEIGHT);
    ctx.fillRect(rightPaddle.x, rightPaddle.y, PADDLE_WIDTH, PADDLE_HEIGHT);
    ctx.font = '30px Arial';
    ctx.fillText(leftPaddle.score.toString(), SCORE_LEFT_X, 50);
    ctx.fillText(rightPaddle.score.toString(), SCORE_RIGHT_X, 50);
    ctx.fillStyle = "red";
    ctx.fillRect(ball.x - BALL_SIZE / 2, ball.y - BALL_SIZE / 2, BALL_SIZE, BALL_SIZE);
}
// Initialiser le jeu
export function initGame() {
    if (!canvas || !ctx) {
        console.error('Canvas ou contexte non trouvé');
        return;
    }
    resetGameState();
    draw();
    const startButton = document.getElementById('startGameButton');
    startButton.addEventListener('click', startGame);
    const pauseButton = document.getElementById('pauseGameButton');
    pauseButton.addEventListener('click', pauseGame);
    const resetButton = document.getElementById('resetGameButton');
    resetButton.addEventListener('click', resetGame);
}
// Gérer les touches du joueur
function handleInput() {
    if (keys.has('w') && leftPaddle.y > 0)
        leftPaddle.y -= PADDLE_SPEED;
    if (keys.has('s') && leftPaddle.y < PADDLE_MAX_Y)
        leftPaddle.y += PADDLE_SPEED;
}
// Mettre à jour le jeu
function update() {
    if (!gameRunning || gamePaused)
        return;
    // Vérifier si un joueur a gagné
    if (leftPaddle.score >= WINNING_SCORE || rightPaddle.score >= WINNING_SCORE) {
        endGame();
        return; // Arrêter la mise à jour
    }
    // Déplacer la balle dans les deux directions
    ball.x += ball.speed_x;
    ball.y += ball.speed_y;
    // Rebondir sur les murs
    if (ball.y < 0 || ball.y > CANVAS_HEIGHT)
        ball.speed_y = -ball.speed_y;
    // Collisions avec les paddles
    if (ball.x < LEFT_PADDLE_EDGE && ball.y > leftPaddle.y && ball.y < leftPaddle.y + PADDLE_HEIGHT) {
        ball.speed_x = -ball.speed_x;
    }
    if (ball.x > RIGHT_PADDLE_EDGE && ball.y > rightPaddle.y && ball.y < rightPaddle.y + PADDLE_HEIGHT) {
        ball.speed_x = -ball.speed_x;
    }
    // Points et reset
    if (ball.x < 0) {
        rightPaddle.score++;
        adjustBotDifficulty();
        resetBall();
    }
    if (ball.x > CANVAS_WIDTH) {
        leftPaddle.score++;
        adjustBotDifficulty();
        resetBall();
    }
    handleInput(); // Joueur
    moveBot(); // Bot
    draw();
    animationFrameId = requestAnimationFrame(update);
}
// ==================== START and PAUSE ====================
// Lancer le jeu
function startGame() {
    if (!gameRunning) {
        resetGameState(); // Reset complet (scores, positions, botDelay)
        gameRunning = true;
        gamePaused = false;
        const messageElement = document.getElementById('gameMessageWinOrLose');
        messageElement.classList.add('hidden');
        console.log('Jeu démarré, délai bot:', botDelay);
        update();
        document.getElementById('startGameButton').disabled = true;
        document.getElementById('pauseGameButton').disabled = false; // Réactiver "Pause"
        messageElement.classList.remove('text-green-400', 'text-red-400'); // Enlever les couleurs au relance
    }
}
// Mettre en pause ou reprendre
function pauseGame() {
    if (gameRunning) {
        if (!gamePaused) {
            gamePaused = true;
            document.getElementById('pauseGameButton').textContent = 'Resume';
        }
        else {
            gamePaused = false;
            document.getElementById('pauseGameButton').textContent = 'Pause';
            update();
        }
    }
}
// ==================== RESET, CLEAN and END ====================
// Réinitialiser la balle et les paddles après un goal
function resetBall() {
    ball.x = BALL_CENTER_X;
    ball.y = BALL_CENTER_Y;
    ball.speed_x = -ball.speed_x; // Inverser la direction horizontale
    ball.speed_y = Math.random() > 0.5 ? BALL_SPEED : -BALL_SPEED; // Direction verticale aléatoire
    leftPaddle.y = INITIAL_PADDLE_Y; // Réinitialiser le paddle gauche
    rightPaddle.y = INITIAL_PADDLE_Y; // Réinitialiser le paddle droit
}
// Réinitialiser l'état
function resetGameState() {
    leftPaddle = { x: 0, y: INITIAL_PADDLE_Y, score: 0 };
    rightPaddle = { x: RIGHT_PADDLE_STARTING_X_POSITION, y: INITIAL_PADDLE_Y, score: 0 };
    ball = { x: BALL_CENTER_X, y: BALL_CENTER_Y, speed_x: BALL_SPEED, speed_y: BALL_SPEED };
    gameRunning = false;
    botDelay = 300; // Réinitialiser le délai du bot
    if (animationFrameId)
        cancelAnimationFrame(animationFrameId);
}
// Réinitialiser le jeu
function resetGame() {
    resetGameState(); // Reset complet
    gamePaused = false;
    const messageElement = document.getElementById('gameMessageWinOrLose');
    messageElement.classList.add('hidden');
    messageElement.classList.remove('text-green-400', 'text-red-400');
    document.getElementById('pauseGameButton').textContent = 'Pause';
    document.getElementById('pauseGameButton').disabled = false; // Réactiver "Pause"
    document.getElementById('startGameButton').disabled = false; // Réactiver "Start Game"
    draw();
}
// Nettoyer
export function cleanupGame() {
    gameRunning = false;
    gamePaused = false;
    if (animationFrameId)
        cancelAnimationFrame(animationFrameId);
    resetGameState();
    const startButton = document.getElementById('startGameButton');
    if (startButton) {
        startButton.disabled = false;
        startButton.removeEventListener('click', startGame);
    }
    const pauseButton = document.getElementById('pauseGameButton');
    if (pauseButton) {
        pauseButton.disabled = false;
        pauseButton.removeEventListener('click', pauseGame);
    }
    const resetButton = document.getElementById('resetGameButton');
    if (resetButton) {
        resetButton.disabled = false;
        resetButton.removeEventListener('click', resetGame);
    }
}
function disableCanvas() {
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
}
// Terminer la partie et afficher le message
function endGame() {
    gameRunning = false;
    const messageElement = document.getElementById('gameMessageWinOrLose');
    messageElement.classList.remove('hidden');
    if (leftPaddle.score >= WINNING_SCORE) // Si j'ai le temps, securiser cela cas cheat ou bug > WINNING_SCORE
     {
        messageElement.textContent = 'YOU WIN !';
        messageElement.classList.add('text-green-600');
    }
    else {
        messageElement.textContent = 'YOU LOSE !';
        messageElement.classList.add('text-red-600');
    }
    disableCanvas();
    document.getElementById('startGameButton').disabled = false; // Réactiver Start Game pour relancer
}
// ==================== BOT ====================
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
}
