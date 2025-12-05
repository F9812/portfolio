class GeneratorSystem {
    constructor() {
        this.generators = {
            solar: {
                name: 'Солнечная батарея',
                baseCost: 15,
                baseProduction: 0.1,
                costMultiplier: 1.15,
                icon: 'fa-sun',
                color: '#FFD700',
                description: 'Преобразует солнечный свет в энергию'
            },
            geothermal: {
                name: 'Геотермальная скважина',
                baseCost: 100,
                baseProduction: 1,
                costMultiplier: 1.15,
                icon: 'fa-fire',
                color: '#FF4500',
                description: 'Использует тепло земных недр'
            },
            quantum: {
                name: 'Квантовый реактор',
                baseCost: 1100,
                baseProduction: 8,
                costMultiplier: 1.15,
                icon: 'fa-atom',
                color: '#00FFFF',
                description: 'Генерирует энергию из квантовых колебаний'
            },
            gravity: {
                name: 'Гравитационный динамо',
                baseCost: 12000,
                baseProduction: 47,
                costMultiplier: 1.15,
                icon: 'fa-weight-hanging',
                color: '#9400D3',
                description: 'Использует гравитационные волны'
            },
            stellar: {
                name: 'Звездное ядро',
                baseCost: 130000,
                baseProduction: 260,
                costMultiplier: 1.15,
                icon: 'fa-star',
                color: '#FF1493',
                description: 'Миниатюрная звезда в реакторе'
            }
        };
    }
    
    calculateCost(generatorType, count, level = 1) {
        const generator = this.generators[generatorType];
        if (!generator) return Infinity;
        
        return Math.floor(generator.baseCost * Math.pow(generator.costMultiplier, count) * level);
    }
    
    calculateProduction(generatorType, count, level = 1, efficiency = 1.0) {
        const generator = this.generators[generatorType];
        if (!generator) return 0;
        
        return generator.baseProduction * count * level * efficiency;
    }
    
    calculateTotalProduction(playerGenerators, upgrades = []) {
        let total = 0;
        let efficiency = 1.0;
        
        // Применение улучшений
        if (upgrades.includes('generator_boost_1')) {
            efficiency *= 1.1;
        }
        if (upgrades.includes('generator_boost_2')) {
            efficiency *= 1.2;
        }
        if (upgrades.includes('quantum_efficiency')) {
            efficiency *= 1.05;
        }
        
        playerGenerators.forEach(gen => {
            total += this.calculateProduction(gen.type, gen.count, gen.level, efficiency);
        });
        
        return total;
    }
    
    calculateOfflineProduction(playerGenerators, offlineSeconds, upgrades = []) {
        const onlineProduction = this.calculateTotalProduction(playerGenerators, upgrades);
        let offlineEfficiency = 0.7; // 70% по умолчанию
        
        // Улучшения офлайн производства
        if (upgrades.includes('offline_boost')) {
            offlineEfficiency = 0.85; // 85%
        }
        if (upgrades.includes('offline_boost_2')) {
            offlineEfficiency = 0.95; // 95%
        }
        
        return onlineProduction * offlineSeconds * offlineEfficiency;
    }
    
    getGeneratorInfo(type) {
        return this.generators[type] || null;
    }
    
    getAvailableGenerators(playerRebirthCount) {
        const available = [];
        
        // Разблокировка генераторов в зависимости от перерождений
        Object.entries(this.generators).forEach(([id, generator], index) => {
            const requiredRebirths = Math.floor(index / 2); // Каждые 2 типа требуют +1 перерождение
            if (playerRebirthCount >= requiredRebirths) {
                available.push({ id, ...generator });
            }
        });
        
        return available;
    }
    
    // Модернизация генератора (увеличение уровня)
    calculateUpgradeCost(generatorType, currentLevel) {
        const baseCost = this.generators[generatorType]?.baseCost || 100;
        return Math.floor(baseCost * Math.pow(2, currentLevel) * 10);
    }
    
    upgradeGenerator(generator) {
        if (!generator) return null;
        
        const newLevel = generator.level + 1;
        const upgradeCost = this.calculateUpgradeCost(generator.type, generator.level);
        
        return {
            newLevel,
            upgradeCost,
            newProduction: this.calculateProduction(generator.type, generator.count, newLevel)
        };
    }
}

module.exports = new GeneratorSystem();
