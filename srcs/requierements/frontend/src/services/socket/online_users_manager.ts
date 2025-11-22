// src/services/socket/online_users_manager.ts

import { SocketUser, SocketConnection } from '../../utils/data_types';
import { UI_ELEMENTS } from '../../utils/app_constants';

// classe qui gere la liste des users en ligne : affichage dans l'interface, clics pour discuter, gestion des amis, etc.
export class UserManagementService {
	private onlineUsers: SocketUser[] = [];
	private currentUsername: string = '';

	constructor(private _socketConnection: SocketConnection) {
		this.currentUsername = _socketConnection.getCurrentUser()?.username || '';
		this.setupEventListeners();
	}

	// ========================= INITIALISATION & ECOUTEURS =========================
	// met en place les ecouteurs d'evenements, comme les mises a jour de la friendlist
	private setupEventListeners(): void {
		document.addEventListener('friendRemoved', () => this.renderUserList());
	}

	// ========================= GESTION DES UTILISATEURS EN LIGNE =========================
	// Fonction principale : recoit la liste des users en ligne du serveur, met a jour localement, rafraichit l'affichage et notifie les autres composants
	public updateOnlineUsers(users: SocketUser[]): void {
		this.onlineUsers = users;
		this.renderUserList();

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

		const usernameSpan = document.createElement('span');
		usernameSpan.className = 'text-sm truncate flex-1 min-w-0 min-w-24 cursor-pointer hover:text-blue-400';
		usernameSpan.textContent = user.display_name || user.username;
		usernameSpan.title = `Click to chat with ${user.display_name || user.username}`;
		usernameSpan.addEventListener('click', (e) => {
			e.stopPropagation();
			this.initiateDirectMessage(user);
		});
		userItem.appendChild(usernameSpan);

		const buttonsContainer = document.createElement('div');
		buttonsContainer.className = 'flex gap-1';

		buttonsContainer.appendChild(this.createAddFriendButton(user));
		buttonsContainer.appendChild(this.createProfileButton(user));

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
		button.addEventListener('click', (e) => {
			e.stopPropagation();
			window.location.hash = `profile-${user.username}`;
		});
		return button;
	}

	// cree le bouton "+" pour ajouter en ami, seulement si pas deja ami
	private createAddFriendButton(user: SocketUser): HTMLButtonElement {
		const button = document.createElement('button');
		button.className = 'text-xs px-1 py-0.5 rounded hover:bg-green-600';
		button.textContent = '+';
		button.title = 'Add to profile';

		const key = `profile_visible_${this.currentUsername}_${user.username}`;
		const isAlreadyFriend = localStorage.getItem(key) === 'true';

		if (isAlreadyFriend) {
			button.style.display = 'none';
		}

		button.addEventListener('click', (e) => {
			e.stopPropagation();
			localStorage.setItem(key, 'true');
			alert('Ajouté au profil !');
			button.style.display = 'none';

			const friendAddedEvent = new CustomEvent('friendAdded', {
				detail: { username: user.username }
			});
			document.dispatchEvent(friendAddedEvent);
		});

		return button;
	}

	// ========================= ACTIONS UTILISATEUR =========================
	// quand on clique sur un nom, emet un evenement pour demarrer une conversation privee (ouvre un/le dm)
	private initiateDirectMessage(user: SocketUser): void {
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