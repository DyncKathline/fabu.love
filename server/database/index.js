const { sequelize:dev } = require("../config")
const { dialect, database, host, port, username, password } = {
  ...dev
};

module.exports = {
  dbOptions: {
    database,
    username,
    password,
    dialect,
    host,
    port,
    logging: false
  },
  options: {
    type: "egg",
    dir: "./database/model"
  }
};
