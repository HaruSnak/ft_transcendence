import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { mkdirSync, existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class Database {
	constructor() {
		// Créer le dossier data s'il n'existe pas
		const dataDir = join(__dirname, '../data');
		if (!existsSync(dataDir)) {
			mkdirSync(dataDir, { recursive: true });
		}

		// Créer la base de données SQLite
		this.db = new sqlite3.Database(join(dataDir, 'transcendence.db'), (err) => {
			if (err) {
				console.error('Erreur lors de l\'ouverture de la base de données:', err.message);
			} else {
				console.log('Connecté à la base de données SQLite');
				this.initTables();
			}
		});
	}

	// Initialiser les tables
	initTables() {
		const tables = [
			// Table des utilisateurs
			`CREATE TABLE IF NOT EXISTS users (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				username VARCHAR(50) UNIQUE NOT NULL,
				email VARCHAR(100) UNIQUE NOT NULL,
				password_hash VARCHAR(255),
				display_name VARCHAR(50),
				avatar_url VARCHAR(255) DEFAULT '/assets/default-avatar.png',
				is_online BOOLEAN DEFAULT 0,
				is_user BOOLEAN DEFAULT 1,
				is_guest BOOLEAN DEFAULT 0,
				created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
				updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
			)`,
			
			// Table des statistiques utilisateur
			`CREATE TABLE IF NOT EXISTS user_stats (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				user_id INTEGER UNIQUE,
				wins INTEGER DEFAULT 0,
				losses INTEGER DEFAULT 0,
				games_played INTEGER DEFAULT 0,
				FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
			)`,
			
			// Table des amis
			`CREATE TABLE IF NOT EXISTS friends (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				user_id INTEGER,
				friend_id INTEGER,
				status VARCHAR(20) DEFAULT 'pending',
				created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
				FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
				FOREIGN KEY(friend_id) REFERENCES users(id) ON DELETE CASCADE,
				UNIQUE(user_id, friend_id)
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
			
			// 🆕 Table pour les matchs incluant des guests (sans contraintes FK)
			`CREATE TABLE IF NOT EXISTS game_sessions (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				player1_type VARCHAR(10) NOT NULL, -- 'user' ou 'guest'
				player1_id INTEGER,               -- NULL si guest
				player1_name VARCHAR(50),         -- Nom du guest si applicable
				player2_type VARCHAR(10) NOT NULL,
				player2_id INTEGER,
				player2_name VARCHAR(50),
				winner_type VARCHAR(10),
				winner_player INTEGER,            -- 1 ou 2
				score_player1 INTEGER DEFAULT 0,
				score_player2 INTEGER DEFAULT 0,
				game_type VARCHAR(50) DEFAULT 'pong',
				game_date DATETIME DEFAULT CURRENT_TIMESTAMP,
				session_duration INTEGER,         -- Durée en secondes
				is_tournament BOOLEAN DEFAULT 0
			)`,
			
			// Table des tokens blacklistés
			`CREATE TABLE IF NOT EXISTS blacklisted_tokens (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				token_jti VARCHAR(255) UNIQUE NOT NULL,
				user_id INTEGER,
				blacklisted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
				expires_at DATETIME NOT NULL,
				FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
			)`
		];

		tables.forEach(tableSQL => {
			this.db.run(tableSQL, (err) => {
				if (err) {
					console.error('Erreur lors de la création des tables:', err.message);
				} else {
					console.log('Table créée ou déjà existante');
				}
			});
		});
		
		// Ajouter la colonne is_guest si elle n'existe pas (migration)
		this.db.run(`ALTER TABLE users ADD COLUMN is_guest BOOLEAN DEFAULT 0`, (err) => {
			if (err && !err.message.includes('duplicate column')) {
				console.error('Erreur lors de la migration is_guest:', err.message);
			}
		});
		
		// Permettre password_hash nullable pour les guests (migration)
		// Note: SQLite ne permet pas ALTER COLUMN, donc on doit reconstruire si nécessaire
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
					console.log('Connexion à la base de données fermée');
					resolve();
				}
			});
		});
	}
}

// Instance singleton de la base de données
const database = new Database();

export default database;
