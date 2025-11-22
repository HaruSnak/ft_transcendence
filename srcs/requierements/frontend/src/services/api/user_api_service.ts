// ========================= IMPORTS =========================
// Types TypeScript et constantes pour l'API utilisateur
import { User, BlockedUser } from '../../utils/data_types';
import { API_BASE_URL, STORAGE_KEYS } from '../../utils/app_constants';

// ========================= SERVICE API UTILISATEUR =========================
// Gere toutes les interactions HTTP avec le backend (profil, amis, blocage, matchs)
export class UserApiService {

	// ========================= METHODE GENERIQUE API =========================
	// Methode generique pour tous les appels API - reduit la duplication de code
	private static async apiRequest<T = any>(
		method: 'GET' | 'POST' | 'PUT' | 'DELETE',
		endpoint: string,
		data?: any,
		includeContentType: boolean = true
	): Promise<T> {
		const headers = includeContentType ? this.getAuthHeaders() : this.getAuthHeadersWithoutContentType();

		const config: RequestInit = {
			method,
			headers
		};

		if (data && (method === 'POST' || method === 'PUT')) {
			config.body = JSON.stringify(data);
		}

		const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

		if (!response.ok) {
			let errorMessage = `API request failed: ${method} ${endpoint}`;
			try {
				const errorData = await response.json();
				errorMessage = errorData.error || errorData.message || errorData.detail || errorMessage;
			} catch (parseError) {
				const textResponse = await response.text();
				errorMessage = textResponse || errorMessage;
			}
			throw new Error(`${errorMessage} (Status: ${response.status})`);
		}

		// Pour les DELETE, pas toujours de JSON a parser
		if (method === 'DELETE' && response.status === 204) {
			return {} as T;
		}

		const result = await response.json();
		return result;
	}

	// ========================= HEADERS D'AUTHENTIFICATION =========================
	// Genere headers avec token Bearer pour l'authentification API
	private static getAuthHeaders(): HeadersInit {
		const token = sessionStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
		return {
			'Authorization': `Bearer ${token}`,
			'Content-Type': 'application/json'
		};
	}

	// Headers d'auth sans Content-Type (pour DELETE)
	private static getAuthHeadersWithoutContentType(): HeadersInit {
		const token = sessionStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
		return {
			'Authorization': `Bearer ${token}`
		};
	}

	// ========================= PROFIL UTILISATEUR =========================
	// GET /user/by-username/{username} - Recherche utilisateur par nom
	static async getUserByUsername(username: string): Promise<User> {
		const data = await this.apiRequest<{ user: User }>('GET', `/user/by-username/${username}`);
		return data.user;
	}

	// ========================= SYSTEME DE BLOCAGE =========================
	// GET /user/blocked - Liste des utilisateurs bloques
	static async getBlockedUsers(): Promise<BlockedUser[]> {
		const data = await this.apiRequest<{ success: boolean; blocked_users?: BlockedUser[] }>('GET', '/user/blocked');
		return data.success ? data.blocked_users || [] : [];
	}

	// POST /user/block - Bloque un utilisateur
	static async blockUser(blockedUserId: number): Promise<void> {
		await this.apiRequest('POST', '/user/block', { blocked_user_id: blockedUserId });
	}

	// DELETE /user/unblock/{id} - Debloque un utilisateur
	static async unblockUser(blockedUserId: number): Promise<void> {
		await this.apiRequest('DELETE', `/user/unblock/${blockedUserId}`, undefined, false);
	}

	// ========================= GESTION PROFIL =========================
	// PUT /user/profile - Met a jour le profil utilisateur
	static async updateProfile(updates: Partial<User>): Promise<User> {
		const data = await this.apiRequest<{ user: User }>('PUT', '/user/profile', updates);
		return data.user;
	}

	// ========================= AUTHENTIFICATION =========================
	// POST /auth/logout - Deconnecte l'utilisateur
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