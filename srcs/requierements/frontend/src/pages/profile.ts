// src/pages/profile.ts

import { User, ProfileUpdateData } from '../utils/data_types';
import { UserApiService } from '../services/api/user_api_service';
import { SecurityUtils } from '../utils/SecurityUtils';
import { OnlineFriendsWidget } from '../components/online_friends_widget';

let isDeletingUser = false;
let onlineFriendsWidget: OnlineFriendsWidget | null = null;

export function initProfile() {
    loadProfile();

    // Initialize online friends widget
    if (!onlineFriendsWidget) {
        onlineFriendsWidget = new OnlineFriendsWidget('profile-online-friends');
        console.log('✅ Online friends widget initialized');
        
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
    console.log('Profile: token in sessionStorage:', token);
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

        console.log('Profile: response status:', response.status);
        if (response.ok) {
            const data = await response.json();
            console.log('Profile: loaded user data:', data);
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
                console.error('Profile: backend error:', errorData);
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

    // Update edit form fields only for own profile
    if (!isOtherUser) {
        const editName = document.querySelector('[data-field="edit-name"]') as HTMLInputElement;
        const editEmail = document.querySelector('[data-field="edit-email"]') as HTMLInputElement;

        if (editName) editName.value = user.display_name || user.username || '';
        if (editEmail) editEmail.value = user.email || '';
    }
}

function showState(state: string) {
    console.log(`🔄 Changing state to: ${state}`);
    // Hide all states
    document.querySelectorAll('[data-state]').forEach(el => {
        el.classList.add('hidden');
        console.log(`🔄 Hidden state: ${(el as HTMLElement).getAttribute('data-state')}`);
    });

    // Show selected state
    const stateEls = document.querySelectorAll(`[data-state="${state}"]`);
    stateEls.forEach(el => {
        el.classList.remove('hidden');
        // For main state, ensure flex display
        if (state === 'main' && el.getAttribute('style')?.includes('display: flex')) {
            (el as HTMLElement).style.display = 'flex';
        }
        console.log(`🔄 Shown state: ${state}`);
    });
}

function showEditForm() {
    console.log('🔧 Opening edit form');
    showState('edit');
}

function hideEditForm() {
    console.log('🔧 Closing edit form');
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

async function updateProfile() {
    const token = sessionStorage.getItem('authToken');
    if (!token) return;

    const form = document.querySelector('[data-state="edit"]') as HTMLFormElement;
    const formData = new FormData(form);

    const displayName = formData.get('name') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    console.log('🔧 Update profile - Raw form data:', JSON.stringify({ displayName, email, password }, null, 2));

    // Sanitize inputs
    const sanitizedDisplayName = displayName ? SecurityUtils.sanitizeDisplayName(displayName) : '';
    const sanitizedEmail = email ? SecurityUtils.sanitizeText(email) : '';

    console.log('🔧 Update profile - Sanitized data:', JSON.stringify({ sanitizedDisplayName, sanitizedEmail, password }, null, 2));

    // Validate display name
    if (sanitizedDisplayName && !SecurityUtils.isValidDisplayName(sanitizedDisplayName)) {
        showProfileMsg('Display name contains invalid characters or is too long.', false);
        return;
    }

    // Get current user data to check if fields changed
    const currentUser = JSON.parse(sessionStorage.getItem('user') || '{}');
    const currentDisplayName = currentUser.display_name || currentUser.username || '';
    const currentEmail = currentUser.email || '';

    console.log('🔧 Update profile - Current user:', JSON.stringify(currentUser, null, 2));
    console.log('🔧 Update profile - Current display name:', currentDisplayName);
    console.log('🔧 Update profile - Current email:', currentEmail);

    // Check display name availability only if it changed
    if (sanitizedDisplayName && sanitizedDisplayName !== currentDisplayName) {
        try {
            const isAvailable = await UserApiService.checkDisplayNameAvailability(sanitizedDisplayName);
            if (!isAvailable) {
                showProfileMsg('This display name is already taken.', false);
                return;
            }
        } catch (error) {
            console.error('Error checking display name availability:', error);
            showProfileMsg('Display name is already taken.', false);
            return;
        }
    }

    const updateData: ProfileUpdateData = {};
    if (sanitizedDisplayName) updateData.display_name = sanitizedDisplayName;
    if (sanitizedEmail !== currentEmail) updateData.email = sanitizedEmail; // Include email if changed
    if (password) updateData.password = password;

    console.log('🔧 Update profile - Data to send:', JSON.stringify(updateData, null, 2));

    try {
        const response = await fetch('/api/user/profile', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(updateData),
        });

        console.log('🔧 Update profile - Response status:', response.status);

        if (response.ok) {
            const data = await response.json();
            console.log('🔧 Update profile - Response data:', JSON.stringify(data, null, 2));
            populateFields(data.user);
            hideEditForm();
            showProfileMsg('Profile updated successfully!', true);
            // Update sessionStorage with new user data
            sessionStorage.setItem('user', JSON.stringify(data.user));
            // Update socket with new profile
            import('../services/socket').then(({ socketService }) => {
                socketService.updateUserProfile(data.user);
            });
        } else {
            const errorText = await response.text();
            console.error('🔧 Update profile - Error response:', errorText);
            showProfileMsg('Profile update failed', false);
        }
    } catch (error) {
        console.error('Profile update error:', error);
        showProfileMsg('Profile update failed', false);
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
            showProfileMsg('Compte supprimé avec succès !', true);
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
            showProfileMsg(errorMsg, false);
        }
    } catch (error) {
        console.error('Delete user error:', error);
        showProfileMsg('Erreur réseau lors de la suppression.', false);
    } finally {
        isDeletingUser = false;
    }
}

async function uploadAvatar(file: File) {
    const token = sessionStorage.getItem('authToken');
    if (!token || !file) return;

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
        showProfileMsg('Avatar file is too large. Maximum size is 5MB.', false);
        return;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
        showProfileMsg('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.', false);
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
            showProfileMsg('Avatar uploaded successfully!', true);
        } else {
            showProfileMsg('Avatar upload failed', false);
        }
    } catch (error) {
        console.error('Avatar upload error:', error);
        showProfileMsg('Avatar upload failed', false);
    }
}
