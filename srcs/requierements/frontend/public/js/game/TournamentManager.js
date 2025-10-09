import { PlayerManager } from './PlayerManager.js';
export class TournamentManager extends PlayerManager {
    /*
        Crée les paires de matchs pour un tour de tournoi
        Ajoute automatiquement un Bot si le nombre de joueurs est impair
        Utilise un algorithme de pairage croisé (premier vs dernier, etc.)
    */
    createMatches() {
        const matches = [];
        // Ajouter un bot si nombre impair
        if (this.players.length % 2 !== 0) {
            const bot = {
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
    async startTournament(pongGame, playerMatch) {
        while (playerMatch.length > 0) {
            const nextRoundPlayers = [];
            for (const [player1, player2] of playerMatch) {
                console.log(`${player1.displayName} vs ${player2.displayName}`);
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
                window.location.reload();
                return;
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
    async playSingleMatch(pongGame, player1, player2) {
        try {
            pongGame.setMatchesPlayers([player1, player2]);
            pongGame.cleanupGame();
            pongGame.draw();
            const winner = await this.waitForMatchResult(pongGame, player1, player2);
            console.log(`Match finished: ${winner || 'Draw'}`);
            return winner;
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
    async waitForMatchResult(pongGame, player1, player2) {
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
    async showChampion(championPly) {
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
}
