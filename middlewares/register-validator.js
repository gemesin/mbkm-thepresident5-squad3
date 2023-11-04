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
    .withMessage("Password harus memiliki minimal 1 simbol"
    ),
];

module.exports = registerValidator;
