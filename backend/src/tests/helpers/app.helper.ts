// App helper for building test instances
import { build } from '../../app-test';
import type { FastifyInstance } from 'fastify';

export async function buildTestApp(): Promise<FastifyInstance> {
  const app = await build();
  await app.ready();
  return app;
}

export async function closeTestApp(app: FastifyInstance): Promise<void> {
  if (app) {
    await app.close();
  }
}




