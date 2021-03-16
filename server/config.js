// var fs = require("fs")
const path = require("path")
//通过设置NODE_ENV来加载不同环境
let dotenv = require("dotenv")
const isProduction = process.env.NODE_ENV === 'production'
dotenv.config({ path: isProduction ? './.env.pro' : './.env.dev' })
console.log('----------', process.env.NODE_ENV, isProduction)

const config = {
    baseUrl: process.env.FABU_BASE_URL || "https://127.0.0.1:9898", //baseUrl应用请求的url地址,比如https://fabu.love
    port: process.env.FABU_PORT || "9898", //server运行的端口
    apiPrefix: 'api',

    fileDir: process.env.FABU_UPLOAD_DIR || path.join(__dirname, ".."), //上传文件的存放目录
    secret: process.env.FABU_SECRET || "secretsecret", //secret

    sequelize: {
        dialect: "mysql",
        database: process.env.FABU_DB || "fabulove",
        host: process.env.FABU_DB_HOST || "127.0.0.1",
        port: process.env.FABU_DB_PORT || 3306,
        username: process.env.FABU_DB_USER || "root",
        password: process.env.FABU_DB_PASSWORD || "123456",
        query: { raw: true },
        define: {
            // 使用自己配置的表名，避免sequelize自动将表名转换为复数
            freezeTableName: true,
            // don't add the timestamp attributes (updatedAt, createdAt)
            timestamps: false,
            updatedAt: "updated_time",
            createdAt: "created_time",
            hooks: {
                beforeValidate: function (obj) {
                    const now = Date.now();
                    obj.updated_time = now;
                    obj.created_time = now;
                }
            }
        }
    },

    redis: {
        host: process.env.FABU_REDIS_HOST || "127.0.0.1",
        port: process.env.FABU_REDIS_PORT || "6379",
        password: process.env.FABU_REDIS_PASSWORD || "",
        db: process.env.FABU_REDIS_DB || "0",
        keyPrefix: process.env.FABU_REDIS_KEY || "kath",
    },

    email: {
        host: process.env.FABU_EMAIL_HOST || "smtp.163.com", //邮件相关配置 用于找回密码和邀请团队成员发送邮件
        user: process.env.FABU_EMAIL_USER || "xiongxuesong93@163.com",
        pass: process.env.FABU_EMAIL_PASS || "BTGJBKPUTFTBIHAZ",
        port: process.env.FABU_EMAIL_PORT || "465",
        secure: process.env.FABU_EMAIL_SECURE || "true",
    },

    allowRegister: boolConfig(process.env.FABU_ALLOW_REGISTER || true), //是否允许用户注册,为否则后端注册接口不可用
    title: process.env.FABU_TITLE || '爱发布'
};

function boolConfig(str) {
    if (str == 'true') {
        return true
    } else {
        return false
    }
}


module.exports = config;