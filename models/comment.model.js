module.exports = (sequelize, Sequelize) => {
  const User = require("./user.model")(sequelize, Sequelize);
  const Forum = require("./forum.model")(sequelize, Sequelize);
  const Comment = sequelize.define("comments", {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    id_user: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    id_forum: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    id_target: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },

    name: {
      type: Sequelize.STRING,
      allowNull: false,
    },

    comment: {
      type: Sequelize.TEXT,
      allowNull: true,
    },
    createdAt: {
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal("current_timestamp()"),
    },
    updatedAt: {
      type: Sequelize.DATE,
    },
  });

  // Definisikan hubungan antara Comment dan User
  Comment.belongsTo(User, {
    foreignKey: "id_user",
  });

  // Definisikan hubungan antara Comment dan Thread
  Comment.belongsTo(Forum, {
    foreignKey: "id_forum",
  });

  Comment.belongsTo(Forum, {
    foreignKey: "id_target",
  });

  return Comment;
};
