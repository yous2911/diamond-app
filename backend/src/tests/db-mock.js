"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mockDb = exports.resetMockData = exports.mockDatabaseFunctions = void 0;
// Mock database for tests - provides in-memory implementations
const vitest_1 = require("vitest");
// Mock data storage
let mockStudents = [
    {
        id: 1,
        prenom: 'Alice',
        nom: 'Test',
        dateNaissance: new Date('2015-03-15'),
        niveauActuel: 'CP',
        niveauScolaire: 'CP',
        totalPoints: 150,
        serieJours: 5,
        mascotteType: 'dragon'
    }
];
let mockExercises = [
    {
        id: 1,
        titre: 'Test Addition',
        description: 'Test exercise',
        matiere: 'mathematiques',
        niveau: 'CP',
        difficulte: 'decouverte',
        competenceCode: 'MATH_TEST_01',
        typeExercice: 'calcul',
        type: 'CALCUL',
        contenu: { question: '2 + 2 = ?', type: 'addition' },
        solution: { bonneReponse: '4' },
        xp: 10,
        pointsRecompense: 10
    }
];
let mockProgress = [];
let mockSessions = [];
let mockRevisions = [];
// Mock Drizzle DB implementation
const mockDb = {
    select: vitest_1.vi.fn(() => ({
        from: vitest_1.vi.fn((table) => ({
            limit: vitest_1.vi.fn(() => Promise.resolve(mockStudents.slice(0, 1))),
            where: vitest_1.vi.fn(() => Promise.resolve(mockStudents)),
            then: vitest_1.vi.fn((callback) => callback(mockStudents))
        }))
    })),
    insert: vitest_1.vi.fn((table) => ({
        values: vitest_1.vi.fn((values) => {
            const newItems = Array.isArray(values) ? values : [values];
            newItems.forEach((item, index) => {
                item.id = mockStudents.length + index + 1;
                mockStudents.push(item);
            });
            return Promise.resolve(newItems.map(item => ({ insertId: item.id })));
        })
    })),
    update: vitest_1.vi.fn(() => ({
        set: vitest_1.vi.fn(() => ({
            where: vitest_1.vi.fn(() => Promise.resolve({ affectedRows: 1 }))
        }))
    })),
    delete: vitest_1.vi.fn(() => ({
        where: vitest_1.vi.fn(() => Promise.resolve({ affectedRows: 1 }))
    })),
    execute: vitest_1.vi.fn((query) => {
        // Mock basic queries
        if (typeof query === 'object' && query.sql) {
            if (query.sql.includes('SELECT 1')) {
                return Promise.resolve([{ test: 1 }]);
            }
        }
        return Promise.resolve([]);
    })
};
exports.mockDb = mockDb;
// Mock connection functions
exports.mockDatabaseFunctions = {
    connectDatabase: vitest_1.vi.fn(() => Promise.resolve()),
    getDatabase: vitest_1.vi.fn(() => mockDb),
    testConnection: vitest_1.vi.fn(() => Promise.resolve(true)),
    checkDatabaseHealth: vitest_1.vi.fn(() => Promise.resolve({
        status: 'healthy',
        message: 'Mock database OK',
        responseTime: 5,
        poolStats: {
            totalConnections: 1,
            activeConnections: 0,
            idleConnections: 1,
            queuedRequests: 0
        }
    })),
    disconnectDatabase: vitest_1.vi.fn(() => Promise.resolve()),
    setupDatabase: vitest_1.vi.fn(() => {
        console.log('🧪 Using mock database for tests');
        return Promise.resolve();
    }),
    resetDatabase: vitest_1.vi.fn(() => {
        mockStudents = [];
        mockExercises = [];
        mockProgress = [];
        mockSessions = [];
        mockRevisions = [];
        return Promise.resolve();
    })
};
// Reset function for tests
function resetMockData() {
    mockStudents = [
        {
            id: 1,
            prenom: 'Alice',
            nom: 'Test',
            dateNaissance: new Date('2015-03-15'),
            niveauActuel: 'CP',
            niveauScolaire: 'CP',
            totalPoints: 150,
            serieJours: 5,
            mascotteType: 'dragon'
        }
    ];
    mockExercises = [
        {
            id: 1,
            titre: 'Test Addition',
            description: 'Test exercise',
            matiere: 'mathematiques',
            niveau: 'CP',
            difficulte: 'decouverte',
            competenceCode: 'MATH_TEST_01',
            typeExercice: 'calcul',
            type: 'CALCUL',
            contenu: { question: '2 + 2 = ?', type: 'addition' },
            solution: { bonneReponse: '4' },
            xp: 10,
            pointsRecompense: 10
        }
    ];
    mockProgress = [];
    mockSessions = [];
    mockRevisions = [];
}
exports.resetMockData = resetMockData;
