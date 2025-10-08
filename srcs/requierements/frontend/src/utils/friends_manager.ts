// src/utils/friends_manager.ts

import { SocketUser } from './data_types';

const FRIENDS_STORAGE_KEY = 'user_friends';

export class FriendsManager {
    private friends: Set<string> = new Set();

    constructor() {
        this.loadFriends();
    }

    /**
     * Load friends list from localStorage
     */
    private loadFriends(): void {
        const currentUser = this.getCurrentUsername();
        if (!currentUser) return;

        const key = `${FRIENDS_STORAGE_KEY}_${currentUser}`;
        const stored = localStorage.getItem(key);
        
        if (stored) {
            try {
                const friendsArray = JSON.parse(stored);
                this.friends = new Set(friendsArray);
                console.log('✅ Friends loaded:', Array.from(this.friends));
            } catch (error) {
                console.error('❌ Error loading friends:', error);
                this.friends = new Set();
            }
        }
    }

    /**
     * Save friends list to localStorage
     */
    private saveFriends(): void {
        const currentUser = this.getCurrentUsername();
        if (!currentUser) return;

        const key = `${FRIENDS_STORAGE_KEY}_${currentUser}`;
        const friendsArray = Array.from(this.friends);
        localStorage.setItem(key, JSON.stringify(friendsArray));
        console.log('💾 Friends saved:', friendsArray);
    }

    /**
     * Get current logged-in username
     */
    private getCurrentUsername(): string | null {
        const userData = sessionStorage.getItem('user');
        if (userData) {
            try {
                const user = JSON.parse(userData);
                return user.username;
            } catch {
                return null;
            }
        }
        return null;
    }

    /**
     * Add a friend to the list
     */
    public addFriend(username: string): void {
        if (!username) return;
        
        this.friends.add(username);
        this.saveFriends();
        
        // Dispatch event to notify UI
        const event = new CustomEvent('friendsListUpdated', {
            detail: { friends: Array.from(this.friends) }
        });
        document.dispatchEvent(event);
        
        console.log(`➕ Friend added: ${username}`);
    }

    /**
     * Remove a friend from the list
     */
    public removeFriend(username: string): void {
        if (!username) return;
        
        this.friends.delete(username);
        this.saveFriends();
        
        // Dispatch event to notify UI
        const event = new CustomEvent('friendsListUpdated', {
            detail: { friends: Array.from(this.friends) }
        });
        document.dispatchEvent(event);
        
        console.log(`➖ Friend removed: ${username}`);
    }

    /**
     * Check if a user is a friend
     */
    public isFriend(username: string): boolean {
        return this.friends.has(username);
    }

    /**
     * Get all friends usernames
     */
    public getFriends(): string[] {
        return Array.from(this.friends);
    }

    /**
     * Get online friends from a list of online users
     */
    public getOnlineFriends(onlineUsers: SocketUser[]): SocketUser[] {
        return onlineUsers.filter(user => this.isFriend(user.username));
    }

    /**
     * Clear all friends (useful for testing or account deletion)
     */
    public clearFriends(): void {
        this.friends.clear();
        this.saveFriends();
        
        // Dispatch event to notify UI
        const event = new CustomEvent('friendsListUpdated', {
            detail: { friends: [] }
        });
        document.dispatchEvent(event);
        
        console.log('🗑️ All friends cleared');
    }
}

// Export singleton instance
export const friendsManager = new FriendsManager();
