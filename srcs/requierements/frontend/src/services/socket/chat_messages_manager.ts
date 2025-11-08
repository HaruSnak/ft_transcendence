// src/services/socket/messageHandling.ts

import { ChatMessage, DirectMessage, SocketConnection } from '../../utils/data_types';
import { UI_ELEMENTS, SOCKET_EVENTS } from '../../utils/app_constants';
import { SecurityUtils } from '../../utils/SecurityUtils';

// Classe qui gere tous les messages du chat : reception, envoi, historique, blocage, invitations de jeu
export class MessageHandlingService {
    private currentChat: DirectMessage | null = null;
    private messageHistory: Map<string, ChatMessage[]> = new Map();
    private blockedUsers: Set<string> = new Set();

    constructor(private socketConnection: SocketConnection) {
        // met en ecoute l'interface chat
        this.setupUIListeners();
    }

    // ========================= INITIALISATION & ECOUTEURS =========================
    // Met en place les ecouteurs pour les evenements socket (messages entrants du serveur)
    public setupSocketListeners(): void {
        const socket = this.socketConnection.getSocket();
        if (!socket) {
            console.error('Cannot setup message listeners: socket not available');
            return;
        }
        // socket.on = attend qu'un message arrive du server (ecoute) et execute une fois qu'il arrive
        socket.on(SOCKET_EVENTS.MESSAGE, (messageData: ChatMessage) => {
            this.handleIncomingMessage(messageData);
        });
    }

    // Met en place les ecouteurs pour les evenements de l'interface utilisateur (demarrage de conversation)
    private setupUIListeners(): void {
        document.addEventListener('initiateDirectMessage', (event: any) => {
            const { username, displayName } = event.detail;
            this.startDirectMessage(username, displayName);
        });
    }

    // ========================= GESTION DES MESSAGES ENTRANTS =========================
    // Traite un message entrant : verifie si bloquer ou message a double, puis gere selon le type
    private handleIncomingMessage(message: ChatMessage): void {
        const currentUser = this.socketConnection.getCurrentUser();
        // masque si c'est moi meme
        if (!currentUser) return;

        // Check if sender is blocked
        if (this.isUserBlocked(message.from)) {
            this.addMessageToHistory(message);
            return;
        }

        // Si message deja emit, il l'ignore pour eviter les duplications
        if (this.isDuplicateMessage(message)) {
            return;
        }

        // Handle direct messages
        if (message.to === currentUser.username) {
            this.handleDirectMessage(message);
        } else if (message.from === currentUser.username) {
            this.handleOwnMessage(message);
        }
    }

    // Gere un message direct recu : ajoute a la liste DM, marque comme non lu si besoin, affiche si conversation active
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

    // Gere un message que l'utilisateur a envoye : affiche si conversation active, ajoute a l'historique
    private handleOwnMessage(message: ChatMessage): void {
        // Display if currently viewing this conversation
        if (this.currentChat && this.currentChat.user === message.to) {
            this.displayMessageInChat(message);
        }

        this.addMessageToHistory(message);
    }

    // ========================= GESTION DES CONVERSATIONS =========================
    // Demarre une nouvelle conversation directe avec un utilisateur : met a jour l'interface et charge l'historique
    public startDirectMessage(username: string, displayName: string): void {
        this.currentChat = { type: 'dm', user: username, displayName: displayName };

        this.updateChatHeader(`Direct Message with ${displayName}`);
        this.loadConversationHistory(username);
        this.showChatInterface();
        this.markConversationAsRead(username);
    }

    // Charge l'historique des messages d'une conversation depuis la Map locale (pas la base de donnees)
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

    // ========================= AFFICHAGE DES MESSAGES =========================
    // Affiche un message dans la fenetre de chat avec echappement HTML pour la securite, gere les invitations de jeu
    private displayMessageInChat(message: ChatMessage): void {
        const messagesContainer = document.getElementById(UI_ELEMENTS.CHAT_MESSAGES);
        if (!messagesContainer) {
            console.error('Chat messages container not found');
            return;
        }

        const messageElement = document.createElement('div');
        messageElement.className = 'chat-message';

        const currentUser = this.socketConnection.getCurrentUser();
        const isOwnMessage = message.from === currentUser?.username;
        messageElement.classList.add(isOwnMessage ? 'own' : 'other');

        const timestamp = new Date(message.timestamp).toLocaleTimeString();
        const displayName = message.from_display_name || message.from;

        // Check if this is a game invitation message
        const isGameInvitation = message.text === "Hey! Want to play a game together?";

        if (isGameInvitation) {
            // Create message with join button
            const nameSpan = document.createElement('span');
            nameSpan.className = 'font-bold truncate inline-block max-w-48 min-w-24';
            nameSpan.title = displayName;
            nameSpan.textContent = `${displayName}:`;

            const textSpan = document.createElement('span');
            textSpan.textContent = ` ${message.text} `;

            const joinButton = document.createElement('button');
            joinButton.className = 'bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded text-xs ml-2 font-medium';
            joinButton.textContent = 'Join Game';
            joinButton.addEventListener('click', () => {
                // Redirection vers la page du jeu et ouverture automatique du mode 1vs1
                window.location.hash = 'game';
                setTimeout(() => {
                    const button = document.getElementById('buttonPlyLocalGame') as HTMLButtonElement;
                    if (button) button.click();
                }, 100);
            });

            const timeSmall = document.createElement('small');
            timeSmall.textContent = `(${timestamp})`;

            messageElement.appendChild(nameSpan);
            messageElement.appendChild(textSpan);
            messageElement.appendChild(joinButton);
            messageElement.appendChild(timeSmall);
        } else {
            // Regular message - SECURITY: Escape HTML to prevent XSS
            const safeDisplayName = SecurityUtils.escapeHTML(displayName);
            const safeMessageText = SecurityUtils.escapeHTML(message.text);
            messageElement.innerHTML = `<span class="font-bold truncate inline-block max-w-48 min-w-24" title="${safeDisplayName}">${safeDisplayName}:</span> ${safeMessageText} <small>(${timestamp})</small>`;
        }

        messagesContainer.appendChild(messageElement);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    // ========================= GESTION DE L'HISTORIQUE =========================
    // Ajoute un message a l'historique local (Map) pour pouvoir le retrouver plus tard
    private addMessageToHistory(message: ChatMessage): void {
        const conversationKey = message.from === this.socketConnection.getCurrentUser()?.username
            ? message.to
            : message.from;

        if (!this.messageHistory.has(conversationKey)) {
            this.messageHistory.set(conversationKey, []);
        }

        this.messageHistory.get(conversationKey)!.push(message);
    }

    // ========================= GESTION DE L'INTERFACE UTILISATEUR =========================
    // Ajoute un element dans la liste de gauche des conversations directes (DM)
    private addToDirectMessageList(username: string, displayName: string): void {
        const dmList = document.getElementById(UI_ELEMENTS.DM_LIST);
        if (!dmList) return;

        const existingConversation = dmList.querySelector(`[data-user="${username}"]`);
        if (existingConversation) return;

        const conversationElement = document.createElement('div');
        conversationElement.className = 'text-sm py-1 px-1 rounded cursor-pointer hover:bg-gray-600 truncate min-w-24';
        conversationElement.textContent = displayName;
        conversationElement.title = displayName;
        conversationElement.setAttribute('data-user', username);
        conversationElement.addEventListener('click', () => {
            this.startDirectMessage(username, displayName);
        });

        dmList.appendChild(conversationElement);
    }

    // Affiche un indicateur rouge de notification pour une conversation non lue
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

    // Supprime l'indicateur de notification non lue d'une conversation
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

    // Met a jour le titre de la conversation dans le header du chat
    private updateChatHeader(title: string): void {
        const header = document.getElementById(UI_ELEMENTS.CHAT_TITLE);
        if (header) {
            header.textContent = title;
        }
    }

    // Montre l'interface de chat : boutons bloquer/inviter, active le champ de saisie
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

    // ========================= ENVOI DE MESSAGES =========================
    // Envoie un message a l'utilisateur actuel de la conversation via le socket
    public sendMessage(messageText: string): void {
        if (!this.currentChat) {
            alert('Please select a user to start chatting first.');
            return;
        }

        const currentUser = this.socketConnection.getCurrentUser();
        if (!currentUser) {
            return;
        }

        // Add conversation to DM list if not already exists (for the sender)
        this.addToDirectMessageList(this.currentChat.user, this.currentChat.displayName);

        // Send to server (don't display locally to avoid duplicates)
        const socket = this.socketConnection.getSocket();
        if (socket) {
            socket.emit(SOCKET_EVENTS.MESSAGE, {
                to: this.currentChat.user,
                text: messageText
            });
        }
    }

    // ========================= GETTERS & UTILITIES =========================
    // Retourne la conversation actuelle (utilisateur avec qui on discute)
    public getCurrentChat(): DirectMessage | null {
        return this.currentChat;
    }

    // Met a jour la liste des utilisateurs bloques
    public updateBlockedUsers(blockedUsernames: Set<string>): void {
        this.blockedUsers = blockedUsernames;
    }

    // Verifie si un utilisateur est bloque
    public isUserBlocked(username: string): boolean {
        return this.blockedUsers.has(username);
    }

    // Cache tous les messages d'un utilisateur bloque dans l'interface
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

    // Verifie si un message est un duplicata (pour eviter les envois multiples accidentels)
    private isDuplicateMessage(message: ChatMessage): boolean {
        const currentUser = this.socketConnection.getCurrentUser();
        if (!currentUser || message.from !== currentUser.username) {
            return false;
        }

        // Check recent messages in the last 5 seconds
        const fiveSecondsAgo = Date.now() - 5000;
        const messageTime = new Date(message.timestamp).getTime();

        if (messageTime < fiveSecondsAgo) {
            return false;
        }

        // Check if we have a similar message in history
        const conversationKey = message.to;
        const history = this.messageHistory.get(conversationKey) || [];

        return history.some(existingMessage =>
            existingMessage.text === message.text &&
            existingMessage.to === message.to &&
            Math.abs(new Date(existingMessage.timestamp).getTime() - messageTime) < 1000
        );
    }

    // Remontre les messages d'un utilisateur qui a ete debloque
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