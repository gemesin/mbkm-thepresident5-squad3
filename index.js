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

app.use(express.json());

db.sequelize
  .authenticate()
  .then(() => {
    console.log("Koneksi ke database berhasil.");
  })
  .catch((err) => {
    console.log("Gagal koneksi ke database: ", err);
  });

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

    return res.status(201).json({
      status: "success",
      message: "Berhasil register",
      data: createUser,
    });
  } catch (error) {
    console.error(error);
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

const port = 8003;

app.listen(port, () => {
  console.log(`server starter on port ${port}`);
});
