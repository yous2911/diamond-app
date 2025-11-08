"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
class SimpleLogger {
    info(message, payload) {
        if (payload) {
            console.log(message, payload);
        }
        else {
            console.log(message);
        }
    }
    warn(message, payload) {
        if (payload) {
            console.warn(message, payload);
        }
        else {
            console.warn(message);
        }
    }
    error(message, payload) {
        if (payload) {
            console.error(message, payload);
        }
        else {
            console.error(message);
        }
    }
    debug(message, payload) {
        if (payload) {
            console.debug(message, payload);
        }
        else {
            console.debug(message);
        }
    }
}
exports.logger = new SimpleLogger();
