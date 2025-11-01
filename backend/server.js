require("dotenv").config();
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const connectDB = require("./config/db");
const authRoutes = require("./middleware/auth"); // signup/login
const jwt = require("jsonwebtoken");
const axios = require("axios");

const app = express();
connectDB();

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "../public/views"));
app.use(express.static(path.join(__dirname, "../public")));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Auth routes
app.use("/", authRoutes);

// Middleware for protected routes
const verifyToken = (req, res, next) => {
    const token = req.cookies.token;
    if (!token) return res.redirect("/login");

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // { id: user._id }
        next();
    } catch {
        res.redirect("/login");
    }
};

// Protected tanks routes
app.use("/api/tanks", verifyToken, require("./routes/tanks"));

// Example protected page
app.get("/dashboard", verifyToken, (req, res) => {
    res.render("dashboard", { userId: req.user.id });
});

app.get("/", (req,res)=>{
    const axios = require('axios');

async function getForecast(lat, lon) {
  const url = `https://api.open-meteo.com/v1/forecast`;
  const params = {
    latitude: lat,
    longitude: lon,
    daily: 'temperature_2m_max,temperature_2m_min,precipitation_sum',
    timezone: 'auto'
  };

  const resp = await axios.get(url, { params });
  return resp.data;
}

getForecast(19.07, 72.87)  // Mumbai
  .then(data => console.log(data))
  .catch(err => console.error(err));

})

app.get("/weather", (req,res) =>{
    const axios = require('axios');

async function getHistoricalWeather(lat, lon, startDate, endDate) {
  const url = `https://archive-api.open-meteo.com/v1/archive`;  // depending on the endpoint
  // Note: you need to check the Open-Meteo docs for the precise historical endpoint
  const params = {
    latitude: lat,
    longitude: lon,
    start_date: startDate,   // YYYY-MM-DD
    end_date: endDate,       // YYYY-MM-DD
    hourly: 'temperature_2m,relative_humidity_2m,wind_speed_10m'  // whatever variables you need
  };

  const resp = await axios.get(url, { params });
  return resp.data;
}

getHistoricalWeather(19.07, 72.87, '2025-09-01', '2025-09-05')
  .then(data => console.log(data))
  .catch(err => console.error(err));

})


setInterval(async () => {
  try {
    const resp = await axios.get('https://api.open-meteo.com/v1/forecast', {
      params: {
        latitude: 19.07,
        longitude: 72.87,
        daily: 'precipitation_sum',
        timezone: 'auto'
      }
    });
    console.log("Rainfall data:", resp.data.daily);
    // You could also save this to MongoDB here
  } catch (err) {
    console.error("Error fetching weather:", err.message);
  }
}, 10000);  // 1 hour in ms




app.listen(process.env.PORT || 5000, () =>
    console.log(`Server running on port ${process.env.PORT || 5000}`)
);
