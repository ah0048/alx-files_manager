const redis = require('redis');
const { promisify } = require('util');

class RedisClient {
  constructor() {
    this.client = redis.createClient();
    this.client.on('connect', () => {
      console.log('Redis client connected successfully.');
    });
    this.client.on('error', (err) => {
      console.error('Error connecting to Redis:', err);
    });

    // Promisify Redis methods
    this.getAsync = promisify(this.client.get).bind(this.client);
    this.setAsync = promisify(this.client.set).bind(this.client);
    this.delAsync = promisify(this.client.del).bind(this.client);
  }

  isAlive() {
    return this.client.connected;
  }

  async get(key) {
    if (typeof key !== 'string') {
      throw new Error('Key must be a string value');
    }
    const value = await this.getAsync(key);
    return value;
  }

  async set(key, value, duration) {
    if (typeof key !== 'string') {
      throw new Error('Key must be a string value');
    }
    await this.setAsync(key, value, 'EX', duration);
  }

  async del(key) {
    if (typeof key !== 'string') {
      throw new Error('Key must be a string value');
    }
    await this.delAsync(key);
  }
}

const redisClient = new RedisClient();
module.exports = redisClient;
