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
const App = require('../model/app');
const Version = require('../model/version');
const Team = require('../model/team');
const TeamMembers = require("../model/team_members");
const GrayStrategy = require('../model/gray_strategy');
const AppDownload = require('../model/app_download');

const tag = tags(['AppResource']);

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

module.exports = class AppRouter {
    @request('get', '/api/apps/{teamId}')
    @summary("获取团队下App列表")
    // @query(
    //     {
    //     page:{type:'number',default:0,description:'分页页码(可选)'},
    //     size:{type:'number',default:10,description:'每页条数(可选)'}
    // })
    @path({ teamId: { type: 'string', description: '团队id' } })
    @tag
    static async getApps(ctx, next) {
        // var page = ctx.query.page || 0
        // var size = ctx.query.size || 10
        const user = ctx.state.user.data;
        const { teamId } = ctx.validatedParams;

        const result = await App.findAll({
            where: {
                [Op.or]: [{ 'ownerId': teamId || user.id }]
            }
        });
        // .limit(size).skip(page * size)
        ctx.body = responseWrapper(result);
    }

    @request('get', '/api/apps/{teamId}/{id}')
    @summary("获取某个应用详情")
    @tag
    @path({
        teamId: { type: 'string' },
        id: { type: 'string', description: '应用id' }
    })
    static async getAppDetail(ctx, next) {
        const { caches } = ctx;
        const user = ctx.state.user.data;
        const { teamId, id } = ctx.validatedParams;
        //todo: 这里其实还要判断该用户在不在team中
        //且该应用也在team中,才有权限查看
        const app = await App.findOne({
            where: {
                id: id
            }
        });
        if(app.grayStrategy == 0) {
            const ipTypeObj = await caches.IpType.filter((value) => {
                return value.id == 1;
            });
            const updateModeObj = await caches.UpdateMode.filter((value) => {
                return value.id == 1;
            });
            app.grayStrategy = {
                id: 0,
                ipType: 1,
                ipTypeName: ipTypeObj.length > 0 ? ipTypeObj[0].name : "",
                ipList: [],
                downloadCountLimit: 0,
                updateMode: 1,
                updateModeName: updateModeObj.length > 0 ? updateModeObj[0].name : ""
            };
        }else{
            const grayStrategy = await GrayStrategy.findOne({
                where: {
                    id: app.grayStrategy
                }
            });
            const ipTypeObj = await caches.IpType.filter((value) => {
                return value.id == grayStrategy.ipType;
            });
            const updateModeObj = await caches.UpdateMode.filter((value) => {
                return value.id == grayStrategy.updateMode;
            });
            app.grayStrategy = {
                id: 0,
                ipType: grayStrategy.ipType,
                ipTypeName: ipTypeObj.length > 0 ? ipTypeObj[0].name : "",
                ipList: grayStrategy.ipList.join(),
                downloadCountLimit: grayStrategy.downloadCountLimit,
                updateMode: grayStrategy.updateMode,
                updateModeName: updateModeObj.length > 0 ? updateModeObj[0].name : ""
            };
            // const appDownload = await AppDownload.findAndCountAll({
            //     where: {
            //         appId: app.appId
            //     },
            //     attributes: ['data']
            // });
            // app.totalDownloadCount = appDownload.length;
            // let now = new Date().toDateString();
            // const todayAppDownload = appDownload.filter((value) =>{
            //     return new Date(value.data).toDateString === now;
            // });
            // app.todayDownloadCount = {
            //     date: Date.now(),
            //     count: todayAppDownload.length
            // }
        }
        app.todayDownloadCount = {
            date: Date.now(),
            count: app.todayDownloadCount
        };
        ctx.body = responseWrapper(app);
    }

    @request('delete', '/api/apps/{teamId}/{id}')
    @summary("删除某个应用")
    @tag
    @path({
        teamId: { type: 'string' },
        id: { type: 'string', description: '应用id' }
    })
    static async deleteApp(ctx, next) {
        const user = ctx.state.user.data;
        const { teamId, id } = ctx.validatedParams;
        const team = await Team.findOne({
            where: {
                id: teamId,
                creatorId: user.id
            }
        });
        if (!team) {
            ctx.body = responseWrapper(false, '您没有权限查询该应用');
            return;
        } else {
            if (team.role != 1 && team.role != 2) {
                ctx.body = responseWrapper(false, '您的权限不足');
                return;
            }
        }
        const app = await App.findOne({
            where: {
                id: id,
                ownerId: team.id
            }
        });
        if (!app) {
            ctx.body = responseWrapper(false, '应用不存在');
            return;
        }
        await Version.destroy({
            where: {
                appId: app.appId
            }
        });
        await App.destroy({
            where: { id: app.id }
        });
        ctx.body = responseWrapper(true, "应用已删除");
    }

    @request('get', '/api/apps/{teamId}/{id}/versions')
    @summary("获取某个应用的版本列表(分页)")
    @path({
        teamId: { type: 'string' },
        id: { type: 'string', description: '应用id' }
    })
    @query({
        page: { type: 'number', default: 0, description: '分页页码(可选)' },
        size: { type: 'number', default: 10, description: '每页条数(可选)' }
    })
    @tag
    static async getAppVersions(ctx, next) {
        const user = ctx.state.user.data;
        const { teamId, id } = ctx.validatedParams;
        const { page, size } = ctx.query;
        const team = await Team.findOne({
            where: {
                id: teamId
            }
        });
        const app = await App.findOne({
            where: {
                id: id,
                ownerId: team.id
            }
        });
        if (!app) {
            ctx.body = responseWrapper(false, '应用不存在或您没有权限查询该应用');
            return;
        }
        const versions = await Version.findAll({
            where: {
                appId: app.appId
            },
            order: [
                ['uploadTime', 'DESC']
            ],
            offset: page,
            limit: size
        });
        ctx.body = responseWrapper(versions);
    }

    @request('get', '/api/apps/{teamId}/{id}/versions/{versionId}')
    @summary("获取某个应用的某个版本详情")
    @tag
    @path({
        teamId: { type: 'string' },
        id: { type: 'string', description: '应用id' },
        versionId: { type: 'string', description: '版本id' }
    })
    static async getAppVersionDetail(ctx, next) {
        const user = ctx.state.user.data;
        const { teamId, id, versionId } = ctx.validatedParams;
        const team = await TeamMembers.findOne({
            where: {
                teamId: teamId,
                userId: user.id
            }
        });
        if (!team) {
            ctx.body = responseWrapper(false, "没有权限查看该应用");
            return;
        }
        const version = await Version.findOne({
            where: {
                id: versionId
            }
        });
        if (!version) {
            ctx.body = responseWrapper(false, "应用不存在");
            return;
        }
        ctx.body = responseWrapper(version);
    }

    @request('delete', '/api/apps/{teamId}/{id}/versions/{versionId}')
    @summary("删除某个版本")
    @tag
    @path({
        teamId: { type: 'string', description: '团队id' },
        id: { type: 'string', description: '应用id' },
        versionId: { type: 'string', description: '版本id' }
    })
    static async deleteAppVersion(ctx, next) {
        const user = ctx.state.user.data;
        const { teamId, id, versionId } = ctx.validatedParams;
        const app = await appInTeamAndUserIsManager(id, teamId, user.id);
        if(app.status) {
            // ctx.status = result.status;
            ctx.body = responseWrapper(false, app.msg);
            return;
        }
        const result = await Version.destroy({
            where: {
                id: versionId
            }
        });
        if (versionId == app.releaseVersionId) {
            await App.update({
                releaseVersionId: 0
            }, {
                where: {
                    id: app.id
                }
            });
        }

        if (versionId == app.grayReleaseVersionId) {
            await App.update({
                grayReleaseVersionId: 0,
                grayStrategy: 0
            }, {
                where: {
                    id: app.id
                }
            });
        }
        ctx.body = responseWrapper(true, "版本已删除");
    }

    @request('post', '/api/apps/{teamId}/{id}/updateMode')
    @summary("设置应用或版发布更新方式/静默/强制/普通")
    @tag
    @body({
        updateMode: { type: 'string', require: true },
        versionId: { type: 'string', description: "如果传入了versionId则表示设置某个版本的更新方式" }
    })
    @path({ teamId: { type: 'string', require: true }, id: { type: 'string', require: true } })
    static async setUpdateMode(ctx, next) {
        const user = ctx.state.user.data;
        const body = ctx.body;
        const { teamId, id } = ctx.validatedParams;
        const app = await appInTeamAndUserIsManager(id, teamId, user.id)
        if(app.status) {
            // ctx.status = result.status;
            ctx.body = responseWrapper(false, app.msg);
            return;
        }
        if (body.versionId) {
            //更新版本策略
            await Version.update({
                updateMode: body.updateMode
            }, {
                where: {
                    appId: versionId
                }
            });
        } else {
            await App.update({
                updateMode: body.updateMode
            }, {
                where: {
                    id
                }
            });
        }
        ctx.body = responseWrapper(true, "版本发布策略设置成功");
    }

    @request('post', '/api/apps/{teamId}/{id}/profile')
    @summary("更新应用设置")
    @tag
    @body(appProfile)
    @path({ teamId: { type: 'string', required: true }, id: { type: 'string', required: true } })
    static async setAppProfile(ctx, next) {
        const user = ctx.state.user.data;
        const body = ctx.request.body;
        const { teamId, id } = ctx.validatedParams;

        const app = await appInTeamAndUserIsManager(id, teamId, user.id);
        if(app.status) {
            // ctx.status = result.status;
            ctx.body = responseWrapper(false, app.msg);
            return;
        }
        await App.findByIdAndUpdate(id, body);
        ctx.body = responseWrapper(true, "应用设置已更新");
    }

    @request('post', '/api/apps/{teamId}/{id}/{versionId}/profile')
    @summary("更新版本设置设置")
    @tag
    @body(versionProfile)
    @path({ teamId: { type: 'string', required: true }, id: { type: 'string', required: true }, versionId: { type: 'string', required: true } })
    static async setVersionProfile(ctx, next) {
        const user = ctx.state.user.data;
        const body = ctx.request.body;
        const { teamId, id, versionId } = ctx.validatedParams;
        let app = await appInTeamAndUserIsManager(id, teamId, user.id);
        if(app.status) {
            // ctx.status = result.status;
            ctx.body = responseWrapper(false, app.msg);
            return;
        }
        await Version.findByIdAndUpdate(versionId, body);
        ctx.body = responseWrapper(true, "版本设置已更新");
    }

    @request('post', '/api/apps/{teamId}/{id}/grayPublish')
    @summary("灰度发布一个版本")
    @tag
    @path({ teamId: { type: 'string', require: true }, id: { type: 'string', require: true } })
    @body(grayRelease)
    static async grayReleaseAppVersion(ctx, next) {
        const { caches } = ctx;
        const user = ctx.state.user.data;
        const { body } = ctx.request;
        const { teamId, id } = ctx.validatedParams;

        let app = await appInTeamAndUserIsManager(id, teamId, user.id);
        if(app.status) {
            // ctx.status = result.status;
            ctx.body = responseWrapper(false, app.msg);
            return;
        }
        let version = await Version.findOne({
            where: {
                id: body.version.versionId
            }
        });

        const appRow = await App.update({
            grayReleaseVersionId: version.id
        }, {
            where: {
                appId: app.appId
            }
        });
        if(body.strategy) {
            let ipType = caches.IpType.filter((value) => {
                return value.name === body.strategy.ipType;
            });
            if(ipType.length > 0) {
                ipType = ipType[0];
            }else{
                ctx.body = responseWrapper(false, "ip地址限制类型不存在");
                return;
            }
            let updateMode = caches.UpdateMode.filter((value) => {
                return value.name === body.strategy.updateMode;
            });
            if(updateMode.length > 0) {
                updateMode = updateMode[0];
            }else{
                ctx.body = responseWrapper(false, "更新方式类型不存在");
                return;
            }

            const grayStrategy = await GrayStrategy.findOne({
                where: {
                    id: version.id
                }
            });
            if(grayStrategy) {
                await GrayStrategy.update({
                    downloadCountLimit: body.strategy.downloadCountLimit.length === 0 ? 0 : body.strategy.downloadCountLimit,
                    ipList: body.strategy.ipList.join(),
                    ipType: ipType.id,
                    updateMode: updateMode.id,
                }, {
                    where: {
                        id: version.id
                    }
                })
            }else{
                await GrayStrategy.create({
                    id: version.id,
                    downloadCountLimit: body.strategy.downloadCountLimit.length === 0 ? 0 : body.strategy.downloadCountLimit,
                    ipList: body.strategy.ipList.join(),
                    ipType: ipType.id,
                    updateMode: updateMode.id,
                })
            }
        }
        ctx.body = responseWrapper(true, "版本已灰度发布");
    }

    @request('post', '/api/apps/{teamId}/{id}/release')
    @summary("发布或者取消发布某个版本")
    @tag
    @path({ teamId: { type: 'string', require: true }, id: { type: 'string', require: true } })
    @body({
        versionId: { type: 'string', require: true },
        versionCode: { type: 'string', require: true },
        release: { type: 'bool', require: true }
    })
    static async releaseVersion(ctx, next) {
        const user = ctx.state.user.data
        const { body } = ctx.request
        const { teamId, id } = ctx.validatedParams;

        let app = await appInTeamAndUserIsManager(id, teamId, user.id);
        if(app.status) {
            // ctx.status = result.status;
            ctx.body = responseWrapper(false, app.msg);
            return;
        }
        let version = await Version.findOne({
            where: {
                id: body.versionId
            }
        });
        if (!version) {
            ctx.body = responseWrapper(false, "版本不存在");
            return;
        }
        if (body.release) {
            await App.update({
                releaseVersionId: version.id,
                releaseVersionCode: version.versionCode
            }, {
                where: { appId: app.appId }
            });
        } else {
            await App.update({
                releaseVersionId: "",
                releaseVersionCode: 0
            }, {
                where: { appId: app.appId }
            });
        }
        ctx.body = responseWrapper(true, body.release ? "版本已发布" : "版本已关闭");
    }

    @request('get', '/api/app/checkupdate/{teamID}/{platform}/{bundleID}/{currentVersionCode}')
    @summary("检查版本更新")
    @tag
    @path({
        ownerID: String,
        bundleID: String,
        currentVersionCode: String,
        platform: String
    })
    static async checkUpdate(ctx, next) {
        const { ownerID, bundleID, currentVersionCode, platform } = ctx.validatedParams;
        const app = await App.findOne({
            where: { bundleId: bundleID, ownerId: ownerID, platform: platform }
        })
        if (!app) {
            ctx.body = responseWrapper(false, "应用不存在或您没有权限执行该操作");
            return;
        }
        // let lastVersionCode = app.currentVersion

        // if ( < lastVersionCode) {
        //1.拿出最新的version 最新的非灰度版本

        // 最新的灰度版本
        let lastestGrayVersion = await Version.findOne({
            where: {
                id: app.grayReleaseVersionId
            }
        })

        const normalVersion = await Version.findOne({
            where: { id: app.releaseVersionId }
        })

        let version = normalVersion

        let lastestGrayVersionCode = 0
        let normalVersionCode = 0
        if (version && version.versionCode) {
            normalVersionCode = version.versionCode
        }
        if (lastestGrayVersion && lastestGrayVersion.versionCode) {
            lastestGrayVersionCode = lastestGrayVersion.versionCode
        }

        if (app.grayReleaseVersionId && lastestGrayVersionCode > normalVersionCode) {
            let ipType = app.grayStrategy.ipType
            let ipList = app.grayStrategy.ipList
            let clientIp = await getIp(ctx.request)
            console.log("clientIp", clientIp)
            if (ipType == 'white' && _.includes(ipList, clientIp)) { //如果是white 则允许获得灰度版本
                if (!app.grayStrategy.downloadCountLimit || app.grayStrategy.downloadCountLimit > lastestGrayVersion.downloadCount) {
                    version = lastestGrayVersion
                }
            }
        }

        if (!version || version.versionCode <= currentVersionCode) {
            ctx.body = responseWrapper(false, "您已经是最新版本了");
        } else {
            ctx.body = responseWrapper({
                app: app,
                version: version
            });
        }

    }
    // }

    @request('get', '/api/app/{appShortUrl}')
    @summary("通过短链接获取应用最新版本")
    @tag
    @path({ appShortUrl: { type: 'string', require: true } })
    static async getAppByShort(ctx, next) {
        const { appShortUrl } = ctx.validatedParams;
        let app = await App.findOne({
            where: {
                shortUrl: appShortUrl
            }
        });
        let version;
        if (!app) {
            version = await Version.findOne({
                where: {
                    id: appShortUrl
                }
            });
            if(!version) {
                ctx.body = responseWrapper(false, "版本不存在");
                return;
            }
            app = await App.findOne({
                where: {
                    appId: version.appId
                }
            });
            if(!app) {
                ctx.body = responseWrapper(false, "应用不存在");
                return;
            }
        }
        // if (!app.releaseVersionId || app.releaseVersionId === '') {
        //     throw new Error("当前没有已发布的版本可供下载")
        // }
        // let version = await Version.findById(app.releaseVersionId)
        // if (!version) {
        //     throw new Error("当前没有已发布的版本可供下载")
        // }

        let lastestGrayVersion = await Version.findOne({
            where: { id: app.grayReleaseVersionId }
        });
        if(!version) {
            version = await Version.findAll({
                where: { appId: app.appId },
                order: [
                    ['uploadTime', 'DESC']
                ],
                limit: 1
            });
            if(version.length > 0) {
                version = version[0];
            }
        }
        // let normalVersion = await Version.findOne({ id: app.releaseVersionId })
        // let version = normalVersion
        let lastestGrayVersionCode = 0;
        let normalVersionCode = 0;
        if (version && version.versionCode) {
            normalVersionCode = version.versionCode;
        }
        if (lastestGrayVersion && lastestGrayVersion.versionCode) {
            lastestGrayVersionCode = lastestGrayVersion.versionCode;
        }
        if (app.grayReleaseVersionId && lastestGrayVersionCode > normalVersionCode) {
            let ipType = app.grayStrategy.ipType;
            let ipList = app.grayStrategy.ipList;
            let clientIp = await getIp(ctx.request);
            if (ipType == 'white' && _.includes(ipList, clientIp)) { //如果是white 则允许获得灰度版本
                if (!app.grayStrategy.downloadCountLimit || app.grayStrategy.downloadCountLimit > lastestGrayVersion.downloadCount) {
                    version = lastestGrayVersion;
                }
            }
        }

        if (!version) {
            ctx.body = responseWrapper(false, "当前没有可用版本可供下载");
        } else {
            ctx.body = responseWrapper({ 'app': app, 'version': version });
        }
    }

    @request('post', '/api/app/{appId}/{versionId}')
    @summary('取消发布版本')
    @tag
    @path({ appid: { type: 'string', require: true }, versionId: { type: 'string', require: true } })
    static async cancelReleaseByVersionId(ctx, next) {
        const { appId, versionId } = ctx.validatedParams
        const app = await App.findOne({
            where: {
                appId: appId
            }
        })
        const version = await Version.findOne({
            where: { id: versionId }
        })

        if (!app) {
            ctx.body = responseWrapper(false, "应用不存在");
            return;
        }
        if (!version) {
            ctx.body = responseWrapper(false, "版本不存在");
            return;
        }

        if (versionId == app.releaseVersionId) {
            await App.updateOne({ id: appId }, {
                releaseVersionId: null
            })
        }

        if (versionId == app.grayReleaseVersionId) {
            await App.updateOne({ id: appId }, {
                grayReleaseVersionId: null,
                grayStrategy: null
            })
        }

        ctx.body = responseWrapper('取消版本的发布成功')

    }


    @request('get', '/api/plist/{appid}/{versionId}')
    @summary("获取应用的plist文件")
    @tag
    @path({ appid: { type: 'string', require: true }, versionId: { type: 'string', require: true } })
    static async getAppPlist(ctx, next) {
        const { appid, versionId } = ctx.validatedParams
        const app = await App.findOne({
            where: { id: appid }
        })
        const version = await Version.findOne({
            where: { id: versionId }
        })

        if (!app) {
            ctx.body = responseWrapper(false, "应用不存在");
            return;
        }
        if (!version) {
            ctx.body = responseWrapper(false, "版本不存在");
            return;
        }

        let url = `${config.baseUrl}/${version.downloadUrl}`

        let result = fs.readFileSync(fpath.join(__dirname, "..", 'templates') + '/template.plist')
        let template = result.toString();
        let rendered = mustache.render(template, {
            appName: app.appName,
            bundleID: app.bundleId,
            versionStr: version.versionStr,
            downloadUrl: url,
            fileSize: version.size,
            iconUrl: `${config.baseUrl}/${app.icon}`
        });
        ctx.set('Content-Type', 'text/xml; charset=utf-8');
        ctx.set('Access-Control-Allow-Origin', '*');
        ctx.body = rendered
    }

    @request('get', '/api/count/{appid}/{versionId}')
    @summary("增加一次下载次数")
    @tag
    @path({ appid: { type: 'string', require: true }, versionId: { type: 'string', require: true } })
    static async addDownloadCount(ctx, next) {
        const { appid, versionId } = ctx.validatedParams;
        const app = await App.findOne({
            where: { 
                id: appid 
            },
            attributes: ['totalDownloadCount', 'todayDownloadCount']
        });
        const version = await Version.findOne({
            where: { 
                id: versionId 
            }
        });

        if (!app) {
            ctx.body = responseWrapper(false, "应用不存在");
            return;
        }
        if (!version) {
            ctx.body = responseWrapper(false, "版本不存在");
            return;
        }

        let todayCount = 1;
        let nowDate = new Date();
        if (new Date(app.todayDownloadCount.date).toDateString() == nowDate.toDateString()) {
            todayCount = app.todayDownloadCount + 1
        }
        let appTotalCount = 1;
        if (app.totalDownloadCount) {
            appTotalCount = app.totalDownloadCount + 1
        }
        const appRow = await App.update({
            totalDownloadCount: appTotalCount,
            todayDownloadCount: app.totalDownloadCount + 1,
        }, {
            where: {
                id: appid
            }
        });
        const appDownloadRow = await AppDownload.create({ appId: appid, versionId: versionId, data: nowDate.getTime() });
        let versionCount = 1;
        if (version.downloadCount) {
            versionCount = version.downloadCount + 1;
        }
        const versionRow = await Version.update({
            downloadCount: versionCount
        }, {
            where: { 
                id: versionId 
            }
        });
        ctx.body = responseWrapper(true, '下载次数已更新');
    }


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
    } else {
        if (team.role != 1 && team.role != 2) {
            return {
                status: 408,
                msg: '您没有权限执行该操作'
            }
        }
    }
    const app = await App.findOne({
        where: {
            id: appId,
            ownerId: team.id
        }
    });
    if (!app) {
        return {
            status: 408,
            msg: '应用不存在'
        }
    } else {
        return app;
    }
}

async function appAndUserInTeam(appId, teamId, userId) {
    const team = await Team.findOne({
        where: {
            id: teamId,
            creatorId: userId
        }
    });
    if (!team) {
        return {
            status: 408,
            msg: '您不在该团队中'
        }
    } 
    const app = await App.findOne({
        where: {
            id: appId,
            ownerId: team.id
        }
    });
    if (!app) {
        return {
            status: 408,
            msg: '应用不存在或您不在该团队中'
        }
    } else {
        return app;
    }
}

async function userInTeam(appId, teamId, userId) {
    const team = await Team.findOne({
        where: {
            id: teamId,
            creatorId: userId
        }
    });
    if (!team) {
        return {
            status: 408,
            msg: '您不在该团队中'
        }
    } 
    const app = await App.findOne({
        where: { 
            id: id, 
            ownerId: team.id 
        }
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
    let result = {};
    for (var key in filter) {
        result[key] = { $regex: filter[key] };
    }
    return result;
}