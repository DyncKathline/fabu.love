'use strict';

module.exports = app => {
  const DataTypes = app.Sequelize;
  const sequelize = app.model;
  const attributes = {
    userId: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      defaultValue: null,
      primaryKey: true,
      autoIncrement: false,
      comment: null,
      field: "userId"
    },
    teamId: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      defaultValue: null,
      primaryKey: true,
      autoIncrement: false,
      comment: null,
      field: "teamId"
    }
  };
  const options = {
    tableName: "user_team",
    comment: "",
    indexes: []
  };
  const UserTeamModel = sequelize.define("user_team_model", attributes, options);
  return UserTeamModel;
};