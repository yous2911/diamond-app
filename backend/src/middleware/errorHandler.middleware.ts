import { FastifyRequest, FastifyReply, FastifyError } from 'fastify';
import AppError from '../utils/AppError';
import { ZodError } from 'zod';

export const errorHandler = (
  error: FastifyError | Error,
  request: FastifyRequest,
  reply: FastifyReply
) => {
  request.log.error(error, 'An error occurred');

  if (error instanceof AppError) {
    return reply.status(error.statusCode).send({
      status: 'error',
      statusCode: error.statusCode,
      message: error.message,
    });
  }

  if (error instanceof ZodError) {
    return reply.status(400).send({
      status: 'fail',
      message: 'Invalid input data',
      errors: error.flatten().fieldErrors,
    });
  }

  // Handle other errors
  const statusCode = (error as FastifyError).statusCode || 500;
  const message = (error as FastifyError).message || 'An unexpected error occurred';

  // For unhandled errors, send a generic response to avoid leaking details
  return reply.status(statusCode).send({
    status: 'error',
    statusCode: statusCode,
    message: statusCode >= 500 ? 'Internal Server Error' : message,
  });
};
