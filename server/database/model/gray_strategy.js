'use strict';

module.exports = app => {
  const DataTypes = app.Sequelize;
  const sequelize = app.model;
  const attributes = {
    id: {
      type: DataTypes.STRING(32),
      allowNull: false,
      defaultValue: null,
      primaryKey: true,
      autoIncrement: false,
      comment: "version表id",
      field: "id"
    },
    ipType: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      defaultValue: "1",
      primaryKey: false,
      autoIncrement: false,
      comment: "ip_type表id",
      field: "ipType"
    },
    ipList: {
      type: DataTypes.STRING(255),
      allowNull: false,
      defaultValue: "",
      primaryKey: false,
      autoIncrement: false,
      comment: null,
      field: "ipList"
    },
    downloadCountLimit: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      defaultValue: "0",
      primaryKey: false,
      autoIncrement: false,
      comment: null,
      field: "downloadCountLimit"
    },
    updateMode: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      defaultValue: "1",
      primaryKey: false,
      autoIncrement: false,
      comment: "update_mode表id",
      field: "updateMode"
    }
  };
  const options = {
    tableName: "gray_strategy",
    comment: "",
    indexes: []
  };
  const GrayStrategyModel = sequelize.define("gray_strategy_model", attributes, options);
  return GrayStrategyModel;
};