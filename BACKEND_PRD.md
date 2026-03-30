# Backend PRD — Backlink Exchange Platform

## 1. Overview

A SaaS platform where website owners exchange backlinks with each other (credit-based) or purchase them outright (marketplace). The backend powers authentication, project/domain management, request lifecycle, credit economy, SEO metric ingestion, responsiveness scoring, and payments.

---

## 2. Tech Stack

| Layer | Choice |
|---|---|
| Runtime | Node.js (TypeScript) |
| Framework | **Hono** |
| ORM | **Drizzle ORM** (`drizzle-orm/pg-core`) |
| Database | PostgreSQL |
| Cache | **Redis** (sessions, credits, rate limits) |
| Queue | **BullMQ** (async jobs: metric fetching, link verification, emails) |
| Auth | JWT (access) + refresh tokens, OAuth (Google) |
| Payments | Stripe |
| Email | Resend |
| Storage | AWS S3 (avatars, exports) |
| SEO Metrics | Moz API + Ahrefs API |
| Link Crawler | Puppeteer (headless Chrome) |

---

## 3. Database Schema (Drizzle ORM)

All schemas use `drizzle-orm/pg-core`. See `server/src/db/schema/` for the full source.

### 3.1 `users`
```ts
export const users = pgTable("users", {
  id:           uuid("id").primaryKey().defaultRandom(),
  email:        text("email").notNull().unique(),
  passwordHash: text("password_hash"),
  name:         text("name").notNull(),
  username:     text("username").notNull().unique(),
  bio:          text("bio"),
  avatarUrl:    text("avatar_url"),
  website:      text("website"),
  location:     text("location"),
  plan:         text("plan").notNull().default("free"),  // 'free' | 'pro' | 'agency'
  credits:      integer("credits").notNull().default(3),
  createdAt:    timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt:    timestamp("updated_at", { withTimezone: true }).defaultNow(),
});
```

### 3.2 `projects`
```ts
export const projects = pgTable("projects", {
  id:                 uuid("id").primaryKey().defaultRandom(),
  userId:             uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name:               text("name").notNull(),
  domain:             text("domain").notNull(),
  verified:           boolean("verified").notNull().default(false),
  verificationMethod: text("verification_method"),  // 'meta_tag' | 'dns'
  verificationToken:  text("verification_token"),
  exchangeEnabled:    boolean("exchange_enabled").notNull().default(false),
  exchangeStatus:     text("exchange_status").notNull().default("pending"),
  guidelinesLinkInsertion: text("guidelines_link_insertion"),
  guidelinesGuestPost:     text("guidelines_guest_post"),
  notes:              text("notes"),
  createdAt:          timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt:          timestamp("updated_at", { withTimezone: true }).defaultNow(),
}, (t) => [unique().on(t.userId, t.domain)]);
```

### 3.3 `project_metrics`
Historical snapshots — one row per nightly refresh, kept for delta calculations.
```ts
export const projectMetrics = pgTable("project_metrics", {
  id:        uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  dr:        smallint("dr"),
  da:        smallint("da"),
  tf:        smallint("tf"),
  traffic:   integer("traffic"),
  rd:        integer("rd"),
  spamScore: smallint("spam_score"),
  asScore:   smallint("as_score"),
  fetchedAt: timestamp("fetched_at", { withTimezone: true }).defaultNow(),
});
```

### 3.4 `websites`
Exchange + marketplace inventory (platform-owned or user projects that opted in).
```ts
export const websites = pgTable("websites", {
  id:                      uuid("id").primaryKey().defaultRandom(),
  projectId:               uuid("project_id").references(() => projects.id, { onDelete: "cascade" }),
  domain:                  text("domain").notNull().unique(),
  categories:              text("categories").array(),
  language:                text("language"),
  countries:               text("countries").array(),
  tags:                    text("tags").array(),
  availableLinkInsertion:  boolean("available_link_insertion").notNull().default(true),
  availableGuestPost:      boolean("available_guest_post").notNull().default(false),
  guidelinesLinkInsertion: text("guidelines_link_insertion"),
  guidelinesGuestPost:     text("guidelines_guest_post"),
  isMarketplace:           boolean("is_marketplace").notNull().default(false),
  marketplacePrice:        numeric("marketplace_price", { precision: 10, scale: 2 }),
  isActive:                boolean("is_active").notNull().default(true),
  createdAt:               timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt:               timestamp("updated_at", { withTimezone: true }).defaultNow(),
});
```

### 3.5 `website_metrics`
```ts
export const websiteMetrics = pgTable("website_metrics", {
  id:        uuid("id").primaryKey().defaultRandom(),
  websiteId: uuid("website_id").notNull().references(() => websites.id, { onDelete: "cascade" }),
  dr:        smallint("dr"),
  da:        smallint("da"),
  tf:        smallint("tf"),
  traffic:   integer("traffic"),
  rd:        integer("rd"),
  spamScore: smallint("spam_score"),
  asScore:   smallint("as_score"),
  fetchedAt: timestamp("fetched_at", { withTimezone: true }).defaultNow(),
});
```

### 3.6 `backlink_requests`
```ts
export const backlinkRequests = pgTable("backlink_requests", {
  id:              uuid("id").primaryKey().defaultRandom(),
  requesterId:     uuid("requester_id").references(() => users.id),
  requesterDomain: text("requester_domain").notNull(),
  publisherId:     uuid("publisher_id").references(() => users.id),
  publisherDomain: text("publisher_domain").notNull(),
  requestType:     text("request_type").notNull(),   // 'Link Insertion' | 'Guest Post'
  status:          text("status").notNull().default("Pending"),
  sourceUrl:       text("source_url"),
  anchorText:      text("anchor_text"),
  targetUrl:       text("target_url"),
  title:           text("title"),
  description:     text("description").notNull(),
  tatDays:         integer("tat_days"),
  creditsCost:     integer("credits_cost").notNull(),
  creditsEarned:   integer("credits_earned").notNull(),
  liveVerifiedAt:  timestamp("live_verified_at", { withTimezone: true }),
  createdAt:       timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt:       timestamp("updated_at", { withTimezone: true }).defaultNow(),
});
```

### 3.7 `credit_transactions`
```ts
export const creditTransactions = pgTable("credit_transactions", {
  id:           uuid("id").primaryKey().defaultRandom(),
  userId:       uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  amount:       integer("amount").notNull(),   // positive = credit, negative = debit
  type:         text("type").notNull(),        // 'purchase' | 'request_sent' | 'link_live' | 'refund' | 'welcome_bonus' | 'adjustment'
  referenceId:  uuid("reference_id"),
  description:  text("description"),
  balanceAfter: integer("balance_after").notNull(),
  createdAt:    timestamp("created_at", { withTimezone: true }).defaultNow(),
});
```

### 3.8 `payments`
```ts
export const payments = pgTable("payments", {
  id:              uuid("id").primaryKey().defaultRandom(),
  userId:          uuid("user_id").references(() => users.id),
  stripePaymentId: text("stripe_payment_id").unique(),
  amountUsd:       numeric("amount_usd", { precision: 10, scale: 2 }).notNull(),
  creditsGranted:  integer("credits_granted"),
  type:            text("type").notNull(),    // 'credit_purchase' | 'marketplace_order'
  status:          text("status").notNull().default("pending"),
  metadata:        jsonb("metadata"),
  createdAt:       timestamp("created_at", { withTimezone: true }).defaultNow(),
});
```

### 3.9 `marketplace_orders`
```ts
export const marketplaceOrders = pgTable("marketplace_orders", {
  id:          uuid("id").primaryKey().defaultRandom(),
  buyerId:     uuid("buyer_id").references(() => users.id),
  websiteId:   uuid("website_id").references(() => websites.id),
  paymentId:   uuid("payment_id").references(() => payments.id),
  requestType: text("request_type"),
  sourceUrl:   text("source_url"),
  anchorText:  text("anchor_text"),
  targetUrl:   text("target_url"),
  title:       text("title"),
  description: text("description"),
  status:      text("status").notNull().default("pending"),
  createdAt:   timestamp("created_at", { withTimezone: true }).defaultNow(),
});
```

### 3.10 `responsiveness_scores`
```ts
export const responsivenessScores = pgTable("responsiveness_scores", {
  id:             uuid("id").primaryKey().defaultRandom(),
  userId:         uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  projectId:      uuid("project_id").references(() => projects.id, { onDelete: "cascade" }),
  totalIncoming:  integer("total_incoming").notNull().default(0),
  respondedCount: integer("responded_count").notNull().default(0),
  score:          numeric("score", { precision: 5, scale: 2 }),
  computedAt:     timestamp("computed_at", { withTimezone: true }).defaultNow(),
});
```

### 3.11 `link_verifications`
```ts
export const linkVerifications = pgTable("link_verifications", {
  id:          uuid("id").primaryKey().defaultRandom(),
  requestId:   uuid("request_id").references(() => backlinkRequests.id),
  verified:    boolean("verified"),
  checkedAt:   timestamp("checked_at", { withTimezone: true }).defaultNow(),
  httpStatus:  integer("http_status"),
  foundAnchor: text("found_anchor"),
  foundUrl:    text("found_url"),
  error:       text("error"),
});
```

### 3.12 `notifications`
```ts
export const notifications = pgTable("notifications", {
  id:        uuid("id").primaryKey().defaultRandom(),
  userId:    uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type:      text("type").notNull(),
  title:     text("title").notNull(),
  body:      text("body"),
  read:      boolean("read").notNull().default(false),
  metadata:  jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});
```

---

## 4. API Endpoints

### 4.1 Auth

| Method | Path | Description |
|---|---|---|
| POST | `/auth/register` | Register with email + password |
| POST | `/auth/login` | Login, returns access + refresh tokens |
| POST | `/auth/logout` | Invalidate refresh token |
| POST | `/auth/refresh` | Exchange refresh token for new access token |
| POST | `/auth/forgot-password` | Send reset email |
| POST | `/auth/reset-password` | Reset with token |
| POST | `/auth/oauth/google` | Google OAuth |

---

### 4.2 Users / Profile

| Method | Path | Description |
|---|---|---|
| GET | `/users/me` | Get current user profile + stats |
| PATCH | `/users/me` | Update name, bio, username, website, location |
| POST | `/users/me/avatar` | Upload avatar (multipart) |
| GET | `/users/me/stats` | Projects count, requests sent/received, links live, responsiveness, credits |
| DELETE | `/users/me` | Delete account |

---

### 4.3 Projects

| Method | Path | Description |
|---|---|---|
| GET | `/projects` | List user's projects |
| POST | `/projects` | Add new project |
| GET | `/projects/:id` | Get project detail + metrics |
| PATCH | `/projects/:id` | Update name, notes, exchange settings |
| DELETE | `/projects/:id` | Remove project |
| POST | `/projects/:id/verify` | Initiate ownership verification |
| GET | `/projects/:id/verify/status` | Check verification status |
| GET | `/projects/:id/metrics` | Get current + historical metrics |
| GET | `/projects/:id/metrics/delta` | Get metric deltas for date range |
| PATCH | `/projects/:id/exchange` | Toggle exchange on/off, update guidelines |

---

### 4.4 Backlink Requests

| Method | Path | Description |
|---|---|---|
| GET | `/requests` | List all requests (incoming + outgoing across all projects) |
| GET | `/requests/incoming` | List incoming requests |
| GET | `/requests/outgoing` | List outgoing requests |
| GET | `/projects/:id/requests` | Requests for a specific project |
| POST | `/requests` | Send a new backlink request (deducts credits) |
| GET | `/requests/:id` | Get request detail |
| PATCH | `/requests/:id/status` | Update status (accept/reject/hold) — publisher only |
| PATCH | `/requests/:id/tat` | Set TAT days — publisher only |
| POST | `/requests/:id/verify-live` | Trigger live link verification |
| GET | `/requests/export` | Export requests (CSV/TSV/JSON/XLS) |

**Query parameters for list endpoints:**
- `type` — `link_insertion` | `guest_post`
- `status` — `Pending` | `Accepted` | `Rejected` | `On Hold` | `Live`
- `project_domain`
- `domain_search`
- `sort_by` — `domain` | `dr` | `da` | `tf` | `traffic` | `rd` | `spam_score` | `created_at`
- `sort_order` — `asc` | `desc`
- `page`, `limit`

---

### 4.5 Exchange Websites

| Method | Path | Description |
|---|---|---|
| GET | `/exchange/websites` | Browse exchange websites (paginated, filtered) |
| GET | `/exchange/websites/:id` | Get website detail |
| GET | `/exchange/websites/export` | Export website list |
| GET | `/exchange/suggestions` | AI-powered website suggestions for user's projects |

**Query parameters:**
- `search` — domain search
- `category`, `language`, `country`, `tags`
- `dr_min`, `dr_max`, `da_min`, `da_max`, `tf_min`, `tf_max`
- `traffic_min`, `traffic_max`
- `spam_max`
- `available_link_insertion`, `available_guest_post`
- `sort_by`, `sort_order`, `page`, `limit`

---

### 4.6 Marketplace

| Method | Path | Description |
|---|---|---|
| GET | `/marketplace/websites` | Browse marketplace listings |
| GET | `/marketplace/websites/:id` | Get listing detail |
| POST | `/marketplace/orders` | Purchase a backlink (creates Stripe payment) |
| GET | `/marketplace/orders` | List user's orders |
| GET | `/marketplace/orders/:id` | Get order detail |
| POST | `/marketplace/orders/:id/verify-live` | Verify ordered link is live |

---

### 4.7 Credits

| Method | Path | Description |
|---|---|---|
| GET | `/credits` | Get current balance |
| GET | `/credits/transactions` | Credit transaction history |
| POST | `/credits/purchase` | Create Stripe payment intent for credit package |
| POST | `/credits/purchase/confirm` | Confirm payment, grant credits |

**Credit Packages:**
| Package | Credits | Price USD |
|---|---|---|
| Starter | 5 | $9.99 |
| Growth | 15 | $24.99 |
| Pro | 35 | $49.99 |
| Agency | 80 | $99.99 |

---

### 4.8 Responsiveness

| Method | Path | Description |
|---|---|---|
| GET | `/responsiveness` | Account-level responsiveness score |
| GET | `/projects/:id/responsiveness` | Per-project responsiveness score |
| GET | `/users/:id/responsiveness` | Public responsiveness for a user/domain (shown in exchange) |

---

### 4.9 Webhooks

| Method | Path | Description |
|---|---|---|
| POST | `/webhooks/stripe` | Stripe payment events |

---

### 4.10 Admin (internal)

| Method | Path | Description |
|---|---|---|
| GET | `/admin/users` | List all users |
| GET | `/admin/websites` | Manage exchange/marketplace listings |
| POST | `/admin/websites` | Add a listing manually |
| PATCH | `/admin/websites/:id` | Update listing |
| POST | `/admin/credits/adjust` | Manual credit adjustment for a user |
| GET | `/admin/metrics/refresh` | Trigger bulk metric refresh |

---

## 5. Business Logic

### 5.1 Credit Calculation

Credits per link are calculated from SEO metrics and normalized to 1–10:

```
dr_part      = floor(dr * 0.2)
da_part      = floor(da * 0.15)
tf_part      = floor(tf * 0.1)

traffic_part:
  ≥ 10,000,000 → 18
  ≥  2,000,000 → 12
  ≥    500,000 → 8
  ≥    150,000 → 5
  ≥     50,000 → 3
  ≥      7,000 → 2
  default      → 1

spam_penalty:
  spam ≥ 15 → -6
  spam ≥  8 → -3
  spam ≥  4 → -1
  default   →  0

raw = max(1, dr_part + da_part + tf_part + traffic_part - spam_penalty)
credits = max(1, min(10, round(1 + (raw - 1) / 59 * 9)))
```

**Result:** Always 1–10 credits.
- `credits_cost` (charged to requester on request creation) = computed value
- `credits_earned` (awarded to publisher on Live) = same computed value

### 5.2 Request Lifecycle

```
Requester sends request
  → credits_cost deducted from requester immediately
  → request status = "Pending"

Publisher actions:
  → Accepted: status = "Accepted", tat_days set
  → Rejected: status = "Rejected", credits_cost refunded to requester
  → On Hold:  status = "On Hold"

Publisher marks Live:
  → Link verification job triggered (crawler checks source_url for anchor + target_url)
  → On success: status = "Live", credits_earned added to publisher
  → On failure: error returned, status stays "Accepted"

Requester can also Mark as Live (for outgoing/accepted requests):
  → Same verification flow
```

### 5.3 Responsiveness Score

Computed per project (publisher side only):

```
score = (count of incoming requests where status != 'Pending') / total_incoming * 100
```

- Recomputed on every status change
- Account-level score = weighted average across all projects
- Cached in `responsiveness_scores`, refreshed on status updates
- Expires after 24 hours for display (background job recomputes nightly)

### 5.4 Domain Ownership Verification

Two methods:

**Meta Tag:**
1. User adds `<meta name="backlink-platform-verification" content="{token}">` to their homepage
2. Backend crawls the URL, confirms tag presence
3. On success: `verified = true`

**DNS TXT Record:**
1. User adds TXT record `backlink-platform-verify={token}` to their domain
2. Backend does DNS TXT lookup
3. On success: `verified = true`

Verification tokens are `UUID` generated at project creation, stored in `projects.verification_token`.

### 5.5 SEO Metric Refresh

Background job runs nightly (or on-demand):
- Calls Moz/Ahrefs/Majestic APIs for DA, DR, TF, RD, Spam Score
- Calls traffic estimation API (SimilarWeb or SEMrush)
- Saves snapshot to `project_metrics` / `website_metrics`
- Keeps history for delta computation (30/60/90 day windows)

### 5.6 Link Verification (Live Check)

Triggered when user marks a request as Live:
- Headless crawler (Puppeteer or Playwright) fetches `source_url`
- Searches page HTML for `anchor_text` linked to `target_url`
- Records result in `link_verifications`
- On success: credits awarded, status set to Live
- On failure: user notified, no credits awarded, can retry

---

## 6. Authentication & Authorization

### Token Strategy
- **Access token**: JWT, 15 min TTL, signed with RS256
- **Refresh token**: opaque UUID, 30 day TTL, stored in Redis + httpOnly cookie
- **Rate limiting**: Redis-backed, per IP on auth routes

### Authorization Rules

| Action | Rule |
|---|---|
| View own requests | Authenticated, own user_id |
| Send request | Authenticated, verified project, enough credits |
| Accept/Reject/Hold | Authenticated, must be the publisher (publisher_id or publisher_domain match) |
| Mark Live | Both requester and publisher can trigger |
| View exchange websites | Authenticated |
| Purchase marketplace | Authenticated, valid Stripe payment |
| Admin routes | Role = 'admin' |

---

## 7. Background Jobs (BullMQ Queues)

| Queue | Job | Trigger | Description |
|---|---|---|---|
| `metrics` | `refresh-project-metrics` | Nightly cron | Fetch fresh SEO metrics for all projects |
| `metrics` | `refresh-website-metrics` | Nightly cron | Fetch fresh metrics for exchange/marketplace |
| `verification` | `verify-domain-ownership` | On-demand | Crawl or DNS check for project verification |
| `verification` | `verify-link-live` | On-demand | Crawl page to confirm link is live |
| `responsiveness` | `recompute-scores` | On status change | Update responsiveness scores |
| `email` | `send-request-notification` | On request create | Notify publisher of new request |
| `email` | `send-status-update` | On status change | Notify requester of accept/reject/live |
| `email` | `send-payment-receipt` | On payment success | Credit purchase or marketplace receipt |
| `cleanup` | `expire-pending-requests` | Daily cron | Auto-expire Pending requests older than 30 days, reduce responsiveness |

---

## 8. Notifications & Emails

| Trigger | Recipient | Email |
|---|---|---|
| New incoming request | Publisher | "You have a new backlink request from {domain}" |
| Request accepted | Requester | "Your request to {domain} was accepted (TAT: {n} days)" |
| Request rejected | Requester | "Your request to {domain} was declined" |
| Link verified live (publisher) | Publisher | "Link confirmed live — {credits} credits added" |
| Link verified live (requester) | Requester | "Your backlink on {domain} is now live!" |
| Low credits | User | "You have {n} credits left" (threshold: 2) |
| Credit purchase | User | Receipt with balance |
| Request auto-expired | Publisher | Responsiveness score impact warning |

In-app notifications follow the same triggers (stored in a `notifications` table, polled via WebSocket or SSE).

---

## 9. Rate Limits

| Endpoint | Limit |
|---|---|
| `POST /auth/login` | 10 req / min per IP |
| `POST /auth/register` | 5 req / min per IP |
| `POST /requests` | 20 req / hour per user |
| `POST /projects/:id/verify` | 5 req / hour per project |
| `POST /requests/:id/verify-live` | 3 req / hour per request |
| `GET /exchange/websites` | 120 req / min per user |
| All other authenticated | 300 req / min per user |

---

## 10. Responsiveness Impact on Visibility

The responsiveness score affects how a website appears in the exchange browser:

| Score | Badge | Impact |
|---|---|---|
| ≥ 75% | Green — "Highly Responsive" | Boosted in default sort |
| 50–74% | Amber — "Moderately Responsive" | Standard position |
| < 50% | Red — "Low Responsiveness" | Demoted in default sort |

Auto-expired requests (no action taken after 30 days) count as "not responded" and reduce the score.

---

## 11. Credit Economy — Edge Cases

| Scenario | Handling |
|---|---|
| Requester has insufficient credits | Block request creation, return 402 |
| Request rejected after credits deducted | Full refund to requester |
| Link verification fails | No credits awarded, status stays Accepted, retry allowed |
| User deletes project with pending requests | Requests cancelled, requesters refunded |
| Duplicate request to same domain | Block if active request already exists for same requester+publisher domain pair |
| Requester account deleted | Outstanding accepted requests preserved for publisher to still earn credits |

---

## 12. Data Retention & Privacy

- User data deleted on account deletion (cascade)
- Credit transaction ledger retained for 7 years (financial compliance)
- Link verification logs retained for 90 days
- SEO metric history retained for 2 years
- Request history retained for 3 years
- Stripe customer/payment data governed by Stripe's retention policy

---

## 13. Phases

### Phase 1 — Core (MVP)
- Auth (email/password)
- Projects (CRUD + meta tag verification)
- Backlink requests (send, accept, reject, hold, mark live)
- Manual live verification (no crawler — user confirms)
- Credits (purchase via Stripe, deduct/earn)
- Exchange website browser (static seeded list)
- Basic email notifications

### Phase 2 — Automation
- Automated link verification (crawler)
- DNS verification method
- SEO metric auto-refresh (Moz/Ahrefs integration)
- Responsiveness score persistence + auto-expiry
- In-app notifications

### Phase 3 — Growth
- Marketplace (paid backlinks)
- AI-powered suggestions (match projects to best exchange candidates)
- Google OAuth
- Admin dashboard
- Subscription plans (Pro, Agency) with higher request limits
- Public profile pages with responsiveness score visible to other users
