"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Test to verify real app testing works
const vitest_1 = require("vitest");
const setup_1 = require("./setup");
(0, vitest_1.describe)('Real App Testing', () => {
    (0, vitest_1.it)('should have a working app instance', () => {
        (0, vitest_1.expect)(setup_1.app).toBeDefined();
        (0, vitest_1.expect)(setup_1.app.server).toBeDefined();
    });
    (0, vitest_1.it)('should handle basic health check', async () => {
        const response = await setup_1.app.inject({
            method: 'GET',
            url: '/health'
        });
        // Should either return 200 (if health endpoint exists) or 404 (if not)
        (0, vitest_1.expect)([200, 404]).toContain(response.statusCode);
    });
    (0, vitest_1.it)('should handle authentication if available', async () => {
        if (setup_1.authToken) {
            (0, vitest_1.expect)(setup_1.authToken).toBeDefined();
            (0, vitest_1.expect)(typeof setup_1.authToken).toBe('string');
            (0, vitest_1.expect)(setup_1.authToken.length).toBeGreaterThan(10);
        }
        else {
            console.log('⚠️ No auth token available - auth endpoints might not be set up');
        }
    });
    (0, vitest_1.it)('should handle authenticated requests if auth is available', async () => {
        if (setup_1.authToken) {
            // Try to access a protected endpoint
            const response = await (0, setup_1.makeAuthenticatedRequest)(setup_1.app, setup_1.authToken, {
                method: 'GET',
                url: '/api/students/1'
            });
            // Should either return 200 (success) or 404 (student not found) or 403 (access denied)
            // But NOT 401 (unauthorized) since we have a token
            (0, vitest_1.expect)([200, 404, 403]).toContain(response.statusCode);
            (0, vitest_1.expect)(response.statusCode).not.toBe(401);
        }
        else {
            console.log('⚠️ Skipping authenticated request test - no auth token');
        }
    });
});
