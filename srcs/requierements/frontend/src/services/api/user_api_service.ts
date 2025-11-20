// ========================= IMPORTS =========================
// Types TypeScript et constantes pour l'API utilisateur
import { User, BlockedUser, Match } from '../../utils/data_types';
import { API_BASE_URL, STORAGE_KEYS } from '../../utils/app_constants';

// ========================= SERVICE API UTILISATEUR =========================
// Gere toutes les interactions HTTP avec le backend (profil, amis, blocage, matchs)
export class UserApiService {

    // ========================= HEADERS D'AUTHENTIFICATION =========================
    // Genere headers avec token Bearer pour l'authentification API
    private static getAuthHeaders(): HeadersInit {
        const token = sessionStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
        return {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };
    }

    // Headers d'auth sans Content-Type (pour DELETE)
    private static getAuthHeadersWithoutContentType(): HeadersInit {
        const token = sessionStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
        return {
            'Authorization': `Bearer ${token}`
        };
    }

    // ========================= PROFIL UTILISATEUR =========================
    // GET /user/profile - Recupere le profil de l'utilisateur connecte
    static async getUserProfile(): Promise<User> {
        const response = await fetch(`${API_BASE_URL}/user/profile`, {
            headers: this.getAuthHeaders()
        });

        if (!response.ok) {
            throw new Error('Failed to fetch user profile');
        }

        const data = await response.json();
        return data.user;
    }

    // GET /user/by-username/{username} - Recherche utilisateur par nom
    static async getUserByUsername(username: string): Promise<User> {
        const response = await fetch(`${API_BASE_URL}/user/by-username/${username}`, {
            headers: this.getAuthHeaders()
        });

        if (!response.ok) {
            throw new Error('Failed to fetch user by username');
        }

        const data = await response.json();
        return data.user;
    }

    // ========================= SYSTEME DE BLOCAGE =========================
    // GET /user/blocked - Liste des utilisateurs bloques
    static async getBlockedUsers(): Promise<BlockedUser[]> {
        const response = await fetch(`${API_BASE_URL}/user/blocked`, {
            headers: this.getAuthHeaders()
        });

        if (!response.ok) {
            throw new Error('Failed to fetch blocked users');
        }

        const data = await response.json();
        return data.success ? data.blocked_users : [];
    }

    // POST /user/block - Bloque un utilisateur
    static async blockUser(blockedUserId: number): Promise<void> {
        const response = await fetch(`${API_BASE_URL}/user/block`, {
            method: 'POST',
            headers: this.getAuthHeaders(),
            body: JSON.stringify({ blocked_user_id: blockedUserId })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to block user');
        }
    }

    // DELETE /user/unblock/{id} - Debloque un utilisateur
    static async unblockUser(blockedUserId: number): Promise<void> {
        const headers = this.getAuthHeadersWithoutContentType();

        const response = await fetch(`${API_BASE_URL}/user/unblock/${blockedUserId}`, {
            method: 'DELETE',
            headers: headers
        });

        if (!response.ok) {
            let errorMessage = 'Failed to unblock user';
            try {
                const errorData = await response.json();
                errorMessage = errorData.error || errorData.message || errorData.detail || errorMessage;
            } catch (parseError) {
                const textResponse = await response.text();
                errorMessage = textResponse || errorMessage;
            }
            throw new Error(`${errorMessage} (Status: ${response.status})`);
        }
    }

    // ========================= GESTION PROFIL =========================
    // PUT /user/profile - Met a jour le profil utilisateur
    static async updateProfile(updates: Partial<User>): Promise<User> {
        const response = await fetch(`${API_BASE_URL}/user/profile`, {
            method: 'PUT',
            headers: this.getAuthHeaders(),
            body: JSON.stringify(updates)
        });

        if (!response.ok) {
            throw new Error('Failed to update profile');
        }

        const data = await response.json();
        return data.user;
    }

    // ========================= AUTHENTIFICATION =========================
    // POST /auth/logout - Deconnecte l'utilisateur
    static async logout(): Promise<void> {
        const token = sessionStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
        if (token) {
            await fetch(`${API_BASE_URL}/auth/logout`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
        }
    }

    // ========================= VERIFICATIONS DISPONIBILITE =========================
    // POST /user/check-display-name - Verifie si nom d'affichage disponible
    static async checkDisplayNameAvailability(displayName: string): Promise<boolean> {
        const response = await fetch(`${API_BASE_URL}/user/check-display-name`, {
            method: 'POST',
            headers: this.getAuthHeaders(),
            body: JSON.stringify({ display_name: displayName })
        });

        if (!response.ok) {
            throw new Error('Failed to check display name availability');
        }

        const data = await response.json();
        return data.available;
    }

    // POST /user/check-email - Verifie si email disponible
    static async checkEmailAvailability(email: string): Promise<boolean> {
        const response = await fetch(`${API_BASE_URL}/user/check-email`, {
            method: 'POST',
            headers: this.getAuthHeaders(),
            body: JSON.stringify({ email: email })
        });

        if (!response.ok) {
            throw new Error('Failed to check email availability');
        }

        const data = await response.json();
        return data.available;
    }

    // ========================= GESTION AMIS =========================
    // GET /user/friends - Liste des amis
    static async getFriends(): Promise<User[]> {
        const response = await fetch(`${API_BASE_URL}/user/friends`, {
            headers: this.getAuthHeaders()
        });

        if (!response.ok) {
            throw new Error('Failed to fetch friends');
        }

        const data = await response.json();
        return data.friends || [];
    }

    // POST /user/friend-request - Envoie demande d'ami
    static async sendFriendRequest(friendId: number): Promise<void> {
        const response = await fetch(`${API_BASE_URL}/user/friend-request`, {
            method: 'POST',
            headers: this.getAuthHeaders(),
            body: JSON.stringify({ friend_id: friendId })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to send friend request');
        }
    }

    // PUT /user/friend-request/{id}/accept - Accepte demande d'ami
    static async acceptFriendRequest(requestId: number): Promise<void> {
        const response = await fetch(`${API_BASE_URL}/user/friend-request/${requestId}/accept`, {
            method: 'PUT',
            headers: this.getAuthHeaders()
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to accept friend request');
        }
    }

    // PUT /user/friend-request/{id}/decline - Refuse demande d'ami
    static async declineFriendRequest(requestId: number): Promise<void> {
        const response = await fetch(`${API_BASE_URL}/user/friend-request/${requestId}/decline`, {
            method: 'PUT',
            headers: this.getAuthHeaders()
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to decline friend request');
        }
    }

    // DELETE /user/friend/{id} - Supprime un ami
    static async removeFriend(friendId: number): Promise<void> {
        const response = await fetch(`${API_BASE_URL}/user/friend/${friendId}`, {
            method: 'DELETE',
            headers: this.getAuthHeaders()
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to remove friend');
        }
    }

    // ========================= HISTORIQUE MATCHS =========================
    // GET /user/match-history - Historique des parties jouees
    static async getMatchHistory(): Promise<Match[]> {
        const response = await fetch(`${API_BASE_URL}/user/match-history`, {
            headers: this.getAuthHeaders()
        });

        if (!response.ok) {
            throw new Error('Failed to fetch match history');
        }

        const data = await response.json();
        return data.matches || [];
    }
}