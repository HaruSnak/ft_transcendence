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
        console.log(`🔓 API call: unblock user ID ${blockedUserId}`);

        const headers = this.getAuthHeadersWithoutContentType();
        console.log('🔓 Request headers:', {
            'Authorization': headers['Authorization'] ? 'Bearer [TOKEN]' : 'MISSING'
        });

        const response = await fetch(`${API_BASE_URL}/user/unblock/${blockedUserId}`, {
            method: 'DELETE',
            headers: headers
        });

        console.log(`🔓 API response status: ${response.status}`);
        console.log(`🔓 API response ok: ${response.ok}`);

        if (!response.ok) {
            let errorMessage = 'Failed to unblock user';
            try {
                const errorData = await response.json();
                console.error('🔓 API error response (full):', JSON.stringify(errorData, null, 2));
                console.error('🔓 API error response (object):', errorData);
                errorMessage = errorData.error || errorData.message || errorData.detail || errorMessage;
            } catch (parseError) {
                console.error('🔓 Could not parse error response:', parseError);
                const textResponse = await response.text();
                console.error('🔓 Raw error response text:', textResponse);
                errorMessage = textResponse || errorMessage;
            }
            throw new Error(`${errorMessage} (Status: ${response.status})`);
        }

        console.log('🔓 User successfully unblocked via API');
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

    static async checkDisplayNameAvailability(displayName: string): Promise<boolean> {
        const response = await fetch(`${API_BASE_URL}/user/check-display-name`, {
            method: 'POST',
            headers: this.getAuthHeaders(),
            body: JSON.stringify({ display_name: displayName })
        });

        if (!response.ok) {
            throw new Error('Failed to check display name availability');
        }

        const data = await response.json();
        return data.available;
    }

    static async getFriends(): Promise<User[]> {
        const response = await fetch(`${API_BASE_URL}/user/friends`, {
            headers: this.getAuthHeaders()
        });

        if (!response.ok) {
            throw new Error('Failed to fetch friends');
        }

        const data = await response.json();
        return data.friends || [];
    }

    static async sendFriendRequest(friendId: number): Promise<void> {
        const response = await fetch(`${API_BASE_URL}/user/friend-request`, {
            method: 'POST',
            headers: this.getAuthHeaders(),
            body: JSON.stringify({ friend_id: friendId })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to send friend request');
        }
    }

    static async acceptFriendRequest(requestId: number): Promise<void> {
        const response = await fetch(`${API_BASE_URL}/user/friend-request/${requestId}/accept`, {
            method: 'PUT',
            headers: this.getAuthHeaders()
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to accept friend request');
        }
    }

    static async declineFriendRequest(requestId: number): Promise<void> {
        const response = await fetch(`${API_BASE_URL}/user/friend-request/${requestId}/decline`, {
            method: 'PUT',
            headers: this.getAuthHeaders()
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to decline friend request');
        }
    }

    static async removeFriend(friendId: number): Promise<void> {
        const response = await fetch(`${API_BASE_URL}/user/friend/${friendId}`, {
            method: 'DELETE',
            headers: this.getAuthHeaders()
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to remove friend');
        }
    }
}