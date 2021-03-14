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
    username: {
      type: DataTypes.STRING(32),
      allowNull: false,
      defaultValue: "",
      primaryKey: false,
      autoIncrement: false,
      comment: "昵称",
      field: "username"
    },
    password: {
      type: DataTypes.STRING(64),
      allowNull: false,
      defaultValue: "",
      primaryKey: false,
      autoIncrement: false,
      comment: "密码",
      field: "password"
    },
    email: {
      type: DataTypes.STRING(32),
      allowNull: false,
      defaultValue: "",
      primaryKey: false,
      autoIncrement: false,
      comment: "邮箱",
      field: "email"
    },
    mobile: {
      type: DataTypes.STRING(12),
      allowNull: false,
      defaultValue: "",
      primaryKey: false,
      autoIncrement: false,
      comment: "手机",
      field: "mobile"
    },
    qq: {
      type: DataTypes.STRING(12),
      allowNull: false,
      defaultValue: "",
      primaryKey: false,
      autoIncrement: false,
      comment: null,
      field: "qq"
    },
    company: {
      type: DataTypes.STRING(64),
      allowNull: false,
      defaultValue: "",
      primaryKey: false,
      autoIncrement: false,
      comment: "公司",
      field: "company"
    },
    career: {
      type: DataTypes.STRING(32),
      allowNull: false,
      defaultValue: "",
      primaryKey: false,
      autoIncrement: false,
      comment: "职业",
      field: "career"
    },
    apiToken: {
      type: DataTypes.STRING(32),
      allowNull: false,
      defaultValue: null,
      primaryKey: false,
      autoIncrement: false,
      comment: null,
      field: "apiToken"
    },
    createTime: {
      type: DataTypes.BIGINT,
      allowNull: false,
      defaultValue: "0",
      primaryKey: false,
      autoIncrement: false,
      comment: "创建时间",
      field: "createTime"
    }
  };
  const options = {
    tableName: "user",
    comment: "",
    indexes: []
  };
  const UserModel = sequelize.define("user_model", attributes, options);
  return UserModel;
};