// src/services/socket/messageHandling.ts

import { ChatMessage, DirectMessage, SocketUser } from '../../utils/data-types';
import { UI_ELEMENTS, SOCKET_EVENTS } from '../../utils/app-constants';

export class MessageHandlingService {
    private currentChat: DirectMessage | null = null;
    private messageHistory: Map<string, ChatMessage[]> = new Map();
    private blockedUsers: Set<string> = new Set();

    constructor(private socketConnection: any) {
        this.setupSocketListeners();
        this.setupUIListeners();
    }

    private setupSocketListeners(): void {
        const socket = this.socketConnection.getSocket();
        if (!socket) return;

        socket.on(SOCKET_EVENTS.MESSAGE, (messageData: ChatMessage) => {
            console.log('💬 Message received:', messageData);
            this.handleIncomingMessage(messageData);
        });
    }

    private setupUIListeners(): void {
        document.addEventListener('initiateDirectMessage', (event: any) => {
            const { username, displayName } = event.detail;
            this.startDirectMessage(username, displayName);
        });
    }

    private handleIncomingMessage(message: ChatMessage): void {
        const currentUser = this.socketConnection.getCurrentUser();
        if (!currentUser) return;

        // Check if sender is blocked
        if (this.isUserBlocked(message.from)) {
            console.log(`🚫 Message from ${message.from} ignored (user blocked)`);
            this.addMessageToHistory(message);
            return;
        }

        // Handle direct messages
        if (message.to === currentUser.username) {
            this.handleDirectMessage(message);
        } else if (message.from === currentUser.username) {
            this.handleOwnMessage(message);
        }
    }

    private handleDirectMessage(message: ChatMessage): void {
        // Add to DM list if not exists
        this.addToDirectMessageList(message.from, message.from_display_name || message.from);

        // Mark as unread if not currently viewing this conversation
        if (!this.currentChat || this.currentChat.user !== message.from) {
            this.markConversationAsUnread(message.from);
        }

        // Display message if currently viewing this conversation
        if (this.currentChat && this.currentChat.user === message.from) {
            this.displayMessageInChat(message);
        }

        this.addMessageToHistory(message);
    }

    private handleOwnMessage(message: ChatMessage): void {
        // Display if currently viewing this conversation
        if (this.currentChat && this.currentChat.user === message.to) {
            this.displayMessageInChat(message);
        }

        this.addMessageToHistory(message);
    }

    public startDirectMessage(username: string, displayName: string): void {
        console.log(`💬 Starting direct message with: ${username}`);
        this.currentChat = { type: 'dm', user: username };

        this.updateChatHeader(`Direct Message with ${displayName}`);
        this.loadConversationHistory(username);
        this.showChatInterface();
        this.markConversationAsRead(username);
    }

    private loadConversationHistory(username: string): void {
        const messagesContainer = document.getElementById(UI_ELEMENTS.CHAT_MESSAGES);
        if (!messagesContainer) return;

        messagesContainer.innerHTML = '';
        const history = this.messageHistory.get(username) || [];

        history.forEach(message => {
            if (!this.isUserBlocked(message.from)) {
                this.displayMessageInChat(message);
            }
        });
    }

    private displayMessageInChat(message: ChatMessage): void {
        const messagesContainer = document.getElementById(UI_ELEMENTS.CHAT_MESSAGES);
        if (!messagesContainer) {
            console.error('❌ Chat messages container not found');
            return;
        }

        const messageElement = document.createElement('div');
        messageElement.className = 'chat-message';

        const currentUser = this.socketConnection.getCurrentUser();
        const isOwnMessage = message.from === currentUser?.username;
        messageElement.classList.add(isOwnMessage ? 'own' : 'other');

        const timestamp = new Date(message.timestamp).toLocaleTimeString();
        messageElement.innerHTML = `<strong>${message.from_display_name || message.from}:</strong> ${message.text} <small>(${timestamp})</small>`;

        messagesContainer.appendChild(messageElement);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    private addMessageToHistory(message: ChatMessage): void {
        const conversationKey = message.from === this.socketConnection.getCurrentUser()?.username
            ? message.to
            : message.from;

        if (!this.messageHistory.has(conversationKey)) {
            this.messageHistory.set(conversationKey, []);
        }

        this.messageHistory.get(conversationKey)!.push(message);
    }

    private addToDirectMessageList(username: string, displayName: string): void {
        const dmList = document.getElementById(UI_ELEMENTS.DM_LIST);
        if (!dmList) return;

        const existingConversation = dmList.querySelector(`[data-user="${username}"]`);
        if (existingConversation) return;

        const conversationElement = document.createElement('div');
        conversationElement.className = 'text-sm py-1 px-2 rounded cursor-pointer hover:bg-gray-600';
        conversationElement.textContent = displayName;
        conversationElement.setAttribute('data-user', username);
        conversationElement.addEventListener('click', () => {
            this.startDirectMessage(username, displayName);
        });

        dmList.appendChild(conversationElement);
    }

    private markConversationAsUnread(username: string): void {
        const dmList = document.getElementById(UI_ELEMENTS.DM_LIST);
        if (!dmList) return;

        const conversationElement = dmList.querySelector(`[data-user="${username}"]`) as HTMLElement;
        if (!conversationElement) return;

        conversationElement.classList.add('font-bold', 'text-primary');

        if (!conversationElement.querySelector('.unread-indicator')) {
            const indicator = document.createElement('span');
            indicator.className = 'unread-indicator ml-1 w-2 h-2 bg-red-500 rounded-full inline-block';
            conversationElement.appendChild(indicator);
        }
    }

    private markConversationAsRead(username: string): void {
        const dmList = document.getElementById(UI_ELEMENTS.DM_LIST);
        if (!dmList) return;

        const conversationElement = dmList.querySelector(`[data-user="${username}"]`) as HTMLElement;
        if (!conversationElement) return;

        conversationElement.classList.remove('font-bold', 'text-primary');

        const indicator = conversationElement.querySelector('.unread-indicator');
        if (indicator) {
            indicator.remove();
        }
    }

    private updateChatHeader(title: string): void {
        const header = document.getElementById(UI_ELEMENTS.CHAT_TITLE);
        if (header) {
            header.textContent = title;
        }
    }

    private showChatInterface(): void {
        // Show block button
        const blockButton = document.getElementById(UI_ELEMENTS.BLOCK_BUTTON);
        if (blockButton) {
            blockButton.classList.remove('hidden');
            blockButton.textContent = this.isUserBlocked(this.currentChat!.user) ? 'Unblock User' : 'Block User';
            blockButton.className = this.isUserBlocked(this.currentChat!.user)
                ? 'btn btn-danger btn-sm'
                : 'btn btn-ghost btn-sm';
        }

        // Show invite button
        const inviteButton = document.getElementById(UI_ELEMENTS.INVITE_BUTTON);
        if (inviteButton) {
            inviteButton.classList.remove('hidden');
        }

        // Enable chat input
        const chatInput = document.getElementById(UI_ELEMENTS.CHAT_INPUT) as HTMLInputElement;
        if (chatInput) {
            chatInput.disabled = false;
            chatInput.placeholder = 'Type your message...';
        }

        const sendButton = document.getElementById(UI_ELEMENTS.CHAT_SEND_BUTTON) as HTMLButtonElement;
        if (sendButton) {
            sendButton.disabled = false;
        }
    }

    public sendMessage(messageText: string): void {
        console.log(`📤 Sending message: "${messageText}"`);

        if (!this.currentChat) {
            console.error('❌ Cannot send message: No active conversation');
            alert('Please select a user to start chatting first.');
            return;
        }

        const socket = this.socketConnection.getSocket();
        if (socket) {
            socket.emit(SOCKET_EVENTS.MESSAGE, {
                to: this.currentChat.user,
                text: messageText
            });
            console.log('✅ Message sent via Socket.IO');
        } else {
            console.error('❌ Cannot send message: Socket not connected');
        }
    }

    public getCurrentChat(): DirectMessage | null {
        return this.currentChat;
    }

    public updateBlockedUsers(blockedUsernames: Set<string>): void {
        this.blockedUsers = blockedUsernames;
    }

    public isUserBlocked(username: string): boolean {
        return this.blockedUsers.has(username);
    }

    public hideMessagesFromUser(username: string): void {
        const messagesContainer = document.getElementById(UI_ELEMENTS.CHAT_MESSAGES);
        if (!messagesContainer) return;

        const messageElements = messagesContainer.querySelectorAll('.chat-message');
        messageElements.forEach(element => {
            const messageText = element.textContent || '';
            if (messageText.startsWith(`${username}:`) || messageText.includes(`<strong>${username}`)) {
                (element as HTMLElement).style.display = 'none';
            }
        });
    }

    public showMessagesFromUser(username: string): void {
        const messagesContainer = document.getElementById(UI_ELEMENTS.CHAT_MESSAGES);
        if (!messagesContainer) return;

        const messageElements = messagesContainer.querySelectorAll('.chat-message');
        messageElements.forEach(element => {
            const messageText = element.textContent || '';
            if (messageText.startsWith(`${username}:`) || messageText.includes(`<strong>${username}`)) {
                (element as HTMLElement).style.display = 'block';
            }
        });
    }
}