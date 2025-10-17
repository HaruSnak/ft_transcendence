// src/services/socket/userManagement.ts

import { SocketUser, SocketConnection } from '../../utils/data_types';
import { UI_ELEMENTS } from '../../utils/app_constants';
import { friendsManager } from '../../pages/profile/friends_manager';

export class UserManagementService {
    private onlineUsers: SocketUser[] = [];
    private currentUsername: string = '';

    constructor(private socketConnection: SocketConnection) {
        this.currentUsername = socketConnection.getCurrentUser()?.username || '';
        this.setupEventListeners();
    }

    private setupEventListeners(): void {
        // Listen for friends list updates to refresh the user list
        document.addEventListener('friendsListUpdated', () => {
            this.renderUserList();
        });
    }

    public updateOnlineUsers(users: SocketUser[]): void {
        this.onlineUsers = users;
        this.renderUserList();
        
        // Dispatch event for other components (like online friends widget)
        const event = new CustomEvent('onlineUsersUpdated', {
            detail: { users: this.onlineUsers }
        });
        document.dispatchEvent(event);
    }

    private renderUserList(): void {
        const userListContainer = document.getElementById(UI_ELEMENTS.USER_LIST);
        if (!userListContainer) {
            console.error('❌ User list container not found');
            return;
        }

        userListContainer.innerHTML = '';

        this.onlineUsers.forEach(user => {
            if (user.username !== this.currentUsername) {
                this.createUserListItem(user, userListContainer);
            }
        });
    }

    private createUserListItem(user: SocketUser, container: HTMLElement): void {
        const userItem = document.createElement('div');
        userItem.className = 'flex items-center justify-between py-1 px-1 rounded hover:bg-gray-600 overflow-hidden';

        // Username display - clickable to start DM
        const usernameSpan = document.createElement('span');
        usernameSpan.className = 'text-sm truncate flex-1 min-w-0 min-w-24 cursor-pointer hover:text-blue-400';
        usernameSpan.textContent = user.display_name || user.username;
        usernameSpan.title = `Click to chat with ${user.display_name || user.username}`;
        usernameSpan.addEventListener('click', (event) => {
            event.stopPropagation();
            this.initiateDirectMessage(user);
        });
        userItem.appendChild(usernameSpan);

        // Action buttons container
        const buttonsContainer = document.createElement('div');
        buttonsContainer.className = 'flex gap-1';

        // Add friend button only if not friend
        if (!friendsManager.isFriend(user.username)) {
            const addFriendButton = this.createAddFriendButton(user);
            buttonsContainer.appendChild(addFriendButton);
        }

        // Profile button
        const profileButton = this.createProfileButton(user);
        buttonsContainer.appendChild(profileButton);

        userItem.appendChild(buttonsContainer);
        container.appendChild(userItem);
    }

    private createProfileButton(user: SocketUser): HTMLButtonElement {
        const button = document.createElement('button');
        button.className = 'text-xs px-1 py-0.5 rounded hover:bg-gray-500';
        button.textContent = '👤';
        button.title = 'View user profile';
        button.addEventListener('click', (event) => {
            event.stopPropagation();
            window.location.hash = `profile-${user.username}`;
        });
        return button;
    }

    private createAddFriendButton(user: SocketUser): HTMLButtonElement {
        const button = document.createElement('button');
        button.className = 'text-xs px-1 py-0.5 rounded hover:bg-green-600';
        button.textContent = '+';
        button.title = 'Add to friends';
        
        button.addEventListener('click', (event) => {
            event.stopPropagation();
            friendsManager.addFriend(user.username);
            alert('Ami ajouté !');
            button.style.display = 'none';
            // Re-render to show the message button
            this.renderUserList();
        });
        
        return button;
    }

    private initiateDirectMessage(user: SocketUser): void {
        // Emit event to message service
        const event = new CustomEvent('initiateDirectMessage', {
            detail: { username: user.username, displayName: user.display_name || user.username }
        });
        document.dispatchEvent(event);
    }

    public getOnlineUsers(): SocketUser[] {
        return this.onlineUsers;
    }

    public isUserOnline(username: string): boolean {
        return this.onlineUsers.some(user => user.username === username);
    }
}