// 导入koa，和koa 1.x不同，在koa2中，我们导入的是一个class，因此用大写的Koa表示:
import router from './controller';
import config from './config';

const Koa = require('koa');
const bodyParser = require('koa-bodyparser');
// 导入controller middleware:
const rest = require('./helper/rest');
const serve = require('koa-static');
const cors = require('koa-cors');
const koajwt = require('koa-jwt');
const path = require('path');
const fs = require('fs');
const send = require('koa-send');
const mount = require('koa-mount');

const app = new Koa();

//挂载redis实例到ctx上
const redis = require('./helper/redis');
app.context.redis = redis;

//挂载sequelize实例到ctx上
const model = require('./model');
app.context.model = model;
function caches(ctx) {
    return new Promise(async (resolve, reject) => {
        let caches = {};
        caches["IpType"] = await model.IpType.findAll();
        caches["Status"] = await model.Status.findAll();
        caches["UpdateMode"] = await model.UpdateMode.findAll();
        caches["Teams"] = await model.Teams.findAll();
        resolve(caches);
    });
}
caches(app.context).then( res => {
    app.context.caches = res;
});

import Varify from './helper/varify'
import Helper from './helper/MiddleHelper'
import { isNull, isUndefined } from 'util';

var helper = new Helper();

app.use(cors());
app.use(bodyParser());
app.use(serve(path.resolve(config.fileDir)));
app.use(serve(path.join(__dirname, '..', 'client/dist')));

app.use(function (ctx, next) {
    if (ctx.request.path.indexOf("/api") != 0) {
        ctx.response.type = 'html';
        ctx.response.body = fs.readFileSync(path.join(__dirname, '..', 'client/dist/index.html'), 'utf8');
    } else {
        return next()
    }
});

var middleware = koajwt({ secret: config.secret, debug: true }).unless({
    path: [
        '/api/user/register',
        '/api/user/login',
        '/api/user/resetPassword',
        '/api/swagger',
        '/api/swagger.json',
        /\/api\/plist\/.+/,
        /\/api\/count\/.+/,
        /\/api\/app\/.+/
    ]
});

app.use(async (ctx, next) => {
    return next().catch((err) => {
        // console.log('kath---', err.status)
        // console.log('kath---', err)
        if (err.status === 401) {
            // 自定义返回结果
            ctx.status = 401;
            ctx.body = {
                code: 0,
                msg: err.message
            }
        } else {
            throw err;
        }
    })
});

app.use(async (ctx, next) => {
    var key = ctx.request.headers['apikey']
    if (!isUndefined(key)) {
        var user = await Varify.auth(key).catch(error => {
            throw error
        })
        ctx.state.user = { data: user }
        await next()
    } else {
        await next()
    }
});

app.use(helper.skip(middleware).if((ctx) => {
    var key = ctx.request.headers['apikey']
    return !isUndefined(key)
}));

app.use(rest.restify());
app.use(router.routes());

export default app.listen(config.port, () => {
    console.log(`App is listening on ${config.port}.`);
});