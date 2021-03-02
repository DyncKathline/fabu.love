// var fs = require("fs")
const path = require("path")

const config = {
    baseUrl: process.env.FABU_BASE_URL || "https://127.0.0.1:9898", //baseUrl应用请求的url地址,比如https://fabu.love
    port: process.env.FABU_PORT || "9898", //server运行的端口
    apiPrefix: 'api',

    fileDir: process.env.FABU_UPLOAD_DIR || path.join(__dirname, ".."), //上传文件的存放目录
    secret: process.env.FABU_SECRET || "secretsecret", //secret

    sequelize: {
        dialect: "mysql",
        database: "fabulove",
        host: "127.0.0.1",
        port: 3306,
        username: "root",
        password: "123456",
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
        host: process.env.FABU_DB_HOST || "127.0.0.1",
        port: process.env.FABU_DB_HOST || "6379",
        password: process.env.FABU_DB_HOST || "",
        db: process.env.FABU_DB_HOST || "0",
        keyPrefix: process.env.FABU_DB_HOST || "kath",
    },

    emailService: process.env.FABU_EMAIL_SERVICE || "qq", //邮件相关配置 用于找回密码和邀请团队成员发送邮件
    emailUser: process.env.FABU_EMAIL_USER || "",
    emailPass: process.env.FABU_EMAIL_PASS || "",
    emailPort: process.env.FABU_EMAIL_PORT || "587",

    allowRegister: boolConfig(process.env.FABU_ALLOW_REGISTER || "true"), //是否允许用户注册,为否则后端注册接口不可用

    openLdap: boolConfig(process.env.FABU_ALLOW_LDAP || "false"), //是否开启ldap 默认是false 如果公司没有ldap服务可以不用理会
    ldapServer: process.env.FABU_LDAP_URL || "", //ldap server url
    ldapUserDn: process.env.FABU_LDAP_USERDN || "", //ldap管理员dn 也就是管理员用户名
    ldapBindCredentials: process.env.FABU_LDAP_CREDENTIALS || "", //ldap管理员密码
    ldapBase: process.env.FABU_LDAP_BASE || "", //ldap base
};

function boolConfig(str) {
    if (str == 'true') {
        return true
    } else {
        return false
    }
}


module.exports = config;