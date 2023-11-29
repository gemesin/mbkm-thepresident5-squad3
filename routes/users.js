const express = require("express");
const { body, validationResult } = require("express-validator");
const bcrypt = require("bcrypt");
const { USERS } = require("../items");
const sendEmail = require("../middlewares/email-sender");
const { userModel } = require("../models");
const jwt = require("jsonwebtoken");

const router = express.Router();

const registerValidator = [
  body("fullName").notEmpty().withMessage("Harus diisi"),
  body("email")
    .notEmpty()
    .withMessage("Email harus diisi")
    .isEmail()
    .withMessage("Email tidak valid"),
  body("password")
    .notEmpty()
    .withMessage("Password harus diisi")
    .isLength({ min: 8 })
    .withMessage("Password minimal 8 karakter")
    .matches(/[\W]/)
    .withMessage("Password harus memiliki minimal 1 simbol"),
];

const loginValidator = [
  body("email")
    .notEmpty()
    .withMessage("Email harus diisi")
    .isEmail()
    .withMessage("Email tidak valid"),
  body("password")
    .notEmpty()
    .withMessage("Password harus diisi")
    .isLength({ min: 8 })
    .withMessage("Password minimal 8 karakter")
    .matches(/[\W]/)
    .withMessage("Password harus memiliki minimal 1 simbol"),
];

router.post("/auth/register", registerValidator, (req, res) => {
  const validateResult = validationResult(req);
  if (!validateResult.isEmpty()) {
    return res.status(400).json({
      status: "failed",
      message: "Validation error",
      errors: validateResult.array(),
    });
  }

  const { fullName, email, password } = req.body;

  const existingUser = USERS.find((user) => user.email === email);
  if (existingUser) {
    return res.status(400).json({ message: "Email sudah terdaftar" });
  }

  const id = USERS.length + 1;
  bcrypt.hash(password, 10, (err, hashedPassword) => {
    if (err) {
      return res.status(500).json({ message: "Internal Server Error" });
    }

    USERS.push({
      id,
      fullName,
      email,
      password: hashedPassword,
    });

    return res.status(201).json({
      status: "success",
      message: "Berhasil register",
      data: {
        id,
        fullName,
        email,
      },
    });
  });
});

router.post("/auth/login", loginValidator, (req, res) => {
  const validateResult = validationResult(req);
  if (!validateResult.isEmpty()) {
    return res.status(400).json({
      status: "failed",
      message: "Validation error",
      errors: validateResult.array(),
    });
  }

  const { email, password } = req.body;

  const user = USERS.find((user) => user.email === email);
  if (!user) {
    return res.status(401).json({ message: "Email tidak ditemukan" });
  }

  bcrypt.compare(password, user.password, (err, result) => {
    if (err || !result) {
      return res.status(401).json({ message: "Password tidak ditemukan" });
    }

    const tokenData = { id: user.id, email: user.email };

    return res.status(200).json({
      status: "success",
      message: "Login berhasil",
      data: {
        token: "YOUR_JWT_TOKEN_HERE",
      },
    });
  });
});

router.post("/auth/forgot-password",
  [
    body("email")
      .notEmpty()
      .withMessage("Email harus diisi")
      .isEmail()
      .withMessage("Email tidak valid"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email harus diisi" });
    }

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
      user.resetTokenExpires = new Date(Date.now() + 3600000); // Misalnya, token berlaku selama 1 jam
      await user.save();

      // Simpan OTP di database
      user.resetPasswordOTP = otp;
      await user.save();

      // Kirim OTP ke email pengguna
      const subject = "Reset Password OTP";
      const text = `OTP Anda untuk mereset password adalah: ${otp}`;
      await sendEmail(email, subject, text);

      return res.status(200).json({ message: "OTP dikirim ke email Anda" });
    } catch (error) {
      console.error("Error dalam endpoint lupa-password:", error);
      return res.status(500).json({ message: "Kesalahan Internal Server" });
    }
  }
);

router.get("/weather", async (req,res) => {

  try {
    const { q } = req.query;
    const apiKey = '8d78ae10347e47692718716fde207880';

    if (!q) {
      return res.status(400).json({ error: 'Nama kota (q) harus disertakan dalam permintaan.' });
    }

    // Mendapatkan data cuaca saat ini
    const currentWeatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(q)}&units=metric&appid=${apiKey}`;
    const currentWeatherResponse = await axios.get(currentWeatherUrl);

    // Check if the response contains an error message
    if (currentWeatherResponse.data.cod && currentWeatherResponse.data.message) {
      // Invalid API key or other error
      return res.status(currentWeatherResponse.data.cod).json({ error: currentWeatherResponse.data.message });
    }

    const currentWeatherData = currentWeatherResponse.data;

    // Mendapatkan waktu matahari terbit dan terbenam
    const sunrise = new Date(currentWeatherData.sys.sunrise * 1000).toLocaleTimeString();
    const sunset = new Date(currentWeatherData.sys.sunset * 1000).toLocaleTimeString();

    // Mendapatkan data perkiraan cuaca 5 hari ke depan
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(q)}&units=metric&appid=${apiKey}`;
    const forecastResponse = await axios.get(forecastUrl);
    const forecastData = forecastResponse.data;

    // Mendapatkan data cuaca per jam
    const hourlyWeatherUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(q)}&units=metric&appid=${apiKey}`;
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
    const hourlyWeatherList = hourlyWeatherData.list.slice(0, 4).map(hour => ({
    time: new Date(hour.dt * 1000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
    temperature: hour.main.temp,
    weatherDescription: hour.weather[0].description,
  }));

    // Menampilkan data perkiraan cuaca 5 hari ke depan
      const forecastList = forecastData.list.slice(0, 5).map(item => ({
      date: new Date(item.dt * 1000).toLocaleDateString(),
      temperature: item.main.temp,
      weatherDescription: item.weather[0].description,
      //humidity: item.main.humidity
    })); 



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

router.get("/weather2", async (req,res) => {

  try {
    const { q } = req.query; // Mengganti lat dan lon dengan q
    const apiKey = '8d78ae10347e47692718716fde207880'; // Gantilah dengan kunci API Anda

    if (!q) {
      return res.status(400).json({ error: 'Nama kota (q) harus disertakan dalam permintaan.' });
    }

    const apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(q)}&units=metric&appid=${apiKey}`;
    const response = await axios.get(apiUrl);
    const weatherData = response.data;

    // Menampilkan data suhu, cuaca, dan kelembaban dalam respons
    const temperature = weatherData.main.temp;
    const weatherDescription = weatherData.weather[0].description;
    const humidity = weatherData.main.humidity;
    const cityName = weatherData.name;

    const responseData = {
      city: cityName,
      temperature: temperature,
      weatherDescription: weatherDescription,
      humidity: humidity
    };

    res.json(responseData);
  } catch (error) {
    console.error('Terjadi kesalahan:', error);
    res.status(500).json({ error: 'Terjadi kesalahan dalam permintaan.' });
  }

});


module.exports = router;
