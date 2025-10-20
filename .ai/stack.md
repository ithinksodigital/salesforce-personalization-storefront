## Stack technologiczny

Dokument podsumowuje stack używany w projekcie zgodnie z PRD i aktualną bazą kodu.

### Core framework i język
- **Astro 5**: meta‑framework, routing, build; rendering stron, bez SSR dla rekomendacji (CSR‑only dla SDK/slotów).
- **TypeScript 5**: typowanie całego projektu (frontend i proste API routes).
- **React 19**: komponenty dynamiczne po stronie klienta w obrębie Astro (`client:load`).

### UI i stylowanie
- **Tailwind CSS 4**: narzędzie do stylowania (utility‑first). Globalny arkusz w `src/styles/global.css`.
- **shadcn/ui**: biblioteka komponentów (np. `src/components/ui/button.tsx`), jako baza spójnych elementów UI.

### Baza danych i usługi backendowe
- **Supabase**:
  - Auth: logowanie/wylogowanie, obserwacja `onAuthStateChange` i emisja zdarzenia `identity`.
  - Przechowywanie katalogu produktów (Storage/tabela) – dostęp read‑only dla storefrontu.
  - Klienci i typy w `src/db` (docelowo; zgodnie z konwencją projektu).

### Integracje i zdarzenia (analityka)
- **dataLayer (GA4‑like)**: `window.dataLayer = []` utrzymywane w runtime.
- **CustomEvent**: `personalisation-event-{name}` emitowany równolegle do wpisu w `dataLayer`.
- Zdarzenia: `view_item`, `add_to_cart`, `purchase`, `identity`; każde wzbogacone o `timestamp`, `sessionId`, `userId?`.

### Personalizacja (SDK rekomendacji)
- SDK ładowane i konfigurowane wyłącznie w przeglądarce (CSR), URL wprowadzany w headerze i trzymany w `localStorage`.
- Ping/healthcheck SDK (CORS/200/JSON) z krótkim time‑to‑fail.
- Pobieranie rekomendacji z **timeout 800 ms** oraz strategią cache „stale‑while‑revalidate” (przeglądarka; ETag/Cache‑Control jeśli dostępne po stronie SDK).
- Walidacja kontraktu rekomendacji w runtime: minimalnie `{ id: string, name: string, price: number, imageUrl: string, url: string }`; elementy niepoprawne są odrzucane, a pusty slot ukrywany.

### Stan i przechowywanie po stronie klienta
- **localStorage**: konfiguracja SDK, koszyk (model: `{ items: [{ id, name, price, qty }], currency, updatedAt }`).
- **sessionStorage**: `sessionId` generowany per karta (tab) przeglądarki.

### Budowanie, jakość i narzędzia developerskie
- **ESLint**: statyczna analiza kodu (konfiguracja w `eslint.config.js`).
- **tsconfig.json**: konfiguracja TypeScript.
- Bundling/dev server przez ekosystem Astro (Vite pod spodem; domyślna konfiguracja).

### Architektura runtime i strony (MVP)
- Strony: HP, PDP, prosty checkout (fake success, bez realnych płatności).
- Sloty rekomendacji (CSR‑only):
  - HP: slot „hero” (do 6 kart) i „grid” (do 4 kart) z skeletonami; ukrywanie przy braku danych.
  - PDP: sekcja „You may also like” (do 4 kart) z skeletonami; ukrywanie przy braku danych.
- Brak fallbacków serwerowych (no SSR dla rekomendacji) w MVP.

### Struktura projektu (konwencja)
- `src/` – źródła
- `src/layouts/` – layouty Astro
- `src/pages/` – strony Astro
- `src/pages/api/` – lekkie endpointy API
- `src/middleware/index.ts` – middleware Astro
- `src/db/` – klienci Supabase i typy
- `src/types.ts` – współdzielone typy (Entities, DTOs)
- `src/components/` – komponenty Astro/React
- `src/components/ui/` – komponenty z shadcn/ui
- `src/lib/` – serwisy i helpery (np. obsługa SDK, dataLayer, koszyk)
- `src/assets/` – wewnętrzne zasoby statyczne
- `public/` – publiczne zasoby

### Ograniczenia i założenia MVP (istotne dla stacku)
- Wymagane `https` dla URL SDK; CORS po stronie endpointu SDK.
- Timeout rekomendacji 800 ms; UI nie blokuje interakcji; skeletony do chwili danych.
- Brak SSR i brak whitelisty domen SDK w MVP (z udokumentowanymi ryzykami).

### Wersje (wg PRD i repo)
- Astro 5
- TypeScript 5
- React 19
- Tailwind CSS 4
- shadcn/ui (wersja zgodna z React 19)
- Supabase (SDK JS aktualne na moment integracji)

### Notatki implementacyjne
- Rekomendowana walidacja runtime (np. `zod`) – do rozważenia przy implementacji, aby spełnić kryteria PRD dot. filtracji i logowania błędów jako `warn`.
- Emisja `identity` na każde `onAuthStateChange`; `sessionId` per tab, nie synchronizowany między kartami w MVP.


