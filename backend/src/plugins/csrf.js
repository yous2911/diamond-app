"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_plugin_1 = __importDefault(require("fastify-plugin"));
const csrf_protection_1 = __importDefault(require("@fastify/csrf-protection"));
const config_1 = require("../config/config");
const csrfPlugin = async (fastify) => {
    // Register CSRF protection with secure settings
    await fastify.register(csrf_protection_1.default, {
        sessionPlugin: '@fastify/cookie', // Use cookies to store the secret
        cookieOpts: {
            signed: true,
            httpOnly: true,
            secure: config_1.config.NODE_ENV === 'production',
            sameSite: 'strict',
            path: '/',
        },
    });
    fastify.log.info('✅ CSRF Protection plugin registered successfully.');
};
exports.default = (0, fastify_plugin_1.default)(csrfPlugin, {
    name: 'csrf',
    dependencies: ['cookie'], // Ensure the cookie plugin is loaded first
});
