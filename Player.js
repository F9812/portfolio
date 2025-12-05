const mongoose = require('mongoose');

const PlayerSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  
  // Основные ресурсы
  energy: { type: Number, default: 0 },
  quantumPoints: { type: Number, default: 0 },
  totalEnergyEarned: { type: Number, default: 0 },
  
  // Статистика
  rebirthCount: { type: Number, default: 0 },
  totalPlayTime: { type: Number, default: 0 },
  lastRebirthTime: { type: Date, default: Date.now },
  currentSessionStart: { type: Date },
  sessionTimeForRebirth: { type: Number, default: 0 }, // в секундах
  
  // Генераторы
  generators: [{
    type: { type: String, enum: ['solar', 'geothermal', 'quantum', 'gravity', 'stellar'], required: true },
    level: { type: Number, default: 1 },
    count: { type: Number, default: 0 },
    lastCollection: { type: Date, default: Date.now },
    efficiency: { type: Number, default: 1.0 }
  }],
  
  // Улучшения
  upgrades: [{
    id: String,
    level: Number,
    purchased: Boolean
  }],
  
  // Прогресс
  unlockedFeatures: [String],
  achievements: [{
    id: String,
    unlocked: Boolean,
    unlockedAt: Date
  }],
  
  // Социальное
  guildId: { type: mongoose.Schema.Types.ObjectId, ref: 'Guild' },
  friends: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Player' }],
  lastSeen: { type: Date, default: Date.now },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Индексы для оптимизации
PlayerSchema.index({ energy: -1 });
PlayerSchema.index({ rebirthCount: -1 });
PlayerSchema.index({ guildId: 1 });
PlayerSchema.index({ lastSeen: -1 });

module.exports = mongoose.model('Player', PlayerSchema);
