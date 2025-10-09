/**
    Service API utilisateur
    Gère toutes les communications HTTP avec le backend pour l'authentification et l'historique des matchs
    Utilise fetch() pour les requêtes REST API avec gestion des tokens JWT
*/
export class userApiService {
    constructor() {
        // ==================== Configuration API ====================
        this.userURL = `https://localhost:8443/api/`;
    }
    /**
        Authentifie un utilisateur avec username et password
        Envoie une requête POST au backend et stocke le token JWT dans localStorage
    */
    async getUser(username, password) {
        try {
            // Préparer les données de connexion
            const loginUser = {
                username: username,
                password: password
            };
            // Envoyer la requête POST avec les identifiants
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
                // Stocker le token JWT dans localStorage pour les requêtes futures
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
    /**
        Récupère le joueur actuellement connecté
        Vérifie le token JWT stocké et récupère les informations du profil
    */
    async getConnectedPly() {
        try {
            // Vérifier la présence du token d'authentification
            const token = localStorage.getItem('authToken');
            if (!token)
                return { successful: false };
            // Requête GET avec le token Bearer pour authentification
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
                // Token invalide ou expiré - nettoyer localStorage
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
    /**
        Sauvegarde un match entre deux utilisateurs authentifiés
        Envoie les données du match au backend pour stockage dans match_history
    */
    async saveUserVSUser(userPlayer1, userPlayer2, winnerID, gameType) {
        try {
            // Envoyer les données du match au backend
            const response = await fetch(this.userURL + `/user/match`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    player1_id: userPlayer1.userId, // ID de la DB
                    player2_id: userPlayer2.userId, // ID de la DB
                    winner_id: winnerID.userId, // ID du gagnant
                    score_player1: userPlayer1.tournamentStats.score,
                    score_player2: userPlayer2.tournamentStats.score,
                    game_type: gameType
                })
            });
            const result = await response.json();
            console.log(gameType + ' match saved:', result);
            // Le backend stocke dans 'match_history' quand les deux joueurs sont des Users
        }
        catch (error) {
            console.error('Failed to save ' + gameType + ' match:', error);
        }
    }
    /**
        Sauvegarde un match entre un utilisateur et un invité
        Envoie les données au backend pour stockage dans game_sessions
    */
    async saveUserVSGuest(userPlayer, guestPlayer, winnerID, gameType) {
        try {
            // Envoyer les données du match avec player2_id null pour un invité
            const response = await fetch(this.userURL + `/user/match`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    player1_id: userPlayer.userId, // ID de la DB pour le user
                    player1_name: userPlayer.displayName,
                    player2_id: null, // Pas d'ID pour le guest
                    player2_name: guestPlayer.displayName,
                    winner_player: winnerID.userId === userPlayer.userId ? 1 : 2, // 1 ou 2
                    score_player1: userPlayer.tournamentStats.score,
                    score_player2: guestPlayer.tournamentStats.score,
                    game_type: gameType
                })
            });
            const result = await response.json();
            console.log(gameType + ' match saved:', result);
            // Le backend stocke dans 'game_sessions' quand un joueur est Guest
        }
        catch (error) {
            console.error('Failed to save ' + gameType + ' match:', error);
        }
    }
    /**
        Récupère l'historique complet des matchs d'un utilisateur
        Obtient toutes les sessions de jeu depuis le backend avec authentification
    */
    async getUserCompleteHistory(userId) {
        try {
            // Récupérer le token d'authentification
            const token = localStorage.getItem('authToken');
            // Requête GET avec authentification Bearer
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
