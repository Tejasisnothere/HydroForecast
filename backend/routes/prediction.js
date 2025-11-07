const express = require("express");
const router = express.Router();

// ✅ Use global fetch in Node 18+, otherwise uncomment below:
// import fetch from "node-fetch";

router.get("/prediction/:tankId", async (req, res) => {
  const { tankId } = req.params;

  try {
    // Call your FastAPI backend
    const response = await fetch("http://127.0.0.1:8000/prediction", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tankId })
    });

    if (!response.ok) {
      throw new Error(`Python backend error: ${response.status}`);
    }

    const result = await response.json();
    const data = result.data || result;
    console.log("📨 Data received from Python backend:", JSON.stringify(data, null, 2));

    // ✅ Render prediction.ejs safely
    res.render("prediction", {
      tank_id: data.tank_id || tankId,
      location: data.location || "Unknown",
      groundwater_level_mbgl: data.groundwater_level_mbgl || 0,
      rainfall_forecast: data.rainfall_forecast || [],
      logs: data.logs || [],
      timestamps: data.timestamps || [],
      pred_dates: data.pred_dates || [],
      pred_vals: data.pred_vals || []
    });
  } catch (err) {
    console.error("❌ Prediction route error:", err);
    res.status(500).send("Prediction service unavailable. Check Python server.");
  }
});

module.exports = router;
