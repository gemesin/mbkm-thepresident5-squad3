const { body } = require("express-validator");

const resetPasswordValidator = [
  body("email")
    .notEmpty()
    .withMessage("Email harus diisi")
    .isEmail()
    .withMessage("Email tidak valid"),
  body("otp")
    .notEmpty()
    .withMessage("OTP harus diisi"),
  body("newPassword")
    .notEmpty()
    .withMessage("Password baru harus diisi")
    .isLength({ min: 8 })
    .withMessage("Password minimal 8 karakter")
    .matches(/[\W]/)
    .withMessage("Password harus memiliki minimal 1 simbol"),
];

module.exports = resetPasswordValidator;
