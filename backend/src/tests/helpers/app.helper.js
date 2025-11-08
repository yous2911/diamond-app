"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.closeTestApp = exports.buildTestApp = void 0;
// App helper for building test instances
const app_test_1 = require("../../app-test");
async function buildTestApp() {
    const app = await (0, app_test_1.build)();
    await app.ready();
    return app;
}
exports.buildTestApp = buildTestApp;
async function closeTestApp(app) {
    if (app) {
        await app.close();
    }
}
exports.closeTestApp = closeTestApp;
