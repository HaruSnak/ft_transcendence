// src/game.ts
import { PongGameUI } from './PongGameUI.js';
/*
    Instance singleton du jeu Pong
    Garantit qu'une seule instance du jeu existe à la fois
*/
let gameUIInstance = null;
// ==================== INITIALISATION and CLEANUP ====================
/*
    Initialise le jeu Pong et crée l'interface utilisateur
    Nettoie l'instance précédente si elle existe (évite les fuites mémoire)
    Appelée depuis le système de navigation (index.ts) lors de l'accès à #game
*/
export function initGame() {
    if (gameUIInstance) {
        gameUIInstance.getCleanUpGame();
    }
    gameUIInstance = new PongGameUI();
}
/*
    Nettoie complètement le jeu et libère les ressources
    Réinitialise l'instance à null pour permettre le garbage collection
    Appelée depuis le système de navigation lors de la sortie de #game
*/
export function cleanUpGame() {
    gameUIInstance?.getCleanUpGame();
    gameUIInstance = null;
}
