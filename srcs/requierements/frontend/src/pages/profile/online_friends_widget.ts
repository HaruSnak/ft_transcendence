// src/pages/profile/online_friends_widget.ts

import { SocketUser } from '../../utils/data_types';

export class OnlineFriendsWidget {
	private containerId: string;
	private onlineUsers: SocketUser[] = [];

	constructor(containerId: string) {
		this.containerId = containerId;
		this.setupEventListeners();
	}

	private setupEventListeners(): void {
		document.addEventListener('onlineUsersUpdated', (event: any) => {
			if (event.detail?.users) {
				this.onlineUsers = event.detail.users;
				this.render();
			}
		});

		document.addEventListener('friendAdded', () => this.render());
	}

	public updateOnlineUsers(users: SocketUser[]): void {
		this.onlineUsers = users;
		this.render();
	}

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

		friends.forEach(friend => this.renderFriendItem(friend, container));
	}

	private getAllAddedFriends(): string[] {
		const currentUser = this.getCurrentUsername();
		if (!currentUser) return [];

		const friends: string[] = [];
		const prefix = `profile_visible_${currentUser}_`;

		for (let i = 0; i < localStorage.length; i++) {
			const key = localStorage.key(i);
			if (key?.startsWith(prefix)) {
				friends.push(key.replace(prefix, ''));
			}
		}
		return friends;
	}

	private isFriendOnline(username: string): boolean {
		return this.onlineUsers.some(user => user.username === username);
	}

	private getCurrentUsername(): string | null {
		try {
			const user = JSON.parse(sessionStorage.getItem('user') || '{}');
			return user.username || null;
		} catch {
			return null;
		}
	}

	private renderEmptyState(container: HTMLElement): void {
		const div = document.createElement('div');
		div.className = 'text-muted text-xs text-center py-4';
		div.textContent = 'No friends added from chat';
		container.appendChild(div);
	}

	private renderFriendItem(username: string, container: HTMLElement): void {
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

		buttons.appendChild(this.createRemoveButton(username));
		buttons.appendChild(this.createProfileButton(username));
		if (isOnline) buttons.appendChild(this.createMessageButton(username));

		item.appendChild(left);
		item.appendChild(buttons);
		container.appendChild(item);
	}

	private createRemoveButton(username: string): HTMLButtonElement {
		const btn = document.createElement('button');
		btn.className = 'text-xs px-1 py-0.5 rounded hover:bg-red-600';
		btn.textContent = '✕';
		btn.title = 'Remove from friendlist';
		btn.addEventListener('click', (e) => {
			e.stopPropagation();
			if (confirm(`Remove ${username} from your friendlist?`)) {
				const currentUser = this.getCurrentUsername();
				if (currentUser) {
					localStorage.removeItem(`profile_visible_${currentUser}_${username}`);
					this.render();

					document.dispatchEvent(new CustomEvent('friendRemoved', {
						detail: { username }
					}));
				}
			}
		});
		return btn;
	}

	private createProfileButton(username: string): HTMLButtonElement {
		const btn = document.createElement('button');
		btn.className = 'text-xs px-1 py-0.5 rounded hover:bg-gray-600';
		btn.textContent = '👤';
		btn.title = 'View profile';
		btn.addEventListener('click', (e) => {
			e.stopPropagation();
			sessionStorage.setItem('profileUsername', username);
			window.location.hash = `profile-${username}`;
		});
		return btn;
	}

	private createMessageButton(username: string): HTMLButtonElement {
		const btn = document.createElement('button');
		btn.className = 'text-xs px-1 py-0.5 rounded hover:bg-gray-600';
		btn.textContent = '💬';
		btn.title = 'Send message';
		btn.addEventListener('click', (e) => {
			e.stopPropagation();
			window.location.hash = 'live-chat';
			setTimeout(() => {
				document.dispatchEvent(new CustomEvent('initiateDirectMessage', {
					detail: { username, displayName: username }
				}));
			}, 100);
		});
		return btn;
	}
}
