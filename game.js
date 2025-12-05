require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Хранение данных игроков в памяти (в production используйте базу данных)
const players = new Map();
const onlinePlayers = new Set();
const chatHistory = [];

// Конфигурация генераторов
const GENERATOR_CONFIG = {
    solar: { baseCost: 15, baseProduction: 0.1 },
    geothermal: { baseCost: 100, baseProduction: 1 },
    quantum: { baseCost: 1100, baseProduction: 8 },
    gravity: { baseCost: 12000, baseProduction: 47 },
    stellar: { baseCost: 130000, baseProduction: 260 }
};

// Система событий
const EVENTS = [
    {
        id: 'energy_storm',
        name: 'Энергетическая буря',
        description: 'Все игроки получают +10% к текущей энергии!',
        type: 'global',
        duration: 60,
        interval: 1800 // Каждые 30 минут
    },
    {
        id: 'crystal_swarm',
        name: 'Кристальный рой',
        description: 'Появляются летающие кристаллы для сбора!',
        type: 'click',
        duration: 30,
        interval: 1200 // Каждые 20 минут
    }
];

// Запуск периодических событий
setInterval(() => {
    const event = EVENTS[Math.floor(Math.random() * EVENTS.length)];
    io.emit('game_event', event);
    console.log(`Событие запущено: ${event.name}`);
}, 300000); // Каждые 5 минут

// Обработка WebSocket соединений
io.on('connection', (socket) => {
    console.log('Новый игрок подключился:', socket.id);
    
    socket.on('player_login', (data) => {
        const { username, gameState } = data;
        
        // Сохранение игрока
        if (!players.has(username)) {
            players.set(username, {
                username,
                energy: gameState?.energy || 0,
                quantumPoints: gameState?.quantumPoints || 0,
                rebirthCount: gameState?.rebirthCount || 0,
                sessionTime: 0,
                generators: gameState?.generators || [],
                upgrades: gameState?.upgrades || [],
                lastActive: Date.now(),
                socketId: socket.id
            });
        }
        
        const player = players.get(username);
        player.socketId = socket.id;
        onlinePlayers.add(username);
        
        // Отправка текущего состояния
        socket.emit('game_update', {
            energy: player.energy,
            quantumPoints: player.quantumPoints,
            rebirthCount: player.rebirthCount
        });
        
        // Отправка истории чата
        socket.emit('chat_history', chatHistory.slice(-50));
        
        // Оповещение о новом игроке
        io.emit('player_online', Array.from(onlinePlayers).map(name => ({
            username: name,
            energy: players.get(name)?.energy || 0
        })));
        
        console.log(`Игрок вошел: ${username}`);
    });
    
    socket.on('player_click', (data) => {
        const { playerId, energy } = data;
        const player = players.get(playerId);
        
        if (player) {
            player.energy += energy;
            player.lastActive = Date.now();
            
            // Отправка обновления всем игрокам
            io.emit('player_energy_update', {
                username: playerId,
                energy: player.energy
            });
        }
    });
    
    socket.on('player_rebirth', (data) => {
        const { playerId, rebirthCount, quantumPoints } = data;
        const player = players.get(playerId);
        
        if (player) {
            player.rebirthCount = rebirthCount;
            player.quantumPoints += quantumPoints;
            player.sessionTime = 0;
            
            // Глобальное оповещение
            io.emit('player_rebirthed', {
                username: playerId,
                rebirthCount: rebirthCount
            });
            
            // Отправка обновления игроку
            socket.emit('game_update', {
                quantumPoints: player.quantumPoints,
                rebirthCount: player.rebirthCount
            });
        }
    });
    
    socket.on('chat_message', (data) => {
        const { player, message, timestamp } = data;
        
        const chatMessage = {
            player,
            message,
            timestamp
        };
        
        // Сохранение в историю
        chatHistory.push(chatMessage);
        if (chatHistory.length > 1000) chatHistory.shift();
        
        // Рассылка всем игрокам
        io.emit('chat_message', chatMessage);
    });
    
    socket.on('disconnect', () => {
        // Находим игрока по socket.id
        for (const [username, player] of players.entries()) {
            if (player.socketId === socket.id) {
                onlinePlayers.delete(username);
                console.log(`Игрок отключился: ${username}`);
                
                // Оповещение об отключении
                io.emit('player_offline', {
                    username,
                    onlineCount: onlinePlayers.size
                });
                break;
            }
        }
    });
    
    // Периодическое обновление времени сессии
    setInterval(() => {
        for (const player of players.values()) {
            if (onlinePlayers.has(player.username)) {
                player.sessionTime += 1;
                
                // Отправка обновления игроку
                if (player.socketId === socket.id) {
                    socket.emit('game_update', {
                        sessionTime: player.sessionTime
                    });
                }
            }
        }
    }, 1000);
});

// API эндпоинты
app.get('/api/players', (req, res) => {
    const playerList = Array.from(players.values())
        .sort((a, b) => b.energy - a.energy)
        .slice(0, 100);
    
    res.json(playerList);
});

app.get('/api/leaderboard', (req, res) => {
    const leaderboard = Array.from(players.values())
        .sort((a, b) => b.rebirthCount - a.rebirthCount || b.energy - a.energy)
        .slice(0, 50)
        .map(p => ({
            username: p.username,
            energy: p.energy,
            rebirthCount: p.rebirthCount,
            quantumPoints: p.quantumPoints
        }));
    
    res.json(leaderboard);
});

app.get('/api/stats', (req, res) => {
    const totalPlayers = players.size;
    const onlinePlayersCount = onlinePlayers.size;
    const totalEnergy = Array.from(players.values()).reduce((sum, p) => sum + p.energy, 0);
    const totalRebirths = Array.from(players.values()).reduce((sum, p) => sum + p.rebirthCount, 0);
    
    res.json({
        totalPlayers,
        onlinePlayers: onlinePlayersCount,
        totalEnergy,
        totalRebirths,
        serverUptime: process.uptime()
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
    console.log(`Доступен по адресу: http://localhost:${PORT}`);
});
