// Mock database for tests - provides in-memory implementations
import { vi } from 'vitest';

// Mock data storage
let mockStudents: any[] = [
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

// Mock Drizzle DB implementation
const mockDb = {
  select: vi.fn(() => ({
    from: vi.fn((_table: any) => ({
      limit: vi.fn(() => Promise.resolve(mockStudents.slice(0, 1))),
      where: vi.fn(() => Promise.resolve(mockStudents)),
      then: vi.fn((callback: any) => callback(mockStudents))
    }))
  })),
  insert: vi.fn((_table: any) => ({
    values: vi.fn((values: any) => {
      const newItems = Array.isArray(values) ? values : [values];
      newItems.forEach((item: any, index: number) => {
        item.id = mockStudents.length + index + 1;
        mockStudents.push(item);
      });
      return Promise.resolve(newItems.map(item => ({ insertId: item.id })));
    })
  })),
  update: vi.fn(() => ({
    set: vi.fn(() => ({
      where: vi.fn(() => Promise.resolve({ affectedRows: 1 }))
    }))
  })),
  delete: vi.fn(() => ({
    where: vi.fn(() => Promise.resolve({ affectedRows: 1 }))
  })),
  execute: vi.fn((query: any) => {
    // Mock basic queries
    if (typeof query === 'object' && query.sql) {
      if (query.sql.includes('SELECT 1')) {
        return Promise.resolve([{ test: 1 }]);
      }
    }
    return Promise.resolve([]);
  })
};

// Mock connection functions
export const mockDatabaseFunctions = {
  connectDatabase: vi.fn(() => Promise.resolve()),
  getDatabase: vi.fn(() => mockDb),
  testConnection: vi.fn(() => Promise.resolve(true)),
  checkDatabaseHealth: vi.fn(() => Promise.resolve({
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
  disconnectDatabase: vi.fn(() => Promise.resolve()),
  setupDatabase: vi.fn(() => {
    console.log('🧪 Using mock database for tests');
    return Promise.resolve();
  }),
  resetDatabase: vi.fn(() => {
    mockStudents = [];
    mockExercises = [];
    mockProgress = [];
    mockSessions = [];
    mockRevisions = [];
    return Promise.resolve();
  })
};

// Reset function for tests
export function resetMockData() {
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

export { mockDb };