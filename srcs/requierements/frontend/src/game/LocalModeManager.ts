import { PlayerManager, TournamentPlayer } from './PlayerManager.js';
import { PongGame } from './PongBase.js';

export class OneVsOneManager extends PlayerManager {

	/*
		Lance un match 1v1 entre exactement 2 joueurs
		Attend le résultat du match, enregistre l'historique et affiche le gagnant
		Nettoie le jeu et les joueurs à la fin
	*/
	public async startMatch(pongGame: PongGame): Promise<void> {
		if (this.players.length !== 2) {
			throw new Error('Exactly 2 players required for 1v1 match');
		}
		const [player1, player2] = this.players;
		//console.log(`1v1 Match: ${player1.displayName} vs ${player2.displayName}`);
		const winner = await this.playSingleMatch(pongGame, player1, player2);
		
		if (winner === 'left') {
			this.addMatchHistory(player1, player2, player1, '1v1');
		}
		else if (winner === 'right') {
			this.addMatchHistory(player1, player2, player2, '1v1');
		}
		else
			console.warn('Match ended in error');

		pongGame.cleanupGame();
		this.clearPlayers();
	}

	/*
		Gère un match unique entre deux joueurs
		Configure le jeu avec les joueurs, nettoie l'état et attend le résultat
		Utilise waitForMatchResult() en Promise pour attendre la fin du match
	*/
	private async playSingleMatch(pongGame: PongGame, player1: TournamentPlayer, player2: TournamentPlayer): Promise<string | null> {
		try {
			pongGame.setMatchesPlayers([player1, player2]);
			pongGame.cleanupGame();
			pongGame.setModeGame('gameLocalGM');
			pongGame.draw();
			return (await this.waitForMatchResult(pongGame, player1, player2));
		}
		catch (error) {
			console.error('1v1 Match error:', error);
			return (null);
		}
	}

	/*
		Attend de manière asynchrone le résultat du match
		Utilise une Promise avec vérification récursive toutes les 100ms via setTimeout()
		Récupère les scores finaux des joueurs une fois le match terminé
	*/
	private async waitForMatchResult(pongGame: PongGame, player1: TournamentPlayer, player2: TournamentPlayer): Promise<string | null> {
		return new Promise((resolve) => {
			const checkWinner = () => {
				const result = pongGame.getWhoWin();
				if (result === 'left' || result === 'right') {
					pongGame.getScoreTwoPlayers(player1, player2);
					setTimeout(() => resolve(result), 2000);
				}
				else if (result === 'null')
					setTimeout(checkWinner, 100);
				else
					resolve(null);
			};
			checkWinner();
		});
	}
}