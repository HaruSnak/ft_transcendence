// src/services/socket/blockingSystem.ts

import { UserApiService } from '../api/user-api-service';
import { BlockedUser } from '../../utils/data-types';

export class BlockingSystemService {
    private blockedUsers: Set<string> = new Set();

    constructor(private messageService: any) {}

    public async loadBlockedUsers(): Promise<void> {
        try {
            const blockedUsersData = await UserApiService.getBlockedUsers();
            this.blockedUsers = new Set(blockedUsersData.map(user => user.username));
            console.log('✅ Blocked users loaded:', this.blockedUsers);

            // Update message service with blocked users
            this.messageService.updateBlockedUsers(this.blockedUsers);
        } catch (error) {
            console.error('❌ Failed to load blocked users:', error);
        }
    }

    public async blockUser(username: string): Promise<void> {
        try {
            console.log(`🚫 Attempting to block user: ${username}`);

            // Get user ID first
            const userData = await UserApiService.getUserByUsername(username);
            const blockedUserId = userData.id;

            // Block the user
            await UserApiService.blockUser(blockedUserId);

            // Update local state
            this.blockedUsers.add(username);
            this.messageService.updateBlockedUsers(this.blockedUsers);

            console.log(`🚫 User ${username} successfully blocked`);

            // Hide existing messages from this user
            this.messageService.hideMessagesFromUser(username);

        } catch (error) {
            console.error('❌ Error blocking user:', error);
            alert('Error blocking user: ' + (error as Error).message);
        }
    }

    public async unblockUser(username: string): Promise<void> {
        try {
            console.log(`✅ Attempting to unblock user: ${username}`);

            // Get user ID first
            const userData = await UserApiService.getUserByUsername(username);
            const blockedUserId = userData.id;

            // Unblock the user
            await UserApiService.unblockUser(blockedUserId);

            // Update local state
            this.blockedUsers.delete(username);
            this.messageService.updateBlockedUsers(this.blockedUsers);

            console.log(`✅ User ${username} successfully unblocked`);

            // Show messages from this user if currently in conversation
            const currentChat = this.messageService.getCurrentChat();
            if (currentChat && currentChat.user === username) {
                this.messageService.showMessagesFromUser(username);
            }

        } catch (error) {
            console.error('❌ Error unblocking user:', error);
            alert('Error unblocking user: ' + (error as Error).message);
        }
    }

    public isUserBlocked(username: string): boolean {
        return this.blockedUsers.has(username);
    }

    public getBlockedUsers(): Set<string> {
        return new Set(this.blockedUsers);
    }
}