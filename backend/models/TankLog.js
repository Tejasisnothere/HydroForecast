const mongoose = require('mongoose');

const tankLogSchema = new mongoose.Schema({
  tank: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tank',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  currentLevel: {
    type: Number,
    required: [true, 'Current level is required'],
    min: [0, 'Current level cannot be negative']
  },
  rainfall: {
    type: Number,
    default: 0,
    min: [0, 'Rainfall cannot be negative']
  },
  usage: {
    type: Number,
    default: 0,
    min: [0, 'Usage cannot be negative']
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  notes: {
    type: String,
    default: ''
  },
  logType: {
    type: String,
    enum: ['manual', 'automated'],
    default: 'manual'
  }
});

// Index for faster queries
tankLogSchema.index({ tank: 1, timestamp: -1 });
tankLogSchema.index({ user: 1, timestamp: -1 });

module.exports = mongoose.model('TankLog', tankLogSchema);