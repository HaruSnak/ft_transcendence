interface TournamentPlayer {
	id: string; // peut-etre delete
	displayName: string;
	type: 'guest' | 'login';
	userId?: string;
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

	constructor() {

	}

	/*async initDataPlayer(type: 'guest' | 'login', username: string, password?: string): Promise<boolean> {
		if (type === 'guest') {

			const players = {
				id: 'TEST123',
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
			this.player.push(players);
			console.log(players);
			return true;
		}*/

	initDataPlayer(type: 'guest' | 'login', username: string, password?: string): boolean {
		if (type === 'guest') {
			const players = {
				id: 'TEST123',
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
			this.player.push(players);
			console.log(players);
			return true;
		}
		/*else if (type === 'login') {

			const players = {
				id: 'TEST1234',
				displayName: username,
				type: type,
				//userId?: string;
				//username?: string;
				isAuthenticated: true,
				controlsPly: true,
				tournamentStats: {
					wins: 0,
					lose: 0,
					matches: 0,
				},
			}
		}*/
		return false;
	}
}