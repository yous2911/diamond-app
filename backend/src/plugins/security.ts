// src/plugins/security.ts
import { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import helmet from '@fastify/helmet';

const securityPlugin: FastifyPluginAsync = async (fastify) => {
  // Enhanced Helmet configuration with a stricter Content Security Policy
  await fastify.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        // Removing 'unsafe-inline' from script-src is a major security improvement.
        // This will likely require changes in the frontend to remove inline scripts.
        scriptSrc: ["'self'", "https://www.googletagmanager.com", "https://www.google-analytics.com"],
        // Removing 'unsafe-inline' from style-src is also recommended.
        // Frontend may need to be updated to load all styles from CSS files.
        styleSrc: ["'self'", "https://fonts.googleapis.com"],
        imgSrc: ["'self'", "data:", "https:", "blob:"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        connectSrc: ["'self'", "http://localhost:3003", "https://api.revedkids.com", "https://sentry.io", "https://www.google-analytics.com"],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
      },
    },
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true,
    },
    frameguard: { action: 'deny' },
    xssFilter: false, // This is deprecated and replaced by modern browser's built-in XSS protection.
    noSniff: true,
    referrerPolicy: { policy: 'same-origin' },
  });

  (fastify.log as any).info('✅ Security plugin with Helmet registered successfully');
};

export default fp(securityPlugin, {
  name: 'security',
});
