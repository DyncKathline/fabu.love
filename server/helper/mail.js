'use strict';

const nodemailer = require('nodemailer');
const { email: config } = require('../config')

module.exports = class Mail {

    /** 
     * @argument emails [Array || String] 支持输入多个邮箱组成的数组或者单个邮箱
     * @argument subject String 邮件主题
     * @argument content String<HTML> 邮件内容
     */
    static async send(emails, subject, content) {
        const email = (emails instanceof Array) ? emails.reduce((pv, cv) => { return pv + "," + cv }) : emails
        let transporter = nodemailer.createTransport({
            host: config.host,
            port: config.port,
            secure: config.secure,
            auth: {
                user: config.user,
                pass: config.pass
            }
        })
        let mailOptions = {
            from: `app-publisher<${config.user}>`,
            to: email,
            subject: subject,
            html: content
        }
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                return console.log(error)
            }
            console.log('e-mail send success')
            console.log('Message sent %s', info.messageId)
        })
    }
}