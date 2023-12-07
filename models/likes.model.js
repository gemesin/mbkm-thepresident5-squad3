module.exports = (sequelize, Sequelize) => {
  const User = require("./user.model")(sequelize, Sequelize);
  const Forum = require("./forum.model")(sequelize, Sequelize);
  const Likes = sequelize.define("likes", {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },
    id_user: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    id_post: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    id_target: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    liked: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true, // True for 'like', False for 'unlike'
    },
    liked_by: {
      type: Sequelize.STRING, // Simpan nama pengguna yang melakukan like
      allowNull: true,
    },
  });

   // Definisikan hubungan antara Comment dan User
   Likes.belongsTo(User, {
    foreignKey: "id_user",
  });

  // Definisikan hubungan antara Comment dan Thread
  Likes.belongsTo(Forum, {
    foreignKey: "id_post",
  });

  Likes.belongsTo(Forum, {
    foreignKey: "id_target",
  });
 
  return Likes;
};
