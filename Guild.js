const mongoose = require('mongoose');

const GuildSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  tag: { type: String, required: true, unique: true, maxlength: 4 },
  description: { type: String },
  
  leader: { type: mongoose.Schema.Types.ObjectId, ref: 'Player', required: true },
  officers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Player' }],
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Player' }],
  
  // Ресурсы гильдии
  guildEnergy: { type: Number, default: 0 },
  guildLevel: { type: Number, default: 1 },
  guildExperience: { type: Number, default: 0 },
  
  // Улучшения гильдии
  upgrades: [{
    type: String,
    level: Number,
    purchasedAt: Date
  }],
  
  // Гильдейские события
  activeEvent: {
    type: String,
    progress: Number,
    endTime: Date
  },
  
  // Чат гильдии (упрощенный)
  chatMessages: [{
    player: { type: mongoose.Schema.Types.ObjectId, ref: 'Player' },
    message: String,
    timestamp: { type: Date, default: Date.now }
  }],
  
  settings: {
    joinType: { type: String, enum: ['open', 'approval', 'closed'], default: 'approval' },
    minimumRebirth: { type: Number, default: 0 },
    announcement: String
  },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Guild', GuildSchema);
