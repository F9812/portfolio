class AchievementManager {
    constructor(gameClient) {
        this.gameClient = gameClient;
        this.achievements = {
            first_click: {
                name: 'Первая искра',
                description: 'Выполните первый клик',
                icon: 'fas fa-mouse-pointer',
                reward: { energy: 100 },
                check: (gameState) => gameState.totalClicks >= 1
            },
            energy_milestone: {
                name: 'Энергетический прорыв',
                description: 'Соберите 1000 энергии',
                icon: 'fas fa-bolt',
                reward: { quantum: 1 },
                check: (gameState) => gameState.totalEnergyEarned >= 1000
            },
            first_generator: {
                name: 'Автоматизация',
                description: 'Купите первый генератор',
                icon: 'fas fa-industry',
                reward: { energy: 500 },
                check: (gameState) => gameState.generators.some(g => g.count > 0)
            },
            first_rebirth: {
                name: 'Квантовый скачок',
                description: 'Выполните первое перерождение',
                icon: 'fas fa-infinity',
                reward: { quantum: 5 },
                check: (gameState) => gameState.rebirthCount >= 1
            },
            social_butterfly: {
                name: 'Социальная бабочка',
                description: 'Вступите в гильдию',
                icon: 'fas fa-users',
                reward: { energy: 1000 },
                check: (gameState) => gameState.guildId !== null
            }
        };
        
        this.unlockedAchievements = new Set();
    }
    
    checkAchievements() {
        const gameState = this.gameClient.gameState;
        const newAchievements = [];
        
        Object.entries(this.achievements).forEach(([id, achievement]) => {
            if (!this.unlockedAchievements.has(id) && achievement.check(gameState)) {
                this.unlockAchievement(id);
                newAchievements.push({ id, ...achievement });
            }
        });
        
        return newAchievements;
    }
    
    unlockAchievement(achievementId) {
        if (!this.achievements[achievementId]) return;
        
        this.unlockedAchievements.add(achievementId);
        const achievement = this.achievements[achievementId];
        
        // Выдача награды
        if (achievement.reward.energy) {
            this.gameClient.gameState.energy += achievement.reward.energy;
        }
        
        if (achievement.reward.quantum) {
            this.gameClient.gameState.quantumPoints += achievement.reward.quantum;
        }
        
        // Оповещение
        this.gameClient.ui.showAchievement(
            achievement.name,
            achievement.description,
            achievement.icon
        );
        
        // Сохранение
        this.saveAchievements();
    }
    
    saveAchievements() {
        localStorage.setItem(
            'energosphere_achievements',
            JSON.stringify(Array.from(this.unlockedAchievements))
        );
    }
    
    loadAchievements() {
        const saved = localStorage.getItem('energosphere_achievements');
        if (saved) {
            this.unlockedAchievements = new Set(JSON.parse(saved));
        }
    }
}
