// src/pages/profile/profile_loader.ts

import { User } from '../../utils/data_types';
import { OnlineFriendsWidget } from '../../components/online_friends_widget';

let onlineFriendsWidget: OnlineFriendsWidget | null = null;

export async function loadProfile(): Promise<void> {
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
                    import('../../services/socket/index.js').then(({ socketService }) => {
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

export function populateFields(user: User, isOtherUser: boolean = false) {
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
        import('./profile_match_history.js').then(({ loadMatchHistory }) => {
            loadMatchHistory();
        });
    }
}

export function showState(state: string) {
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

export function showProfileMsg(msg: string, ok: boolean) {
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