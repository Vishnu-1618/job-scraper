const Redis = require('ioredis');
const redis = new Redis('redis://localhost:6379');

redis.info().then(info => {
    const versionMatch = info.match(/redis_version:(\d+\.\d+\.\d+)/);
    console.log('--- REDIS INFO ---');
    console.log('Connected to:', 'redis://localhost:6379');
    console.log('Redis Version:', versionMatch ? versionMatch[1] : 'Unknown');
    process.exit(0);
}).catch(err => {
    console.error('Error connecting to Redis:', err.message);
    process.exit(1);
});
