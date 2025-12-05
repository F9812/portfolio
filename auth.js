const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./db');

class Auth {
    constructor() {
        this.secret = process.env.JWT_SECRET || 'energosphere_secret_key';
        this.tokenExpiry = '7d';
    }
    
    async register(userData) {
        try {
            // Проверка существующего пользователя
            const existingUser = await db.getPlayer(userData.username);
            if (existingUser) {
                throw new Error('Имя пользователя уже занято');
            }
            
            // Хеширование пароля
            const passwordHash = await bcrypt.hash(userData.password, 10);
            
            // Создание пользователя
            const userId = await db.createPlayer({
                ...userData,
                passwordHash
            });
            
            // Создание токена
            const token = this.generateToken(userId, userData.username);
            
            return {
                success: true,
                userId,
                username: userData.username,
                token
            };
            
        } catch (error) {
            console.error('Ошибка регистрации:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    async login(username, password) {
        try {
            // Поиск пользователя
            const user = await db.getPlayer(username);
            if (!user) {
                throw new Error('Пользователь не найден');
            }
            
            // Проверка пароля
            const validPassword = await bcrypt.compare(password, user.password_hash);
            if (!validPassword) {
                throw new Error('Неверный пароль');
            }
            
            // Обновление времени последнего входа
            await db.updatePlayer(user.id, {
                last_login: new Date().toISOString()
            });
            
            // Создание токена
            const token = this.generateToken(user.id, username);
            
            return {
                success: true,
                user: {
                    id: user.id,
                    username: user.username,
                    energy: user.energy,
                    quantumPoints: user.quantum_points,
                    rebirthCount: user.rebirth_count
                },
                token
            };
            
        } catch (error) {
            console.error('Ошибка входа:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    generateToken(userId, username) {
        return jwt.sign(
            {
                userId,
                username,
                type: 'player'
            },
            this.secret,
            { expiresIn: this.tokenExpiry }
        );
    }
    
    verifyToken(token) {
        try {
            return jwt.verify(token, this.secret);
        } catch (error) {
            return null;
        }
    }
    
    // Гостевой вход
    async guestLogin() {
        try {
            const guestId = 'guest_' + Math.random().toString(36).substr(2, 9);
            const username = 'Гость_' + Math.floor(Math.random() * 10000);
            
            // Создание гостевого аккаунта
            const userId = await db.createPlayer({
                username,
                email: null,
                passwordHash: null,
                energy: 0
            });
            
            // Создание токена
            const token = this.generateToken(userId, username);
            
            return {
                success: true,
                user: {
                    id: userId,
                    username,
                    energy: 0,
                    quantumPoints: 0,
                    rebirthCount: 0,
                    isGuest: true
                },
                token
            };
            
        } catch (error) {
            console.error('Ошибка гостевого входа:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    // Проверка сессии
    async validateSession(token) {
        const decoded = this.verifyToken(token);
        if (!decoded) {
            return { valid: false };
        }
        
        try {
            const user = await db.getPlayer(decoded.username);
            if (!user) {
                return { valid: false };
            }
            
            return {
                valid: true,
                user: {
                    id: user.id,
                    username: user.username,
                    energy: user.energy,
                    quantumPoints: user.quantum_points,
                    rebirthCount: user.rebirth_count
                }
            };
            
        } catch (error) {
            console.error('Ошибка проверки сессии:', error);
            return { valid: false };
        }
    }
}

module.exports = new Auth();
