const { body } = require("express-validator");

const registerValidator = [
  body("fullName").notEmpty().withMessage("harus diisi"),
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
  body("dob")
    .notEmpty()
    .withMessage("Tanggal lahir wajib diisi")
    .isISO8601()
    .withMessage(
      "Format tanggal lahir tidak valid. Gunakan format YYYY-MM-DD."
    ),
];

module.exports = registerValidator;
