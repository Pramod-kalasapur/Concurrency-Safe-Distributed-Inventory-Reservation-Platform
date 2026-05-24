# Deployment Guide

## Production Deployment Checklist

### Prerequisites
- [ ] GitHub repository created and code pushed
- [ ] Vercel account configured
- [ ] PostgreSQL database set up (Neon or Supabase)
- [ ] Environment variables prepared

### Step 1: Database Setup

#### Option A: Neon (Recommended)
1. Go to [https://neon.tech/](https://neon.tech/)
2. Create project (e.g., "allo-inventory")
3. Copy connection string: `postgresql://user:password@host/dbname`
4. Keep this secret

#### Option B: Supabase
1. Go to [https://supabase.com/](https://supabase.com/)
2. Create project
3. Go to Settings > Database > Connection pooling
4. Copy connection string

### Step 2: Deploy to Vercel

```bash
# 1. Push code to GitHub
git add .
git commit -m "feat: initial commit"
git push origin main

# 2. Import project in Vercel
# https://vercel.com/new
# Select GitHub repository

# 3. Configure environment variables
# In Vercel dashboard → Settings → Environment Variables:
# - DATABASE_URL: (paste PostgreSQL connection string)
```

### Step 3: Run Database Migrations

```bash
# Option A: Using Vercel CLI
vercel env pull .env.production.local
npm run prisma:migrate

# Option B: Manual
# 1. In Vercel dashboard, go to: Settings → Environment Variables
# 2. Add DATABASE_URL
# 3. Deploy with Vercel CLI:
vercel --prod

# 4. After deployment, seed data:
npm run seed
```

### Step 4: Configure Cron Job

The `vercel.json` file already contains cron configuration:
```json
{
  "crons": [{
    "path": "/api/internal/release-expired",
    "schedule": "* * * * *"
  }]
}
```

This will:
- Run every minute (minute granularity)
- Hit `/api/internal/release-expired` endpoint
- Release expired PENDING reservations

### Step 5: Verify Deployment

```bash
# Health check
curl https://your-app.vercel.app/api/health

# Should return:
# {"status":"ok"}

# Test API
curl https://your-app.vercel.app/api/warehouses

# Open in browser
https://your-app.vercel.app
```

## Local Development Setup

### Option A: Local PostgreSQL

```bash
# 1. Install PostgreSQL locally
# macOS: brew install postgresql
# Windows: https://www.postgresql.org/download/windows/

# 2. Create database
psql -U postgres
CREATE DATABASE allo;
\q

# 3. Set DATABASE_URL
export DATABASE_URL="postgresql://postgres:password@localhost:5432/allo"

# 4. Run migrations
npm run prisma:migrate

# 5. Seed data
npm run seed

# 6. Start dev server
npm run dev
```

### Option B: Neon (Cloud Development)

```bash
# 1. Create Neon database
# Go to https://neon.tech/

# 2. Get connection string
# Copy from Neon dashboard

# 3. Set .env
echo 'DATABASE_URL="postgresql://..."' > .env

# 4. Run migrations
npm run prisma:migrate

# 5. Seed data
npm run seed

# 6. Start dev server
npm run dev
```

## Testing & Validation

### Run Concurrency Test
```bash
npm run test:concurrency
```

Expected output:
```
✓ Successes: 5 (expected ~5)
✓ Conflicts (409): 45 (expected ~45)
✓ Other errors: 0 (expected 0)
✅ PASS: Concurrency test passed!
```

### Manual Testing Flow
1. Open http://localhost:3000
2. Browse products and warehouses
3. Click "Reserve" on a product
4. Enter quantity
5. Should redirect to reservation status page
6. See countdown timer
7. Click "Confirm Purchase" to complete
8. Verify stock decremented on home page

## Monitoring & Debugging

### View Application Logs
```bash
# Vercel logs
vercel logs

# Or in Vercel dashboard: Deployments → Logs
```

### Query Database Directly
```bash
# Connect to database
psql $DATABASE_URL

# View reservations
SELECT id, status, "expiresAt", quantity FROM "Reservation" ORDER BY "createdAt" DESC;

# View audit log
SELECT "reservationId", action, "createdAt" FROM "AuditLog" ORDER BY "createdAt" DESC;

# View inventory
SELECT p.name, w.name, i."totalStock", i."reservedStock" 
FROM "Inventory" i
JOIN "Product" p ON i."productId" = p.id
JOIN "Warehouse" w ON i."warehouseId" = w.id;
```

## Troubleshooting

### Issue: Cron job not running
**Solution:**
- Verify `vercel.json` includes crons configuration
- Check Vercel dashboard → Settings → Crons
- Manually test: `curl https://your-app.vercel.app/api/internal/release-expired`

### Issue: "Insufficient stock" error when stock exists
**Solution:**
- Check if lazy cleanup ran: `SELECT status FROM "Reservation" WHERE status = 'PENDING' AND "expiresAt" < NOW();`
- If none found, manually trigger: `curl -X POST https://your-app.vercel.app/api/internal/release-expired`

### Issue: Database connection timeout
**Solution:**
- Verify DATABASE_URL is correct in `.env`
- Check PostgreSQL connection pooling limits
- For Neon: use pooled connection string from Settings > Database > Connection pooling

## Rollback Procedure

```bash
# If deployment fails:
vercel rollback

# Or deploy previous version:
git checkout HEAD~1
vercel --prod
```

## Performance Optimization

### For Higher Throughput
1. Enable read replicas in PostgreSQL
2. Add caching layer (Redis) for GET endpoints
3. Implement request batching for CLI operations

### Database Indexes
Indexes are automatically created for:
- `productId, warehouseId` (unique compound index on Inventory)
- `Reservation.expiresAt` (for expiry cleanup queries)
- `AuditLog.createdAt` (for audit trail queries)

## Scaling Beyond Prototype

1. **Horizontal Inventory Sharding**
   - Partition by warehouse
   - Deploy separate API instance per shard

2. **Event Sourcing**
   - Immutable event log
   - Replay for state reconstruction

3. **Queue System**
   - Single writer architecture
   - Reduced contention on inventory updates

---

**Deployment complete! Monitor via Vercel dashboard.**
