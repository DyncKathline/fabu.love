'use strict';

module.exports = app => {
  const DataTypes = app.Sequelize;
  const sequelize = app.model;
  const attributes = {
    id: {
      type: DataTypes.INTEGER(11).UNSIGNED,
      allowNull: false,
      defaultValue: null,
      primaryKey: true,
      autoIncrement: true,
      comment: null,
      field: "id"
    },
    icon: {
      type: DataTypes.STRING(255),
      allowNull: false,
      defaultValue: "",
      primaryKey: false,
      autoIncrement: false,
      comment: null,
      field: "icon"
    },
    name: {
      type: DataTypes.STRING(32),
      allowNull: false,
      defaultValue: "",
      primaryKey: false,
      autoIncrement: false,
      comment: null,
      field: "name"
    },
    creatorId: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      defaultValue: null,
      primaryKey: true,
      autoIncrement: false,
      comment: "user表id",
      field: "creatorId"
    },
    role: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      defaultValue: "1",
      primaryKey: false,
      autoIncrement: false,
      comment: "teams表id",
      field: "role"
    },
    status: {
      type: DataTypes.INTEGER(1),
      allowNull: false,
      defaultValue: "0",
      primaryKey: false,
      autoIncrement: false,
      comment: "是否是默认创建，不可删除；0：不是默认 1：默认",
      field: "status"
    },
    createTime: {
      type: DataTypes.BIGINT,
      allowNull: false,
      defaultValue: null,
      primaryKey: false,
      autoIncrement: false,
      comment: null,
      field: "createTime"
    }
  };
  const options = {
    tableName: "team",
    comment: "",
    indexes: []
  };
  const TeamModel = sequelize.define("team_model", attributes, options);
  return TeamModel;
};