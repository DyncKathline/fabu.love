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
      comment: null,
      field: "id"
    },
    appId: {
      type: DataTypes.STRING(32),
      allowNull: false,
      defaultValue: null,
      primaryKey: false,
      autoIncrement: false,
      comment: "app表appId",
      field: "appId"
    },
    bundleId: {
      type: DataTypes.STRING(32),
      allowNull: false,
      defaultValue: null,
      primaryKey: false,
      autoIncrement: false,
      comment: null,
      field: "bundleId"
    },
    icon: {
      type: DataTypes.STRING(255),
      allowNull: false,
      defaultValue: null,
      primaryKey: false,
      autoIncrement: false,
      comment: null,
      field: "icon"
    },
    versionStr: {
      type: DataTypes.STRING(12),
      allowNull: false,
      defaultValue: null,
      primaryKey: false,
      autoIncrement: false,
      comment: null,
      field: "versionStr"
    },
    versionCode: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      defaultValue: null,
      primaryKey: false,
      autoIncrement: false,
      comment: null,
      field: "versionCode"
    },
    uploader: {
      type: DataTypes.STRING(32),
      allowNull: false,
      defaultValue: null,
      primaryKey: false,
      autoIncrement: false,
      comment: null,
      field: "uploader"
    },
    uploaderId: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      defaultValue: null,
      primaryKey: false,
      autoIncrement: false,
      comment: "user表id",
      field: "uploaderId"
    },
    size: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      defaultValue: "0",
      primaryKey: false,
      autoIncrement: false,
      comment: null,
      field: "size"
    },
    active: {
      type: DataTypes.INTEGER(1),
      allowNull: false,
      defaultValue: "0",
      primaryKey: false,
      autoIncrement: false,
      comment: "是否激活，0：没激活 1：激活",
      field: "active"
    },
    downloadUrl: {
      type: DataTypes.STRING(125),
      allowNull: false,
      defaultValue: "",
      primaryKey: false,
      autoIncrement: false,
      comment: null,
      field: "downloadUrl"
    },
    downloadCount: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      defaultValue: "0",
      primaryKey: false,
      autoIncrement: false,
      comment: null,
      field: "downloadCount"
    },
    fileDownloadUrl: {
      type: DataTypes.STRING(125),
      allowNull: false,
      defaultValue: "",
      primaryKey: false,
      autoIncrement: false,
      comment: null,
      field: "fileDownloadUrl"
    },
    installUrl: {
      type: DataTypes.STRING(125),
      allowNull: false,
      defaultValue: "",
      primaryKey: false,
      autoIncrement: false,
      comment: null,
      field: "installUrl"
    },
    showOnDownloadPage: {
      type: DataTypes.INTEGER(1),
      allowNull: false,
      defaultValue: "0",
      primaryKey: false,
      autoIncrement: false,
      comment: "是否显示下载页，0：不显示 1：显示",
      field: "showOnDownloadPage"
    },
    appLevel: {
      type: DataTypes.STRING(12),
      allowNull: false,
      defaultValue: "",
      primaryKey: false,
      autoIncrement: false,
      comment: null,
      field: "appLevel"
    },
    changelog: {
      type: DataTypes.STRING(255),
      allowNull: false,
      defaultValue: "",
      primaryKey: false,
      autoIncrement: false,
      comment: null,
      field: "changelog"
    },
    md5: {
      type: DataTypes.STRING(32),
      allowNull: false,
      defaultValue: "",
      primaryKey: false,
      autoIncrement: false,
      comment: null,
      field: "md5"
    },
    hidden: {
      type: DataTypes.INTEGER(1),
      allowNull: false,
      defaultValue: "0",
      primaryKey: false,
      autoIncrement: false,
      comment: "是否隐藏，0：不隐藏 1：隐藏",
      field: "hidden"
    },
    updateMode: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      defaultValue: "2",
      primaryKey: false,
      autoIncrement: false,
      comment: null,
      field: "updateMode"
    },
    uploadTime: {
      type: DataTypes.BIGINT,
      allowNull: false,
      defaultValue: null,
      primaryKey: false,
      autoIncrement: false,
      comment: null,
      field: "uploadTime"
    }
  };
  const options = {
    tableName: "version",
    comment: "",
    indexes: []
  };
  const VersionModel = sequelize.define("version_model", attributes, options);
  return VersionModel;
};