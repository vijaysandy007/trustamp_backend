const Redis = require("ioredis");

const client = new Redis({
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT
});

const persistentClient = new Redis({
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    db: 8
});

module.exports = {
    client,
    persistentClient,
};