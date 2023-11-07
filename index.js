const express = require("express");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const bcrypt = require("bcrypt");
const app = express();
const secretKey = process.env.JWT_SECRET_KEY;
const registerValidator = require("./middlewares/register-validator");
const loginValidator = require("./middlewares/login-validator");
const { USERS } = require("./items"); 
const db = require('./models');
const { userModel } = require('./models');

app.use(express.json());

db.sequelize
    .authenticate()
    .then(() => {
        console.log('Koneksi ke database berhasil.');
    })
    .catch(err => {
        console.log('Gagal koneksi ke database: ', err);
    })

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

  const existingUser = await userModel.findOne({
    where: {
      email: email
    }
  })

  if (existingUser) {
    return res.status(400).json({ message: "Email sudah terdaftar" });
  }

  // Simpan data pengguna dengan password yang dienkripsi
  const id = await USERS.length + 1;
  bcrypt.hash(password, 10, (err, hashedPassword) => {
    if (err) {
      return res.status(500).json({ message: "Internal Server Error" });
    }

     userModel.create({
      fullName: fullName,
      email: email,
      password: hashedPassword
    });

    /*USERS.push({
      id,
      fullName,
      email,
      password: hashedPassword,
  
    }); */

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
      email: email
    }
  })
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




const port = 1945;

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
