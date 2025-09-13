import { userApiService } from './UserAPIService.js';
export class TournamentManager {
    constructor() {
        this.player = [];
        this.playerCount = 0;
        this.userApiService = new userApiService;
    }
    async initDataPlayer(type, username, password) {
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
                };
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
                };
                return (this.player.push(players));
            }
        }
        catch (error) {
            console.log(`Initialization of player data failed: ` + username);
            return (null);
        }
    }
    getUser(username) {
        if (this.player[0].)
            return (true);
    }
}
