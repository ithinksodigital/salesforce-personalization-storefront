# Dokument wymagań produktu (PRD) - salesforce-personalization-storefront
## 1. Przegląd produktu
Ecommerce storefront w trybie sandbox do testowania integracji z dowolnym Salesforce Personalization SDK (dostarczanym jako URL). Aplikacja umożliwia szybką zmianę i walidację konfiguracji SDK z poziomu interfejsu, renderuje sloty rekomendacji na stronie głównej (HP) i stronie produktu (PDP) wyłącznie po stronie klienta (CSR), śledzi standardowe zdarzenia e‑commerce w dataLayer oraz udostępnia prosty, lokalny koszyk i checkout (fake success). Katalog produktów może być ładowany do Supabase jako JSON.

Zakres MVP
- Strony: HP, PDP, prosty checkout (bez realnych płatności).
- Sloty rekomendacji: HP (2 sloty), PDP (co najmniej 1 slot „You may also like”).
- Konfigurator SDK w headerze (URL, zapis w localStorage, ping/test, reset).
- Render rekomendacji wyłącznie client‑side po załadowaniu SDK; brak SSR.
- Zdarzenia: view, add-to-cart, purchase, identity; dataLayer + personalisation-event-{event}.
- Auth: Supabase; emitowanie identity na zmianę stanu sesji.
- Koszyk: w localStorage; purchase emitowany po fake success.
- Katalog produktów: upload do Supabase (JSON) i podstawowa walidacja.

Technologie (docelowo w repo): Astro 5, TypeScript 5, React 19, Tailwind 4, shadcn/ui; Supabase dla auth i przechowywania katalogu produktów.

## 2. Problem użytkownika
- Merchandiserzy/QA potrzebują bezpiecznego, izolowanego środowiska do szybkiego testowania rekomendacji z różnych wersji/instancji SDK, bez ingerencji w produkcyjne systemy.
- Deweloperzy muszą szybko weryfikować kontrakty danych, zachowanie slotów oraz zgodność zdarzeń e‑commerce z dataLayer bez skomplikowanej konfiguracji backendu.
- Zespół potrzebuje spójnego sposobu identyfikacji użytkownika/sesji i minimalnych narzędzi do walidacji jakości danych (CORS, timeouty, walidacja schematów JSON) oraz mierzenia skuteczności testów (metryki techniczne i operacyjne).

## 3. Wymagania funkcjonalne
3.1. Konfigurator SDK w headerze
- Pole URL (wymagane https), przycisk Zapisz (localStorage), Ping SDK (sprawdza CORS/200/JSON), Reset (czyści konfigurację).
- SDK konfigurowane per przeglądarka; każdy użytkownik może ustawić własny URL.
- Walidacja: format https, maks. długość 2 048 znaków, brak SSR.
- Lifecycle: inicjalizacja po DOMContentLoaded; nie blokuje interakcji.

3.2. Ładowanie i cache SDK/rekos (CSR)
- Zapytania client‑side, z wymuszonym CORS po stronie endpointu SDK.
- Timeout 800 ms na zapytanie rekomendacji.
- Cache strategia stale‑while‑revalidate (po stronie przeglądarki; gdy możliwe, ETag/Cache‑Control wykorzystywane przez przeglądarkę).

3.3. Sloty rekomendacji
- HP: 2 sloty (hero do 6 kart, grid do 4 kart), skeletony; ukrywanie slotu przy braku danych.
- PDP: do 4 kart w sekcji „You may also like”, skeletony; ukrywanie przy braku danych.
- Brak fallbacków serwerowych w MVP.

3.4. Kontrakt JSON rekomendacji (runtime validation)
- Minimalny schemat elementu: { id: string, name: string, price: number, imageUrl: string, url: string }.
- Walidacja w runtime; elementy niespełniające schematu są odrzucane, a slot ukrywany jeśli po filtracji jest pusty.

3.5. Identyfikacja użytkownika i sesji
- Auth: Supabase. Emitowanie identity po każdym onAuthStateChange.
- sessionId: generowany per karta (tab) przeglądarki, odświeżany przy otwarciu nowej karty; przechowywany w sessionStorage.
- userId: z Supabase (gdy zalogowany), null w przeciwnym razie.

3.6. Zdarzenia i dataLayer
- Utrzymywany window.dataLayer = [].
- Wrapper emitPersonalisationEvent(name, payload) emituje jednocześnie:
  - push do dataLayer ze zdarzeniem e‑commerce zgodnym z GA4‑like (patrz 3.7)
  - CustomEvent personalisation-event-{name} na window
- Wszystkie eventy wzbogacane o: timestamp (ms), sessionId, userId (jeśli dostępny).

3.7. Specyfikacja payloadów zdarzeń (GA4‑like minimal)
- view (PDP): { event: "view_item", ecommerce: { items: [{ item_id: id, item_name: name, price, item_variant?, item_brand?, item_category?, quantity: 1 }] }, page: { type: "pdp" }, productId: id }
- add-to-cart: { event: "add_to_cart", ecommerce: { items: [{ item_id: id, item_name: name, price, quantity }] }, cart: { totalItems, totalValue } }
- purchase: { event: "purchase", ecommerce: { transaction_id: orderId, value: totalValue, currency: currency, items: [{ item_id, item_name, price, quantity }] } }
- identity: { event: "login"|"logout"|"identity", user: { id?: userId }, session: { id: sessionId } }
- Każdy payload zawiera meta: { timestamp, sessionId, userId? } dodawane przed emisją.

3.8. Koszyk i checkout
- Model koszyka w localStorage: { items: [{ id, name, price, qty }], currency: "USD"|"EUR"|"PLN", updatedAt }.
- Dodawanie/usuwanie/zmiana ilości; emisja add-to-cart przy dodaniu.
- Fake checkout success: generacja orderId (UUID v4), emisja purchase; czyszczenie koszyka po sukcesie.

3.9. Katalog produktów (Supabase)
- Upload pliku JSON przez panel (poza MVP UI może być minimalny), walidacja schematu minimalnego: { id, name, price, imageUrl, url }.
- Przechowywanie w Supabase Storage lub tabela; endpoint publiczny do odczytu (read‑only) w środowisku testowym.

3.10. Wydajność i odporność
- Inicjalizacja SDK i slotów nie blokuje interakcji UI.
- Timeout rekomendacji 800 ms; po przekroczeniu slot renderuje skeleton i jest ukrywany jeśli brak danych.
- Brak błędów w konsoli w scenariuszach nominalnych; błędy walidacji logowane jako warn.

3.11. Dostępność i UX
- Sloty z skeletonami, fokus klawiatury na kontrolkach koszyka i konfiguratora SDK.
- Obrazy z alt, karty z etykietami.

3.12. Telemetria i debug
- Tryb debug (opcjonalny przełącznik): loguje ping SDK, czas odpowiedzi, wyniki walidacji.

## 4. Granice produktu
- Poza zakresem: PLP rekomendacje (mogą pojawić się po MVP), SSR, realne płatności, segmentacja/targetowanie po stronie serwera, whitelist domen SDK, rozbudowane warianty produktowe.
- Bezpieczeństwo w MVP: walidacja https dla URL SDK, CORS wymagany po stronie SDK; brak whitelisty domen; brak egzekwowania CSP ponad standardy dev.
- Dane finansowe: wartości brutto jako uproszczenie, pojedyncza waluta konfigurowalna w UI lub stała w MVP.
- Sesje: per tab (sessionStorage), reset przy zamknięciu karty; brak cross‑tab sync w MVP.

## 5. Historyjki użytkowników
US-001
Tytuł
Konfiguracja URL SDK w headerze
Opis
Jako merchandiser/QA chcę wpisać URL do SDK w headerze, zapisać go lokalnie i przetestować połączenie, aby szybko uruchomić rekomendacje.
Kryteria akceptacji
- UI zawiera pole URL (wymagane https), przyciski Zapisz, Ping, Reset.
- Po Zapisz adres trafia do localStorage i jest stosowany po odświeżeniu.
- Ping zwraca status powodzenia lub błąd (CORS/timeout/format JSON).
- Reset czyści konfigurację i przywraca stan domyślny.

US-002
Tytuł
Render slotów rekomendacji na HP
Opis
Jako użytkownik chcę widzieć rekomendacje na HP w dwóch slotach, aby odkrywać produkty.
Kryteria akceptacji
- Slot hero renderuje do 6 kart; slot grid do 4 kart.
- Przy braku danych slot jest ukryty; przed danymi wyświetlane są skeletony.
- Ładowanie danych respektuje timeout 800 ms; po przekroczeniu slot nie blokuje UI.

US-003
Tytuł
Render slotu rekomendacji na PDP
Opis
Jako użytkownik chcę widzieć sekcję „You may also like” na PDP, aby znaleźć alternatywy.
Kryteria akceptacji
- Slot renderuje do 4 kart.
- Brak danych powoduje ukrycie sekcji; skeletony podczas ładowania.
- Emisja view_item na wejściu na PDP z productId.

US-004
Tytuł
Walidacja kontraktu JSON rekomendacji
Opis
Jako deweloper chcę, by rekomendacje były walidowane runtime, aby zapobiec błędom renderowania.
Kryteria akceptacji
- Każdy element musi mieć id, name, price, imageUrl, url o poprawnych typach.
- Elementy niepoprawne są odrzucane; jeśli wszystkie odrzucone, slot się ukrywa.
- Błędy walidacji są logowane jako warn, bez błędów krytycznych w konsoli.

US-005
Tytuł
Identyfikacja użytkownika i sesji
Opis
Jako właściciel produktu chcę mieć spójne userId i sessionId w eventach, aby wiązać zachowania użytkowników.
Kryteria akceptacji
- sessionId generowany per tab i dołączany do wszystkich eventów.
- Po onAuthStateChange Supabase emitowany event identity z userId (lub logout).
- userId i sessionId obecne w payloadach view, add-to-cart, purchase, identity.

US-006
Tytuł
Obsługa koszyka w localStorage
Opis
Jako użytkownik chcę dodawać produkty do koszyka i finalizować zakup w trybie testowym.
Kryteria akceptacji
- Dodanie do koszyka emituje add-to-cart z poprawnym payloadem.
- Fake success generuje orderId (UUID v4), emituje purchase i czyści koszyk.
- Koszyk utrzymuje currency i sumy; UI odświeża się po zmianach.

US-007
Tytuł
Upload katalogu produktów do Supabase
Opis
Jako merchandiser/QA chcę wgrać plik JSON z produktami, aby testować rekomendacje na znanym katalogu.
Kryteria akceptacji
- Walidacja minimalnego schematu katalogu { id, name, price, imageUrl, url }.
- Po poprawnym uploadzie dane są dostępne read‑only dla storefrontu.
- Błędy formatu zwracają komunikaty wskazujące dokładne pola.

US-008
Tytuł
Emisja zdarzeń do dataLayer i custom events
Opis
Jako analityk chcę, aby zdarzenia były zgodne z GA4‑like i dostępne w dataLayer oraz jako personalisation-event-*, aby integrować narzędzia analityczne.
Kryteria akceptacji
- view_item, add_to_cart, purchase i identity są emitowane z określonymi polami.
- Każde zdarzenie ma timestamp, sessionId, userId (jeśli dostępny).
- CustomEvent personalisation-event-{name} jest emitowany na window.

US-009
Tytuł
Zarządzanie błędami i timeoutami SDK
Opis
Jako użytkownik chcę, aby strona działała płynnie nawet przy problemach z SDK.
Kryteria akceptacji
- Timeout 800 ms kończy oczekiwanie; UI pozostaje interaktywny.
- Błędy CORS/formatu nie powodują błędów krytycznych; sloty są ukrywane.
- Brak błędów w konsoli w scenariuszach nominalnych.

US-010
Tytuł
Dostępność i skeletony
Opis
Jako użytkownik chcę mieć czytelne wskaźniki ładowania i dostępne elementy sterujące.
Kryteria akceptacji
- Skeletony widoczne do czasu danych; ukryte po renderze.
- Elementy interaktywne fokusowalne; obrazy mają alt.

US-011
Tytuł
Bezpieczne logowanie i wylogowanie (Supabase)
Opis
Jako użytkownik chcę bezpiecznie się zalogować/wylogować, aby moje dane były poprawnie powiązane z eventami.
Kryteria akceptacji
- Logowanie przez Supabase skutkuje emisją identity z userId.
- Wylogowanie emituje identity typu logout; sessionId pozostaje per tab.
- Błędne logowanie nie emituje identity i zwraca czytelny komunikat.

US-012
Tytuł
Konfiguracja CORS i walidacja URL SDK
Opis
Jako deweloper chcę mieć minimalne zabezpieczenia przy wstrzykiwaniu SDK.
Kryteria akceptacji
- UI nie akceptuje URL bez https ani nadmiernie długich.
- Komunikat o wymaganym CORS po nieudanym ping.
- Brak whitelisty w MVP, z dokumentacją ryzyk i zaleceń.

US-013
Tytuł
PDP: emisja view_item z kanonicznym id
Opis
Jako analityk chcę jednoznacznej identyfikacji produktu po polu id.
Kryteria akceptacji
- Wejście na PDP emituje view_item z item_id równym id produktu.
- Brak id blokuje emisję i loguje ostrzeżenie.

US-014
Tytuł
Retry/Cache dla rekomendacji (stale‑while‑revalidate)
Opis
Jako użytkownik chcę szybki render z cache i aktualizację po cichu.
Kryteria akceptacji
- Pierwsze wyświetlenie może użyć cache przeglądarki.
- Po otrzymaniu świeżych danych slot aktualizuje się bez migotania.

US-015
Tytuł
Obsługa scenariuszy skrajnych
Opis
Jako QA chcę, aby aplikacja radziła sobie z pustymi, częściowymi i uszkodzonymi danymi.
Kryteria akceptacji
- Pusty JSON: sloty ukryte, brak błędów.
- Częściowo niepoprawne elementy: poprawne renderowane, niepoprawne odrzucone.
- Uszkodzony JSON: log warn, brak crasha UI.

## 6. Metryki sukcesu
Metryki techniczne
- Odsetek powodzeń Ping SDK ≥ 95% w środowisku testowym.
- Średni TTFMP slotu < 1 200 ms dla danych z cache; timeout egzekwowany 800 ms.
- 0 błędów krytycznych w konsoli w ścieżce HP → PDP → add‑to‑cart → purchase.

Metryki zdarzeń/analityczne
- Pokrycie zdarzeń: view_item, add_to_cart, purchase, identity emitowane w ≥ 99% odpowiednich akcji.
- Każde zdarzenie zawiera timestamp, sessionId; identity zawiera userId po zalogowaniu.

Metryki produktowe/QA
- Zmiana URL SDK w headerze działa per przeglądarka (persist w localStorage) i aktywuje się po odświeżeniu.
- Po uploadzie katalogu JSON w Supabase dane są dostępne i renderowane w slotach (lub sloty ukryte przy braku danych) bez błędów.
- UX: brak blokowania interakcji podczas ładowania rekomendacji; skeletony widoczne, sloty ukrywane przy braku danych.
