const app = require("sequelize");
const sequelize = require('../helper/sequelize');
app.model = sequelize;
const { Op } = app;

const model = require("../database/model/app")(app);


module.exports = model;