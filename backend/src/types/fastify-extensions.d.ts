import '@fastify/jwt';

declare module 'fastify' {
  interface FastifyInstance {
    // JWT plugins
    refreshJwt: {
      sign: (payload: any, options?: any) => Promise<string>;
      verify: (token: string) => Promise<any>;
    };

    // Authentication decorators
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    optionalAuth: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    authenticateAdmin: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    authRateLimit: any;

    // Cookie helpers
    setAuthCookies: (reply: FastifyReply, accessToken: string, refreshToken: string) => void;
    clearAuthCookies: (reply: FastifyReply) => void;

    // CSRF protection
    csrfProtection: any;

    // Cache
    cache: any;
    redis: any;

    // File system
    fs: any;
  }
}
