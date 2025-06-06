// src/lib/websocket.ts
import { WebSocketServer, WebSocket } from 'ws';
import type { IncomingMessage } from 'http';
import { parse } from 'url';
import { redisPublisher, redisSubscriber } from './redis'; // Import Redis clients

const REDIS_CHANNEL = 'caffico-order-updates';

// Global store for WebSocket server and clients for THIS INSTANCE.
declare global {
  // eslint-disable-next-line no-var
  var _webSocketServerInstance: WebSocketServer | undefined;
  // eslint-disable-next-line no-var
  var _webSocketClientsThisInstance: Set<WebSocket> | undefined;
}

const clientsThisInstance = globalThis._webSocketClientsThisInstance || new Set<WebSocket>();
if (!globalThis._webSocketClientsThisInstance) {
  globalThis._webSocketClientsThisInstance = clientsThisInstance;
}

let isRedisSubscribed = false;

export function initializeWebSocketServer(): WebSocketServer {
  let wss = globalThis._webSocketServerInstance;
  if (!wss) {
    console.log('Initializing WebSocket Server instance...');
    wss = new WebSocketServer({ noServer: true }); // Use noServer for manual upgrade

    wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
      const { pathname } = parse(req.url || '', true);
      if (pathname === '/api/orders/ws') {
        console.log(`[Instance] Client connected to WebSocket at /api/orders/ws. Total clients on this instance: ${clientsThisInstance.size + 1}`);
        clientsThisInstance.add(ws);

        // Subscribe to Redis if this is the first client on this instance and Redis is configured
        if (redisSubscriber && !isRedisSubscribed && clientsThisInstance.size === 1) {
          redisSubscriber.subscribe(REDIS_CHANNEL, (err, count) => {
            if (err) {
              console.error('Failed to subscribe to Redis channel:', err);
              return;
            }
            isRedisSubscribed = true;
            console.log(`[Instance] Subscribed to Redis channel '${REDIS_CHANNEL}'. Count: ${count}`);
          });

          redisSubscriber.on('message', (channel, message) => {
            if (channel === REDIS_CHANNEL) {
              // console.log(`[Instance] Received message from Redis on channel ${channel}:`, message);
              clientsThisInstance.forEach((client) => {
                if (client.readyState === WebSocket.OPEN) {
                  client.send(message);
                }
              });
            }
          });
        }

        ws.on('close', () => {
          clientsThisInstance.delete(ws);
          console.log(`[Instance] Client disconnected. Remaining clients on this instance: ${clientsThisInstance.size}`);
          // Unsubscribe from Redis if this was the last client on this instance (optional, for resource management)
          if (redisSubscriber && isRedisSubscribed && clientsThisInstance.size === 0) {
            redisSubscriber.unsubscribe(REDIS_CHANNEL, (err, count) => {
                 if (err) {
                    console.error('Failed to unsubscribe from Redis channel:', err);
                    return;
                 }
                 isRedisSubscribed = false;
                 console.log(`[Instance] Unsubscribed from Redis channel '${REDIS_CHANNEL}'. New subscription count: ${count}`);
                 // Note: redisSubscriber.removeAllListeners('message') might be too aggressive if other parts use it.
                 // For simplicity, we assume this is the only message listener.
                 // In a more complex app, manage listeners carefully.
                 redisSubscriber.removeAllListeners('message'); 
            });
          }
        });

        ws.on('error', (error: Error) => {
          console.error('[Instance] WebSocket error:', error);
          clientsThisInstance.delete(ws); // Ensure client is removed on error
        });
      } else {
        console.log(`[Instance] WebSocket connection attempt to unknown path: ${pathname}, closing.`);
        ws.terminate();
      }
    });
    
    globalThis._webSocketServerInstance = wss;
    console.log('[Instance] WebSocket Server initialized.');
  }
  return wss;
}

export function getWebSocketServer(): WebSocketServer | undefined {
  return globalThis._webSocketServerInstance;
}

export async function broadcastMessage(type: string, payload?: any) {
  const message = JSON.stringify({ type, payload });
  if (redisPublisher) {
    try {
      await redisPublisher.publish(REDIS_CHANNEL, message);
      // console.log(`[Instance] Message published to Redis channel '${REDIS_CHANNEL}':`, { type, payload });
    } catch (error) {
        console.error(`[Instance] Failed to publish message to Redis: `, error);
        // Fallback to local broadcast if Redis publish fails? Or just log?
        // For now, just log. Depending on requirements, could add fallback.
    }
  } else {
    // Fallback to local broadcast if Redis is not configured
    // console.log("[Instance] Redis not configured. Broadcasting message locally to clients on this instance:", { type, payload });
    clientsThisInstance.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
    if (clientsThisInstance.size === 0) {
        // console.log("[Instance] No local WebSocket clients connected, skipping local broadcast.");
    }
  }
}

export async function broadcastOrderUpdate(orderId?: string, status?: string) {
  // console.log(`[Instance] Broadcasting order update: ID ${orderId}, Status: ${status}`);
  await broadcastMessage('ORDERS_UPDATED', { orderId, status });
}
