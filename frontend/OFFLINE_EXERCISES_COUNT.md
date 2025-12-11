# 📊 Nombre d'Exercices en Mode Hors Ligne

## Configuration Actuelle

### Préchargement (Quand en ligne)
- **Limite** : **100 exercices maximum**
- **Fenêtre** : Exercices à réviser dans les **7 prochains jours**
- **Fréquence** : Toutes les 30 minutes + au retour en ligne

### Disponibles Hors Ligne
- **Seulement les exercices avec `nextReviewDate <= aujourd'hui`**
- **Nombre variable** selon chaque élève et son historique SuperMemo

## Estimation par Élève

### Élève Débutant (Première semaine)
- **Exercices en cache** : ~20-30 exercices
- **Disponibles hors ligne** : ~5-10 exercices (ceux à réviser aujourd'hui)
- **Raison** : Peu d'exercices commencés, beaucoup de nouveaux

### Élève Actif (1-2 mois d'utilisation)
- **Exercices en cache** : ~50-80 exercices
- **Disponibles hors ligne** : ~15-25 exercices (ceux à réviser aujourd'hui)
- **Raison** : Beaucoup d'exercices en rotation SuperMemo

### Élève Avancé (3+ mois)
- **Exercices en cache** : ~80-100 exercices
- **Disponibles hors ligne** : ~20-40 exercices (ceux à réviser aujourd'hui)
- **Raison** : Nombreux exercices avec intervalles espacés

## Comment Augmenter le Nombre

### Option 1 : Augmenter la limite de préchargement

Modifier dans `offlineApiWrapper.ts` :
```typescript
// Actuel : limit=100
// Augmenter à 200 pour plus d'exercices
`${baseURL}/students/${studentId}/recommended-exercises?limit=200`
```

### Option 2 : Étendre la fenêtre de cache

Modifier dans `offlineApiWrapper.ts` :
```typescript
// Actuel : 7 jours
// Augmenter à 14 jours
const CACHE_WINDOW_DAYS = 14;
```

### Option 3 : Permettre les exercices futurs hors ligne

Modifier dans `offlineStorage.ts` :
```typescript
// Actuel : seulement nextReviewDate <= aujourd'hui
// Permettre jusqu'à J+3
const allowedDate = new Date(today);
allowedDate.setDate(allowedDate.getDate() + 3);
if (nextReview > allowedDate) return false;
```

## Recommandation

**Configuration optimale** :
- **Limite préchargement** : 100-150 exercices
- **Fenêtre cache** : 7 jours (actuel)
- **Accessibles hors ligne** : Seulement ceux à réviser aujourd'hui (actuel)

**Pourquoi ?**
- ✅ Respecte l'algorithme SuperMemo
- ✅ Évite la surcharge cognitive
- ✅ Cache optimisé (pas trop lourd)
- ✅ Focus sur les exercices vraiment nécessaires

## Statistiques Réelles

Pour connaître le nombre exact pour un élève spécifique :

```typescript
import { offlineStorage } from '../services/offline/offlineStorage';

const cached = await offlineStorage.getCachedExercises(studentId);
console.log(`Total en cache: ${cached.length}`);

const dueToday = cached.filter(e => {
  const nextReview = new Date(e.superMemo?.nextReviewDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return nextReview <= today;
});
console.log(`Disponibles hors ligne: ${dueToday.length}`);
```

## Conclusion

**Actuellement** :
- **Préchargés** : Jusqu'à 100 exercices
- **Disponibles hors ligne** : Variable (5-40 selon l'élève)
- **Basé sur** : SuperMemo `nextReviewDate` de chaque élève

C'est **personnalisé** et **optimal** pour chaque élève ! 🎯

