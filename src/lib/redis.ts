// src/lib/redis.ts
import Redis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL;

if (!REDIS_URL) {
  console.warn(
    'REDIS_URL is not set in environment variables. WebSocket message broadcasting will not scale across multiple instances. For multi-instance deployments, please provide a REDIS_URL.'
  );
}

// Singleton pattern for Redis clients
declare global {
  // eslint-disable-next-line no-var
  var redisPublisher: Redis | undefined;
  // eslint-disable-next-line no-var
  var redisSubscriber: Redis | undefined;
}

let publisher: Redis | null = null;
let subscriber: Redis | null = null;

if (REDIS_URL) {
  if (!globalThis.redisPublisher) {
    globalThis.redisPublisher = new Redis(REDIS_URL, { 
        maxRetriesPerRequest: null, // Important for pub/sub to keep trying
        enableReadyCheck: false // Allows commands before 'ready' for pub/sub
    });
    globalThis.redisPublisher.on('error', (err) => console.error('Redis Publisher Error:', err));
    globalThis.redisPublisher.on('connect', () => console.log('Redis Publisher connected.'));
  }
  publisher = globalThis.redisPublisher;

  if (!globalThis.redisSubscriber) {
    globalThis.redisSubscriber = new Redis(REDIS_URL, {
        maxRetriesPerRequest: null,
        enableReadyCheck: false
    });
    globalThis.redisSubscriber.on('error', (err) => console.error('Redis Subscriber Error:', err));
    globalThis.redisSubscriber.on('connect', () => console.log('Redis Subscriber connected.'));

  }
  subscriber = globalThis.redisSubscriber;
} else {
  console.log("Redis not configured, WebSocket broadcasting will be local to each server instance.");
}

export { publisher as redisPublisher, subscriber as redisSubscriber };
