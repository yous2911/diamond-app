// src/server.ts - Mise à jour pour inclure les routes GDPR

import Fastify from 'fastify';
import { config } from './config/config';
import { connectDatabase, disconnectDatabase } from './db/connection';
import { randomUUID } from 'crypto';

// Build Fastify instance
const fastify = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
    transport: process.env.NODE_ENV !== 'production' ? {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname',
      },
    } : undefined,
  },
  trustProxy: true,
  bodyLimit: 10485760, // 10MB
  keepAliveTimeout: 5000,
  requestIdHeader: 'x-request-id',
  genReqId: () => randomUUID(),
});

const logger = fastify.log;

// Register plugins
async function registerPlugins() {
  try {
    logger.info('🔧 Starting plugin registration...');
    
    // Core plugins
    logger.info('📦 Registering database plugin...');
    await fastify.register(import('./plugins/database'));
    
    logger.info('📦 Registering redis plugin...');
    await fastify.register(import('./plugins/redis'));
    
    logger.info('📦 Registering cors plugin...');
    await fastify.register(import('./plugins/cors'));
    
    logger.info('📦 Registering security plugin (Helmet)...');
    await fastify.register(import('./plugins/security'));

    // CSRF temporarily disabled - re-enable after CSR grant presentation
    // logger.info('📦 Registering CSRF protection plugin...');
    // await fastify.register(import('./plugins/csrf'));

    logger.info('📦 Registering auth plugin...');
    await fastify.register(import('./plugins/auth'));

    logger.info('📦 Registering rate-limit plugin...');
    await fastify.register(import('./plugins/rate-limit'));
    
    logger.info('📦 Registering websocket plugin...');
    await fastify.register(import('./plugins/websocket'));
    
    logger.info('📦 Registering swagger plugin...');
    await fastify.register(import('./plugins/swagger'));
    
    logger.info('📦 Registering monitoring plugin...');
    await fastify.register(import('./plugins/monitoring'));
    
    logger.info('📦 Registering validation plugin...');
    await fastify.register(import('./plugins/validation'));

    logger.info('🔧 Plugin registration completed successfully');
    
    // Routes - ORDRE IMPORTANT: GDPR en premier pour la sécurité
    logger.info('🛣️ Starting route registration...');
    
    logger.info('🛣️ Registering GDPR routes...');
    await fastify.register(import('./routes/gdpr'), { prefix: '/api/gdpr' });
    
    logger.info('🛣️ Registering auth routes...');
    await fastify.register(import('./routes/auth'), { prefix: '/api/auth' });
    
    logger.info('🛣️ Registering students routes...');
    await fastify.register(import('./routes/students'), { prefix: '/api/students' });
    
    logger.info('🛣️ Registering exercises routes...');
    await fastify.register(import('./routes/exercises'), { prefix: '/api/exercises' });
    
    logger.info('🛣️ Registering curriculum routes...');
    await fastify.register(import('./routes/curriculum'), { prefix: '/api' });
    
    logger.info('🛣️ Registering competences routes...');
    await fastify.register(import('./routes/competences'), { prefix: '/api/competences' });
    
    logger.info('🛣️ Registering mascots routes...');
    await fastify.register(import('./routes/mascots'), { prefix: '/api/mascots' });
    
    logger.info('🛣️ Registering wardrobe routes...');
    await fastify.register(import('./routes/wardrobe'), { prefix: '/api/wardrobe' });
    
    logger.info('🛣️ Registering sessions routes...');
    await fastify.register(import('./routes/sessions'), { prefix: '/api/sessions' });
    
    logger.info('🛣️ Registering analytics routes...');
    await fastify.register(import('./routes/analytics'), { prefix: '/api/analytics' });
    
    logger.info('🛣️ Registering monitoring routes...');
    await fastify.register(import('./routes/monitoring'), { prefix: '/api/monitoring' });
    
    logger.info('🛣️ Registering leaderboard routes...');
    await fastify.register(import('./routes/leaderboard'));
    
    logger.info('🛣️ Registering parent authentication routes...');
    await fastify.register(import('./routes/parent-auth'), { prefix: '/api/parent-auth' });
    
    logger.info('🛣️ Registering parent dashboard routes...');
    await fastify.register(import('./routes/parents'), { prefix: '/api/parents' });
    
    logger.info('🛣️ Registering gamification routes...');
    await fastify.register(import('./routes/gamification'));
    
    logger.info('🛣️ Route registration completed successfully');
    
    // Health check route
    fastify.get('/api/health', async () => {
      const uptime = process.uptime();
      const memory = process.memoryUsage();
      
      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: Math.floor(uptime),
        environment: config!.NODE_ENV,
        version: '2.0.0',
        features: {
          gdpr: config.GDPR_ENABLED,
          redis: (fastify as any).redis ? 'connected' : 'disconnected',
          database: 'connected',
        },
        memory: {
          used: Math.round(memory.heapUsed / 1024 / 1024),
          total: Math.round(memory.heapTotal / 1024 / 1024),
          external: Math.round(memory.external / 1024 / 1024)
        },
        compliance: {
          gdpr: 'enabled',
          dataProtection: 'active',
          auditTrail: 'logging',
        },
      };
    });

    // Root endpoint
    fastify.get('/', async () => {
      return {
        success: true,
        message: 'RevEd Kids Fastify API',
        version: '2.0.0',
        environment: config!.NODE_ENV,
        timestamp: new Date().toISOString(),
        endpoints: {
          health: '/api/health',
          auth: '/api/auth',
          students: '/api/students',
          exercises: '/api/exercises',
          competences: '/api/competences',
          mascots: '/api/mascots',
          wardrobe: '/api/wardrobe',
          sessions: '/api/sessions',
          analytics: '/api/analytics',
          monitoring: '/api/monitoring',
          leaderboards: '/api/leaderboards',
          badges: '/api/badges',
          competitions: '/api/competitions',
          parents: '/api/parents',
          gdpr: '/api/gdpr',
          docs: '/docs',
          enhanced: {
            competenceProgress: '/api/students/:id/competence-progress',
            recordProgress: '/api/students/:id/record-progress',
            prerequisites: '/api/competences/:code/prerequisites',
            achievements: '/api/students/:id/achievements',
            dailyProgress: '/api/analytics/daily-progress',
            mascotEmotion: '/api/mascots/:studentId/emotion',
            wardrobeUnlock: '/api/wardrobe/:studentId/unlock/:itemId',
            sessionStart: '/api/sessions/start',
            sessionEnd: '/api/sessions/:id/end'
          }
        },
        compliance: {
          gdpr: config.GDPR_ENABLED ? 'active' : 'disabled',
          dataRetention: 'configured',
          consentManagement: 'available',
        }
      };
    });
    
    logger.info('✅ All routes registered successfully');

    // Register global error handler
    logger.info('📦 Registering global error handler...');
    const { errorHandler } = await import('./middleware/errorHandler.middleware');
    fastify.setErrorHandler(errorHandler);
    logger.info('🔧 Error handler registered successfully');
    
  } catch (error) {
    logger.error({ err: error }, '❌ Error during plugin/route registration:');
    throw error;
  }
}

// Graceful shutdown
async function gracefulShutdown() {
  try {
    logger.info('Starting graceful shutdown...');
    
    // Close Fastify server (this also closes all plugins)
    await fastify.close();
    
    // Close database connections
    await disconnectDatabase();
    
    logger.info('Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    logger.error({ err: error }, 'Error during graceful shutdown:');
    process.exit(1);
  }
}

// Start server
async function start() {
  try {
    logger.info('🚀 Starting RevEd Kids Fastify server...');
    
    // Validate environment first
    if (!config.JWT_SECRET || !config.ENCRYPTION_KEY) {
      throw new Error('Missing required environment variables: JWT_SECRET, ENCRYPTION_KEY');
    }

    logger.info('✅ Environment variables validated');

    // Test database connection
    logger.info('🔗 Testing database connection...');
    await connectDatabase();
    logger.info('Database connected successfully');

    // Register all plugins and routes
    logger.info('🔧 Registering plugins and routes...');
    await registerPlugins();
    
    // Start the server
    logger.info(`🌐 Starting server on port ${config.PORT}`);
    const address = await fastify.listen({
      port: config.PORT,
      host: config.HOST
    });

    logger.info(`🚀 RevEd Kids Fastify server started successfully!`);
    logger.info(`📍 Server listening on: ${address}`);
    logger.info(`🌍 Environment: ${config.NODE_ENV}`);
    logger.info(`📊 Health Check: ${address}/api/health`);
    logger.info(`📚 API Documentation: ${address}/docs`);
    logger.info(`🔒 GDPR Compliance: ${config.GDPR_ENABLED ? 'ENABLED' : 'DISABLED'}`);
    logger.info(`🛡️ GDPR Endpoints: ${address}/api/gdpr`);

  } catch (error) {
    // Use console.error here as the logger might not be initialized
    console.error('❌ Error starting server:', error);
    console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    process.exit(1);
  }
}

// Handle process signals
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  // Use console.error here as the logger might be in an unknown state
  console.error('❌ Uncaught Exception:', error);
  console.error('❌ Error stack:', error.stack);
  gracefulShutdown();
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  // Use console.error here as the logger might be in an unknown state
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown();
});

// Start the server
start();

export default fastify;
