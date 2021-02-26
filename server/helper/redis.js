const client = require('redis')
const { redis: redisConfig } = require('../config');

const options = {
	host: redisConfig.host,
	port: redisConfig.port,
	password: redisConfig.password,
	db: redisConfig.db,
	keyPrefix: redisConfig.keyPrefix,
	retry_strategy: function (options) {
    // 重连机制
    if (options.error && options.error.code === "ECONNREFUSED") {
      // End reconnecting on a specific error and flush all commands with
      // a individual error
      return new Error("The server refused the connection");
    }
    if (options.total_retry_time > 1000 * 60 * 60) {
      // End reconnecting after a specific timeout and flush all commands
      // with a individual error
      return new Error("Retry time exhausted");
    }
    if (options.attempt > 10) {
      // End reconnecting with built in error
      return undefined;
    }
    // reconnect after
    return Math.min(options.attempt * 100, 3000);
  }
}

// 生成redis的client
const redisClient = client.createClient(options)
 
const redis = {
	async set(key, value, seconds) {
    let redis = redisClient;
    value = JSON.stringify(value);
    if (!seconds) {
      await redis.set(key, value);
    } else {
      // 设置有效时间
      await redis.set(key, value, "EX", seconds);
    }
  },
  async get(key) {
    let redis = redisClient;
    let data = await redis.get(key);
    if (!data) return;
    data = JSON.parse(data);
    return data;
  },
  async del(key) {
    let redis = redisClient;
    return await redis.del(key);
  },

  async expire(key, seconds) {
    let redis = redisClient;
    return await redis.expire(key, seconds);
  },
  async keys(pattern) {
    let redis = redisClient;
    return await redis.keys(pattern);
  },

  async hset(id, key, value, seconds) {
    let redis = redisClient;
    redis.hset(id, { [key]: value });
    if (seconds) {
      redis.expire(id, seconds);
    }
  },
  async hget(id, key) {
    let redis = redisClient;
    return await redis.hget(id, key);
  },
  async hdel(id, ...key) {
    let redis = redisClient;
    return await redis.hdel(id, ...key);
  },
  async hgetAll(id) {
    let redis = redisClient;
    return await redis.hgetall(id);
  },
  async hkeys(id) {
    let redis = redisClient;
    return await redis.hkeys(id);
  },

  async clear() {
    let redis = redisClient;
    redis.flushall();
    return;
  }
}
 
// 导出
module.exports = redis