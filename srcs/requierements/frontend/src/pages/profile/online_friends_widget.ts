// src/pages/profile/online_friends_widget.ts

import { SocketUser } from '../../utils/data_types';
import { friendsManager } from './friends_manager';

// classe qui gere le widget des amis en ligne : affiche la liste des amis connectes, avec boutons pour discuter, voir profil, supprimer
export class OnlineFriendsWidget {
	private containerId: string;
	private onlineUsers: SocketUser[] = [];

	constructor(containerId: string) {
		this.containerId = containerId;
		this.setupEventListeners();
	}

	// ========================= INITIALISATION & ECOUTEURS =========================
	// met en place les ecouteurs d'evenements : mises a jour des amis et des users en ligne
	private setupEventListeners(): void {
		// Listen for friends list updates
		document.addEventListener('friendsListUpdated', () => {
			this.render();
		});

		// Listen for user list updates (when people come online/offline)
		document.addEventListener('onlineUsersUpdated', (event: any) => {
			if (event.detail && event.detail.users) {
				this.onlineUsers = event.detail.users;
				this.render();
			}
		});
	}

	// ========================= GESTION DES DONNEES =========================
	// met a jour la liste des users en ligne et fais le render
	public updateOnlineUsers(users: SocketUser[]): void {
		this.onlineUsers = users;
		this.render();
	}

	// ========================= AFFICHAGE PRINCIPAL =========================
	// Fonction principale : recupere les amis en ligne, vide le conteneur et affiche soit un message vide, soit chaque ami avec ses boutons
	public render(): void {
		const container = document.getElementById(this.containerId);
		if (!container) {
			console.error(`❌ Container #${this.containerId} not found`);
			return;
		}

		// Try to get latest online users from socket service
		this.updateOnlineUsersFromSocket();

		// Get online friends
		const onlineFriends = friendsManager.getOnlineFriends(this.onlineUsers);

		// Clear container
		container.innerHTML = '';

		if (onlineFriends.length === 0) {
			this.renderEmptyState(container);
			return;
		}

		// Render each online friend
		onlineFriends.forEach(friend => {
			this.renderFriendItem(friend, container);
		});

		console.log(`✅ Rendered ${onlineFriends.length} online friends`);
	}

	// met a jour la liste des users en ligne depuis le service socket, import dynamic
	private updateOnlineUsersFromSocket(): void {
		// Dynamically import socket service to avoid circular dependencies
		import('../../services/socket/index.js').then(({ socketService }) => {
			const onlineUsers = socketService.getOnlineUsers();
			if (onlineUsers && onlineUsers.length > 0) {
				this.onlineUsers = onlineUsers;
			}
		}).catch(_err => {
			// Socket service not available yet, keep existing onlineUsers
		});
	}

	// affiche un message quand aucun ami n'est en ligne
	private renderEmptyState(container: HTMLElement): void {
		const emptyDiv = document.createElement('div');
		emptyDiv.className = 'text-muted text-xs text-center py-4';
		emptyDiv.textContent = 'No friends online';
		container.appendChild(emptyDiv);
	}

	// cree et ajoute un element HTML pour un ami en ligne : point vert (online marqueur), nom, boutons (supprimer, profil, message)
	private renderFriendItem(friend: SocketUser, container: HTMLElement): void {
		const friendItem = document.createElement('div');
		friendItem.className = 'flex items-center justify-between py-2 px-1 rounded hover:bg-gray-700 cursor-pointer';

		// Left side: status indicator + name
		const leftSide = document.createElement('div');
		leftSide.className = 'flex items-center gap-1 overflow-hidden';

		// Online status indicator
		const statusDot = document.createElement('span');
		statusDot.className = 'w-2 h-2 rounded-full bg-green-500';
		statusDot.title = 'Online';

		// Friend name
		const nameSpan = document.createElement('span');
		nameSpan.className = 'text-sm truncate flex-1 min-w-0 min-w-24';
		nameSpan.textContent = friend.display_name || friend.username;
		nameSpan.title = friend.display_name || friend.username;

		leftSide.appendChild(statusDot);
		leftSide.appendChild(nameSpan);

		// Right side: action buttons
		const buttonsContainer = document.createElement('div');
		buttonsContainer.className = 'flex gap-1';

		// Remove friend button
		const removeFriendButton = this.createRemoveFriendButton(friend);
		buttonsContainer.appendChild(removeFriendButton);

		// Profile button
		const profileButton = this.createProfileButton(friend);
		buttonsContainer.appendChild(profileButton);

		// Message button
		const messageButton = this.createMessageButton(friend);
		buttonsContainer.appendChild(messageButton);

		friendItem.appendChild(leftSide);
		friendItem.appendChild(buttonsContainer);
		container.appendChild(friendItem);
	}

	// ========================= CREATION DES BOUTONS =========================
	// cree le bouton "✕" pour supprimer un ami de la liste
	private createRemoveFriendButton(friend: SocketUser): HTMLButtonElement {
		const button = document.createElement('button');
		button.className = 'text-xs px-1 py-0.5 rounded hover:bg-red-600';
		button.textContent = '✕';
		button.title = 'Remove from friends';
		button.addEventListener('click', (event) => {
			event.stopPropagation();
			if (confirm(`Remove ${friend.display_name || friend.username} from your friends?`)) {
				friendsManager.removeFriend(friend.username);
			}
		});
		return button;
	}

	// cree le bouton "👤" pour voir le profil d'un ami
	private createProfileButton(friend: SocketUser): HTMLButtonElement {
		const button = document.createElement('button');
		button.className = 'text-xs px-1 py-0.5 rounded hover:bg-gray-600';
		button.textContent = '👤';
		button.title = 'View profile';
		button.addEventListener('click', (event) => {
			event.stopPropagation();
			sessionStorage.setItem('profileUsername', friend.username);
			window.location.hash = `profile-${friend.username}`;
		});
		return button;
	}

	// cree le bouton "💬" pour envoyer un message a un ami, qui navigue vers le chat et demarre une conversation
	private createMessageButton(friend: SocketUser): HTMLButtonElement {
		const button = document.createElement('button');
		button.className = 'text-xs px-1 py-0.5 rounded hover:bg-gray-600';
		button.textContent = '💬';
		button.title = 'Send message';
		button.addEventListener('click', (event) => {
			event.stopPropagation();
			// Navigate to chat and initiate DM
			window.location.hash = 'live-chat';
			setTimeout(() => {
				const dmEvent = new CustomEvent('initiateDirectMessage', {
					detail: {
						username: friend.username,
						displayName: friend.display_name || friend.username
					}
				});
				document.dispatchEvent(dmEvent);
			}, 100);
		});
		return button;
	}
}
