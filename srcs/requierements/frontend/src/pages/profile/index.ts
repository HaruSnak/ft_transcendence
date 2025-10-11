// src/pages/profile/index.ts

import { ProfileManager } from './profile_manager';

let profileManager: ProfileManager | null = null;

export function initProfile(): void {
    // Check if user is logged in
    const authToken = sessionStorage.getItem('authToken');
    if (!authToken) {
        window.location.hash = 'login';
        return;
    }

    if (!profileManager) {
        profileManager = new ProfileManager();
    }
}