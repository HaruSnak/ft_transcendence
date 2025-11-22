// src/pages/profile/online_friends_widget.ts

import { SocketUser, User } from '../../utils/data_types';
import { UserApiService } from '../../services/api/user_api_service';

// classe qui gere le widget des amis en ligne : affiche la liste des amis connectes, avec boutons pour discuter, voir profil, supprimer
export class OnlineFriendsWidget {
	private containerId: string;
	private onlineUsers: SocketUser[] = [];
	private friends: User[] = [];

	constructor(containerId: string) {
		this.containerId = containerId;
		this.setupEventListeners();
		this.loadFriends();
	}

	// ========================= INITIALISATION & ECOUTEURS =========================
	// met en place les ecouteurs d'evenements : mises a jour des amis et des users en ligne
	private setupEventListeners(): void {
		document.addEventListener('onlineUsersUpdated', (event: any) => {
			if (event.detail?.users) {
				this.onlineUsers = event.detail.users;
				this.render();
			}
		});

		document.addEventListener('friendAdded', () => this.loadFriends());
		document.addEventListener('friendRemoved', () => this.loadFriends());
	}

	// charge la liste des amis depuis l'API
	private async loadFriends(): Promise<void> {
		try {
			const friends = await UserApiService.getFriends();
			this.friends = friends;
			this.render();
		} catch (error) {
			console.error('Failed to load friends:', error);
			this.friends = [];
			this.render();
		}
	}

	// ========================= GESTION DES DONNEES =========================
	// met a jour la liste des users en ligne et fais le render
	public updateOnlineUsers(users: SocketUser[]): void {
		this.onlineUsers = users;
		this.render();
	}

	// force la mise a jour des utilisateurs en ligne depuis le service socket
	public forceUpdateOnlineUsers(): void {
		import('../../services/socket/index.js').then(({ socketService }) => {
			import('../../services/socket/socket_connection.js').then(({ SocketConnectionService }) => {
				const connectionService = new SocketConnectionService();
				const socket = connectionService.getSocket();

				if (socket?.connected) {
					const onlineUsers = socketService.getOnlineUsers();
					if (onlineUsers && onlineUsers.length >= 0) {
						this.onlineUsers = onlineUsers;
						this.render();
					}
				} else {
					setTimeout(() => this.forceUpdateOnlineUsers(), 2000);
				}
			}).catch(() => {
				const onlineUsers = socketService.getOnlineUsers();
				if (onlineUsers && onlineUsers.length >= 0) {
					this.onlineUsers = onlineUsers;
					this.render();
				}
			});
		});
	}

	// ========================= AFFICHAGE PRINCIPAL =========================
	// Fonction principale : recupere TOUS les amis ajoutes, vide le conteneur et affiche chaque ami avec son statut en ligne
	public render(): void {
		const container = document.getElementById(this.containerId);
		if (!container) {
			console.error(`Container #${this.containerId} not found`);
			return;
		}

		const friends = this.getAllAddedFriends();
		container.innerHTML = '';

		if (friends.length === 0) {
			this.renderEmptyState(container);
			return;
		}

		this.friends.forEach(friend => this.renderFriendItem(friend, container));
	}

	// retourne TOUS les users ajoutes comme amis (pas seulement ceux en ligne)
	private getAllAddedFriends(): string[] {
		return this.friends.map(f => f.username);
	}

	// verifie si un ami est actuellement en ligne
	private isFriendOnline(username: string): boolean {
		return this.onlineUsers.some(user => user.username === username);
	}

	// recupere le nom d'utilisateur actuel
	private getCurrentUsername(): string | null {
		try {
			const user = JSON.parse(sessionStorage.getItem('user') || '{}');
			return user.username || null;
		} catch {
			return null;
		}
	}

	// affiche un message quand aucun ami n'a ete ajoute
	private renderEmptyState(container: HTMLElement): void {
		const div = document.createElement('div');
		div.className = 'text-muted text-xs text-center py-4';
		div.textContent = 'No friends added from chat';
		container.appendChild(div);
	}

	// cree et ajoute un element HTML pour un ami : point vert si en ligne, nom, boutons (supprimer, profil, message)
	private renderFriendItem(friend: User, container: HTMLElement): void {
		const username = friend.username;
		const isOnline = this.isFriendOnline(username);

		const item = document.createElement('div');
		item.className = 'flex items-center justify-between py-2 px-2 rounded hover:bg-gray-700 cursor-pointer border border-gray-600';

		const left = document.createElement('div');
		left.className = 'flex items-center gap-2 overflow-hidden flex-1 min-w-0';

		const dot = document.createElement('span');
		dot.className = `w-3 h-3 rounded-full flex-shrink-0 ${isOnline ? 'bg-green-500' : 'bg-gray-500'}`;
		dot.title = isOnline ? 'Online' : 'Offline';
		left.appendChild(dot);

		const name = document.createElement('span');
		name.className = 'text-sm truncate flex-1 min-w-0';
		name.textContent = username;
		name.title = username;
		left.appendChild(name);

		const buttons = document.createElement('div');
		buttons.className = 'flex gap-1 flex-shrink-0';

		buttons.appendChild(this.createRemoveButton(friend));
		buttons.appendChild(this.createProfileButton(friend));
		if (isOnline) buttons.appendChild(this.createMessageButton(friend));

		item.appendChild(left);
		item.appendChild(buttons);
		container.appendChild(item);
	}

	// ========================= CREATION DES BOUTONS =========================
	// cree le bouton "✕" pour supprimer un user du profil
	private createRemoveButton(friend: User): HTMLButtonElement {
		const btn = document.createElement('button');
		btn.className = 'text-xs px-1 py-0.5 rounded hover:bg-red-600';
		btn.textContent = '✕';
		btn.title = 'Remove from friendlist';
		btn.addEventListener('click', async (e) => {
			e.stopPropagation();
			if (confirm(`Remove ${friend.username} from your friendlist?`)) {
				try {
					await UserApiService.removeFriend(friend.id);
					this.loadFriends();
					document.dispatchEvent(new CustomEvent('friendRemoved', {
						detail: { username: friend.username }
					}));
				} catch (error) {
					console.error('Failed to remove friend:', error);
					alert('Failed to remove friend');
				}
			}
		});
		return btn;
	}

	// cree le bouton "👤" pour voir le profil d'un user
	private createProfileButton(friend: User): HTMLButtonElement {
		const btn = document.createElement('button');
		btn.className = 'text-xs px-1 py-0.5 rounded hover:bg-gray-600';
		btn.textContent = '👤';
		btn.title = 'View profile';
		btn.addEventListener('click', (e) => {
			e.stopPropagation();
			sessionStorage.setItem('profileUsername', friend.username);
			window.location.hash = `profile-${friend.username}`;
		});
		return btn;
	}

	// cree le bouton "💬" pour envoyer un message a un user, qui navigue vers le chat et demarre une conversation
	private createMessageButton(friend: User): HTMLButtonElement {
		const btn = document.createElement('button');
		btn.className = 'text-xs px-1 py-0.5 rounded hover:bg-gray-600';
		btn.textContent = '💬';
		btn.title = 'Send message';
		btn.addEventListener('click', (e) => {
			e.stopPropagation();
			window.location.hash = 'live-chat';
			setTimeout(() => {
				document.dispatchEvent(new CustomEvent('initiateDirectMessage', {
					detail: { username: friend.username, displayName: friend.username }
				}));
			}, 100);
		});
		return btn;
	}
}
