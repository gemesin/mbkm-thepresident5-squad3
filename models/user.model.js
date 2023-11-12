const Sequelize = require('sequelize');

module.exports = (sequelize, Sequelize) => {
    const User = sequelize.define('register_user', {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            allowNull: false,
            autoIncrement: true
        },
        fullName: {
            type: Sequelize.STRING
        },
        email: {
            type: Sequelize.STRING
        },
        password: {
            type: Sequelize.STRING
        },
        resetToken: {
            type: Sequelize.STRING,
        },
        resetTokenExpires: {
            type: Sequelize.DATE,
        },
    });

    return User;
}