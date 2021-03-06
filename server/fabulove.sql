/*
Navicat MySQL Data Transfer

Source Server         : localhost
Source Server Version : 50726
Source Host           : localhost:3306
Source Database       : fabulove

Target Server Type    : MYSQL
Target Server Version : 50726
File Encoding         : 65001

Date: 2021-03-15 11:51:07
*/

SET FOREIGN_KEY_CHECKS=0;

-- ----------------------------
-- Table structure for app
-- ----------------------------
DROP TABLE IF EXISTS `app`;
CREATE TABLE `app` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `appId` varchar(32) NOT NULL,
  `platform` varchar(16) NOT NULL DEFAULT '',
  `bundleId` varchar(64) NOT NULL DEFAULT '',
  `bundleName` varchar(32) NOT NULL DEFAULT '',
  `appName` varchar(32) NOT NULL DEFAULT '',
  `currentVersion` varchar(32) NOT NULL DEFAULT '',
  `creatorId` int(11) NOT NULL COMMENT 'user表id,创建者id',
  `creator` varchar(32) NOT NULL DEFAULT '' COMMENT 'user表username',
  `icon` varchar(255) NOT NULL DEFAULT '',
  `describe` varchar(255) NOT NULL DEFAULT '',
  `shortUrl` varchar(64) NOT NULL DEFAULT '',
  `autoPublish` tinyint(1) NOT NULL DEFAULT '0' COMMENT '是否自动发布，0：不自动发布 1：自动发布',
  `installWithPwd` tinyint(1) NOT NULL DEFAULT '0' COMMENT '是否下载需要密码，0：不需要 1：需要',
  `installPwd` varchar(16) NOT NULL DEFAULT '',
  `appLevel` varchar(16) NOT NULL DEFAULT '',
  `ownerId` int(11) NOT NULL COMMENT 'user表id,拥有者id',
  `changelog` varchar(255) NOT NULL DEFAULT '',
  `updateMode` int(11) NOT NULL DEFAULT '1' COMMENT 'update_mode表id',
  `releaseVersionCode` int(11) unsigned NOT NULL DEFAULT '0' COMMENT 'version表versionCode,当前对外发布的code号',
  `releaseVersionId` varchar(32) NOT NULL DEFAULT '0' COMMENT 'version表id，当前对外发布的最新版本号',
  `grayReleaseVersionId` varchar(32) NOT NULL DEFAULT '0' COMMENT 'version表id，当前对外发布的最新灰度版本号',
  `totalDownloadCount` bigint(20) NOT NULL DEFAULT '0' COMMENT '总下载量',
  `todayDownloadCount` bigint(20) NOT NULL DEFAULT '0' COMMENT '当天下载量',
  `grayStrategy` int(11) NOT NULL DEFAULT '0' COMMENT 'gray_strategy表id',
  `createTime` bigint(20) NOT NULL,
  `updateTime` bigint(20) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=2 DEFAULT CHARSET=utf8;

-- ----------------------------
-- Records of app
-- ----------------------------
INSERT INTO `app` VALUES ('1', '39652d61966f4701ba1e0aff8bff1995', 'android', 'com.innogx.launcher', '', '国翔创新教学设备', '4', '2', 'admin', 'upload\\2\\icon\\com.innogx.launcher_1.4_4_a.png', '', 'xstdd6', '0', '0', '', '', '2', '', '1', '0', '0', '0', '3', '3', '0', '1615779312179', '1615779312179');

-- ----------------------------
-- Table structure for app_download
-- ----------------------------
DROP TABLE IF EXISTS `app_download`;
CREATE TABLE `app_download` (
  `appId` varchar(32) NOT NULL,
  `versionId` varchar(32) NOT NULL,
  `data` bigint(20) NOT NULL,
  PRIMARY KEY (`appId`,`versionId`,`data`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

-- ----------------------------
-- Records of app_download
-- ----------------------------

-- ----------------------------
-- Table structure for download_code_image
-- ----------------------------
DROP TABLE IF EXISTS `download_code_image`;
CREATE TABLE `download_code_image` (
  `id` varchar(32) NOT NULL,
  `appId` varchar(32) NOT NULL,
  `remark` varchar(64) NOT NULL DEFAULT '',
  `page` varchar(32) NOT NULL DEFAULT '',
  `param` varchar(16) NOT NULL DEFAULT '',
  `image` varchar(64) NOT NULL DEFAULT '',
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

-- ----------------------------
-- Records of download_code_image
-- ----------------------------

-- ----------------------------
-- Table structure for gray_strategy
-- ----------------------------
DROP TABLE IF EXISTS `gray_strategy`;
CREATE TABLE `gray_strategy` (
  `id` varchar(32) NOT NULL COMMENT 'version表id',
  `ipType` int(11) NOT NULL DEFAULT '1' COMMENT 'ip_type表id',
  `ipList` varchar(255) NOT NULL DEFAULT '',
  `downloadCountLimit` int(11) NOT NULL DEFAULT '0',
  `updateMode` int(11) NOT NULL DEFAULT '1' COMMENT 'update_mode表id',
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

-- ----------------------------
-- Records of gray_strategy
-- ----------------------------

-- ----------------------------
-- Table structure for ip_type
-- ----------------------------
DROP TABLE IF EXISTS `ip_type`;
CREATE TABLE `ip_type` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(32) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=3 DEFAULT CHARSET=utf8;

-- ----------------------------
-- Records of ip_type
-- ----------------------------
INSERT INTO `ip_type` VALUES ('1', 'black');
INSERT INTO `ip_type` VALUES ('2', 'white');

-- ----------------------------
-- Table structure for message
-- ----------------------------
DROP TABLE IF EXISTS `message`;
CREATE TABLE `message` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `category` varchar(16) NOT NULL DEFAULT '' COMMENT '消息类型',
  `content` varchar(255) NOT NULL,
  `sender` int(11) NOT NULL COMMENT 'user表id,发送者的id',
  `receiver` int(11) NOT NULL COMMENT 'user表id,接受者的id',
  `sendTime` bigint(20) NOT NULL,
  `status` varchar(16) NOT NULL DEFAULT '1' COMMENT 'status表id',
  `data` varchar(255) NOT NULL DEFAULT '' COMMENT '消息中带有的data字段',
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=2 DEFAULT CHARSET=utf8;

-- ----------------------------
-- Records of message
-- ----------------------------
INSERT INTO `message` VALUES ('1', 'INVITE', 'admin邀请您加入我的团队团队.', '2', '1', '1615776568743', '1', '');

-- ----------------------------
-- Table structure for miniapp
-- ----------------------------
DROP TABLE IF EXISTS `miniapp`;
CREATE TABLE `miniapp` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `appId` varchar(64) NOT NULL,
  `platform` varchar(16) NOT NULL DEFAULT '',
  `appSecret` varchar(64) NOT NULL DEFAULT '',
  `appName` varchar(32) NOT NULL DEFAULT '',
  `currentVersion` varchar(32) NOT NULL DEFAULT '',
  `creatorId` int(11) NOT NULL COMMENT 'user表id,创建者id',
  `creator` varchar(32) NOT NULL DEFAULT '' COMMENT 'user表username',
  `icon` varchar(255) NOT NULL DEFAULT '',
  `describe` varchar(255) NOT NULL DEFAULT '',
  `autoPublish` tinyint(1) NOT NULL DEFAULT '0' COMMENT '是否自动发布，0：不自动发布 1：自动发布',
  `installWithPwd` tinyint(1) NOT NULL DEFAULT '0' COMMENT '是否下载需要密码，0：不需要 1：需要',
  `installPwd` varchar(16) NOT NULL DEFAULT '',
  `appLevel` varchar(16) NOT NULL DEFAULT '',
  `ownerId` int(11) NOT NULL COMMENT 'user表id,拥有者id',
  `changelog` varchar(255) NOT NULL DEFAULT '',
  `updateMode` int(11) NOT NULL DEFAULT '1' COMMENT 'update_mode表id',
  `releaseVersionCode` int(11) unsigned NOT NULL DEFAULT '0' COMMENT 'version表versionCode,当前对外发布的code号',
  `releaseVersionId` varchar(32) NOT NULL DEFAULT '0' COMMENT 'version表id，当前对外发布的最新版本号',
  `grayReleaseVersionId` varchar(32) NOT NULL DEFAULT '0' COMMENT 'version表id，当前对外发布的最新灰度版本号',
  `totalDownloadCount` bigint(20) NOT NULL DEFAULT '0' COMMENT '总下载量',
  `todayDownloadCount` bigint(20) NOT NULL DEFAULT '0' COMMENT '当天下载量',
  `grayStrategy` int(11) NOT NULL DEFAULT '0' COMMENT 'gray_strategy表id',
  `createTime` bigint(20) NOT NULL,
  `updateTime` bigint(20) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

-- ----------------------------
-- Records of miniapp
-- ----------------------------

-- ----------------------------
-- Table structure for status
-- ----------------------------
DROP TABLE IF EXISTS `status`;
CREATE TABLE `status` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(32) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=3 DEFAULT CHARSET=utf8;

-- ----------------------------
-- Records of status
-- ----------------------------
INSERT INTO `status` VALUES ('1', 'unread');
INSERT INTO `status` VALUES ('2', 'hasread');

-- ----------------------------
-- Table structure for team
-- ----------------------------
DROP TABLE IF EXISTS `team`;
CREATE TABLE `team` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `icon` varchar(255) NOT NULL DEFAULT '',
  `name` varchar(32) NOT NULL DEFAULT '',
  `creatorId` int(11) NOT NULL COMMENT 'user表id',
  `role` int(11) NOT NULL DEFAULT '1' COMMENT 'teams表id',
  `status` tinyint(1) NOT NULL DEFAULT '0' COMMENT '是否是默认创建，不可删除；0：不是默认 1：默认',
  `createTime` bigint(20) NOT NULL,
  PRIMARY KEY (`id`,`creatorId`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

-- ----------------------------
-- Records of team
-- ----------------------------

-- ----------------------------
-- Table structure for teams
-- ----------------------------
DROP TABLE IF EXISTS `teams`;
CREATE TABLE `teams` (
  `id` int(8) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(16) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=4 DEFAULT CHARSET=utf8;

-- ----------------------------
-- Records of teams
-- ----------------------------
INSERT INTO `teams` VALUES ('1', 'owner');
INSERT INTO `teams` VALUES ('2', 'manager');
INSERT INTO `teams` VALUES ('3', 'guest');

-- ----------------------------
-- Table structure for team_members
-- ----------------------------
DROP TABLE IF EXISTS `team_members`;
CREATE TABLE `team_members` (
  `teamId` int(11) NOT NULL,
  `userId` int(11) NOT NULL,
  `role` int(11) NOT NULL DEFAULT '1' COMMENT 'teams表id',
  PRIMARY KEY (`teamId`,`userId`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

-- ----------------------------
-- Records of team_members
-- ----------------------------

-- ----------------------------
-- Table structure for update_mode
-- ----------------------------
DROP TABLE IF EXISTS `update_mode`;
CREATE TABLE `update_mode` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(12) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=4 DEFAULT CHARSET=utf8;

-- ----------------------------
-- Records of update_mode
-- ----------------------------
INSERT INTO `update_mode` VALUES ('1', 'silent');
INSERT INTO `update_mode` VALUES ('2', 'normal');
INSERT INTO `update_mode` VALUES ('3', 'force');

-- ----------------------------
-- Table structure for user
-- ----------------------------
DROP TABLE IF EXISTS `user`;
CREATE TABLE `user` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `username` varchar(32) NOT NULL DEFAULT '' COMMENT '昵称',
  `password` varchar(64) NOT NULL DEFAULT '' COMMENT '密码',
  `email` varchar(32) NOT NULL DEFAULT '' COMMENT '邮箱',
  `mobile` varchar(12) NOT NULL DEFAULT '' COMMENT '手机',
  `qq` varchar(12) NOT NULL DEFAULT '',
  `company` varchar(64) NOT NULL DEFAULT '' COMMENT '公司',
  `career` varchar(32) NOT NULL DEFAULT '' COMMENT '职业',
  `apiToken` varchar(32) NOT NULL DEFAULT '',
  `createTime` bigint(20) NOT NULL DEFAULT '0' COMMENT '创建时间',
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

-- ----------------------------
-- Records of user
-- ----------------------------

-- ----------------------------
-- Table structure for version
-- ----------------------------
DROP TABLE IF EXISTS `version`;
CREATE TABLE `version` (
  `id` varchar(32) NOT NULL,
  `appId` varchar(32) NOT NULL COMMENT 'app表appId',
  `bundleId` varchar(32) NOT NULL,
  `icon` varchar(255) NOT NULL DEFAULT '',
  `versionStr` varchar(12) NOT NULL,
  `versionCode` int(11) NOT NULL,
  `uploader` varchar(32) NOT NULL,
  `uploaderId` int(11) NOT NULL COMMENT 'user表id',
  `size` int(11) NOT NULL DEFAULT '0',
  `active` tinyint(1) NOT NULL DEFAULT '0' COMMENT '是否激活，0：没激活 1：激活',
  `downloadUrl` varchar(125) NOT NULL DEFAULT '',
  `downloadCount` int(11) NOT NULL DEFAULT '0',
  `fileDownloadUrl` varchar(125) NOT NULL DEFAULT '',
  `installUrl` varchar(125) NOT NULL DEFAULT '',
  `showOnDownloadPage` tinyint(1) NOT NULL DEFAULT '0' COMMENT '是否显示下载页，0：不显示 1：显示',
  `appLevel` varchar(12) NOT NULL DEFAULT '',
  `changelog` varchar(255) NOT NULL DEFAULT '',
  `md5` varchar(32) NOT NULL DEFAULT '',
  `hidden` tinyint(1) NOT NULL DEFAULT '0' COMMENT '是否隐藏，0：不隐藏 1：隐藏',
  `updateMode` int(11) NOT NULL DEFAULT '2',
  `uploadTime` bigint(20) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

-- ----------------------------
-- Records of version
-- ----------------------------
