// src/services/socket/index.ts

import { SocketConnectionService } from './socket_connection';
import { UserManagementService } from './online_users_manager';
import { MessageHandlingService } from './chat_messages_manager';
import { BlockingSystemService } from './user_blocking_manager';
import { DirectMessage, User } from '../../utils/data_types';
import { SOCKET_EVENTS } from '../../utils/app_constants';

// Classe principale qui orchestre tous les services socket du chat
// gere la connexion, les messages, les utilisateurs en ligne et le systeme de blocage
export class SocketServiceManager {
	private connectionService: SocketConnectionService;
	private userManagementService: UserManagementService;
	private messageHandlingService: MessageHandlingService;
	private blockingSystemService: BlockingSystemService;

	// ========================= CONSTRUCTEUR & INITIALISATION =========================
	// cree et initialise tous les services socket avec leurs dependances
	constructor() {
		this.connectionService = new SocketConnectionService();
		this.messageHandlingService = new MessageHandlingService(this.connectionService);
		this.userManagementService = new UserManagementService(this.connectionService);
		this.blockingSystemService = new BlockingSystemService(this.messageHandlingService);

		this.initializeServices();
	}

	// initialise les services et met en place les ecouteurs d'evenements socket
	private initializeServices(): void {
		const socket = this.connectionService.connect();

		// Setup socket listeners after connection
		this.messageHandlingService.setupSocketListeners();

		// Setup user list handling
		socket.on(SOCKET_EVENTS.USER_LIST, (data: any) => {
			this.userManagementService.updateOnlineUsers(data.users);
		});

		// Load blocked users on initialization
		this.blockingSystemService.loadBlockedUsers();
	}

	// ========================= API PUBLIQUE - MESSAGES =========================
	// envoie un message dans la conversation actuelle via MessageHandlingService
	public sendMessage(messageText: string): void {
		this.messageHandlingService.sendMessage(messageText);
	}

	// tournois ping : envoie un message direct a un utilisateur specifique
	public sendDirectMessage(toUsername: string, messageText: string): void {
		const socket = this.connectionService.getSocket();
		if (socket) {
			socket.emit(SOCKET_EVENTS.MESSAGE, {
				to: toUsername,
				text: messageText
			});
		}
	}

	// ========================= API PUBLIQUE - PROFIL UTILISATEUR =========================
	// met a jour le profil de l'utilisateur actuel et le renregistre sur le socket
	public updateUserProfile(user: User): void {
		this.connectionService.updateCurrentUser(user);
	}

	// ========================= API PUBLIQUE - CONVERSATION =========================
	// retourne la conversation directe actuelle (utilisateur et interface)
	public getCurrentChat(): DirectMessage | null {
		return this.messageHandlingService.getCurrentChat();
	}

	// ========================= API PUBLIQUE - SYSTEME DE BLOCAGE =========================
	// bloque un utilisateur (il ne pourra plus recevoir/envoyer de messages)
	public blockUser(username: string): void {
		this.blockingSystemService.blockUser(username);
	}

	// debloque un utilisateur precedemment bloque
	public unblockUser(username: string): void {
		this.blockingSystemService.unblockUser(username);
	}

	// verifie si un utilisateur est bloque dans la conversation actuelle
	public isUserBlocked(username: string): boolean {
		return this.blockingSystemService.isUserBlocked(username);
	}

	// ========================= API PUBLIQUE - UTILISATEURS EN LIGNE =========================
	// retourne la liste des utilisateurs actuellement connectes
	public getOnlineUsers(): any[] {
		return this.userManagementService.getOnlineUsers();
	}
}

// Export singleton instance
export const socketService = new SocketServiceManager();