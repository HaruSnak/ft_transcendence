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

// Delete ?
export interface userStats {
	wins: number;
	lose: number;
	matchs: number;
}

export class userApiService {
	// route API User
	private userURL = `/api/`;

	// Function qui send la demande cote backend pour get un USER en fonction de son username + password
	async getUser(username:string, password: string): Promise<authResponse | null> {
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
	async getConnectedPly(): Promise<authResponse | null> {
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
	async addMatchHistory(player1_id: number, player2_id: number, winner_id: number, score_player1: number, score_player2: number, game_type: string = 'pong'): Promise <true | null> {
		try {
			const matchData = {
				player1_id,
				player2_id,
				winner_id,
				score_player1,
				score_player2,
				game_type
			}
			const token = localStorage.getItem('authToken');
			if (!token)
				return (null);
			const response = await fetch(this.userURL + `user/match`, {
				method: `POST`,
				headers: {
					'Authorization': `Bearer ${token}`,
					'Content-Type': 'application/json',
					'Accept': 'application/json'
				},
				body: JSON.stringify(matchData)
			});
			if (response.ok) {
				console.log(`Ok HTTP`);
				return (true);
			}
			else if (response.status === 401) {
				localStorage.removeItem(`authToken`);
				return (null);
			}
			else {
				console.log(`Error HTTP: `, response.status);
				return (null);
			}

		}
		catch (error) {
			console.log(error.message);
			return (null);
		}
	}
}