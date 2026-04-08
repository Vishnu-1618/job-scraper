// @ts-ignore
import IORedis from 'ioredis';
import dotenv from 'dotenv';
import logger from '../utils/logger';

dotenv.config();

export let isRedisConnected = false;

const connectionString = process.env.REDIS_URL || '';

export const redisConnection = new IORedis(connectionString, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    retryStrategy(times) {
        if (!connectionString || connectionString.trim() === '') {
            logger.warn('[Redis] No REDIS_URL provided. Running without Redis (fallback mode).');
            return null;
        }
        if (times > 2) {
            logger.warn('[Redis] Connection failed after retries. Running without Redis (fallback mode).');
            return null; // Stop retrying
        }
        return Math.min(times * 100, 3000); 
    }
});

redisConnection.on('connect', () => {
    isRedisConnected = true;
    logger.info('[Redis] Connected successfully.');
});

redisConnection.on('error', (err) => {
    isRedisConnected = false;
    // Suppress spammy timeout errors from propagating when running in fallback
});
