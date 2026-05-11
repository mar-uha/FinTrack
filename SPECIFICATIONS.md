# Application Budget Commun — Spécifications

> Document de cadrage pour l'application web de gestion du budget commun.

---

## 1. Plateforme & Stack technique

### Choix retenus
- **Type** : Application web (PWA) avec **design mobile-first**
- **Framework** : **Next.js 15** (App Router) + **TypeScript**
- **Hébergement** : **Vercel** (free tier, déploiement Git automatique)

### Stack recommandée (simple, légère, gratuite pour 2 utilisateurs)

| Besoin | Techno recommandée | Pourquoi |
|---|---|---|
| **UI / Style** | Tailwind CSS + **shadcn/ui** | Composants élégants prêts à l'emploi, copiés dans le projet (pas de dépendance lourde), parfait mobile-first |
| **Base de données** | **Neon** (Postgres serverless) | Free tier généreux (0.5 GB), scale-to-zero, Postgres standard, parfait pour 2 utilisateurs |
| **ORM** | **Prisma** | Meilleure DX pour un dev solo, migrations simples, typage auto |
| **Authentification** | **Auth.js v5** (NextAuth) + Google Provider | Standard de l'écosystème Next.js, Google OAuth en 10 lignes |
| **Parsing CSV** | **PapaParse** | Robuste, gère bien les CSV BoursoBank (encodage, séparateurs `;`) |
| **Graphiques** | **Recharts** | Léger, React-native, responsive |
| **Formulaires** | react-hook-form + **Zod** | Validation typée, peu de boilerplate |
| **Dates** | date-fns | Léger, fonctionnel |
| **Icônes** | lucide-react | Déjà intégré avec shadcn/ui |

### Pourquoi pas autre chose ?
- **Supabase** : très bien, mais l'auth Supabase ajoute une couche qu'on n'utiliserait pas (on prend juste la DB). Neon est plus focalisé.
- **SQLite/Turso** : excellent aussi, mais Postgres + Prisma est plus standard si tu connais déjà.
- **Drizzle ORM** : plus performant que Prisma, mais Prisma est plus simple pour un dev solo.
- **Material UI / Chakra** : plus lourds et moins "modernes" visuellement que shadcn/ui.

### Coût estimé
**0 €/mois** sur les free tiers (Vercel + Neon + Auth.js). Largement suffisant pour 2 utilisateurs.

---

## 2. Fonctionnalités (MVP)

### Source des données
- Import de **fichiers CSV** exportés depuis le site de la banque (BoursoBank, format `;` séparateur, encodage UTF-8).
- Colonnes attendues : `dateOp`, `dateVal`, `label`, `category`, `categoryParent`, `supplierFound`, `amount`, `comment`, `accountNum`, `accountLabel`, `accountbalance`.

### Catégories (reprises du CSV)
Les **catégories parent** identifiées dans le CSV existant :
- **Logement** — Loyers/Charges, Énergie, Travaux/entretien
- **Vie quotidienne** — Alimentation, Bien-être et soins
- **Loisirs et sorties** — Restaurants/bars, Sorties
- **Abonnements & téléphonie** — Multimédia (Spotify, internet…)
- **Auto & Moto** — Péages, Carburant
- **Non catégorisé**

### Distinction Récurrent / Variable
Deux grands types de dépenses à distinguer dans l'app :
- **Dépenses récurrentes** : Loyer, abonnements, énergie, assurance…
- **Dépenses variables** : Courses, loisirs, sorties, restaurants…

> Possibilité de marquer une catégorie (ou sous-catégorie) comme "récurrente" ou "variable" via un champ booléen.

### Fonctionnalités MVP

1. **Authentification Google** (Auth.js)
   - Whitelist d'emails autorisés (toi + ta conjointe) pour éviter qu'un inconnu se connecte.

2. **Import CSV**
   - Upload du fichier depuis l'interface.
   - Détection des doublons (par date + label + montant).
   - Aperçu avant import.

3. **Liste des transactions**
   - Vue mobile-friendly avec filtres (mois, catégorie, type récurrent/variable).
   - Recherche par libellé.
   - Édition manuelle de la catégorie si besoin.

4. **Définition de budgets mensuels**
   - Saisir un montant budgété par catégorie (et par mois ou récurrent).
   - Possibilité de dupliquer le budget du mois précédent.

5. **Tableau de bord (vue principale)**
   - Total dépensé / budget par catégorie (barres de progression).
   - Solde restant du mois.
   - Vue séparée : dépenses récurrentes vs variables.
   - Graphique camembert par catégorie.

6. **Historique & comparaison**
   - Vue par mois.
   - Comparaison mois en cours vs mois précédent.

### Hors MVP (V2 éventuelles)
- Notifications quand un budget dépasse un seuil.
- Catégorisation automatique des nouvelles écritures (basée sur l'historique).
- Export PDF / Excel.
- Gestion multi-comptes.

---

## 3. Synchronisation & Données

### Authentification
- **Google OAuth** via Auth.js v5.
- Whitelist d'emails autorisés (config env var).

### Base de données : Neon (Postgres)
- Plan **Free** : 0.5 GB stockage, scale-to-zero, 1 projet, branches illimitées.
- Largement suffisant pour 2 utilisateurs et plusieurs années d'historique.

### Modèle de données (esquisse)

```
User
  - id, email, name, image

Category
  - id, name, parentName, type (RECURRENT | VARIABLE), color, icon

Transaction
  - id, dateOp, dateVal, label, amount, comment, supplierFound
  - categoryId, accountNum, accountLabel
  - importBatchId (pour retracer l'import d'origine)
  - createdAt

Budget
  - id, categoryId, month (YYYY-MM), amount

ImportBatch
  - id, filename, importedAt, importedById, count
```

### Workflow
1. Tu télécharges le CSV depuis le site BoursoBank.
2. Tu l'uploades dans l'app.
3. L'app parse, déduplique, et insère les nouvelles écritures en BDD.
4. Toi et ta conjointe consultez les données en temps réel (BDD partagée).

---

## 4. Côté pratique

- **Usage privé** : seulement toi + ta conjointe (whitelist d'emails).
- **Pas de publication** sur des stores ou app store (PWA installable sur l'écran d'accueil du téléphone si voulu).
- **Esthétique** : design soigné, mobile-first, animations légères, mode sombre/clair.
- **Palette de couleurs** : à définir (par défaut shadcn/ui propose plusieurs thèmes élégants).

---

## 5. Étapes de développement proposées

### Phase 0 — Setup (jour 1)
1. Initialiser le projet Next.js 15 + TypeScript + Tailwind.
2. Installer shadcn/ui + composants de base.
3. Créer le repo Git (GitHub).
4. Créer la BDD Neon, configurer Prisma.
5. Configurer Auth.js avec Google.
6. Déployer une première version "Hello World" sur Vercel.

### Phase 1 — Modèle & import CSV (jours 2-4)
1. Définir le schéma Prisma (User, Category, Transaction, Budget, ImportBatch).
2. Seeder les catégories à partir du CSV existant.
3. Implémenter l'upload + parsing PapaParse.
4. Déduplication + insertion en BDD.
5. Vue de la liste des transactions.

### Phase 2 — Budgets & tableau de bord (jours 5-7)
1. CRUD des budgets mensuels par catégorie.
2. Tableau de bord : totaux, barres de progression, camembert.
3. Filtres récurrent/variable.

### Phase 3 — Polish (jour 8+)
1. Mode sombre / clair.
2. PWA (manifeste + service worker pour installation sur mobile).
3. Comparaison mois sur mois.
4. Petites animations.

---

## 6. Prochaines actions

- [ ] Valider la stack technique ci-dessus.
- [ ] Choisir un nom de projet (pour le repo GitHub et le sous-domaine Vercel).
- [ ] Créer les comptes nécessaires : GitHub (déjà OK ?), Vercel, Neon, Google Cloud Console (pour l'OAuth).
- [ ] Décider du périmètre exact du MVP (peut-on couper quelque chose pour aller plus vite ?).
- [ ] Commencer Phase 0.
