// src/services/socket/blockingSystem.ts

import { UserApiService } from '../api/user_api_service';
import { BlockedUser, MessageService } from '../../utils/data_types';

// classe qui gere le systeme de blocage des utilisateurs : permet de bloquer/debloquer des users, charge la liste des bloques, verifie si un user est bloque
export class BlockingSystemService {
    private blockedUsers: Set<string> = new Set();

    constructor(private messageService: MessageService) {}

    // ========================= CHARGEMENT DES DONNEES =========================
    // charge la liste des utilisateurs bloques depuis l'API
    public async loadBlockedUsers(): Promise<void> {
        const token = sessionStorage.getItem('authToken');
        if (!token) {
            return;
        }

        try {
            const blockedUsersData = await UserApiService.getBlockedUsers();
            this.blockedUsers = new Set(blockedUsersData.map(user => user.username));

            // Update message service with blocked users
            this.messageService.updateBlockedUsers(this.blockedUsers);
        } catch (error) {
            console.error('Failed to load blocked users:', error);
        }
    }

    // ========================= BLOCAGE D'UTILISATEUR =========================
    // bloque un utilisateur via l'API
    public async blockUser(username: string): Promise<void> {
        try {
            // Get user ID first
            const userData = await UserApiService.getUserByUsername(username);
            const blockedUserId = userData.id;

            // Block the user
            await UserApiService.blockUser(blockedUserId);

            // Update local state
            this.blockedUsers.add(username);
            this.messageService.updateBlockedUsers(this.blockedUsers);

            // Note: Previous messages remain visible, only new messages are blocked

        } catch (error) {
            console.error('Error blocking user:', error);
            const errorMsg = (error as Error).message.includes('Failed to fetch user by username') 
                ? 'Utilisateur non trouvé ou inexistant.' 
                : (error as Error).message;
            alert('Erreur lors du blocage : ' + errorMsg);
        }
    }

    // ========================= DEBLOCAGE D'UTILISATEUR =========================
    // debloque un utilisateur via l'API
    public async unblockUser(username: string): Promise<void> {
        try {
            // Check if user is actually blocked locally
            if (!this.blockedUsers.has(username)) {
                return;
            }

            // Get user ID first
            const userData = await UserApiService.getUserByUsername(username);
            const blockedUserId = userData.id;

            // Check current blocked users from server to verify state
            const serverBlockedUsers = await UserApiService.getBlockedUsers();
            const isBlockedOnServer = serverBlockedUsers.some(user => user.username === username);

            if (!isBlockedOnServer) {
                this.blockedUsers.delete(username);
                this.messageService.updateBlockedUsers(this.blockedUsers);
                return;
            }

            // Unblock the user
            await UserApiService.unblockUser(blockedUserId);

            // Update local state
            this.blockedUsers.delete(username);
            this.messageService.updateBlockedUsers(this.blockedUsers);

            // Note: Previous messages were never hidden, so no need to show them

        } catch (error) {
            console.error('Error unblocking user:', error);

            // Reload blocked users list to ensure local state is in sync
            try {
                await this.loadBlockedUsers();
            } catch (reloadError) {
                console.error('Failed to reload blocked users:', reloadError);
            }

            alert('Error unblocking user: ' + (error as Error).message);
        }
    }

    // ========================= VERIFICATION D'ETAT =========================
    // verifie si un utilisateur est bloque
    public isUserBlocked(username: string): boolean {
        return this.blockedUsers.has(username);
    }

    // retourne la liste des utilisateurs bloques
    public getBlockedUsers(): Set<string> {
        return new Set(this.blockedUsers);
    }
}