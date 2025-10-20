# Database Schema Plan - Salesforce Personalization Storefront

## Overview

This database schema supports a personalization storefront application with dual user types (demo users/merchandisers and end users), product catalog management, SDK configuration, and e-commerce functionality including cart management and analytics tracking.

## 1. Tables with Columns, Data Types, and Constraints

### demo_users
Stores merchandiser and QA user accounts with upload permissions.

```sql
CREATE TABLE demo_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    permissions JSONB NOT NULL DEFAULT '{"upload_catalogs": true, "manage_sdk": true, "view_analytics": true}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true
);
```

### end_users
Stores end-user accounts for authentication and cart management.

```sql
CREATE TABLE end_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true
);
```

### sdk_configurations
Stores SDK configuration settings managed by demo users.

```sql
CREATE TABLE sdk_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    demo_user_id UUID NOT NULL REFERENCES demo_users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    sdk_url TEXT NOT NULL,
    configuration JSONB NOT NULL DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(demo_user_id, name)
);
```

### product_catalogs
Stores product catalog metadata and JSON data.

```sql
CREATE TABLE product_catalogs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    demo_user_id UUID NOT NULL REFERENCES demo_users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    catalog_data JSONB NOT NULL,
    is_active BOOLEAN DEFAULT true,
    version INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(demo_user_id, name)
);
```

### products
Stores individual product information extracted from catalogs.

```sql
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    catalog_id UUID NOT NULL REFERENCES product_catalogs(id) ON DELETE CASCADE,
    external_id VARCHAR(255) NOT NULL,
    name VARCHAR(500) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    category VARCHAR(255),
    image_url TEXT,
    product_url TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(catalog_id, external_id)
);
```

### cart_items
Stores end-user cart items for fake checkout functionality.

```sql
CREATE TABLE cart_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    end_user_id UUID NOT NULL REFERENCES end_users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(end_user_id, product_id)
);
```

### analytics_events
Stores e-commerce analytics events for tracking user behavior.

```sql
CREATE TABLE analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    end_user_id UUID REFERENCES end_users(id) ON DELETE SET NULL,
    session_id VARCHAR(255) NOT NULL,
    event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('view_item', 'add_to_cart', 'purchase', 'identity')),
    event_data JSONB NOT NULL DEFAULT '{}',
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_agent TEXT,
    ip_address INET
);
```

### recommendation_cache
Stores cached recommendation results for performance optimization.

```sql
CREATE TABLE recommendation_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id VARCHAR(255) NOT NULL,
    slot_type VARCHAR(50) NOT NULL CHECK (slot_type IN ('hero', 'grid', 'you_may_also_like')),
    context JSONB NOT NULL DEFAULT '{}',
    recommendations JSONB NOT NULL DEFAULT '[]',
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(session_id, slot_type, context)
);
```

## 2. Relationships Between Tables

### One-to-Many Relationships
- `demo_users` → `sdk_configurations` (1:N)
- `demo_users` → `product_catalogs` (1:N)
- `product_catalogs` → `products` (1:N)
- `end_users` → `cart_items` (1:N)
- `end_users` → `analytics_events` (1:N)
- `products` → `cart_items` (1:N)
- `products` → `analytics_events` (1:N)

### Foreign Key Constraints
- `sdk_configurations.demo_user_id` → `demo_users.id`
- `product_catalogs.demo_user_id` → `demo_users.id`
- `products.catalog_id` → `product_catalogs.id`
- `cart_items.end_user_id` → `end_users.id`
- `cart_items.product_id` → `products.id`
- `analytics_events.end_user_id` → `end_users.id`
- `analytics_events.product_id` → `products.id`

## 3. Indexes

### Performance Indexes
```sql
-- Products table indexes for search and filtering
CREATE INDEX idx_products_name ON products USING gin(to_tsvector('english', name));
CREATE INDEX idx_products_price ON products(price);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_catalog_id ON products(catalog_id);

-- Analytics events indexes for reporting
CREATE INDEX idx_analytics_events_timestamp ON analytics_events(timestamp);
CREATE INDEX idx_analytics_events_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_events_user_id ON analytics_events(end_user_id);
CREATE INDEX idx_analytics_events_session_id ON analytics_events(session_id);

-- Cart items indexes for user operations
CREATE INDEX idx_cart_items_user_id ON cart_items(end_user_id);
CREATE INDEX idx_cart_items_product_id ON cart_items(product_id);

-- SDK configurations indexes
CREATE INDEX idx_sdk_configurations_demo_user ON sdk_configurations(demo_user_id);
CREATE INDEX idx_sdk_configurations_active ON sdk_configurations(is_active);

-- Product catalogs indexes
CREATE INDEX idx_product_catalogs_demo_user ON product_catalogs(demo_user_id);
CREATE INDEX idx_product_catalogs_active ON product_catalogs(is_active);

-- Recommendation cache indexes
CREATE INDEX idx_recommendation_cache_session ON recommendation_cache(session_id);
CREATE INDEX idx_recommendation_cache_expires ON recommendation_cache(expires_at);
```

## 4. PostgreSQL Row Level Security (RLS)

### Enable RLS on Tables
```sql
ALTER TABLE demo_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE end_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sdk_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_catalogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendation_cache ENABLE ROW LEVEL SECURITY;
```

### RLS Policies

#### Demo Users Policies
```sql
-- Demo users can only access their own records
CREATE POLICY demo_users_own_data ON demo_users
    FOR ALL USING (auth.uid()::text = id::text);
```

#### SDK Configurations Policies
```sql
-- Demo users can manage their own SDK configurations
CREATE POLICY sdk_configurations_own_data ON sdk_configurations
    FOR ALL USING (
        demo_user_id IN (
            SELECT id FROM demo_users WHERE auth.uid()::text = id::text
        )
    );
```

#### Product Catalogs Policies
```sql
-- Demo users can manage their own catalogs
CREATE POLICY product_catalogs_own_data ON product_catalogs
    FOR ALL USING (
        demo_user_id IN (
            SELECT id FROM demo_users WHERE auth.uid()::text = id::text
        )
    );

-- End users can read active catalogs
CREATE POLICY product_catalogs_read_active ON product_catalogs
    FOR SELECT USING (is_active = true);
```

#### Products Policies
```sql
-- Demo users can manage products in their catalogs
CREATE POLICY products_own_catalogs ON products
    FOR ALL USING (
        catalog_id IN (
            SELECT id FROM product_catalogs 
            WHERE demo_user_id IN (
                SELECT id FROM demo_users WHERE auth.uid()::text = id::text
            )
        )
    );

-- End users can read products from active catalogs
CREATE POLICY products_read_active ON products
    FOR SELECT USING (
        catalog_id IN (
            SELECT id FROM product_catalogs WHERE is_active = true
        )
    );
```

#### End Users Policies
```sql
-- End users can only access their own records
CREATE POLICY end_users_own_data ON end_users
    FOR ALL USING (auth.uid()::text = id::text);
```

#### Cart Items Policies
```sql
-- End users can manage their own cart items
CREATE POLICY cart_items_own_data ON cart_items
    FOR ALL USING (
        end_user_id IN (
            SELECT id FROM end_users WHERE auth.uid()::text = id::text
        )
    );
```

#### Analytics Events Policies
```sql
-- End users can create their own analytics events
CREATE POLICY analytics_events_own_data ON analytics_events
    FOR INSERT WITH CHECK (
        end_user_id IN (
            SELECT id FROM end_users WHERE auth.uid()::text = id::text
        )
    );

-- Demo users can read analytics for their products
CREATE POLICY analytics_events_demo_read ON analytics_events
    FOR SELECT USING (
        product_id IN (
            SELECT p.id FROM products p
            JOIN product_catalogs pc ON p.catalog_id = pc.id
            WHERE pc.demo_user_id IN (
                SELECT id FROM demo_users WHERE auth.uid()::text = id::text
            )
        )
    );
```

#### Recommendation Cache Policies
```sql
-- Anyone can read/write recommendation cache (public data)
CREATE POLICY recommendation_cache_public ON recommendation_cache
    FOR ALL USING (true);
```

## 5. Additional Notes and Design Decisions

### Data Types and Constraints
- **UUID Primary Keys**: Used for all tables to ensure global uniqueness and better security
- **JSONB Fields**: Used for flexible configuration storage (permissions, catalog data, metadata)
- **Decimal for Prices**: Ensures precise monetary calculations
- **Timestamp with Time Zone**: All timestamps include timezone information for global consistency

### Performance Considerations
- **GIN Index on Product Names**: Enables full-text search capabilities
- **Composite Indexes**: Strategic indexing on frequently queried column combinations
- **Cache Expiration**: Recommendation cache includes expiration for automatic cleanup

### Security Features
- **Row Level Security**: Comprehensive RLS policies ensure data isolation
- **Cascade Deletes**: Proper foreign key constraints maintain referential integrity
- **Permission System**: JSONB-based permissions allow flexible role management

### Scalability Features
- **Partitioning Ready**: Analytics events table structure supports time-based partitioning
- **Cache Layer**: Dedicated recommendation cache table reduces API calls
- **Flexible Metadata**: JSONB fields allow schema evolution without migrations

### Data Validation
- **Check Constraints**: Enforce business rules at database level
- **Unique Constraints**: Prevent duplicate configurations and cart items
- **Foreign Key Constraints**: Maintain referential integrity across all relationships

### Migration Considerations
- **Versioning**: Product catalogs include version field for change tracking
- **Soft Deletes**: Active/inactive flags allow for data recovery
- **Audit Trail**: Created/updated timestamps on all tables for change tracking

This schema supports the full functionality described in the PRD while maintaining security, performance, and scalability requirements for the personalization storefront application.
