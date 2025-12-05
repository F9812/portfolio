const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');

class Database {
    constructor() {
        this.db = null;
        this.init();
    }
    
    init() {
        // Создаем папку для данных если её нет
        if (!fs.existsSync('./data')) {
            fs.mkdirSync('./data');
        }
        
        this.db = new sqlite3.Database('./data/energosphere.db', (err) => {
            if (err) {
                console.error('Ошибка подключения к БД:', err);
            } else {
                console.log('Подключено к SQLite базе данных');
                this.createTables();
            }
        });
    }
    
    createTables() {
        // Игроки
        this.db.run(`
            CREATE TABLE IF NOT EXISTS players (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                email TEXT,
                password_hash TEXT,
                energy REAL DEFAULT 0,
                quantum_points INTEGER DEFAULT 0,
                rebirth_count INTEGER DEFAULT 0,
                total_play_time INTEGER DEFAULT 0,
                session_time INTEGER DEFAULT 0,
                generators TEXT DEFAULT '[]',
                upgrades TEXT DEFAULT '[]',
                guild_id INTEGER,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                last_login DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (guild_id) REFERENCES guilds(id)
            )
        `);
        
        // Гильдии
        this.db.run(`
            CREATE TABLE IF NOT EXISTS guilds (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT UNIQUE NOT NULL,
                tag TEXT UNIQUE NOT NULL,
                description TEXT,
                leader_id INTEGER NOT NULL,
                level INTEGER DEFAULT 1,
                experience INTEGER DEFAULT 0,
                energy INTEGER DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (leader_id) REFERENCES players(id)
            )
        `);
        
        // Чат
        this.db.run(`
            CREATE TABLE IF NOT EXISTS chat_messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                player_id INTEGER NOT NULL,
                message TEXT NOT NULL,
                channel TEXT DEFAULT 'global',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (player_id) REFERENCES players(id)
            )
        `);
        
        // Рынок
        this.db.run(`
            CREATE TABLE IF NOT EXISTS market_items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                seller_id INTEGER NOT NULL,
                item_type TEXT NOT NULL,
                item_data TEXT NOT NULL,
                price REAL NOT NULL,
                currency TEXT DEFAULT 'energy',
                status TEXT DEFAULT 'active',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                expires_at DATETIME,
                buyer_id INTEGER,
                FOREIGN KEY (seller_id) REFERENCES players(id),
                FOREIGN KEY (buyer_id) REFERENCES players(id)
            )
        `);
        
        // Достижения
        this.db.run(`
            CREATE TABLE IF NOT EXISTS achievements (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                player_id INTEGER NOT NULL,
                achievement_id TEXT NOT NULL,
                unlocked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (player_id) REFERENCES players(id),
                UNIQUE(player_id, achievement_id)
            )
        `);
        
        console.log('Таблицы созданы/проверены');
    }
    
    // Методы для работы с игроками
    async getPlayer(username) {
        return new Promise((resolve, reject) => {
            this.db.get(
                'SELECT * FROM players WHERE username = ?',
                [username],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                }
            );
        });
    }
    
    async createPlayer(playerData) {
        return new Promise((resolve, reject) => {
            this.db.run(
                `INSERT INTO players (username, email, password_hash, energy) 
                 VALUES (?, ?, ?, ?)`,
                [playerData.username, playerData.email, playerData.passwordHash, playerData.energy || 0],
                function(err) {
                    if (err) reject(err);
                    else resolve(this.lastID);
                }
            );
        });
    }
    
    async updatePlayer(playerId, updates) {
        const fields = [];
        const values = [];
        
        for (const [key, value] of Object.entries(updates)) {
            fields.push(`${key} = ?`);
            values.push(value);
        }
        
        values.push(playerId);
        
        return new Promise((resolve, reject) => {
            this.db.run(
                `UPDATE players SET ${fields.join(', ')} WHERE id = ?`,
                values,
                (err) => {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });
    }
    
    // Методы для чата
    async addChatMessage(playerId, message, channel = 'global') {
        return new Promise((resolve, reject) => {
            this.db.run(
                'INSERT INTO chat_messages (player_id, message, channel) VALUES (?, ?, ?)',
                [playerId, message, channel],
                function(err) {
                    if (err) reject(err);
                    else resolve(this.lastID);
                }
            );
        });
    }
    
    async getChatMessages(limit = 50, channel = 'global') {
        return new Promise((resolve, reject) => {
            this.db.all(
                `SELECT cm.*, p.username 
                 FROM chat_messages cm 
                 JOIN players p ON cm.player_id = p.id 
                 WHERE cm.channel = ? 
                 ORDER BY cm.created_at DESC 
                 LIMIT ?`,
                [channel, limit],
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows.reverse()); // Новые сверху
                }
            );
        });
    }
    
    // Методы для рынка
    async createMarketItem(itemData) {
        return new Promise((resolve, reject) => {
            this.db.run(
                `INSERT INTO market_items 
                 (seller_id, item_type, item_data, price, currency, expires_at) 
                 VALUES (?, ?, ?, ?, ?, datetime('now', '+1 day'))`,
                [
                    itemData.sellerId,
                    itemData.itemType,
                    JSON.stringify(itemData.itemData),
                    itemData.price,
                    itemData.currency || 'energy'
                ],
                function(err) {
                    if (err) reject(err);
                    else resolve(this.lastID);
                }
            );
        });
    }
    
    async getActiveMarketItems(limit = 100) {
        return new Promise((resolve, reject) => {
            this.db.all(
                `SELECT mi.*, p.username as seller_name 
                 FROM market_items mi 
                 JOIN players p ON mi.seller_id = p.id 
                 WHERE mi.status = 'active' AND mi.expires_at > datetime('now')
                 ORDER BY mi.created_at DESC 
                 LIMIT ?`,
                [limit],
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                }
            );
        });
    }
    
    close() {
        this.db.close((err) => {
            if (err) {
                console.error('Ошибка закрытия БД:', err);
            } else {
                console.log('Соединение с БД закрыто');
            }
        });
    }
}

module.exports = new Database();
