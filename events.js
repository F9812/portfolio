class EventSystem {
    constructor() {
        this.activeEvents = [];
        this.eventHistory = [];
        this.eventConfig = {
            checkInterval: 30000, // Проверка каждые 30 секунд
            minInterval: 600000, // Минимум 10 минут между событиями
            maxEvents: 3 // Максимум активных событий одновременно
        };
        
        this.eventTypes = {
            energy_storm: {
                name: 'Энергетическая буря',
                description: 'Производство энергии увеличено в 2 раза на 2 минуты!',
                duration: 120,
                type: 'global',
                chance: 0.1,
                effect: (player) => ({
                    energyMultiplier: 2,
                    message: '⚡ Энергетическая буря! Производство ×2'
                })
            },
            crystal_swarm: {
                name: 'Кристальный рой',
                description: 'Появляются летающие кристаллы! Кликайте по ним для бонусной энергии.',
                duration: 60,
                type: 'click',
                chance: 0.15,
                effect: (player) => ({
                    clickMultiplier: 3,
                    extraCrystals: 10 + Math.floor(Math.random() * 20),
                    message: '✨ Кристальный рой! Кликайте по кристаллам!'
                })
            },
            quantum_surge: {
                name: 'Квантовый всплеск',
                description: 'Шанс получить квантовые очки за клики увеличен!',
                duration: 180,
                type: 'prestige',
                chance: 0.05,
                requires: { rebirthCount: 1 },
                effect: (player) => ({
                    quantumChance: 0.1,
                    message: '⚛ Квантовый всплеск! Шанс получить квантовые очки!'
                })
            },
            guild_raid: {
                name: 'Гильдейский рейд',
                description: 'Объединитесь с гильдией для сбора энергии!',
                duration: 300,
                type: 'guild',
                chance: 0.08,
                requires: { guild: true },
                effect: (player) => ({
                    guildMultiplier: 1.5,
                    message: '🏰 Гильдейский рейд! Объединяйтесь для бонусов!'
                })
            }
        };
        
        this.startEventLoop();
    }
    
    startEventLoop() {
        setInterval(() => {
            this.checkEvents();
            this.tryStartEvent();
        }, this.eventConfig.checkInterval);
    }
    
    checkEvents() {
        const now = Date.now();
        this.activeEvents = this.activeEvents.filter(event => {
            const elapsed = (now - event.startTime) / 1000;
            return elapsed < event.duration;
        });
    }
    
    tryStartEvent() {
        // Проверка лимита активных событий
        if (this.activeEvents.length >= this.eventConfig.maxEvents) {
            return;
        }
        
        // Проверка времени с последнего события
        if (this.eventHistory.length > 0) {
            const lastEvent = this.eventHistory[this.eventHistory.length - 1];
            const timeSinceLast = Date.now() - lastEvent.timestamp;
            if (timeSinceLast < this.eventConfig.minInterval) {
                return;
            }
        }
        
        // Выбор случайного события
        const availableEvents = Object.entries(this.eventTypes)
            .filter(([id, config]) => {
                // Проверка требований
                if (config.requires) {
                    // Здесь будет проверка требований к игрокам
                    return true;
                }
                return true;
            });
        
        if (availableEvents.length === 0) return;
        
        const [eventId, eventConfig] = availableEvents[
            Math.floor(Math.random() * availableEvents.length)
        ];
        
        // Проверка шанса
        if (Math.random() > eventConfig.chance) return;
        
        // Запуск события
        this.startEvent(eventId, eventConfig);
    }
    
    startEvent(eventId, config) {
        const event = {
            id: eventId,
            name: config.name,
            description: config.description,
            type: config.type,
            startTime: Date.now(),
            duration: config.duration,
            config: config,
            participants: new Set()
        };
        
        this.activeEvents.push(event);
        this.eventHistory.push({
            eventId,
            timestamp: Date.now(),
            name: config.name
        });
        
        console.log(`Событие началось: ${config.name}`);
        
        // Здесь будет рассылка события через WebSocket
        return event;
    }
    
    endEvent(eventId) {
        const eventIndex = this.activeEvents.findIndex(e => e.id === eventId);
        if (eventIndex !== -1) {
            const event = this.activeEvents[eventIndex];
            this.activeEvents.splice(eventIndex, 1);
            
            console.log(`Событие завершилось: ${event.name}`);
            
            // Награждение участников
            this.rewardParticipants(event);
            
            return event;
        }
        return null;
    }
    
    rewardParticipants(event) {
        // Расчет наград для каждого участника
        event.participants.forEach(playerId => {
            const reward = this.calculateReward(event, playerId);
            // Отправка награды игроку
            console.log(`Игрок ${playerId} получил награду:`, reward);
        });
    }
    
    calculateReward(event, playerId) {
        const baseRewards = {
            energy_storm: { energy: 1000, experience: 100 },
            crystal_swarm: { energy: 500, crystals: 5 },
            quantum_surge: { quantumPoints: 1, energy: 200 },
            guild_raid: { guildExperience: 500, energy: 300 }
        };
        
        const baseReward = baseRewards[event.id] || { energy: 100 };
        
        // Умножение в зависимости от участия
        const participationMultiplier = 1 + (event.participants.size / 100);
        
        return {
            ...baseReward,
            energy: Math.floor(baseReward.energy * participationMultiplier)
        };
    }
    
    participateInEvent(playerId, eventId) {
        const event = this.activeEvents.find(e => e.id === eventId);
        if (event) {
            event.participants.add(playerId);
            return true;
        }
        return false;
    }
    
    getActiveEvents() {
        return this.activeEvents.map(event => ({
            id: event.id,
            name: event.name,
            description: event.description,
            type: event.type,
            timeLeft: Math.max(0, event.duration - (Date.now() - event.startTime) / 1000),
            participants: event.participants.size
        }));
    }
    
    getEventHistory(limit = 10) {
        return this.eventHistory
            .slice(-limit)
            .map(record => ({
                ...record,
                timeAgo: this.formatTimeAgo(record.timestamp)
            }));
    }
    
    formatTimeAgo(timestamp) {
        const seconds = Math.floor((Date.now() - timestamp) / 1000);
        
        if (seconds < 60) return `${seconds} секунд назад`;
        if (seconds < 3600) return `${Math.floor(seconds / 60)} минут назад`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)} часов назад`;
        return `${Math.floor(seconds / 86400)} дней назад`;
    }
    
    // Сезонные события
    getSeasonalEvent(month) {
        const seasonalEvents = {
            0: { // Январь
                name: 'Новогодний фестиваль',
                description: 'Снежные кристаллы и праздничные бонусы!',
                multiplier: 1.5,
                duration: 604800 // Неделя
            },
            5: { // Июнь
                name: 'Летнее солнцестояние',
                description: 'Солнечные генераторы работают в 3 раза эффективнее!',
                multiplier: 3,
                duration: 86400 // Сутки
            },
            9: { // Октябрь
                name: 'Хэллоуин',
                description: 'Призрачные кристаллы и мистические бонусы!',
                multiplier: 2,
                duration: 259200 // 3 дня
            },
            11: { // Декабрь
                name: 'Зимние праздники',
                description: 'Подарки и бонусы от Санты!',
                multiplier: 2.5,
                duration: 1209600 // 2 недели
            }
        };
        
        return seasonalEvents[month] || null;
    }
}

module.exports = new EventSystem();
