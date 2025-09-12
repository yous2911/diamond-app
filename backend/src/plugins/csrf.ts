// src/plugins/csrf.ts - CSRF Protection Plugin
import { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import csrfProtection from '@fastify/csrf-protection';
import { config } from '../config/config';

const csrfPlugin: FastifyPluginAsync = async (fastify) => {
  // Register CSRF protection with secure settings
  await fastify.register(csrfProtection, {
    sessionPlugin: '@fastify/cookie', // Use cookies to store the secret
    cookieOpts: {
      signed: true,
      httpOnly: true,
      secure: config.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
    },
    getToken: (req) => {
      // Get token from standard 'x-csrf-token' header
      return req.headers['x-csrf-token'] as string;
    },
  });

  // Optional: Create a dedicated route for the frontend to get the CSRF token
  fastify.get('/api/csrf-token', (request, reply) => {
    const token = reply.generateCsrf();
    reply.send({ token });
  });

  fastify.log.info('✅ CSRF Protection plugin registered successfully.');
};

export default fp(csrfPlugin, {
  name: 'csrf',
  dependencies: ['cookie'], // Ensure the cookie plugin is loaded first
});
