import { PlayerManager, TournamentPlayer } from './PlayerManager.js';
import { PongGame } from './PongBase.js';
import { TournamentPingService } from '../services/tournament_ping_service.js';

export class TournamentManager extends PlayerManager {

	/*
		Crée les paires de matchs pour un tour de tournoi
		Ajoute automatiquement un Bot si le nombre de joueurs est impair
		Utilise un algorithme de pairage croisé (premier vs dernier, etc.)
	*/
	public createMatches(): Array<[TournamentPlayer, TournamentPlayer]> {
		const matches: Array<[TournamentPlayer, TournamentPlayer]> = [];
		
		// Ajouter un bot si nombre impair
		if (this.players.length % 2 !== 0) {
			const bot: TournamentPlayer = {
				userId: `temp_${Date.now()}_${Math.random()}`,
				displayName: "Bot",
				type: 'Guest',
				isAuthenticated: false,
				tournamentStats: { score: 0 }
			};
			this.players.push(bot);
		}

		// Créer les matchs
		let low = 0;
		for (let high = this.players.length - 1; high > low; high--) {
			matches.push([this.players[low], this.players[high]]);
			low++;
		}
		return (matches);
	}

	/*
		Lance et gère l'ensemble du tournoi à élimination directe
		Boucle sur les tours jusqu'à ce qu'il ne reste qu'un champion
		Enregistre l'historique des matchs et affiche le champion final
		Utilise window.location.reload() pour retourner au menu après
	*/
	public async startTournament(pongGame: PongGame, playerMatch: Array<[TournamentPlayer, TournamentPlayer]>): Promise<void> {
		// Activer les pings pour ce tournoi
		const tournamentId = `tournament_${Date.now()}`;
		TournamentPingService.enableTournamentPings(tournamentId);
		
		while (playerMatch.length > 0) {
			const nextRoundPlayers: TournamentPlayer[] = [];
			
			for (const [player1, player2] of playerMatch) {
				console.log(`${player1.displayName} vs ${player2.displayName}`);
				
				// Envoyer les pings aux joueurs de ce match
				this.sendTurnNotifications(player1, player2, tournamentId);
				
				const winner = await this.playSingleMatch(pongGame, player1, player2);
				
				if (winner === 'left') {
					this.addMatchHistory(player1, player2, player1, 'Tournament');
					nextRoundPlayers.push(player1);
				}
				else if (winner === 'right') {
					this.addMatchHistory(player1, player2, player2, 'Tournament');
					nextRoundPlayers.push(player2);
				}
				else {
					console.warn(`Match error between ${player1.displayName} and ${player2.displayName}`);
					this.resetScore(player1, player2);
					nextRoundPlayers.push(player1);
				}
			}
			if (nextRoundPlayers.length === 1) {
				await this.showChampion(nextRoundPlayers[0]);
				pongGame.cleanupGame();
				TournamentPingService.disableTournamentPings();
				window.location.reload();
				return ;
			}
			this.players = nextRoundPlayers;
			playerMatch = this.createMatches();
		}
	}

	/*
		Gère un match unique entre deux joueurs du tournoi
		Configure le jeu, nettoie l'état et attend le résultat via Promise
		Affiche les logs du résultat dans la console
	*/
	private async playSingleMatch(pongGame: PongGame, player1: TournamentPlayer, player2: TournamentPlayer): Promise<string | null> {
		try {
			pongGame.setMatchesPlayers([player1, player2]);
			pongGame.cleanupGame();
			pongGame.setModeGame('gameTournamentGM');
			pongGame.draw();
			
			const winner = await this.waitForMatchResult(pongGame, player1, player2);
			console.log(`Match finished: ${winner || 'Draw'}`);
			return (winner);
		}
		catch (error) {
			console.error('Match error:', error);
			return (null);
		}
	}

	/*
		Attend de manière asynchrone le résultat d'un match
		Utilise une Promise avec vérification récursive toutes les 100ms via setTimeout()
		Nettoie le jeu et attend 4 secondes avant de résoudre (délai pour voir le résultat)
		Récupère les scores finaux des joueurs via getScoreTwoPlayers()
	*/
	private async waitForMatchResult(pongGame: PongGame, player1: TournamentPlayer, player2: TournamentPlayer): Promise<string | null> {
		return new Promise((resolve) => {
			const checkWinner = () => {
				const result = pongGame.getWhoWin();
				if (result === 'left' || result === 'right') {
					pongGame.getScoreTwoPlayers(player1, player2);
					setTimeout(() => {
						pongGame.cleanupGame();
						resolve(result);
					}, 4000);
				}
				else if (result === 'null')
					setTimeout(checkWinner, 100);
				else
					resolve(null);
			};
			checkWinner();
		});
	}

	/*
		Affiche l'écran de célébration du champion du tournoi
		Crée dynamiquement les éléments DOM avec classes Tailwind CSS (jaune pour champion)
		Affiche un message pendant 5 secondes avant de résoudre la Promise
	*/
	private async showChampion(championPly: TournamentPlayer): Promise<void> {
		return new Promise(resolve => {
			const MsgWinOrLose = document.getElementById('gameMessageWinOrLose');
			if (!MsgWinOrLose) {
				resolve();
				return ;
			}

			MsgWinOrLose.classList.remove('hidden');
			MsgWinOrLose.classList.add('w-full');
			MsgWinOrLose.innerHTML = '';
			
			const container = document.createElement('div');
			container.className = 'text-center';

			const title = document.createElement('div');
			title.className = 'text-3xl font-bold text-yellow-400 mb-4';
			title.textContent = '🏆 TOURNAMENT CHAMPION! 🏆';

			const championName = document.createElement('div');
			championName.className = 'text-2xl font-semibold mb-2';
			championName.textContent = championPly.displayName;

			const subtitle = document.createElement('div');
			subtitle.className = 'text-sm';
			subtitle.textContent = 'Returning to menu in 5 seconds...';

			container.appendChild(title);
			container.appendChild(championName);
			container.appendChild(subtitle);
			MsgWinOrLose.appendChild(container);
			
			setTimeout(resolve, 5000);
		});
	}

	/*
		Envoie les notifications de tour aux joueurs participants au match
		Pour joueur vs bot : ping seulement le joueur humain
		Pour joueur vs joueur : ping les deux joueurs
	*/
	private sendTurnNotifications(player1: TournamentPlayer, player2: TournamentPlayer, tournamentId: string): void {
		const isPlayer1Bot = player1.displayName === 'Bot' || player1.type === 'Guest' && !player1.isAuthenticated;
		const isPlayer2Bot = player2.displayName === 'Bot' || player2.type === 'Guest' && !player2.isAuthenticated;
		
		if (isPlayer1Bot && !isPlayer2Bot) {
			// Joueur vs Bot : ping seulement le joueur humain (player2)
			const targetUser = player2.username || String(player2.userId);
			TournamentPingService.sendPing(targetUser, tournamentId);
		} else if (!isPlayer1Bot && isPlayer2Bot) {
			// Joueur vs Bot : ping seulement le joueur humain (player1)
			const targetUser = player1.username || String(player1.userId);
			TournamentPingService.sendPing(targetUser, tournamentId);
		} else if (!isPlayer1Bot && !isPlayer2Bot) {
			// Joueur vs Joueur : ping les deux
			const targetUser1 = player1.username || String(player1.userId);
			const targetUser2 = player2.username || String(player2.userId);
			TournamentPingService.sendPingToMultiple([targetUser1, targetUser2], tournamentId);
		}
		// Si Bot vs Bot, pas de ping
	}
}