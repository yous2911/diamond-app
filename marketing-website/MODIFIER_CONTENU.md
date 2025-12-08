# 📝 Comment Modifier le Contenu Après Déploiement

## ✅ Oui, vous pouvez tout modifier !

Après le déploiement sur Vercel, vous pouvez facilement modifier :
- ✅ Tous les textes
- ✅ Ajouter/modifier des photos
- ✅ Ajouter/modifier des vidéos
- ✅ Changer les prix
- ✅ Modifier les sections

## 🔄 Comment ça fonctionne ?

1. **Vous modifiez le code** dans votre éditeur
2. **Vous commitez et poussez** sur GitHub
3. **Vercel redéploie automatiquement** (en 2-3 minutes)
4. **Votre site est mis à jour** !

---

## 📝 Modifier les Textes

### Exemple : Changer le titre principal

**Fichier :** `src/components/sections/Hero.tsx`

```tsx
<h1 className="font-sora text-5xl md:text-7xl font-extrabold leading-tight animate-fade-in-up">
  Votre nouveau titre ici
  <span className="block text-cognitive-gold">Votre sous-titre</span>
</h1>
```

### Exemple : Modifier les prix

**Fichier :** `src/components/sections/Pricing.tsx`

```tsx
<PriceCard 
  title="Standard" 
  price="€25"  // ← Changez ici
  cta="Commencer maintenant"
/>
```

### Exemple : Modifier les FAQ

**Fichier :** `src/components/sections/FAQ.tsx`

```tsx
<Item 
  q="Votre nouvelle question ?" 
  a="Votre nouvelle réponse ici." 
/>
```

---

## 🖼️ Ajouter des Photos

### Étape 1 : Créer le dossier `public`

Si le dossier n'existe pas, créez-le à la racine du projet `marketing-website/` :

```
marketing-website/
  └── public/
      └── img/
          ├── neurons_poster.jpg
          ├── presentation-thumbnail.jpg
          └── votre-nouvelle-image.jpg
```

### Étape 2 : Ajouter vos images

Placez vos images dans `public/img/`

### Étape 3 : Utiliser l'image dans le code

**Exemple dans Hero.tsx :**

```tsx
<Image 
  src="/img/votre-image.jpg"  // ← Chemin depuis public/
  alt="Description de l'image"
  fill 
  className="object-cover opacity-20" 
  priority
/>
```

**Note :** Les images dans `public/` sont accessibles directement avec `/img/nom-image.jpg`

---

## 🎥 Ajouter une Vidéo YouTube

### Étape 1 : Obtenir l'ID de votre vidéo YouTube

Si votre vidéo est : `https://www.youtube.com/watch?v=ABC123xyz`
L'ID est : `ABC123xyz`

### Étape 2 : Modifier FullPresentation.tsx

**Fichier :** `src/components/sections/FullPresentation.tsx`

```tsx
<YouTubeEmbed
  embedId="ABC123xyz"  // ← Remplacez par votre ID YouTube
  poster="/img/presentation-thumbnail.jpg"  // Image de prévisualisation
  title="Votre titre de vidéo"
/>
```

### Étape 3 : Ajouter l'image de prévisualisation

Placez votre image dans `public/img/presentation-thumbnail.jpg`

---

## 📋 Liste des Fichiers à Modifier

### Textes Principaux
- `src/components/sections/Hero.tsx` - Titre principal, sous-titre
- `src/components/sections/Pricing.tsx` - Prix, offres, garanties
- `src/components/sections/FAQ.tsx` - Questions/Réponses
- `src/components/sections/Method.tsx` - Description de la méthode
- `src/components/sections/SocialProof.tsx` - Témoignages, statistiques
- `src/components/sections/Contract.tsx` - Contrat/Engagement
- `src/components/sections/MasteryGuarantee.tsx` - Garantie maîtrise
- `src/components/sections/ImpactB1G1.tsx` - Impact social
- `src/components/ui/UrgencyBanner.tsx` - Bannière d'urgence

### Métadonnées (SEO)
- `src/app/layout.tsx` - Titre, description, Open Graph

### Images
- `public/img/` - Toutes vos images

---

## 🚀 Workflow de Modification

### Option 1 : Modification Locale (Recommandé)

1. **Modifier** les fichiers sur votre ordinateur
2. **Tester localement** :
   ```bash
   cd marketing-website
   npm run dev
   ```
3. **Vérifier** sur http://localhost:3000
4. **Commiter et pousser** :
   ```bash
   git add .
   git commit -m "Mise à jour du contenu"
   git push
   ```
5. **Vercel redéploie automatiquement** !

### Option 2 : Modification Directe sur GitHub

1. Allez sur votre repo GitHub
2. Cliquez sur le fichier à modifier
3. Cliquez sur l'icône crayon (✏️)
4. Modifiez le contenu
5. Commitez les changements
6. Vercel redéploie automatiquement !

---

## ⚠️ Points Importants

### Apostrophes et Guillemets
Quand vous modifiez du texte, utilisez :
- `&apos;` pour les apostrophes (`'`)
- `&ldquo;` et `&rdquo;` pour les guillemets (`"`)

**Exemple :**
```tsx
<p>L&apos;application est géniale !</p>
<p>&ldquo;Citation importante&rdquo;</p>
```

### Images Next.js
Utilisez toujours `<Image />` de Next.js, pas `<img>` :

```tsx
import Image from "next/image";

<Image 
  src="/img/mon-image.jpg"
  alt="Description"
  width={800}  // ou fill pour remplir le conteneur
  height={600}
/>
```

### Formats d'Images Recommandés
- **JPG** pour les photos
- **PNG** pour les logos/icônes avec transparence
- **WebP** pour de meilleures performances (optionnel)

---

## 📦 Structure Recommandée pour les Assets

```
marketing-website/
├── public/
│   ├── img/
│   │   ├── hero-background.jpg
│   │   ├── presentation-thumbnail.jpg
│   │   ├── logo.png
│   │   └── testimonials/
│   │       ├── photo-1.jpg
│   │       └── photo-2.jpg
│   └── favicon.ico
└── src/
    └── components/
        └── sections/
            └── ...
```

---

## 🎯 Exemples Concrets

### Changer le Prix Standard de €30 à €25

**Fichier :** `src/components/sections/Pricing.tsx` (ligne ~52)

```tsx
<PriceCard 
  title="Standard" 
  price="€25"  // ← Changé de €30 à €25
  ...
/>
```

### Ajouter une Nouvelle FAQ

**Fichier :** `src/components/sections/FAQ.tsx`

```tsx
<Item 
  q="Nouvelle question fréquente ?" 
  a="Voici la réponse détaillée à votre nouvelle question." 
/>
```

### Changer l'Image de Fond du Hero

1. Placez votre image dans `public/img/nouveau-fond.jpg`
2. Modifiez `src/components/sections/Hero.tsx` :

```tsx
<Image 
  src="/img/nouveau-fond.jpg"  // ← Nouvelle image
  alt="Description"
  fill 
  className="object-cover opacity-20" 
  priority
/>
```

---

## ✅ Checklist Après Modification

- [ ] J'ai testé localement avec `npm run dev`
- [ ] Toutes les apostrophes sont échappées (`&apos;`)
- [ ] Toutes les images sont dans `public/img/`
- [ ] Les chemins d'images commencent par `/img/`
- [ ] J'ai commité et poussé les changements
- [ ] Vercel a redéployé avec succès

---

## 🆘 Besoin d'Aide ?

Si vous avez des questions sur :
- Comment modifier un texte spécifique
- Où placer une image
- Comment ajouter une nouvelle section
- Comment changer les couleurs/styles

N'hésitez pas à demander !

---

**Rappel :** Toute modification commitée et poussée sur GitHub sera automatiquement déployée sur Vercel en 2-3 minutes ! 🚀

