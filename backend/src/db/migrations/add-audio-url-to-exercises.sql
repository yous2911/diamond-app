-- Migration: Add audio URL support to exercises
-- This allows storing direct MP3 file links for TTS/audio playback

ALTER TABLE exercises 
ADD COLUMN audio_url VARCHAR(500) NULL COMMENT 'URL du fichier audio MP3 pour lecture de l\'exercice';

ALTER TABLE exercises 
ADD COLUMN audio_question_url VARCHAR(500) NULL COMMENT 'URL du fichier audio MP3 pour la question';

ALTER TABLE exercises 
ADD COLUMN audio_feedback_url VARCHAR(500) NULL COMMENT 'URL du fichier audio MP3 pour le feedback';

-- Index pour recherche rapide des exercices avec audio
CREATE INDEX idx_exercises_audio_url ON exercises(audio_url) WHERE audio_url IS NOT NULL;

