/**
 * Mock Server for Performance Testing
 * Simulates the Diamond App backend without database dependencies
 */

const Fastify = require('fastify');

// Create mock server instance
const createMockServer = (options = {}) => {
  const fastify = Fastify({
    logger: {
      level: 'info',
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss',
          ignore: 'pid,hostname'
        }
      }
    },
    trustProxy: true,
    bodyLimit: 10485760, // 10MB
    keepAliveTimeout: 5000
  });

  // Mock student data for testing
  const mockStudents = [
    {
      id: 1,
      prenom: 'Emma',
      nom: 'Martin',
      identifiant: 'emma.martin',
      classe: '6A',
      niveau: 'CP',
      ageGroup: '6-8',
      totalXp: 150,
      currentLevel: 3,
      currentStreak: 5,
      heartsRemaining: 3,
      dateInscription: '2024-01-15',
      lastLogin: new Date().toISOString()
    },
    {
      id: 2,
      prenom: 'Lucas',
      nom: 'Dubois',
      identifiant: 'lucas.dubois',
      classe: '6A',
      niveau: 'CP',
      ageGroup: '6-8',
      totalXp: 200,
      currentLevel: 4,
      currentStreak: 3,
      heartsRemaining: 2,
      dateInscription: '2024-01-20',
      lastLogin: new Date().toISOString()
    }
  ];

  const mockCompetences = [
    {
      id: 1,
      code: 'MA01',
      nom: 'Compter jusqu\'à 10',
      matiere: 'MA',
      domaine: 'Nombres',
      niveauComp: 1,
      sousCompetence: 1,
      description: 'Savoir compter de 1 à 10',
      seuilMaitrise: 80,
      xpReward: 15
    },
    {
      id: 2,
      code: 'FR01',
      nom: 'Reconnaître les lettres',
      matiere: 'FR',
      domaine: 'Lecture',
      niveauComp: 1,
      sousCompetence: 1,
      description: 'Reconnaître toutes les lettres de l\'alphabet',
      seuilMaitrise: 85,
      xpReward: 10
    }
  ];

  const mockExercises = [
    {
      id: 1,
      competenceId: 1,
      type: 'QCM',
      question: 'Combien font 2 + 3 ?',
      correctAnswer: '5',
      options: ['4', '5', '6', '7'],
      difficultyLevel: 1,
      xpReward: 15,
      timeLimit: 60,
      hintsAvailable: 1
    },
    {
      id: 2,
      competenceId: 2,
      type: 'QCM',
      question: 'Quelle est cette lettre : A ?',
      correctAnswer: 'A',
      options: ['A', 'B', 'C', 'D'],
      difficultyLevel: 1,
      xpReward: 10,
      timeLimit: 30,
      hintsAvailable: 0
    }
  ];

  // Rate limiting middleware (mock)
  let requestCount = new Map();
  const rateLimitMiddleware = async (request, reply) => {
    const ip = request.ip;
    const now = Date.now();
    const windowStart = now - 60000; // 1-minute window

    if (!requestCount.has(ip)) {
      requestCount.set(ip, []);
    }

    const requests = requestCount.get(ip).filter(time => time > windowStart);
    requests.push(now);
    requestCount.set(ip, requests);

    if (requests.length > 100) { // 100 requests per minute limit
      reply.code(429).send({ error: 'Too Many Requests' });
      return;
    }
  };

  // Register rate limiting
  fastify.addHook('preHandler', rateLimitMiddleware);

  // CORS setup
  fastify.register(require('@fastify/cors'), {
    origin: ['http://localhost:3002', 'http://localhost:3004'],
    credentials: true
  });

  // Health check endpoint
  fastify.get('/api/health', async (request, reply) => {
    const uptime = process.uptime();
    const memory = process.memoryUsage();
    
    // Simulate some processing time
    await new Promise(resolve => setTimeout(resolve, Math.random() * 10));

    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(uptime),
      environment: 'test',
      version: '2.0.0',
      features: {
        gdpr: false,
        redis: 'mock',
        database: 'mock'
      },
      memory: {
        used: Math.round(memory.heapUsed / 1024 / 1024),
        total: Math.round(memory.heapTotal / 1024 / 1024),
        external: Math.round(memory.external / 1024 / 1024)
      },
      performance: {
        responseTime: Math.random() * 50 + 10 // 10-60ms
      }
    };
  });

  // Root endpoint
  fastify.get('/', async () => {
    return {
      success: true,
      message: 'RevEd Kids Mock API for Performance Testing',
      version: '2.0.0',
      environment: 'test',
      timestamp: new Date().toISOString(),
      endpoints: {
        health: '/api/health',
        auth: '/api/auth',
        students: '/api/students',
        exercises: '/api/exercises',
        competences: '/api/competences'
      }
    };
  });

  // Mock authentication endpoint
  fastify.post('/api/auth/login', async (request, reply) => {
    const { prenom, nom, password } = request.body || {};
    
    // Simulate authentication processing time
    await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 50));

    if (!prenom || !nom || password !== 'password123') {
      reply.code(401).send({
        success: false,
        error: { message: 'Invalid credentials', code: 'INVALID_CREDENTIALS' }
      });
      return;
    }

    const student = mockStudents.find(s => 
      s.prenom.toLowerCase() === prenom.toLowerCase() && 
      s.nom.toLowerCase() === nom.toLowerCase()
    );

    if (!student) {
      reply.code(404).send({
        success: false,
        error: { message: 'Student not found', code: 'STUDENT_NOT_FOUND' }
      });
      return;
    }

    return {
      success: true,
      data: {
        student: { ...student, lastLogin: new Date().toISOString() },
        expiresIn: 3600
      }
    };
  });

  // Mock logout endpoint
  fastify.post('/api/auth/logout', async () => {
    await new Promise(resolve => setTimeout(resolve, 20));
    return {
      success: true,
      data: { message: 'Logged out successfully' }
    };
  });

  // Mock competences endpoint
  fastify.get('/api/competences', async (request, reply) => {
    const { matiere, niveau } = request.query || {};
    
    await new Promise(resolve => setTimeout(resolve, Math.random() * 30));

    let filteredCompetences = [...mockCompetences];
    
    if (matiere) {
      filteredCompetences = filteredCompetences.filter(c => c.matiere === matiere);
    }
    
    return {
      success: true,
      data: filteredCompetences
    };
  });

  // Mock exercises endpoint
  fastify.get('/api/exercises/by-level/:level', async (request, reply) => {
    const { level } = request.params;
    
    await new Promise(resolve => setTimeout(resolve, Math.random() * 40));

    return {
      success: true,
      data: mockExercises
    };
  });

  // Mock exercise submission
  fastify.post('/api/exercises/attempt', async (request, reply) => {
    const { exerciseId, score, completed, timeSpent } = request.body || {};
    
    // Simulate processing time for complex operations
    await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 30));

    const xpEarned = completed && score > 70 ? 15 : 5;

    return {
      success: true,
      data: {
        attempt: {
          id: Math.floor(Math.random() * 1000),
          exerciseId,
          score: parseInt(score),
          completed: completed === 'true',
          timeSpent: parseInt(timeSpent),
          timestamp: new Date().toISOString()
        },
        xpEarned,
        masteryLevelChanged: Math.random() > 0.8
      }
    };
  });

  // Mock student stats
  fastify.get('/api/students/stats', async () => {
    await new Promise(resolve => setTimeout(resolve, Math.random() * 50));

    return {
      success: true,
      data: {
        stats: {
          totalCorrectAnswers: Math.floor(Math.random() * 100) + 50,
          totalExercises: Math.floor(Math.random() * 150) + 70,
          averageScore: Math.floor(Math.random() * 30) + 70,
          streakCount: Math.floor(Math.random() * 10) + 1
        }
      }
    };
  });

  // Mock mascot endpoint
  fastify.get('/api/mascots/:studentId', async (request, reply) => {
    const { studentId } = request.params;
    
    await new Promise(resolve => setTimeout(resolve, Math.random() * 25));

    return {
      success: true,
      data: {
        mascot: {
          id: 1,
          studentId: parseInt(studentId),
          type: 'dragon',
          currentEmotion: 'happy',
          xpLevel: 15,
          equippedItems: [1, 3, 5],
          lastInteraction: new Date().toISOString()
        }
      }
    };
  });

  // Error handling
  fastify.setErrorHandler((error, request, reply) => {
    fastify.log.error(error);
    reply.code(500).send({
      success: false,
      error: {
        message: 'Internal Server Error',
        code: 'INTERNAL_ERROR'
      }
    });
  });

  return fastify;
};

module.exports = { createMockServer };

// Start server if called directly
if (require.main === module) {
  const server = createMockServer();
  
  const start = async () => {
    try {
      await server.listen({ port: 3003, host: '0.0.0.0' });
      console.log('🚀 Mock server running on http://localhost:3003');
      console.log('📊 Ready for performance testing!');
    } catch (err) {
      server.log.error(err);
      process.exit(1);
    }
  };

  start();
}