// src/services/socket/index.ts

import { SocketConnectionService } from './socket_connection';
import { UserManagementService } from './online_users_manager';
import { MessageHandlingService } from './chat_messages_manager';
import { BlockingSystemService } from './user_blocking_manager';
import { DirectMessage, User } from '../../utils/data_types';
import { SOCKET_EVENTS } from '../../utils/app_constants';

export class SocketServiceManager {
    private connectionService: SocketConnectionService;
    private userManagementService: UserManagementService;
    private messageHandlingService: MessageHandlingService;
    private blockingSystemService: BlockingSystemService;

    constructor() {
        this.connectionService = new SocketConnectionService();
        this.messageHandlingService = new MessageHandlingService(this.connectionService);
        this.userManagementService = new UserManagementService(this.connectionService);
        this.blockingSystemService = new BlockingSystemService(this.messageHandlingService);

        this.initializeServices();
    }

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

    // Public API methods
    public sendMessage(messageText: string): void {
        this.messageHandlingService.sendMessage(messageText);
    }

    public updateUserProfile(user: User): void {
        this.connectionService.updateCurrentUser(user);
    }

    public getCurrentChat(): DirectMessage | null {
        return this.messageHandlingService.getCurrentChat();
    }

    public blockUser(username: string): void {
        this.blockingSystemService.blockUser(username);
    }

    public unblockUser(username: string): void {
        this.blockingSystemService.unblockUser(username);
    }

    public isUserBlocked(username: string): boolean {
        return this.blockingSystemService.isUserBlocked(username);
    }

    public disconnect(): void {
        this.connectionService.disconnect();
    }
}

// Export singleton instance
export const socketService = new SocketServiceManager();