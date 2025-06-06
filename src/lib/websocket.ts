// src/lib/websocket.ts
import { WebSocketServer, WebSocket } from 'ws';
import type { IncomingMessage } from 'http';
import type { Socket } from 'net';
import { parse } from 'url';

// Global store for WebSocket server and clients.
// This approach has limitations in serverless environments.
declare global {
  // eslint-disable-next-line no-var
  var _webSocketServerInstance: WebSocketServer | undefined;
  // eslint-disable-next-line no-var
  var _webSocketClients: Set<WebSocket> | undefined;
}

const clients = globalThis._webSocketClients || new Set<WebSocket>();
if (!globalThis._webSocketClients) {
  globalThis._webSocketClients = clients;
}

export function initializeWebSocketServer(server?: any): WebSocketServer {
  let wss = globalThis._webSocketServerInstance;
  if (!wss) {
    console.log('Initializing WebSocket Server...');
    // If a server instance is passed (e.g. from a custom Next.js server), use it.
    // Otherwise, create a new server (e.g., for `noServer` mode or standalone).
    wss = new WebSocketServer({ noServer: true }); // Use noServer for manual upgrade

    wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
      const { pathname } = parse(req.url || '', true);
      if (pathname === '/api/orders/ws') { // Only handle connections to our specific path
        console.log('Client connected to WebSocket at /api/orders/ws');
        clients.add(ws);

        ws.on('message', (message: Buffer) => {
          // Handle incoming messages from clients if needed
          // For now, we mostly broadcast from server to clients.
          console.log('Received message from client:', message.toString());
          // Example: ws.send(`Echo: ${message}`);
        });

        ws.on('close', () => {
          console.log('Client disconnected from WebSocket');
          clients.delete(ws);
        });

        ws.on('error', (error: Error) => {
          console.error('WebSocket error:', error);
          clients.delete(ws); // Ensure client is removed on error
        });
      } else {
        // If connection is not for our path, destroy the socket.
        console.log(`WebSocket connection attempt to unknown path: ${pathname}, closing.`);
        ws.terminate();
      }
    });
    
    globalThis._webSocketServerInstance = wss;
    console.log('WebSocket Server initialized.');
  }
  return wss;
}

export function getWebSocketServer(): WebSocketServer | undefined {
  return globalThis._webSocketServerInstance;
}

export function broadcastMessage(type: string, payload?: any) {
  if (clients.size === 0) {
    // console.log("No WebSocket clients connected, skipping broadcast.");
    return;
  }
  // console.log(`Broadcasting message to ${clients.size} clients:`, { type, payload });
  const message = JSON.stringify({ type, payload });
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

// Specific broadcast function for order updates
export function broadcastOrderUpdate(orderId?: string, status?: string) {
  console.log(`Broadcasting order update: ID ${orderId}, Status: ${status}`);
  broadcastMessage('ORDERS_UPDATED', { orderId, status });
}

// Call this function when the main HTTP server is created (e.g. in a custom server.js)
// For App Router API routes, we'll call `handleUpgrade` manually.
// export function setupWebSocketHandling(server: http.Server) {
//   initializeWebSocketServer(server);
// }
