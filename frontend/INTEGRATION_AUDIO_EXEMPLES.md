# 🎵 Exemples d'Intégration Audio dans les Exercices

## 📋 Guide Rapide

Pour ajouter l'audio à un exercice, il suffit d'envelopper le composant avec `AudioExerciseWrapper`.

---

## ✅ Exemple 1: ExerciseQCM

### Avant
```tsx
export const ExerciseQCM: React.FC<ExerciseQCMProps> = ({ exercise, ... }) => {
  return (
    <div className="exercise-qcm">
      <h2>{exercise.titre}</h2>
      {/* Contenu */}
    </div>
  );
};
```

### Après (avec Audio)
```tsx
import { AudioExerciseWrapper } from './AudioExerciseWrapper';

export const ExerciseQCM: React.FC<ExerciseQCMProps> = ({ exercise, ... }) => {
  return (
    <AudioExerciseWrapper exercise={exercise}>
      <div className="exercise-qcm">
        <h2>{exercise.titre}</h2>
        {/* Contenu */}
      </div>
    </AudioExerciseWrapper>
  );
};
```

**Résultat:** L'audio s'affiche automatiquement si `exercise.audioUrl` ou `exercise.audioQuestionUrl` existe.

---

## ✅ Exemple 2: ExerciseDivisionLongue

```tsx
import { AudioExerciseWrapper } from './AudioExerciseWrapper';

export const ExerciseDivisionLongue: React.FC<ExerciseDivisionLongueProps> = ({ exercise, ... }) => {
  return (
    <AudioExerciseWrapper 
      exercise={exercise}
      showQuestionAudio={true}
      showFeedbackAudio={true}
    >
      <div className="space-y-6">
        <h2>Division posée</h2>
        {/* Contenu division */}
      </div>
    </AudioExerciseWrapper>
  );
};
```

---

## ✅ Exemple 3: Utilisation Directe d'AudioPlayer

Si vous voulez plus de contrôle :

```tsx
import { AudioPlayer } from '@/components/AudioPlayer';

export const ExerciseLecture: React.FC<ExerciseLectureProps> = ({ exercise }) => {
  return (
    <div>
      {/* Bouton audio personnalisé */}
      {exercise.audioUrl && (
        <div className="mb-4">
          <AudioPlayer 
            src={exercise.audioUrl}
            autoPlay={false}
            showControls={true}
          />
        </div>
      )}
      
      {/* Contenu exercice */}
      <div>{exercise.contenu}</div>
    </div>
  );
};
```

---

## ✅ Exemple 4: Hook useAudio pour Contrôle Programmatique

```tsx
import { useAudio } from '@/hooks/useAudio';

export const ExerciseCalculMental: React.FC<ExerciseCalculMentalProps> = ({ exercise }) => {
  const { isPlaying, play, pause, volume } = useAudio(exercise.audioUrl, {
    autoPlay: false,
    onEnded: () => {
      // Lancer l'exercice après la fin de l'audio
      startExercise();
    },
  });

  return (
    <div>
      <button onClick={play} disabled={isPlaying}>
        {isPlaying ? 'Pause' : 'Écouter'}
      </button>
      {/* Contenu */}
    </div>
  );
};
```

---

## 🎯 Checklist d'Intégration

Pour chaque composant d'exercice :

1. [ ] Importer `AudioExerciseWrapper`
2. [ ] Envelopper le contenu avec `<AudioExerciseWrapper exercise={exercise}>`
3. [ ] Vérifier que `exercise.audioUrl` est bien récupéré depuis l'API
4. [ ] Tester avec un exercice qui a de l'audio
5. [ ] Tester avec un exercice sans audio (ne doit rien afficher)

---

## 📝 Notes

- **Pas besoin de modifier la logique existante** - Le wrapper s'ajoute autour
- **Rétrocompatible** - Si pas d'audio, rien ne s'affiche
- **Flexible** - Vous pouvez utiliser `AudioPlayer` directement si besoin

---

**Document créé:** Décembre 2024

