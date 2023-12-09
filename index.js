const express = require("express");
const app = express();
const { USERS } = require("./items");
const db = require("./models");
const { userModel } = require("./models");

const authRoutes = require("./routes/auth.routes");
const weatherRoutes = require("./routes/weather.routes");
const artikelRoutes = require("./routes/artikel.routes");
const lmsRoutes = require("./routes/lms.routes");
const forumRoute = require('./routes/forum.routes');
const uploadImages = require("./routes/upload.route");


app.use(express.json());

db.sequelize
  .authenticate()
  .then(() => {
    console.log("Koneksi ke database berhasil.");
  })
  .catch((err) => {
    console.log("Gagal koneksi ke database: ", err);
  });


app.use("/auth", authRoutes);
app.use("/weather", weatherRoutes);
app.use("/artikel", artikelRoutes);
app.use("/lms", lmsRoutes);
app.use('/covers',express.static('covers'))
app.use("/upload",uploadImages);
app.use("/forum",forumRoute);
app.use('/images',express.static('images'))

const port = 8003;

app.listen(port, () => {
  console.log(`server starter on port ${port}`);
});
