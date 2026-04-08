// @ts-ignore
import IORedis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.REDIS_URL || 'redis://localhost:6379';

export const redisConnection = new IORedis(connectionString, {
    maxRetriesPerRequest: null,
});
