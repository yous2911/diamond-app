// src/plugins/websocket.ts
// DISABLED: Plugin désactivé temporairement - @fastify/websocket incompatible avec Fastify 4.x
// TODO: Réactiver quand @fastify/websocket sera compatible avec Fastify 4.x

/*
import fp from 'fastify-plugin';
// import websocket from '@fastify/websocket'; // DISABLED
import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { config } from '../config/config';
import { realTimeProgressService } from '../services/real-time-progress.service.js';

const websocketPlugin: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // Register websocket support
  await fastify.register(websocket, {
    options: {
      maxPayload: 1048576, // 1MB
      verifyClient: (info: any, callback: (result: boolean) => void) => {
        // Add authentication logic here if needed
        callback(true);
      },
    },
  });

  // FIXED: Register WebSocket route in a separate context to avoid conflicts
  await fastify.register(async function websocketRoutes(fastify: FastifyInstance) {
    // WebSocket endpoint - separate from HTTP routes
    fastify.get('/ws', { websocket: true }, (connection: any, request: any) => {
      const connectionId = request.id || `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      connection.socket.on('message', (message: Buffer) => {
        try {
          const data = JSON.parse(message.toString());
          
          switch (data.type) {
            case 'ping':
              connection.socket.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
              break;
              
            case 'register':
              // Register user connection for real-time updates
              if (data.userId && data.userType) {
                realTimeProgressService.registerConnection(connectionId, connection.socket, data.userId, data.userType);
                connection.socket.send(JSON.stringify({ 
                  type: 'registered', 
                  connectionId,
                  message: `Connecté en tant que ${data.userType}` 
                }));
                (fastify.log as any).info(`User ${data.userId} (${data.userType}) registered with connection ${connectionId}`);
              }
              break;
              
            case 'subscribe':
              // Handle specific subscriptions
              connection.socket.send(JSON.stringify({ 
                type: 'subscribed', 
                message: 'Abonnement réussi' 
              }));
              break;
              
            default:
              (fastify.log as any).warn('Unknown WebSocket message type:', data.type);
          }
        } catch (error) {
          (fastify.log as any).error('WebSocket message parsing error:', error);
          connection.socket.send(JSON.stringify({ 
            type: 'error', 
            message: 'Erreur de traitement du message' 
          }));
        }
      });

      connection.socket.on('close', () => {
        (fastify.log as any).info(`WebSocket connection ${connectionId} closed`);
      });

      connection.socket.on('error', (error: Error) => {
        (fastify.log as any).error(`WebSocket connection ${connectionId} error:`, error);
      });

      // Send welcome message
      connection.socket.send(JSON.stringify({ 
        type: 'welcome', 
        connectionId,
        message: 'Connexion WebSocket établie - Envoyez un message "register" avec userId et userType' 
      }));
      
      (fastify.log as any).info(`WebSocket connection ${connectionId} established`);
    });
  });

  // Enhanced broadcast helper integrated with real-time progress service
  fastify.decorate('broadcastToStudent', (studentId: number, message: any) => {
    // This will be handled by the real-time progress service
    const payload = JSON.stringify(message);
    (fastify.log as any).info(`Broadcasting to student ${studentId}:`, message.type);
  });

  fastify.decorate('broadcastToParent', (parentId: number, message: any) => {
    // This will be handled by the real-time progress service
    const payload = JSON.stringify(message);
    (fastify.log as any).info(`Broadcasting to parent ${parentId}:`, message.type);
  });

  // Global broadcast helper (legacy support)
  fastify.decorate('broadcast', (message: any) => {
    (fastify.log as any).info('Global broadcast:', message.type);
  });

  (fastify.log as any).info('✅ WebSocket plugin with real-time progress integration registered successfully');
};

export default fp(websocketPlugin, { name: 'websocket' });
*/

// Plugin désactivé - export vide pour éviter les erreurs d'import
import fp from 'fastify-plugin';

const websocketPlugin = fp(async () => {
  // Plugin désactivé - ne fait rien
  // @fastify/websocket n'est pas installé car incompatible avec Fastify 4.x
}, {
  name: 'websocket',
  dependencies: []
});

export default websocketPlugin;
