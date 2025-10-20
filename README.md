## 1) Project name

Salesforce Personalization Storefront (Sandbox)

<p align="left">
  <a href="https://nodejs.org" target="_blank"><img alt="Node 22" src="https://img.shields.io/badge/node-22.14.0-339933?logo=node.js&logoColor=white"></a>
  <a href="https://astro.build" target="_blank"><img alt="Astro 5" src="https://img.shields.io/badge/astro-5-FF5D01?logo=astro&logoColor=white"></a>
  <a href="https://react.dev" target="_blank"><img alt="React 19" src="https://img.shields.io/badge/react-19-61DAFB?logo=react&logoColor=black"></a>
  <a href="https://tailwindcss.com" target="_blank"><img alt="Tailwind 4" src="https://img.shields.io/badge/tailwind-4-06B6D4?logo=tailwindcss&logoColor=white"></a>
  <a href="#8-license" target="_blank"><img alt="License" src="https://img.shields.io/badge/license-TBD-lightgrey"></a>
  <a href="#7-project-status" target="_blank"><img alt="Status" src="https://img.shields.io/badge/status-MVP_planning-blue"></a>
  <a href="./package.json" target="_blank"><img alt="Version" src="https://img.shields.io/badge/version-0.0.1-informational"></a>
  
</p>

---

### Table of contents
- [2) Project description](#2-project-description)
- [3) Tech stack](#3-tech-stack)
- [4) Getting started locally](#4-getting-started-locally)
- [5) Available scripts](#5-available-scripts)
- [6) Project scope](#6-project-scope)
- [7) Project status](#7-project-status)
- [8) License](#8-license)

## 2) Project description

A sandbox ecommerce storefront for testing and validating any Salesforce Personalization SDK instance provided as a URL. The app lets you configure the SDK from the UI, renders recommendation slots on the Home (HP) and Product (PDP) pages entirely on the client, tracks GA4‑like ecommerce events via `window.dataLayer` and `CustomEvent`s, and includes a simple local cart and fake checkout success. A product catalog can be uploaded to Supabase as JSON.

Linear objectives
- Configure SDK URL in the header (persisted in `localStorage`, ping/test, reset)
- Render client‑side recommendations in defined slots after SDK loads (no SSR)
- Track standard ecommerce events (view, add‑to‑cart, purchase, identity)
- Test end‑to‑end flows quickly with a local cart and fake checkout

References
- Product Requirements: `/.ai/prd.md`

## 3) Tech stack

- **Frontend**: Astro 5 (islands), React 19, TypeScript 5, Tailwind CSS 4, shadcn/ui
- **Platform**: Supabase (Auth for identity; Storage/DB for product catalog)
- **Rendering**: Client‑side only for SDK and recommendation slots
- **Tooling**: ESLint 9, Prettier, `@astrojs/react`, `@astrojs/sitemap`, `@astrojs/node`

Selected dependencies
- `astro@^5.13.7`, `react@^19.1.1`, `tailwindcss@^4.1.13`, `@tailwindcss/vite`, `lucide-react`, `class-variance-authority`, `tailwind-merge`

## 4) Getting started locally

Prerequisites
- Node `22.14.0` (see `.nvmrc`). Recommended: `nvm use`.
- npm (bundled with Node). pnpm/yarn are not configured here.

Install and run
```bash
# Use Node 22
nvm use

# Install dependencies
npm install

# Start the dev server
npm run dev

# Build for production
npm run build

# Preview the production build
npm run preview
```

Project structure (high level)
- `src/` – source code
- `src/layouts/` – Astro layouts
- `src/pages/` – Astro pages (routes)
- `src/pages/api/` – API endpoints (as needed)
- `src/middleware/index.ts` – Astro middleware
- `src/db/` – Supabase clients and types (when introduced)
- `src/types.ts` – Shared types across app
- `src/components/` – Astro and React components
- `src/components/ui/` – shadcn/ui components
- `src/lib/` – services and helpers
- `src/assets/` – internal static assets
- `public/` – public assets

Environment configuration
- Supabase project setup and environment variables are not yet included. When backend integration begins, add `.env.example` with variables like `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and any SDK config.

## 5) Available scripts

From `package.json`:
- **dev**: `astro dev` – start the development server
- **build**: `astro build` – build a production bundle
- **preview**: `astro preview` – preview the production build locally
- **astro**: `astro` – run Astro CLI directly
- **lint**: `eslint .` – run ESLint
- **lint:fix**: `eslint . --fix` – auto‑fix lint issues
- **format**: `prettier --write .` – format the codebase

## 6) Project scope

MVP capabilities
- **Pages**: HP, PDP, simple checkout (no real payments)
- **Recommendation slots**: HP (2 slots: hero up to 6 cards, grid up to 4); PDP (“You may also like” up to 4); skeleton loading; hide if empty
- **SDK configurator (header)**: URL (https enforced), Save to `localStorage`, Ping (CORS/200/JSON), Reset; per‑browser configuration
- **Client‑side data fetching**: enforced CORS at SDK endpoint; 800 ms timeout; browser cache strategy stale‑while‑revalidate where possible
- **Runtime JSON validation**: minimal item schema `{ id, name, price, imageUrl, url }`; invalid items dropped; hide slot if empty after validation
- **Identity**: Supabase Auth; emit `identity` on `onAuthStateChange`
- **Events & dataLayer**: maintain `window.dataLayer`; emit GA4‑like payloads and `CustomEvent personalisation-event-{name}`; enrich with `{ timestamp, sessionId, userId? }`
- **Cart & checkout**: cart in `localStorage`; add/remove/update; fake success generates `orderId` (UUID v4), emits `purchase`, clears cart
- **Product catalog**: upload JSON to Supabase; minimal schema validation; public read for test env
- **Performance/resilience**: non‑blocking init; 800 ms recommendation timeout; warn‑level logging for validation issues; no critical console errors in nominal paths
- **A11y/UX**: skeletons, keyboard focusable controls, alt text for images
- **Debug**: optional debug mode for ping times, validation results

Out of scope (MVP)
- PLP recommendation slots, SSR, real payments, server‑side targeting/segmentation, SDK domain whitelist, complex product variants

## 7) Project status

- Status: MVP planning/early implementation. Frontend scaffold present; SDK integration and Supabase wiring to follow.
- Targets (examples): high ping success rate, fast first meaningful paint of slots, no critical console errors across HP → PDP → add‑to‑cart → purchase.
- Documents: see `/.ai/prd.md` for detailed requirements.
- Badges: CI/build/coverage/deploy badges to be added once pipelines are configured.

## 8) License

No license file is provided yet. Until a license is added, all rights are reserved by the repository owner. To open‑source the project, consider adding an OSI‑approved license (e.g., MIT) and a `CONTRIBUTING.md`.
