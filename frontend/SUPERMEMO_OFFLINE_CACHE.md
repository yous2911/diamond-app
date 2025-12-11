# 🧠 Cache Hors Ligne avec SuperMemo

## Principe

Le cache hors ligne de RevEd est **intelligent** et **personnalisé** pour chaque élève grâce à l'intégration de l'algorithme SuperMemo-2.

## Comment ça fonctionne

### 1. Préchargement intelligent (quand en ligne)

Quand l'appareil est **en ligne**, le système :

1. **Récupère les exercices recommandés** via `/students/{id}/recommended-exercises`
   - Cette route utilise SuperMemo pour déterminer quels exercices doivent être révisés
   - Priorité 1 : Exercices avec `nextReviewDate <= aujourd'hui`
   - Priorité 2 : Compétences en apprentissage/découverte
   - Priorité 3 : Nouvelles compétences

2. **Récupère les métadonnées SuperMemo** via `/students/{id}/spaced-repetition`
   - `nextReviewDate` : Date de la prochaine révision
   - `easinessFactor` : Facteur de facilité (1.3-2.5)
   - `repetitionNumber` : Nombre de répétitions
   - `priority` : Priorité (high/medium/normal)

3. **Met en cache uniquement les exercices pertinents**
   - Exercices à réviser dans les **7 prochains jours**
   - Avec leurs métadonnées SuperMemo complètes

### 2. Utilisation hors ligne

Quand l'appareil est **hors ligne** :

1. Le système récupère uniquement les exercices **à réviser maintenant**
   - Filtre par `nextReviewDate <= aujourd'hui`
   - Trie par priorité (high > medium > normal)
   - Puis par `nextReviewDate` (plus urgent en premier)

2. Les exercices sont **personnalisés** pour chaque élève
   - Chaque élève voit uniquement SES exercices à réviser
   - Basés sur SON historique SuperMemo
   - Avec SES métadonnées de progression

### 3. Synchronisation

Quand la connexion revient :

1. Les soumissions d'exercices sont synchronisées
2. Le cache est mis à jour avec les nouveaux `nextReviewDate`
3. Les nouveaux exercices à réviser sont préchargés

## Durée du cache

- **Fenêtre de cache** : 7 jours
- **Expiration** : Les exercices sont retirés du cache après leur `cacheUntil` date
- **Mise à jour** : Automatique toutes les 30 minutes quand en ligne

## Exemple concret

### Élève A (CP, débutant)
- Exercices en cache : 15 exercices
- Dates de révision : Aujourd'hui (5), Demain (7), J+3 (3)
- Priorité : 8 high, 5 medium, 2 normal

### Élève B (CE2, avancé)
- Exercices en cache : 8 exercices
- Dates de révision : Aujourd'hui (2), J+5 (4), J+7 (2)
- Priorité : 2 high, 4 medium, 2 normal

**Chaque élève a son propre cache personnalisé !**

## Avantages

1. ✅ **Efficacité** : Seuls les exercices nécessaires sont mis en cache
2. ✅ **Personnalisation** : Chaque élève voit ses exercices à réviser
3. ✅ **SuperMemo respecté** : L'algorithme fonctionne même hors ligne
4. ✅ **Performance** : Cache léger et optimisé
5. ✅ **Pertinence** : Les exercices sont toujours à jour avec les besoins de révision

## Limitations

- ⚠️ Les exercices doivent être préchargés quand en ligne
- ⚠️ Impossible de réviser des exercices non préchargés hors ligne
- ⚠️ Le cache expire après 7 jours (mais se met à jour automatiquement)

## Conclusion

Le cache hors ligne avec SuperMemo garantit que chaque élève peut continuer à réviser **ses exercices personnalisés** même sans connexion, en respectant l'algorithme de répétition espacée.

