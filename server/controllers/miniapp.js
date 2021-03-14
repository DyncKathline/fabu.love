import {
    request,
    summary,
    body,
    tags,
    middlewares,
    path,
    query,
    description
} from '../swagger';
import fs from 'fs';
import config from '../config'
import { APIError } from "../helper/rest";
import { getIp, responseWrapper } from "../helper/util";
import fpath from 'path';
import mustache from 'mustache';
import _ from 'lodash'

const { Op } = require("sequelize");
const Miniapp = require('../model/miniapp');
const DownloadCodeImage = require('../model/download_code_image');
const Team = require('../model/team');
const TeamMembers = require('../model/team_members');
const AppDownload = require('../model/app_download');

const axios = require('axios');
const tag = tags(['MiniAppResource']);
const mkdirp = require('mkdirp')
const uuidv1 = require('uuid/v1');
const uuidV4 = require('uuid/v4');

//更新策略

// {
//     updateMode:{type:String,enum:['slient','normal','force']},
//     ipType:{type:String,default:'black',enum:['black','white']},
//     ipList:[String],
//     downloadCountLimit:Number
// }

var grayRelease = {
    strategy: {
        'updateMode': { type: 'string' }, //更新模式  force / silent / normal/ 强制或者静默或者普通升级
        'ipType': { type: 'string' }, //IP地址限制类型 {type:String,default:'black',enum:['black','white']},
        'ipList': { type: 'string' }, //ip地址列表
        'downloadCountLimit': { type: 'number' } //default 0 表示不现在下载次数
    },
    version: {
        versionId: { type: 'string', require: true },
        versionCode: { type: 'string', require: true },
        release: { type: 'bool', require: true }
    }
}

var versionProfile = {
    'installUrl': 'string', //更新文件的安装地址
    'showOnDownloadPage': 'boolean', //是否显示到下载页
    'changelog': 'string', //修改日志
    'updateMode': { type: 'string' } //更新模式  force / silent / normal/ 强制或者静默或者普通升级
}

var appProfile = {
    'shortUrl': 'string', //应用短连接
    'installWithPwd': 'boolean', //应用安装是否需要密码
    'installPwd': 'string', //应用安装的密码
    'autoPublish': 'boolean' //新版本自动发布
}

module.exports = class MiniAppRouter {
    @request('post', '/api/miniapps/create')
    @summary("创建一个小程序")
    @body({
        name: { type: 'string', require: true },
        appId: { type: 'string', require: true, description: "小程序的appid" },
        appSecret: { type: 'string', require: true, description: "小程序的appSecret" },
        teamId: { type: 'string', require: true, description: "团队id,表示创建到哪个团队下" },
    })
    @tag
    static async createMiniApp(ctx, next) {
        // const page = ctx.query.page || 0
        // const size = ctx.query.size || 10
        const user = ctx.state.user.data;
        const body = ctx.request.body;

        const now = Date.now();
        const content = {
            platform: 'wx',
            creator: user.username,
            creatorId: user.id,
            appName: body.name,
            appId: body.appId,
            appSecret: body.appSecret,
            ownerId: body.teamId,
            createTime: now,
            updateTime: now
        }

        const app = await Miniapp.create(content);
        // .limit(size).skip(page * size)
        ctx.body = responseWrapper(app);
    }

    @request('get', '/api/miniapps/{teamId}/{id}')
    @summary("获取某个小程序详情")
    @tag
    @path({
        teamId: { type: 'string' },
        id: { type: 'string', description: '应用id' }
    })
    static async getMiniAppDetail(ctx, next) {
        const user = ctx.state.user.data
        const { teamId, id } = ctx.validatedParams;
        //todo: 这里其实还要判断该用户在不在team中
        //且该应用也在team中,才有权限查看
        const app = await Miniapp.findOne({
            where: {
                id
            }
        });
        const downloadCodeInfo = await DownloadCodeImage.findAll({
            where: {
                appId: app.appId
            }
        });
        app.downloadCodeImage = downloadCodeInfo;
        ctx.body = responseWrapper(app);
    }

    @request('delete', '/api/miniapps/{teamId}/{id}')
    @summary("删除某个小程序应用")
    @tag
    @path({
        teamId: { type: 'string' },
        id: { type: 'string', description: '应用id' }
    })
    static async deleteMiniApp(ctx, next) {
        const user = ctx.state.user.data
        const { teamId, id } = ctx.validatedParams;

        const team = await Team.findOne({
            where: {
                id: teamId,
                creatorId: user.id
            }
        });
        const app = await Miniapp.findOne({
            where: { id: id, ownerId: team.id }
        });
        if (!app) {
            ctx.body = responseWrapper(false, '应用不存在或您没有权限查询该应用');
            return;
        }
        await Miniapp.destroy({
            where: { id: app.id }
        });
        ctx.body = responseWrapper(true, "应用已删除");
    }

    @request('get', '/api/miniapps/{teamId}')
    @summary("获取团队下小程序列表")
    // @query(
    //     {
    //     page:{type:'number',default:0,description:'分页页码(可选)'},
    //     size:{type:'number',default:10,description:'每页条数(可选)'}
    // })
    @path({ teamId: { type: 'string', description: '团队id' } })
    @tag
    static async getApps(ctx, next) {
        // const page = ctx.query.page || 0
        // const size = ctx.query.size || 10
        const user = ctx.state.user.data;
        const { teamId } = ctx.validatedParams;

        const result = await Miniapp.findAll({
            where: {
                [Op.or]: [{ 'ownerId': teamId }, { 'ownerId': user.id }]
            }
        });
        // .limit(size).skip(page * size)
        ctx.body = responseWrapper(result);
    }

    @request('post', '/api/miniapps/adddownloadcode')
    @summary("根据授权码或租户id添加一个下载二维码")
    // @query(
    //     {
    //     page:{type:'number',default:0,description:'分页页码(可选)'},
    //     size:{type:'number',default:10,description:'每页条数(可选)'}
    // })
    @body({
        appId: { type: 'string', require: true, description: "小程序的appid" },
        scene: { type: 'string', require: false, description: "场景参数列如authcode=xxxx&match=xxxx" },
        page: { type: 'string', require: false, description: "入口页面" },
        remark: { type: 'string', require: true, description: "备注信息" },
        teamId: { type: 'string', require: true, description: "团队id" },
    })
    @tag
    static async addDownloadCode(ctx, next) {
        // var page = ctx.query.page || 0
        // var size = ctx.query.size || 10
        const user = ctx.state.user.data;
        const body = ctx.request.body;

        const app = await Miniapp.findOne({
            where: {
                appId: body.appId
            }
        });
        const miniapp = await appInTeamAndUserIsManager(app.id, body.teamId, user.id);
        if (miniapp.status) {
            // ctx.status = result.status;
            ctx.body = responseWrapper(false, miniapp.msg);
            return;
        }

        const result = await axios.get(`https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${app.appId}&secret=${app.appSecret}`)

        const token = result.data.access_token;
        console.log(token);
        if (!token) {
            ctx.body = responseWrapper(false, '获取token失败，检查网络和appid和appsecret');
            return;
        }

        const dir = `upload/mini/${app.appId}`;
        const uploadDir = fpath.join(config.fileDir, dir);
        createFolderIfNeeded(uploadDir);
        const imageName = `${uuidv1()}.jpg`;
        if (body.scene) {
            const result = await requestImage(`https://api.weixin.qq.com/wxa/getwxacodeunlimit?access_token=${token}`, {
                scene: body.scene,
                page: body.page
            }, uploadDir, imageName);
            console.log(result);
        } else {
            const result = await requestImage(`https://api.weixin.qq.com/wxa/getwxacode?access_token=${token}`, {
                path: body.page
            }, uploadDir, imageName);
            console.log(result);
        }

        const downloadCodeInfo = {
            id: uuidV4().replace(/-/g, ""),
            appId: body.appId,
            remark: body.remark,
            image: `${dir}/${imageName}`,
            param: body.scene,
            page: body.page
        }

        const row = await DownloadCodeImage.create(downloadCodeInfo);
        ctx.body = responseWrapper(updatedApp);
    }

    @request('post', '/api/miniapps/removedownloadcode')
    @summary("删除一个下载二维码")
    // @query(
    //     {
    //     page:{type:'number',default:0,description:'分页页码(可选)'},
    //     size:{type:'number',default:10,description:'每页条数(可选)'}
    // })
    @body({
        appId: { type: 'string', require: true, description: "小程序的appid" },
        codeId: { type: 'string', require: true, description: "入口页面" },
    })
    @tag
    static async removeDownloadCode(ctx, next) {
        // const page = ctx.query.page || 0
        // const size = ctx.query.size || 10
        const user = ctx.state.user.data;
        const body = ctx.request.body;

        const app = await Miniapp.findOne({
            where: { appId: body.appId }
        });
        const miniapp = appInTeamAndUserIsManager(app.id, body.teamId, user.id);
        if (miniapp.status) {
            // ctx.status = result.status;
            ctx.body = responseWrapper(false, miniapp.msg);
            return;
        }

        const row = await DownloadCodeImage.destroy({ where: { appId: body.appId } });
        ctx.body = responseWrapper(true, '小程序码已删除');
    }

    // @request('post', '/api/apps/{teamId}/{id}/profile')
    // @summary("更新应用设置")
    // @tag
    // @body(appProfile)
    // @path({ teamId: { type: 'string', required: true }, id: { type: 'string', required: true } })
    // static async setAppProfile(ctx, next) {
    //     var user = ctx.state.user.data;
    //     var body = ctx.request.body;
    //     var { teamId, id } = ctx.validatedParams;

    //     var app = await appInTeamAndUserIsManager(id, teamId, user.id)
    //     if (!app) {
    //         throw new Error("应用不存在或您没有权限执行该操作")
    //     }
    //     await App.findByIdAndUpdate(id, body)
    //     ctx.body = responseWrapper(true, "应用设置已更新")
    // }



    @request('get', '/api/count/{appid}/{versionId}')
    @summary("增加一次下载次数")
    @tag
    @path({ appid: { type: 'string', require: true }, versionId: { type: 'string', require: true } })
    static async addDownloadCount(ctx, next) {
        const { appid, versionId } = ctx.validatedParams
        const app = await App.findOne({
            where: { id: appid },
        });
        const version = await Version.findOne({
            where: { id: versionId }
        });

        if (!app) {
            ctx.body = responseWrapper(false, "应用不存在");
            return;
        }
        if (!version) {
            ctx.body = responseWrapper(false, "版本不存在");
            return;
        }

        let todayCount = 1;//这里使用redis进行统计
        const now = Date.now();
        let appTotalCount = 1;
        if (app.totalDownloadCount) {
            appTotalCount = app.totalDownloadCount + 1
        }
        await App.update({
            totalDownloadCount: appTotalCount,
            todayDownloadCount: app.totalDownloadCount + 1
        }, {
            where: { id: appid }, 
        })
        await AppDownload.create({
            appId: appid,
            versionId: versionId,
            data: now
        });
        let versionCount = 1;
        if (version.downloadCount) {
            versionCount = version.downloadCount + 1
        }
        await Version.update({
            downloadCount: versionCount
        }, {
            where: { id: versionId }
        })
        ctx.body = responseWrapper(true, '下载次数已更新')
    }
}

async function requestImage(url, data, codePath, imageName) {
    const path = fpath.resolve(codePath, imageName)
    const writer = fs.createWriteStream(path)
    const response = await axios({
        url,
        method: 'POST',
        responseType: 'stream',
        data: data
    })

    response.data.pipe(writer)

    return new Promise((resolve, reject) => {
        writer.on('finish', resolve)
        writer.on('error', reject)
    })
}

async function appInTeamAndUserIsManager(appId, teamId, userId) {
    const team = await Team.findOne({
        where: {
            id: teamId
        },
        // attributes: ['id']
    });
    if (!team) {
        return {
            status: 408,
            msg: '应用不存在或您没有权限执行该操作'
        }
    }
    const app = await Miniapp.findOne({
        where: { id: appId, ownerId: team.id }
    })
    if (!app) {
        return {
            status: 408,
            msg: '应用不存在或您没有权限执行该操作'
        }
    } else {
        return app
    }
}

async function appAndUserInTeam(appId, teamId, userId) {
    const team = await Team.findOne({
        where: {
            id: teamId,
            creatorId: userId
        }
    });
    const app = await App.find({
        where: { id: appId, ownerId: team.id }
    })
    if (!app) {
        return {
            status: 408,
            msg: '应用不存在或您不在该团队中'
        }
    } else {
        return app
    }
}

async function userInTeam(appId, teamId, userId) {
    const team = await Team.findOne({
        where: {
            id: teamId,
            creatorId: userId
        }
    });
    const app = await App.findOne({
        where: { id: id, ownerId: team.id }
    })
    if (!app) {
        return {
            status: 408,
            msg: '应用不存在或您不在该团队中'
        }
    } else {
        return app
    }
}

//设置模糊查询
function modifyFilter(filter) {
    let result = {}
    for (var key in filter) {
        result[key] = { $regex: filter[key] }
    }
    return result
}

function createFolderIfNeeded(path) {
    if (!fs.existsSync(path)) {
        mkdirp.sync(path, function (err) {
            if (err) console.error(err)
        })
    }
}