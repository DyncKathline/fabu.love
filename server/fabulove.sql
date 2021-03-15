/*
Navicat MySQL Data Transfer

Source Server         : localhost
Source Server Version : 50726
Source Host           : localhost:3306
Source Database       : fabulove

Target Server Type    : MYSQL
Target Server Version : 50726
File Encoding         : 65001

Date: 2021-03-15 10:24:20
*/

SET FOREIGN_KEY_CHECKS=0;

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
