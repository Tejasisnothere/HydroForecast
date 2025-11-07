const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const path = require('path');
const axios = require('axios');

dotenv.config();

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));

app.use(express.static(path.join(__dirname, 'public')));


app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));


const predictionRoutes = require("./routes/prediction");
app.use("/", predictionRoutes);


mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ MongoDB connected successfully'))
.catch((err) => console.error('❌ MongoDB connection error:', err));


const authRoutes = require('./routes/auth');
const tankRoutes = require('./routes/tank');
const tankLogRoutes = require('./routes/tankLogs');


app.use('/api/auth', authRoutes);
app.use('/api/tanks', tankRoutes);
app.use('/api/tanklogs', tankLogRoutes);


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



const TankLog = require('./models/TankLog');
const Tank = require('./models/Tank');

let weatherFetchInterval;

const fetchWeatherData = async () => {
  try {
    
    const latitude = 12.0827; 
    const longitude = 72.2707;
    
    
    // const forecastUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=precipitation&hourly=precipitation&timezone=auto`;
    
    // const response = await axios.get(forecastUrl);
    
    if (response.data && response.data.current) {
      const currentPrecipitation = response.data.current.precipitation || 0;
      const timestamp = new Date(response.data.current.time);
      
      if (currentPrecipitation > 0) {
        const tanks = await Tank.find();
        
        for (const tank of tanks) {

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
          
          tank.currentLevel = Math.min(tank.currentLevel + rainfallContribution, tank.capacity);
          await tank.save();
        }
        
        console.log(`Rainfall logged for ${tanks.length} tank(s)`);
      }
    }
  } catch (error) {
    console.error(' Error fetching weather data:', error.message);
  }
};

const startWeatherMonitoring = () => {
  console.log(' Weather monitoring service started');
  fetchWeatherData(); 
  weatherFetchInterval = setInterval(fetchWeatherData, 60000);
};

const stopWeatherMonitoring = () => {
  if (weatherFetchInterval) {
    clearInterval(weatherFetchInterval);
    console.log(' Weather monitoring service stopped');
  }
};

mongoose.connection.once('open', () => {
  startWeatherMonitoring();
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!', error: err.message });
});


app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://localhost:${PORT}`);
});


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