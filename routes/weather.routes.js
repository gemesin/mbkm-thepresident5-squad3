const express = require("express");
const db = require("../models");
const { Op } = require("sequelize");
const axios = require('axios');
const Weather = require("../models/weather.model")(db.sequelize, db.Sequelize);

const router = express.Router();


function isClear(weatherDescription) {
  const lowerCaseDescription = weatherDescription.toLowerCase();
  return lowerCaseDescription.includes('clear sky');
}

function isCloudy(weatherDescription) {
  const lowerCaseDescription = weatherDescription.toLowerCase();
  return lowerCaseDescription.includes('scattered clouds') 
  || lowerCaseDescription.includes('few clouds') 
  || lowerCaseDescription.includes('overcast clouds')
  || lowerCaseDescription.includes('broken clouds');
}

function isRainy(weatherDescription) {
  const lowerCaseDescription = weatherDescription.toLowerCase();
  return lowerCaseDescription.includes('thuderstorm with light rain') 
  || lowerCaseDescription.includes('thunderstorm with rain') 
  || lowerCaseDescription.includes('thunderstorm with heavy rain') 
  || lowerCaseDescription.includes('light thunderstorm with') 
  || lowerCaseDescription.includes('thunderstorm') 
  || lowerCaseDescription.includes('heavy thunderstorm') 
  || lowerCaseDescription.includes('ragged thunderstorm') 
  || lowerCaseDescription.includes('thunderstorm with loght drizzle')
  || lowerCaseDescription.includes('thunderstorm with drizzle')  
  || lowerCaseDescription.includes('thunderstorm with heavy drizzle')
  || lowerCaseDescription.includes('light intensity drizzle')
  || lowerCaseDescription.includes('drizzle')
  || lowerCaseDescription.includes('heavy intensity drizzle')
  || lowerCaseDescription.includes('drizzle rain')
  || lowerCaseDescription.includes('heavy intensity drizzle rain')
  || lowerCaseDescription.includes('shower rain and drizzle')
  || lowerCaseDescription.includes('heavy shower rain and drizzle')
  || lowerCaseDescription.includes('shower drizzle')
  || lowerCaseDescription.includes('light rain')
  || lowerCaseDescription.includes('heavy intensity rain')
  || lowerCaseDescription.includes('very heavy rain')
  || lowerCaseDescription.includes('extreme rain')
  || lowerCaseDescription.includes('freezing rain')
  || lowerCaseDescription.includes('light intensity shower rain')
  || lowerCaseDescription.includes('shower rain')
  || lowerCaseDescription.includes('heavy intensity shower rain')
  || lowerCaseDescription.includes('ragged shower rain')
  || lowerCaseDescription.includes('moderate rain');
}

function isSnow(weatherDescription) {
  const lowerCaseDescription = weatherDescription.toLowerCase();
  return lowerCaseDescription.includes('light snow') 
  || lowerCaseDescription.includes('snow') 
  || lowerCaseDescription.includes('heavy snow') 
  || lowerCaseDescription.includes('sleet') 
  || lowerCaseDescription.includes('light shower sleet')
  || lowerCaseDescription.includes('shower sleet')
  || lowerCaseDescription.includes('light rain and snow')
  || lowerCaseDescription.includes('rain and snow')
  || lowerCaseDescription.includes('light shower snow')
  || lowerCaseDescription.includes('shower snow')
  || lowerCaseDescription.includes('heavy shower snow');
}

function isAtmosphere(weatherDescription) {
  const lowerCaseDescription = weatherDescription.toLowerCase();
  return lowerCaseDescription.includes('mist') 
  || lowerCaseDescription.includes('smoke') 
  || lowerCaseDescription.includes('haze') 
  || lowerCaseDescription.includes('sand/dust whirls') 
  || lowerCaseDescription.includes('fog')
  || lowerCaseDescription.includes('sand')
  || lowerCaseDescription.includes('dust')
  || lowerCaseDescription.includes('volcanic ash')
  || lowerCaseDescription.includes('squalls')
  || lowerCaseDescription.includes('tornado');
}

function calculateDewPoint(temperature, humidity) {
  const a = 17.27;
  const b = 237.7;
  const alpha = ((a * temperature) / (b + temperature)) + Math.log(humidity / 100.0);
  const dewPoint = (b * alpha) / (a - alpha);
  return dewPoint.toFixed(2); // You can adjust the number of decimal places as needed
}


router.get("/", async (req, res) => {
    try {
    const { lat, lon } = req.query;
    const apiKey = '859110c5e10e40ca3fd54dabb1a31914';

    // Mendapatkan data cuaca saat ini
    const currentWeatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`;
    const currentWeatherResponse = await axios.get(currentWeatherUrl);

    // Check if the response contains an error message
    if (currentWeatherResponse.data.cod && currentWeatherResponse.data.message) {
      // Invalid API key or other error
      return res.status(currentWeatherResponse.data.cod).json({ error: currentWeatherResponse.data.message });
    }


     // Cek apakah data cuaca sudah ada dalam database untuk lokasi dan waktu yang sesuai
     const currentTime = new Date();
     const twentyMinutesAgo = new Date(currentTime - 20 * 60 * 1000);
     const tolerance = 0.0001;
     const weatherData = await Weather.findOne({
       where: {
         latitude: {
           [Op.between]: [parseFloat(lat) - tolerance, parseFloat(lat) + tolerance]
         },
         longitude: {
           [Op.between]: [parseFloat(lon) - tolerance, parseFloat(lon) + tolerance]
         },
         timestamp: {
           [Op.gte]: twentyMinutesAgo
         },
       },
       order: [['timestamp', 'DESC']],
     });
 
     if (weatherData) {
       console.log('Query Where:', {
         hasil: weatherData,
         Weather: weatherData,
         timestamp: {
           [Op.gte]: twentyMinutesAgo
         }
       });
       const anotherWeatherData = await Weather.findOne({
         where: {
           latitude: {
             [Op.between]: [parseFloat(lat) - tolerance, parseFloat(lat) + tolerance]
           },
           longitude: {
             [Op.between]: [parseFloat(lon) - tolerance, parseFloat(lon) + tolerance]
           },
           timestamp: {
             [Op.gte]: twentyMinutesAgo
           },
         },
         order: [['timestamp', 'DESC']]
       });
 
         if (anotherWeatherData) {
             // Jika data cuaca ada dalam database dan masih valid
             return res.json({
               currentWeather: {
                 city: weatherData.city,
                 latitude: weatherData.latitude,
                 longitude: weatherData.longitude,
                 timestamp: weatherData.timestamp,
                 temperature: weatherData.temperature,
                 weatherDescription: weatherData.weatherDescription,
                 humidity: weatherData.humidity,
                 dewPoint: weatherData.dewPoint,
                 windSpeed:weatherData.windSpeed,
                 windDirection: weatherData.windDirection,
                 sunrise: weatherData.sunrise,
                 sunset: weatherData.sunset,
                 status: weatherData.status,
                 icon: weatherData.icon
               },
               hourlyweather: weatherData.hourlyWeather,
               forecast: weatherData.forecast 
             });
         }
     }
    const currentWeatherData = currentWeatherResponse.data;
    const currentTimestamp = currentWeatherData.dt + 7 * 3600;

    const sunriseTimestamp = currentWeatherData.sys.sunrise;
    const sunsetTimestamp = currentWeatherData.sys.sunset;

      let sunrise, sunset;

      if (sunriseTimestamp && sunsetTimestamp) {
        const offsetHours = 7; // Ubah sesuai kebutuhan
        sunrise = new Date((sunriseTimestamp + offsetHours * 3600) * 1000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
        sunset = new Date((sunsetTimestamp + offsetHours * 3600) * 1000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
      } else {
        // Atur nilai default jika waktu tidak tersedia
        sunrise = null;
        sunset = null;
      }
    
    // Mendapatkan data perkiraan cuaca 5 hari ke depan berdasarkan latitude dan longitude
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`;
    const forecastResponse = await axios.get(forecastUrl);
    const forecastData = forecastResponse.data;


// Menampilkan data perkiraan cuaca 5 hari ke depan (hanya data terakhir setiap tanggal)
      const forecastList = forecastData.list.reduce((acc, item) => {
      const currentDate = new Date(item.dt * 1000).toLocaleDateString();
      const existingData = acc.find(data => data.date === currentDate);

      if (!existingData || item.dt > existingData.timestamp) {
        acc = acc.filter(data => data.date !== currentDate);
        let iconUrl = '';
    
        if (isCloudy(item.weather[0].description)) {
          iconUrl = 'https://i.imgur.com/o4BgyTR.png';
        } else if (isRainy(item.weather[0].description)) {
          iconUrl = 'https://i.imgur.com/oqU2rAr.png';
        } else if (isClear(item.weather[0].description)) {
          iconUrl = 'https://i.imgur.com/XhlFmO6.png';
        } else if (isAtmosphere(item.weather[0].description)) {
          iconUrl = 'https://i.imgur.com/3ySKAbw.png';
        } else if (isSnow(item.weather[0].description)) {
          iconUrl = 'https://i.imgur.com/1YKOg';
        }
    
        acc.push({
          date: currentDate,
          temperature: item.main.temp,
          weatherDescription: item.weather[0].description,
          icon: iconUrl,
        });
      }
    
      return acc;
    }, []);

    // Mendapatkan data perkiraan cuaca per jam berdasarkan latitude dan longitude
    const hourlyWeatherUrl = `https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${lon}&exclude=minutely,daily,alerts&units=metric&appid=${apiKey}`;
    const hourlyWeatherResponse = await axios.get(hourlyWeatherUrl);
    const hourlyWeatherData = hourlyWeatherResponse.data;


    // Menampilkan data suhu, cuaca, dan kelembaban dalam respons untuk cuaca saat ini
    const currentTemperature = currentWeatherData.main.temp;
    const currentWeatherDescription = currentWeatherData.weather[0].description;
    const currentHumidity = currentWeatherData.main.humidity;
    const currentCityName = currentWeatherData.name;
    const currentDewPoint = calculateDewPoint(currentTemperature, currentHumidity);

    // Ambil arah angin untuk cuaca saat ini
    const windDirection = currentWeatherData.wind.deg; // Arah angin dalam 
    const windSpeed = currentWeatherData.wind.speed; // Kecepatan angin dalam m/s

    let windDirectionText = '';
    if (windDirection >= 337.5 || windDirection < 22.5) {
      windDirectionText = 'Utara';
    } else if (windDirection >= 22.5 && windDirection < 67.5) {
      windDirectionText = 'Timur Laut';
    } else if (windDirection >= 67.5 && windDirection < 112.5) {
      windDirectionText = 'Timur';
    } else if (windDirection >= 112.5 && windDirection < 157.5) {
      windDirectionText = 'Tenggara';
    } else if (windDirection >= 157.5 && windDirection < 202.5) {
      windDirectionText = 'Selatan';
    } else if (windDirection >= 202.5 && windDirection < 247.5) {
      windDirectionText = 'Barat Daya';
    } else if (windDirection >= 247.5 && windDirection < 292.5) {
      windDirectionText = 'Barat';
    } else if (windDirection >= 292.5 && windDirection < 337.5) {
      windDirectionText = 'Barat Laut';
    }


   let status= '';
    if (isCloudy(currentWeatherDescription)) {
      status = 'Wah saat ini cuaca sedang berawan, Jangan lupa untuk tetap menyiram tanaman Anda ya!';
    } else if (isRainy(currentWeatherDescription)) {
      status = 'Waduh sedang hujan nih. Pantau pasokan air dan kelembaban tanaman Anda!';
    } else if (isClear(currentWeatherDescription)) {
      status = 'Hari ini cerah, yuk berikan pupuk dan vitamin serta pantau kelembapan tanaman Anda!';
    } else if (isAtmosphere(currentWeatherDescription)){
      status = 'Hari ini sedang berkabut, lanjutkan aktivitas Anda!';
    } else if (isSnow(currentWeatherDescription)){
      status = 'Waduh sedang turun salju, segera selamatkan tanaman Anda!';
    }
    
    let icon = '';
    if(isCloudy(currentWeatherDescription)){
      icon = 'https://i.imgur.com/o4BgyTR.png';
    } else if (isRainy(currentWeatherDescription)){
      icon = 'https://i.imgur.com/oqU2rAr.png';
    } else if (isClear(currentWeatherDescription)){
      icon = 'https://i.imgur.com/XhlFmO6.png';
    } else if (isAtmosphere(currentWeatherDescription)){
      icon = 'https://i.imgur.com/3ySKAbw.png'; 
    } else if (isSnow(currentWeatherDescription)){
      icon = 'https://i.imgur.com/1YKOg';
    }

     // Mendapatkan data perkiraan cuaca 1 jam ke depan
    const offsetHours = 7; // Ubah sesuai kebutuhan
    const hourlyWeatherList = hourlyWeatherData.hourly.slice(0, 10).map(hour => {
      let iconUrl = '';

  if (isCloudy(hour.weather[0].description)) {
    iconUrl = 'https://i.imgur.com/o4BgyTR.png';
  } else if (isRainy(hour.weather[0].description)) {
    iconUrl = 'https://i.imgur.com/oqU2rAr.png';
  } else if (isClear(hour.weather[0].description)) {
    iconUrl = 'https://i.imgur.com/XhlFmO6.png';
  } else if (isAtmosphere(hour.weather[0].description)) {
    iconUrl = 'https://i.imgur.com/3ySKAbw.png';
  } else if (isSnow(hour.weather[0].description)) {
    iconUrl = 'https://i.imgur.com/1YKOg';
  }

  return {
    time: new Date((hour.dt + offsetHours * 3600) * 1000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
    temperature: hour.temp,
    weatherDescription: hour.weather[0].description,
    icon: iconUrl,
  };
});
  

    const insertedWeatherData = await Weather.create({
      
        city: currentCityName,
        latitude: lat,
        longitude: lon, 
        timestamp: currentTime,
        temperature: currentTemperature,
        weatherDescription: currentWeatherDescription,
        humidity: currentHumidity,
        dewPoint: currentDewPoint,
        windSpeed:`${windSpeed} m/s`,
        windDirection: windDirectionText,
        sunrise: sunrise,
        sunset: sunset,
        status: status,
        icon: icon,
        hourlyWeather: hourlyWeatherList,
        forecast: forecastList,
  
      
  });


    const responseData = {
      currentWeather: {
        city: currentCityName,
        latitude: lat,
        longitude: lon, 
        timestamp: currentTime,
        temperature: currentTemperature,
        weatherDescription: currentWeatherDescription,
        humidity: currentHumidity,
        dewPoint: currentDewPoint,
        windSpeed:`${windSpeed} m/s`,
        windDirection: windDirectionText,
        sunrise: sunrise,
        sunset: sunset,
        status: status,
        icon: icon,
      },
      hourlyweather: hourlyWeatherList,
      forecast: forecastList,
    };

    res.json(responseData);
  } catch (error) {
    // Menangani kesalahan umum
    console.error('Terjadi kesalahan:', error);
    res.status(500).json({ error: 'Terjadi kesalahan dalam permintaan.' });
  }

});

module.exports = router;