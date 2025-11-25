import sqlite3 from 'sqlite3';
import { mkdirSync } from 'fs';

const DB_PATH = '/srcs/data/transcendence.db';
const DB_DIR = '/srcs/data';

class Database {
	constructor() {
		mkdirSync(DB_DIR, { recursive: true });
		this.db = new sqlite3.Database(DB_PATH, this.onConnect.bind(this));
	}

	onConnect(err) {
		if (err) {
			console.error('Database connection failed:', err.message);
			process.exit(1);
		}
		console.log('Connected to SQLite database');
		this.initTables();
	}

	initTables() {
		const tables = [
			// Table des utilisateurs
			`CREATE TABLE IF NOT EXISTS users (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				username VARCHAR(50) UNIQUE NOT NULL,
				email VARCHAR(100) UNIQUE NOT NULL,
				password_hash VARCHAR(255) NOT NULL,
				display_name VARCHAR(50) UNIQUE NOT NULL,
				avatar_url VARCHAR(255) DEFAULT '/assets/default-avatar.png',
				is_online BOOLEAN DEFAULT 0,
				has_seen_welcome BOOLEAN DEFAULT 0,
				wins INTEGER DEFAULT 0,
				losses INTEGER DEFAULT 0,
				created_at DATETIME DEFAULT CURRENT_TIMESTAMP
			)`,

			// Table de l'historique des matches
			`CREATE TABLE IF NOT EXISTS match_history (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				player1_id INTEGER,
				player2_id INTEGER,
				winner_id INTEGER,
				score_player1 INTEGER DEFAULT 0,
				score_player2 INTEGER DEFAULT 0,
				game_type VARCHAR(50) DEFAULT 'pong',
				game_date DATETIME DEFAULT CURRENT_TIMESTAMP,
				FOREIGN KEY(player1_id) REFERENCES users(id) ON DELETE CASCADE,
				FOREIGN KEY(player2_id) REFERENCES users(id) ON DELETE CASCADE,
				FOREIGN KEY(winner_id) REFERENCES users(id) ON DELETE CASCADE
			)`,

			// Table des tokens blacklistés
			`CREATE TABLE IF NOT EXISTS blacklisted_tokens (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				token_jti VARCHAR(255) UNIQUE NOT NULL,
				user_id INTEGER,
				blacklisted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
				expires_at DATETIME NOT NULL,
				FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
			)`,

			// Table des utilisateurs bloqués
			`CREATE TABLE IF NOT EXISTS blocked_users (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				user_id INTEGER NOT NULL,
				blocked_user_id INTEGER NOT NULL,
				created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
				FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
				FOREIGN KEY(blocked_user_id) REFERENCES users(id) ON DELETE CASCADE,
				UNIQUE(user_id, blocked_user_id)
			)`,

			// Table des amis
			`CREATE TABLE IF NOT EXISTS friends (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				user_id INTEGER NOT NULL,
				friend_user_id INTEGER NOT NULL,
				created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
				FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
				FOREIGN KEY(friend_user_id) REFERENCES users(id) ON DELETE CASCADE,
				UNIQUE(user_id, friend_user_id)
			)`
		];

		let tablesCreated = 0;
		const totalTables = tables.length;

		tables.forEach(tableSQL => {
			this.db.run(tableSQL, (err) => {
				if (err) {
					console.error('Error creating tables:', err.message);
				}

				tablesCreated++;
				if (tablesCreated === totalTables) {
					console.log('Database tables initialized');
					this.createIndexes();
				}
			});
		});
	}

	createIndexes() {
		const indexes = [
			`CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)`,
			`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`,
			`CREATE INDEX IF NOT EXISTS idx_blacklist_jti ON blacklisted_tokens(token_jti)`,
			`CREATE INDEX IF NOT EXISTS idx_blacklist_expires ON blacklisted_tokens(expires_at)`,
			`CREATE INDEX IF NOT EXISTS idx_match_player1 ON match_history(player1_id)`,
			`CREATE INDEX IF NOT EXISTS idx_match_player2 ON match_history(player2_id)`
		];

		let indexesCreated = 0;
		indexes.forEach(indexSQL => {
			this.db.run(indexSQL, (err) => {
				if (err) {
					console.error('Error creating indexes:', err.message);
				}
				indexesCreated++;
				if (indexesCreated === indexes.length) {
					console.log('Database indexes created');
				}
			});
		});
	}

	// Méthode pour exécuter des requêtes SELECT
	query(sql, params = []) {
		return new Promise((resolve, reject) => {
			this.db.all(sql, params, (err, rows) => {
				if (err) {
					reject(err);
				} else {
					resolve(rows);
				}
			});
		});
	}

	// Méthode pour exécuter des requêtes INSERT/UPDATE/DELETE
	run(sql, params = []) {
		return new Promise((resolve, reject) => {
			this.db.run(sql, params, function(err) {
				if (err) {
					reject(err);
				} else {
					resolve({ id: this.lastID, changes: this.changes });
				}
			});
		});
	}

	// Méthode pour obtenir une seule ligne
	get(sql, params = []) {
		return new Promise((resolve, reject) => {
			this.db.get(sql, params, (err, row) => {
				if (err) {
					reject(err);
				} else {
					resolve(row);
				}
			});
		});
	}

	// Fermer la connexion
	close() {
		return new Promise((resolve, reject) => {
			this.db.close((err) => {
				if (err) {
					reject(err);
				} else {
					resolve();
				}
			});
		});
	}
}

// Instance singleton de la base de données
const database = new Database();

export default database;
