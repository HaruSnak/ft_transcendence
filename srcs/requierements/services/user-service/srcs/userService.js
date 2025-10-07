import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import database from './database.js';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-for-dev';
const SALT_ROUNDS = 10;

class UserService {
	// Créer un nouvel utilisateur
	async createUser(userData) {
		const { username, email, password, display_name, avatar_url } = userData;

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

			// Insérer l'utilisateur avec avatar_url
			const result = await database.run(
				`INSERT INTO users (username, email, password_hash, display_name, avatar_url) 
				 VALUES (?, ?, ?, ?, ?)`,
				[username, email, password_hash, display_name || username, avatar_url || '/assets/default-avatar.png']
			);

			// Créer les statistiques utilisateur
			await database.run(
				'INSERT INTO user_stats (user_id) VALUES (?)',
				[result.id]
			);

			return { id: result.id, username, email, display_name: display_name || username, avatar_url: avatar_url || '/assets/default-avatar.png' };
		} catch (error) {
			throw error;
		}
	}

	// Créer un utilisateur guest temporaire
	async createGuestUser(guestName = null) {
		try {
			const timestamp = Date.now();
			const randomSuffix = Math.random().toString(36).substr(2, 5);
			const guestUsername = guestName || `Guest_${timestamp}_${randomSuffix}`;
			const guestEmail = `${guestUsername}@guest.local`;

			// Insérer l'utilisateur guest (sans mot de passe)
			const result = await database.run(
				`INSERT INTO users (username, email, display_name, is_guest) 
				 VALUES (?, ?, ?, 1)`,
				[guestUsername, guestEmail, guestName || guestUsername]
			);

			// Créer les statistiques utilisateur
			await database.run(
				'INSERT INTO user_stats (user_id) VALUES (?)',
				[result.id]
			);

			return { 
				id: result.id, 
				username: guestUsername, 
				display_name: guestName || guestUsername,
				is_guest: true 
			};
		} catch (error) {
			throw error;
		}
	}

	// Authentifier un utilisateur
	async authenticateUser(username, password) {
		try {
			const user = await database.get(
				'SELECT id, username, email, password_hash, display_name, avatar_url, has_seen_welcome FROM users WHERE username = ? OR email = ?',
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
					avatar_url: user.avatar_url,
					has_seen_welcome: user.has_seen_welcome
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
				`SELECT u.id, u.username, u.email, u.display_name, u.avatar_url, u.is_online, u.has_seen_welcome, u.created_at,
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

	// Obtenir un utilisateur par username
	async getUserByUsername(username) {
		try {
			const user = await database.get(
				`SELECT u.id, u.username, u.display_name, u.avatar_url, u.is_online, u.has_seen_welcome, u.created_at,
						s.wins, s.losses, s.games_played
				 FROM users u
				 LEFT JOIN user_stats s ON u.id = s.user_id
				 WHERE u.username = ?`,
				[username]
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
			const { display_name, avatar_url, has_seen_welcome } = updates;
			
			const result = await database.run(
				`UPDATE users SET 
				 display_name = COALESCE(?, display_name),
				 avatar_url = COALESCE(?, avatar_url),
				 has_seen_welcome = COALESCE(?, has_seen_welcome),
				 updated_at = CURRENT_TIMESTAMP
				 WHERE id = ?`,
				[display_name, avatar_url, has_seen_welcome, userId]
			);

			if (result.changes === 0) {
				throw new Error('User not found');
			}

			return await this.getUserById(userId);
		} catch (error) {
			throw error;
		}
	}

	// Supprimer un utilisateur
	async deleteUser(userId) {
		try {
			// Supprimer d'abord les dépendances
			await database.run('DELETE FROM blocked_users WHERE user_id = ? OR blocked_user_id = ?', [userId, userId]);
			await database.run('DELETE FROM user_stats WHERE user_id = ?', [userId]);
			await database.run('DELETE FROM match_history WHERE player1_id = ? OR player2_id = ?', [userId, userId]);
			await database.run('DELETE FROM game_invitations WHERE from_user_id = ? OR to_user_id = ?', [userId, userId]);
			await database.run('DELETE FROM blacklisted_tokens WHERE user_id = ?', [userId]);
			
			// Supprimer l'utilisateur
			const result = await database.run('DELETE FROM users WHERE id = ?', [userId]);
			
			if (result.changes === 0) {
				throw new Error('User not found');
			}
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

	// 🆕 Ajouter une session de jeu (users + guests)
	async addGameSession(gameData) {
		try {
			const {
				player1_id, player1_name, player1_type = 'guest',
				player2_id, player2_name, player2_type = 'guest', 
				winner_player, // 1 ou 2
				score_player1 = 0, score_player2 = 0,
				game_type = 'pong', session_duration = null
			} = gameData;

			// Déterminer les types automatiquement si des IDs sont fournis
			const finalPlayer1Type = player1_id ? 'user' : 'guest';
			const finalPlayer2Type = player2_id ? 'user' : 'guest';
			const winnerType = winner_player === 1 ? finalPlayer1Type : finalPlayer2Type;

			const result = await database.run(
				`INSERT INTO game_sessions 
				 (player1_type, player1_id, player1_name, player2_type, player2_id, player2_name,
				  winner_type, winner_player, score_player1, score_player2, game_type, session_duration)
				 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
				[
					finalPlayer1Type, player1_id, player1_name,
					finalPlayer2Type, player2_id, player2_name,
					winnerType, winner_player,
					score_player1, score_player2, game_type, session_duration
				]
			);

			// Mettre à jour les stats UNIQUEMENT pour les vrais utilisateurs
			if (finalPlayer1Type === 'user') {
				await this.updateUserStats(player1_id, winner_player === 1);
			}
			if (finalPlayer2Type === 'user') {
				await this.updateUserStats(player2_id, winner_player === 2);
			}

			return result;
		} catch (error) {
			throw error;
		}
	}

	// 🆕 Obtenir l'historique des sessions (incluant guests)
	async getUserGameSessions(userId) {
		try {
			const sessions = await database.query(
				`SELECT gs.*, 
						u1.username as player1_username, u1.display_name as player1_display_name,
						u2.username as player2_username, u2.display_name as player2_display_name
				 FROM game_sessions gs
				 LEFT JOIN users u1 ON gs.player1_id = u1.id AND gs.player1_type = 'user'
				 LEFT JOIN users u2 ON gs.player2_id = u2.id AND gs.player2_type = 'user'
				 WHERE (gs.player1_id = ? AND gs.player1_type = 'user') 
				    OR (gs.player2_id = ? AND gs.player2_type = 'user')
				 ORDER BY gs.game_date DESC
				 LIMIT 50`,
				[userId, userId]
			);

			// Formater les résultats pour être plus lisibles
			return sessions.map(session => ({
				id: session.id,
				player1: {
					type: session.player1_type,
					name: session.player1_type === 'user' 
						? (session.player1_display_name || session.player1_username)
						: session.player1_name,
					id: session.player1_id
				},
				player2: {
					type: session.player2_type,
					name: session.player2_type === 'user'
						? (session.player2_display_name || session.player2_username)
						: session.player2_name,
					id: session.player2_id
				},
				winner: session.winner_player,
				scores: {
					player1: session.score_player1,
					player2: session.score_player2
				},
				game_type: session.game_type,
				game_date: session.game_date,
				duration: session.session_duration
			}));
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
	
	// ========== BLOCKED USERS ==========
	
	// Obtenir les utilisateurs bloqués
	async getBlockedUsers(userId) {
		try {
			const blockedUsers = await database.query(
				`SELECT u.id, u.username, u.display_name 
				 FROM blocked_users bu
				 JOIN users u ON bu.blocked_user_id = u.id
				 WHERE bu.user_id = ?`,
				[userId]
			);
			return blockedUsers;
		} catch (error) {
			throw error;
		}
	}

	// Bloquer un utilisateur
	async blockUser(userId, blockedUserId) {
		if (userId === parseInt(blockedUserId)) {
			throw new Error('Cannot block yourself');
		}
		
		try {
			await database.run(
				'INSERT INTO blocked_users (user_id, blocked_user_id) VALUES (?, ?)',
				[userId, blockedUserId]
			);
		} catch (error) {
			if (error.message.includes('UNIQUE constraint failed')) {
				throw new Error('User is already blocked');
			}
			throw error;
		}
	}

	// Débloquer un utilisateur
	async unblockUser(userId, blockedUserId) {
		try {
			const result = await database.run(
				'DELETE FROM blocked_users WHERE user_id = ? AND blocked_user_id = ?',
				[userId, blockedUserId]
			);
			if (result.changes === 0) {
				throw new Error('User is not blocked');
			}
		} catch (error) {
			throw error;
		}
	}
	
	// ========== GAME INVITATIONS ==========
	
	// Obtenir les invitations de jeu
	async getGameInvitations(userId) {
		try {
			const invitations = await database.query(
				`SELECT gi.*, u.username as from_username, u.display_name as from_display_name
				 FROM game_invitations gi
				 JOIN users u ON gi.from_user_id = u.id
				 WHERE gi.to_user_id = ? AND gi.status = 'pending'`,
				[userId]
			);
			return invitations;
		} catch (error) {
			throw error;
		}
	}

	// Créer une invitation de jeu
	async createGameInvitation(fromUserId, toUserId, gameType = 'pong') {
		if (fromUserId === parseInt(toUserId)) {
			throw new Error('Cannot invite yourself');
		}
		
		try {
			const result = await database.run(
				'INSERT INTO game_invitations (from_user_id, to_user_id, game_type) VALUES (?, ?, ?)',
				[fromUserId, toUserId, gameType]
			);
			return { id: result.id };
		} catch (error) {
			throw error;
		}
	}

	// Répondre à une invitation
	async respondToGameInvitation(invitationId, userId, status) {
		try {
			const result = await database.run(
				'UPDATE game_invitations SET status = ? WHERE id = ? AND to_user_id = ?',
				[status, invitationId, userId]
			);
			if (result.changes === 0) {
				throw new Error('Invitation not found or not for this user');
			}
		} catch (error) {
			throw error;
		}
	}
}

export default new UserService();
