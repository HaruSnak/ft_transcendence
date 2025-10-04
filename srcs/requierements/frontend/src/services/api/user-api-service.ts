// src/services/api/userApi.ts

import { User, BlockedUser } from '../../utils/data-types';
import { API_BASE_URL, STORAGE_KEYS } from '../../utils/app-constants';

export class UserApiService {
    private static getAuthHeaders(): HeadersInit {
        const token = sessionStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
        return {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };
    }

    static async getUserProfile(): Promise<User> {
        const response = await fetch(`${API_BASE_URL}/user/profile`, {
            headers: this.getAuthHeaders()
        });

        if (!response.ok) {
            throw new Error('Failed to fetch user profile');
        }

        const data = await response.json();
        return data.user;
    }

    static async getUserByUsername(username: string): Promise<User> {
        const response = await fetch(`${API_BASE_URL}/user/by-username/${username}`, {
            headers: this.getAuthHeaders()
        });

        if (!response.ok) {
            throw new Error('Failed to fetch user by username');
        }

        const data = await response.json();
        return data.user;
    }

    static async getBlockedUsers(): Promise<BlockedUser[]> {
        const response = await fetch(`${API_BASE_URL}/user/blocked`, {
            headers: this.getAuthHeaders()
        });

        if (!response.ok) {
            throw new Error('Failed to fetch blocked users');
        }

        const data = await response.json();
        return data.success ? data.blocked_users : [];
    }

    static async blockUser(blockedUserId: number): Promise<void> {
        const response = await fetch(`${API_BASE_URL}/user/block`, {
            method: 'POST',
            headers: this.getAuthHeaders(),
            body: JSON.stringify({ blocked_user_id: blockedUserId })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to block user');
        }
    }

    static async unblockUser(blockedUserId: number): Promise<void> {
        const response = await fetch(`${API_BASE_URL}/user/unblock/${blockedUserId}`, {
            method: 'DELETE',
            headers: this.getAuthHeaders()
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to unblock user');
        }
    }

    static async updateProfile(updates: Partial<User>): Promise<User> {
        const response = await fetch(`${API_BASE_URL}/user/profile`, {
            method: 'PUT',
            headers: this.getAuthHeaders(),
            body: JSON.stringify(updates)
        });

        if (!response.ok) {
            throw new Error('Failed to update profile');
        }

        const data = await response.json();
        return data.user;
    }

    static async logout(): Promise<void> {
        const token = sessionStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
        if (token) {
            await fetch(`${API_BASE_URL}/auth/logout`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
        }
    }
}