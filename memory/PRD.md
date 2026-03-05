# TudoAqui Marketplace - PRD

## Original Problem Statement
Comprehensive marketplace for Angola called **TudoAqui** by **Sincesoft-Sinceridade Service**.
Includes modules for Tuendi (ride-hailing/deliveries), restaurants, tourism, real estate, partner management, admin, and more.

## Architecture
- **Frontend**: React, Tailwind CSS, Shadcn UI, react-leaflet
- **Backend**: FastAPI (modular routers), Motor (async MongoDB)
- **Database**: MongoDB
- **Auth**: JWT-based (auth_module.py) with Google OAuth support

### Backend Modules
| Module | File | Features |
|--------|------|----------|
| Core | `server.py` | Restaurants, orders, reviews, taxi, rides, fiscal, IVA in orders |
| Auth | `auth_module.py` | JWT auth, roles, tiers, points, password reset, Google OAuth |
| Wallet | `wallet_module.py` | Balance, topup, payments, transfers, refunds, stats |
| Tuendi | `tuendi_module.py` | Rides, deliveries, drivers, chat, ratings, coupons, wallet |
| Admin | `admin_module.py` | Roles, config, user mgmt, doc review, IVA toggle, reports |
| Partners | `partners_module.py` | Tiers, analytics, bank details, document upload, menu CRUD, incoming orders |
| Payments | `payments_module.py` | Bank transfer with confirmation codes |
| Accounting | `accounting_module.py` | PGCA (journal, balance sheet) |
| Fiscal | `fiscal_compliance.py` | IVA 14%, retention, NIF validation |
| Notifications | `notifications_module.py` | In-app notifications |
| Referral | `referral_module.py` | Unique codes, rewards, coupons |
| Tourism | `tourism_router.py` | Tourist places and bookings |
| Properties | `properties_router.py` | Real estate listings |

## Role System
- **Admin**: CEO(4), Admin(3), Suporte(2), Financas(1)
- **Users**: Normal, Premium (tiers: bronze → silver → gold → platinum → VIP)
- **Partners**: Basico, Premium, Enterprise

## User Tier System
| Tier | Min Points | Min Orders | Discount | Cashback | Free Delivery |
|------|-----------|------------|----------|----------|---------------|
| Bronze | 0 | 0 | 0% | 0% | No |
| Silver | 500 | 5 | 2% | 1% | No |
| Gold | 2,000 | 20 | 5% | 2% | Yes |
| Platinum | 5,000 | 50 | 10% | 3% | Yes |
| VIP | 15,000 | 100 | 15% | 5% | Yes |

## Implemented Features (March 2026)
- [x] Auth (email/password + Google OAuth, JWT tokens)
- [x] User tiers, points system, rewards redemption
- [x] Dashboard with notifications, admin link, referral link
- [x] Tuendi: vehicle types (moto/standard/comfort/premium), ride request, driver assignment, chat, deliveries
- [x] Module Interactivity: ride/delivery/order completion → points + wallet transactions + notifications
- [x] Restaurant: search, filters, menu, cart, checkout, reviews/ratings
- [x] Tourism: listings, detail, bookings
- [x] Real Estate: listings, detail, inquiries
- [x] Payment: bank transfer with confirmation codes (direct to partner)
- [x] Order tracking with status steps
- [x] Partner: tiers, analytics, bank details, wallet
- [x] Partner Menu Management - CRUD menu items, auto-create restaurant
- [x] Partner Incoming Orders - Status flow + customer notifications
- [x] Document Verification - Upload BI/NIF/Alvara (base64), admin review
- [x] IVA Optional - Toggle (14%) in admin, applied to orders
- [x] Sales Reports - Period filter (day/week/month), IVA calculation
- [x] Referral System - TUDO codes, 500Kz referrer, 20% referred, coupons
- [x] Accounting: PGCA chart, journal entries, trial balance
- [x] Fiscal: IVA calc, retention, NIF validation
- [x] Admin: config, APIs, contacts, about, users/roles
- [x] Notifications: in-app, read/unread
- [x] Profile: tier info, points, wallet, settings, security tabs
- [x] Unified Wallet: balance, topup, payments, transfers

## Simulated
- Driver assignment (random names), Bank accounts (example IBAN/NIF)

## Backlog
### P1
- [ ] Real payment gateway APIs (Multicaixa, Unitelmoney, BAI Paga)
- [ ] PDF/CSV report export (data available, need formatter)
- [ ] WebSocket real-time order tracking

### P2
- [ ] Push notifications (real)
- [ ] Advanced coupon system (expiry, min order)
- [ ] Partner ratings and featured listings
- [ ] Refine role-based UI restrictions
- [ ] UI/UX improvements across all modules

## Test Credentials
- Regular user: maria@tudoaqui.ao / maria123456 (bronze, 226+ points)
