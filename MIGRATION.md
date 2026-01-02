# PostgreSQL Migration Guide

This document outlines the migration from SQLite3 to PostgreSQL for Railway deployment.

## What Changed

### Database Layer
- **Replaced**: `sqlite3` → `pg` (PostgreSQL client)
- **Fixed**: Critical connection bug in `utils/dao.js` where connections were being closed prematurely
- **Implemented**: Connection pooling with singleton pattern for better performance
- **Updated**: SQL syntax from SQLite to PostgreSQL (AUTOINCREMENT → SERIAL, ? → $1, $2)

### Configuration
- **Environment Variables**: Moved from `config.json` to `.env` file
- **Node Version**: Updated from 12.18.2 → 22.12.0 (LTS)
- **Dependencies**: Added `pg` and `dotenv`, removed `sqlite3`

### Files Modified
- `package.json` - Updated dependencies and scripts
- `.nvmrc` - Node 22.12.0
- `utils/dao.js` - Complete rewrite for PostgreSQL
- `utils/genre_repository.js` - PostgreSQL SQL syntax
- `utils/database_utils.js` - DATABASE_URL configuration
- `app.js` - Environment variable loading
- `.gitignore` - Added .env and migration files

### Files Created
- `.env.example` - Environment variable template
- `.env` - Local development configuration
- `utils/init_database.js` - Database schema initialization
- `migration/import_to_postgres.js` - Data migration script
- `migration/genres_export.json` - Exported SQLite data (7,283 genres)
- `railway.json` - Railway deployment configuration
- `Procfile` - Process definition

## Local Development Setup

### Prerequisites
1. **Install PostgreSQL**:
   ```bash
   # macOS
   brew install postgresql@16
   brew services start postgresql@16
   ```

2. **Create Database**:
   ```bash
   createdb music_genre_ator_dev
   ```

3. **Install Node 22**:
   ```bash
   nvm install 22
   nvm use 22
   ```

### Installation Steps

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Create Database Schema**:
   ```bash
   npm run init-db
   ```

3. **Import Existing Genres** (7,283 records):
   ```bash
   npm run migrate-data
   ```

4. **Start Development Server**:
   ```bash
   npm run dev-start
   ```

5. **Test the Application**:
   - Visit: http://localhost:3000
   - Generate new genres
   - Test existing genre: http://localhost:3000/stoner-bossa-nova

## Environment Variables

Copy `.env.example` to `.env` and update values as needed.

### Required Variables

```bash
# Database
DATABASE_URL=postgresql://localhost:5432/music_genre_ator_dev

# Application
NODE_ENV=development
PORT=3000
SITE_URL=http://localhost:3000

# Screenshot Service (AWS)
SCREENSHOT_URL=https://yio5au6gu5.execute-api.eu-west-2.amazonaws.com/dev/render
SAVE_S3_BUCKET=web-rendering-dev-serverlessdeploymentbucket-15yp72863tg3o
SAVE_S3_REGION=eu-west-2
SCREENSHOT_WIDTH=1200
SCREENSHOT_HEIGHT=630
SCREENSHOT_FORMAT=png
```

## Railway Deployment (When Ready)

### 1. Create Railway Project
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Create new project or link existing
railway init
```

### 2. Add PostgreSQL Database
- In Railway dashboard: Add PostgreSQL plugin
- Railway automatically creates `DATABASE_URL` environment variable

### 3. Configure Environment Variables
In Railway dashboard, add these variables:
- `NODE_ENV=production`
- `SITE_URL=https://your-app.railway.app` (or your custom domain)
- `SCREENSHOT_URL=...`
- `SAVE_S3_BUCKET=...`
- `SAVE_S3_REGION=eu-west-2`
- `SCREENSHOT_WIDTH=1200`
- `SCREENSHOT_HEIGHT=630`
- `SCREENSHOT_FORMAT=png`

### 4. Deploy Application
```bash
# Push to Railway
railway up

# Or connect to GitHub and deploy automatically
```

### 5. Initialize Database Schema
```bash
railway run npm run init-db
```

### 6. Import Genre Data
```bash
railway run npm run migrate-data
```

### 7. Verify Deployment
```bash
# Check logs
railway logs

# Test the application
curl https://your-app.railway.app/

# Verify database count
railway run psql -c "SELECT COUNT(*) FROM genres;"
```

## Key PostgreSQL Differences

| Feature | SQLite | PostgreSQL |
|---------|--------|------------|
| Auto-increment | `INTEGER PRIMARY KEY AUTOINCREMENT` | `SERIAL PRIMARY KEY` |
| Parameters | `?` placeholders | `$1, $2, $3` |
| Get inserted ID | `this.lastID` | `RETURNING id` in query |
| Connection | File-based | Network connection string |
| Pooling | Not needed | Required for performance |

## Database Schema

```sql
CREATE TABLE IF NOT EXISTS genres (
  id SERIAL PRIMARY KEY,
  slug TEXT UNIQUE,
  genre TEXT
);
```

## Troubleshooting

### Connection Issues
- Ensure PostgreSQL is running: `brew services list`
- Check DATABASE_URL format: `postgresql://user:password@host:port/database`
- For Railway: SSL must be enabled in production

### Import Fails
- Verify `migration/genres_export.json` exists
- Check PostgreSQL schema was created: `npm run init-db`
- Ensure DATABASE_URL is set correctly

### App Won't Start
- Check all environment variables are set in `.env`
- Verify Node version: `node --version` (should be 22.x)
- Check logs for specific errors

## Migration Verification

After migration, verify:
1. ✅ Genre count matches: `SELECT COUNT(*) FROM genres;` (should be 7,283)
2. ✅ Sample genres exist: http://localhost:3000/stoner-bossa-nova
3. ✅ New genres can be created
4. ✅ Screenshot functionality works
5. ✅ No database connection errors in logs

## Rollback Plan

If needed to rollback to SQLite:
1. Original SQLite database preserved at `data/database.sqlite3`
2. Revert git changes: `git checkout HEAD~1`
3. Run: `npm install` to restore sqlite3 dependency

## Next Steps

1. ✅ Complete local testing
2. Test on Railway staging environment
3. Update DNS to point to Railway
4. Monitor performance and logs
5. Consider additional improvements from code analysis

## Additional Code Improvements (Optional)

The codebase analysis identified several improvement opportunities:
- Migrate `var` to `const/let` (minimal changes made)
- Add error handling middleware
- Implement security headers (helmet.js)
- Add input validation
- Set up structured logging
- Add unit tests

These can be addressed in future updates after successful migration.
