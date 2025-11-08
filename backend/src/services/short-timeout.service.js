"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shortTimeoutService = exports.ShortTimeoutService = void 0;
const file_security_service_1 = require("./file-security.service");
class ShortTimeoutService extends file_security_service_1.FileSecurityService {
    constructor() {
        super({ maxScanTimeMs: 1 });
    }
}
exports.ShortTimeoutService = ShortTimeoutService;
exports.shortTimeoutService = new ShortTimeoutService();
