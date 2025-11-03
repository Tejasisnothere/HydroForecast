const mongoose = require('mongoose');

const tankSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Tank name is required'],
    trim: true
  },
  capacity: {
    type: Number,
    required: [true, 'Tank capacity is required'],
    min: [0, 'Capacity must be positive']
  },
  currentLevel: {
    type: Number,
    default: 0,
    min: [0, 'Current level cannot be negative']
  },
  location: {
    type: String
  },
  unit: {
    type: String,
    enum: ['liters', 'gallons', 'cubic_meters'],
    default: 'liters'
  },
  alertThreshold: {
    type: Number,
    default: 20,
    min: [0, 'Alert threshold must be positive'],
    max: [100, 'Alert threshold must be less than 100']
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'maintenance'],
    default: 'active'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

// Update lastUpdated on save
tankSchema.pre('save', function(next) {
  this.lastUpdated = Date.now();
  next();
});

// Virtual for percentage filled
tankSchema.virtual('percentageFilled').get(function() {
  return this.capacity > 0 ? (this.currentLevel / this.capacity) * 100 : 0;
});

// Ensure virtuals are included in JSON
tankSchema.set('toJSON', { virtuals: true });
tankSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Tank', tankSchema);