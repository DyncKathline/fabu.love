'use strict';

module.exports = app => {
  const DataTypes = app.Sequelize;
  const sequelize = app.model;
  const attributes = {
    teamId: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      defaultValue: null,
      primaryKey: true,
      autoIncrement: false,
      comment: null,
      field: "teamId"
    },
    userId: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      defaultValue: null,
      primaryKey: true,
      autoIncrement: false,
      comment: null,
      field: "userId"
    },
    role: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      defaultValue: "1",
      primaryKey: false,
      autoIncrement: false,
      comment: "teams表id",
      field: "role"
    }
  };
  const options = {
    tableName: "team_members",
    comment: "",
    indexes: []
  };
  const TeamMembersModel = sequelize.define("team_members_model", attributes, options);
  return TeamMembersModel;
};