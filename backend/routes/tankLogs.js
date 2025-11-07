const express = require('express');
const router = express.Router();
const TankLog = require('../models/TankLog');
const Tank = require('../models/Tank');

// @route   POST /api/tanklogs
// @desc    Create a new tank log (no user validation)
// @access  Public
router.post('/', async (req, res) => {
  try {
    const { tankId, currentLevel, rainfall, usage, notes, logType } = req.body;

    if (!tankId || currentLevel === undefined) {
      return res.status(400).json({ message: 'Please provide tank ID and current level' });
    }

    const tank = await Tank.findById(tankId);
    if (!tank) {
      return res.status(404).json({ message: 'Tank not found' });
    }

    // Create new log
    const tankLog = new TankLog({
      tank: tankId,
      currentLevel,
      rainfall: rainfall || 0,
      usage: usage || 0,
      notes: notes || '',
      logType: logType || 'manual'
    });

    await tankLog.save();

    // Update tank's current level
    tank.currentLevel = currentLevel;
    await tank.save();

    res.status(201).json({
      message: 'Tank log created successfully',
      log: tankLog
    });
  } catch (error) {
    console.error('Create tank log error:', error);
    res.status(500).json({ message: 'Server error creating tank log', error: error.message });
  }
});

// @route   GET /api/tanklogs/:tankId
// @desc    Get all logs for a specific tank
// @access  Public
router.get('/:tankId', async (req, res) => {
  try {
    const { tankId } = req.params;
    const { limit = 50, skip = 0, startDate, endDate } = req.query;

    const tank = await Tank.findById(tankId);
    if (!tank) {
      return res.status(404).json({ message: 'Tank not found' });
    }

    // Build query
    const query = { tank: tankId };

    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    const logs = await TankLog.find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const totalCount = await TankLog.countDocuments(query);

    res.json({
      count: logs.length,
      totalCount,
      logs
    });
  } catch (error) {
    console.error('Get tank logs error:', error);
    res.status(500).json({ message: 'Server error fetching tank logs', error: error.message });
  }
});

// @route   DELETE /api/tanklogs/:tankId/clear
// @desc    Clear all logs for a specific tank
// @access  Public
router.delete('/:tankId/clear', async (req, res) => {
  try {
    const { tankId } = req.params;

    const tank = await Tank.findById(tankId);
    if (!tank) {
      return res.status(404).json({ message: 'Tank not found' });
    }

    const result = await TankLog.deleteMany({ tank: tankId });

    res.json({
      message: 'Tank logs cleared successfully',
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Clear tank logs error:', error);
    res.status(500).json({ message: 'Server error clearing tank logs', error: error.message });
  }
});

// @route   DELETE /api/tanklogs/:logId
// @desc    Delete a specific log
// @access  Public
router.delete('/:logId', async (req, res) => {
  try {
    const log = await TankLog.findByIdAndDelete(req.params.logId);

    if (!log) {
      return res.status(404).json({ message: 'Log not found' });
    }

    res.json({ message: 'Log deleted successfully' });
  } catch (error) {
    console.error('Delete log error:', error);
    res.status(500).json({ message: 'Server error deleting log', error: error.message });
  }
});




router.post('/auto', async (req, res) => {
  try {
    const { tankId, currentLevel, rainfall, usage, notes, logType } = req.body;
    console.log(currentLevel);
    if (!tankId || currentLevel === undefined) {
      return res.status(400).json({ message: 'Please provide tank ID and current level' });
    }

    const tank = await Tank.findById(tankId);
    if (!tank) {
      return res.status(404).json({ message: 'Tank not found' });
    }
    console.log("actual capcity  " + tank.capacity);

    
    const tankHeight = 3; 
    const distanceFromTop = currentLevel/100; 
    const waterHeight = Math.max(tankHeight - distanceFromTop, 0); 
    console.log("current water height " + waterHeight);
    console.log(tank.name);
    // Convert to liters
    const waterVolume = (waterHeight / tankHeight) * tank.capacity;
    console.log("current water volumne " + waterVolume);
    // Create new log
    const tankLog = new TankLog({
      tank: tankId,
      currentLevel: waterVolume, 
      rainfall: rainfall || 0,
      usage: usage || 0,
      notes: notes || '',
      logType: logType || 'auto'
    });

    await tankLog.save();

    // Update tank’s current level
    tank.currentLevel = waterVolume;
    await tank.save();

    res.status(201).json({
      message: 'Tank log created successfully',
      calculatedFrom: {
        distanceFromTop,
        waterHeight,
        tankCapacity: tank.capacity,
        waterVolume
      },
      log: tankLog
    });

  } catch (error) {
    console.error('Create tank log error:', error);
    res.status(500).json({ message: 'Server error creating tank log', error: error.message });
  }
});


module.exports = router;