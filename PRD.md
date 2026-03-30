# Product Requirements Document
## Backlink Exchange Platform

**Version:** 1.0
**Date:** March 2026
**Status:** Draft

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Problem Statement](#2-problem-statement)
3. [Goals & Success Metrics](#3-goals--success-metrics)
4. [User Personas](#4-user-personas)
5. [User Journeys](#5-user-journeys)
6. [Feature Requirements](#6-feature-requirements)
7. [Functional Specifications](#7-functional-specifications)
8. [Non-Functional Requirements](#8-non-functional-requirements)
9. [Information Architecture](#9-information-architecture)
10. [Data Model](#10-data-model)
11. [Backend Architecture](#11-backend-architecture)
12. [Monetization](#12-monetization)
13. [Launch Phases](#13-launch-phases)
14. [Open Questions](#14-open-questions)

---

## 1. Executive Summary

This platform is a two-sided marketplace for SEO backlink acquisition. Website owners can exchange backlinks with each other using a credit-based economy, or purchase backlinks outright through a paid marketplace. The platform handles discovery, outreach, request management, link verification, and credit settlement — replacing ad-hoc email outreach with a structured, trust-scored workflow.

---

## 2. Problem Statement

### For website owners seeking backlinks

- Finding relevant, high-quality sites to exchange links with is time-consuming and manual
- Cold email outreach has low response rates with no accountability
- There is no standard way to track the status of outreach or verify that agreed links went live
- Buying links directly is risky — no verification, no recourse

### For website owners receiving link requests

- Inbound requests arrive unstructured across email and contact forms
- No central place to review, accept, or decline requests
- No incentive to respond quickly or at all
- No way to monetise their link placements efficiently

### Platform opportunity

A structured, trust-scored exchange removes friction on both sides — requesters get access to a qualified inventory, publishers get organised inbound requests and earn credits they can redeem for their own link placements.

---

## 3. Goals & Success Metrics

### Business Goals

- Build a sustainable credit-based economy where exchange is the default and marketplace purchases are upsell
- Achieve platform liquidity: enough supply (publishers) and demand (requesters) that most requests get a response within 7 days
- Generate revenue through credit purchases and marketplace transactions

### Success Metrics

| Metric | Target (6 months) |
|---|---|
| Registered users | 5,000 |
| Verified projects | 8,000 |
| Requests sent per month | 15,000 |
| Request acceptance rate | ≥ 35% |
| Median time to first response | ≤ 5 days |
| Credits purchased (MRR) | $20,000 |
| Marketplace GMV | $10,000/month |
| Average responsiveness score | ≥ 65% |
| Month-1 retention | ≥ 40% |

---

## 4. User Personas

### 4.1 The SEO Specialist ("Alex")

- Works at a digital agency managing 10–30 client websites
- Needs to build links at scale efficiently
- Values data: DR, DA, TF, traffic before deciding to pursue a link
- Frustrated by: slow replies, broken links, no tracking
- Uses: Ahrefs, SEMrush, outreach tools
- Primary action: sends many outgoing requests, monitors their status, exports reports for clients

### 4.2 The Indie Founder ("Priya")

- Runs 1–3 niche content sites, doing SEO herself with limited time
- Wants quality over quantity
- Primary action: lists her sites in the exchange, selectively accepts incoming requests, occasionally sends outgoing ones
- Values: responsiveness score (wants to look trustworthy), simple UX

### 4.3 The Content Publisher ("Marcus")

- Runs a high-DA media site (DA 60+), receives many inbound link requests
- Wants to monetise placements — marketplace listing is appealing
- Primary action: reviews and accepts/rejects incoming requests, sets turnaround times, marks links live to earn credits or cash
- Values: clean request inbox, ability to set guidelines upfront

### 4.4 The Growth Marketer ("Sofia")

- Works in-house at a SaaS startup, needs backlinks fast for a product launch
- Has budget, will purchase credits or marketplace links
- Primary action: browses exchange, buys marketplace links, monitors outgoing requests
- Values: speed, quality metrics, link verification

---

## 5. User Journeys

### 5.1 Requester Flow

```
Sign up → Verify email
→ Add project (enter domain + name)
→ Verify domain ownership (meta tag or DNS)
→ Browse Exchange tab (filter by category, metrics, language, country)
→ Find a suitable site → view metrics, guidelines, responsiveness score
→ Send request (choose type, fill details, confirm credit cost)
→ Credits deducted → Request sent (Pending)
→ Publisher accepts → Notified (Accepted, TAT shown)
→ Publisher marks Live → Notified (Live)
```

### 5.2 Publisher Flow

```
Sign up → Add project → Verify domain
→ Enable Exchange → Set guidelines
→ Receive incoming requests (email + in-app)
→ Review: requester metrics, source URL, anchor text, target URL
→ Accept (set TAT) / Reject / Put on Hold
→ Publish the link on site
→ Mark as Live → Link verified → Credits earned
```

### 5.3 Marketplace Buyer Flow

```
Browse Marketplace → filter by price, metrics, category
→ Select website → view listing details
→ Click Buy → provide link details
→ Pay via Stripe
→ Publisher fulfils order → Link goes live → Buyer notified
```

### 5.4 Credit Top-Up Flow

```
Running low on credits (≤ 2 remaining) → Warning shown
→ Click Credits badge in header → "Add Credits"
→ Choose package (Starter / Growth / Pro / Agency)
→ Enter payment details → Pay via Stripe
→ Credits added instantly
```

---

## 6. Feature Requirements

### 6.1 Authentication & Accounts

| # | Requirement | Priority |
|---|---|---|
| A1 | Email + password registration with email verification | P0 |
| A2 | Login with JWT access token + httpOnly refresh token | P0 |
| A3 | Forgot password / reset password via email | P0 |
| A4 | Google OAuth login | P1 |
| A5 | Account deletion with data cleanup | P1 |
| A6 | Profile page: name, username, bio, website, location, avatar | P1 |
| A7 | Subscription plan shown on profile (Free / Pro / Agency) | P1 |

### 6.2 Projects

| # | Requirement | Priority |
|---|---|---|
| PR1 | Add a project by entering domain + display name | P0 |
| PR2 | Verify domain ownership via HTML meta tag | P0 |
| PR3 | Verify domain ownership via DNS TXT record | P1 |
| PR4 | View project list with SEO metrics (DA, DR, TF, Traffic, Spam Score) | P0 |
| PR5 | Enable/disable Exchange participation per project | P0 |
| PR6 | Set Link Insertion and Guest Post guidelines per project | P0 |
| PR7 | Edit project display name | P0 |
| PR8 | Add notes to a project (private, internal) | P1 |
| PR9 | Remove a project | P0 |
| PR10 | SEO metrics auto-refreshed nightly via third-party APIs | P1 |
| PR11 | Metric delta view (change over 7 / 30 / 90 days) | P1 |
| PR12 | Per-project responsiveness score displayed | P0 |

### 6.3 Exchange — Website Browser

| # | Requirement | Priority |
|---|---|---|
| EX1 | Browse all exchange-enabled websites with metrics | P0 |
| EX2 | Search by domain name | P0 |
| EX3 | Filter by category, language, country, tags | P0 |
| EX4 | Filter by metric ranges (DA, DR, TF, Traffic, Spam Score) | P0 |
| EX5 | Filter by request type availability (Link Insertion / Guest Post) | P0 |
| EX6 | Sort by any metric column, ascending or descending | P0 |
| EX7 | Pagination (server-side) | P0 |
| EX8 | View website detail: guidelines, full metrics, responsiveness score | P0 |
| EX9 | Send request from website detail view | P0 |
| EX10 | Export website list (CSV, TSV, JSON, XLS) | P1 |
| EX11 | AI-powered suggestions: recommended sites based on user's project niche | P2 |

### 6.4 Exchange — Request Management

| # | Requirement | Priority |
|---|---|---|
| RQ1 | View all incoming requests: domain, metrics, type, status | P0 |
| RQ2 | View all outgoing requests with same columns | P0 |
| RQ3 | Request detail dialog: source URL, anchor text, target URL, title, description | P0 |
| RQ4 | Publisher actions: Accept (with TAT), Reject, Put on Hold | P0 |
| RQ5 | Publisher action: Mark as Live (triggers verification, earns credits) | P0 |
| RQ6 | Requester action: Mark as Live (for accepted outgoing requests) | P0 |
| RQ7 | Automated link verification on Mark as Live | P1 |
| RQ8 | Credits displayed per request (cost for outgoing, earn for incoming) | P0 |
| RQ9 | Status badge with colour coding | P0 |
| RQ10 | Filter by status, type, domain search | P0 |
| RQ11 | Sort by domain, DR, DA, TF, Traffic, RD, Spam Score | P0 |
| RQ12 | Cross-project view (all requests across all user's projects) | P0 |
| RQ13 | Per-project filtered view | P0 |
| RQ14 | Export requests (CSV, TSV, JSON, XLS) | P1 |
| RQ15 | Auto-expire Pending requests after 30 days, penalise responsiveness | P1 |

### 6.5 Request Creation

| # | Requirement | Priority |
|---|---|---|
| SC1 | Choose request type: Link Insertion or Guest Post | P0 |
| SC2 | Link Insertion fields: source URL, anchor text, target URL, description | P0 |
| SC3 | Guest Post fields: source URL (target blog), post title, description | P0 |
| SC4 | Show credit cost before confirming | P0 |
| SC5 | Block submission if insufficient credits (show top-up prompt) | P0 |
| SC6 | Block if active request already exists for same requester+publisher domain | P0 |
| SC7 | Notify publisher by email + in-app on submission | P0 |

### 6.6 Credits

| # | Requirement | Priority |
|---|---|---|
| CR1 | Credit balance always visible in top navigation | P0 |
| CR2 | Credits dropdown: balance, View Transactions, Add Credits | P0 |
| CR3 | Deduct credits when outgoing request is sent | P0 |
| CR4 | Refund credits if request is rejected | P0 |
| CR5 | Award credits to publisher when link is marked Live + verified | P0 |
| CR6 | Welcome bonus credits on registration | P0 |
| CR7 | Purchase credits via Stripe (4 packages) | P0 |
| CR8 | Full transaction history (date, description, amount, running balance) | P0 |
| CR9 | Low-credit warning when balance ≤ 2 | P1 |
| CR10 | Credits never expire | P0 |

### 6.7 Responsiveness Score

| # | Requirement | Priority |
|---|---|---|
| RS1 | Account-level responsiveness score visible in top bar | P0 |
| RS2 | Score = % of incoming requests responded to (not Pending) | P0 |
| RS3 | Per-project responsiveness score | P0 |
| RS4 | Per-domain score visible to other users in the exchange browser | P0 |
| RS5 | Colour-coded: green ≥75%, amber ≥50%, red <50% | P0 |
| RS6 | Tooltip explaining score and how it affects platform visibility | P0 |
| RS7 | Auto-expired requests count as non-responded, lowering score | P1 |
| RS8 | Exchange sort boosts high-responsiveness sites | P1 |

### 6.8 Marketplace

| # | Requirement | Priority |
|---|---|---|
| MK1 | Browse paid listings with price, metrics, category | P0 |
| MK2 | Filter and sort same as exchange | P0 |
| MK3 | Purchase a placement via Stripe | P0 |
| MK4 | Order tracking: Pending → In Progress → Live | P0 |
| MK5 | Publisher fulfils order, marks live | P0 |
| MK6 | Order history for buyers | P0 |
| MK7 | Link verification on marketplace orders | P1 |
| MK8 | Refund if link not live within agreed window | P1 |

### 6.9 Dashboard

| # | Requirement | Priority |
|---|---|---|
| DB1 | Project selector (switch between projects) | P0 |
| DB2 | Request summary cards: Pending, Accepted, Rejected, On Hold counts | P0 |
| DB3 | Recent requests list (mini view with click-to-expand) | P0 |
| DB4 | Metric delta panel (DA, DR, TF, Traffic, Spam, Responsiveness) | P1 |
| DB5 | Date range picker for deltas (7 / 30 / 90 days) | P1 |
| DB6 | Per-project todo list | P1 |

### 6.10 Notifications

| # | Requirement | Priority |
|---|---|---|
| NT1 | Email on new incoming request | P0 |
| NT2 | Email on request accepted (with TAT) | P0 |
| NT3 | Email on request rejected | P0 |
| NT4 | Email on link verified live | P0 |
| NT5 | Email on credit purchase (receipt) | P0 |
| NT6 | Email warning when credits ≤ 2 | P1 |
| NT7 | In-app notification bell (real-time via WebSocket / SSE) | P1 |
| NT8 | Weekly email digest of pending actions | P2 |

### 6.11 Settings

| # | Requirement | Priority |
|---|---|---|
| ST1 | Change email | P1 |
| ST2 | Change password | P1 |
| ST3 | Email notification preferences per event type | P1 |
| ST4 | Connected OAuth accounts | P1 |
| ST5 | Delete account | P1 |

### 6.12 Plans & Upgrade

| # | Requirement | Priority |
|---|---|---|
| PL1 | Free plan with usage limits (3 projects, 10 requests/month) | P1 |
| PL2 | Pro plan: more projects, higher limits, advanced filters | P1 |
| PL3 | Agency plan: unlimited projects, team members, white-label exports | P2 |
| PL4 | Upgrade page with plan comparison | P1 |
| PL5 | Subscription managed via Stripe Billing | P1 |

---

## 7. Functional Specifications

### 7.1 Credit Calculation

Credits per link are calculated from publisher SEO metrics and normalised to a 1–10 scale:

```
dr_part      = floor(DR × 0.20)
da_part      = floor(DA × 0.15)
tf_part      = floor(TF × 0.10)

traffic_part:
  ≥ 10,000,000 → 18
  ≥  2,000,000 → 12
  ≥    500,000 → 8
  ≥    150,000 → 5
  ≥     50,000 → 3
  ≥      7,000 → 2
  default      → 1

spam_penalty:
  spam ≥ 15 → −6
  spam ≥  8 → −3
  spam ≥  4 → −1
  default   →  0

raw     = max(1, dr_part + da_part + tf_part + traffic_part − spam_penalty)
credits = max(1, min(10, round(1 + (raw − 1) / 59 × 9)))
```

Result is always **1–10 credits**. The same value is both the cost charged to the requester and the reward earned by the publisher.

### 7.2 Request Status Transitions

```
                    ┌──────────┐
                    │ Pending  │
                    └────┬─────┘
           ┌─────────────┼──────────────┐
           ▼             ▼              ▼
      ┌──────────┐  ┌─────────┐  ┌──────────┐
      │ Accepted │  │Rejected │  │ On Hold  │
      └────┬─────┘  └─────────┘  └────┬─────┘
           │                          │
           │           ┌──────────────┘
           ▼           ▼
         ┌──────────────┐
         │     Live     │
         └──────────────┘
```

- **Rejected** → credits refunded to requester immediately
- **On Hold** → publisher can later Accept or Reject
- **Live** → credits awarded to publisher after verification

### 7.3 Link Verification

Triggered when a request is marked Live:

1. Platform headless crawler fetches `source_url`
2. Searches page HTML for a link with text matching `anchor_text` pointing to `target_url`
3. Records result in `link_verifications` audit log
4. **On success:** status = Live, credits awarded to publisher
5. **On failure:** user notified, no credits awarded, retry allowed (max 3 times)
6. After 3 failures: flagged for manual review

### 7.4 Domain Ownership Verification

**Meta Tag method:**
```html
<meta name="blp-verify" content="{unique_token}">
```
Platform fetches homepage, parses `<head>`, confirms token match.

**DNS TXT method:**
```
TXT blp-verify.{domain} = {unique_token}
```
Platform performs DNS TXT lookup and confirms token.

Tokens are UUIDs generated per project. Verification is permanent unless domain ownership changes.

### 7.5 Responsiveness Score Formula

```
account_score = (incoming requests where status ≠ 'Pending') / total_incoming × 100
project_score = same formula scoped to a single project domain
```

Recomputed on every incoming request status change. Cached for display, refreshed within 24 hours. Auto-expired requests (no action after 30 days) count as non-responded and reduce the score.

---

## 8. Non-Functional Requirements

### 8.1 Performance
- Exchange browser loads in < 1.5s (server-side pagination, cached metrics)
- Request list loads in < 1s
- Link verification job completes within 60s
- Credit deduction is atomic (no race condition on concurrent requests)

### 8.2 Scalability
- Stateless API servers horizontally scalable behind a load balancer
- Background jobs via BullMQ + Redis
- Database connection pooling (PgBouncer)
- Read replicas for exchange browser queries

### 8.3 Security
- Passwords hashed with bcrypt (cost factor 12)
- JWT signed with RS256, 15-minute access token TTL
- Refresh tokens httpOnly + Secure + SameSite=Strict, 30-day TTL
- CSRF protection on all state-changing endpoints
- SQL injection prevented via parameterised queries
- Rate limiting on all auth and action endpoints (Redis-backed)
- Stripe webhook signature verification
- Domain verification tokens are UUIDs — unguessable

### 8.4 Reliability
- 99.9% uptime SLA
- Background job retries with exponential backoff (max 3 retries)
- Stripe payment events idempotently processed
- Credit transactions use database-level transactions (no double-spend)

### 8.5 Accessibility
- WCAG 2.1 AA compliance
- Keyboard navigable throughout
- ARIA labels on all icon-only buttons and tooltips
- Sufficient colour contrast for all status badges and score colours

### 8.6 Internationalisation
- UI in English (v1)
- Data layer supports multi-language content (language field on requests/websites)
- Dates in ISO 8601; displayed in user's local timezone

---

## 9. Information Architecture

```
/                          My Projects (home)
/dashboard                 Project Dashboard
/add-project               Add New Project

/exchange
  /websites                Browse Exchange Sites
  /incoming                Incoming Requests
  /outgoing                Outgoing Requests
  /suggestions             AI-Powered Suggestions (Phase 3)

/marketplace
  /websites                Browse Marketplace Listings
  /orders                  My Orders

/transactions              Credit Transaction History
/credits/add               Purchase Credits

/profile                   User Profile & Stats
/settings                  Account Settings
/upgrade                   Plans & Pricing
/help                      Help Centre
```

---

## 10. Data Model

| Table | Purpose |
|---|---|
| `users` | Account, profile, credit balance, subscription plan |
| `projects` | User's websites with verification and exchange status |
| `project_metrics` | Historical SEO metrics per project (DA, DR, TF, Traffic, RD, Spam) |
| `websites` | Exchange and marketplace inventory |
| `website_metrics` | SEO metrics for exchange/marketplace sites |
| `backlink_requests` | All exchange requests with full lifecycle fields |
| `credit_transactions` | Full double-entry ledger of credit movements |
| `payments` | Stripe payment records (credit purchases + marketplace orders) |
| `marketplace_orders` | Paid backlink order details and fulfilment status |
| `responsiveness_scores` | Cached per-user and per-project responsiveness scores |
| `link_verifications` | Audit log of automated live-link crawl checks |
| `notifications` | In-app notification queue |

---

## 11. Backend Architecture

### Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js + TypeScript |
| Framework | Fastify |
| Database | PostgreSQL |
| Cache + Queue | Redis + BullMQ |
| Auth | JWT (RS256) + httpOnly refresh tokens |
| Payments | Stripe |
| Email | Resend |
| File Storage | AWS S3 (avatars, exports) |
| SEO Metrics | Moz API + Ahrefs API |
| Link Crawler | Puppeteer (headless Chrome) |

### API Surface (summary)

| Domain | Key Endpoints |
|---|---|
| Auth | register, login, logout, refresh, forgot/reset password |
| Users | profile GET/PATCH, avatar upload, account stats, delete |
| Projects | CRUD, verify ownership, metrics + deltas, exchange toggle |
| Requests | list (incoming/outgoing), send, update status, mark live, export |
| Exchange | browse websites, website detail, export |
| Marketplace | browse listings, purchase, order history |
| Credits | balance, transactions, purchase (Stripe) |
| Responsiveness | account score, per-project score, public per-domain score |
| Webhooks | Stripe events |
| Admin | user management, listing management, credit adjustments |

### Background Jobs

| Job | Trigger |
|---|---|
| Refresh project SEO metrics | Nightly cron |
| Refresh exchange/marketplace metrics | Nightly cron |
| Verify domain ownership | On-demand (user initiates) |
| Verify link is live (crawler) | On-demand (Mark as Live action) |
| Recompute responsiveness scores | On every status change |
| Auto-expire stale Pending requests | Daily cron (30-day threshold) |
| Send email notifications | Event-driven |

---

## 12. Monetization

### 12.1 Credits (Primary Revenue)

| Package | Credits | Price | Per Credit |
|---|---|---|---|
| Starter | 5 | $9.99 | $2.00 |
| Growth | 15 | $24.99 | $1.67 |
| Pro | 35 | $49.99 | $1.43 |
| Agency | 80 | $99.99 | $1.25 |

Credits are consumed to send requests. Publishers earn credits back by accepting and publishing links. Net consumption drives repeat purchases.

### 12.2 Marketplace (Secondary)

Publishers list their site at a fixed USD price. Buyers pay directly. Platform takes a 15–20% commission per transaction.

### 12.3 Subscriptions (Phase 2)

| Plan | Price | Key Limits |
|---|---|---|
| Free | $0/month | 3 projects, 10 requests/month |
| Pro | $29/month | 15 projects, unlimited requests, advanced filters |
| Agency | $99/month | Unlimited projects, team members, white-label CSV exports |

---

## 13. Launch Phases

### Phase 1 — MVP (Months 1–2)

- Email/password auth
- Projects: add, verify (meta tag), exchange toggle, guidelines
- Exchange browser (seeded website list)
- Send / Accept / Reject / Hold / Mark Live (manual, no crawler)
- Credits: Stripe purchase, deduct on send, earn on live, transaction history
- Email notifications: new request, accepted, rejected, live
- Responsiveness score (computed live)

### Phase 2 — Automation (Months 3–4)

- DNS verification method
- Automated link verification via headless crawler
- SEO metric auto-refresh (Moz/Ahrefs API integration)
- Responsiveness score persistence + auto-expiry (30-day Pending threshold)
- In-app notifications (real-time via WebSocket/SSE)
- Request and website list export (CSV, TSV, JSON, XLS)
- Dashboard metric deltas with date range picker

### Phase 3 — Growth (Months 5–6)

- Marketplace (paid listings, Stripe Checkout, order tracking)
- Subscription plans (Pro, Agency via Stripe Billing)
- Google OAuth
- AI-powered site suggestions (match projects to exchange candidates by niche)
- Public profile pages with responsiveness score
- Admin dashboard
- Weekly email digest

---

## 14. Open Questions

| # | Question | Owner |
|---|---|---|
| OQ1 | Which SEO API provider — Moz, Ahrefs, or a unified aggregator? Cost vs. freshness trade-off. | Engineering |
| OQ2 | How to handle link verification on JS-rendered (SPA) publisher sites? Puppeteer adds latency and cost. | Engineering |
| OQ3 | Should credits be transferable between users (gifting/resale)? | Product |
| OQ4 | What happens if a verified live link is later removed? Clawback policy needed. | Product |
| OQ5 | Marketplace platform commission — 15% or 20%? | Business |
| OQ6 | Should the exchange be open (any site joins) or approval-gated to maintain quality? | Product |
| OQ7 | Free plan limits — are 3 projects and 10 requests/month the right thresholds? | Product |
| OQ8 | Is responsiveness score fully public or only visible to matched exchange partners? | Product |
| OQ9 | Mobile app — needed in Phase 1 or web-only sufficient? | Product |
| OQ10 | Team/multi-user accounts — required before Agency plan launch? | Engineering |
