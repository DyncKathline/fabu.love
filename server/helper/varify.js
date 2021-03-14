import { User } from '../model/user'
import { resolve } from 'dns';
import compose from 'koa-compose'

export default class Varify {

    static async auth(key) {
        if (key) {
            const user = await User.findOne({
                where: { apiToken: key }
            })
            if (!user) {
                return {
                    status: 408,
                    msg: 'api token is not exist'
                }
            }
            return user
        } else {
            return {
                status: 408,
                msg: 'api token is not exist'
            }
        }
    }

}