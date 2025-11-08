"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/plugins/config.ts
const fastify_plugin_1 = __importDefault(require("fastify-plugin"));
const config_1 = require("../config/config");
const configPlugin = async (fastify) => {
    // Decorate fastify with config
    fastify.decorate('config', {
        ...config_1.config,
        db: config_1.dbConfig,
        redis: config_1.redisConfig,
        jwt: config_1.jwtConfig,
    });
};
exports.default = (0, fastify_plugin_1.default)(configPlugin, {
    name: 'config',
});
