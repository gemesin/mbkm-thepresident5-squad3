const express = require("express");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const bcrypt = require("bcrypt");
const app = express();
const secretKey = process.env.JWT_SECRET_KEY;
const registerValidator = require("./middlewares/register-validator");
const loginValidator = require("./middlewares/login-validator");
const { USERS } = require("./items"); 

app.use(express.json());

app.post("/auth/register", registerValidator, (req, res) => {
  const validateResult = validationResult(req);
  if (!validateResult.isEmpty()) {
    return res.status(400).json({
      status: "failed",
      message: "validation error",
      error: validateResult.array(),
    });
  }

  const { fullName, email, password } = req.body;

  const existingUser = USERS.find((user) => user.email === email);
  if (existingUser) {
    return res.status(400).json({ message: "Email sudah terdaftar" });
  }

  // Simpan data pengguna dengan password yang dienkripsi
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

app.post("/auth/login", loginValidator, (req, res) => {
  const validateResult = validationResult(req);
  if (!validateResult.isEmpty()) {
    return res.status(400).json({
      status: "failed",
      message: "validation error",
      error: validateResult.array(),
    });
  }

  const { email, password } = req.body;

  // Cari pengguna dengan email yang sesuai
  const user = USERS.find((user) => user.email === email);
  if (!user) {
    return res.status(401).json({ message: "Email tidak ditemukan" });
  }

  
  bcrypt.compare(password, user.password, (err, result) => {
    if (err || !result) {
      return res.status(401).json({ message: "Password tidak ditemukan" });
    }

    const tokenData = { id: user.id, email: user.email };
    const token = jwt.sign(tokenData, "rahasiaJWT");

    return res.status(200).json({
      message: "Success",
      data: {
        token: token,
      },
    });
  });
});




const port = 1945;

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
