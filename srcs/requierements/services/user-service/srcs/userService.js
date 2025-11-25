import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import database from './database.js';

if (!process.env.JWT_SECRET) {
	console.error('FATAL ERROR: JWT_SECRET environment variable is not set!');
	process.exit(1);
}

const JWT_SECRET = process.env.JWT_SECRET;
const SALT_ROUNDS = 10;

class UserService {

	// Créer un nouvel utilisateur
	async createUser(userData) {
		const { username, email, password, display_name, avatar_url } = userData;

		const existingUser = await database.get(
			'SELECT id FROM users WHERE username = ? OR email = ? OR display_name = ?',
			[username, email]
		);

		if (existingUser) {
			throw new Error('Username/display_name or email already exists');
		}

		const password_hash = await bcrypt.hash(password, SALT_ROUNDS);
		const finalDisplayName = display_name || username;
		const finalAvatarUrl = avatar_url || '/assets/default-avatar.png';

		// Insérer l'utilisateur
		const result = await database.run(
			`INSERT INTO users (username, email, password_hash, display_name, avatar_url) 
			 VALUES (?, ?, ?, ?, ?)`,
			[username, email, password_hash, finalDisplayName, finalAvatarUrl]
		);

		return { 
			id: result.id, 
			username, 
			email, 
			display_name: finalDisplayName, 
			avatar_url: finalAvatarUrl 
		};
	}

	// Authentifier un utilisateur
	async authenticateUser(username, password) {
		const user = await database.get(
			'SELECT id, username, email, password_hash, display_name, avatar_url, has_seen_welcome FROM users WHERE username = ? OR email = ?',
			[username, username]
		);

		if (!user) {
			throw new Error('Invalid username or password');
		}

		const isValidPassword = await bcrypt.compare(password, user.password_hash);
		if (!isValidPassword) {
			throw new Error('Invalid username or password');
		}

		await database.run('UPDATE users SET is_online = 1 WHERE id = ?', [user.id]);

		const jti = randomUUID();
		const expiresIn = '24h';

		const token = jwt.sign(
			{ userId: user.id, username: user.username, jti },
			JWT_SECRET,
			{ expiresIn }
		);

		return {
			token,
			user: {
				id: user.id,
				username: user.username,
				email: user.email,
				display_name: user.display_name,
				avatar_url: user.avatar_url,
				has_seen_welcome: user.has_seen_welcome
			}
		};
	}

	// Obtenir un utilisateur par ID
	async getUserById(userId) {
		const user = await database.get(
			`SELECT id, username, email, display_name, avatar_url, is_online, has_seen_welcome, created_at,
					wins, losses
			 FROM users
			 WHERE id = ?`,
			[userId]
		);

		if (!user) {
			throw new Error('User not found');
		}

		return user;
	}

	// Obtenir un utilisateur par username
	async getUserByUsername(username) {
		const user = await database.get(
			`SELECT id, username, display_name, avatar_url, is_online, has_seen_welcome, created_at,
					wins, losses
			 FROM users
			 WHERE username = ?`,
			[username]
		);

		if (!user) {
			throw new Error('User not found');
		}

		return user;
	}

	// Mettre à jour le profil utilisateur
	async updateUser(userId, updates) {
		const { display_name, email, password, avatar_url, has_seen_welcome } = updates;

		// Check display_name uniqueness if being updated
		if (display_name !== undefined && display_name.trim() !== '') {
			const existingDisplayName = await database.get(
				'SELECT id FROM users WHERE display_name = ? AND id != ?',
				[display_name, userId]
			);
			if (existingDisplayName) {
				throw new Error('Display name already exists');
			}
		}

		let updateFields = [];
		let updateValues = [];

		if (display_name !== undefined) {
			updateFields.push('display_name = ?');
			updateValues.push(display_name);
		}

		if (email !== undefined) {
			updateFields.push('email = ?');
			updateValues.push(email);
		}

		if (password !== undefined) {
			// Hasher le nouveau mot de passe
			const password_hash = await bcrypt.hash(password, SALT_ROUNDS);
			updateFields.push('password_hash = ?');
			updateValues.push(password_hash);
		}

		if (avatar_url !== undefined) {
			updateFields.push('avatar_url = ?');
			updateValues.push(avatar_url);
		}

		if (has_seen_welcome !== undefined) {
			updateFields.push('has_seen_welcome = ?');
			updateValues.push(has_seen_welcome);
		}

		updateValues.push(userId);

		if (updateFields.length === 0) {
			return await this.getUserById(userId);
		}

		const sql = `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`;
		const result = await database.run(sql, updateValues);

		if (result.changes === 0) {
			throw new Error('User not found');
		}

		return await this.getUserById(userId);
	}

	// Supprimer un utilisateur
	async deleteUser(userId) {
		await database.run('DELETE FROM blocked_users WHERE user_id = ? OR blocked_user_id = ?', [userId, userId]);
		await database.run('DELETE FROM match_history WHERE player1_id = ? OR player2_id = ?', [userId, userId]);
		await database.run('DELETE FROM blacklisted_tokens WHERE user_id = ?', [userId]);

		const result = await database.run('DELETE FROM users WHERE id = ?', [userId]);

		if (result.changes === 0) {
			throw new Error('User not found');
		}
	}

	// Obtenir l'historique des matches d'un utilisateur
	async getUserMatchHistory(userId) {
		const matches = await database.query(
			`SELECT m.id, m.score_player1, m.score_player2, m.game_type, m.game_date,
					u1.username as player1_username, u1.display_name as player1_display_name,
					u2.username as player2_username, u2.display_name as player2_display_name,
					w.username as winner_username, w.display_name as winner_display_name
			 FROM match_history m
			 JOIN users u1 ON m.player1_id = u1.id
			 LEFT JOIN users u2 ON m.player2_id = u2.id
			 LEFT JOIN users w ON m.winner_id = w.id
			 WHERE m.player1_id = ? OR m.player2_id = ?
			 ORDER BY m.game_date DESC
			 LIMIT 50`,
			[userId, userId]
		);

		return matches;
	}

	// Ajouter un match à l'historique
	async addMatch(player1_id, player2_id, winner_id, score_player1, score_player2, game_type = 'pong') {
		const result = await database.run(
			`INSERT INTO match_history (player1_id, player2_id, winner_id, score_player1, score_player2, game_type)
			 VALUES (?, ?, ?, ?, ?, ?)`,
			[player1_id, player2_id, winner_id, score_player1, score_player2, game_type]
		);

		if (player1_id) {
			const updateQuery = winner_id === player1_id ? 
				'UPDATE users SET wins = wins + 1 WHERE id = ?' :
				'UPDATE users SET losses = losses + 1 WHERE id = ?';
			await database.run(updateQuery, [player1_id]);
		}

		if (player2_id) {
			const updateQuery = winner_id === player2_id ? 
				'UPDATE users SET wins = wins + 1 WHERE id = ?' :
				'UPDATE users SET losses = losses + 1 WHERE id = ?';
			await database.run(updateQuery, [player2_id]);
		}

		return result;
	}

	// Déconnexion (marquer comme hors ligne et blacklister le token)
	async logoutUser(userId, token) {
		await database.run('UPDATE users SET is_online = 0 WHERE id = ?', [userId]);
		
		const decoded = jwt.decode(token);
		if (decoded && decoded.jti && decoded.exp) {
			const expiresAt = new Date(decoded.exp * 1000).toISOString();
			
			await database.run(
				'INSERT OR IGNORE INTO blacklisted_tokens (token_jti, user_id, expires_at) VALUES (?, ?, ?)',
				[decoded.jti, userId, expiresAt]
			);
		}
	}

	// Vérifier un token JWT
	async verifyToken(token) {
		try {
			const decoded = jwt.verify(token, JWT_SECRET);

			if (decoded.jti) {
				const blacklisted = await database.get(
					'SELECT id FROM blacklisted_tokens WHERE token_jti = ? AND expires_at > datetime("now")',
					[decoded.jti]
				);

				if (blacklisted) {
					throw new Error('Token has been invalidated');
				}
			}

			return decoded;
		} catch (error) {
			throw new Error('Invalid token');
		}
	}

	// Obtenir les utilisateurs bloqués
	async getBlockedUsers(userId) {
		const blockedUsers = await database.query(
			`SELECT u.id, u.username, u.display_name 
			 FROM blocked_users bu
			 JOIN users u ON bu.blocked_user_id = u.id
			 WHERE bu.user_id = ?`,
			[userId]
		);
		return blockedUsers;
	}

	// Bloquer un utilisateur
	async blockUser(userId, blockedUserId) {
		if (userId === parseInt(blockedUserId)) {
			throw new Error('Cannot block yourself');
		}

		const result = await database.run(
			'INSERT OR IGNORE INTO blocked_users (user_id, blocked_user_id) VALUES (?, ?)',
			[userId, blockedUserId]
		);

		if (result.changes === 0) {
			throw new Error('User is already blocked');
		}
	}

	// Débloquer un utilisateur
	async unblockUser(userId, blockedUserId) {
		const result = await database.run(
			'DELETE FROM blocked_users WHERE user_id = ? AND blocked_user_id = ?',
			[userId, blockedUserId]
		);
		if (result.changes === 0) {
			throw new Error('User is not blocked');
		}
	}

	// Obtenir les amis
	async getFriends(userId) {
		const friends = await database.query(
			`SELECT u.id, u.username, u.display_name, u.avatar_url, u.is_online
			 FROM friends f
			 JOIN users u ON f.friend_user_id = u.id
			 WHERE f.user_id = ?`,
			[userId]
		);
		return friends;
	}

	// Ajouter un ami
	async addFriend(userId, friendUserId) {
		if (userId === parseInt(friendUserId)) {
			throw new Error('Cannot add yourself as friend');
		}

		const result = await database.run(
			'INSERT OR IGNORE INTO friends (user_id, friend_user_id) VALUES (?, ?)',
			[userId, friendUserId]
		);

		if (result.changes === 0) {
			throw new Error('User is already a friend');
		}
	}

	// Supprimer un ami
	async removeFriend(userId, friendUserId) {
		const result = await database.run(
			'DELETE FROM friends WHERE user_id = ? AND friend_user_id = ?',
			[userId, friendUserId]
		);
		if (result.changes === 0) {
			throw new Error('User is not a friend');
		}
	}
}

export default new UserService();
