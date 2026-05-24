# Quick Setup Checklist

## ✅ Pre-flight Checks

- [ ] Node.js 18+ installed: `node --version`
- [ ] npm installed: `npm --version`
- [ ] PostgreSQL database ready (Neon/Supabase or local)
- [ ] Git repository initialized

## 🚀 Local Development (5 minutes)

```bash
# 1. Install dependencies
npm install

# 2. Configure database
cp .env.example .env
# Edit .env and add: DATABASE_URL="postgresql://..."

# 3. Setup database
npm run prisma:generate
npm run prisma:migrate

# 4. Seed test data
npm run seed

# 5. Start dev server
npm run dev

# 6. Open browser
open http://localhost:3000
```

## 🧪 Run Tests

```bash
# Concurrency stress test (50 concurrent on 5-item stock)
npm run test:concurrency

# Expected: 5 succeed, 45 get 409 Conflict
# Result: ✅ PASS
```

## 🌐 Manual Testing

1. Browse http://localhost:3000 → See products and warehouses
2. Click "Reserve" on any product
3. Enter quantity and submit
4. Redirect to reservation status page
5. See countdown timer (10-minute expiry)
6. Click "Confirm Purchase" to complete
7. Verify stock decremented on home page

## 📦 Build & Deploy

```bash
# Build for production
npm run build

# Deploy to Vercel
vercel --prod
```

## 📊 Database Queries (psql)

```sql
-- View active reservations
SELECT id, status, quantity, "expiresAt" FROM "Reservation" WHERE status = 'PENDING' ORDER BY "createdAt" DESC LIMIT 10;

-- View audit trail
SELECT "reservationId", action, "createdAt" FROM "AuditLog" ORDER BY "createdAt" DESC LIMIT 20;

-- View inventory snapshot
SELECT p.name, w.name, i."totalStock" - i."reservedStock" as available FROM "Inventory" i JOIN "Product" p ON i."productId" = p.id JOIN "Warehouse" w ON i."warehouseId" = w.id;
```

## 🐛 Troubleshooting

### "Cannot find database"
```bash
# Verify DATABASE_URL in .env
cat .env | grep DATABASE_URL

# Test connection
npx prisma db push --skip-generate
```

### "Prisma client not found"
```bash
npm run prisma:generate
```

### "Port 3000 already in use"
```bash
# Find process using port 3000
lsof -i :3000

# Kill it or use different port
npm run dev -- -p 3001
```

### Concurrency test shows low success rate
```bash
# Ensure DATABASE_URL is correct
# PostgreSQL may need > 5 connections available
# Reduce test load or use connection pooling
```

## 📋 Verification Checklist

- [ ] `npm install` succeeds
- [ ] `npm run prisma:migrate` completes
- [ ] `npm run seed` populates data
- [ ] `npm run dev` starts without errors
- [ ] http://localhost:3000 loads
- [ ] Can browse products
- [ ] Can create reservation
- [ ] Can confirm purchase
- [ ] `npm run build` succeeds
- [ ] `npm run test:concurrency` passes
- [ ] All 12 API routes respond

## 📞 Support

See README.md for architecture details
See DEPLOYMENT.md for production deployment
See SUMMARY.md for complete feature list

---

**Setup complete! Happy testing! 🎉**
