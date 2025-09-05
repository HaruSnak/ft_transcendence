export class TournamentManager {
    constructor() {
        this.player = [];
        this.playerCount = 0;
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
    initDataPlayer(type, username, password) {
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
            };
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
