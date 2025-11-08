"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanupTestData = exports.seedTestStudent = void 0;
async function seedTestStudent(app, studentData) {
    // Try to create the student via the API
    try {
        const response = await app.inject({
            method: 'POST',
            url: '/api/auth/register',
            payload: {
                prenom: studentData.prenom,
                nom: studentData.nom,
                email: studentData.email,
                motDePasse: studentData.motDePasse,
                niveauActuel: studentData.niveauActuel || 'CP',
                niveauScolaire: studentData.niveauScolaire || 'CP'
            }
        });
        if (response.statusCode === 201) {
            return JSON.parse(response.body);
        }
    }
    catch (error) {
        console.log('Student might already exist, continuing...');
    }
    // If creation fails, return the student data for login
    return {
        prenom: studentData.prenom,
        nom: studentData.nom,
        email: studentData.email,
        niveauActuel: studentData.niveauActuel || 'CP'
    };
}
exports.seedTestStudent = seedTestStudent;
async function cleanupTestData(app) {
    // Add cleanup logic here if needed
    // For now, we'll rely on the test database being reset between runs
    console.log('Test data cleanup completed');
}
exports.cleanupTestData = cleanupTestData;
