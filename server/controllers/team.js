'use strict';

import {
    request,
    summary,
    tags,
    body,
    query,
    path,
    description
} from '../swagger';
const { Op } = require("sequelize");
import User from "../model/user";
import Team from "../model/team";
import Teams from "../model/teams";
import TeamMembers from "../model/team_members";
import Message from "../model/message";
import { responseWrapper } from "../helper/util";
import validator from "../helper/validator";
import Mail from "../helper/mail"
import config from "../config"
import { userInTeamIsManager, userInTeam } from "../helper/validator"
import _ from 'lodash';


const tag = tags(['团队']);

var teamCreateSchema = {
    name: {
        type: 'string',
        required: true
    },
    icon: {
        type: 'string',
        required: false
    }
}

module.exports = class TeamRouter {
    @request('post', '/api/team/create')
    @summary('创建一个团队')
    @tag
    @body(teamCreateSchema)
    static async createTeam(ctx, next) {
        const { caches } = ctx;
        const user = ctx.state.user.data;
        const { body } = ctx.request;
        if(validator.isEmpty(body.name)) {
            ctx.body = responseWrapper(false, '团队名不能为空');
            return;
        }
        const now = Date.now();
        let team = {};
        team.name = body.name;
        team.icon = body.icon ? body.icon : '';
        team.creatorId = user.id;
        team.role = caches.Teams[0].id
        // team.state = 0
        team.createTime = now;
        const { id: teamId } = await Team.create(team);
        team.members = [{
            id: user.id,
            username: user.username,
            email: user.email,
            role: caches.Teams[0].id,
            roleName: caches.Teams[0].name//"owner"
        }];
        //批量插入
        const team_members = await TeamMembers.bulkCreate([{ teamId: teamId, userId: user.id, role: team.role }]);

        ctx.body = responseWrapper(true, "团队创建成功", team)
    }

    @request('delete', '/api/team/dissolve/{id}')
    @summary('解散一个团队')
    @tag
    @path({
        id: {
            type: 'string',
            required: true
        }
    })
    static async dissolveTeam(ctx, next) {
        const { id } = ctx.validatedParams;
        const user = ctx.state.user.data;
        const team = await Team.findOne({
            where: { creatorId: id }
        });
        if (!team) {
            ctx.body = responseWrapper(false, '该团队不存在或者您没有权限解散该团队');
            return;
        }

        if (team.state == 1) {
            ctx.body = responseWrapper(false, '用户默认团队无法解散');
            return;
        }

        await Team.destory({
            where: { id: team.id }
        });

        await TeamMembers.destory({
            where: { teamId: team.id }
        });

        ctx.body = responseWrapper(true, "团队已解散")
    }

    @request('post', '/api/team/{teamId}/role')
    @summary('修改用户角色')
    @tag
    @path({
        teamId: {
            type: 'string',
            required: true
        }
    })
    @body({ memberId: { type: 'string', required: true }, role: { type: 'string', required: true, description: "传入manager或者guest" } })
    static async changeMemberRole(ctx, next) {
        const { caches } = ctx;
        const { teamId } = ctx.validatedParams;
        const user = ctx.state.user.data;
        const body = ctx.request.body;
        if (body.role != 'manager' && body.role != 'guest') {
            // throw new Error("请传入正确的角色参数")
            ctx.body = responseWrapper(false, "请传入正确的角色参数");
            return;
        }
        const team = await Team.findOne({
            where: {
                id: body.teamId,
                creatorId: body.memberId,
            }
        })
        if (team) {
            ctx.body = responseWrapper(false, "不能修改创建者角色");
            return;
        }
        const teams = caches.Teams.filter((o) => o.name === body.role);
        if(teams && teams.length > 0) {
            await TeamMembers.update({ 'role': teams[0].id }, {
                where: {
                    teamId: body.teamId,
                    userId: body.memberId,
                }
            })
    
            ctx.body = responseWrapper(true, "用户角色已更新")
        }else {
            ctx.body = responseWrapper(false, "请传入正确的角色参数");
            return;
        }
    }

    @request('post', '/api/team/{teamId}/invite')
    @summary('邀请某成员加入团队')
    @tag
    @body({
        emailList: {
            type: 'array',
            items: {
                type: 'string'
            },
            description: "邮箱列表",
            required: true
        },
        role: { type: 'string', required: true, description: "成员角色manager/guest" }
    })
    @path({
        teamId: {
            type: 'string',
            required: true
        }
    })
    static async addMember(ctx, next) {
        const { caches } = ctx;
        const { teamId } = ctx.validatedParams;
        const user = ctx.state.user.data;
        const emailList = ctx.request.body.emailList;
        const body = ctx.request.body
        if (!(body.role === 'manager' || body.role === 'guest')) {
            throw new Error("请传入正确的用户角色")
        }

        const team = await Team.findOne({
            where: {
                id: teamId,
                // creatorId: user.id
            }
        });
        if (!team) {
            ctx.body = responseWrapper(false, "团队不存在");
            return;
        }
        const teamMembers = await TeamMembers.findOne({
            where: {
                teamId: teamId,
                userId: user.id
            }
        })

        if (teamMembers) {
            const teams = caches.Teams.filter((o) => o.id == teamMembers.role)[0];
            if (teams && (teams.name !== 'owner' && teams.name !== 'manager')) {
                ctx.body = responseWrapper(false, "您没有权限邀请用户加入");
                return;
            }
        } else {
            ctx.body = responseWrapper(false, "您没有权限邀请用户加入");
            return;
        }

        const userList = await User.findAll({
            where: {
                email: {
                    [Op.or]: emailList
                }
            },
            attributes: { exclude: ['password'] }
        });

        // 如果用户不存在则发送邮件邀请
        const dif = _.difference(emailList, _.map(userList, 'email'))
        if (dif.length != 0) {
            Mail.send(dif, `[${config.title}邮箱注册邀请]`, `<body>
            <div style="font-size: 20px;padding: 10px 0;"><span>亲爱的用户：</span></div>
            <div><span style="font-size:15px">您好！“${user.username}”用户正在邀请你使用“${config.title}”，您还没有注册，</span><a href="${config.baseUrl}">请点击注册</a></span></div>
        </body>`)
        }

        const members = await TeamMembers.findAll({
            where: {
                teamId: teamId
            }
        })
        let teamList = []
        for (let u of userList) {
            const _list = _.find(members, function (o) {
                return o.userId == u.id
            });
            if (!_list) {
                let role = 3;
                teamList.push({
                    teamId: teamId,
                    userId: u.id,
                    role: role,
                })
            }
        }

        if (teamList.length <= 0) {
            if (dif.length > 0) {
                ctx.body = responseWrapper(true, "已发送邀请")
            } else {
                ctx.body = responseWrapper(true, "用户已加入该团队")
            }
            return
        }

        //批量插入
        const team_members = await TeamMembers.bulkCreate(teamList);

        let messageList = [];
        const now = Date.now();
        for (let u of userList) {
            let message = {};
            message.category = "INVITE";
            message.content = user.username + "邀请您加入" + team.name + "团队."
            message.sender = user.id;
            message.receiver = u.id;
            message.sendTime = now;
            messageList.push(message);
        }
        //批量插入
        await Message.bulkCreate(messageList);

        ctx.body = responseWrapper(true, "已发送邀请")
    }

    @request('delete', '/api/team/{id}/member/{userId}')
    @summary('移除某个成员,或者自己离开团队')
    @tag
    @path({
        id: {
            type: 'string',
            required: true
        },
        userId: {
            type: 'string',
            required: true
        }
    })
    static async removeMember(ctx, next) {
        const { id, userId } = ctx.validatedParams;
        const user = ctx.state.user.data;
        //如果传入的id和当前登录用户的id相等 表示是自己离开团队
        let team;
        team = await userInTeam(user.id, id)
        if (team) {
            ctx.body = responseWrapper(false, "不能删除创建者");
            return;
        }
        team = await userInTeamIsManager(user.id, id)

        if (!team) {
            ctx.body = responseWrapper(false, "团队不存在或该用户没有权限删除用户");
            return;
        }
        await TeamMembers.destory({
            where: {
                userId: user.id
            }
        })
        ctx.body = responseWrapper(true, "请求成功")
    }

    @request('get', '/api/team/{teamId}/members')
    @summary('获取团队成员列表')
    @tag
    @path({
        teamId: {
            type: 'string',
            required: true
        }
    })
    static async getMembers(ctx, next) {
        const { caches } = ctx;
        const { teamId } = ctx.validatedParams;
        const user = ctx.state.user.data;
        //如果传入的id和当前登录用户的id相等 表示是自己离开团队
        let team = await Team.findOne({
            where: {
                id: teamId,
            }
        });
        if (!team) {
            // throw new Error("团队不存在")
            ctx.body = responseWrapper(false, "团队不存在");
            return;
        }
        let members = await TeamMembers.findAll({
            where: {
                teamId: teamId
            }
        });
        let userIds = [];
        members.forEach(element => {
            if (userIds.indexOf(element.userId) === -1) {
                userIds.push(element.userId);
            }
        });
        let userList = await User.findAll({
            where: {
                id: {
                    [Op.in]: userIds
                }
            },
            attributes: { exclude: ['password'] }
        });
        userList.forEach((value) => {
            for(let i = 0; i < members.length; i++) {
                let item = members[i];
                if (value.id === item.userId) {
                    value.teamId = item.teamId;
                    value.role = item.role;
                    const teams = caches.Teams.filter((o) => o.id === item.role);
                    value.roleName = "";
                    if(teams && teams.length > 0) {
                        value.roleName = teams[0].name;
                    }
                    break;
                }
            }
        });
        team.members = userList;
        ctx.body = responseWrapper(team);
    }

    @request('post', '/api/team/{teamId}/profile')
    @summary('更新团队名称')
    @tag
    @body({
        name: {
            type: 'string',
            required: true
        }
    })
    @path({
        teamId: {
            type: 'string',
            required: true
        }
    })
    static async updateTeamProfile(ctx, next) {
        console.log(ctx)
        const { teamId } = ctx.validatedParams;
        const user = ctx.state.user.data;
        const body = ctx.request.body

        const team = await Team.findOne({
            where: {
                id: teamId
            }
        })

        if (!team) {
            ctx.body = responseWrapper(false, "团队不存在或者您没有权限修改该信息");
            return;
        }
        await Team.update({ name: body.name }, {
            where: {
                id: teamId,
            },
        })

        ctx.body = responseWrapper(true, "团队名称已修改")
    }

}