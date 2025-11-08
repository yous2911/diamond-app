"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const AppError_1 = __importDefault(require("../utils/AppError"));
const zod_1 = require("zod");
const errorHandler = (error, request, reply) => {
    request.log.error(error, 'An error occurred');
    if (error instanceof AppError_1.default) {
        return reply.status(error.statusCode).send({
            status: 'error',
            statusCode: error.statusCode,
            message: error.message,
        });
    }
    if (error instanceof zod_1.ZodError) {
        return reply.status(400).send({
            status: 'fail',
            message: 'Invalid input data',
            errors: error.flatten().fieldErrors,
        });
    }
    // Handle other errors
    const statusCode = error.statusCode || 500;
    const message = error.message || 'An unexpected error occurred';
    // For unhandled errors, send a generic response to avoid leaking details
    return reply.status(statusCode).send({
        status: 'error',
        statusCode: statusCode,
        message: statusCode >= 500 ? 'Internal Server Error' : message,
    });
};
exports.errorHandler = errorHandler;
