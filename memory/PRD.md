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
| Core | `server.py` | Restaurants, orders, reviews, taxi, rides, fiscal, IVA |
| Auth | `auth_module.py` | JWT auth, roles, tiers, points, password reset, Google OAuth |
| Wallet | `wallet_module.py` | Balance, topup, payments, transfers, refunds, stats |
| Tuendi | `tuendi_module.py` | Rides, deliveries, drivers, chat, ratings, coupons, wallet |
| Admin | `admin_module.py` | Roles, config, user mgmt, doc review, IVA toggle, reports |
| Partners | `partners_module.py` | Tiers, analytics, bank details, document upload, menu CRUD |
| Payments | `payments_module.py` | Multicaixa Express, Unitel Money, BAI Paga, Transferência |
| Coupons | `coupon_module.py` | Universal coupons: percent, fixed, free delivery, tier-locked |
| Streak | `streak_module.py` | Daily streak with multipliers (3d=2x, 7d=3x, 14d=5x, 30d=10x) |
| Reports | `reports_module.py` | Admin/partner/user CSV + JSON reports with IVA |
| Accounting | `accounting_module.py` | PGCA (journal, balance sheet) |
| Fiscal | `fiscal_compliance.py` | IVA 14%, retention, NIF validation |
| Notifications | `notifications_module.py` | In-app notifications |
| Referral | `referral_module.py` | Unique codes, rewards, coupons |
| Tourism | `tourism_router.py` | Tourist places and bookings |
| Properties | `properties_router.py` | Real estate listings |

## Implemented Features (March 2026)
- [x] Auth (email/password + Google OAuth, JWT tokens, unified system)
- [x] User tiers (Bronze→Silver→Gold→Platinum→VIP), points system, rewards
- [x] Daily Streak system with milestones and point multipliers
- [x] Advanced Coupon system (percent/fixed/free_delivery, tier-locked, usage limits)
- [x] Payment Gateway (Multicaixa Express, Unitel Money, BAI Paga, Transferência Bancária)
- [x] Report Export (Admin/Partner/User CSV + JSON with IVA 14%)
- [x] Role-based UI restrictions (admin/partner/user visibility)
- [x] Dashboard with streak badge, quick tools, role-based links
- [x] Module Interactivity: ride/delivery/order completion → points + wallet + notifications
- [x] Tuendi: vehicle types, rides, deliveries, driver assignment, chat
- [x] Restaurants: search, filters, menu, cart, checkout, reviews/ratings
- [x] Tourism: listings, detail, bookings
- [x] Real Estate: listings, detail, inquiries
- [x] Partner: tiers, analytics, bank details, menu CRUD, incoming orders
- [x] Admin: config, user mgmt, doc review, IVA toggle
- [x] Notifications, Referral system, Wallet, Profile

## Simulated/Mocked
- Payment gateway (confirmation codes generated locally, no real API)
- Driver assignment (random names from predefined list)

## Backlog
### P1
- [ ] WebSocket real-time order tracking and chat
- [ ] Push notifications (real)

### P2
- [ ] Real payment gateway API integration
- [ ] PDF report export (in addition to CSV)
- [ ] Advanced partner analytics dashboard
- [ ] Multi-language support (Portuguese/English)

## Test Credentials
- Admin user: maria@tudoaqui.ao / maria123456 (admin role, bronze tier)
- Seeded coupons: TUENDI20, COMIDA10, ENTREGAGRATIS, VIP500 (gold+)
