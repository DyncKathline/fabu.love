const app = require("sequelize");
const sequelize = require('../helper/sequelize')
app.model = sequelize;
const { Op } = app;

const model = require("../database/model/user")(app);

//   model.login = (username) => {
//     return model.findOne({
//       where: {
//         [Op.or]: [{ username }],
//         deleted: 0
//       }
//     });
//   };

//   model.getList = (paging = { limit, offset }) => {
//     // { count, rows }
//     return model.findAndCountAll({
//       ...paging,
//       where: { deleted: 0 },
//       attributes: {
//         exclude: ["pwd", "salt", "deleted"]
//       }
//     });
//   };

//   model.getUserById = (id) => {
//     return model.findOne({
//       where: { id, deleted: 0 },
//       attributes: {
//         // 排除`id`字段
//         exclude: ["pwd", "salt", "deleted"]
//       }
//     });
//   };

module.exports = model;
