import TankLog from '../models/TankLog.js';

export const createTankLog = async (req, res) => {
  try {
    console.log("Incoming log data:", req.body);
    console.log("Authenticated user:", req.user);

    const newLog = new TankLog({
      tank: req.body.tank || req.params.id,

      currentLevel: req.body.currentLevel,
      rainfall: req.body.rainfall || 0,
      usage: req.body.usage || 0,
      notes: req.body.notes || "",
      logType: req.body.logType || "manual",
    });

    console.log("New Log being saved:", newLog);

    const savedLog = await newLog.save();
    res.status(201).json(savedLog);
  } catch (err) {
    console.error("Error creating tank log:", err.message);
    res.status(400).json({ error: err.message });
  }
};
