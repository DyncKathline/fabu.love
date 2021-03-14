const app = require("sequelize");
const sequelize = require('../helper/sequelize')
app.model = sequelize;
const { Op } = app;

const model = require("../database/model/team_members")(app);
model.removeAttribute('id');

module.exports = model;