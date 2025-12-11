# 🔊 Système Audio (TTS) - Implémentation avec Fichiers MP3

## 📋 Vue d'Ensemble

Ce système permet d'ajouter de l'audio aux exercices en stockant les fichiers MP3 directement dans la base de données avec leurs URLs.

**Approche:** Stockage des fichiers MP3 sur le serveur/CDN avec URLs dans la base de données (pas d'API TTS externe).

---

## 🗄️ Structure Base de Données

### Table `exercises`

Les champs audio sont déjà présents dans le schéma :

```sql
audioUrl VARCHAR(500)           -- URL du fichier audio principal
audioQuestionUrl VARCHAR(500)   -- URL du fichier audio pour la question
audioFeedbackUrl VARCHAR(500)   -- URL du fichier audio pour le feedback
```

### Exemple de Données

```sql
UPDATE exercises 
SET 
  audioUrl = '/audio/exercises/exercise-123.mp3',
  audioQuestionUrl = '/audio/questions/question-123.mp3',
  audioFeedbackUrl = '/audio/feedback/feedback-123-success.mp3'
WHERE id = 123;
```

---

## 📁 Structure des Fichiers

### Organisation Recommandée

```
public/
  audio/
    exercises/          # Audio principal des exercices
      exercise-1.mp3
      exercise-2.mp3
    questions/          # Audio des questions
      question-1.mp3
      question-2.mp3
    feedback/           # Audio des feedbacks
      success/          # Feedback succès
        feedback-1-success.mp3
      error/            # Feedback erreur
        feedback-1-error.mp3
```

### URLs dans la Base de Données

- **URL Relative:** `/audio/exercises/exercise-123.mp3`
- **URL Absolue:** `https://cdn.reved.app/audio/exercises/exercise-123.mp3`
- **URL CDN:** `https://storage.googleapis.com/reved-audio/exercises/exercise-123.mp3`

---

## 🎨 Composants Frontend

### 1. `AudioPlayer.tsx`

Composant de lecteur audio complet avec :
- ✅ Play/Pause
- ✅ Barre de progression
- ✅ Contrôle volume
- ✅ Mute/Unmute
- ✅ Reset
- ✅ Affichage temps (current/total)

**Usage:**
```tsx
import { AudioPlayer } from '@/components/AudioPlayer';

<AudioPlayer 
  src="/audio/exercises/exercise-123.mp3"
  autoPlay={false}
  loop={false}
  showControls={true}
  onEnded={() => console.log('Audio terminé')}
/>
```

### 2. `AudioExerciseWrapper.tsx`

Wrapper qui ajoute automatiquement l'audio aux exercices :

**Usage:**
```tsx
import { AudioExerciseWrapper } from '@/components/exercises/AudioExerciseWrapper';

<AudioExerciseWrapper exercise={exercise}>
  {/* Votre composant d'exercice ici */}
  <ExerciseQCM exercise={exercise} />
</AudioExerciseWrapper>
```

**Fonctionnalités:**
- Affiche automatiquement les boutons audio si disponibles
- Support question audio, contenu audio, feedback audio
- Intégration transparente

### 3. Hook `useAudio.ts`

Hook React pour contrôler l'audio programmatiquement :

**Usage:**
```tsx
import { useAudio } from '@/hooks/useAudio';

const { isPlaying, play, pause, volume, setVolume } = useAudio(
  exercise.audioUrl,
  {
    autoPlay: false,
    loop: false,
    onEnded: () => console.log('Terminé'),
  }
);
```

---

## 🔧 Intégration dans les Exercices

### Exemple: ExerciseQCM avec Audio

```tsx
import { AudioExerciseWrapper } from '@/components/exercises/AudioExerciseWrapper';

export const ExerciseQCM: React.FC<ExerciseQCMProps> = ({ exercise, ... }) => {
  return (
    <AudioExerciseWrapper exercise={exercise}>
      <div className="exercise-content">
        <h2>{exercise.titre}</h2>
        {/* Contenu de l'exercice */}
      </div>
    </AudioExerciseWrapper>
  );
};
```

### Exemple: ExerciseDivisionLongue avec Audio

```tsx
export const ExerciseDivisionLongue: React.FC<ExerciseDivisionLongueProps> = ({ exercise, ... }) => {
  return (
    <AudioExerciseWrapper 
      exercise={exercise}
      showQuestionAudio={true}
      showFeedbackAudio={true}
    >
      {/* Votre composant de division */}
    </AudioExerciseWrapper>
  );
};
```

---

## 📤 Upload de Fichiers Audio

### Option 1: Via Interface Admin

Créer une interface pour uploader les fichiers MP3 :

```typescript
// backend/src/routes/exercises.ts
fastify.post('/:id/audio', {
  preHandler: [fastify.authenticate],
  preValidation: [fastify.csrfProtection],
}, async (request, reply) => {
  // Upload fichier MP3
  // Sauvegarder dans /public/audio/exercises/
  // Mettre à jour audioUrl dans la base de données
});
```

### Option 2: Via SQL Direct

```sql
-- Mettre à jour un exercice avec audio
UPDATE exercises 
SET audioUrl = '/audio/exercises/exercise-123.mp3'
WHERE id = 123;

-- Mettre à jour plusieurs exercices
UPDATE exercises 
SET audioUrl = CONCAT('/audio/exercises/exercise-', id, '.mp3')
WHERE niveau = 'CP' AND matiere = 'FRANCAIS';
```

---

## 🎯 Workflow Recommandé

### 1. Préparation des Fichiers Audio

1. **Générer les MP3** (via TTS externe ou enregistrement)
2. **Nommer les fichiers** : `exercise-{id}.mp3`
3. **Organiser** dans `/public/audio/exercises/`

### 2. Upload sur Serveur/CDN

```bash
# Upload vers serveur
scp audio/*.mp3 user@server:/var/www/reved/public/audio/exercises/

# Ou upload vers CDN (Google Cloud Storage, AWS S3, etc.)
gsutil cp audio/*.mp3 gs://reved-audio/exercises/
```

### 3. Mise à Jour Base de Données

```sql
-- Script SQL pour mettre à jour tous les exercices
UPDATE exercises e
SET e.audioUrl = CONCAT('/audio/exercises/exercise-', e.id, '.mp3')
WHERE e.audioUrl IS NULL;
```

---

## 🚀 Mode Hors Ligne

Les fichiers audio sont automatiquement disponibles hors ligne si :
- Les fichiers sont dans `/public/audio/` (Next.js les sert statiquement)
- Les URLs sont relatives (`/audio/...`)
- Le cache du navigateur fonctionne

**Pour améliorer le cache offline:**
- Ajouter les fichiers audio dans le Service Worker
- Précharger les fichiers audio fréquents
- Utiliser IndexedDB pour cache audio

---

## 📊 Statistiques & Monitoring

### Tracking Usage Audio

```typescript
// Ajouter dans AudioPlayer.tsx
const handlePlay = () => {
  // Track audio play
  analytics.track('audio_played', {
    exerciseId: exercise.id,
    audioType: 'question',
  });
};
```

---

## ✅ Checklist d'Implémentation

- [x] Composant `AudioPlayer.tsx` créé
- [x] Hook `useAudio.ts` créé
- [x] Wrapper `AudioExerciseWrapper.tsx` créé
- [ ] Intégrer dans tous les composants d'exercices
- [ ] Upload interface pour fichiers audio
- [ ] Script SQL pour mise à jour URLs
- [ ] Tests composants audio
- [ ] Documentation utilisateur

---

## 🎉 Avantages de cette Approche

✅ **Pas de dépendance API externe** - Pas de coûts TTS  
✅ **Contrôle total** - Qualité audio maîtrisée  
✅ **Performance** - Fichiers servis statiquement  
✅ **Mode hors ligne** - Fichiers en cache  
✅ **Flexibilité** - Support voix multiples, langues, etc.  

---

## 📝 Notes Importantes

1. **Format Audio:** MP3 recommandé (compatibilité maximale)
2. **Taille Fichiers:** Optimiser pour web (< 1MB par fichier)
3. **Qualité:** 64-128 kbps suffisant pour voix
4. **Durée:** Fichiers courts (< 30 secondes) pour meilleure UX

---

**Document créé:** Décembre 2024  
**Version:** 1.0  
**Estimation:** 2-3 jours (au lieu de 2 semaines avec API TTS)

