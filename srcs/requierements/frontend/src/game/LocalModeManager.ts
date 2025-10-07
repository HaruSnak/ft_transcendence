import { PlayerManager, TournamentPlayer } from './PlayerManager.js';
import { PongGame } from './PongBase.js';

export class OneVsOneManager extends PlayerManager {

	public async startMatch(pongGame: PongGame): Promise<void> {
		if (this.players.length !== 2) {
			throw new Error('Exactly 2 players required for 1v1 match');
		}
		const [player1, player2] = this.players;
		console.log(`1v1 Match: ${player1.displayName} vs ${player2.displayName}`);
		const winner = await this.playSingleMatch(pongGame, player1, player2);
		
		if (winner === 'left') {
			this.addMatchHistory(player1, player2, player1, '1v1');
			await this.showMatchResult(player1);
		}
		else if (winner === 'right') {
			this.addMatchHistory(player1, player2, player2, '1v1');
			await this.showMatchResult(player2);
		}
		else
			console.warn('Match ended in error');

		pongGame.cleanupGame();
		this.clearPlayers();
	}

	private async playSingleMatch(pongGame: PongGame, player1: TournamentPlayer, player2: TournamentPlayer): Promise<string | null> {
		try {
			pongGame.setMatchesPlayers([player1, player2]);
			pongGame.cleanupGame();
			pongGame.draw();
			return (await this.waitForMatchResult(pongGame, player1, player2));
		}
		catch (error) {
			console.error('1v1 Match error:', error);
			return (null);
		}
	}

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

	private async showMatchResult(winner: TournamentPlayer): Promise<void> {
		return new Promise(resolve => {
			const MsgWinOrLose = document.getElementById('gameMessageWinOrLose');
			if (!MsgWinOrLose) {
				resolve();
				return;
			}

			MsgWinOrLose.classList.remove('hidden');
			MsgWinOrLose.innerHTML = '';
			
			const container = document.createElement('div');
			container.className = 'text-center';

			const title = document.createElement('div');
			title.className = 'text-2xl font-bold text-green-400 mb-4';
			title.textContent = `🎉 ${winner.displayName} WINS! 🎉`;

			container.appendChild(title);
			MsgWinOrLose.appendChild(container);
			
			setTimeout(() => {
				resolve();
				window.location.reload();
			}, 3000);
		});
	}
}