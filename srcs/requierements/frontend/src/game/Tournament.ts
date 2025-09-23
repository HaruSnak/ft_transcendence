import { userApiService } from './UserAPIService.js'


interface TournamentPlayer {
	userId: number | string; // peut-etre delete
	displayName: string;
	type: 'guest' | 'login';
	username?: string;
	isAuthenticated: boolean;
	controlsPly: boolean; // modifier le name + type variable possible
	tournamentStats: {
		wins: number;
		lose: number;
		matches: number;
	};
}

export class TournamentManager {
	private player: TournamentPlayer[] = [];
	private playerCount = 0;
	private userApiService = new userApiService;

	constructor() {

	}

	async initDataPlayer(type: 'guest' | 'login', username: string, password?: string) {
		try {
			if (type === 'guest') {
				const players = {
					userId: `temp_${Date.now()}_${Math.random()}`,
					displayName: username,
					type: type,
					isAuthenticated: false,
					controlsPly: false,
					tournamentStats: {
						wins: 0,
						lose: 0,
						matches: 0,
					},
				}
				return (this.player.push(players));
				console.log(players);
			}
			else if (type === 'login') {
				const plyData = await this.userApiService.getUser(username, password);
				const players = {
					userId: plyData.user.id,
					displayName: plyData.user.display_name,
					type: type,
					username: plyData.user.username,
					isAuthenticated: true,
					controlsPly: true,
					tournamentStats: {
						wins: 0,
						lose: 0,
						matches: 0,
					},
				}
				return (this.player.push(players));
			}
		}
		catch (error) {
			console.log(`Initialization of player data failed: ` + username);
			return (null);
		}
	}

	getUser(username: string) {
		return this.player.find(player => 
			player.displayName === username || player.username === username
		);
	}
}