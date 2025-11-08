"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.healthConfig = exports.jwtConfig = exports.redisConfig = exports.dbConfig = exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const zod_1 = require("zod");
const path_1 = __importDefault(require("path"));
// Load environment variables from env.backend specifically
const envPath = path_1.default.join(process.cwd(), 'env.backend');
const result = dotenv_1.default.config({ path: envPath });
if (result.error) {
    console.error('❌ Failed to load env.backend:', result.error.message);
    console.log('Looking for environment file at:', envPath);
    process.exit(1);
}
else {
    console.log('✅ Loaded environment from:', envPath);
}
// Environment schema
const envSchema = zod_1.z.object({
    NODE_ENV: zod_1.z.enum(['development', 'production', 'test']).default('development'),
    PORT: zod_1.z.string().transform(Number).default('3003'),
    // Database
    DB_HOST: zod_1.z.string().default('localhost'),
    DB_PORT: zod_1.z.string().transform(Number).default('3306'),
    DB_USER: zod_1.z.string().default('root'),
    DB_PASSWORD: zod_1.z.string().default(''),
    DB_NAME: zod_1.z.string().default('reved_kids'),
    DB_SSL: zod_1.z.string().optional(),
    // Redis
    REDIS_HOST: zod_1.z.string().optional(),
    REDIS_PORT: zod_1.z.string().transform(Number).optional(),
    REDIS_PASSWORD: zod_1.z.string().optional(),
    // JWT
    JWT_SECRET: zod_1.z.string().default('your-default-secret-change-in-production'),
    JWT_EXPIRES_IN: zod_1.z.string().default('24h'),
});
const env = envSchema.parse(process.env);
// Export configurations
exports.config = {
    env: env.NODE_ENV,
    port: env.PORT,
    isDevelopment: env.NODE_ENV === 'development',
    isProduction: env.NODE_ENV === 'production',
    isTest: env.NODE_ENV === 'test',
};
exports.dbConfig = {
    host: env.DB_HOST,
    port: env.DB_PORT,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    ssl: env.DB_SSL === 'true',
};
exports.redisConfig = {
    ...(env.REDIS_HOST && { host: env.REDIS_HOST }),
    ...(env.REDIS_PORT && { port: env.REDIS_PORT }),
    ...(env.REDIS_PASSWORD && { password: env.REDIS_PASSWORD }),
    maxRetriesPerRequest: 3,
    retryDelayOnFailover: 100,
    db: 0,
};
exports.jwtConfig = {
    secret: env.JWT_SECRET,
    expiresIn: env.JWT_EXPIRES_IN,
};
// Health check configuration
exports.healthConfig = {
    database: {
        timeout: 5000,
        retries: 3,
    },
    redis: {
        timeout: 3000,
        retries: 2,
    },
};
