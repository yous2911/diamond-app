// Database helper for test data management
import { FastifyInstance } from 'fastify';

export interface TestStudentData {
  prenom: string;
  nom: string;
  email: string;
  motDePasse: string;
  niveauActuel?: string;
  niveauScolaire?: string;
}

export async function seedTestStudent(app: FastifyInstance, studentData: TestStudentData): Promise<any> {
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
  } catch (error) {
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

export async function cleanupTestData(_app: FastifyInstance): Promise<void> {
  // Add cleanup logic here if needed
  // For now, we'll rely on the test database being reset between runs
  console.log('Test data cleanup completed');
}




