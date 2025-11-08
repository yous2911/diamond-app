"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
// REAL APP TEST SETUP - Test against actual application logic
const vitest_1 = require("vitest");
const app_test_1 = require("../app-test");
// Only mock external dependencies
vitest_1.vi.mock('fs/promises', () => ({
    readFile: vitest_1.vi.fn(),
    writeFile: vitest_1.vi.fn(),
    unlink: vitest_1.vi.fn(),
    mkdir: vitest_1.vi.fn(),
    access: vitest_1.vi.fn()
}));
vitest_1.vi.mock('node-fetch', () => ({
    default: vitest_1.vi.fn()
}));
// Global test variables
let app;
(0, vitest_1.beforeAll)(async () => {
    exports.app = app = await (0, app_test_1.build)();
    await app.ready();
    console.log('✅ Real app built and ready for testing');
});
(0, vitest_1.afterAll)(async () => {
    if (app) {
        await app.close();
        console.log('✅ App closed after tests');
    }
});
