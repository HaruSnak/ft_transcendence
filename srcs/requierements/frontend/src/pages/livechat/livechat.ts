// src/pages/livechat/chatInterface.ts

import { socketService } from '../../services/socket';

// Business logic: Chat operations (modifier uniquement ici pour le backend/socket)
// prend le message ecrit par le user et l'envoie au serveur par le service socket pour qu'il arrive a l'autre personne
export function performSendMessage(message: string): void {
    socketService.sendMessage(message);
}

// bloque un user en appelant le service socket, ce qui l'empeche de recevoir/envoyer des messages
export function performBlockUser(username: string): void {
    socketService.blockUser(username);
}

// pour debloquer, on appelle le service pour remettre l'utilisateur dans la liste des contacts unblock
export function performUnblockUser(username: string): void {
    socketService.unblockUser(username);
}

// recupere le nom du user avec qui on discute, ou null si pas de conversation ouverte
export function getCurrentChatUser(): any {
    const chat = socketService.getCurrentChat();
    return chat ? chat.user : null;
}

// check si un utilisateur est userBlocked dans la conversation actuelle
export function isUserCurrentlyBlocked(username: string): boolean {
    return socketService.isUserBlocked(username);
}

// Classe principale qui gere toute l'interface du chat : authentification, boutons, envoi de messages, etc.
export class LivechatManager {
    private isAuthenticated: boolean = false;

    constructor() {
        this.checkAuthentication();
    }

    // ========================= AUTHENTIFICATION & INITIALISATION =========================
    // Au demarrage, on verifie si l'utilisateur a un token (est connecte), sinon on bloque l'acces
    private checkAuthentication(): void {
        const token = sessionStorage.getItem('authToken');
        this.isAuthenticated = !!token;

        if (!this.isAuthenticated) {
            this.showAccessDenied();
            return;
        }

        this.initializeChatInterface();
    }

    // Si pas connecte, on affiche un message "acces refuse" avec un bouton pour aller a la page de login
    private showAccessDenied(): void {
        const chatSection = document.getElementById('live-chat');
        if (!chatSection) return;

        chatSection.innerHTML = `
            <div class="container">
                <div class="card text-center" style="max-width: 400px; margin: 0 auto;">
                    <div class="text-xl mb-lg">🔒 Access denied</div>
                    <button id="livechat-login-btn" class="btn btn-primary">Login</button>
                </div>
            </div>
        `;

        document.getElementById('livechat-login-btn')?.addEventListener('click', () => {
            window.location.hash = 'login';
        });
    }

    // Une fois connecte, on prepare toute l'interface : formulaires, boutons, listes, etc.
    private initializeChatInterface(): void {
        this.setupMessageForm();
        this.setupBlockButton();
        this.setupInviteButton();
        this.initializeDMList();
        this.disableChatInput();
    }

    // ========================= CONFIGURATION DU FORMULAIRE DE MESSAGES =========================
    // On met en place le formulaire d'envoi : quand on appuie sur Enter ou clique envoyer, ca declenche l'envoi
    private setupMessageForm(): void {
        const chatForm = document.getElementById('chat_form') as HTMLFormElement;
        const chatInput = document.getElementById('chat_input') as HTMLInputElement;

        if (!chatForm) {
            console.error('❌ Chat form not found');
            return;
        }

        chatForm.addEventListener('submit', (event) => {
            event.preventDefault();
            const message = chatInput.value.trim();

            if (message) {
                this.sendMessage(message, chatInput);
            }
        });
    }

    // Fonction qui envoie vraiment le message et vide le champ de saisie pour la prochaine fois
    private sendMessage(message: string, inputElement: HTMLInputElement): void {
        const currentChatUser = getCurrentChatUser();

        if (currentChatUser) {
            performSendMessage(message);
            inputElement.value = '';
        } else {
            alert('Please select a user to start chatting first.');
        }
    }

    // ========================= CONFIGURATION DES BOUTONS =========================
    // On configure le bouton "Block/Unblock" : il change selon si l'utilisateur est deja bloque ou pas
    private setupBlockButton(): void {
        const blockButton = document.getElementById('block-btn');
        if (!blockButton) return;

        blockButton.addEventListener('click', () => {
            const username = getCurrentChatUser();
            if (!username) return;

            const isCurrentlyBlocked = isUserCurrentlyBlocked(username);

            if (isCurrentlyBlocked) {
                this.unblockUser(username, blockButton);
            } else {
                this.blockUser(username, blockButton);
            }
        });
    }

    // Bouton pour inviter a jouer : envoie un message special "Hey! Want to play a game together?"
    private setupInviteButton(): void {
        const inviteButton = document.getElementById('invite-btn');
        if (!inviteButton) return;

        inviteButton.addEventListener('click', () => {
            const username = getCurrentChatUser();
            if (!username) return;

            // Send an invitation message
            const invitationMessage = "Hey! Want to play a game together?";
            performSendMessage(invitationMessage);
        });
    }

    // ========================= ACTIONS DE BLOCAGE/DEBLOCAGE =========================
    // Action de blocage : appelle la fonction, change le texte et style du bouton
    private blockUser(username: string, button: HTMLElement): void {
        performBlockUser(username);
        button.textContent = 'Unblock User';
        button.className = 'btn btn-danger btn-sm';
    }

    // Action de debloquage : pareil, mais remet le bouton normal
    private unblockUser(username: string, button: HTMLElement): void {
        performUnblockUser(username);
        button.textContent = 'Block User';
        button.className = 'btn btn-ghost btn-sm';
    }

    // ========================= INITIALISATION DE L'INTERFACE =========================
    // Au demarrage, on met un message dans la liste des DM pour guider l'utilisateur
    private initializeDMList(): void {
        const dmList = document.getElementById('dm-list');
        if (dmList) {
            dmList.innerHTML = '<div class="text-muted text-xs">Click on a user to start a DM</div>';
        }
    }

    // Desactive l'input au debut pour forcer a selectionner un utilisateur avant de taper
    private disableChatInput(): void {
        const chatInput = document.getElementById('chat_input') as HTMLInputElement;
        const chatSendButton = document.getElementById('chat_send_btn') as HTMLButtonElement;

        if (chatInput) {
            chatInput.disabled = true;
            chatInput.placeholder = 'Select a user to start chatting';
        }

        if (chatSendButton) {
            chatSendButton.disabled = true;
        }
    }
}