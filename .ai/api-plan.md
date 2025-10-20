# REST API Plan - Flash Cards AI

## 1. Resources

Based on the database schema and PRD requirements, the main resources are:

- **Users** (demo_users, end_users) - User account management
- **Sets** (product_catalogs equivalent) - Flashcard sets/collections
- **Flashcards** (products equivalent) - Individual flashcard items
- **Batches** - AI-generated flashcard proposals for review
- **SRS Sessions** - Spaced repetition system learning sessions
- **Analytics Events** - User behavior and learning progress tracking
- **Recommendations** - Cached AI recommendations

## 2. Endpoints

### Authentication

#### POST /api/auth/login
- **Description**: Authenticate user with Google OAuth
- **Request Body**:
```json
{
  "provider": "google",
  "token": "google_oauth_token"
}
```
- **Response**:
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "User Name",
    "type": "demo_user" | "end_user"
  },
  "session": {
    "access_token": "jwt_token",
    "expires_at": "2024-01-01T00:00:00Z"
  }
}
```
- **Success**: 200 OK
- **Errors**: 401 Unauthorized, 400 Bad Request

#### POST /api/auth/logout
- **Description**: End user session
- **Headers**: Authorization: Bearer {token}
- **Response**: 204 No Content
- **Errors**: 401 Unauthorized

### Flashcard Generation

#### POST /api/flashcards/generate
- **Description**: Generate 30 flashcards from input text using AI
- **Headers**: Authorization: Bearer {token}
- **Request Body**:
```json
{
  "text": "input text (10-15k characters)",
  "language": "auto" | "pl" | "en" | "es",
  "set_id": "uuid" // optional, for direct save
}
```
- **Response**:
```json
{
  "batch_id": "uuid",
  "status": "processing",
  "estimated_completion": "2024-01-01T00:00:10Z",
  "progress": 0
}
```
- **Success**: 202 Accepted
- **Errors**: 400 Bad Request (text too long), 429 Too Many Requests, 500 Internal Server Error

#### GET /api/flashcards/batches/{batch_id}
- **Description**: Get batch status and generated flashcards
- **Headers**: Authorization: Bearer {token}
- **Response**:
```json
{
  "id": "uuid",
  "status": "completed" | "processing" | "failed",
  "flashcards": [
    {
      "id": "uuid",
      "front": "question (≤200 chars)",
      "back": "answer (≤500 chars)",
      "language": "pl",
      "accepted": null,
      "edited": false
    }
  ],
  "progress": 100,
  "created_at": "2024-01-01T00:00:00Z"
}
```
- **Success**: 200 OK
- **Errors**: 404 Not Found, 401 Unauthorized

### Batch Review and Actions

#### GET /api/flashcards/batches/{batch_id}/review
- **Description**: Get flashcards for review in batches of 10
- **Headers**: Authorization: Bearer {token}
- **Query Parameters**:
  - `page`: number (default: 1)
  - `batch_size`: number (default: 10, max: 10)
- **Response**:
```json
{
  "batch_id": "uuid",
  "current_page": 1,
  "total_pages": 3,
  "flashcards": [
    {
      "id": "uuid",
      "front": "question",
      "back": "answer",
      "language": "pl",
      "accepted": null,
      "edited": false
    }
  ],
  "actions_history": [
    {
      "action": "accept" | "reject" | "edit",
      "flashcard_id": "uuid",
      "timestamp": "2024-01-01T00:00:00Z"
    }
  ]
}
```
- **Success**: 200 OK
- **Errors**: 404 Not Found, 401 Unauthorized

#### POST /api/flashcards/batches/{batch_id}/actions
- **Description**: Accept, reject, or edit flashcards in batch
- **Headers**: Authorization: Bearer {token}
- **Request Body**:
```json
{
  "actions": [
    {
      "flashcard_id": "uuid",
      "action": "accept" | "reject" | "edit",
      "data": {
        "front": "edited question", // for edit action
        "back": "edited answer"     // for edit action
      }
    }
  ],
  "bulk_action": "accept_all" | "reject_all" // optional
}
```
- **Response**:
```json
{
  "processed": 10,
  "accepted": 7,
  "rejected": 2,
  "edited": 1,
  "errors": []
}
```
- **Success**: 200 OK
- **Errors**: 400 Bad Request, 404 Not Found, 401 Unauthorized

#### POST /api/flashcards/batches/{batch_id}/undo
- **Description**: Undo last 5 actions in review session
- **Headers**: Authorization: Bearer {token}
- **Request Body**:
```json
{
  "count": 3 // number of actions to undo (max 5)
}
```
- **Response**:
```json
{
  "undone_actions": 3,
  "remaining_actions": 2
}
```
- **Success**: 200 OK
- **Errors**: 400 Bad Request, 404 Not Found, 401 Unauthorized

#### POST /api/flashcards/batches/{batch_id}/save
- **Description**: Save accepted flashcards to a set
- **Headers**: Authorization: Bearer {token}
- **Request Body**:
```json
{
  "set_id": "uuid", // existing set
  "set_name": "New Set Name" // create new set
}
```
- **Response**:
```json
{
  "saved_count": 7,
  "set_id": "uuid",
  "set_name": "Set Name",
  "suggest_session": true
}
```
- **Success**: 201 Created
- **Errors**: 400 Bad Request (limit exceeded), 404 Not Found, 401 Unauthorized

### Sets Management

#### GET /api/sets
- **Description**: List user's flashcard sets with pagination
- **Headers**: Authorization: Bearer {token}
- **Query Parameters**:
  - `page`: number (default: 1)
  - `limit`: number (default: 50, max: 50)
  - `search`: string (search by name)
- **Response**:
```json
{
  "sets": [
    {
      "id": "uuid",
      "name": "Set Name",
      "description": "Set description",
      "flashcard_count": 150,
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 5,
    "total_pages": 1
  }
}
```
- **Success**: 200 OK
- **Errors**: 401 Unauthorized

#### POST /api/sets
- **Description**: Create new flashcard set
- **Headers**: Authorization: Bearer {token}
- **Request Body**:
```json
{
  "name": "Set Name",
  "description": "Set description"
}
```
- **Response**:
```json
{
  "id": "uuid",
  "name": "Set Name",
  "description": "Set description",
  "flashcard_count": 0,
  "created_at": "2024-01-01T00:00:00Z"
}
```
- **Success**: 201 Created
- **Errors**: 400 Bad Request (duplicate name), 401 Unauthorized

#### GET /api/sets/{set_id}
- **Description**: Get specific set details
- **Headers**: Authorization: Bearer {token}
- **Response**:
```json
{
  "id": "uuid",
  "name": "Set Name",
  "description": "Set description",
  "flashcard_count": 150,
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```
- **Success**: 200 OK
- **Errors**: 404 Not Found, 401 Unauthorized

#### PUT /api/sets/{set_id}
- **Description**: Update set details
- **Headers**: Authorization: Bearer {token}
- **Request Body**:
```json
{
  "name": "Updated Name",
  "description": "Updated description"
}
```
- **Response**: Same as GET /api/sets/{set_id}
- **Success**: 200 OK
- **Errors**: 400 Bad Request, 404 Not Found, 401 Unauthorized

#### DELETE /api/sets/{set_id}
- **Description**: Delete set and all flashcards
- **Headers**: Authorization: Bearer {token}
- **Response**: 204 No Content
- **Errors**: 404 Not Found, 401 Unauthorized

### Flashcards Management

#### GET /api/flashcards
- **Description**: List flashcards with filtering and pagination
- **Headers**: Authorization: Bearer {token}
- **Query Parameters**:
  - `set_id`: uuid (filter by set)
  - `page`: number (default: 1)
  - `limit`: number (default: 50, max: 50)
  - `search`: string (search in front/back)
  - `language`: string (filter by language)
- **Response**:
```json
{
  "flashcards": [
    {
      "id": "uuid",
      "set_id": "uuid",
      "front": "question",
      "back": "answer",
      "language": "pl",
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z",
      "version": 1
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 150,
    "total_pages": 3
  }
}
```
- **Success**: 200 OK
- **Errors**: 401 Unauthorized

#### POST /api/flashcards
- **Description**: Create new flashcard manually
- **Headers**: Authorization: Bearer {token}
- **Request Body**:
```json
{
  "set_id": "uuid",
  "front": "question (≤200 chars)",
  "back": "answer (≤500 chars)",
  "language": "pl"
}
```
- **Response**:
```json
{
  "id": "uuid",
  "set_id": "uuid",
  "front": "question",
  "back": "answer",
  "language": "pl",
  "created_at": "2024-01-01T00:00:00Z",
  "version": 1
}
```
- **Success**: 201 Created
- **Errors**: 400 Bad Request (validation, duplicate, limit), 401 Unauthorized

#### GET /api/flashcards/{flashcard_id}
- **Description**: Get specific flashcard
- **Headers**: Authorization: Bearer {token}
- **Response**:
```json
{
  "id": "uuid",
  "set_id": "uuid",
  "front": "question",
  "back": "answer",
  "language": "pl",
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z",
  "version": 1,
  "history": [
    {
      "version": 1,
      "front": "original question",
      "back": "original answer",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```
- **Success**: 200 OK
- **Errors**: 404 Not Found, 401 Unauthorized

#### PUT /api/flashcards/{flashcard_id}
- **Description**: Update flashcard with versioning
- **Headers**: Authorization: Bearer {token}
- **Request Body**:
```json
{
  "front": "updated question (≤200 chars)",
  "back": "updated answer (≤500 chars)"
}
```
- **Response**: Same as GET /api/flashcards/{flashcard_id}
- **Success**: 200 OK
- **Errors**: 400 Bad Request, 404 Not Found, 401 Unauthorized

#### DELETE /api/flashcards/{flashcard_id}
- **Description**: Delete flashcard
- **Headers**: Authorization: Bearer {token}
- **Response**: 204 No Content
- **Errors**: 404 Not Found, 401 Unauthorized

### SRS (Spaced Repetition System)

#### GET /api/srs/sessions/available
- **Description**: Get available flashcards for SRS session
- **Headers**: Authorization: Bearer {token}
- **Query Parameters**:
  - `set_id`: uuid (optional, filter by set)
  - `new_limit`: number (default: 20, max: 20)
  - `review_limit`: number (default: 100, max: 100)
- **Response**:
```json
{
  "new_cards": [
    {
      "id": "uuid",
      "front": "question",
      "back": "answer",
      "language": "pl",
      "set_name": "Set Name"
    }
  ],
  "review_cards": [
    {
      "id": "uuid",
      "front": "question",
      "back": "answer",
      "language": "pl",
      "set_name": "Set Name",
      "due_date": "2024-01-01T00:00:00Z",
      "interval": 1
    }
  ],
  "limits": {
    "new_daily": 20,
    "review_daily": 100,
    "new_remaining": 15,
    "review_remaining": 95
  }
}
```
- **Success**: 200 OK
- **Errors**: 401 Unauthorized

#### POST /api/srs/sessions
- **Description**: Start new SRS learning session
- **Headers**: Authorization: Bearer {token}
- **Request Body**:
```json
{
  "set_id": "uuid", // optional
  "new_limit": 20,
  "review_limit": 100
}
```
- **Response**:
```json
{
  "session_id": "uuid",
  "cards": [
    {
      "id": "uuid",
      "front": "question",
      "back": "answer",
      "language": "pl",
      "type": "new" | "review"
    }
  ],
  "progress": {
    "current": 1,
    "total": 25
  }
}
```
- **Success**: 201 Created
- **Errors**: 400 Bad Request, 401 Unauthorized

#### POST /api/srs/sessions/{session_id}/rate
- **Description**: Rate flashcard performance (1-5 scale)
- **Headers**: Authorization: Bearer {token}
- **Request Body**:
```json
{
  "flashcard_id": "uuid",
  "rating": 1 | 2 | 3 | 4 | 5,
  "response_time_ms": 5000
}
```
- **Response**:
```json
{
  "next_review": "2024-01-02T00:00:00Z",
  "interval": 1,
  "ease_factor": 2.5,
  "session_progress": {
    "completed": 5,
    "remaining": 20
  }
}
```
- **Success**: 200 OK
- **Errors**: 400 Bad Request, 404 Not Found, 401 Unauthorized

#### GET /api/srs/sessions/{session_id}/summary
- **Description**: Get session completion summary
- **Headers**: Authorization: Bearer {token}
- **Response**:
```json
{
  "session_id": "uuid",
  "completed_at": "2024-01-01T00:00:00Z",
  "stats": {
    "total_cards": 25,
    "new_cards": 5,
    "review_cards": 20,
    "average_rating": 3.2,
    "time_spent_minutes": 15
  },
  "next_session_available": "2024-01-01T06:00:00Z"
}
```
- **Success**: 200 OK
- **Errors**: 404 Not Found, 401 Unauthorized

### Analytics

#### POST /api/analytics/events
- **Description**: Track user behavior events
- **Headers**: Authorization: Bearer {token}
- **Request Body**:
```json
{
  "event_type": "paste" | "generate_start" | "generate_success" | "generate_fail" | "accept" | "reject" | "edit_inline" | "save_to_set" | "srs_session_start" | "srs_session_end",
  "event_data": {
    "text_length": 5000,
    "flashcard_count": 30,
    "batch_id": "uuid",
    "set_id": "uuid"
  },
  "session_id": "uuid"
}
```
- **Response**: 201 Created
- **Errors**: 400 Bad Request, 401 Unauthorized

#### GET /api/analytics/dashboard
- **Description**: Get user learning analytics (demo users only)
- **Headers**: Authorization: Bearer {token}
- **Query Parameters**:
  - `period`: "day" | "week" | "month" (default: "week")
- **Response**:
```json
{
  "ai_acceptance_rate": 0.75,
  "ai_usage_percentage": 0.80,
  "generation_performance": {
    "p95_latency_seconds": 8.5,
    "timeout_rate": 0.01
  },
  "learning_activation": 0.65,
  "srs_retention": 0.45,
  "data_quality": {
    "duplicate_rate": 0.01,
    "limit_compliance": 1.0
  }
}
```
- **Success**: 200 OK
- **Errors**: 403 Forbidden (end users), 401 Unauthorized

### Account Management

#### GET /api/account/profile
- **Description**: Get user profile information
- **Headers**: Authorization: Bearer {token}
- **Response**:
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "User Name",
  "type": "demo_user" | "end_user",
  "created_at": "2024-01-01T00:00:00Z",
  "last_login": "2024-01-01T00:00:00Z",
  "limits": {
    "total_flashcards": 1000,
    "flashcards_used": 150,
    "sets_limit": 50,
    "sets_used": 3
  }
}
```
- **Success**: 200 OK
- **Errors**: 401 Unauthorized

#### POST /api/account/export
- **Description**: Export user data (GDPR compliance)
- **Headers**: Authorization: Bearer {token}
- **Response**:
```json
{
  "export_id": "uuid",
  "status": "processing",
  "download_url": null,
  "expires_at": "2024-01-08T00:00:00Z"
}
```
- **Success**: 202 Accepted
- **Errors**: 401 Unauthorized

#### DELETE /api/account
- **Description**: Delete user account and all data
- **Headers**: Authorization: Bearer {token}
- **Request Body**:
```json
{
  "confirmation": "DELETE_MY_ACCOUNT"
}
```
- **Response**: 204 No Content
- **Errors**: 400 Bad Request, 401 Unauthorized

## 3. Authentication and Authorization

### Authentication Mechanism
- **Supabase Auth** with Google OAuth integration
- **JWT tokens** for session management
- **Bearer token** authentication in Authorization header
- **Session persistence** across browser refreshes
- **Automatic token refresh** handled by Supabase client

### Authorization Rules
- **Row Level Security (RLS)** enforced at database level
- **User type separation**: demo_users vs end_users with different permissions
- **Resource ownership**: Users can only access their own data
- **Demo user privileges**: Can view analytics, manage SDK configurations
- **End user privileges**: Can manage flashcards, sets, and SRS sessions

### Security Measures
- **Rate limiting** on all endpoints (configurable per endpoint type)
- **Input validation** with character limits and format checking
- **CORS** restricted to application domain
- **Content Security Policy** headers
- **Request logging** for security monitoring

## 4. Validation and Business Logic

### Input Validation Rules

#### Flashcard Validation
- **Front text**: ≤200 characters, required
- **Back text**: ≤500 characters, required
- **Language**: Must be one of "pl", "en", "es"
- **Duplicate prevention**: Check for similar content in same set
- **Character encoding**: UTF-8 support for all languages

#### Set Validation
- **Name**: Required, unique per user, max 255 characters
- **Description**: Optional, max 1000 characters
- **Flashcard limit**: Max 200 flashcards per set
- **User limit**: Max 1000 flashcards per user account

#### Generation Validation
- **Text input**: 10-15k characters, required
- **Language detection**: Automatic with manual override option
- **Timeout handling**: 30-second timeout with retry mechanism
- **Batch size**: Exactly 30 flashcards per generation

### Business Logic Implementation

#### AI Generation Pipeline
1. **Text preprocessing**: Chunking for large texts, language detection
2. **AI API calls**: Through Supabase Edge Functions with OpenRouter
3. **Deduplication**: Remove duplicates within generated batch
4. **Validation**: Ensure all generated cards meet length requirements
5. **Progress tracking**: Real-time status updates via polling

#### SRS Algorithm (SM-2)
1. **Rating scale**: 1-5 (1=complete failure, 5=perfect recall)
2. **Interval calculation**: Based on ease factor and previous interval
3. **Daily limits**: 20 new cards, 100 review cards per day
4. **Scheduling**: Automatic next review date calculation
5. **Session management**: Track progress and completion

#### Analytics Tracking
1. **Event emission**: All user actions tracked with timestamps
2. **KPI calculation**: AI acceptance rate, usage percentage, performance metrics
3. **Data aggregation**: Daily/weekly/monthly reporting
4. **Privacy compliance**: User data export and deletion capabilities

#### Error Handling
1. **Timeout recovery**: Automatic retry with exponential backoff
2. **Validation errors**: Clear error messages with field-specific feedback
3. **Rate limiting**: Graceful degradation with retry-after headers
4. **Network failures**: Offline capability for review sessions
5. **Data consistency**: Transaction-based operations for critical updates

### Performance Considerations
- **Pagination**: 50 items per page for lists, 10 for batch review
- **Caching**: Recommendation cache with TTL expiration
- **Database indexing**: Optimized for search, filtering, and pagination
- **Response compression**: Gzip compression for large responses
- **CDN integration**: Static assets served from CDN