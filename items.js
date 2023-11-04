const bcrypt = require("bcrypt");

const USERS = [
  {
    id: 1,
    fullName: "Bayu Setiawan",
    email: "bayu@skyshi.com",
    password: bcrypt.hashSync("Passw0rd!", 10), 
  },
  {
    id: 2,
    fullName: "chillicare",
    email: "chilli@gmail.com",
    password: bcrypt.hashSync("Passw0rd!", 10), 
  }
 
];

module.exports = {
  USERS,
};
