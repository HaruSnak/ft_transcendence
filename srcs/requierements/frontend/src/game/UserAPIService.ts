import { TournamentPlayer } from './PlayerManager.js'

export interface authResponse {
	successful: boolean;
	user?: {
		id?: number;
		imgProfile?: string;
		username?: string;
		display_name?: string;
		isOnline?: boolean;
	}
}

export class userApiService {
	// route API User
	private userURL = `http://localhost:3003/api/`;

	// Function qui send la demande cote backend pour get un USER en fonction de son username + password
	public async getUser(username: string, password: string): Promise<authResponse | null> {
		try {
			const loginUser = {
				username: username,
				password: password
			}
			const response = await fetch(this.userURL + `auth/login`, {
				method: `POST`,
				headers: {
					'Content-Type': 'application/json',
					'Accept': 'application/json'
				},
				body: JSON.stringify(loginUser)
			});
			if (response.ok) {
				const data = await response.json();
				
				if (data.token) {
					localStorage.setItem('authToken', data.token);
				}
				return {
					successful: true,
					user: {
						id: data.user.id,
						imgProfile: data.user.avatar_url,
						username: data.user.username,
						display_name: data.user.display_name,
						isOnline: data.user.isOnline,
					}
				};
			}
			else {
				console.log(`Error HTTP `, response.status);
				return { successful: false };
			}
		}
		catch (error) {
			console.log(error.message);
			return (null);
		}
	}

	// Function qui send la demande cote backend pour voir le joueur actuellement connecte sur le compte (Instance local prioritaire)
	public async getConnectedPly(): Promise<authResponse | null> {
		try {
			const token = localStorage.getItem('authToken');
			if (!token)
				return { successful: false };
			const response = await fetch(this.userURL + `user/profile`, {
				method: `GET`,
				headers: {
					'Authorization': `Bearer ${token}`,
					'Content-Type': 'application/json',
					'Accept': 'application/json'
				}
			});
			if (response.ok) {
				const data = await response.json();
				return {
					successful: true,
					user: {
						id: data.user.id,
						imgProfile: data.user.avatar_url,
						username: data.user.username,
						display_name: data.user.display_name,
						isOnline: data.user.isOnline,
					}
				};
			}
			else if (response.status === 401) {
				localStorage.removeItem(`authToken`);
				return { successful: false };
			}
			else {
				console.log(`Error HTTP: `, response.status);
				return { successful: false };
			}
		}
		catch (error) {
			console.log(error.message);
			return (null);
		}
	}

	// A modifie peut-etre concernant la Promise, peut-etre faire une itnerface pour le match.id return ?
	// Function qui send la demande cote backend pour ajouter un victoire/defaite aux joueurs 1-2.
	public async saveUserVSUser(userPlayer1: TournamentPlayer, userPlayer2: TournamentPlayer,
		winnerID: TournamentPlayer, gameType: string) {
		try {
			const response = await fetch(this.userURL + `/user/match`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					player1_id: userPlayer1.userId,     // ID de la DB
					player2_id: userPlayer2.userId,     // ID de la DB
					winner_id: winnerID.userId,       // ID du gagnant
					score_player1: userPlayer1.tournamentStats.score,
					score_player2: userPlayer2.tournamentStats.score,
					game_type: gameType
				})
			});

			const result = await response.json();
			console.log(gameType + ' match saved:', result);
			// result.stored_in === 'match_history'
		}
		catch (error) {
			console.error('Failed to save ' + gameType + ' match:', error);
		}
	}
	
	public async saveUserVSGuest(userPlayer: TournamentPlayer, guestPlayer: TournamentPlayer, winnerID: TournamentPlayer, gameType: string) {
		try {
			const response = await fetch(this.userURL + `/user/match`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					player1_id: userPlayer.userId,      // ID de la DB pour le user
					player1_name: userPlayer.displayName,
					player2_id: null,                   // Pas d'ID pour le guest
					player2_name: guestPlayer.displayName,
					winner_player: winnerID.userId === userPlayer.userId ? 1 : 2, // 1 ou 2
					score_player1: userPlayer.tournamentStats.score,
					score_player2: guestPlayer.tournamentStats.score,
					game_type: gameType
				})
			});

			const result = await response.json();
			console.log(gameType + ' match saved:', result);
			// result.stored_in === 'game_sessions'
		}
		catch (error) {
			console.error('Failed to save ' + gameType + ' match:', error);
		}
	}

	public async getUserCompleteHistory(userId: number) {
		try {
			const token = localStorage.getItem('authToken');
			
			const response = await fetch(this.userURL + `user/${userId}/game-sessions`, {
				headers: {
					'Authorization': `Bearer ${token}`
				}
			});

			const result = await response.json();
			if (result.success) {
				console.log('Complete history:', result.sessions);
				return result.sessions;
			}
		}
		catch (error) {
			console.error('Failed to get history:', error);
		}
	}
}