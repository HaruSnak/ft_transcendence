// src/pages/profile.ts

import { User, ProfileUpdateData } from '../utils/data_types';

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
        const editLogin = document.querySelector('[data-field="edit-login"]') as HTMLInputElement;

        if (editName) editName.value = user.display_name || user.username || '';
        if (editEmail) editEmail.value = user.email || '';
        if (editLogin) editLogin.value = user.username || '';
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
    const stateEl = document.querySelector(`[data-state="${state}"]`);
    if (stateEl) {
        stateEl.classList.remove('hidden');
        console.log(`🔄 Shown state: ${state}`);
    } else {
        console.log(`❌ State element not found: ${state}`);
    }
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

    const updateData: ProfileUpdateData = {};
    if (formData.get('name')) updateData.display_name = formData.get('name') as string;
    if (formData.get('email')) updateData.email = formData.get('email') as string;
    if (formData.get('login')) updateData.username = formData.get('login') as string;
    if (formData.get('password')) updateData.password = formData.get('password') as string;

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
            hideEditForm();
            showProfileMsg('Profile updated successfully!', true);
            // Update sessionStorage with new user data
            sessionStorage.setItem('user', JSON.stringify(data.user));
            // Update socket with new profile
            import('../services/socket').then(({ socketService }) => {
                socketService.updateUserProfile(data.user);
            });
        } else {
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
