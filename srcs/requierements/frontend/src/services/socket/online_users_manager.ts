// src/services/socket/userManagement.ts

import { SocketUser, SocketConnection } from '../../utils/data_types';
import { UI_ELEMENTS } from '../../utils/app_constants';
import { friendsManager } from '../../utils/friends_manager';

export class UserManagementService {
    private onlineUsers: SocketUser[] = [];
    private currentUsername: string = '';

    constructor(private socketConnection: SocketConnection) {
        this.currentUsername = socketConnection.getCurrentUser()?.username || '';
    }

    public updateOnlineUsers(users: SocketUser[]): void {
        console.log('👥 Updating online users list:', users);
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

        console.log('✅ Online users list rendered successfully');
    }

    private createUserListItem(user: SocketUser, container: HTMLElement): void {
        const userItem = document.createElement('div');
        userItem.className = 'flex items-center justify-between py-1 px-2 rounded hover:bg-gray-600';

        // Username display
        const usernameSpan = document.createElement('span');
        usernameSpan.className = 'text-sm';
        usernameSpan.textContent = user.display_name || user.username;
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

        // Direct message button
        const messageButton = this.createMessageButton(user);
        buttonsContainer.appendChild(messageButton);

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
        });
        
        return button;
    }

    private createMessageButton(user: SocketUser): HTMLButtonElement {
        const button = document.createElement('button');
        button.className = 'text-xs px-1 py-0.5 rounded hover:bg-gray-500';
        button.textContent = '💬';
        button.title = 'Send direct message';
        button.addEventListener('click', (event) => {
            event.stopPropagation();
            // This will be handled by the message service
            this.initiateDirectMessage(user);
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