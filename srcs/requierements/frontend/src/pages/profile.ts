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
        } else if (action === 'delete') {
            if (confirm('Are you sure you want to delete your account?')) {
                deleteAccount();
            }
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
    const token = localStorage.getItem('token');
    if (!token) {
        showProfileState('denied');
        return;
    }

    showProfileState('loading');

    try {
        const response = await fetch('/api/user/profile', {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (response.ok) {
            const user = await response.json();
            displayProfile(user);
            showProfileState('main');
        } else {
            showProfileState('denied');
        }
    } catch (error) {
        console.error('Profile load error:', error);
        showProfileState('denied');
    }
}

function displayProfile(user: any) {
    // Update profile fields
    const nameField = document.querySelector('[data-field="name"]') as HTMLElement;
    const infoField = document.querySelector('[data-field="info"]') as HTMLElement;
    const avatarField = document.querySelector('[data-field="avatar"]') as HTMLImageElement;

    if (nameField) nameField.textContent = user.username || user.name;
    if (infoField) infoField.textContent = `Login: ${user.login || user.username} | Email: ${user.email}`;
    if (avatarField) avatarField.src = user.avatar || '/default-avatar.png';

    // Update edit form fields
    const editName = document.querySelector('[data-field="edit-name"]') as HTMLInputElement;
    const editEmail = document.querySelector('[data-field="edit-email"]') as HTMLInputElement;
    const editLogin = document.querySelector('[data-field="edit-login"]') as HTMLInputElement;

    if (editName) editName.value = user.username || user.name || '';
    if (editEmail) editEmail.value = user.email || '';
    if (editLogin) editLogin.value = user.login || user.username || '';
}

function showProfileState(state: string) {
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
    showProfileState('edit');
}

function hideEditForm() {
    showProfileState('main');
}

async function updateProfile() {
    const token = localStorage.getItem('token');
    if (!token) return;

    const form = document.querySelector('[data-state="edit"]') as HTMLFormElement;
    const formData = new FormData(form);

    const updateData: any = {};
    if (formData.get('name')) updateData.name = formData.get('name');
    if (formData.get('email')) updateData.email = formData.get('email');
    if (formData.get('login')) updateData.login = formData.get('login');
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
            const updatedUser = await response.json();
            localStorage.setItem('user', JSON.stringify(updatedUser));
            displayProfile(updatedUser);
            hideEditForm();
            alert('Profile updated successfully');
        } else {
            alert('Profile update failed');
        }
    } catch (error) {
        console.error('Profile update error:', error);
        alert('Profile update failed');
    }
}

async function deleteAccount() {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
        const response = await fetch('/api/user/profile', {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (response.ok) {
            logout();
            alert('Account deleted successfully');
        } else {
            alert('Account deletion failed');
        }
    } catch (error) {
        console.error('Account deletion error:', error);
        alert('Account deletion failed');
    }
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.hash = 'home';
}
