// src/services/socket/blockingSystem.ts

import { UserApiService } from '../api/user_api_service';
import { BlockedUser, MessageService } from '../../utils/data_types';

export class BlockingSystemService {
    private blockedUsers: Set<string> = new Set();

    constructor(private messageService: MessageService) {}

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

            // Note: Previous messages remain visible, only new messages are blocked

        } catch (error) {
            console.error('❌ Error blocking user:', error);
            alert('Error blocking user: ' + (error as Error).message);
        }
    }

    public async unblockUser(username: string): Promise<void> {
        try {
            console.log(`✅ Attempting to unblock user: ${username}`);

            // Check if user is actually blocked locally
            if (!this.blockedUsers.has(username)) {
                console.warn(`⚠️ User ${username} is not in local blocked list`);
                return;
            }

            // Get user ID first
            console.log(`🔍 Getting user data for: ${username}`);
            const userData = await UserApiService.getUserByUsername(username);
            const blockedUserId = userData.id;
            console.log(`📋 User ID found: ${blockedUserId}`);

            // Check current blocked users from server to verify state
            console.log('🔍 Checking current blocked users from server...');
            const serverBlockedUsers = await UserApiService.getBlockedUsers();
            const isBlockedOnServer = serverBlockedUsers.some(user => user.username === username);
            console.log(`🔍 User ${username} blocked on server: ${isBlockedOnServer}`);
            console.log(`🔍 Server blocked users:`, serverBlockedUsers.map(u => u.username));

            if (!isBlockedOnServer) {
                console.warn(`⚠️ User ${username} is not blocked on server, removing from local list`);
                this.blockedUsers.delete(username);
                this.messageService.updateBlockedUsers(this.blockedUsers);
                return;
            }

            // Unblock the user
            console.log(`🔓 Calling API to unblock user ID: ${blockedUserId}`);
            await UserApiService.unblockUser(blockedUserId);

            // Update local state
            this.blockedUsers.delete(username);
            this.messageService.updateBlockedUsers(this.blockedUsers);

            console.log(`✅ User ${username} successfully unblocked`);

            // Note: Previous messages were never hidden, so no need to show them

        } catch (error) {
            console.error('❌ Error unblocking user:', error);
            console.error('❌ Error details:', {
                username,
                error: (error as Error).message,
                stack: (error as Error).stack
            });

            // Reload blocked users list to ensure local state is in sync
            console.log('🔄 Reloading blocked users list after error...');
            try {
                await this.loadBlockedUsers();
            } catch (reloadError) {
                console.error('❌ Failed to reload blocked users:', reloadError);
            }

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