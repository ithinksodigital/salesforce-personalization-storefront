import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../db/database.types';
import type {
  CatalogDTO,
  CatalogListResponseDTO,
  CreateCatalogCommand,
  UpdateCatalogCommand,
  DeleteCatalogCommand,
  CatalogListQuery,
} from '../../types';

// ============================================================================
// Catalog Service
// ============================================================================

export class CatalogService {
  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * Get paginated list of catalogs for a demo user
   */
  async getCatalogs(
    demoUserId: string,
    query: CatalogListQuery
  ): Promise<CatalogListResponseDTO> {
    const { page, limit, search, sort, order } = query;
    const offset = (page - 1) * limit;

    // Build the query
    let supabaseQuery = this.supabase
      .from('product_catalogs')
      .select('*', { count: 'exact' })
      .eq('demo_user_id', demoUserId)
      .eq('is_active', true);

    // Apply search filter
    if (search) {
      supabaseQuery = supabaseQuery.ilike('name', `%${search}%`);
    }

    // Apply sorting
    supabaseQuery = supabaseQuery.order(sort, { ascending: order === 'asc' });

    // Apply pagination
    supabaseQuery = supabaseQuery.range(offset, offset + limit - 1);

    const { data, error, count } = await supabaseQuery;

    if (error) {
      throw new Error(`Failed to fetch catalogs: ${error.message}`);
    }

    const catalogs: CatalogDTO[] = (data || []).map(this.mapToCatalogDTO);
    const total = count || 0;
    const totalPages = Math.ceil(total / limit);

    return {
      catalogs,
      pagination: {
        page,
        limit,
        total,
        total_pages: totalPages,
      },
    };
  }

  /**
   * Get a specific catalog by ID
   */
  async getCatalogById(
    catalogId: string,
    demoUserId: string
  ): Promise<CatalogDTO> {
    const { data, error } = await this.supabase
      .from('product_catalogs')
      .select('*')
      .eq('id', catalogId)
      .eq('demo_user_id', demoUserId)
      .eq('is_active', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new Error('Catalog not found');
      }
      throw new Error(`Failed to fetch catalog: ${error.message}`);
    }

    return this.mapToCatalogDTO(data);
  }

  /**
   * Create a new catalog
   */
  async createCatalog(command: CreateCatalogCommand): Promise<CatalogDTO> {
    // Check if catalog with same name already exists for this user
    const { data: existingCatalog } = await this.supabase
      .from('product_catalogs')
      .select('id')
      .eq('demo_user_id', command.demo_user_id)
      .eq('name', command.name)
      .eq('is_active', true)
      .single();

    if (existingCatalog) {
      throw new Error('Catalog with this name already exists');
    }

    const { data, error } = await this.supabase
      .from('product_catalogs')
      .insert({
        demo_user_id: command.demo_user_id,
        name: command.name,
        description: command.description || null,
        catalog_data: command.catalog_data,
        is_active: true,
        version: 1,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create catalog: ${error.message}`);
    }

    return this.mapToCatalogDTO(data);
  }

  /**
   * Update an existing catalog
   */
  async updateCatalog(command: UpdateCatalogCommand): Promise<CatalogDTO> {
    // Check if catalog exists and belongs to the user
    const existingCatalog = await this.getCatalogById(
      command.catalog_id,
      command.demo_user_id
    );

    // If name is being updated, check for duplicates
    if (command.name && command.name !== existingCatalog.name) {
      const { data: duplicateCatalog } = await this.supabase
        .from('product_catalogs')
        .select('id')
        .eq('demo_user_id', command.demo_user_id)
        .eq('name', command.name)
        .eq('is_active', true)
        .neq('id', command.catalog_id)
        .single();

      if (duplicateCatalog) {
        throw new Error('Catalog with this name already exists');
      }
    }

    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (command.name !== undefined) {
      updateData.name = command.name;
    }
    if (command.description !== undefined) {
      updateData.description = command.description;
    }
    if (command.catalog_data !== undefined) {
      updateData.catalog_data = command.catalog_data;
      updateData.version = existingCatalog.version + 1;
    }

    const { data, error } = await this.supabase
      .from('product_catalogs')
      .update(updateData)
      .eq('id', command.catalog_id)
      .eq('demo_user_id', command.demo_user_id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update catalog: ${error.message}`);
    }

    return this.mapToCatalogDTO(data);
  }

  /**
   * Delete a catalog (soft delete by setting is_active to false)
   */
  async deleteCatalog(command: DeleteCatalogCommand): Promise<void> {
    // Check if catalog exists and belongs to the user
    await this.getCatalogById(command.catalog_id, command.demo_user_id);

    const { error } = await this.supabase
      .from('product_catalogs')
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', command.catalog_id)
      .eq('demo_user_id', command.demo_user_id);

    if (error) {
      throw new Error(`Failed to delete catalog: ${error.message}`);
    }
  }

  /**
   * Check if demo user exists and is active
   */
  async validateDemoUser(demoUserId: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('demo_users')
      .select('id')
      .eq('id', demoUserId)
      .eq('is_active', true)
      .single();

    if (error || !data) {
      return false;
    }

    return true;
  }

  /**
   * Map database row to CatalogDTO
   */
  private mapToCatalogDTO(row: any): CatalogDTO {
    return {
      id: row.id,
      demo_user_id: row.demo_user_id,
      name: row.name,
      description: row.description,
      catalog_data: row.catalog_data,
      is_active: row.is_active,
      version: row.version,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }
}

// ============================================================================
// Service Factory
// ============================================================================

/**
 * Create a new CatalogService instance
 */
export function createCatalogService(supabase: SupabaseClient<Database>): CatalogService {
  return new CatalogService(supabase);
}
