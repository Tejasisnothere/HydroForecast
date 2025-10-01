const express = require("express");
const router = express.Router();
const Tank = require("../models/Tank");
const auth = require("../middleware/auth");

// Add new tank
router.post("/", auth, async (req, res) => {
  try {
    const { name, capacity, city, village, type } = req.body;

    const tank = new Tank({
      name,
      capacity,
      location: { city, village },
      type,
      owner: req.user.id
    });

    await tank.save();
    res.status(201).json(tank);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get all tanks for logged-in user
router.get("/", auth, async (req, res) => {
  try {
    const tanks = await Tank.find({ owner: req.user.id });
    res.json(tanks);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete tank
router.delete("/:id", auth, async (req, res) => {
  try {
    const tank = await Tank.findOneAndDelete({ _id: req.params.id, owner: req.user.id });
    if (!tank) return res.status(404).json({ error: "Tank not found or not authorized" });
    res.json({ message: "Tank deleted", tank });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
