// src/pages/profile.ts

import { User, ProfileUpdateData, Match } from '../utils/data_types';
import { UserApiService } from '../services/api/user_api_service';
import { SecurityUtils } from '../utils/SecurityUtils';
import { OnlineFriendsWidget } from '../components/online_friends_widget';

let isDeletingUser = false;
let onlineFriendsWidget: OnlineFriendsWidget | null = null;

export function initProfile() {
    loadProfile();

    window.addEventListener('openProfileEdit', () => {
        showEditForm();
    });

    // Handle profile actions
    document.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        const action = target.getAttribute('data-action');

        if (action === 'login') {
            window.location.hash = 'login';
        } else if (action === 'logout') {
            logout();
        } else if (action === 'edit') {
            showEditForm();
        } else if (action === 'cancel') {
            hideEditForm();
        } else if (action === 'delete') {
            deleteUser();
        }
    });

    // Handle avatar upload
    document.addEventListener('change', (e) => {
        const target = e.target as HTMLInputElement;
        if (target.matches('[data-field="edit-avatar"]')) {
            uploadAvatar(target.files[0]);
        }
    });

    // Handle edit form submission
    const editForm = document.querySelector('[data-state="edit"]') as HTMLFormElement;
    if (editForm) {
        editForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await updateProfile();
        });
    }
}

async function loadProfile() {
    const token = sessionStorage.getItem('authToken');
    if (!token) {
        // Redirige vers la page de login si pas de token
        window.location.hash = 'login';
        return;
    }

    showState('loading');

    // Check if viewing another user's profile
    const profileUsername = sessionStorage.getItem('profileUsername');
    // Clear it immediately to avoid issues
    sessionStorage.removeItem('profileUsername');

    try {
        let response;
        if (profileUsername) {
            // Load another user's profile
            response = await fetch(`/api/user/by-username/${profileUsername}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
        } else {
            // Load own profile
            response = await fetch('/api/user/profile', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
        }

        if (response.ok) {
            const data = await response.json();
            populateFields(data.user, !!profileUsername);
            showState('main');
            // No auto edit form logic here!
            // Hide edit button for other users' profiles
            if (profileUsername) {
                const editBtn = document.querySelector('[data-action="edit"]');
                if (editBtn) (editBtn as HTMLElement).style.display = 'none';
                // Also hide logout button for other users' profiles
                const logoutBtn = document.querySelector('[data-action="logout"]');
                if (logoutBtn) (logoutBtn as HTMLElement).style.display = 'none';
            } else {
                // Show buttons for own profile
                const editBtn = document.querySelector('[data-action="edit"]');
                if (editBtn) (editBtn as HTMLElement).style.display = '';
                const logoutBtn = document.querySelector('[data-action="logout"]');
                if (logoutBtn) (logoutBtn as HTMLElement).style.display = '';
                
                // Initialize online friends widget for own profile
                if (!onlineFriendsWidget) {
                    onlineFriendsWidget = new OnlineFriendsWidget('profile-online-friends');
                    
                    // Get online users from socket service if available
                    import('../services/socket/index.js').then(({ socketService }) => {
                        const onlineUsers = socketService.getOnlineUsers();
                        if (onlineUsers && onlineUsers.length > 0) {
                            onlineFriendsWidget?.updateOnlineUsers(onlineUsers);
                        }
                    }).catch(err => {
                        console.log('⚠️ Socket service not available yet:', err);
                    });
                }
            }
        } else {
            // Si 403, on nettoie le token et on affiche un message
            if (response.status === 403) {
                sessionStorage.removeItem('authToken');
                sessionStorage.removeItem('user');
                showProfileMsg('Session expirée ou non autorisée. Merci de vous reconnecter.', false);
            }
            let errorMsg = 'Unknown error';
            try {
                const errorData = await response.json();
                errorMsg = errorData.error || JSON.stringify(errorData);
            } catch (e) {
                console.error('Profile: error parsing backend error:', e);
            }
            showState('denied');
        }
    } catch (error) {
        console.error('Profile load error:', error);
        showState('denied');
    }
}

function populateFields(user: User, isOtherUser: boolean = false) {
    // Update profile fields
    const nameField = document.querySelector('[data-field="name"]') as HTMLElement;
    const infoField = document.querySelector('[data-field="info"]') as HTMLElement;
    const avatarField = document.querySelector('[data-field="avatar"]') as HTMLImageElement;

    if (nameField) nameField.textContent = user.display_name || user.username;
    if (infoField) {
        if (isOtherUser) {
            // Hide sensitive information for other users' profiles
            infoField.style.display = 'none';
        } else {
            infoField.style.display = ''; // Show for own profile
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

    // Update stats if available
    if (!isOtherUser) {
        const winsElements = document.querySelectorAll('.text-2xl.font-bold.mb-sm');
        const winsElement = winsElements[0] as HTMLElement;
        const lossesElement = winsElements[1] as HTMLElement;

        if (winsElement) winsElement.textContent = (user.wins || 0).toString();
        if (lossesElement) lossesElement.textContent = (user.losses || 0).toString();
    }

    // Hide or show friends list
    const friendsContainer = document.getElementById('profile-online-friends');
    if (friendsContainer) {
        friendsContainer.style.display = isOtherUser ? 'none' : '';
    }

    // Hide or show the entire friends sidebar
    const sidebar = document.querySelector('#profile .chat-sidebar') as HTMLElement;
    if (sidebar) {
        sidebar.style.display = isOtherUser ? 'none' : '';
    }

    // Update edit form fields only for own profile
    if (!isOtherUser) {
        const editName = document.querySelector('[data-field="edit-name"]') as HTMLInputElement;
        const editEmail = document.querySelector('[data-field="edit-email"]') as HTMLInputElement;

        if (editName) editName.value = user.display_name || user.username || '';
        if (editEmail) editEmail.value = user.email || '';
    }

    // Load match history for own profile
    if (!isOtherUser) {
        loadMatchHistory();
    }
}

function showState(state: string) {
    // Hide all states
    document.querySelectorAll('[data-state]').forEach(el => {
        el.classList.add('hidden');
    });

    // Show selected state
    const stateEls = document.querySelectorAll(`[data-state="${state}"]`);
    stateEls.forEach(el => {
        el.classList.remove('hidden');
        // For main state, ensure flex display
        if (state === 'main' && el.getAttribute('style')?.includes('display: flex')) {
            (el as HTMLElement).style.display = 'flex';
        }
    });
}

function showEditForm() {
    showState('edit');
}

function hideEditForm() {
    showState('main');
}

function showProfileMsg(msg: string, ok: boolean) {
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

function showEditMsg(msg: string, ok: boolean) {
    const msgDiv = document.getElementById('edit-message');
    if (msgDiv) {
        msgDiv.textContent = msg;
        msgDiv.style.color = ok ? 'var(--success, #22c55e)' : 'var(--danger, #ef4444)';
        msgDiv.classList.remove('hidden');
        
        // Hide after 3 seconds
        setTimeout(() => {
            msgDiv.classList.add('hidden');
        }, 3000);
    }
}

async function updateProfile() {
    const token = sessionStorage.getItem('authToken');
    if (!token) return;

    const form = document.querySelector('[data-state="edit"]') as HTMLFormElement;
    const formData = new FormData(form);

    const displayName = formData.get('name') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    // Sanitize inputs
    let sanitizedDisplayName = displayName ? SecurityUtils.sanitizeDisplayName(displayName) : '';
    const sanitizedEmail = email ? SecurityUtils.sanitizeText(email) : '';

    // Validate display name
    if (sanitizedDisplayName) {
        const error = SecurityUtils.validateDisplayName(sanitizedDisplayName);
        if (error) {
            showEditMsg(error, false);
            return;
        }
        sanitizedDisplayName = sanitizedDisplayName.trim();
    }

    // Get current user data to check if fields changed
    const currentUser = JSON.parse(sessionStorage.getItem('user') || '{}');
    const currentDisplayName = currentUser.display_name || currentUser.username || '';
    const currentEmail = currentUser.email || '';

    // Check display name availability only if it changed
    if (sanitizedDisplayName && sanitizedDisplayName !== currentDisplayName) {
        try {
            const isAvailable = await UserApiService.checkDisplayNameAvailability(sanitizedDisplayName);
            if (!isAvailable) {
                showEditMsg('Username taken', false);
                return;
            }
        } catch (error) {
            console.error('Error checking display name availability:', error);
            showEditMsg('Check error', false);
            return;
        }
    }

    // Check email availability only if it changed
    if (sanitizedEmail && sanitizedEmail !== currentEmail) {
        try {
            const isAvailable = await UserApiService.checkEmailAvailability(sanitizedEmail);
            if (!isAvailable) {
                showEditMsg('Email taken', false);
                return;
            }
        } catch (error) {
            console.error('Error checking email availability:', error);
            showEditMsg('Email check error', false);
            return;
        }
    }

    const updateData: ProfileUpdateData = {};
    if (sanitizedDisplayName) updateData.display_name = sanitizedDisplayName;
    if (sanitizedEmail !== currentEmail) updateData.email = sanitizedEmail; // Include email if changed
    if (password) updateData.password = password;

    try {
        const response = await fetch('/api/user/profile', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(updateData),
        });

        if (response.ok) {
            const data = await response.json();
            populateFields(data.user);
            showEditMsg('Profile updated successfully!', true);
            // Update sessionStorage with new user data
            sessionStorage.setItem('user', JSON.stringify(data.user));
            // Update socket with new profile
            import('../services/socket').then(({ socketService }) => {
                socketService.updateUserProfile(data.user);
            });
        } else {
            const errorText = await response.text();
            console.error('Profile update error:', errorText);
            showEditMsg('Profile update failed', false);
        }
    } catch (error) {
        console.error('Profile update error:', error);
        showEditMsg('Profile update failed', false);
    }
}

async function logout() {
    const token = sessionStorage.getItem('authToken');
    if (token) {
        try {
            await fetch('/api/auth/logout', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
        } catch (error) {
            console.error('Logout API error:', error);
        }
    }
    sessionStorage.removeItem('authToken');
    sessionStorage.removeItem('user');
    // Show login tab
    const loginLink = document.querySelector('.nav-links [data-page="login"]') as HTMLElement;
    if (loginLink) loginLink.style.display = '';
    showProfileMsg('Logged out successfully!', true);
    setTimeout(() => {
        window.location.hash = 'login';
        location.reload();
    }, 800);
}

async function deleteUser() {
    const token = sessionStorage.getItem('authToken');
    if (!token) return;

    // Éviter les appels multiples
    if (isDeletingUser) return;
    isDeletingUser = true;

    // Demander confirmation
    if (!confirm('Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible.')) {
        isDeletingUser = false;
        return;
    }

    try {
        const response = await fetch('/api/user/profile', {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (response.ok) {
            showEditMsg('Compte supprimé avec succès !', true);
            // Nettoyer et rediriger
            sessionStorage.removeItem('authToken');
            sessionStorage.removeItem('user');
            setTimeout(() => {
                window.location.hash = 'login';
                location.reload();
            }, 1000);
        } else {
            let errorMsg = 'Erreur lors de la suppression.';
            try {
                const errorData = await response.json();
                errorMsg = errorData.error || errorMsg;
            } catch (e) {}
            showEditMsg(errorMsg, false);
        }
    } catch (error) {
        console.error('Delete user error:', error);
        showEditMsg('Erreur réseau lors de la suppression.', false);
    } finally {
        isDeletingUser = false;
    }
}

async function loadMatchHistory() {
    try {
        const matches = await UserApiService.getMatchHistory();
        displayMatchHistory(matches);
    } catch (error) {
        console.error('Failed to load match history:', error);
        // Show default message if API fails
        const historyContainer = document.querySelector('.profile-history-scroll') as HTMLElement;
        if (historyContainer) {
            historyContainer.innerHTML = `
                <div class="text-4xl mb-md">🎮</div>
                <p class="mb-md">No matches played yet</p>
                <a href="#game-modes" class="text-primary" style="text-decoration: underline;">Start playing</a>
            `;
        }
    }
}

function displayMatchHistory(matches: Match[]) {
    const historyContainer = document.querySelector('.profile-history-scroll') as HTMLElement;
    if (!historyContainer) return;

    if (matches.length === 0) {
        historyContainer.innerHTML = `
            <div class="text-4xl mb-md">🎮</div>
            <p class="mb-md">No matches played yet</p>
            <a href="#game-modes" class="text-primary" style="text-decoration: underline;">Start playing</a>
        `;
        return;
    }

    // Create match history list
    const matchesHtml = matches.slice(0, 10).map(match => {
        const date = new Date(match.played_at).toLocaleDateString();
        const isWinner = match.winner_username === match.player1_username || match.winner_username === match.player2_username;
        const opponent = match.player1_username === match.player1_username ? 
            (match.player2_display_name || match.player2_username) : 
            (match.player1_display_name || match.player1_username);
        const result = isWinner ? 'Won' : 'Lost';
        const score = `${match.score_player1} - ${match.score_player2}`;

        return `
            <div class="flex justify-between items-center py-2 border-b border-gray-200 last:border-b-0">
                <div class="flex-1">
                    <div class="font-medium">${result} vs ${opponent}</div>
                    <div class="text-sm text-muted">${match.game_mode} • ${date}</div>
                </div>
                <div class="text-right">
                    <div class="font-bold ${isWinner ? 'text-green-600' : 'text-red-600'}">${score}</div>
                </div>
            </div>
        `;
    }).join('');

    historyContainer.innerHTML = `
        <div class="space-y-2">
            ${matchesHtml}
        </div>
        ${matches.length > 10 ? '<div class="text-center mt-4 text-sm text-muted">Showing last 10 matches</div>' : ''}
    `;
}

async function uploadAvatar(file: File) {
    const token = sessionStorage.getItem('authToken');
    if (!token || !file) return;

    // Validate file
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    
    if (file.size === 0) {
        showEditMsg('File empty', false);
        return;
    }
    
    if (file.size > maxSize) {
        showEditMsg('File too large (max 5MB)', false);
        return;
    }
    
    if (!allowedTypes.includes(file.type)) {
        showEditMsg('Unsupported format (JPEG, PNG, GIF, WebP only)', false);
        return;
    }

    const formData = new FormData();
    formData.append('avatar', file);

    try {
        const response = await fetch('/api/user/avatar', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
            body: formData,
        });

        if (response.ok) {
            const data = await response.json();
            // Update the avatar display
            const avatarField = document.querySelector('[data-field="avatar"]') as HTMLImageElement;
            if (avatarField) {
                avatarField.src = data.avatar_url;
            }
            showEditMsg('Avatar uploaded successfully!', true);
            
            // Update sessionStorage with new avatar
            const currentUser = JSON.parse(sessionStorage.getItem('user') || '{}');
            currentUser.avatar_url = data.avatar_url;
            sessionStorage.setItem('user', JSON.stringify(currentUser));
        } else {
            // Try to get error message from response
            let errorMsg = 'Upload error';
            try {
                const errorData = await response.json();
                errorMsg = errorData.error || errorMsg;
            } catch (e) {
                // If can't parse JSON, use status text
                errorMsg = `Upload error: ${response.status}`;
            }
            showEditMsg(errorMsg, false);
        }
    } catch (error) {
        console.error('Avatar upload error:', error);
        showEditMsg('Network error', false);
    }
}
