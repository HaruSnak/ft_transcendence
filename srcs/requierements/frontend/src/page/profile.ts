// src/page/profile.ts

import { User } from '../utils/data_types';
import { UserApiService } from '../services/api/user_api_service';
import { SecurityUtils } from '../utils/SecurityUtils';
import { OnlineFriendsWidget } from '../components/online_friends_widget';

export class ProfileManager {
    private onlineFriendsWidget: OnlineFriendsWidget | null = null;
    private isAuthenticated: boolean = false;

    constructor() {
        this.checkAuthentication();
    }

    // ===========================================
    // AUTHENTICATION & INITIALIZATION
    // ===========================================

    private checkAuthentication(): void {
        const token = sessionStorage.getItem('authToken');
        this.isAuthenticated = !!token;

        if (!this.isAuthenticated) {
            this.showAccessDenied();
            return;
        }

        this.loadProfile();
        this.setupEventListeners();
    }

    private showAccessDenied(): void {
        const profileSection = document.getElementById('profile');
        if (!profileSection) return;

        profileSection.innerHTML = `
            <div class="container">
                <div class="card text-center" style="max-width: 400px; margin: 0 auto;">
                    <div class="text-xl mb-lg">🔒 Access denied</div>
                    <button id="profile-login-btn" class="btn btn-primary">Login</button>
                </div>
            </div>
        `;

        document.getElementById('profile-login-btn')?.addEventListener('click', () => {
            window.location.hash = 'login';
        });
    }

    // ===========================================
    // EVENT LISTENERS SETUP
    // ===========================================

    private setupEventListeners(): void {
        // Handle profile actions
        document.addEventListener('click', (e) => {
            const target = e.target as HTMLElement;
            const action = target.getAttribute('data-action');

            if (action === 'edit') {
                this.showEditForm();
            } else if (action === 'cancel') {
                this.hideEditForm();
            } else if (action === 'logout') {
                this.logout();
            } else if (action === 'delete') {
                this.deleteUser();
            }
        });

        // Handle avatar upload
        document.addEventListener('change', (e) => {
            const target = e.target as HTMLInputElement;
            if (target.matches('[data-field="edit-avatar"]')) {
                this.uploadAvatar();
            }
        });

        // Handle edit form submission
        const editForm = document.querySelector('[data-state="edit"]') as HTMLFormElement;
        if (editForm) {
            editForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.updateProfile();
            });
        }
    }

    // ===========================================
    // PROFILE LOADING & DISPLAY
    // ===========================================

    private async loadProfile(): Promise<void> {
        this.showState('loading');

        // Check if viewing another user's profile
        const profileUsername = sessionStorage.getItem('profileUsername');
        sessionStorage.removeItem('profileUsername');

        try {
            let response;
            if (profileUsername) {
                response = await fetch(`/api/user/by-username/${profileUsername}`, {
                    headers: {
                        'Authorization': `Bearer ${sessionStorage.getItem('authToken')}`,
                    },
                });
            } else {
                response = await fetch('/api/user/profile', {
                    headers: {
                        'Authorization': `Bearer ${sessionStorage.getItem('authToken')}`,
                    },
                });
            }

            if (response.ok) {
                const data = await response.json();
                this.populateFields(data.user, !!profileUsername);
                this.showState('main');

                if (profileUsername) {
                    // Hide buttons for other users' profiles
                    const editBtn = document.querySelector('[data-action="edit"]');
                    if (editBtn) (editBtn as HTMLElement).style.display = 'none';
                    const logoutBtn = document.querySelector('[data-action="logout"]');
                    if (logoutBtn) (logoutBtn as HTMLElement).style.display = 'none';
                } else {
                    // Initialize online friends widget for own profile
                    if (!this.onlineFriendsWidget) {
                        this.onlineFriendsWidget = new OnlineFriendsWidget('profile-online-friends');

                        import('../services/socket/index.js').then(({ socketService }) => {
                            const onlineUsers = socketService.getOnlineUsers();
                            if (onlineUsers && onlineUsers.length > 0) {
                                this.onlineFriendsWidget?.updateOnlineUsers(onlineUsers);
                            }
                        }).catch(err => {
                            console.log('⚠️ Socket service not available yet:', err);
                        });
                    }
                }
            } else {
                if (response.status === 403) {
                    sessionStorage.removeItem('authToken');
                    sessionStorage.removeItem('user');
                    this.showProfileMsg('Session expirée ou non autorisée. Merci de vous reconnecter.', false);
                }
                this.showState('denied');
            }
        } catch (error) {
            console.error('Profile load error:', error);
            this.showState('denied');
        }
    }

    private populateFields(user: User, isOtherUser: boolean = false): void {
        const nameField = document.querySelector('[data-field="name"]') as HTMLElement;
        const infoField = document.querySelector('[data-field="info"]') as HTMLElement;
        const avatarField = document.querySelector('[data-field="avatar"]') as HTMLImageElement;

        if (nameField) nameField.textContent = user.display_name || user.username;
        if (infoField) {
            if (isOtherUser) {
                infoField.style.display = 'none';
            } else {
                infoField.style.display = '';
                infoField.textContent = `Login: ${user.username} | Email: ${user.email}`;
            }
        }
        if (avatarField) {
            let avatar = user.avatar_url;
            if (!avatar || avatar === '' || avatar === 'null') {
                avatar = '/assets/default-avatar.png';
            }
            avatarField.src = avatar;
        }

        if (!isOtherUser) {
            const winsElements = document.querySelectorAll('.text-2xl.font-bold.mb-sm');
            const winsElement = winsElements[0] as HTMLElement;
            const lossesElement = winsElements[1] as HTMLElement;

            if (winsElement) winsElement.textContent = (user.wins || 0).toString();
            if (lossesElement) lossesElement.textContent = (user.losses || 0).toString();

            // Update edit form fields
            const editName = document.querySelector('[data-field="edit-name"]') as HTMLInputElement;
            const editEmail = document.querySelector('[data-field="edit-email"]') as HTMLInputElement;

            if (editName) editName.value = user.display_name || user.username || '';
            if (editEmail) editEmail.value = user.email || '';

            // Load match history
            this.loadMatchHistory();
        }

        // Hide friends list for other users
        const friendsContainer = document.getElementById('profile-online-friends');
        if (friendsContainer) {
            friendsContainer.style.display = isOtherUser ? 'none' : '';
        }

        const sidebar = document.querySelector('#profile .chat-sidebar') as HTMLElement;
        if (sidebar) {
            sidebar.style.display = isOtherUser ? 'none' : '';
        }
    }

    // ===========================================
    // MATCH HISTORY MANAGEMENT
    // ===========================================

    private async loadMatchHistory(): Promise<void> {
        try {
            const response = await fetch('/api/user/match-history', {
                headers: {
                    'Authorization': `Bearer ${sessionStorage.getItem('authToken')}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                this.displayMatchHistory(data.matches || []);
            } else {
                console.error('Failed to load match history:', response.status);
            }
        } catch (error) {
            console.error('Error loading match history:', error);
        }
    }

    private displayMatchHistory(matches: any[]): void {
        const container = document.getElementById('match-history');
        if (!container) return;

        container.innerHTML = '';

        if (matches.length === 0) {
            container.innerHTML = '<p class="text-center text-gray-500">Aucun match joué pour le moment.</p>';
            return;
        }

        matches.forEach(match => {
            const matchDiv = document.createElement('div');
            matchDiv.className = 'bg-gray-800 p-4 rounded-lg mb-4';

            const date = new Date(match.created_at).toLocaleDateString('fr-FR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });

            const result = match.winner_id === match.player1_id ? 'Victoire' : 'Défaite';
            const opponent = match.winner_id === match.player1_id ? match.player2_username : match.player1_username;
            const score = `${match.player1_score}-${match.player2_score}`;

            matchDiv.innerHTML = `
                <div class="flex justify-between items-center">
                    <div>
                        <p class="font-semibold">${result} contre ${opponent}</p>
                        <p class="text-sm text-gray-400">${date}</p>
                    </div>
                    <div class="text-right">
                        <p class="font-bold text-lg">${score}</p>
                    </div>
                </div>
            `;

            container.appendChild(matchDiv);
        });
    }

    // ===========================================
    // PROFILE EDITING
    // ===========================================

    private showEditForm(): void {
        const mainState = document.querySelector('[data-state="main"]');
        const editState = document.querySelector('[data-state="edit"]');
        if (mainState) mainState.classList.add('hidden');
        if (editState) editState.classList.remove('hidden');
        this.clearEditMsg();
    }

    private hideEditForm(): void {
        const mainState = document.querySelector('[data-state="main"]');
        const editState = document.querySelector('[data-state="edit"]');
        if (mainState) mainState.classList.remove('hidden');
        if (editState) editState.classList.add('hidden');
        this.clearEditMsg();
    }

    private async updateProfile(): Promise<void> {
        const editName = document.querySelector('[data-field="edit-name"]') as HTMLInputElement;
        const editEmail = document.querySelector('[data-field="edit-email"]') as HTMLInputElement;
        const editPassword = document.querySelector('[data-field="edit-password"]') as HTMLInputElement;
        const editConfirmPassword = document.querySelector('[data-field="edit-confirm-password"]') as HTMLInputElement;

        if (!editName || !editEmail) {
            this.showEditMsg('Erreur: champs nom et email requis.', false);
            return;
        }

        const displayName = SecurityUtils.sanitizeDisplayName(editName.value);
        const email = SecurityUtils.sanitizeText(editEmail.value);
        const password = editPassword ? editPassword.value : '';
        const confirmPassword = editConfirmPassword ? editConfirmPassword.value : '';

        if (!displayName || !email) {
            this.showEditMsg('Le nom d\'affichage et l\'email sont obligatoires.', false);
            return;
        }

        // Basic validation
        const displayNameError = SecurityUtils.validateDisplayName(displayName);
        if (displayNameError) {
            this.showEditMsg('Nom d\'affichage invalide.', false);
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            this.showEditMsg('Format d\'email invalide.', false);
            return;
        }

        if (password && (password.length < 8 || password !== confirmPassword)) {
            this.showEditMsg('Mot de passe invalide.', false);
            return;
        }

        this.showEditMsg('Mise à jour en cours...', true);

        try {
            const response = await fetch('/api/user/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${sessionStorage.getItem('authToken')}`,
                },
                body: JSON.stringify({
                    display_name: displayName,
                    email: email,
                    ...(password && { password: password }),
                }),
            });

            if (response.ok) {
                const data = await response.json();
                sessionStorage.setItem('user', JSON.stringify(data.user));
                this.showEditMsg('Profil mis à jour avec succès!', true);
                setTimeout(() => this.loadProfile(), 1000);
            } else {
                this.showEditMsg('Erreur lors de la mise à jour.', false);
            }
        } catch (error) {
            console.error('Profile update error:', error);
            this.showEditMsg('Erreur réseau.', false);
        }
    }

    // ===========================================
    // AVATAR MANAGEMENT
    // ===========================================

    private async uploadAvatar(): Promise<void> {
        const fileInput = document.querySelector('[data-field="edit-avatar"]') as HTMLInputElement;
        if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
            this.showEditMsg('Veuillez sélectionner un fichier.', false);
            return;
        }

        const file = fileInput.files[0];
        if (!file.type.startsWith('image/') || file.size > 5 * 1024 * 1024) {
            this.showEditMsg('Fichier invalide.', false);
            return;
        }

        this.showEditMsg('Téléchargement en cours...', true);

        const formData = new FormData();
        formData.append('avatar', file);

        try {
            const response = await fetch('/api/user/avatar', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${sessionStorage.getItem('authToken')}`,
                },
                body: formData,
            });

            if (response.ok) {
                const data = await response.json();
                const avatarImg = document.querySelector('[data-field="avatar"]') as HTMLImageElement;
                if (avatarImg && data.avatar_url) {
                    avatarImg.src = data.avatar_url;
                }
                const user = JSON.parse(sessionStorage.getItem('user') || '{}');
                user.avatar_url = data.avatar_url;
                sessionStorage.setItem('user', JSON.stringify(user));
                this.showEditMsg('Avatar mis à jour!', true);
            } else {
                this.showEditMsg('Erreur lors du téléchargement.', false);
            }
        } catch (error) {
            console.error('Avatar upload error:', error);
            this.showEditMsg('Erreur réseau.', false);
        }
    }

    // ===========================================
    // ACCOUNT MANAGEMENT
    // ===========================================

    private async logout(): Promise<void> {
        try {
            await fetch('/api/auth/logout', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${sessionStorage.getItem('authToken')}`,
                },
            });
        } catch (error) {
            console.error('Logout error:', error);
        }

        sessionStorage.removeItem('authToken');
        sessionStorage.removeItem('user');
        sessionStorage.removeItem('profileUsername');
        window.location.hash = 'login';
    }

    private async deleteUser(): Promise<void> {
        const confirmed = confirm('⚠️ ATTENTION ⚠️\n\nVous êtes sur le point de supprimer définitivement votre compte.\n\nCette action est IRRÉVERSIBLE.\n\nÊtes-vous sûr ?');

        if (!confirmed) return;

        try {
            const response = await fetch('/api/user/profile', {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${sessionStorage.getItem('authToken')}`,
                },
            });

            if (response.ok) {
                sessionStorage.removeItem('authToken');
                sessionStorage.removeItem('user');
                sessionStorage.removeItem('profileUsername');
                alert('✅ Compte supprimé.');
                window.location.hash = 'login';
            } else {
                alert('❌ Erreur suppression.');
            }
        } catch (error) {
            console.error('Delete user error:', error);
            alert('❌ Erreur réseau.');
        }
    }

    // ===========================================
    // UI STATE MANAGEMENT
    // ===========================================

    private showState(state: string): void {
        document.querySelectorAll('[data-state]').forEach(el => {
            el.classList.add('hidden');
        });

        const stateEls = document.querySelectorAll(`[data-state="${state}"]`);
        stateEls.forEach(el => {
            el.classList.remove('hidden');
            if (state === 'main' && el.getAttribute('style')?.includes('display: flex')) {
                (el as HTMLElement).style.display = 'flex';
            }
        });
    }

    private showProfileMsg(msg: string, ok: boolean): void {
        let msgDiv = document.getElementById('profile-message');
        if (!msgDiv) {
            msgDiv = document.createElement('div');
            msgDiv.id = 'profile-message';
            msgDiv.style.marginBottom = '1rem';
            msgDiv.style.fontWeight = 'bold';
            msgDiv.style.textAlign = 'center';
            const container = document.querySelector('#profile .container');
            if (container) container.insertBefore(msgDiv, container.firstChild);
        }
        msgDiv.textContent = msg;
        msgDiv.style.color = ok ? 'var(--success, #22c55e)' : 'var(--danger, #ef4444)';
    }

    private showEditMsg(msg: string, isSuccess: boolean = false): void {
        const msgDiv = document.getElementById('edit-message');
        if (!msgDiv) return;

        if (!msg.trim()) {
            msgDiv.classList.add('hidden');
            msgDiv.textContent = '';
            return;
        }

        msgDiv.textContent = msg;
        msgDiv.style.color = isSuccess ? 'var(--success, #22c55e)' : 'var(--danger, #ef4444)';
        msgDiv.classList.remove('hidden');

        setTimeout(() => {
            if (msgDiv.textContent === msg) {
                msgDiv.classList.add('hidden');
            }
        }, isSuccess ? 5000 : 10000);
    }

    private clearEditMsg(): void {
        const msgDiv = document.getElementById('edit-message');
        if (msgDiv) {
            msgDiv.classList.add('hidden');
            msgDiv.textContent = '';
        }
    }
}

let profileManager: ProfileManager | null = null;

export function initProfile(): void {
    // Check if user is logged in
    const authToken = sessionStorage.getItem('authToken');
    if (!authToken) {
        window.location.hash = 'login';
        return;
    }

    // Always create new manager to handle different profiles correctly
    profileManager = new ProfileManager();
}