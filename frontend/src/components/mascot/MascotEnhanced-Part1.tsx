/**
 * MascotEnhanced-Part1.tsx
 * Types and configurations for enhanced mascot system
 */

import * as THREE from 'three';

// Enhanced mascot state with emotions
export interface EnhancedMascotState {
  mood: 'happy' | 'excited' | 'focused' | 'tired' | 'curious' | 'proud' | 'encouraging';
  energy: number; // 0-100
  attention: number; // 0-100
  relationship: number; // 0-100
  emotions: {
    joy: number;
    sadness: number;
    surprise: number;
    fear: number;
    trust: number;
    anticipation: number;
  };
  personality: {
    extroversion: number;
    patience: number;
    playfulness: number;
    intelligence: number;
  };
}

// Mascot configuration with colors
export interface MascotConfig {
  colors: {
    primary: number;
    secondary: number;
    tertiary: number;
    eyes: number;
    glow: number;
  };
}

// Mascot configurations for each type
export const MASCOT_CONFIGS: Record<'dragon' | 'fairy' | 'robot' | 'cat' | 'owl', MascotConfig> = {
  dragon: {
    colors: {
      primary: 0x8A2BE2,    // Violet
      secondary: 0x4F46E5,   // Indigo
      tertiary: 0x7C3AED,    // Violet foncé
      eyes: 0xFFD700,        // Doré
      glow: 0xFFD700         // Doré
    }
  },
  fairy: {
    colors: {
      primary: 0xEC4899,     // Rose
      secondary: 0x10B981,  // Vert
      tertiary: 0xF472B6,   // Rose clair
      eyes: 0x87CEEB,        // Bleu ciel
      glow: 0xEC4899         // Rose
    }
  },
  robot: {
    colors: {
      primary: 0x6B7280,    // Gris
      secondary: 0x3B82F6,  // Bleu
      tertiary: 0x9CA3AF,   // Gris clair
      eyes: 0x00FFFF,        // Cyan
      glow: 0x00FFFF         // Cyan
    }
  },
  cat: {
    colors: {
      primary: 0xF59E0B,    // Orange
      secondary: 0xFFFBEB,  // Crème
      tertiary: 0xFCD34D,   // Jaune
      eyes: 0x22C55E,        // Vert
      glow: 0xF59E0B         // Orange
    }
  },
  owl: {
    colors: {
      primary: 0x8B4513,    // Marron
      secondary: 0xDEB887,  // Beige
      tertiary: 0xA0522D,   // Sienna
      eyes: 0xFFD700,        // Doré
      glow: 0xFFD700         // Doré
    }
  }
};


