# API Endpoint Implementation Plan: Product Catalog Management

## 1. Przegląd punktu końcowego

Endpoint umożliwia zarządzanie katalogami produktów przez użytkowników demo (merchandisers). Obsługuje operacje CRUD na katalogach produktów, w tym tworzenie, odczytywanie, aktualizację i usuwanie katalogów. Każdy katalog zawiera metadane oraz dane JSON z produktami.

## 2. Szczegóły żądania

### GET /api/catalogs
- **Metoda HTTP:** GET
- **Struktura URL:** `/api/catalogs`
- **Parametry:**
  - Wymagane: Authorization header (Bearer token)
  - Opcjonalne: 
    - `page` (number, default: 1)
    - `limit` (number, default: 50, max: 50)
    - `search` (string, search by name)
    - `sort` (string, default: 'created_at')
    - `order` (string, default: 'desc')
- **Request Body:** Brak

### POST /api/catalogs
- **Metoda HTTP:** POST
- **Struktura URL:** `/api/catalogs`
- **Parametry:**
  - Wymagane: Authorization header (Bearer token)
- **Request Body:**
```json
{
  "name": "string (required, max 255 chars)",
  "description": "string (optional, max 1000 chars)",
  "catalog_data": "object (required, JSON structure)"
}
```

### GET /api/catalogs/{catalog_id}
- **Metoda HTTP:** GET
- **Struktura URL:** `/api/catalogs/{catalog_id}`
- **Parametry:**
  - Wymagane: Authorization header, catalog_id (UUID)
- **Request Body:** Brak

### PUT /api/catalogs/{catalog_id}
- **Metoda HTTP:** PUT
- **Struktura URL:** `/api/catalogs/{catalog_id}`
- **Parametry:**
  - Wymagane: Authorization header, catalog_id (UUID)
- **Request Body:**
```json
{
  "name": "string (optional, max 255 chars)",
  "description": "string (optional, max 1000 chars)",
  "catalog_data": "object (optional, JSON structure)"
}
```

### DELETE /api/catalogs/{catalog_id}
- **Metoda HTTP:** DELETE
- **Struktura URL:** `/api/catalogs/{catalog_id}`
- **Parametry:**
  - Wymagane: Authorization header, catalog_id (UUID)
- **Request Body:** Brak

## 3. Wykorzystywane typy

### DTOs (Data Transfer Objects)
```typescript
// Request DTOs
interface CreateCatalogRequest {
  name: string;
  description?: string;
  catalog_data: Record<string, any>;
}

interface UpdateCatalogRequest {
  name?: string;
  description?: string;
  catalog_data?: Record<string, any>;
}

interface CatalogListQuery {
  page?: number;
  limit?: number;
  search?: string;
  sort?: 'created_at' | 'updated_at' | 'name';
  order?: 'asc' | 'desc';
}

// Response DTOs
interface CatalogResponse {
  id: string;
  demo_user_id: string;
  name: string;
  description: string | null;
  catalog_data: Record<string, any>;
  is_active: boolean;
  version: number;
  created_at: string;
  updated_at: string;
}

interface CatalogListResponse {
  catalogs: CatalogResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}
```

### Command Modele
```typescript
interface CreateCatalogCommand {
  demo_user_id: string;
  name: string;
  description?: string;
  catalog_data: Record<string, any>;
}

interface UpdateCatalogCommand {
  catalog_id: string;
  demo_user_id: string;
  name?: string;
  description?: string;
  catalog_data?: Record<string, any>;
}

interface DeleteCatalogCommand {
  catalog_id: string;
  demo_user_id: string;
}
```

## 4. Szczegóły odpowiedzi

### GET /api/catalogs
- **Success (200):** Lista katalogów z paginacją
- **Error (401):** Brak autoryzacji
- **Error (500):** Błąd serwera

### POST /api/catalogs
- **Success (201):** Utworzony katalog
- **Error (400):** Nieprawidłowe dane wejściowe
- **Error (401):** Brak autoryzacji
- **Error (409):** Katalog o takiej nazwie już istnieje
- **Error (500):** Błąd serwera

### GET /api/catalogs/{catalog_id}
- **Success (200):** Szczegóły katalogu
- **Error (401):** Brak autoryzacji
- **Error (404):** Katalog nie znaleziony
- **Error (500):** Błąd serwera

### PUT /api/catalogs/{catalog_id}
- **Success (200):** Zaktualizowany katalog
- **Error (400):** Nieprawidłowe dane wejściowe
- **Error (401):** Brak autoryzacji
- **Error (404):** Katalog nie znaleziony
- **Error (500):** Błąd serwera

### DELETE /api/catalogs/{catalog_id}
- **Success (204):** Katalog usunięty
- **Error (401):** Brak autoryzacji
- **Error (404):** Katalog nie znaleziony
- **Error (500):** Błąd serwera

## 5. Przepływ danych

1. **Autoryzacja:** Sprawdzenie Bearer token i pobranie demo_user_id
2. **Walidacja:** Walidacja danych wejściowych za pomocą Zod schemas
3. **Autoryzacja biznesowa:** Sprawdzenie uprawnień użytkownika
4. **Operacja bazodanowa:** Wykonanie operacji CRUD na tabeli product_catalogs
5. **RLS:** Row Level Security zapewnia izolację danych
6. **Odpowiedź:** Zwrócenie odpowiedniego kodu statusu i danych

## 6. Względy bezpieczeństwa

- **Autoryzacja:** Bearer token w headerze Authorization
- **RLS:** Row Level Security w Supabase zapewnia izolację danych
- **Walidacja:** Zod schemas dla walidacji danych wejściowych
- **CORS:** Ograniczenie do domeny aplikacji
- **CSP:** Content Security Policy headers
- **Rate limiting:** Ograniczenie liczby żądań na użytkownika
- **Logowanie:** Rejestrowanie prób nieautoryzowanego dostępu

## 7. Obsługa błędów

### Błędy walidacji (400)
- Nieprawidłowy format danych
- Przekroczenie limitów znaków
- Brak wymaganych pól

### Błędy autoryzacji (401)
- Brak tokenu autoryzacji
- Nieprawidłowy token
- Wygaśnięcie sesji

### Błędy uprawnień (403)
- Użytkownik nie ma uprawnień do zasobu
- Próba dostępu do cudzego katalogu

### Błędy zasobów (404)
- Katalog nie istnieje
- Nieprawidłowy UUID

### Błędy konfliktu (409)
- Katalog o takiej nazwie już istnieje
- Próba utworzenia duplikatu

### Błędy serwera (500)
- Błąd bazy danych
- Błąd wewnętrzny aplikacji

## 8. Rozważania dotyczące wydajności

- **Paginacja:** Ograniczenie do 50 elementów na stronę
- **Indeksy:** Indeksy na demo_user_id i is_active
- **Cache:** Cache dla często używanych katalogów
- **Kompresja:** Gzip compression dla odpowiedzi
- **CDN:** Statyczne zasoby z CDN

## 9. Etapy wdrożenia

1. **Utworzenie typów DTO i Command Models** ✅
   - Zdefiniowanie interfejsów TypeScript w `src/types.ts`
   - Utworzenie Zod schemas dla walidacji w `src/lib/validation/catalog.schemas.ts`

2. **Implementacja serwisu CatalogService** ✅
   - Utworzenie `src/lib/services/catalog.service.ts`
   - Implementacja metod CRUD
   - Obsługa błędów i logowanie

3. **Utworzenie endpointów API** ✅
   - `src/pages/api/catalogs/index.ts` (GET, POST)
   - `src/pages/api/catalogs/[catalog_id].ts` (GET, PUT, DELETE)
   - Implementacja middleware autoryzacji

4. **Implementacja walidacji** ✅
   - Zod schemas dla request/response
   - Walidacja UUID i formatów danych
   - Sprawdzanie limitów biznesowych

5. **Implementacja autoryzacji** ✅
   - Middleware sprawdzający Bearer token w `src/lib/middleware/auth.middleware.ts`
   - Weryfikacja uprawnień demo_user
   - Integracja z Supabase Auth

6. **Implementacja obsługi błędów** ✅
   - Centralne error handling w `src/lib/middleware/error.middleware.ts`
   - Logowanie błędów
   - Zwracanie odpowiednich kodów statusu

7. **Testy** ⏳
   - Unit testy dla serwisu
   - Integration testy dla endpointów
   - Testy bezpieczeństwa RLS

8. **Dokumentacja** ✅
   - Aktualizacja dokumentacji API
   - Przykłady użycia
   - Opis błędów i kodów statusu

## 10. Struktura plików

```
src/
├── types.ts                                    # Typy DTO i Command Models
├── lib/
│   ├── validation/
│   │   └── catalog.schemas.ts                  # Zod schemas walidacji
│   ├── services/
│   │   └── catalog.service.ts                  # Logika biznesowa
│   └── middleware/
│       ├── auth.middleware.ts                  # Autoryzacja
│       └── error.middleware.ts                 # Obsługa błędów
├── pages/api/catalogs/
│   ├── index.ts                                # GET, POST /api/catalogs
│   └── [catalog_id].ts                         # GET, PUT, DELETE /api/catalogs/{id}
└── db/
    ├── supabase.client.ts                      # Klient Supabase
    └── database.types.ts                       # Typy bazy danych
```

## 11. Przykłady użycia

### Tworzenie katalogu
```bash
curl -X POST http://localhost:4321/api/catalogs \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Electronics Catalog",
    "description": "Latest electronics products",
    "catalog_data": {
      "products": [
        {
          "id": "1",
          "name": "Smartphone",
          "price": 999.99
        }
      ]
    }
  }'
```

### Pobieranie listy katalogów
```bash
curl -X GET "http://localhost:4321/api/catalogs?page=1&limit=10&search=electronics" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Aktualizacja katalogu
```bash
curl -X PUT http://localhost:4321/api/catalogs/CATALOG_ID \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Electronics Catalog",
    "description": "Updated description"
  }'
```

### Usuwanie katalogu
```bash
curl -X DELETE http://localhost:4321/api/catalogs/CATALOG_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 12. Status implementacji

✅ **Zakończone:**
- Typy DTO i Command Models
- Zod schemas walidacji
- CatalogService z metodami CRUD
- Endpointy API (GET, POST, PUT, DELETE)
- Middleware autoryzacji
- Centralne error handling
- Dokumentacja

⏳ **Do zrobienia:**
- Testy jednostkowe i integracyjne
- Testy bezpieczeństwa RLS
- Optymalizacja wydajności
- Monitoring i logowanie

Implementacja endpointów API dla zarządzania katalogami produktów została zakończona pomyślnie. Wszystkie główne funkcjonalności są gotowe do użycia.
