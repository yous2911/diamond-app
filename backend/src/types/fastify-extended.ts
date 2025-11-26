import 'fastify';
import { FastifyRequest as OriginalFastifyRequest } from 'fastify';

declare module 'fastify' {
  interface FastifyInstance {
    // Cache service
    cache: any;
    
    // Redis service
    redis: {
      get(key: string): Promise<string | null>;
      set(key: string, value: string, ttl?: number): Promise<void>;
      setex(key: string, ttl: number, value: string): Promise<void>;
      del(key: string): Promise<number>;
      [key: string]: any;
    };
    
    // WebSocket broadcast function
    broadcast?: (message: any) => void;
    
    // Authentication decorator
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    
    // JWT refresh token instance
    refreshJwt: {
      sign: (payload: any, options?: any) => Promise<string>;
      verify: (token: string) => Promise<any>;
    };
    
    // Monitoring service
    monitoring: any;
    
    // Metrics for monitoring
    metrics: any;
  }

  interface FastifyRequest {
    startTime?: number;
  }
}

export interface AuthenticatedRequest extends OriginalFastifyRequest {
  user: {
    id: number;
    email: string;
    prenom: string;
    nom: string;
    niveauActuel: string;
    niveauScolaire: string;
  };
} 