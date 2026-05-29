# Database Migrations

This directory contains database migration scripts for the Loan Origination System.

## Overview

The migration system supports:
- **SQL migrations** (`.sql` files) for schema changes
- **JavaScript migrations** (`.js` files) for data migrations and complex operations
- **Automatic tracking** of applied migrations
- **Rollback support** for JavaScript migrations

## Migration Files

### 001_initial_schema.sql
Creates the complete database schema including:
- Users table with role-based access
- Applications table with JSONB fields
- Documents table with S3 references
- Agent reviews, analyses, decisions tables
- Audit logs (partitioned by timestamp)
- Policy configuration table
- Indexes, constraints, and triggers

### migrate_json_to_postgres.js
Migrates existing data from JSON files to PostgreSQL:
- Reads from `backend/data/*.json` files
- Inserts into PostgreSQL tables
- Handles relationships and foreign keys
- Provides rollback capability
- Logs migration progress

### run_migration.js
Migration runner that:
- Executes migrations in order
- Tracks applied migrations
- Supports rollback
- Provides migration status

## Usage

### Install Dependencies

```bash
cd backend
npm install
```

### Configure Database

Update your `.env` file with database credentials:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=los_production
DB_USER=postgres
DB_PASSWORD=your_password
```

### Run Migrations

```bash
# Run all pending migrations
node migrations/run_migration.js

# Check migration status
node migrations/run_migration.js --status

# Rollback last migration
node migrations/run_migration.js --rollback

# Force run a specific migration
node migrations/run_migration.js --force 001_initial_schema.sql
```

### Migrate Data from JSON

```bash
# Migrate all data from JSON files to PostgreSQL
node migrations/migrate_json_to_postgres.js

# Rollback data migration
node migrations/migrate_json_to_postgres.js --rollback
```

## Migration Workflow

### Step 1: Setup PostgreSQL Database

```bash
# Create database
createdb los_production

# Or using psql
psql -U postgres
CREATE DATABASE los_production;
\q
```

### Step 2: Run Schema Migration

```bash
node migrations/run_migration.js
```

This will:
- Create all tables
- Set up indexes and constraints
- Create triggers and functions
- Initialize the schema_migrations table

### Step 3: Migrate Existing Data

```bash
node migrations/migrate_json_to_postgres.js
```

This will:
- Read data from JSON files
- Insert into PostgreSQL tables
- Maintain relationships
- Log progress and errors

### Step 4: Verify Migration

```bash
# Check migration status
node migrations/run_migration.js --status

# Connect to database and verify
psql -U postgres -d los_production
\dt  # List tables
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM applications;
\q
```

### Step 5: Enable Database Mode

Update your `.env` file:

```env
USE_DATABASE=true
```

Restart the application:

```bash
npm start
```

## Creating New Migrations

### SQL Migration

Create a new file with naming convention: `XXX_description.sql`

```sql
-- 002_add_user_preferences.sql

ALTER TABLE users ADD COLUMN preferences JSONB DEFAULT '{}';

CREATE INDEX idx_users_preferences ON users USING GIN (preferences);

-- Record migration
INSERT INTO schema_migrations (migration_name, checksum) 
VALUES ('002_add_user_preferences.sql', md5('002_add_user_preferences.sql'));
```

### JavaScript Migration

Create a new file with naming convention: `XXX_description.js`

```javascript
// 003_update_application_status.js

const { query } = require('../src/services/database/pool');

async function runMigration() {
  console.log('Updating application statuses...');
  
  await query(`
    UPDATE applications 
    SET status = 'In Progress' 
    WHERE status = 'Pending'
  `);
  
  console.log('Migration completed');
}

async function rollbackMigration() {
  console.log('Rolling back application status changes...');
  
  await query(`
    UPDATE applications 
    SET status = 'Pending' 
    WHERE status = 'In Progress'
  `);
  
  console.log('Rollback completed');
}

module.exports = { runMigration, rollbackMigration };
```

## Best Practices

1. **Always backup** before running migrations in production
2. **Test migrations** in development environment first
3. **Use transactions** for data migrations
4. **Include rollback** logic for JavaScript migrations
5. **Document changes** in migration files
6. **Version control** all migration files
7. **Never modify** applied migrations
8. **Create new migrations** for schema changes

## Troubleshooting

### Migration Fails

```bash
# Check error logs
node migrations/run_migration.js

# Rollback if needed
node migrations/run_migration.js --rollback

# Fix the issue and try again
```

### Data Migration Issues

```bash
# Check which records failed
# Errors are logged in the migration output

# Rollback data migration
node migrations/migrate_json_to_postgres.js --rollback

# Fix data issues in JSON files
# Run migration again
```

### Connection Issues

```bash
# Test database connection
psql -U postgres -d los_production

# Check environment variables
echo $DB_HOST
echo $DB_PORT
echo $DB_NAME
```

## Migration Tracking

Migrations are tracked in the `schema_migrations` table:

```sql
SELECT * FROM schema_migrations ORDER BY applied_at DESC;
```

## Rollback Strategy

### SQL Migrations
- Create a separate rollback migration file
- Example: `002_rollback_user_preferences.sql`

### JavaScript Migrations
- Include `rollbackMigration()` function
- Use `--rollback` flag to execute

## Production Deployment

1. **Backup database**
   ```bash
   pg_dump -U postgres los_production > backup_$(date +%Y%m%d).sql
   ```

2. **Run migrations**
   ```bash
   node migrations/run_migration.js
   ```

3. **Verify**
   ```bash
   node migrations/run_migration.js --status
   ```

4. **Enable database mode**
   ```bash
   export USE_DATABASE=true
   npm start
   ```

5. **Monitor logs** for any issues

## Support

For issues or questions:
- Check the main project README
- Review the AWS deployment architecture document
- Contact the development team