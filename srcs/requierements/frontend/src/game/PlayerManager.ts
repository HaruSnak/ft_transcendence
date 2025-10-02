import { userApiService } from './UserAPIService.js';

export interface TournamentPlayer {
    userId: number | string;
    displayName: string;
    type: 'Guest' | 'User';
    username?: string;
    isAuthenticated: boolean;
    tournamentStats: {
        score: number;
    };
}

export abstract class PlayerManager {
    protected players: TournamentPlayer[] = [];
    protected checkIsPlyConnected: boolean = false;
    protected userApiService = new userApiService();

    constructor() {}

    public async initDataPlayer(type: 'Guest' | 'User', username: string, password?: string): Promise<boolean> {
        try {
            if (this.isUsernameTaken(username) || username.toLowerCase().includes('bot')) {
                console.log("Username already exists!");
                return (false);
            }
            if (type === 'Guest') {
                return this.createGuestPlayer(username);
            }
			else if (type === 'User') {
                return await this.createUserPlayer(username, password!);
            }
        }
		catch (error) {
            console.log(`Initialization of player data failed: ${username}`);
            return (false);
        }
        return (false);
    }

    private createGuestPlayer(username: string): boolean {
        const guestPlayer: TournamentPlayer = {
            userId: `temp_${Date.now()}_${Math.random()}`,
            displayName: username,
            type: 'Guest',
            isAuthenticated: false,
            tournamentStats: { score: 0 }
        };
        this.players.push(guestPlayer);
        return (true);
    }

    private async createUserPlayer(username: string, password: string): Promise<boolean> {
        const plyData = await this.userApiService.getUser(username, password);
        const userPlayer: TournamentPlayer = {
            userId: plyData.user.id,
            displayName: plyData.user.display_name,
            type: 'User',
            username: plyData.user.username,
            isAuthenticated: true,
            tournamentStats: { score: 0 }
        };
        this.players.push(userPlayer);
        return (true);
    }

    public async isPlayerConnected(): Promise<boolean | null> {
        if (this.checkIsPlyConnected)
			return (null);

        const isConnected = await this.userApiService.getConnectedPly();
        if (!isConnected) {
            console.log('Pas de compte déjà connecté');
            return (null);
        }
        if (isConnected.successful !== false) {
            const connectedPlayer: TournamentPlayer = {
                userId: isConnected.user.id,
                displayName: isConnected.user.display_name,
                type: 'User',
                username: isConnected.user.username,
                isAuthenticated: true,
                tournamentStats: { score: 0 }
            };
            this.checkIsPlyConnected = true;
            this.players.push(connectedPlayer);
            return (true);
        }
        return (null);
    }

    public isUsernameTaken(username: string): boolean {
        return (this.players.some(player => 
            (player.displayName === username && player.type === 'Guest') ||
            (player.username === username && player.type === 'User'))
        );
    }

    public getNbrAllUsers(): number {
        return (this.players.length);
    }

    protected resetScore(player1: TournamentPlayer, player2: TournamentPlayer): void {
        player1.tournamentStats.score = 0;
        player2.tournamentStats.score = 0;
    }

    protected addMatchHistory(player1: TournamentPlayer, player2: TournamentPlayer, winner: TournamentPlayer, gameType: string): void {
        const matchKey = `${player1.type}-${player2.type}`;
        switch (matchKey) {
            case 'Guest-Guest':
                console.log('Guest vs Guest match - no history saved');
                break;
            case 'User-User':
                this.userApiService.saveUserVSUser(player1, player2, winner, gameType);
                break;
            case 'User-Guest':
                this.userApiService.saveUserVSGuest(player1, player2, winner, gameType);
                break;
            case 'Guest-User':
                this.userApiService.saveUserVSGuest(player2, player1, winner, gameType);
                break;
            default:
                console.error(`Unexpected match combination: ${matchKey}`);
                break;
        }
        this.resetScore(player1, player2);
    }

    public getPlayers(): TournamentPlayer[] {
        return ([...this.players]);
    }

    public clearPlayers(): void {
        this.players = [];
        this.checkIsPlyConnected = false;
    }
}