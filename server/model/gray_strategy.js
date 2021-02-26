const app = require("sequelize");
const sequelize = require('../helper/sequelize')
app.model = sequelize;
const { Op } = app;

const model = require("../database/model/gray_strategy")(app);


module.exports = model;