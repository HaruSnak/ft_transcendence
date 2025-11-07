// src/services/socket/userManagement.ts

import { SocketUser, SocketConnection } from '../../utils/data_types';
import { UI_ELEMENTS } from '../../utils/app_constants';
import { friendsManager } from '../../pages/profile/friends_manager';

// classe qui gere la liste des users en ligne : affichage dans l'interface, clics pour discuter, gestion des amis, etc.
export class UserManagementService {
    private onlineUsers: SocketUser[] = [];
    private currentUsername: string = '';

    constructor(private socketConnection: SocketConnection) {
        this.currentUsername = socketConnection.getCurrentUser()?.username || '';
        this.setupEventListeners();
    }

    // ========================= INITIALISATION & ECOUTEURS =========================
    // met en place les ecouteurs d'evenements, comme les mises a jour de la friendlist
    private setupEventListeners(): void {
        // Listen for friends list updates to refresh the user list
        document.addEventListener('friendsListUpdated', () => {
            this.renderUserList();
        });
    }

    // ========================= GESTION DES UTILISATEURS EN LIGNE =========================
    // Fonction principale : recoit la liste des users en ligne du serveur, met a jour localement, rafraichit l'affichage et notifie les autres composants
    public updateOnlineUsers(users: SocketUser[]): void {
        this.onlineUsers = users;
        this.renderUserList();

        // Dispatch event for other components (like online friends widget)
        const event = new CustomEvent('onlineUsersUpdated', {
            detail: { users: this.onlineUsers }
        });
        document.dispatchEvent(event);
    }

    // ========================= AFFICHAGE DE LA LISTE =========================
    // vide le conteneur HTML et recree la liste des users online (sauf soi-meme)
    private renderUserList(): void {
        const userListContainer = document.getElementById(UI_ELEMENTS.USER_LIST);
        if (!userListContainer) {
            console.error('User list container not found');
            return;
        }

        userListContainer.innerHTML = '';

        this.onlineUsers.forEach(user => {
            if (user.username !== this.currentUsername) {
                this.createUserListItem(user, userListContainer);
            }
        });
    }

    // cree un element HTML pour un user : nom cliquable, boutons pour amis et profil
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

    // ========================= CREATION DES BOUTONS D'ACTION =========================
    // cree le bouton "👤" pour voir le user profile
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

    // cree le bouton "+" pour ajouter en ami, seulement si pas deja ami
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

    // ========================= ACTIONS UTILISATEUR =========================
    // quand on clique sur un nom, emet un evenement pour demarrer une conversation privee (ouvre un/le dm)
    private initiateDirectMessage(user: SocketUser): void {
        // Emit event to message service
        const event = new CustomEvent('initiateDirectMessage', {
            detail: { username: user.username, displayName: user.display_name || user.username }
        });
        document.dispatchEvent(event);
    }

    // ========================= GETTERS & UTILITIES =========================
    // retourne la liste actuelle des users online
    public getOnlineUsers(): SocketUser[] {
        return this.onlineUsers;
    }

    // verifie si un user specifique est online
    public isUserOnline(username: string): boolean {
        return this.onlineUsers.some(user => user.username === username);
    }
}