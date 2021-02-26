const mongoose = require('mongoose')
const Fawn = require("fawn");
const {mongodb} = require('../config');

var dbUrl = `mongodb://${mongodb.host}:${mongodb.port}/${mongodb.name}`;
if (mongodb.user) {
    dbUrl = `mongodb://${mongodb.user}:${mongodb.password}@${mongodb.host}:${mongodb.port}/${mongodb.name}`;
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