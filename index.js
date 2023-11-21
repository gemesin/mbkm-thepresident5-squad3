const express = require("express");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const bcrypt = require("bcrypt");
const { Op } = require("sequelize");
const app = express();
const secretKey = process.env.JWT_SECRET_KEY;
const registerValidator = require("./middlewares/register-validator");
const loginValidator = require("./middlewares/login-validator");
const resetPasswordValidator = require("./middlewares/reset-password-validator");
const { USERS } = require("./items");
const db = require("./models");
const { userModel } = require("./models");
const sendEmail = require("./middlewares/email-sender");
const axios = require('axios');
const {Weather} = require("./models");

app.use(express.json());

db.sequelize
  .authenticate()
  .then(() => {
    console.log("Koneksi ke database berhasil.");
  })
  .catch((err) => {
    console.log("Gagal koneksi ke database: ", err);
  });

  var winston = require('winston');
  var {Loggly} = require('winston-loggly-bulk');
  
  winston.add(new Loggly({
      token: "ce56575d-2723-4516-8529-fa6576328ab3",
      subdomain: "mutiararflnsh",
      tags: ["Winston-NodeJS"],
      json: true
  }));
  
  winston.log('info', "Hello World from Node.js!");

app.post("/auth/register", registerValidator, async (req, res) => {
  const validateResult = await validationResult(req);
  if (!validateResult.isEmpty()) {
    return res.status(400).json({
      status: "failed",
      message: "validation error",
      error: validateResult.array(),
    });
  }

  const { fullName, email, password } = req.body;

  try {
    const existingUser = await userModel.findOne({
      where: {
        email: email,
      },
    });

    if (existingUser) {
      return res.status(400).json({ message: "Email sudah terdaftar" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const createUser = await userModel.create({
      fullName: fullName,
      email: email,
      password: hashedPassword,
    });

    winston.log('info', {createUser});

    return res.status(201).json({
      status: "success",
      message: "Berhasil register",
      data: createUser,
    });
  } catch (error) {
    console.error(error);
    winston.log('error', error);
    return res.status(500).json({ message: "Internal Server Error" });
  }

});

app.post("/auth/login", loginValidator, async (req, res) => {
  const validateResult = await validationResult(req);
  if (!validateResult.isEmpty()) {
    return res.status(400).json({
      status: "failed",
      message: "validation error",
      error: validateResult.array(),
    });
  }

  const { email, password } = req.body;

  // Cari pengguna dengan email yang sesuai
  const user = await userModel.findOne({
    where: {
      email: email,
    },
  });
  if (!user) {
    return res.status(401).json({ message: "Email tidak ditemukan" });
  }

  const passwordMatch = await bcrypt.compare(password, user.password);

  if (!passwordMatch) {
    return res.status(401).json({ message: "Password tidak cocok" });
  }

  const tokenData = { id: user.id, email: user.email };
  const token = jwt.sign(tokenData, "rahasia");

  return res.status(200).json({
    message: "Success",
    data: {
      token: token,
    },
  });
});

app.post("/auth/forgot-password",
  [
    body("email")
      .notEmpty()
      .withMessage("Email harus diisi")
      .isEmail()
      .withMessage("Email tidak valid"),
  ],
  async (req, res) => {
    const validateResult = await validationResult(req);
    if (!validateResult.isEmpty()) {
      return res.status(400).json({
        status: "failed",
        message: "Validation error",
        errors: validateResult.array(),
      });
    }

    const { email } = req.body;

    try {
      const user = await userModel.findOne({
        where: { email },
      });

      if (!user) {
        return res.status(404).json({ message: "Email tidak terdaftar" });
      }

      // Generate OTP (One-Time Password)
      const otp = Math.floor(100000 + Math.random() * 900000);
      user.resetToken = otp;
      user.resetTokenExpires = new Date(Date.now() + 3600000);
      await user.save();

      // Kirim OTP ke email 
      const subject = "Reset Password OTP";
      const text = `OTP Anda untuk mereset password adalah: ${otp}`;
      await sendEmail(email, subject, text);

      return res.status(200).json({ message: "OTP dikirim ke email Anda" });
    } catch (error) {
      console.error("Kesalahan dalam endpoint lupa-password:", error);
      return res.status(500).json({ message: "Kesalahan Internal Server" });
    }
  }
);

app.post("/auth/reset-password", resetPasswordValidator, async (req, res) => {
  const validateResult = await validationResult(req);
  if (!validateResult.isEmpty()) {
    return res.status(400).json({
      status: "failed",
      message: "Validation error",
      errors: validateResult.array(),
    });
  }

  const { email, newPassword, otp } = req.body;

  try {
    const user = await userModel.findOne({
      where: {
        email,
        resetToken: otp,
        resetTokenExpires: { [Op.gte]: new Date() },
      },
    });

    if (!user) {
      return res
        .status(400)
        .json({ message: "OTP salah atau sudah kadaluarsa" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.resetToken = null;
    user.resetTokenExpires = null;
    await user.save();

    return res.status(200).json({ message: "Reset password berhasil" });
  } catch (error) {
    console.error("Kesalahan dalam endpoint reset-password:", error);
    return res.status(500).json({ message: "Kesalahan Internal Server" });
  }
});

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

app.get("/weather", async (req,res) => {

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

    const currentWeatherData = currentWeatherResponse.data;

    // Mendapatkan waktu matahari terbit dan terbenam
    //const sunrise = new Date(currentWeatherData.sys.sunrise * 1000).toLocaleTimeString();
    //const sunset = new Date(currentWeatherData.sys.sunset * 1000).toLocaleTimeString();

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
    // Jika belum ada data untuk tanggal tersebut atau data yang baru lebih baru
    acc = acc.filter(data => data.date !== currentDate); // Hapus data lama untuk tanggal tersebut
    acc.push({
      date: currentDate,
      //timestamp: item.dt,
      temperature: item.main.temp,
      weatherDescription: item.weather[0].description,
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
    

    // Mendapatkan data perkiraan cuaca 1 jam ke depan
    const hourlyWeatherList = hourlyWeatherData.hourly.slice(0, 5).map(hour => ({
      time: new Date(hour.dt * 1000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
      temperature: hour.temp,
      weatherDescription: hour.weather[0].description,
    }));
  

    const insertedWeatherData = await Weather.create({
      
        city: currentCityName,
        temperature: currentTemperature,
        weatherDescription: currentWeatherDescription,
        humidity: currentHumidity,
        dewPoint: currentDewPoint,
        windSpeed:`${windSpeed} m/s`,
        windDirection: windDirectionText,
        sunrise: sunrise,
        sunset: sunset,
        status: status,
        hourlyWeather: hourlyWeatherList,
        forecast: forecastList,
  
      
  });


    const responseData = {
      currentWeather: {
        city: currentCityName,
        temperature: currentTemperature,
        weatherDescription: currentWeatherDescription,
        humidity: currentHumidity,
        dewPoint: currentDewPoint,
        windSpeed:`${windSpeed} m/s`,
        windDirection: windDirectionText,
        sunrise: sunrise,
        sunset: sunset,
        status: status
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


const port = 8003;

app.listen(port, () => {
  console.log(`server starter on port ${port}`);
});
