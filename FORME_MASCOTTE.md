# 🐉 FORME ET APPARENCE DE LA MASCOTTE
## Description détaillée de la mascotte 3D

**Date:** Janvier 2025  
**Composant:** `MascotSystem.tsx`

---

## 🎨 FORME GÉOMÉTRIQUE DE BASE

### Structure Principale

La mascotte est construite avec **Three.js** et utilise des **formes géométriques simples** :

#### 1. **Tête** (SphereGeometry)
- **Forme:** Sphère 3D
- **Taille:** Variable selon personnalité (0.7 à 0.9)
  - Base: `0.7`
  - + `extroversion * 0.2` (plus extraverti = tête plus grande)
- **Résolution:** 32 segments (sphère lisse)
- **Position:** `(0, 1.5, 0)` - Au-dessus du corps
- **Matériau:** MeshPhongMaterial avec couleur dynamique

#### 2. **Corps** (SphereGeometry)
- **Forme:** Grande sphère 3D
- **Taille:** Base `1.0` avec scale selon énergie
  - Scale: `1 + (energy / 500)`
  - Animation respiration: `scale * (1 + sin(breathingPhase) * 0.05)`
- **Résolution:** 24 segments
- **Position:** `(0, 0, 0)` - Centre
- **Effet:** Respiration animée (gonfle/dégonfle)

#### 3. **Yeux** (SphereGeometry)
- **Forme:** Deux petites sphères
- **Taille:** Variable selon intelligence (0.15 à 0.20)
  - Base: `0.15`
  - + `intelligence * 0.05`
- **Résolution:** 16 segments
- **Position:** 
  - Œil gauche: `(-0.2 + eyeTracking.x * 0.1, 1.6 + eyeTracking.y * 0.1, 0.5)`
  - Œil droit: `(0.2 + eyeTracking.x * 0.1, 1.6 + eyeTracking.y * 0.1, 0.5)`
- **Effet:** Tracking oculaire (suivent la souris/regard)

---

## 🐉 TYPES DE MASCOTTE

### Type par Défaut: **DRAGON** 🐉

**Configuration actuelle dans `GlobalPremiumLayout.tsx`:**
```typescript
mascotType="dragon"
```

**Caractéristiques du Dragon:**
- **Couleur primaire:** Violet (`0x8A2BE2`)
- **Couleur secondaire:** Indigo (`0x4F46E5`)
- **Yeux:** Doré (`0xFFD700`)
- **Ailes:** Deux cônes (ConeGeometry)
  - Taille: `0.5` de rayon, `1.5` de hauteur
  - Position: `(-1.2, 0.5, -0.2)` et `(1.2, 0.5, -0.2)`
  - Rotation: ±45° (π/4)
  - Transparence: 80% (`opacity: 0.8`)

### Autres Types Disponibles (non utilisés actuellement)

#### 1. **Fairy** (Fée)
- Couleur primaire: Rose (`0xEC4899`)
- Couleur secondaire: Vert (`0x10B981`)
- Yeux: Bleu ciel (`0x87CEEB`)

#### 2. **Robot**
- Couleur primaire: Gris (`0x6B7280`)
- Couleur secondaire: Bleu (`0x3B82F6`)
- Yeux: Cyan (`0x00FFFF`)

#### 3. **Cat** (Chat)
- Couleur primaire: Orange (`0xF59E0B`)
- Couleur secondaire: Crème (`0xFFFBEB`)
- Yeux: Vert (`0x22C55E`)
- **Oreilles:** Deux cônes sur la tête
  - Taille: `0.3` de rayon, `0.6` de hauteur
  - Position: `(-0.3, 2.0, 0)` et `(0.3, 2.0, 0)`

#### 4. **Owl** (Hibou)
- Couleur primaire: Marron (`0x8B4513`)
- Couleur secondaire: Beige (`0xDEB887`)
- Yeux: Doré (`0xFFD700`)

---

## 🎨 COULEURS DYNAMIQUES

### Couleur de la Tête et du Corps

Les couleurs changent selon l'état AI de la mascotte :

```typescript
// Couleur HSL dynamique
color.setHSL(
  (relationship / 100) * 0.3,  // Teinte selon relation (0-0.3)
  0.8,                          // Saturation fixe (80%)
  0.6 + (energy / 200)          // Luminosité selon énergie (0.6-1.1)
)
```

**Effets:**
- **Relation élevée:** Teinte plus chaude
- **Énergie élevée:** Plus lumineux
- **Attention élevée:** Opacité plus élevée (`0.9 + attention/1000`)

### Matériau

- **Type:** MeshPhongMaterial (réfléchit la lumière)
- **Shininess:** 100 (brillant)
- **Transparence:** Variable selon attention
- **Émissivité:** Yeux émettent de la lumière selon attention

---

## ✨ EFFETS SPÉCIAUX

### 1. **Particules d'Excitation**
Quand la mascotte est **excitée** (`mood === 'excited'`):
- **100 particules** dorées (`0xFFD700`)
- Taille: `0.1`
- Opacité: `0.8`
- Position: Aléatoire autour de la mascotte

### 2. **Animations**

#### Respiration
- Le corps gonfle/dégonfle légèrement
- Scale: `1 + sin(breathingPhase) * 0.05`
- Phase: `time * 0.002`

#### Mouvement selon Humeur

**Excitée:**
- Saut vertical: `sin(time * 0.01) * 0.3 + 0.2`
- Rotation Z: `sin(time * 0.008) * 0.1`

**Autres humeurs:**
- Flottement vertical: `sin(time * 0.004) * 0.15`
- Rotation Y: `sin(time * 0.002) * 0.05`

#### Tracking Oculaire
- Les yeux suivent la souris/regard
- Mise à jour aléatoire: 1% de chance par frame
- Déplacement: `±2` unités en X et Y

---

## 👕 SYSTÈME DE GARDE-ROBE

La mascotte peut porter des **accessoires** de la garde-robe :

### Types d'Items
- **Chapeaux** (hats): Positionnés sur la tête
- **Vêtements** (clothing): Sur le corps
- **Accessoires** (accessories): Diverses positions
- **Chaussures** (shoes): Sur les pieds
- **Spéciaux** (special): Effets magiques

### Géométries d'Items
- **Box** (boîte)
- **Sphere** (sphère)
- **Cone** (cône)
- **Cylinder** (cylindre)
- **Custom** (géométrie personnalisée)

**Exemple:** Chapeau de magicien
- Type: Cone
- Position: `(0, 2.5, 0)` - Au-dessus de la tête
- Scale: `(0.8, 1.2, 0.8)`
- Effet magique: Scintille

---

## 📐 DIMENSIONS APPROXIMATIVES

### Hauteur Totale
- **Tête:** ~1.5 unités (position Y: 1.5)
- **Corps:** ~2 unités (scale variable)
- **Total:** ~3.5-4 unités de hauteur

### Largeur
- **Corps:** ~2 unités (scale variable)
- **Ailes (dragon):** ~2.4 unités d'envergure

### Profondeur
- **Corps:** ~2 unités
- **Yeux:** Avancés de 0.5 unités

---

## 🎭 RÉSUMÉ VISUEL

### Forme Globale
```
        👁️     👁️      (Yeux)
         ╱╲     ╱╲       (Ailes - dragon)
        ╱  ╲   ╱  ╲
       ╱    ╲ ╱    ╲
      ┌──────┐      (Tête - sphère)
      │      │
      │  ⚪  │      (Corps - sphère)
      │      │
      └──────┘
```

### Caractéristiques
- ✅ **Forme:** Sphérique (tête + corps)
- ✅ **Style:** Géométrique simple, stylisé
- ✅ **Type actuel:** Dragon avec ailes
- ✅ **Couleurs:** Violet/Indigo avec yeux dorés
- ✅ **Animations:** Respiration, flottement, saut
- ✅ **Interactions:** Tracking oculaire, particules

---

## 🎯 CONCLUSION

**Forme de la mascotte:**
- **Base:** Deux sphères (tête + corps)
- **Type:** Dragon (avec ailes coniques)
- **Style:** Géométrique 3D stylisé
- **Taille:** ~4 unités de hauteur
- **Couleurs:** Violet/Indigo dynamiques
- **Effets:** Particules, animations, tracking oculaire

**Ressemble à:** Un personnage sphérique stylisé de type dragon, avec des ailes, des yeux qui bougent, et des effets visuels selon l'humeur.

---

**Document généré:** Janvier 2025  
**Version:** 1.0  
**Composant:** `MascotSystem.tsx` (lignes 184-259)


