# lawstudiesdashboard - Plateforme Académique Juridique

Application web progressive (PWA) conçue pour les étudiants des facultés de droit en Suisse. 
Gère les crédits ECTS (échelle 1.0 - 6.0), les notes, les plans d'études, et intègre un moteur de répétition espacée.

## Prérequis
- Node.js >= 18
- Compte Supabase
- Compte Cloudflare (Pages & Workers)
- Dépôt GitHub Privé

## Lancement local
1. Cloner le dépôt privé : `git clone [URL]`
2. Installer les dépendances : `npm install`
3. Copier l'environnement : `cp .env.example .env.local`
4. Lancer le serveur de développement : `npm run dev`

## Tests
- Logique métier (Vitest) : `npm run test`
- Parcours critiques (Playwright) : `npm run test:e2e`

## Déploiement sur Cloudflare Pages
1. Connecter le dépôt privé GitHub à Cloudflare Pages.
2. Paramètres de build :
   - Framework : `Vite`
   - Build command : `npm run build`
   - Build output directory : `dist`
3. Ajouter les variables d'environnement dans l'interface Cloudflare :
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Les déploiements sont automatiques à chaque push sur la branche `main`. Les Pull Requests génèrent des environnements de preview.
