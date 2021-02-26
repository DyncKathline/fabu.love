const { Sequelize } = require('sequelize');
const { sequelize: options } = require('../config');

const sequelize = new Sequelize(options);

module.exports = sequelize