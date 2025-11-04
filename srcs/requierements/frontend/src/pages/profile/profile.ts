// src/pages/profile/profile.ts

import { User } from '../../utils/data_types';
import { SecurityUtils } from '../../utils/SecurityUtils';
import { OnlineFriendsWidget } from './online_friends_widget';
import { updateNavbar } from '../../index.js';

// Business logic: Profile operations (modifier uniquement ici pour le backend)
export async function performFetchProfile(profileUsername?: string): Promise<User> {
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

  if (!response.ok) {
    throw new Error(`Failed to fetch profile: ${response.statusText}`);
  }

  const data = await response.json();
  return data.user;
}

export async function performUpdateProfile(displayName: string, email: string, password?: string): Promise<User> {
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

  if (!response.ok) {
    throw new Error(`Failed to update profile: ${response.statusText}`);
  }

  const data = await response.json();
  return data.user;
}

export async function performUploadAvatar(file: File): Promise<{ avatar_url: string }> {
  const formData = new FormData();
  formData.append('avatar', file);

  const response = await fetch('/api/user/avatar', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${sessionStorage.getItem('authToken')}`,
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Failed to upload avatar: ${response.statusText}`);
  }

  return await response.json();
}

export async function performLogout(): Promise<void> {
  await fetch('/api/user/logout', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${sessionStorage.getItem('authToken')}`,
    },
  });
}

export async function performDeleteUser(): Promise<void> {
  const response = await fetch('/api/user/profile', {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${sessionStorage.getItem('authToken')}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to delete user: ${response.statusText}`);
  }
}

export async function performLoadMatchHistory(): Promise<any[]> {
  const response = await fetch('/api/user/matches', {
    headers: {
      'Authorization': `Bearer ${sessionStorage.getItem('authToken')}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to load match history: ${response.statusText}`);
  }

  const data = await response.json();
  return data.matches || [];
}

// Business logic END

// UI logic
export class ProfileManager {
    private onlineFriendsWidget: OnlineFriendsWidget | null = null;
    private isAuthenticated: boolean = false;

    constructor() {
        this.checkAuthentication();
    }

    // ========================= AUTHENTICATION & INITIALIZATION =========================
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

    // ========================= EVENT LISTENERS SETUP =========================
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

        // Handle openProfileEdit event from login modal
        window.addEventListener('openProfileEdit', () => {
            this.showEditForm();
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

    // ========================= PROFILE LOADING & DISPLAY =========================
    public async loadProfile(): Promise<void> {
        this.showState('loading');

        // Check if viewing another user's profile
        const profileUsername = sessionStorage.getItem('profileUsername');
        sessionStorage.removeItem('profileUsername');

        try {
            const user = await performFetchProfile(profileUsername);
            this.populateFields(user, !!profileUsername);
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

                    import('../../services/socket/index.js').then(({ socketService }) => {
                        const onlineUsers = socketService.getOnlineUsers();
                        if (onlineUsers && onlineUsers.length > 0) {
                            this.onlineFriendsWidget?.updateOnlineUsers(onlineUsers);
                        }
                    }).catch(err => {
                        console.log('⚠️ Socket service not available yet:', err);
                    });
                }
            }
        } catch (error) {
            console.error('Profile load error:', error);
            if (error.message.includes('403')) {
                sessionStorage.removeItem('authToken');
                sessionStorage.removeItem('user');
                this.showProfileMsg('Session expirée ou non autorisée. Merci de vous reconnecter.', false);
            }
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
            // Stats are now calculated from matches in loadMatchHistory

            // Update edit form fields
            const editName = document.querySelector('[data-field="edit-name"]') as HTMLInputElement;
            const editEmail = document.querySelector('[data-field="edit-email"]') as HTMLInputElement;

            if (editName) editName.value = user.display_name || user.username || '';
            if (editEmail) editEmail.value = user.email || '';

            // Load match history (which also calculates stats)
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

    // ========================= MATCH HISTORY MANAGEMENT =========================
    private async loadMatchHistory(): Promise<void> {
        try {
            const matches = await performLoadMatchHistory();
            this.displayMatchHistory(matches);
            // Also calculate stats from matches
            this.calculateStatsFromMatches(matches);
        } catch (error) {
            console.error('Error loading match history:', error);
        }
    }

    private calculateStatsFromMatches(matches: any[]): void {
        // Get current user username
        const userData = sessionStorage.getItem('user');
        if (!userData) return;
        const user = JSON.parse(userData);
        const userUsername = user.username;

        // Separate tournament and non-tournament matches
        const tournamentMatches: any[] = [];
        const otherMatches: any[] = [];

        matches.forEach((match) => {
            if ((match.game_type || '').toLowerCase().includes('tournament')) {
                tournamentMatches.push(match);
            } else {
                otherMatches.push(match);
            }
        });

        // For tournaments, sort by date descending and take only the most recent (final) match
        tournamentMatches.sort((a, b) => new Date(b.game_date).getTime() - new Date(a.game_date).getTime());
        const finalTournamentMatches = tournamentMatches.slice(0, 1); // Only the most recent

        // Combine: final tournament match + all other matches
        const matchesForStats = [...finalTournamentMatches, ...otherMatches];

        let wins = 0;
        let losses = 0;

        matchesForStats.forEach((match) => {
            let userScore: number;
            let opponentScore: number;

            if (match.player1_username === userUsername) {
                userScore = match.score_player1;
                opponentScore = match.score_player2;
            } else {
                userScore = match.score_player2;
                opponentScore = match.score_player1;
            }

            if (userScore > opponentScore) {
                wins++;
            } else {
                losses++;
            }
        });

        // Update the stats display
        const winsElements = document.querySelectorAll('.text-2xl.font-bold.mb-sm');
        const winsElement = winsElements[0] as HTMLElement;
        const lossesElement = winsElements[1] as HTMLElement;

        if (winsElement) winsElement.textContent = wins.toString();
        if (lossesElement) lossesElement.textContent = losses.toString();
    }

    private displayMatchHistory(matches: any[]): void {
        const container = document.getElementById('match-history');
        if (!container) return;

        console.log('displayMatchHistory called with', matches.length, 'matches');
        
        container.innerHTML = '';

        if (matches.length === 0) {
            container.innerHTML = '<p class="text-center text-gray-500">Aucun match joué pour le moment.</p>';
            return;
        }

        // Get current user ID and username
        const userData = sessionStorage.getItem('user');
        if (!userData) return;
        const user = JSON.parse(userData);
        const userId = user.id;
        const userUsername = user.username;

        // Separate tournament and non-tournament matches
        const tournamentMatches: any[] = [];
        const otherMatches: any[] = [];

        matches.forEach((match) => {
            if ((match.game_type || '').toLowerCase().includes('tournament')) {
                tournamentMatches.push(match);
            } else {
                otherMatches.push(match);
            }
        });

        // For tournaments, sort by date descending and take only the most recent (final) match
        tournamentMatches.sort((a, b) => new Date(b.game_date).getTime() - new Date(a.game_date).getTime());
        const finalTournamentMatches = tournamentMatches.slice(0, 1); // Only the most recent

        // Combine: final tournament match + all other matches
        const matchesToDisplay = [...finalTournamentMatches, ...otherMatches];

        matchesToDisplay.forEach((match, index) => {
            console.log(`Match ${index}:`, match);
            const matchDiv = document.createElement('div');
            matchDiv.className = 'bg-gray-800 p-4 rounded-lg mb-4';

            // Add 'Z' if missing to indicate UTC time, fixing 1-hour time difference
            const date = new Date(match.game_date + (match.game_date.includes('Z') ? '' : 'Z')).toLocaleString('fr-FR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });

            // Determine opponent and scores
            let opponent: string;
            let userScore: number;
            let opponentScore: number;

            if (match.player1_username === userUsername) {
                opponent = match.player2_username || match.player2_display_name || 'Guest';
                userScore = match.score_player1;
                opponentScore = match.score_player2;
            } else {
                opponent = match.player1_username || match.player1_display_name || 'Guest';
                userScore = match.score_player2;
                opponentScore = match.score_player1;
            }

            const isWin = userScore > opponentScore;

            const result = isWin ? 'Win' : 'Lose';
            const gameType = match.game_type || 'Unknown';
            const score = `${userScore}-${opponentScore}`;

            // SECURITY: Escape HTML to prevent XSS
            const safeResult = SecurityUtils.escapeHTML(result);
            const safeGameType = SecurityUtils.escapeHTML(gameType);
            const safeOpponent = SecurityUtils.escapeHTML(opponent);
            const safeScore = SecurityUtils.escapeHTML(score);
            const safeDate = SecurityUtils.escapeHTML(date);

            let displayText: string;
            if (gameType && gameType.toLowerCase().includes('tournament')) {
                displayText = `${safeResult} - Tournament - ${safeDate}`;
            } else {
                displayText = `${safeResult} - ${safeGameType} - ${safeOpponent} - ${safeScore} - ${safeDate}`;
            }

            matchDiv.innerHTML = `
                <div class="flex justify-between items-center">
                    <div>
                        <p class="font-semibold">${displayText}</p>
                    </div>
                </div>
            `;

            container.appendChild(matchDiv);
        });
    }

    // ========================= PROFILE EDITING =========================
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
            const user = await performUpdateProfile(displayName, email, password || undefined);
            sessionStorage.setItem('user', JSON.stringify(user));
            this.showEditMsg('Profil mis à jour avec succès!', true);
            setTimeout(() => this.loadProfile(), 1000);
        } catch (error) {
            console.error('Profile update error:', error);
            this.showEditMsg('Erreur lors de la mise à jour.', false);
        }
    }

    // ========================= AVATAR MANAGEMENT =========================
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

        try {
            const data = await performUploadAvatar(file);
            const avatarImg = document.querySelector('[data-field="avatar"]') as HTMLImageElement;
            if (avatarImg && data.avatar_url) {
                avatarImg.src = data.avatar_url;
            }
            const user = JSON.parse(sessionStorage.getItem('user') || '{}');
            user.avatar_url = data.avatar_url;
            sessionStorage.setItem('user', JSON.stringify(user));
            this.showEditMsg('Avatar mis à jour!', true);
        } catch (error) {
            console.error('Avatar upload error:', error);
            this.showEditMsg('Erreur lors du téléchargement.', false);
        }
    }

    // ========================= ACCOUNT REMOVAL =========================

    private async logout(): Promise<void> {
        try {
            await performLogout();
        } catch (error) {
            console.error('Logout error:', error);
        }

        sessionStorage.removeItem('authToken');
        sessionStorage.removeItem('user');
        sessionStorage.removeItem('profileUsername');
        // Mettre à jour la navbar après le logout
        updateNavbar();
        window.location.hash = 'login';
    }

    private async deleteUser(): Promise<void> {
        const confirmed = confirm('⚠️ ATTENTION ⚠️\n\nVous êtes sur le point de supprimer définitivement votre compte.\n\nCette action est IRRÉVERSIBLE.\n\nÊtes-vous sûr ?');

        if (!confirmed) return;

        try {
            await performDeleteUser();
            sessionStorage.removeItem('authToken');
            sessionStorage.removeItem('user');
            sessionStorage.removeItem('profileUsername');
            // Mettre à jour la navbar après suppression du compte
            updateNavbar();
            alert('✅ Compte supprimé.');
            window.location.hash = 'login';
        } catch (error) {
            console.error('Delete user error:', error);
            alert('❌ Erreur suppression.');
        }
    }

    // ========================= UI STATE MANAGEMENT =========================
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