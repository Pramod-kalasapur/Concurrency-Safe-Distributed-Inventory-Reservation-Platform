# Concurrency-Safe Distributed Inventory Reservation Platform

**A production-grade checkout reservation system designed to solve a real problem: handling thousands of simultaneous reservation attempts without overselling inventory.**

This project demonstrates how to build a reliable, scalable inventory management system that works in real-world scenarios. When Black Friday hits and 10,000 customers try to reserve the last 5 items simultaneously, this system ensures exactly 5 succeed—no race conditions, no double-bookings, no customer disappointment.

##  Why This Matters

Inventory overselling causes customer service headaches, revenue loss, and damaged trust. This project proves that with the right architecture, you can confidently scale from small operations to millions of concurrent users.

**Core Technical Achievements:**

- Proven concurrency safety under load (tested with 50+ simultaneous requests)
- Production-ready transaction handling with PostgreSQL row-level locking
- Smart request deduplication using idempotency keys
- Automatic inventory cleanup and expiration handling
- Built-in rate limiting and comprehensive audit trails
- Real-time monitoring with health checks and metrics dashboards
- data base connection, data seeding 

##  Quick Start

**Get up and running in 5 minutes:**

```bash
# 1. Install dependencies
npm install

# 2. Start the local database (Docker required)
docker compose up -d

# 3. Set up the database schema
npm run prisma:generate
npx prisma migrate dev

# 4. Seed with sample data
npm run seed

# 5. Start the app
npm run dev -- -p 3001
```

Open **http://localhost:3001** and try reserving items. The database runs on port 5433 to avoid conflicts with other PostgreSQL instances.
live hosted on vercel : ** https://allo-inventory-pramod-six.vercel.app?_vercel_share=5HrxwKF8PiHALi1RciKlkGOKNJzAGYMa **

##  How It Works

### The Problem
When inventory is limited, race conditions are dangerous:
- Customer A tries to reserve the last 2 items
- Customer B tries to reserve the last 2 items  
- Both requests hit the database simultaneously
- Without proper locking → **both succeed** (oversold by 2 items) 

### The Solution
This system uses **database-level row locking** to serialize access:

```
Request A locks inventory row → reserves stock → commits
Request B waits for lock → reads updated stock → either succeeds or returns 409 Conflict ✓
```

**Result:** Exactly the right number of people succeed; everyone else gets a clean `409 Conflict` response instead of an oversold order.

##  Architecture

The reservation flow uses three key technologies working together:

```
  Browser (React UI)
    ↓
  Next.js API Routes (/api/*)
    ↓
  Reservation Service (business logic)
    ↓
  PostgreSQL (with row-level locking)
```

**Why this design works:**
- Reservations are **transactional** (all-or-nothing)
- Row locks **serialize** competing requests for the same inventory
- Expiry is **automatic** (Vercel Cron runs cleanup every minute)
- Requests are **idempotent** (same idempotency key = same response)

##  Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React + TypeScript | Interactive reservation UI |
| **Backend** | Next.js App Router | API endpoints & server-side logic |
| **ORM** | Prisma | Type-safe database queries |
| **Database** | PostgreSQL | ACID compliance & row-level locking |
| **Infrastructure** | Docker Compose | Local development database |
| **Deployment** | Vercel | Scalable Next.js hosting |
| **Scheduling** | Vercel Cron | Automated expiry cleanup |

##  Key Features & Implementation Details

### 1. **Serializable Transactions**
Every reservation uses PostgreSQL's strictest isolation level—`Serializable`. This prevents phantom reads and ensures true concurrency safety.

### 2. **Row-Level Locking** 
The database literally locks the inventory row while processing your request:
```sql
SELECT * FROM "Inventory" WHERE "productId" = $1 AND "warehouseId" = $2 FOR UPDATE;
```
Other requests wait their turn. Simple. Bulletproof.

### 3. **Idempotency Keys**
Send the same `Idempotency-Key` header twice → get the same response both times. No duplicate charges, no duplicate reservations. This is standard in payment APIs for a reason.

### 4. **Rate Limiting**
Prevents abuse by limiting reservations per IP address. Ready for Redis/Upstash upgrade when you need distributed rate limiting.

### 5. **Automatic Expiry**
- **Lazy cleanup**: Before checking availability, expired reservations are released
- **Scheduled cleanup**: Vercel Cron runs every minute as a backup
- Result: Dead inventory is freed quickly and reliably

### 6. **Audit Logging**
Every state change is logged: created, confirmed, released, or expired. Essential for debugging, compliance, and root-cause analysis.

### 7. **Monitoring & Observability**
- **Health endpoint** (`/api/health`): Database connectivity status, latency, uptime
- **Metrics dashboard** (`/api/metrics`): Active reservations, success rate, stock utilization in real-time

##  API Reference

### Catalog Operations
| Method | Route | What It Does |
|--------|-------|------------|
| `GET` | `/api/products` | Get all products with availability per warehouse |
| `GET` | `/api/warehouses` | List all warehouse locations |

### Reservation Lifecycle
| Method | Route | What It Does |
|--------|-------|------------|
| `POST` | `/api/reservations` | Create a pending reservation (10-minute hold) |
| `GET` | `/api/reservations/[id]` | Check reservation status and countdown |
| `POST` | `/api/reservations/[id]/confirm` | Confirm—convert hold to completed purchase |
| `POST` | `/api/reservations/[id]/release` | Cancel—release the hold back to inventory |
| `GET/POST` | `/api/internal/release-expired` | Cleanup endpoint (called by Vercel Cron) |

### System Health & Monitoring
| Method | Route | What It Does |
|--------|-------|------------|
| `GET` | `/api/health` | Database status, latency, and uptime |
| `GET` | `/api/metrics` | Real-time dashboard: active/confirmed/failed reservations, stock levels |

##  How a Reservation Works (End-to-End)

### 1️⃣ Customer Browses
The homepage loads products and warehouses. Available stock is calculated in real-time:
```
availableStock = totalStock - reservedStock
```

### 2️⃣ Customer Clicks "Reserve"
The app navigates to the reservation page with product/quantity selected. When submitted:
```http
POST /api/reservations
Idempotency-Key: <uuid>
{
  "productId": "...",
  "warehouseId": "...",
  "quantity": 1
}
```

### 3️⃣ System Validates & Rate Limits
- Apply sliding-window rate limit (check current IP)
- Validate request with Zod schema
- Hash the request body for idempotency
- Pass to reservation service

### 4️⃣ Database Locks & Checks
Inside a serializable transaction:
```sql
SELECT * FROM "Inventory" WHERE productId = $1 AND warehouseId = $2 FOR UPDATE
```
- Lock acquired: other requests wait
- Check: `available = totalStock - reservedStock`
- Not enough stock? → Return `409 Conflict`
- Enough stock? → Continue to step 5

### 5️⃣ Reservation Created
Inside the transaction:
- Increment `reservedStock`
- Create `PENDING` reservation with 10-minute expiry
- Write audit log entry
- Cache the response (for idempotency)
- Commit

### 6️⃣ Customer Sees Countdown
Redirects to `/reservation?id=<id>`. Status page shows:
- Reservation ID
- Quantity
- Live countdown timer (10 minutes)
- Buttons: Confirm or Cancel

### 7️⃣ Customer Confirms
Runs a transaction that:
1. Validates reservation exists and is `PENDING`
2. Validates not expired
3. Locks inventory row
4. Decrement `reservedStock`, decrement `totalStock` (purchase complete)
5. Mark as `CONFIRMED`
6. Write audit log

### 8️⃣ Or Customer Cancels
Runs a transaction that:
1. Validates reservation is `PENDING`
2. Locks inventory row
3. Decrement `reservedStock` (stock released back to availability)
4. Mark as `RELEASED`
5. Write audit log

### 9️⃣ Auto-Expiry (If No Action)
If customer walks away:
- **Lazy cleanup**: Before any availability read, expired `PENDING` reservations auto-release
- **Scheduled cleanup**: Vercel Cron calls `/api/internal/release-expired` every minute

Expired reservations decrement `reservedStock` and mark as `EXPIRED`. Stock becomes available.

**Why two cleanup methods?** Lazy cleanup is fast for the happy path. Cron is the safety net if the system is idle.

### 🔟 Monitoring
Dashboard polls `/api/metrics` every 5 seconds:
- Active, confirmed, released, expired counts
- Total stock vs. available vs. reserved
- Success rate
- Latency metrics

##  Advanced Features Explained

### Idempotency (Preventing Duplicates)
Payment systems use idempotency keys for a reason. If a network hiccup causes your phone to retry the request:

```
First try:  POST /api/reservations + Idempotency-Key: "abc123" → SUCCESS
Retry:      POST /api/reservations + Idempotency-Key: "abc123" → Returns same response (cached)
```

Not:
```
Retry:      POST /api/reservations + Idempotency-Key: "abc123" + different body → 409 Conflict
```

The system stores:
- Idempotency key
- SHA-256 hash of the request body
- Cached response

Same key + same body = replay. Same key + different body = error. **This is why we don't get double-charged at checkout.**

### Audit Logging
Every state change is recorded: created, confirmed, released, or expired. Useful for:
- **Debugging**: Why did this reservation fail?
- **Compliance**: Can we prove what happened?
- **Analytics**: How many reservations expire vs. confirm?

### Reservation Lifecycle States

```
PENDING → CONFIRMED (customer confirmed purchase)
       → RELEASED (customer cancelled)
       → EXPIRED (10 minutes elapsed, no action)
```

##  Testing & Verification

### Run the Concurrency Proof
This test proves the system handles race conditions correctly:

```bash
npm run test:concurrency
```

**What happens:**
- 50 concurrent requests try to reserve the same 5 items
- Exactly 5 succeed
- Exactly 45 get `409 Conflict`
- 0 unexpected failures

**Expected output:**
```
Starting concurrency test: 50 concurrent reserves on 5-item stock...
Successes: 5 (expected 5) ✓
Conflicts: 45 (expected 45) ✓
Other failures: 0 (expected 0) ✓
PASS: concurrent reservations did not oversell stock.
Testing lifecycle: reserve → confirm...
PASS: lifecycle updated reservation and inventory correctly.
```

### Run the Production Build
```bash
npm run build
npm run start
```

This ensures TypeScript compiles cleanly and the app is production-ready.

##  Project Structure

```
src/
├── app/
│   ├── api/                    # All API endpoints
│   │   ├── products/           # Get all products
│   │   ├── warehouses/         # Get all warehouses
│   │   ├── reservations/       # Create reservation
│   │   ├── health/             # Health check
│   │   ├── metrics/            # Real-time metrics
│   │   └── internal/release-expired/  # Cleanup
│   ├── page.tsx                # Homepage
│   ├── reserve/page.tsx        # Checkout page
│   └── reservation/page.tsx    # Status page
├── components/                 # React components
│   ├── ProductList.tsx
│   ├── ActiveReservations.tsx
│   ├── MetricsDashboard.tsx
│   └── ReservationDetails.tsx
└── lib/
    ├── prisma.ts              # Database client
    ├── reservation.ts         # Core business logic
    └── rate-limit.ts          # Rate limiter

prisma/
├── schema.prisma              # Database schema
├── seed.ts                    # Sample data
└── migrations/                # Migration history

docker-compose.yml             # Local Postgres
vercel.json                    # Deploy config + Cron
```

**Key file to understand:** [src/lib/reservation.ts](src/lib/reservation.ts) — This is where all the transaction logic lives.

##  Scaling Considerations

**This design prioritizes correctness.** Row-level locking is the right choice for a system focused on concurrency safety because it's simple, reliable, and proven.

### Performance Tradeoffs

| Scenario | Impact | Solution |
|----------|--------|----------|
| High contention on hot items | Requests queue around lock | Partition inventory by time slot or product group |
| Read-heavy catalog traffic | Wasted DB queries | Add Redis or edge cache for 30-second TTL on products |
| Multiple server instances | In-memory rate limit ineffective | Switch to Upstash Redis |
| Audit compliance | Logs in database only | Add structured logging + tracing (e.g., OpenTelemetry) |

### Production Upgrade Path

When you're ready to scale:

1. **Redis-backed rate limiting**: Replace in-memory limiter with Upstash Redis
2. **Distributed caching**: Cache product availability with short TTL
3. **Structured logging & tracing**: Correlate requests across services
4. **Admin dashboard**: Visualize audit logs, run reports
5. **Event pipeline**: Stream reservation events to analytics

**None of these changes break the core concurrency model.** The row locking strategy scales from thousands to millions of users.

##  What You'll Learn from This Code

- **Concurrent programming**: How race conditions happen and why they're dangerous
- **Database transactions**: ACID properties, isolation levels, and when to use them
- **Locking strategies**: When to lock rows vs. tables, and performance implications
- **Request idempotency**: Building resilient APIs that handle retries correctly
- **Real-world API design**: How to return meaningful error codes (409, 400, 500)
- **Testing under load**: Writing stress tests that prove your code works
- **TypeScript best practices**: Type-safe database queries with Prisma
- **Next.js patterns**: Route handlers, middleware, and cron jobs
- **Production-ready code**: Audit logs, health checks, monitoring, deployment config

##  Deploying to Production

### Recommended Stack

| Component | Service | Why |
|-----------|---------|-----|
| Frontend & API | [Vercel](https://vercel.com) | Optimized for Next.js, built-in Cron jobs |
| Database | [Neon](https://neon.tech) or [Supabase](https://supabase.com) | Managed PostgreSQL, auto-scaling |
| Rate limiting | [Upstash Redis](https://upstash.com) | Serverless Redis, no container management |

### Environment Setup

Create a `.env.local` file:
```
DATABASE_URL=postgresql://user:pass@host:5432/dbname
```

Vercel will automatically pick up `DATABASE_URL` from your project settings.

### Cron Configuration

The file [vercel.json](vercel.json) already includes cron setup:
```json
{
  "crons": [
    {
      "path": "/api/internal/release-expired",
      "schedule": "* * * * *"   // Every minute
    }
  ]
}
```

No additional setup needed—deploy to Vercel and it runs automatically.

### Deploy with Git

1. Push to GitHub
2. Connect repository to Vercel
3. Vercel auto-deploys on every push
4. Set `DATABASE_URL` environment variable in Vercel dashboard
5. Done ✓

**First deploy typically takes 2–3 minutes.**


##  Contributing

This is a learning project. If you have suggestions or find issues:

1. Open an issue describing the problem
2. Submit a pull request with your fix
3. Include a test that proves the fix works

## 📄 License

Open source. Use it for learning, portfolios, or as a reference for your own systems.

---

**Questions?** Check [QUICKSTART.md](QUICKSTART.md) for command reference or [DEPLOYMENT.md](DEPLOYMENT.md) for deployment specifics.

**Want to understand the database schema?** See [prisma/schema.prisma](prisma/schema.prisma).
