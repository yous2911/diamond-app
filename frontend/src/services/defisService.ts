// French Phonics Challenges Service
// This service provides educational challenges for French phonics learning

export interface DefiChallenge {
  id: string;
  title: string;
  description: string;
  difficulty: 'facile' | 'moyen' | 'difficile';
  type: 'phoneme' | 'syllabe' | 'mot';
  components: Array<{
    id: string;
    type: 'phoneme' | 'syllabe' | 'mot';
    content: string;
    color?: string;
    size?: 'petit' | 'moyen' | 'grand';
    magnetism?: number;
    vibration?: boolean;
    audioKey?: string;
    sparkleIntensity?: number;
  }>;
  dropZones: Array<{
    id: string;
    accepts: string[];
    position: number;
  }>;
  instructions: string;
  hints: string[];
  successCriteria: string[];
}

// Sample challenges data for development
const SAMPLE_CHALLENGES: DefiChallenge[] = [
  {
    id: 'challenge-1',
    title: 'Les Voyelles Magiques',
    description: 'Place les voyelles dans le bon ordre pour former des mots',
    difficulty: 'facile',
    type: 'phoneme',
    components: [
      {
        id: 'a',
        type: 'phoneme',
        content: 'A',
        color: '#ef4444',
        size: 'moyen',
        magnetism: 0.8,
        vibration: true,
        audioKey: 'vowel-a',
        sparkleIntensity: 0.6
      },
      {
        id: 'e',
        type: 'phoneme',
        content: 'E',
        color: '#f59e0b',
        size: 'moyen',
        magnetism: 0.8,
        vibration: true,
        audioKey: 'vowel-e',
        sparkleIntensity: 0.6
      },
      {
        id: 'i',
        type: 'phoneme',
        content: 'I',
        color: '#10b981',
        size: 'moyen',
        magnetism: 0.8,
        vibration: true,
        audioKey: 'vowel-i',
        sparkleIntensity: 0.6
      }
    ],
    dropZones: [
      {
        id: 'zone-1',
        accepts: ['phoneme'],
        position: 0
      },
      {
        id: 'zone-2',
        accepts: ['phoneme'],
        position: 1
      },
      {
        id: 'zone-3',
        accepts: ['phoneme'],
        position: 2
      }
    ],
    instructions: 'Place les voyelles dans l\'ordre alphabétique',
    hints: ['Commence par la première lettre de l\'alphabet', 'A, E, I...'],
    successCriteria: ['Toutes les voyelles sont placées', 'L\'ordre est correct']
  },
  {
    id: 'challenge-2',
    title: 'Syllabes Enchantées',
    description: 'Compose des syllabes avec les lettres magiques',
    difficulty: 'moyen',
    type: 'syllabe',
    components: [
      {
        id: 'ma',
        type: 'syllabe',
        content: 'MA',
        color: '#8b5cf6',
        size: 'grand',
        magnetism: 0.6,
        vibration: false,
        audioKey: 'syllable-ma',
        sparkleIntensity: 0.4
      },
      {
        id: 'pa',
        type: 'syllabe',
        content: 'PA',
        color: '#06b6d4',
        size: 'grand',
        magnetism: 0.6,
        vibration: false,
        audioKey: 'syllable-pa',
        sparkleIntensity: 0.4
      },
      {
        id: 'ta',
        type: 'syllabe',
        content: 'TA',
        color: '#84cc16',
        size: 'grand',
        magnetism: 0.6,
        vibration: false,
        audioKey: 'syllable-ta',
        sparkleIntensity: 0.4
      }
    ],
    dropZones: [
      {
        id: 'zone-1',
        accepts: ['syllabe'],
        position: 0
      },
      {
        id: 'zone-2',
        accepts: ['syllabe'],
        position: 1
      }
    ],
    instructions: 'Place les syllabes pour former des mots',
    hints: ['MA + PA = ?', 'Pense aux mots que tu connais'],
    successCriteria: ['Les syllabes sont bien placées', 'Les mots ont du sens']
  }
];

class DefisService {
  // Get all available challenges
  async getDefisMassifs(): Promise<{ success: boolean; data?: DefiChallenge[]; error?: string }> {
    try {
      // In a real implementation, this would call your backend API
      // For now, return sample data
      return {
        success: true,
        data: SAMPLE_CHALLENGES
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to load challenges'
      };
    }
  }

  // Get a specific challenge by ID
  async getDefiById(id: string): Promise<{ success: boolean; data?: DefiChallenge; error?: string }> {
    try {
      const challenge = SAMPLE_CHALLENGES.find(c => c.id === id);
      if (challenge) {
        return {
          success: true,
          data: challenge
        };
      } else {
        return {
          success: false,
          error: 'Challenge not found'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: 'Failed to load challenge'
      };
    }
  }

  // Submit challenge completion
  async submitChallengeCompletion(challengeId: string, result: any): Promise<{ success: boolean; score?: number; error?: string }> {
    try {
      // In a real implementation, this would send data to your backend
      // For now, return a mock success response
      return {
        success: true,
        score: Math.floor(Math.random() * 100) + 50 // Mock score
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to submit challenge'
      };
    }
  }
}

export const defisService = new DefisService();
