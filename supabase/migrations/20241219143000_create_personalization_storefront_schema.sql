-- =============================================================================
-- Migration: Create Personalization Storefront Database Schema
-- =============================================================================
-- Purpose: Create complete database schema for Salesforce Personalization Storefront
--          with dual user types, product catalog management, SDK configuration,
--          and e-commerce functionality including cart management and analytics
-- 
-- Affected Tables:
--   - demo_users (merchandiser accounts)
--   - end_users (customer accounts) 
--   - sdk_configurations (SDK settings)
--   - product_catalogs (catalog metadata and data)
--   - products (individual product information)
--   - cart_items (shopping cart functionality)
--   - analytics_events (user behavior tracking)
--   - recommendation_cache (performance optimization)
--
-- Security: All tables include Row Level Security (RLS) with granular policies
-- Performance: Strategic indexes for search, filtering, and reporting
-- =============================================================================

-- =============================================================================
-- 1. CREATE TABLES
-- =============================================================================

-- demo_users: stores merchandiser and qa user accounts with upload permissions
create table demo_users (
    id uuid primary key default gen_random_uuid(),
    email varchar(255) unique not null,
    name varchar(255) not null,
    permissions jsonb not null default '{"upload_catalogs": true, "manage_sdk": true, "view_analytics": true}',
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now(),
    last_login timestamp with time zone,
    is_active boolean default true
);

-- end_users: stores end-user accounts for authentication and cart management
create table end_users (
    id uuid primary key default gen_random_uuid(),
    email varchar(255) unique not null,
    name varchar(255),
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now(),
    last_login timestamp with time zone,
    is_active boolean default true
);

-- sdk_configurations: stores sdk configuration settings managed by demo users
create table sdk_configurations (
    id uuid primary key default gen_random_uuid(),
    demo_user_id uuid not null references demo_users(id) on delete cascade,
    name varchar(255) not null,
    sdk_url text not null,
    configuration jsonb not null default '{}',
    is_active boolean default true,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now(),
    unique(demo_user_id, name)
);

-- product_catalogs: stores product catalog metadata and json data
create table product_catalogs (
    id uuid primary key default gen_random_uuid(),
    demo_user_id uuid not null references demo_users(id) on delete cascade,
    name varchar(255) not null,
    description text,
    catalog_data jsonb not null,
    is_active boolean default true,
    version integer default 1,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now(),
    unique(demo_user_id, name)
);

-- products: stores individual product information extracted from catalogs
create table products (
    id uuid primary key default gen_random_uuid(),
    catalog_id uuid not null references product_catalogs(id) on delete cascade,
    external_id varchar(255) not null,
    name varchar(500) not null,
    description text,
    price decimal(10,2) not null,
    currency varchar(3) default 'USD',
    category varchar(255),
    image_url text,
    product_url text,
    metadata jsonb default '{}',
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now(),
    unique(catalog_id, external_id)
);

-- cart_items: stores end-user cart items for fake checkout functionality
create table cart_items (
    id uuid primary key default gen_random_uuid(),
    end_user_id uuid not null references end_users(id) on delete cascade,
    product_id uuid not null references products(id) on delete cascade,
    quantity integer not null default 1 check (quantity > 0),
    added_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now(),
    unique(end_user_id, product_id)
);

-- analytics_events: stores e-commerce analytics events for tracking user behavior
create table analytics_events (
    id uuid primary key default gen_random_uuid(),
    end_user_id uuid references end_users(id) on delete set null,
    session_id varchar(255) not null,
    event_type varchar(50) not null check (event_type in ('view_item', 'add_to_cart', 'purchase', 'identity')),
    event_data jsonb not null default '{}',
    product_id uuid references products(id) on delete set null,
    timestamp timestamp with time zone default now(),
    user_agent text,
    ip_address inet
);

-- recommendation_cache: stores cached recommendation results for performance optimization
create table recommendation_cache (
    id uuid primary key default gen_random_uuid(),
    session_id varchar(255) not null,
    slot_type varchar(50) not null check (slot_type in ('hero', 'grid', 'you_may_also_like')),
    context jsonb not null default '{}',
    recommendations jsonb not null default '[]',
    expires_at timestamp with time zone not null,
    created_at timestamp with time zone default now(),
    unique(session_id, slot_type, context)
);

-- =============================================================================
-- 2. CREATE INDEXES FOR PERFORMANCE
-- =============================================================================

-- products table indexes for search and filtering
create index idx_products_name on products using gin(to_tsvector('english', name));
create index idx_products_price on products(price);
create index idx_products_category on products(category);
create index idx_products_catalog_id on products(catalog_id);

-- analytics events indexes for reporting
create index idx_analytics_events_timestamp on analytics_events(timestamp);
create index idx_analytics_events_type on analytics_events(event_type);
create index idx_analytics_events_user_id on analytics_events(end_user_id);
create index idx_analytics_events_session_id on analytics_events(session_id);

-- cart items indexes for user operations
create index idx_cart_items_user_id on cart_items(end_user_id);
create index idx_cart_items_product_id on cart_items(product_id);

-- sdk configurations indexes
create index idx_sdk_configurations_demo_user on sdk_configurations(demo_user_id);
create index idx_sdk_configurations_active on sdk_configurations(is_active);

-- product catalogs indexes
create index idx_product_catalogs_demo_user on product_catalogs(demo_user_id);
create index idx_product_catalogs_active on product_catalogs(is_active);

-- recommendation cache indexes
create index idx_recommendation_cache_session on recommendation_cache(session_id);
create index idx_recommendation_cache_expires on recommendation_cache(expires_at);

-- =============================================================================
-- 3. ENABLE ROW LEVEL SECURITY (RLS)
-- =============================================================================

-- enable rls on all tables for security
alter table demo_users enable row level security;
alter table end_users enable row level security;
alter table sdk_configurations enable row level security;
alter table product_catalogs enable row level security;
alter table products enable row level security;
alter table cart_items enable row level security;
alter table analytics_events enable row level security;
alter table recommendation_cache enable row level security;

-- =============================================================================
-- 4. CREATE RLS POLICIES
-- =============================================================================

-- demo_users policies
-- demo users can only access their own records
create policy demo_users_own_data_select on demo_users
    for select using (auth.uid()::text = id::text);

create policy demo_users_own_data_insert on demo_users
    for insert with check (auth.uid()::text = id::text);

create policy demo_users_own_data_update on demo_users
    for update using (auth.uid()::text = id::text);

create policy demo_users_own_data_delete on demo_users
    for delete using (auth.uid()::text = id::text);

-- end_users policies
-- end users can only access their own records
create policy end_users_own_data_select on end_users
    for select using (auth.uid()::text = id::text);

create policy end_users_own_data_insert on end_users
    for insert with check (auth.uid()::text = id::text);

create policy end_users_own_data_update on end_users
    for update using (auth.uid()::text = id::text);

create policy end_users_own_data_delete on end_users
    for delete using (auth.uid()::text = id::text);

-- sdk_configurations policies
-- demo users can manage their own sdk configurations
create policy sdk_configurations_own_data_select on sdk_configurations
    for select using (
        demo_user_id in (
            select id from demo_users where auth.uid()::text = id::text
        )
    );

create policy sdk_configurations_own_data_insert on sdk_configurations
    for insert with check (
        demo_user_id in (
            select id from demo_users where auth.uid()::text = id::text
        )
    );

create policy sdk_configurations_own_data_update on sdk_configurations
    for update using (
        demo_user_id in (
            select id from demo_users where auth.uid()::text = id::text
        )
    );

create policy sdk_configurations_own_data_delete on sdk_configurations
    for delete using (
        demo_user_id in (
            select id from demo_users where auth.uid()::text = id::text
        )
    );

-- product_catalogs policies
-- demo users can manage their own catalogs
create policy product_catalogs_own_data_select on product_catalogs
    for select using (
        demo_user_id in (
            select id from demo_users where auth.uid()::text = id::text
        )
    );

create policy product_catalogs_own_data_insert on product_catalogs
    for insert with check (
        demo_user_id in (
            select id from demo_users where auth.uid()::text = id::text
        )
    );

create policy product_catalogs_own_data_update on product_catalogs
    for update using (
        demo_user_id in (
            select id from demo_users where auth.uid()::text = id::text
        )
    );

create policy product_catalogs_own_data_delete on product_catalogs
    for delete using (
        demo_user_id in (
            select id from demo_users where auth.uid()::text = id::text
        )
    );

-- end users can read active catalogs (public access for browsing)
create policy product_catalogs_read_active_select on product_catalogs
    for select using (is_active = true);

-- products policies
-- demo users can manage products in their catalogs
create policy products_own_catalogs_select on products
    for select using (
        catalog_id in (
            select id from product_catalogs 
            where demo_user_id in (
                select id from demo_users where auth.uid()::text = id::text
            )
        )
    );

create policy products_own_catalogs_insert on products
    for insert with check (
        catalog_id in (
            select id from product_catalogs 
            where demo_user_id in (
                select id from demo_users where auth.uid()::text = id::text
            )
        )
    );

create policy products_own_catalogs_update on products
    for update using (
        catalog_id in (
            select id from product_catalogs 
            where demo_user_id in (
                select id from demo_users where auth.uid()::text = id::text
            )
        )
    );

create policy products_own_catalogs_delete on products
    for delete using (
        catalog_id in (
            select id from product_catalogs 
            where demo_user_id in (
                select id from demo_users where auth.uid()::text = id::text
            )
        )
    );

-- end users can read products from active catalogs (public access for browsing)
create policy products_read_active_select on products
    for select using (
        catalog_id in (
            select id from product_catalogs where is_active = true
        )
    );

-- cart_items policies
-- end users can manage their own cart items
create policy cart_items_own_data_select on cart_items
    for select using (
        end_user_id in (
            select id from end_users where auth.uid()::text = id::text
        )
    );

create policy cart_items_own_data_insert on cart_items
    for insert with check (
        end_user_id in (
            select id from end_users where auth.uid()::text = id::text
        )
    );

create policy cart_items_own_data_update on cart_items
    for update using (
        end_user_id in (
            select id from end_users where auth.uid()::text = id::text
        )
    );

create policy cart_items_own_data_delete on cart_items
    for delete using (
        end_user_id in (
            select id from end_users where auth.uid()::text = id::text
        )
    );

-- analytics_events policies
-- end users can create their own analytics events
create policy analytics_events_own_data_insert on analytics_events
    for insert with check (
        end_user_id in (
            select id from end_users where auth.uid()::text = id::text
        )
    );

-- demo users can read analytics for their products
create policy analytics_events_demo_read_select on analytics_events
    for select using (
        product_id in (
            select p.id from products p
            join product_catalogs pc on p.catalog_id = pc.id
            where pc.demo_user_id in (
                select id from demo_users where auth.uid()::text = id::text
            )
        )
    );

-- anonymous users can insert analytics events (for tracking without authentication)
create policy analytics_events_anonymous_insert on analytics_events
    for insert with check (true);

-- recommendation_cache policies
-- anyone can read/write recommendation cache (public data for performance)
create policy recommendation_cache_public_select on recommendation_cache
    for select using (true);

create policy recommendation_cache_public_insert on recommendation_cache
    for insert with check (true);

create policy recommendation_cache_public_update on recommendation_cache
    for update using (true);

create policy recommendation_cache_public_delete on recommendation_cache
    for delete using (true);

-- =============================================================================
-- 5. CREATE TRIGGERS FOR UPDATED_AT TIMESTAMPS
-- =============================================================================

-- function to update updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

-- create triggers for all tables with updated_at columns
create trigger update_demo_users_updated_at before update on demo_users
    for each row execute function update_updated_at_column();

create trigger update_end_users_updated_at before update on end_users
    for each row execute function update_updated_at_column();

create trigger update_sdk_configurations_updated_at before update on sdk_configurations
    for each row execute function update_updated_at_column();

create trigger update_product_catalogs_updated_at before update on product_catalogs
    for each row execute function update_updated_at_column();

create trigger update_products_updated_at before update on products
    for each row execute function update_updated_at_column();

create trigger update_cart_items_updated_at before update on cart_items
    for each row execute function update_updated_at_column();

-- =============================================================================
-- 6. CREATE CLEANUP FUNCTION FOR EXPIRED RECOMMENDATION CACHE
-- =============================================================================

-- function to clean up expired recommendation cache entries
create or replace function cleanup_expired_recommendation_cache()
returns void as $$
begin
    delete from recommendation_cache where expires_at < now();
end;
$$ language plpgsql;

-- =============================================================================
-- MIGRATION COMPLETE
-- =============================================================================
-- This migration creates a complete database schema for the Salesforce 
-- Personalization Storefront with:
-- - 8 tables with proper relationships and constraints
-- - 15 performance indexes for optimal query performance
-- - Comprehensive Row Level Security policies for data isolation
-- - Automatic timestamp updates via triggers
-- - Cleanup function for cache management
-- 
-- The schema supports dual user types (demo users/merchandisers and end users),
-- product catalog management, SDK configuration, e-commerce functionality,
-- and analytics tracking while maintaining security and performance.
-- =============================================================================
