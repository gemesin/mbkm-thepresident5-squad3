const bcrypt = require("bcrypt");

const USERS = [
  {
    id: 1,
    fullName: "Bayu Setiawan",
    email: "bayu@skyshi.com",
    password: bcrypt.hashSync("Passw0rd!", 10), 
    bio: "Backend Developer @SkyshiDigitalIndonesia",
    dob: "1997-06-30",
  },
  {
    id: 2,
    fullName: "erlinaayu",
    email: "erlina@gmail.com",
    password: bcrypt.hashSync("Passw0rd!", 10), 
    bio: "Backend Developer @SkyshiDigitalIndonesia",
    dob: "1997-06-30",
  }
 
];

module.exports = {
  USERS,
};
