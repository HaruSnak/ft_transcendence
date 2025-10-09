// src/pages/profile.ts

import { User, ProfileUpdateData, Match } from '../utils/data_types';
import { UserApiService } from '../services/api/user_api_service';
import { SecurityUtils } from '../utils/SecurityUtils';
import { OnlineFriendsWidget } from '../components/online_friends_widget';
import { loadProfile, showState, showProfileMsg } from './profile/profile_loader';
import { showEditForm, hideEditForm, updateProfile, uploadAvatar } from './profile/profile_editor';
import { logout, deleteUser } from './profile/profile_utils';

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
            uploadAvatar();
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
