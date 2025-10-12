import { userApiService } from './UserAPIService.js';

/*
	Interface représentant un joueur dans le système de tournoi
	Contient les informations d'identification et statistiques du joueur
*/
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

/*
	Classe abstraite de base pour gérer les joueurs
	Fournit les fonctionnalités communes pour créer, authentifier et gérer les joueurs
	Étendue par TournamentManager et OneVsOneManager
*/
export abstract class PlayerManager {
	protected players: TournamentPlayer[] = [];
	protected checkIsPlyConnected: boolean = false;
	protected userApiService = new userApiService();

	constructor() {}

	/*
		Initialise les données d'un joueur (Guest ou User authentifié)
		Vérifie que le nom d'utilisateur n'est pas déjà pris
		Appelle createGuestPlayer() ou createUserPlayer() selon le type
	*/
	public async initDataPlayer(type: 'Guest' | 'User', username: string, password?: string): Promise<boolean> {
        try {
            if (this.isUsernameTaken(username) || username.toLowerCase().includes('bot')) {
                console.log("Username already exists!");
                return (false);
            }
            if (type === 'Guest') {
                return (this.createGuestPlayer(username));
            }
			else if (type === 'User') {
                return (await this.createUserPlayer(username, password!));
            }
        }
		catch (error) {
            console.log(`Initialization of player data failed: ${username}`);
            return (false);
        }
        return (false);
    }

	/*
		Crée un joueur invité (non authentifié)
		Génère un userId temporaire unique avec Date.now() et Math.random()
		Ajoute le joueur au tableau players
	*/
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

	/*
		Crée un joueur authentifié depuis la base de données
		Utilise userApiService.getUser() pour récupérer les données utilisateur
		Ajoute le joueur authentifié au tableau players
	*/
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

	/*
		Vérifie si un joueur est déjà connecté via une session active
		Utilise userApiService.getConnectedPly() pour vérifier la session
		Ajoute automatiquement le joueur connecté si trouvé
		Utilise checkIsPlyConnected pour éviter les vérifications multiples
	*/
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

	/*
		Vérifie si un nom d'utilisateur est déjà pris par un autre joueur
		Utilise Array.some() pour parcourir les joueurs existants
		Compare displayName pour Guest et username pour User
	*/
    public isUsernameTaken(username: string): boolean {
        return (this.players.some(player => 
            (player.displayName === username && player.type === 'Guest') ||
            (player.username === username && player.type === 'User'))
        );
    }

	/*
		Retourne le nombre total de joueurs enregistrés
	*/
    public getNbrAllUsers(): number {
        return (this.players.length);
    }

	/*
		Réinitialise les scores de deux joueurs à zéro
		Appelée après chaque match pour préparer le prochain
	*/
    protected resetScore(player1: TournamentPlayer, player2: TournamentPlayer): void {
        player1.tournamentStats.score = 0;
        player2.tournamentStats.score = 0;
    }

	/*
		Enregistre l'historique d'un match dans la base de données
		Gère différents cas : Guest vs Guest, User vs User, User vs Guest
		Utilise switch/case pour router vers la bonne méthode API
		Appelle resetScore() après l'enregistrement
	*/
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

	/*
		Retourne une copie du tableau des joueurs
		Utilise spread operator [...] pour éviter les modifications externes
	*/
    public getPlayers(): TournamentPlayer[] {
        return ([...this.players]);
    }

	/*
		Vide complètement le tableau des joueurs et réinitialise les flags
		Appelée à la fin d'un tournoi ou lors du nettoyage du jeu
	*/
    public clearPlayers(): void {
        this.players = [];
        this.checkIsPlyConnected = false;
    }
}