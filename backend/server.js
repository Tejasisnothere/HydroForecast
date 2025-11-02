const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const path = require('path');
const axios = require('axios');

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ MongoDB connected successfully'))
.catch((err) => console.error('❌ MongoDB connection error:', err));

// Import routes
const authRoutes = require('./routes/auth');
const tankRoutes = require('./routes/tank');
const tankLogRoutes = require('./routes/tankLogs');

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tanks', tankRoutes);
app.use('/api/tanklogs', tankLogRoutes);

// View routes
app.get('/', (req, res) => {
  res.redirect('/login');
});

app.get('/login', (req, res) => {
  res.render('login');
});

app.get('/signup', (req, res) => {
  res.render('signup');
});

app.get('/dashboard', (req, res) => {
  const token = req.cookies.token;
  if (!token) {
    return res.redirect('/login');
  }
  res.render('dashboard');
});

// Weather data fetching service (background task)
const TankLog = require('./models/TankLog');
const Tank = require('./models/Tank');

let weatherFetchInterval;

const fetchWeatherData = async () => {
  try {
    // Default location (can be made dynamic based on tank locations)
    const latitude = 13.0827; // Chennai
    const longitude = 80.2707;
    
    // Fetch current weather and forecast from Open Meteo API
    const forecastUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=precipitation&hourly=precipitation&timezone=auto`;
    
    const response = await axios.get(forecastUrl);
    
    if (response.data && response.data.current) {
      const currentPrecipitation = response.data.current.precipitation || 0;
      const timestamp = new Date(response.data.current.time);
      
      console.log(`🌧️  Weather Update [${timestamp.toLocaleString()}]: Precipitation = ${currentPrecipitation} mm`);
      
      // If there's significant rainfall, log it to all tanks
      if (currentPrecipitation > 0) {
        const tanks = await Tank.find();
        
        for (const tank of tanks) {
          // Calculate water addition based on rainfall and tank capacity
          const rainfallContribution = (currentPrecipitation / 10) * (tank.capacity * 0.1);
          
          const newLog = new TankLog({
            tank: tank._id,
            user: tank.user,
            currentLevel: Math.min(tank.currentLevel + rainfallContribution, tank.capacity),
            rainfall: currentPrecipitation,
            usage: 0,
            timestamp: timestamp,
            notes: `Automated rainfall log: ${currentPrecipitation}mm precipitation detected`
          });
          
          await newLog.save();
          
          // Update tank current level
          tank.currentLevel = Math.min(tank.currentLevel + rainfallContribution, tank.capacity);
          await tank.save();
        }
        
        console.log(`💧 Rainfall logged for ${tanks.length} tank(s)`);
      }
    }
  } catch (error) {
    console.error('❌ Error fetching weather data:', error.message);
  }
};

// Start weather monitoring (every 60 seconds)
const startWeatherMonitoring = () => {
  console.log('🌦️  Weather monitoring service started');
  fetchWeatherData(); // Initial fetch
  weatherFetchInterval = setInterval(fetchWeatherData, 60000); // Every 60 seconds
};

// Stop weather monitoring
const stopWeatherMonitoring = () => {
  if (weatherFetchInterval) {
    clearInterval(weatherFetchInterval);
    console.log('🌦️  Weather monitoring service stopped');
  }
};

// Start monitoring after DB connection
mongoose.connection.once('open', () => {
  startWeatherMonitoring();
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!', error: err.message });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  stopWeatherMonitoring();
  server.close(() => {
    console.log('HTTP server closed');
    mongoose.connection.close(false, () => {
      console.log('MongoDB connection closed');
      process.exit(0);
    });
  });
});