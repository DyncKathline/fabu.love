// const mysql = require('mysql');
// import config from '../config';
    
// let connection = mysql.createConnection({
//     host : config.dbHost,
//     user : config.dbUser, 
//     password : config.dbPass,
//     database : config.dbName
// });

// connection.connect(function(err) {
// if (err) {
// console.error('连接失败: ' + err.stack);
// return;
// }

// console.log('连接成功 id ' + connection.threadId);
// });

// module.exports = connection

const mongoose = require('mongoose')
const Fawn = require("fawn");
import config from '../config';

var dbUrl = `mongodb://${config.dbHost}:${config.dbPort}/${config.dbName}`;
if (config.dbUser) {
    dbUrl = `mongodb://${config.dbUser}:${config.dbPass}@${config.dbHost}:${config.dbPort}/${config.dbName}`;
}

console.log(dbUrl)
mongoose.connect(dbUrl, { useNewUrlParser: true, useUnifiedTopology: true }, (err) => {
    if (err) {
        console.log('Mongoose connection error: ' + err.message)
    } else {
        console.log('数据库连接成功')
    }
})

mongoose
    .connection
    .on('disconnected', function () {
        console.log('Mongoose connection disconnected')
    })
Fawn.init(mongoose);

module.exports = mongoose