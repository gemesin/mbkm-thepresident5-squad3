const jwt = require("jsonwebtoken");
const { userModel } = require('../models');
const secretKey = process.env.JWT_SECRET_KEY;

const protect = async (req, res, next) => {
const token = req.headers['x-api-key'];

  if (token) {
    try {
      const verify = jwt.verify(token, "rahasia");
      const user = await userModel.findOne({ where: { id: verify.id, email: verify.email } });

      
      if (user) {
        delete user.password; // Menghapus password sebelum melanjutkan
        req.user = user;
        next(); // Lanjutkan ke middleware selanjutnya
      } else {
        return res.status(401).json({ message: "User not found" });
      }
    } catch (err) {
      return res.status(401).json({ message: "Token is invalid" });
    }
  } else {
    return res.status(401).json({ message: "Token not found" });
  }
};

module.exports = { protect };
