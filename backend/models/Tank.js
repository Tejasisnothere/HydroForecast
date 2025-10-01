const mongoose = require("mongoose");

const TankSchema = new mongoose.Schema({
  name: { type: String, required: true },
  capacity: { type: Number, required: true },

  // Location
  location: {
    city: { type: String },
  },

  type: { type: String, enum: ["Rainwater", "Groundwater", "Reservoir", "Other"], default: "Other" },
  status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
  createdAt: { type: Date, default: Date.now },

  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
});

module.exports = mongoose.model("Tank", TankSchema);
