/**
 * Mock Data Service - Provides immediate data for testing
 * This will make your beautiful interface work right away!
 */

import { Exercise } from './api';

export interface MockExercise {
  id: number;
  titre: string;
  matiere: string;
  niveau: string;
  difficulte: string;
  contenu: {
    question: string;
    options: string[];
    correctAnswer: number;
  };
  competence_id: string;
  difficulty_level: number;
}

export interface MockStudent {
  id: number;
  prenom: string;
  nom: string;
  niveau: string;
  heartsRemaining: number;
  currentStreak: number;
}

// Mock exercises data - exercises for all levels!
export const mockExercises: Exercise[] = [
  // CP Level Exercises
  {
    id: 1,
    competenceId: 1,
    type: "QCM",
    question: "Combien font 2 + 3 ?",
    correctAnswer: "5",
    options: ["4", "5", "6", "7"],
    difficultyLevel: 1,
    xpReward: 10,
    timeLimit: 30,
    hintsAvailable: 2,
    metadata: { subject: "MATHEMATIQUES", level: "CP" }
  },
  {
    id: 2,
    competenceId: 2,
    type: "QCM",
    question: "Combien font 5 - 2 ?",
    correctAnswer: "3",
    options: ["2", "3", "4", "5"],
    difficultyLevel: 1,
    xpReward: 10,
    timeLimit: 30,
    hintsAvailable: 2,
    metadata: { subject: "MATHEMATIQUES", level: "CP" }
  },
  {
    id: 3,
    competenceId: 3,
    type: "QCM",
    question: "Quel mot est écrit : 'CHAT' ?",
    correctAnswer: "Chat",
    options: ["Chien", "Chat", "Oiseau", "Poisson"],
    difficultyLevel: 1,
    xpReward: 10,
    timeLimit: 30,
    hintsAvailable: 2,
    metadata: { subject: "FRANCAIS", level: "CP" }
  },
  {
    id: 4,
    competenceId: 4,
    type: "QCM",
    question: "Quelle lettre vient après 'A' ?",
    correctAnswer: "B",
    options: ["B", "C", "D", "E"],
    difficultyLevel: 1,
    xpReward: 10,
    timeLimit: 30,
    hintsAvailable: 2,
    metadata: { subject: "FRANCAIS", level: "CP" }
  },
  // CE1 Level Exercises
  {
    id: 5,
    competenceId: 5,
    type: "QCM",
    question: "Combien font 3 × 2 ?",
    correctAnswer: "6",
    options: ["5", "6", "7", "8"],
    difficultyLevel: 2,
    xpReward: 15,
    timeLimit: 45,
    hintsAvailable: 3,
    metadata: { subject: "MATHEMATIQUES", level: "CE1" }
  },
  {
    id: 6,
    competenceId: 6,
    type: "QCM",
    question: "Combien de côtés a un carré ?",
    correctAnswer: "4",
    options: ["3", "4", "5", "6"],
    difficultyLevel: 2,
    xpReward: 15,
    timeLimit: 45,
    hintsAvailable: 3,
    metadata: { subject: "MATHEMATIQUES", level: "CE1" }
  },
  {
    id: 7,
    competenceId: 7,
    type: "QCM",
    question: "Quel est le contraire de 'grand' ?",
    correctAnswer: "Petit",
    options: ["Petit", "Moyen", "Énorme", "Large"],
    difficultyLevel: 2,
    xpReward: 15,
    timeLimit: 45,
    hintsAvailable: 3,
    metadata: { subject: "FRANCAIS", level: "CE1" }
  },
  {
    id: 8,
    competenceId: 8,
    type: "QCM",
    question: "Quel nombre vient après 9 ?",
    correctAnswer: "10",
    options: ["8", "10", "11", "12"],
    difficultyLevel: 2,
    xpReward: 15,
    timeLimit: 45,
    hintsAvailable: 3,
    metadata: { subject: "MATHEMATIQUES", level: "CE1" }
  },
  // CE2 Level Exercises
  {
    id: 9,
    competenceId: 9,
    type: "QCM",
    question: "Combien font 12 ÷ 3 ?",
    correctAnswer: "4",
    options: ["3", "4", "5", "6"],
    difficultyLevel: 3,
    xpReward: 20,
    timeLimit: 60,
    hintsAvailable: 4,
    metadata: { subject: "MATHEMATIQUES", level: "CE2" }
  },
  {
    id: 10,
    competenceId: 10,
    type: "QCM",
    question: "Quelle est la capitale de la France ?",
    correctAnswer: "Paris",
    options: ["Lyon", "Paris", "Marseille", "Toulouse"],
    difficultyLevel: 3,
    xpReward: 20,
    timeLimit: 60,
    hintsAvailable: 4,
    metadata: { subject: "FRANCAIS", level: "CE2" }
  }
];

export const mockStudents: { [key: string]: MockStudent } = {
  "Bob Martin": {
    id: 1,
    prenom: "Bob",
    nom: "Martin",
    niveau: "CP",
    heartsRemaining: 3,
    currentStreak: 5
  },
  "Alice Dupont": {
    id: 2,
    prenom: "Alice",
    nom: "Dupont",
    niveau: "CP",
    heartsRemaining: 3,
    currentStreak: 3
  },
  "Lucas Martin": {
    id: 3,
    prenom: "Lucas",
    nom: "Martin",
    niveau: "CE1",
    heartsRemaining: 3,
    currentStreak: 7
  },
  "Emma Dubois": {
    id: 4,
    prenom: "Emma",
    nom: "Dubois",
    niveau: "CE1",
    heartsRemaining: 3,
    currentStreak: 4
  }
};

export const mockStudent: MockStudent = mockStudents["Bob Martin"];

// Mock API functions
export const mockApiService = {
  getExercisesByLevel: async (level: string, filters?: any): Promise<{ success: boolean; data: Exercise[] }> => {
    let exercises = mockExercises.filter(ex => ex.metadata?.level === level);
    
    if (filters?.matiere) {
      exercises = exercises.filter(ex => ex.metadata?.subject === filters.matiere);
    }
    
    if (filters?.limit) {
      exercises = exercises.slice(0, filters.limit);
    }
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return {
      success: true,
      data: exercises
    };
  },
  
  getStudentStats: async () => {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return {
      success: true,
      data: {
        stats: {
          totalCorrectAnswers: 25,
          totalAttempts: 30,
          averageScore: 83.3,
          currentStreak: 5,
          bestStreak: 12
        }
      }
    };
  },
  
  getStudentProfile: async () => {
    console.log('👤 Mock API: Getting student profile');
    
    await new Promise(resolve => setTimeout(resolve, 200));
    
    return {
      success: true,
      data: {
        student: mockStudent
      }
    };
  }
};

export default mockApiService;
