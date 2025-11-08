"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mockDbQueries = exports.mockHelpers = exports.mockJwtPayloads = exports.mockAuthTokens = exports.mockRevisions = exports.mockSessions = exports.mockAttempts = exports.mockChapters = exports.mockSubjects = exports.mockExercises = exports.mockStudents = void 0;
const vitest_1 = require("vitest");
// Mock students data
exports.mockStudents = [
    {
        id: 1,
        prenom: 'Alice',
        nom: 'Dupont',
        niveau: 'CP',
        points: 150,
        dateCreation: new Date('2024-01-15'),
        dernierAcces: new Date('2024-07-20'),
        statsPoints: {
            total: 150,
            semaine: 45,
            mois: 120,
        },
    },
    {
        id: 2,
        prenom: 'Bob',
        nom: 'Martin',
        niveau: 'CE1',
        points: 200,
        dateCreation: new Date('2024-02-01'),
        dernierAcces: new Date('2024-07-19'),
        statsPoints: {
            total: 200,
            semaine: 60,
            mois: 180,
        },
    },
    {
        id: 3,
        prenom: 'Charlie',
        nom: 'Dubois',
        niveau: 'CE2',
        points: 300,
        dateCreation: new Date('2024-01-10'),
        dernierAcces: new Date('2024-07-20'),
        statsPoints: {
            total: 300,
            semaine: 75,
            mois: 250,
        },
    },
];
// Mock exercises data
exports.mockExercises = [
    {
        id: 1,
        titre: 'Addition simple',
        type: 'calcul',
        niveau: 'CP',
        difficulte: 1,
        matiereId: 1,
        chapitreId: 1,
        enonce: 'Calculez 3 + 4',
        reponseAttendue: '7',
        explicationReponse: '3 + 4 = 7',
        pointsReussite: 10,
        pointsEchec: 2,
        tempsLimiteSecondes: 60,
        aidesDisponibles: ['Utilise tes doigts', 'Compte de 3 à 7'],
    },
    {
        id: 2,
        titre: 'Soustraction simple',
        type: 'calcul',
        niveau: 'CP',
        difficulte: 2,
        matiereId: 1,
        chapitreId: 1,
        enonce: 'Calculez 8 - 3',
        reponseAttendue: '5',
        explicationReponse: '8 - 3 = 5',
        pointsReussite: 12,
        pointsEchec: 3,
        tempsLimiteSecondes: 90,
        aidesDisponibles: ['Utilise tes doigts', 'Compte à rebours de 8'],
    },
    {
        id: 3,
        titre: 'Lecture de mot',
        type: 'lecture',
        niveau: 'CP',
        difficulte: 1,
        matiereId: 2,
        chapitreId: 3,
        enonce: 'Lis ce mot : CHAT',
        reponseAttendue: 'chat',
        explicationReponse: 'Le mot est "chat"',
        pointsReussite: 8,
        pointsEchec: 2,
        tempsLimiteSecondes: 45,
        aidesDisponibles: ['Décompose les syllabes', 'CH-AT'],
    },
];
// Mock subjects data
exports.mockSubjects = [
    {
        id: 1,
        nom: 'Mathématiques',
        description: 'Calculs et géométrie',
        couleur: '#4F46E5',
        icone: '🔢',
        ordre: 1,
    },
    {
        id: 2,
        nom: 'Français',
        description: 'Lecture et écriture',
        couleur: '#DC2626',
        icone: '📚',
        ordre: 2,
    },
    {
        id: 3,
        nom: 'Sciences',
        description: 'Découverte du monde',
        couleur: '#059669',
        icone: '🔬',
        ordre: 3,
    },
];
// Mock chapters data
exports.mockChapters = [
    {
        id: 1,
        nom: 'Addition et soustraction',
        description: 'Opérations de base',
        matiereId: 1,
        niveau: 'CP',
        ordre: 1,
    },
    {
        id: 2,
        nom: 'Multiplication',
        description: 'Tables de multiplication',
        matiereId: 1,
        niveau: 'CE1',
        ordre: 2,
    },
    {
        id: 3,
        nom: 'Lecture de mots',
        description: 'Premiers mots simples',
        matiereId: 2,
        niveau: 'CP',
        ordre: 1,
    },
];
// Mock attempts data
exports.mockAttempts = [
    {
        id: 1,
        etudiantId: 1,
        exerciceId: 1,
        reponse: '7',
        reussi: true,
        tempsSecondes: 25,
        aidesUtilisees: 0,
        pointsGagnes: 10,
        dateCreation: new Date('2024-07-20T10:30:00'),
    },
    {
        id: 2,
        etudiantId: 1,
        exerciceId: 2,
        reponse: '4',
        reussi: false,
        tempsSecondes: 45,
        aidesUtilisees: 1,
        pointsGagnes: 3,
        dateCreation: new Date('2024-07-20T10:32:00'),
    },
];
// Mock sessions data
exports.mockSessions = [
    {
        id: 1,
        etudiantId: 1,
        dateDebut: new Date('2024-07-20T10:00:00'),
        dateFin: new Date('2024-07-20T10:45:00'),
        dureeSecondes: 2700,
        exercicesReussis: 8,
        exercicesEchoues: 2,
        pointsGagnes: 95,
        progression: 0.8,
    },
    {
        id: 2,
        etudiantId: 1,
        dateDebut: new Date('2024-07-19T14:00:00'),
        dateFin: new Date('2024-07-19T14:30:00'),
        dureeSecondes: 1800,
        exercicesReussis: 6,
        exercicesEchoues: 1,
        pointsGagnes: 65,
        progression: 0.85,
    },
];
// Mock revision data (spaced repetition)
exports.mockRevisions = [
    {
        id: 1,
        etudiantId: 1,
        exerciceId: 1,
        prochaineDateRevision: new Date('2024-07-21'),
        intervalleJours: 1,
        facteurFacilite: 2.5,
        nombreRevisions: 3,
        dernierResultat: true,
        dateCreation: new Date('2024-07-18'),
    },
    {
        id: 2,
        etudiantId: 1,
        exerciceId: 3,
        prochaineDateRevision: new Date('2024-07-22'),
        intervalleJours: 3,
        facteurFacilite: 2.8,
        nombreRevisions: 2,
        dernierResultat: true,
        dateCreation: new Date('2024-07-19'),
    },
];
// Authentication tokens for testing
exports.mockAuthTokens = {
    valid: 'mock-jwt-token-alice',
    invalid: 'invalid-token',
    expired: 'expired-token',
};
// Mock JWT payloads
exports.mockJwtPayloads = {
    alice: {
        studentId: 1,
        prenom: 'Alice',
        nom: 'Dupont',
        niveau: 'CP',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24h from now
    },
    bob: {
        studentId: 2,
        prenom: 'Bob',
        nom: 'Martin',
        niveau: 'CE1',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24h from now
    },
};
// Helper functions for tests
exports.mockHelpers = {
    // Get student by ID
    getStudentById: (id) => exports.mockStudents.find(s => s.id === id),
    // Get exercises by level
    getExercisesByLevel: (niveau) => exports.mockExercises.filter(e => e.niveau === niveau),
    // Get exercises by subject
    getExercisesBySubject: (matiereId) => exports.mockExercises.filter(e => e.matiereId === matiereId),
    // Get student attempts
    getStudentAttempts: (etudiantId) => exports.mockAttempts.filter(a => a.etudiantId === etudiantId),
    // Get due revisions for student
    getDueRevisions: (etudiantId) => {
        const now = new Date();
        return exports.mockRevisions.filter(r => r.etudiantId === etudiantId &&
            new Date(r.prochaineDateRevision) <= now);
    },
    // Create mock successful attempt response
    createSuccessfulAttemptResponse: (exerciseId, pointsGagnes) => ({
        success: true,
        data: {
            reussi: true,
            pointsGagnes,
            exerciseId,
            progression: {
                exercicesReussis: 9,
                exercicesEchoues: 2,
                tauxReussite: 0.82,
            },
            recommandations: {
                prochainExercice: exports.mockExercises.find(e => e.id === exerciseId + 1),
                revisions: [],
            },
        },
    }),
    // Create mock failed attempt response
    createFailedAttemptResponse: (exerciseId, pointsGagnes) => ({
        success: true,
        data: {
            reussi: false,
            pointsGagnes,
            exerciseId,
            progression: {
                exercicesReussis: 8,
                exercicesEchoues: 3,
                tauxReussite: 0.73,
            },
            recommandations: {
                prochainExercice: exports.mockExercises.find(e => e.id === exerciseId),
                revisions: [exports.mockExercises.find(e => e.id === exerciseId)],
            },
        },
    }),
};
// Database query mocks
exports.mockDbQueries = {
    // Student queries
    findStudentByName: vitest_1.vi.fn().mockImplementation((prenom, nom) => {
        return Promise.resolve([exports.mockStudents.find(s => s.prenom === prenom && s.nom === nom)]);
    }),
    findStudentById: vitest_1.vi.fn().mockImplementation((id) => {
        return Promise.resolve([exports.mockStudents.find(s => s.id === id)]);
    }),
    // Exercise queries
    findExercisesByLevel: vitest_1.vi.fn().mockImplementation((niveau) => {
        return Promise.resolve(exports.mockExercises.filter(e => e.niveau === niveau));
    }),
    findExerciseById: vitest_1.vi.fn().mockImplementation((id) => {
        return Promise.resolve([exports.mockExercises.find(e => e.id === id)]);
    }),
    // Attempt queries
    insertAttempt: vitest_1.vi.fn().mockImplementation(() => {
        return Promise.resolve({ affectedRows: 1, insertId: exports.mockAttempts.length + 1 });
    }),
    findStudentAttempts: vitest_1.vi.fn().mockImplementation((etudiantId) => {
        return Promise.resolve(exports.mockAttempts.filter(a => a.etudiantId === etudiantId));
    }),
    // Revision queries
    findDueRevisions: vitest_1.vi.fn().mockImplementation((etudiantId) => {
        return Promise.resolve(exports.mockHelpers.getDueRevisions(etudiantId));
    }),
    updateRevision: vitest_1.vi.fn().mockImplementation(() => {
        return Promise.resolve({ affectedRows: 1 });
    }),
};
exports.default = {
    mockStudents: exports.mockStudents,
    mockExercises: exports.mockExercises,
    mockSubjects: exports.mockSubjects,
    mockChapters: exports.mockChapters,
    mockAttempts: exports.mockAttempts,
    mockSessions: exports.mockSessions,
    mockRevisions: exports.mockRevisions,
    mockAuthTokens: exports.mockAuthTokens,
    mockJwtPayloads: exports.mockJwtPayloads,
    mockHelpers: exports.mockHelpers,
    mockDbQueries: exports.mockDbQueries,
};
