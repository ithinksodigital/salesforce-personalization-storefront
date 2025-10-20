// ============================================================================
// DTO (Data Transfer Object) Types
// ============================================================================

/**
 * Profile DTO - User profile and metadata
 * Note: Requires 'profiles' table in database
 */
export interface ProfileDTO {
  id: string;
  user_id: string;
  cards_count: number;
  created_at: string;
}

/**
 * Set DTO - Collection of flashcards owned by user
 * Note: Requires 'sets' table in database
 */
export interface SetDTO {
  id: string;
  user_id: string;
  name: string;
  language: 'pl' | 'en' | 'es';
  cards_count: number;
  created_at: string;
  updated_at: string;
}

/**
 * Card DTO - Individual flashcard with SRS data
 * Note: Requires 'cards' table in database
 */
export interface CardDTO {
  id: string;
  set_id: string;
  user_id: string;
  front: string;
  back: string;
  language: 'pl' | 'en' | 'es';
  due_at: string | null;
  interval_days: number;
  ease_factor: number;
  repetitions: number;
  status: 'new' | 'learning' | 'review' | 'relearning';
  generation_id: string | null;
  source_text_excerpt: string | null;
  ai_confidence_score: number | null;
  was_edited_after_generation: boolean;
  original_front: string | null;
  original_back: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Generation DTO - AI generation session metadata
 * Note: Requires 'generations' table in database
 */
export interface GenerationDTO {
  id: string;
  user_id: string;
  status: 'processing' | 'completed' | 'failed';
  model: string;
  source_text: string | null; // Only included in completed status
  source_text_hash: string;
  source_text_length: number;
  generated_count: number | null;
  generation_duration_ms: number | null;
  prompt_tokens: number | null;
  completion_tokens: number | null;
  total_cost_usd: number | null;
  created_at: string;
  completed_at: string | null;
  cards?: Array<{
    front: string;
    back: string;
    source_text_excerpt: string;
    ai_confidence_score: number;
  }>;
}

/**
 * SRS Session DTO - Active spaced repetition study session (ephemeral)
 * Note: This is a temporary session, not stored in database
 */
export interface SRSSessionDTO {
  session_id: string;
  cards: Array<{
    id: string;
    front: string;
    back: string;
    status: 'new' | 'learning' | 'review' | 'relearning';
  }>;
  total_cards: number;
  new_cards: number;
  review_cards: number;
}

/**
 * Due Cards DTO - Cards due for review today
 */
export interface DueCardsDTO {
  new_cards_available: number;
  review_cards_available: number;
  daily_limits: {
    new_cards: number;
    reviews: number;
    new_cards_remaining: number;
    reviews_remaining: number;
  };
  cards: Array<{
    id: string;
    set_id: string;
    front: string;
    back: string;
    status: 'new' | 'learning' | 'review' | 'relearning';
    due_at: string;
  }>;
}

/**
 * Session Summary DTO - Statistics for completed or ongoing session
 */
export interface SessionSummaryDTO {
  session_id: string;
  started_at: string;
  completed_at: string | null;
  total_cards: number;
  cards_reviewed: number;
  average_rating: number;
  ratings_distribution: {
    '1': number;
    '2': number;
    '3': number;
    '4': number;
    '5': number;
  };
  time_spent_seconds: number;
}

// ============================================================================
// Command Models
// ============================================================================

/**
 * Create Set Command - Creates new flashcard set
 */
export interface CreateSetCommand {
  name: string;
  language: 'pl' | 'en' | 'es';
}

/**
 * Update Set Command - Updates set metadata (name only)
 */
export interface UpdateSetCommand {
  name: string;
}

/**
 * Create Card Command - Manually creates a new card in set
 */
export interface CreateCardCommand {
  front: string;
  back: string;
}

/**
 * Batch Create Cards Command - Creates multiple cards from AI generation
 */
export interface BatchCreateCardsCommand {
  generation_id: string;
  cards: Array<{
    front: string;
    back: string;
    source_text_excerpt: string;
    ai_confidence_score: number;
    was_edited: boolean;
    original_front: string | null;
    original_back: string | null;
  }>;
}

/**
 * Update Card Command - Updates card content
 */
export interface UpdateCardCommand {
  front: string;
  back: string;
}

/**
 * Start Generation Command - Initiates AI generation of flashcards
 */
export interface StartGenerationCommand {
  source_text: string;
  language: 'pl' | 'en' | 'es';
  target_count?: number; // Default: 30, range: 1-30
}

/**
 * Start SRS Session Command - Creates new SRS study session
 */
export interface StartSRSSessionCommand {
  set_id: string;
  new_cards_limit: number;
  review_cards_limit: number;
}

/**
 * Submit Card Review Command - Records user rating for a card
 */
export interface SubmitCardReviewCommand {
  card_id: string;
  rating: 1 | 2 | 3 | 4 | 5;
  session_id: string;
}

// ============================================================================
// Response Types
// ============================================================================

/**
 * Paginated Response Wrapper
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

/**
 * Batch Create Response
 */
export interface BatchCreateResponse {
  created: number;
  cards: CardDTO[];
  generation_updated: boolean;
}

/**
 * Card Review Response
 */
export interface CardReviewResponse {
  card_id: string;
  next_review_at: string;
  interval_days: number;
  ease_factor: number;
  repetitions: number;
  status: 'new' | 'learning' | 'review' | 'relearning';
}

// ============================================================================
// Error Response Types
// ============================================================================

/**
 * Standard Error Response
 */
export interface ErrorResponse {
  error: string;
  message: string;
  details?: Record<string, string>;
  code?: string;
  timestamp: string;
}

/**
 * Validation Error Response
 */
export interface ValidationErrorResponse extends ErrorResponse {
  error: 'Validation failed';
  details: Record<string, string>;
}

/**
 * Limit Exceeded Error Response
 */
export interface LimitExceededErrorResponse extends ErrorResponse {
  error: 'Limit exceeded';
  message: string;
  details?: {
    requested: number;
    available_in_set: number;
    available_in_account: number;
  };
}

/**
 * Rate Limit Error Response
 */
export interface RateLimitErrorResponse extends ErrorResponse {
  error: 'Rate limit exceeded';
  message: string;
  retry_after: number;
}

/**
 * Daily Limit Error Response
 */
export interface DailyLimitErrorResponse extends ErrorResponse {
  error: 'Daily limit reached';
  message: string;
  limits: {
    new_cards_today: number;
    new_cards_limit: number;
  };
}

// ============================================================================
// Query Parameters Types
// ============================================================================

/**
 * Pagination Query Parameters
 */
export interface PaginationQuery {
  page?: number; // Default: 1
  limit?: number; // Default: 50, max: 50
}

/**
 * Sets List Query Parameters
 */
export interface SetsListQuery extends PaginationQuery {
  search?: string;
  sort?: 'created_at' | 'updated_at' | 'name'; // Default: 'created_at'
  order?: 'asc' | 'desc'; // Default: 'desc'
}

/**
 * Cards List Query Parameters
 */
export interface CardsListQuery extends PaginationQuery {
  search?: string;
  status?: 'new' | 'learning' | 'review' | 'relearning';
  sort?: 'created_at' | 'due_at'; // Default: 'created_at'
  order?: 'asc' | 'desc'; // Default: 'desc'
}

/**
 * Generations List Query Parameters
 */
export interface GenerationsListQuery extends PaginationQuery {
  status?: 'processing' | 'completed' | 'failed';
}

/**
 * Due Cards Query Parameters
 */
export interface DueCardsQuery {
  set_id?: string;
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Language type for validation
 */
export type Language = 'pl' | 'en' | 'es';

/**
 * Card status type for validation
 */
export type CardStatus = 'new' | 'learning' | 'review' | 'relearning';

/**
 * Generation status type for validation
 */
export type GenerationStatus = 'processing' | 'completed' | 'failed';

/**
 * Rating type for SRS reviews
 */
export type Rating = 1 | 2 | 3 | 4 | 5;

// ============================================================================
// Catalog DTOs (Data Transfer Objects)
// ============================================================================

/**
 * Catalog DTO - Product catalog with metadata
 */
export interface CatalogDTO {
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

/**
 * Catalog List Response DTO
 */
export interface CatalogListResponseDTO {
  catalogs: CatalogDTO[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

// ============================================================================
// Catalog Command Models
// ============================================================================

/**
 * Create Catalog Command
 */
export interface CreateCatalogCommand {
  demo_user_id: string;
  name: string;
  description?: string;
  catalog_data: Record<string, any>;
}

/**
 * Update Catalog Command
 */
export interface UpdateCatalogCommand {
  catalog_id: string;
  demo_user_id: string;
  name?: string;
  description?: string;
  catalog_data?: Record<string, any>;
}

/**
 * Delete Catalog Command
 */
export interface DeleteCatalogCommand {
  catalog_id: string;
  demo_user_id: string;
}

// ============================================================================
// Catalog Request/Response Types
// ============================================================================

/**
 * Create Catalog Request
 */
export interface CreateCatalogRequest {
  name: string;
  description?: string;
  catalog_data: Record<string, any>;
}

/**
 * Update Catalog Request
 */
export interface UpdateCatalogRequest {
  name?: string;
  description?: string;
  catalog_data?: Record<string, any>;
}

/**
 * Catalog List Query Parameters
 */
export interface CatalogListQuery extends PaginationQuery {
  search?: string;
  sort?: 'created_at' | 'updated_at' | 'name';
  order?: 'asc' | 'desc';
}

// ============================================================================
// Database Entity Types (for reference)
// ============================================================================

/**
 * Note: The following types represent the required database entities
 * that would need to be created to support the flashcard application.
 * These are not present in the current database.types.ts file.
 */

/**
 * Profiles table entity (required)
 */
export interface ProfileEntity {
  id: string;
  user_id: string;
  cards_count: number;
  created_at: string;
  updated_at: string;
}

/**
 * Sets table entity (required)
 */
export interface SetEntity {
  id: string;
  user_id: string;
  name: string;
  language: Language;
  created_at: string;
  updated_at: string;
}

/**
 * Cards table entity (required)
 */
export interface CardEntity {
  id: string;
  set_id: string;
  user_id: string;
  front: string;
  back: string;
  front_normalized: string; // For duplicate detection
  language: Language;
  due_at: string | null;
  interval_days: number;
  ease_factor: number;
  repetitions: number;
  status: CardStatus;
  generation_id: string | null;
  source_text_excerpt: string | null;
  ai_confidence_score: number | null;
  was_edited_after_generation: boolean;
  original_front: string | null;
  original_back: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Generations table entity (required)
 */
export interface GenerationEntity {
  id: string;
  user_id: string;
  status: GenerationStatus;
  model: string;
  source_text: string;
  source_text_hash: string;
  source_text_length: number;
  generated_count: number | null;
  accepted_count: number;
  accepted_unedited_count: number;
  accepted_edited_count: number;
  rejected_count: number;
  generation_duration_ms: number | null;
  prompt_tokens: number | null;
  completion_tokens: number | null;
  total_cost_usd: number | null;
  created_at: string;
  completed_at: string | null;
}

/**
 * Generation Error Logs table entity (required)
 */
export interface GenerationErrorLogEntity {
  id: string;
  generation_id: string;
  error_code: 'TIMEOUT' | 'API_ERROR' | 'RATE_LIMIT' | 'INVALID_RESPONSE';
  error_message: string;
  error_details: Record<string, any>;
  retry_count: number;
  created_at: string;
}
