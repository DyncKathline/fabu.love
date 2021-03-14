'use strict';

const { request, summary, tags, body, description } = require('../swagger');
const { Op } = require("sequelize");
const User = require("../model/user");
const Team = require("../model/team");
const Teams = require("../model/teams");
const TeamMembers = require("../model/team_members");
const { responseWrapper } = require("../helper/util");
const bcrypt = require("bcryptjs");
const Mail = require('../helper/mail');
const config = require('../config');
const Ldap = require('../helper/ldap');
const crypto = require('crypto');
const { userInTeam } = require('../helper/validator');

const jwt = require('jsonwebtoken');

const tag = tags(['认证']);

var loginSchema = {
    username: {
        type: 'string',
        required: true
    },
    password: {
        type: 'string',
        required: true
    }
}

var registerSchema = {
    username: {
        type: 'string',
        required: true
    },
    password: {
        type: 'string',
        required: true
    },
    email: {
        type: 'string',
        required: true
    }
}

module.exports = class AuthRouter {

    @request('post', '/api/user/apitoken')
    @summary('生成apitoken')
    @tag
    static async apiToken(ctx, next) {
        const userObj = ctx.state.user.data;
        let user = await User.findOne({
            where: {
                id: userObj.id
            }
        });
        if (user) {
            // var key = await bcrypt.hash(user.email, 10)
            const md5 = crypto.createHash('md5');
            const salt = user.email + Date();
            const key = md5.update(user.email + salt).digest('hex');
            const row = await User.update({ apiToken: key }, {
                where: {
                    id: user.id
                }
            });
            ctx.body = responseWrapper(key);
        } else {
            ctx.body = responseWrapper(false, '授权失败，请重新登录后重试');
        }
    }

    @request('post', '/api/user/login')
    @summary('登录')
    @tag
    @body(loginSchema)
    static async login(ctx, next) {
        const { caches } = ctx;
        const { body } = ctx.request;
        console.log("login", body);

        const user = await User.findOne({
            where: {
                username: body.username
            },
            // attributes: { exclude: ['password'] }
        });
        if (user) {
            let valide = await bcrypt.compare(body.password, user.password);
            if (!valide) {
                ctx.body = responseWrapper(false, '用户名或密码错误');
                return;
            }
        } else {
            ctx.body = responseWrapper(false, '用户不存在');
            return;
        }
        let teams = await Team.findAll({
            where: {
                creatorId: user.id
            }
        });
        let teamMembers = await TeamMembers.findAll({
            where: {
                userId: user.id
            }
        })
        let userIds = [];
        teamMembers.forEach((value) => {
            if (userIds.indexOf(value.userId) === -1) {
                userIds.push(value.userId);
            }
        });
        const userList = await User.findAll({
            where: {
                id: {
                    [Op.or]: userIds
                }
            },
            attributes: { exclude: ['password'] }
        });
        //给成员列表补充用户信息
        teamMembers.forEach((value) => {
            userList.every((item) => {
                if (value.userId == item.id) {
                    value.username = item.username;
                    const teams = caches.Teams.filter((o) => o.id == value.role);
                    if(teams && teams.length > 0) {
                        value.roleName = caches.Teams.filter((o) => o.id == value.role)[0].name;
                    }else{
                        value.roleName = "";
                    }
                    
                    return false;
                }
            })

        });
        //给团队列表补充成员信息
        teams.forEach((value) => {
            value.members = [];
            teamMembers.every((item) => {
                if(value.id == item.teamId) {
                    value.members.push(item);
                }
            });
        });

        user.teams = teams;
        user.token = jwt.sign({
            data: {
                id: user.id,
                username: user.username,
                email: user.email
            },
            exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24)
        }, config.secret);
        ctx.body = responseWrapper(user);
    }

    @request('post', '/api/user/register')
    @summary('注册用户')
    @body(registerSchema)
    @tag
    static async register(ctx, next) {
        const { caches } = ctx;
        let { body } = ctx.request;
        if (!config.allowRegister) {
            // throw new Error("不允许注册用户.");
            ctx.body = responseWrapper(false, '不允许注册用户');
            return;
        }
        body.password = await bcrypt.hash(body.password, 10); // 10是 hash加密的级别, 默认是10，数字越大加密级别越高
        const now = Date.now();
        let user = await User.findOne({
            where: { username: body.username }
        });
        if (!user) {
            let newUser = body;

            newUser.createTime = now;

            const { id } = await User.create(newUser);

            newUser.id = id;
            let team = {};
            team.name = "我的团队";
            team.creatorId = newUser.id;
            team.role = caches.Teams[0].id
            team.state = 1
            team.createTime = now;
            const { id: teamId } = await Team.create(team);

            team.members = [{
                id: newUser.id,
                username: newUser.username,
                email: newUser.email,
                role: caches.Teams[0].id,
                roleName: caches.Teams[0].name//"owner"
            }];
            //批量插入
            const team_members = await TeamMembers.bulkCreate([{ teamId: teamId, userId: id, role: team.role }]);

            newUser.teams = [{
                id: team.id,
                name: team.name,
                role: caches.Teams[0].id,
                roleName: caches.Teams[0].name//"owner"
            }];
            ctx.body = responseWrapper(newUser);
        } else {
            ctx.body = responseWrapper(false, "用户已存在");
        }
    }

    @request('post', '/api/user/password/modify')
    @summary('修改用户密码')
    @body({
        oldpwd: {
            type: 'string',
            require: true
        },
        newpwd: {
            type: 'string',
            require: true
        }
    })
    @tag
    static async modifyPassword(ctx, next) {
        const user = ctx.state.user.data;
        const body = ctx.request.body;
        const userData = await User.findOne({
            where: {
                id: user.id
            }
        });
        if (!userData) {
            ctx.body = responseWrapper(false, "用户不存在");
            return;
        }
        let valide = await bcrypt.compare(body.oldpwd, userData.password);
        if (!valide) {
            ctx.body = responseWrapper(false, "密码错误");
            return;
        }
        body.password = await bcrypt.hash(body.newpwd, 10); // 10是 hash加密的级别, 默认是10，数字越大加密级别越高
        await User.update({ password: body.password }, {
            where: {
                id: user.id
            }
        });
        ctx.body = responseWrapper(true, "密码修改成功");
    }

    @request('post', '/api/user/modify')
    @summary('修改用户资料')
    @body({
        mobile: {
            type: 'string'
        },
        qq: {
            type: 'string'
        },
        company: {
            type: 'string'
        },
        career: {
            type: 'string'
        }
    })
    @tag
    static async changeUserInfo(ctx, next) {
        const user = ctx.state.user.data;
        const body = ctx.request.body;
        const userData = await User.findOne({
            where: {
                id: user.id
            },
            attributes: { exclude: ['password'] }
        });
        if (!userData) {
            ctx.body = responseWrapper(false, "用户不存在");
            return;
        }
        await User.update({
            mobile: body.mobile,
            qq: body.qq,
            company: body.company,
            career: body.career
        }, {
            where: {
                username: user.username
            }
        })
        ctx.body = responseWrapper(true, "用户资料修改成功");
    }

    @request('get', '/api/user/info')
    @summary('获取用户资料')
    @tag
    static async getUserInfo(ctx, next) {
        const user = ctx.state.user.data
        const userInfo = await User.findOne({
            where: {
                id: user.id
            },
            attributes: { exclude: ["password"] }
        });
        if (!userInfo) {
            // throw new Error("用户不存在");
            ctx.body = responseWrapper(false, "用户不存在");
        } else {
            ctx.body = responseWrapper(userInfo);
        }
    }

    @request('get', '/api/user/teams')
    @summary('获取用户团队列表')
    @tag
    static async getuserTeams(ctx, next) {
        const { caches } = ctx;
        const userObj = ctx.state.user.data
        let user = await User.findOne({
            where: {
                id: userObj.id
            },
            attributes: { exclude: ['password'] }
        });
        if (!user) {
            ctx.body = responseWrapper(false, '用户不存在');
            return;
        } else {
            const teams = await Team.findAll({
                where: {
                    creatorId: user.id
                }
            });
            const teamTypes = caches.Teams;
            teams.forEach(element => {
                teamTypes.every(ele => {
                    if (ele.id == element.role) {
                        element.roleName = ele.name;
                        return false;
                    }
                });
            });

            user.teams = teams;
            ctx.body = responseWrapper(user);
            return;
        }
    }

    @request('post', '/api/user/resetPassword')
    @summary('通过邮箱重置密码')
    @tag
    @body({
        email: {
            type: 'string',
            required: true
        }
    })
    static async resetPassword(ctx, next) {
        const body = ctx.request.body

        const user = await User.findOne({
            where: {
                email: body.email
            },
            attributes: { exclude: ['password'] }
        });
        if (!user) {
            throw new Error("邮箱有误,没有该用户");
        }

        const newPassword = Math
            .random()
            .toString(36)
            .substring(2, 5) + Math
                .random()
                .toString(36)
                .substring(2, 5);
        const hashPassword = await bcrypt.hash(newPassword, 10); // 10是 hash加密的级别, 默认是10，数字越大加密级别越高
        await User.update({ password: hashPassword }, {
            where: {
                id: user.id
            }
        });
        Mail.send([body.email], "爱发布密码重置邮件", `您的密码已重置${newPassword}`)
        ctx.body = responseWrapper("密码已重置,并通过邮件发送到您的邮箱")
    }
}