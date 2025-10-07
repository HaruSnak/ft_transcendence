import { userApiService } from './UserAPIService.js';
export class TournamentManager {
    constructor() {
        this.player = [];
        this.checkIsPlyConnected = false;
        this.userApiService = new userApiService;
    }
    async initDataPlayer(type, username, password) {
        try {
            if (this.isUsernameTaken(username) || username.toLowerCase().includes('bot'.toLowerCase())) {
                console.log("Username already exists!");
                return (false);
            }
            if (type === 'Guest') {
                const players = {
                    userId: `temp_${Date.now()}_${Math.random()}`,
                    displayName: username,
                    type: type,
                    isAuthenticated: false,
                    tournamentStats: {
                        wins: 0,
                        lose: 0,
                        matches: 0,
                    },
                };
                this.player.push(players);
                return (true);
            }
            else if (type === 'User') {
                const plyData = await this.userApiService.getUser(username, password);
                const players = {
                    userId: plyData.user.id,
                    displayName: plyData.user.display_name,
                    type: type,
                    username: plyData.user.username,
                    isAuthenticated: true,
                    tournamentStats: {
                        wins: 0,
                        lose: 0,
                        matches: 0,
                    },
                };
                this.player.push(players);
                return (true);
            }
        }
        catch (error) {
            console.log(`Initialization of player data failed: ` + username);
            return (null);
        }
    }
    isUsernameTaken(username) {
        return (this.player.some(player => player.displayName === username && player.type === 'Guest')
            || this.player.some(player => player.username === username && player.type === 'User'));
    }
    async isPlayerConnected() {
        if (!this.checkIsPlyConnected) {
            const isConnected = await this.userApiService.getConnectedPly();
            if (isConnected === null || this.isUsernameTaken(isConnected.user.display_name)) {
                console.log('Pas de compte deja connecte'); // a delete
                return;
            }
            if (isConnected.successful != false) {
                const PlyConnected = {
                    userId: isConnected.user.id,
                    displayName: isConnected.user.display_name,
                    type: 'User',
                    username: isConnected.user.username,
                    isAuthenticated: true,
                    tournamentStats: {
                        wins: 0,
                        lose: 0,
                        matches: 0,
                    },
                };
                this.checkIsPlyConnected = true;
                this.player.push(PlyConnected);
                return (true);
            }
        }
        return (false);
    }
    createMatches() {
        const matches = [];
        console.log(`ICIC ` + this.player.length);
        if (this.player.length % 2 !== 0) {
            const bot = {
                userId: `temp_${Date.now()}_${Math.random()}`,
                displayName: "Bot",
                type: 'Guest',
                isAuthenticated: false,
                tournamentStats: {
                    wins: 0,
                    lose: 0,
                    matches: 0,
                },
            };
            this.player.push(bot);
        }
        let low = 0;
        for (let high = this.player.length - 1; high > low; high--) {
            matches.push([this.player[low], this.player[high]]);
            low++;
        }
        return (matches);
    }
    async startTournament(pongGame, playerMatch) {
        while (playerMatch.length > 0) {
            const nextRoundPlayers = [];
            for (let currentPly = 0; currentPly < playerMatch.length; currentPly++) {
                const player1 = playerMatch[currentPly][0];
                const player2 = playerMatch[currentPly][1];
                console.log(`player 1 vs 2: ${player1.displayName} vs ${player2.displayName}`);
                const winner = await this.playSingleMatch(pongGame, player1, player2);
                if (winner === 'left') {
                    //this.updatePlayerStats(winner, winner === player1 ? player2 : player1);
                    nextRoundPlayers.push(player1);
                    console.log(`${player1.displayName} wins!`);
                }
                else if (winner === 'right') {
                    nextRoundPlayers.push(player2);
                    console.log(`${player2.displayName} wins!`);
                }
                else { // delete pas utile
                    console.warn(`Match error between ${player1.displayName} and ${player2.displayName}`);
                    console.log(`${player1.displayName} advances by default due to match error`);
                    nextRoundPlayers.push(player1);
                }
            }
            if (nextRoundPlayers.length === 1) {
                //this.showChampion(pongGame, nextRoundPlayers[0]);
                pongGame.cleanupGame();
                await this.showChampion(pongGame, nextRoundPlayers[0]);
                window.location.reload();
                return;
            }
            this.player = nextRoundPlayers;
            playerMatch = this.createMatches();
        }
        //window.location.replace(window.location.href);
    }
    async playSingleMatch(pongGame, player1, player2) {
        try {
            pongGame.setMatchesPlayers([player1, player2]);
            pongGame.cleanupGame();
            pongGame.draw();
            const winner = await this.waitForMatchResult(pongGame);
            console.log(`Match finished: ${winner || 'Draw'}`);
            return (winner);
        }
        catch (error) {
            console.error('Match error:', error);
            return null;
        }
    }
    // Timer checking pour verifier l'etat du winner
    async waitForMatchResult(pongGame) {
        return new Promise((resolve) => {
            const checkWinner = () => {
                const result = pongGame.getWhoWin();
                if (result === 'left' || result === 'right') {
                    setTimeout(() => {
                        pongGame.cleanupGame();
                        resolve(result);
                    }, 4000);
                }
                else if (result === 'null') {
                    setTimeout(checkWinner, 100);
                }
                else {
                    resolve(null);
                }
            };
            checkWinner();
        });
    }
    async showChampion(pongGame, champion) {
        return new Promise(resolve => {
            const MsgWinOrLose = document.getElementById('gameMessageWinOrLose');
            if (!MsgWinOrLose) {
                resolve();
                return;
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
            championName.textContent = champion.displayName;
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
    getNbrAllUsers() {
        return this.player.length;
    }
    }
