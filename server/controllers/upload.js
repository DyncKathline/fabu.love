import {
    request,
    summary,
    body,
    tags,
    middlewares,
    description,
    formData,
    responses,
    query,
    path as rpath
} from '../swagger';
import config from '../config';
const { Op } = require("sequelize");
const Team = require('../model/team')
const Version = require('../model/version')
const App = require('../model/app')
const multer = require('koa-multer');
const fs = require('fs')
const crypto = require('crypto')
const path = require('path')
const os = require('os')
const mime = require('mime')
const uuidV4 = require('uuid/v4')
const etl = require('etl')
const mkdirp = require('mkdirp')
const AppInfoParser = require('app-info-parser')
const { compose, maxBy, filter, get } = require('lodash/fp')

const { writeFile, readFile, responseWrapper, exec } = require('../helper/util')

const tempDir = path.join(config.fileDir, 'temp')
const uploadDir = path.join(config.fileDir, 'upload')

createFolderIfNeeded(tempDir)

const uploadPrefix = "upload";

function createFolderIfNeeded(path) {
    if (!fs.existsSync(path)) {
        mkdirp.sync(path, function (err) {
            if (err) console.error(err)
        })
    }
}

const storage = multer.diskStorage({
    destination: tempDir,
    filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});

const tag = tags(['上传']);
const upload = multer({ storage });

module.exports = class UploadRouter {
    @request('post', '/api/apps/{teamId}/upload')
    @summary('上传apk或者ipa文件到服务器')
    @tag
    @formData({
        file: {
            type: 'file',
            required: 'true',
            description: 'upload file, get url'
        }
    })
    @rpath({ teamId: { type: 'string', required: true } })
    @middlewares([upload.single('file')])
    static async upload(ctx, next) {
        const file = ctx.req.file;
        const { teamId } = ctx.validatedParams;
        const team = await Team.findOne({
            where: {
                id: teamId
            }
        })
        if (!team) {
            ctx.body = responseWrapper(false, "没有找到该团队");
            return;
        }
        const result = await parseAppAndInsertToDB(file, ctx.state.user.data, team);
        if(result.status) {
            // ctx.status = result.status;
            ctx.body = responseWrapper(false, result.msg);
            return;
        }
        await Version.update({
            released: result.app.autoPublish
        }, {
            where: {
                id: result.version.id
            }
        });
        if (result.app.autoPublish) {
            await App.updateOne({ id: result.app.id }, {
                releaseVersionId: result.version.id,
                releaseVersionCode: result.version.versionCode
            })
        }
        ctx.body = responseWrapper(result);
    }

    static async download(ctx, next) {
        const { body } = ctx.request
        var file = __dirname + ''
        var filename = path.basename(file)
        var mimetype = mime.lookup(file)
        ctx.body = await fs.createReadStream(__dirname, '/')
        ctx.set('Content-disposition',
            'attachment; filename=' + filename)
        ctx.set('Content-type', mimetype)
    }
}

async function parseAppAndInsertToDB(file, user, team) {
    let filePath = file.path;
    let parser;
    if (path.extname(filePath) === ".ipa") {
        parser = parseIpa;
    } else if (path.extname(filePath) === ".apk") {
        parser = parseApk;
    } else {
        // throw (new Error("文件类型有误,仅支持IPA或者APK文件的上传."));
        return {
            status: 408,
            msg: '文件类型有误,仅支持IPA或者APK文件的上传.'
        }
    }

    //解析ipa和apk文件
    let info = await parser(filePath);
    // console.log('app info ----> ', info)
    let fileName = info.bundleId + "_" + info.versionStr + "_" + info.versionCode;

    //解析icon图标
    let icon = await extractor(info.icon, fileName, team);

    //移动文件到对应目录
    let fileRelatePath = path.join(team.id + "", info.platform);
    createFolderIfNeeded(path.join(uploadDir, fileRelatePath));
    let fileRealPath = path.join(uploadDir, fileRelatePath, fileName + path.extname(filePath));

    //获取文件MD5值
    let buffer = fs.readFileSync(filePath);
    let fsHash = crypto.createHash('md5');
    fsHash.update(buffer);
    let filemd5 = fsHash.digest('hex');

    //异步保存问题（避免跨磁盘移动问题）
    let readStream = fs.createReadStream(filePath);
    let writeStream = fs.createWriteStream(fileRealPath);
    readStream.pipe(writeStream);
    readStream.on('end', function () {
        fs.unlinkSync(filePath);
    });

    info.downloadUrl = path.join(uploadPrefix, fileRelatePath, fileName + path.extname(filePath));

    let app = await App.findOne({
        where: {
            'platform': info['platform'],
            'bundleId': info['bundleId'],
            'ownerId': team.id
        }
    });
    const now = Date.now();
    if (!app) {
        info.creator = user.username;
        info.creatorId = user.id;
        info.icon = path.join(uploadPrefix, icon.fileName);
        info.shortUrl = Math.random().toString(36).substring(2, 5) + Math.random().toString(36).substring(2, 5);
        app = Object.assign({}, info);
        app.appId = uuidV4().replace(/-/g, "");
        app.ownerId = team.id;
        app.currentVersion = info.versionCode;
        app.createTime = now;
        app.updateTime = now;
        const { id } = await App.create(app);

        info.uploader = user.username;
        info.uploaderId = user.id;
        info.size = fs.statSync(filePath).size;

        let version = Object.assign({}, info);
        version.id = uuidV4().replace(/-/g, "");
        version.appId = app.appId;
        version.md5 = filemd5;
        version.uploadTime = now;
        if (app.platform == 'ios') {
            version.installUrl = mapInstallUrl(app.id, version.id);
        } else {
            version.installUrl = info.downloadUrl;
        }
        const { id: versionId } = await Version.create(version);
        return { 'app': app, 'version': version };
    }
    let version = await Version.findOne({
        where: {
            appId: app.id,
            versionCode: info.versionCode
        }
    });
    if (!version) {
        info.uploader = user.username;
        info.uploaderId = user.id;
        info.icon = path.join(uploadPrefix, icon.fileName);
        info.size = fs.statSync(filePath).size;

        let version = Object.assign({}, info);
        version.id = uuidV4().replace(/-/g, "");
        version.appId = app.appId;
        version.md5 = filemd5;
        version.uploadTime = now;
        if (app.platform == 'ios') {
            version.installUrl = mapInstallUrl(app.id, version.id);
        } else {
            version.installUrl = `${config.baseUrl}/${info.downloadUrl}`;
        }
        const { id: versionId } = await Version.create(version);
        
        const { id } = await App.update({
            currentVersion: info.versionCode
        }, {
            where: {
                appId: version.appId
            }
        });

        return { 'app': app, 'version': version };
    } else {
        return {
            status: 408,
            msg: '当前版本已存在'
        }
    }
}

///映射可安装的app下载地址
function mapInstallUrl(appId, versionId) {
    return `itms-services://?action=download-manifest&url=${config.baseUrl}/api/plist/${appId}/${versionId}`
}

///移动相关信息到指定目录
function storeInfo(filename, guid) {
    var new_path
    if (path.extname(filename) === '.ipa') {
        new_path = path.join(ipasDir, guid + '.ipa')
    } else if (path.extname(filename) === '.apk') {
        new_path = path.join(apksDir, guid + '.apk')
    }
    fs.rename(filename, new_path)
}

///解析ipa
function parseIpa(filename) {
    const parser = new AppInfoParser(filename)

    return new Promise((resolve, reject) => {
        parser.parse().then(result => {
            console.log('app info ----> ', result)
            // console.log('icon base64 ----> ', result.icon)

            var info = {}
            info.platform = 'ios'
            info.bundleId = result.CFBundleIdentifier
            info.bundleName = result.CFBundleName
            info.appName = result.CFBundleDisplayName
            info.versionStr = result.CFBundleShortVersionString
            info.versionCode = result.CFBundleVersion
            info.iconName = result.CFBundleIcons.CFBundlePrimaryIcon.CFBundleIconName
            info.icon = result.icon
            try {
                const environment = result.mobileProvision.Entitlements['aps-environment']
                const active = result.mobileProvision.Entitlements['beta-reports-active']
                if (environment == 'production') {
                    info.appLevel = active ? 'appstore' : 'enterprise'
                } else {
                    info.appLevel = 'develop'
                }
            } catch (err) {
                info.appLevel = 'develop'
                // reject("应用未签名,暂不支持")
            }
            resolve(info)
        })

    })
}

///解析apk
function parseApk(filename) {
    const parser = new AppInfoParser(filename)

    return new Promise((resolve, reject) => {
        parser.parse().then(result => {
            // console.log('app info ----> ', result)
            // console.log('icon base64 ----> ', result.icon)
            // console.log('====================================', JSON.stringify(result));
            var label = undefined

            if (result.application && result.application.label && result.application.label.length > 0) {
                label = result.application.label[0]
            }

            if (label) {
                label = label.replace(/'/g, '')
            }
            var appName = (result['application-label'] || result['application-label-zh-CN'] || result['application-label-es-US'] ||
                result['application-label-zh_CN'] || result['application-label-es_US'] || label || 'unknown')

            var info = {
                'appName': appName.replace(/'/g, ''),
                'icon': result.icon,
                'versionCode': Number(result.versionCode),
                'bundleId': result.package,
                'versionStr': result.versionName,
                'platform': 'android'
            }
            resolve(info)
        }).catch(err => {
            console.log('err ----> ', err)
        })
    })
}

///解析apk or ipa icon
function extractor(imgData, guid, team) {
    return new Promise((resolve, reject) => {
        let dir = path.join(uploadDir, team.id + "", "icon")
        let realPath = path.join(team.id + "", "icon", '/{0}_a.png'.format(guid))
        createFolderIfNeeded(dir)
        let tempOut = path.join(uploadDir, realPath)

        let base64Data = imgData.replace(/^data:image\/\w+;base64,/, "");
        let dataBuffer = new Buffer(base64Data, 'base64');
        fs.writeFile(tempOut, dataBuffer, function (err) {
            if (err) {
                resolve({ 'success': false, fileName: realPath })
            } else {
                resolve({ 'success': true, fileName: realPath })
            }
        });
    })
}

///格式化输入字符串 /用法: "node{0}".format('.js'), 返回'node.js'
String.prototype.format = function () {
    var args = arguments
    return this.replace(/\{(\d+)\}/g, function (s, i) {
        return args[i]
    })
}

function parseText(text) {
    var regx = /(\w+)='([\S]+)'/g
    var match = null;
    var result = {}
    while (match = regx.exec(text)) {
        result[match[1]] = match[2]
    }
    return result
}