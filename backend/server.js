const express = require('express')
require('dotenv').config();
const axios = require('axios');
const app = express()
const port = 3000

app.use(express.static('public'))

app.get('/', (req, res) => {
  res.send('Hello World!')

  axios.get('https://api.openweathermap.org/data/2.5/weather', {
    params: {
        q: 'Kolhapur',
        appid: process.env.WEATHER_API_KEY,
        units: 'metric'
    }
})
.then(response => {
    console.log(response.data);
})
.catch(error => {
    console.error(error);
});

})

app.post("/", (req,res) => {
    res.send({'data':'123'})
})



app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})

