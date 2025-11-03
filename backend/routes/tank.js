const express = require('express');
const router = express.Router();
const Tank = require('../models/Tank');
const { verifyToken } = require('../middleware/auth');

// @route   POST /api/tanks
// @desc    Register a new tank
// @access  Private
router.post('/', verifyToken, async (req, res) => {
  try {
    const { name, capacity, currentLevel, location, unit, alertThreshold } = req.body;
    
    // Validation
    if (!name || !capacity) {
      return res.status(400).json({ message: 'Please provide tank name and capacity' });
    }
    
    // Create new tank
    const tank = new Tank({
      user: req.userId,
      name,
      capacity,
      currentLevel: currentLevel || 0,
      location: location ,
      unit: unit || 'liters',
      alertThreshold: alertThreshold || 20
    });
    
    await tank.save();
    
    res.status(201).json({
      message: 'Tank registered successfully',
      tank
    });
  } catch (error) {
    console.error('Tank registration error:', error);
    res.status(500).json({ message: 'Server error during tank registration', error: error.message });
  }
});

// @route   GET /api/tanks
// @desc    Get all tanks for current user
// @access  Private
router.get('/', verifyToken, async (req, res) => {
  try {
    const tanks = await Tank.find({ user: req.userId }).sort({ createdAt: -1 });
    
    res.json({
      count: tanks.length,
      tanks
    });
  } catch (error) {
    console.error('Get tanks error:', error);
    res.status(500).json({ message: 'Server error fetching tanks', error: error.message });
  }
});

// @route   GET /api/tanks/:id
// @desc    Get a specific tank by ID
// @access  Private
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const tank = await Tank.findOne({ _id: req.params.id, user: req.userId });
    
    if (!tank) {
      return res.status(404).json({ message: 'Tank not found' });
    }
    
    res.json({ tank });
  } catch (error) {
    console.error('Get tank error:', error);
    res.status(500).json({ message: 'Server error fetching tank', error: error.message });
  }
});

// @route   PUT /api/tanks/:id
// @desc    Update a tank
// @access  Private
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const { name, capacity, currentLevel, location, unit, alertThreshold, status } = req.body;
    
    const tank = await Tank.findOne({ _id: req.params.id, user: req.userId });
    
    if (!tank) {
      return res.status(404).json({ message: 'Tank not found' });
    }
    
    // Update fields
    if (name) tank.name = name;
    if (capacity !== undefined) tank.capacity = capacity;
    if (currentLevel !== undefined) tank.currentLevel = currentLevel;
    if (location) tank.location = location;

    if (unit) tank.unit = unit;
    if (alertThreshold !== undefined) tank.alertThreshold = alertThreshold;
    if (status) tank.status = status;
    
    await tank.save();
    
    res.json({
      message: 'Tank updated successfully',
      tank
    });
  } catch (error) {
    console.error('Update tank error:', error);
    res.status(500).json({ message: 'Server error updating tank', error: error.message });
  }
});

// @route   DELETE /api/tanks/:id
// @desc    Delete a tank
// @access  Private
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const tank = await Tank.findOneAndDelete({ _id: req.params.id, user: req.userId });
    
    if (!tank) {
      return res.status(404).json({ message: 'Tank not found' });
    }
    
    res.json({ message: 'Tank deleted successfully' });
  } catch (error) {
    console.error('Delete tank error:', error);
    res.status(500).json({ message: 'Server error deleting tank', error: error.message });
  }
});

module.exports = router;