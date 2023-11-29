const Sequelize = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  const Weather = sequelize.define('weather', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    city: {
      type: DataTypes.STRING,
      allowNull: false
    },
    latitude: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    longitude: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    timestamp: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    temperature: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false
    },
    weatherDescription: {
      type: DataTypes.STRING,
      allowNull: false
    },
    humidity: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    dewPoint: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false
    },
    windSpeed: {
      type: DataTypes.STRING,
      allowNull: false
    },
    windDirection: {
      type: DataTypes.STRING,
      allowNull: false
    },
    sunrise: {
      type:  DataTypes.STRING,
      allowNull: false
    },
    sunset: {
      type:  DataTypes.STRING,
      allowNull: false
    },
    status: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    hourlyWeather: {
      type: DataTypes.JSON,
      allowNull: false
    },
    forecast: {
      type: DataTypes.JSON,
      allowNull: false
    },
    icon: {
      type: DataTypes.STRING,
      allowNull: false
    }
  });

  return Weather;
};