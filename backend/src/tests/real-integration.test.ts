import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { DatabaseService } from '../services/database.service';
import { SuperMemoService } from '../services/supermemo.service';
// Exercise generator service removed - exercises will be seeded directly to database
// import { ExerciseGeneratorService } from '../services/exercise-generator.service';

describe('REAL Integration Tests - No Mocks', () => {
  let db: DatabaseService;
  
  beforeAll(async () => {
    // Connect to REAL test database
    db = new DatabaseService();
    await db.connect();
  });
  
  afterAll(async () => {
    await db.disconnect();
  });
  
  beforeEach(async () => {
    // Clean up between tests
    await db.clearTestData();
  });
  
  describe('Real Student Data Tests', () => {
    it('should handle real student with complex data', async () => {
      // Create REAL student with messy real-world data
      const realStudent = await db.createStudent({
        prenom: "José-María", // Real name with special characters
        nom: "O'Connor", // Real surname with apostrophe
        email: "jose.maria.oconnor+test@example.com", // Real email format
        parentEmail: "parent@example.com",
        niveauActuel: "CE2",
        totalPoints: 1250,
        lastLogin: new Date(),
        preferences: {
          difficulty: "medium",
          mascot: "dragon",
          notifications: true,
          specialNeeds: ["dyslexia", "adhd"] // Real special needs
        },
        progress: [
          { competenceId: 1, score: 85, attempts: 3, timeSpent: 1200 },
          { competenceId: 2, score: 92, attempts: 1, timeSpent: 800 }
        ]
      });
      
      // Test with REAL data
      const exercises = await db.getExercisesForStudent(realStudent.id);
      expect(exercises).toHaveLength(5);
      expect(exercises[0]?.difficulty).toBe('medium');
      
      // Test SuperMemo with real data
      const superMemoResult = SuperMemoService.calculateNextReview(
        realStudent.progress[0], 
        4
      );
      expect(superMemoResult.interval).toBeGreaterThan(0);
    });
    
    it('should handle student with 0 points (edge case)', async () => {
      const student = await db.createStudent({
        prenom: "Test",
        nom: "Student",
        totalPoints: 0,
        progress: []
      });
      
      const exercises = await db.getExercisesForStudent(student.id);
      expect(exercises[0]?.difficulty).toBe('easy');
    });
    
    it('should handle student with null lastLogin', async () => {
      const student = await db.createStudent({
        prenom: "New",
        nom: "Student",
        lastLogin: null, // This could break mock-based tests
        totalPoints: 0
      });
      
      // This should NOT crash
      const result = await db.getStudent(student.id);
      expect(result.lastLogin).toBeNull();
    });
  });
  
  describe('Real SuperMemo Algorithm Tests', () => {
    it('should calculate next review with real student progress', async () => {
      const realProgress = {
        competenceId: 1,
        studentId: 123,
        easinessFactor: 2.5,
        repetitionNumber: 3,
        interval: 7,
        lastReview: new Date('2024-01-15'),
        nextReview: new Date('2024-01-22'),
        quality: 4
      };
      
      const result = SuperMemoService.calculateNextReview(realProgress, 4);
      expect(result.interval).toBeGreaterThan(7);
      expect(result.easinessFactor).toBeCloseTo(2.5, 1);
    });
  });
  
  describe.skip('Real Exercise Generation Tests - Exercise Generator Removed', () => {
    // Exercise generator service removed - exercises will be seeded directly to database
    it.skip('should generate exercises for real student level', async () => {
      // Test removed - exercise generator service deleted
    });
  });
  
  describe('Real Database Performance Tests', () => {
    it('should handle multiple students efficiently', async () => {
      const startTime = Date.now();
      
      // Create 100 real students
      const students = [];
      for (let i = 0; i < 100; i++) {
        const student = await db.createStudent({
          prenom: `Student${i}`,
          nom: `Test${i}`,
          email: `student${i}@example.com`,
          totalPoints: Math.floor(Math.random() * 1000)
        });
        students.push(student);
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should be fast (under 5 seconds for 100 students)
      expect(duration).toBeLessThan(5000);
      expect(students).toHaveLength(100);
    });
  });
});


