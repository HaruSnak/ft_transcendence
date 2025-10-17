// src/utils/friends_manager.ts

import { SocketUser } from './data_types';

const FRIENDS_STORAGE_KEY = 'user_friends';

export class FriendsManager {
    private friends: Set<string> = new Set();

    constructor() {
        this.loadFriends();
    }

    private loadFriends(): void {
        const currentUser = this.getCurrentUsername();
        if (!currentUser) return;

        const key = `${FRIENDS_STORAGE_KEY}_${currentUser}`;
        const stored = localStorage.getItem(key);
        
        if (stored) {
            try {
                const friendsArray = JSON.parse(stored);
                this.friends = new Set(friendsArray);
            } catch (error) {
                console.error('❌ Error loading friends:', error);
                this.friends = new Set();
            }
        }
    }

    private saveFriends(): void {
        const currentUser = this.getCurrentUsername();
        if (!currentUser) return;

        const key = `${FRIENDS_STORAGE_KEY}_${currentUser}`;
        const friendsArray = Array.from(this.friends);
        localStorage.setItem(key, JSON.stringify(friendsArray));
    }

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

    public addFriend(username: string): void {
        if (!username) return;
        
        this.friends.add(username);
        this.saveFriends();
        
        // Dispatch event to notify UI
        const event = new CustomEvent('friendsListUpdated', {
            detail: { friends: Array.from(this.friends) }
        });
        document.dispatchEvent(event);
    }

    public removeFriend(username: string): void {
        if (!username) return;
        
        this.friends.delete(username);
        this.saveFriends();
        
        // Dispatch event to notify UI
        const event = new CustomEvent('friendsListUpdated', {
            detail: { friends: Array.from(this.friends) }
        });
        document.dispatchEvent(event);
    }

    public isFriend(username: string): boolean {
        return this.friends.has(username);
    }

    public getFriends(): string[] {
        return Array.from(this.friends);
    }

    public getOnlineFriends(onlineUsers: SocketUser[]): SocketUser[] {
        return onlineUsers.filter(user => this.isFriend(user.username));
    }

    public clearFriends(): void {
        this.friends.clear();
        this.saveFriends();
        
        // Dispatch event to notify UI
        const event = new CustomEvent('friendsListUpdated', {
            detail: { friends: [] }
        });
        document.dispatchEvent(event);
    }
}

// Export singleton instance
export const friendsManager = new FriendsManager();
