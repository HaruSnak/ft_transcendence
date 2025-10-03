// src/pages/profile.ts

export function initProfile() {
    loadProfile();

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
        showState('denied');
        return;
    }

    showState('loading');

    try {
        const response = await fetch('/api/user/profile', {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });
        console.log('Profile: /api/user/profile response status:', response.status);
        if (response.ok) {
            const data = await response.json();
            console.log('Profile: loaded user data:', data);
            populateFields(data.user);
            showState('main');
            // Check if should show edit form
            if (sessionStorage.getItem('showEditForm')) {
                sessionStorage.removeItem('showEditForm');
                showEditForm();
            }
        } else {
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

function populateFields(user: any) {
    // Update profile fields
    const nameField = document.querySelector('[data-field="name"]') as HTMLElement;
    const infoField = document.querySelector('[data-field="info"]') as HTMLElement;
    const avatarField = document.querySelector('[data-field="avatar"]') as HTMLImageElement;

    if (nameField) nameField.textContent = user.display_name || user.username;
    if (infoField) infoField.textContent = `Login: ${user.username} | Email: ${user.email}`;
    if (avatarField) {
        let avatar = user.avatar_url;
        if (!avatar || avatar === '' || avatar === 'null') {
            avatar = '/assets/default-avatar.png';
        }
        avatarField.src = avatar;
    }

    // Update edit form fields
    const editName = document.querySelector('[data-field="edit-name"]') as HTMLInputElement;
    const editEmail = document.querySelector('[data-field="edit-email"]') as HTMLInputElement;
    const editLogin = document.querySelector('[data-field="edit-login"]') as HTMLInputElement;

    if (editName) editName.value = user.display_name || user.username || '';
    if (editEmail) editEmail.value = user.email || '';
    if (editLogin) editLogin.value = user.username || '';
}

function showState(state: string) {
    // Hide all states
    document.querySelectorAll('[data-state]').forEach(el => {
        el.classList.add('hidden');
    });

    // Show selected state
    const stateEl = document.querySelector(`[data-state="${state}"]`);
    if (stateEl) {
        stateEl.classList.remove('hidden');
    }
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

async function updateProfile() {
    const token = sessionStorage.getItem('authToken');
    if (!token) return;

    const form = document.querySelector('[data-state="edit"]') as HTMLFormElement;
    const formData = new FormData(form);

    const updateData: any = {};
    if (formData.get('name')) updateData.display_name = formData.get('name');
    if (formData.get('email')) updateData.email = formData.get('email');
    if (formData.get('login')) updateData.username = formData.get('login');
    if (formData.get('password')) updateData.password = formData.get('password');

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
