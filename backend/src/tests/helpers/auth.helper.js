"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeAuthenticatedRequest = exports.createTestUser = exports.getAuthToken = void 0;
async function getAuthToken(app, userCredentials) {
    const response = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: userCredentials,
    });
    if (response.statusCode !== 200) {
        throw new Error(`Failed to log in test user. Status: ${response.statusCode}, Body: ${response.body}`);
    }
    const loginData = JSON.parse(response.body);
    if (!loginData.token) {
        throw new Error('No token returned from login response');
    }
    return loginData.token;
}
exports.getAuthToken = getAuthToken;
async function createTestUser(app, userData) {
    const response = await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: userData,
    });
    if (response.statusCode === 201) {
        return JSON.parse(response.body);
    }
    // If registration fails, the user might already exist
    throw new Error(`Failed to create test user. Status: ${response.statusCode}, Body: ${response.body}`);
}
exports.createTestUser = createTestUser;
async function makeAuthenticatedRequest(app, token, options) {
    return await app.inject({
        ...options,
        headers: {
            ...options.headers,
            Authorization: `Bearer ${token}`,
        },
    });
}
exports.makeAuthenticatedRequest = makeAuthenticatedRequest;
