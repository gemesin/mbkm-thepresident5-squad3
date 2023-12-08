const Sequelize = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  const Modul = sequelize.define('modul', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    judul: {
      type: DataTypes.STRING,
      allowNull: false
    },
    desc: {
        type: DataTypes.STRING,
        allowNull: false
    },
    tanggal: {
      type: DataTypes.STRING,
      allowNull: false
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false
    },
    learning_time: {
        type: DataTypes.STRING,
        allowNull: false
    },
    total_materi: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    listing_materi: {
      type: DataTypes.JSON,
      allowNull: false
    },
    covers: {
      type: DataTypes.STRING,
      allowNull: false
    }
  });

  return Modul;
};
