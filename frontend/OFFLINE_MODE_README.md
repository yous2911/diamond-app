# Mode Hors Ligne - Documentation

## Vue d'ensemble

Le système de mode hors ligne permet à RevEd de fonctionner même sans connexion internet. Il utilise IndexedDB pour le cache local et une queue pour synchroniser les requêtes quand la connexion revient.

## Architecture

### 1. Détection réseau (`networkDetector.ts`)
- Détecte automatiquement l'état online/offline
- Écoute les événements `online` et `offline` du navigateur
- Vérifie périodiquement la connectivité

### 2. Stockage hors ligne (`offlineStorage.ts`)
- Utilise IndexedDB pour stocker :
  - Exercices
  - Compétences
  - Progression de l'élève
  - Données de profil
- Cache automatique des données récupérées en ligne

### 3. Queue de synchronisation (`offlineQueue.ts`)
- Stocke les requêtes POST/PUT en attente
- Priorise les requêtes importantes (soumission d'exercices)
- Synchronise automatiquement quand la connexion revient

### 4. Wrapper API (`offlineApiWrapper.ts`)
- Wrappe les appels API existants
- Utilise automatiquement le cache en mode hors ligne
- Queue les requêtes de modification

## Utilisation

### Hook React

```typescript
import { useOfflineMode } from '../hooks/useOfflineMode';

function MyComponent() {
  const { isOnline, queueLength, sync } = useOfflineMode();
  
  return (
    <div>
      {!isOnline && <p>Mode hors ligne - {queueLength} requêtes en attente</p>}
      <button onClick={sync}>Synchroniser maintenant</button>
    </div>
  );
}
```

### Hook React (Recommandé)

```typescript
import { useOfflineExercises } from '../hooks/useOfflineExercises';

function ExerciseList() {
  const { exercises, isLoading, fromCache } = useOfflineExercises({
    level: 'CP',
    limit: 10,
  });

  if (fromCache) {
    console.log('Exercices depuis le cache SuperMemo');
  }

  return (
    <div>
      {exercises?.map(ex => (
        <div key={ex.id}>
          {ex.question}
          {ex.superMemo && (
            <span>À réviser le {new Date(ex.superMemo.nextReviewDate).toLocaleDateString()}</span>
          )}
        </div>
      ))}
    </div>
  );
}
```

### API Wrapper (Avancé)

```typescript
import { offlineApiWrapper } from '../services/offline/offlineApiWrapper';

// Récupérer des exercices (utilise le cache SuperMemo si hors ligne)
const response = await offlineApiWrapper.getExercises(studentId, { level: 'CP' });
if (response.fromCache) {
  console.log('Exercices depuis le cache SuperMemo');
  // Les exercices sont déjà triés par priorité et nextReviewDate
}

// Précharger les exercices pour les 7 prochains jours
await offlineApiWrapper.preloadExercisesForOffline(studentId);

// Soumettre un exercice (sera queue si hors ligne)
const result = await offlineApiWrapper.submitExercise(exerciseId, {
  score: 100,
  timeSpent: 30,
  completed: true
});
```

## Composant UI

Le composant `OfflineIndicator` s'affiche automatiquement :
- En bas à droite de l'écran
- Quand l'appareil est hors ligne
- Quand il y a des requêtes en attente de synchronisation

## Fonctionnalités

### ✅ Ce qui fonctionne hors ligne

1. **Exercices SuperMemo** : Seuls les exercices **à réviser** selon l'algorithme SuperMemo sont mis en cache
   - Cache basé sur `nextReviewDate` de chaque élève
   - Fenêtre de cache : 7 jours à l'avance
   - Priorisation automatique (high > medium > normal)
   - Tri par date de révision (plus urgent en premier)

2. **Consultation de la progression** : Les données de progression mises en cache sont disponibles

3. **Soumission d'exercices** : Les réponses sont queue et synchronisées automatiquement

4. **Consultation des compétences** : Les compétences mises en cache sont accessibles

### 🧠 Intégration SuperMemo

Le cache est **intelligent** et dépend de chaque élève :

- **Cache personnalisé** : Chaque élève a son propre cache basé sur ses besoins de révision
- **Métadonnées SuperMemo** : Chaque exercice en cache contient :
  - `nextReviewDate` : Date de la prochaine révision
  - `easinessFactor` : Facteur de facilité (1.3-2.5)
  - `repetitionNumber` : Nombre de répétitions
  - `priority` : Priorité (high/medium/normal)

- **Préchargement automatique** : Quand l'appareil est en ligne :
  - Les exercices à réviser dans les 7 prochains jours sont préchargés
  - Mise à jour automatique toutes les 30 minutes
  - Mise à jour au retour en ligne

- **Durée du cache** : 7 jours (fenêtre de prévision SuperMemo)

### ⚠️ Limitations

1. **Nouveaux exercices** : Impossible de télécharger de nouveaux exercices hors ligne
2. **Mise à jour du profil** : Les modifications sont queue mais pas visibles immédiatement
3. **Mascot/Wardrobe** : Les mises à jour sont queue

## Synchronisation

La synchronisation se fait automatiquement :
- Quand la connexion revient
- Quand l'utilisateur clique sur "Synchroniser" dans l'indicateur
- Les requêtes sont traitées par ordre de priorité :
  - **High** : Soumission d'exercices
  - **Medium** : Mises à jour de profil
  - **Low** : Autres requêtes

## Gestion du cache

### Vider le cache

```typescript
import { offlineStorage } from '../services/offline/offlineStorage';

await offlineStorage.clearCache();
```

### Taille du cache

IndexedDB peut stocker plusieurs centaines de MB. Le cache est automatiquement géré par le navigateur.

## Tests

Pour tester le mode hors ligne :

1. Ouvrez les DevTools (F12)
2. Allez dans l'onglet "Network"
3. Cochez "Offline"
4. L'indicateur hors ligne devrait apparaître
5. Les exercices en cache devraient être accessibles
6. Les nouvelles soumissions seront queue

## Prochaines étapes

- [ ] Service Worker pour cache plus avancé
- [ ] Synchronisation en arrière-plan
- [ ] Gestion des conflits de données
- [ ] Compression du cache
- [ ] Statistiques d'utilisation hors ligne

