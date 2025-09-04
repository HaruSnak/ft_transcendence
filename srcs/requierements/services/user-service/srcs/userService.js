import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import database from './database.js';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-for-dev';
const SALT_ROUNDS = 10;

class UserService {
	// Créer un nouvel utilisateur
	async createUser(userData) {
		const { username, email, password, display_name } = userData;

		try {
			// Vérifier si l'utilisateur existe déjà
			const existingUser = await database.get(
				'SELECT id FROM users WHERE username = ? OR email = ?',
				[username, email]
			);

			if (existingUser) {
				throw new Error('Username or email already exists');
			}

			// Hasher le mot de passe
			const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

			// Insérer l'utilisateur
			const result = await database.run(
				`INSERT INTO users (username, email, password_hash, display_name) 
				 VALUES (?, ?, ?, ?)`,
				[username, email, password_hash, display_name || username]
			);

			// Créer les statistiques utilisateur
			await database.run(
				'INSERT INTO user_stats (user_id) VALUES (?)',
				[result.id]
			);

			return { id: result.id, username, email, display_name: display_name || username };
		} catch (error) {
			throw error;
		}
	}

	// Authentifier un utilisateur
	async authenticateUser(username, password) {
		try {
			const user = await database.get(
				'SELECT id, username, email, password_hash, display_name, avatar_url FROM users WHERE username = ? OR email = ?',
				[username, username]
			);

			if (!user) {
				throw new Error('User not found');
			}

			const isValidPassword = await bcrypt.compare(password, user.password_hash);
			if (!isValidPassword) {
				throw new Error('Invalid password');
			}

			// Mettre à jour le statut en ligne
			await database.run('UPDATE users SET is_online = 1 WHERE id = ?', [user.id]);

			// Générer un identifiant unique pour le token
			const jti = randomUUID();
			const expiresIn = '24h';
			
			// Générer un token JWT avec JTI
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
					avatar_url: user.avatar_url
				}
			};
		} catch (error) {
			throw error;
		}
	}

	// Obtenir un utilisateur par ID
	async getUserById(userId) {
		try {
			const user = await database.get(
				`SELECT u.id, u.username, u.email, u.display_name, u.avatar_url, u.is_online, u.created_at,
						s.wins, s.losses, s.games_played
				 FROM users u
				 LEFT JOIN user_stats s ON u.id = s.user_id
				 WHERE u.id = ?`,
				[userId]
			);

			if (!user) {
				throw new Error('User not found');
			}

			return user;
		} catch (error) {
			throw error;
		}
	}

	// Mettre à jour le profil utilisateur
	async updateUser(userId, updates) {
		try {
			const { display_name, avatar_url } = updates;
			
			const result = await database.run(
				`UPDATE users SET 
				 display_name = COALESCE(?, display_name),
				 avatar_url = COALESCE(?, avatar_url),
				 updated_at = CURRENT_TIMESTAMP
				 WHERE id = ?`,
				[display_name, avatar_url, userId]
			);

			if (result.changes === 0) {
				throw new Error('User not found');
			}

			return await this.getUserById(userId);
		} catch (error) {
			throw error;
		}
	}

	// Obtenir l'historique des matches d'un utilisateur
	async getUserMatchHistory(userId) {
		try {
			const matches = await database.query(
				`SELECT m.id, m.score_player1, m.score_player2, m.game_type, m.game_date,
						u1.username as player1_username, u1.display_name as player1_display_name,
						u2.username as player2_username, u2.display_name as player2_display_name,
						w.username as winner_username, w.display_name as winner_display_name
				 FROM match_history m
				 JOIN users u1 ON m.player1_id = u1.id
				 JOIN users u2 ON m.player2_id = u2.id
				 LEFT JOIN users w ON m.winner_id = w.id
				 WHERE m.player1_id = ? OR m.player2_id = ?
				 ORDER BY m.game_date DESC
				 LIMIT 50`,
				[userId, userId]
			);

			return matches;
		} catch (error) {
			throw error;
		}
	}

	// Ajouter un match à l'historique
	async addMatch(player1_id, player2_id, winner_id, score_player1, score_player2, game_type = 'pong') {
		try {
			const result = await database.run(
				`INSERT INTO match_history (player1_id, player2_id, winner_id, score_player1, score_player2, game_type)
				 VALUES (?, ?, ?, ?, ?, ?)`,
				[player1_id, player2_id, winner_id, score_player1, score_player2, game_type]
			);

			// Mettre à jour les statistiques
			await this.updateUserStats(player1_id, winner_id === player1_id);
			await this.updateUserStats(player2_id, winner_id === player2_id);

			return result;
		} catch (error) {
			throw error;
		}
	}

	// Mettre à jour les statistiques d'un utilisateur
	async updateUserStats(userId, won) {
		try {
			const update = won ? 
				'UPDATE user_stats SET wins = wins + 1, games_played = games_played + 1 WHERE user_id = ?' :
				'UPDATE user_stats SET losses = losses + 1, games_played = games_played + 1 WHERE user_id = ?';
				
			await database.run(update, [userId]);
		} catch (error) {
			throw error;
		}
	}

	// Déconnexion (marquer comme hors ligne et blacklister le token)
	async logoutUser(userId, token) {
		try {
			// Marquer l'utilisateur comme hors ligne
			await database.run('UPDATE users SET is_online = 0 WHERE id = ?', [userId]);
			
			// Décoder le token pour récupérer le JTI et l'expiration
			const decoded = jwt.decode(token);
			if (decoded && decoded.jti && decoded.exp) {
				const expiresAt = new Date(decoded.exp * 1000).toISOString();
				
				// Ajouter le token à la blacklist
				await database.run(
					'INSERT OR IGNORE INTO blacklisted_tokens (token_jti, user_id, expires_at) VALUES (?, ?, ?)',
					[decoded.jti, userId, expiresAt]
				);
			}
		} catch (error) {
			throw error;
		}
	}

	// Vérifier un token JWT
	async verifyToken(token) {
		try {
			// Décoder et vérifier le token
			const decoded = jwt.verify(token, JWT_SECRET);
			
			// Vérifier si le token est blacklisté
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

	// Nettoyer les tokens expirés de la blacklist
	async cleanupExpiredTokens() {
		try {
			await database.run('DELETE FROM blacklisted_tokens WHERE expires_at <= datetime("now")');
		} catch (error) {
			console.error('Error cleaning up expired tokens:', error);
		}
	}
}

export default new UserService();
