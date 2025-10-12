// src/services/api/userApi.ts

import { User, BlockedUser } from '../../utils/data_types';
import { API_BASE_URL, STORAGE_KEYS } from '../../utils/app_constants';

export class UserApiService {
    private static getAuthHeaders(): HeadersInit {
        const token = sessionStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
        return {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };
    }

    private static getAuthHeadersWithoutContentType(): HeadersInit {
        const token = sessionStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
        return {
            'Authorization': `Bearer ${token}`
        };
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
        const headers = this.getAuthHeadersWithoutContentType();

        const response = await fetch(`${API_BASE_URL}/user/unblock/${blockedUserId}`, {
            method: 'DELETE',
            headers: headers
        });

        if (!response.ok) {
            let errorMessage = 'Failed to unblock user';
            try {
                const errorData = await response.json();
                errorMessage = errorData.error || errorData.message || errorData.detail || errorMessage;
            } catch (parseError) {
                const textResponse = await response.text();
                errorMessage = textResponse || errorMessage;
            }
            throw new Error(`${errorMessage} (Status: ${response.status})`);
        }
    }
}