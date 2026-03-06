# TudoAqui Marketplace - PRD

## Original Problem Statement
Comprehensive marketplace for Angola called **TudoAqui** by **Sincesoft-Sinceridade Service**.
Includes modules for Tuendi (ride-hailing/deliveries), restaurants, tourism, real estate, partner management, admin, and more.

## Architecture
- **Frontend**: React, Tailwind CSS, Shadcn UI, react-leaflet, recharts
- **Backend**: FastAPI (modular routers), Motor (async MongoDB), WebSocket
- **Database**: MongoDB
- **Auth**: JWT-based (auth_module.py) with Google OAuth support
- **Mobile**: Capacitor.js v7 (iOS + Android)

### Backend Modules
| Module | File | Features |
|--------|------|----------|
| Core | `server.py` | Backward compat routes, fiscal, user tier, IVA |
| Auth | `auth_module.py` | JWT auth, roles, tiers, points, password reset |
| Wallet | `wallet_module.py` | Balance, topup, payments, transfers, refunds |
| Tuendi | `tuendi_module.py` | Rides, deliveries, drivers, chat, ratings |
| Rides | `rides_module.py` | Taxi apps, navigation, ride requests |
| Restaurants | `restaurants_module.py` | Restaurants, menus, orders, reviews |
| WebSocket | `websocket_module.py` | Real-time notifications, ride tracking, chat |
| Admin | `admin_module.py` | Config, user mgmt, doc review, IVA toggle |
| Partners | `partners_module.py` | Tiers, analytics basic + advanced, bank details |
| Payments | `payments_module.py` | Multicaixa, Unitel Money, BAI Paga (SIMULATED) |
| Coupons | `coupon_module.py` | Universal coupons, tier-locked |
| Streak | `streak_module.py` | Daily streak with multipliers |
| Reports | `reports_module.py` | Admin/partner/user CSV + JSON |
| Accounting | `accounting_module.py` | PGCA journal, balance sheet |
| Fiscal | `fiscal_compliance.py` | IVA 14%, retention, NIF validation |
| Notifications | `notifications_module.py` | In-app notifications |
| Referral | `referral_module.py` | Codes, rewards, coupons |
| Tourism | `tourism_router.py` | Tourist places and bookings |
| Properties | `properties_router.py` | Real estate listings |
| Pitch | `pitch_module.py` | Investor pitch deck data |

## Implemented Features (March 2026)
- [x] Auth (email/password + Google OAuth, JWT tokens)
- [x] User tiers (Bronze->Silver->Gold->Platinum->VIP), points, rewards
- [x] Daily Streak system with milestones and multipliers
- [x] Coupon system (percent/fixed/free_delivery, tier-locked)
- [x] Payment Gateway SIMULATED (Multicaixa, Unitel Money, BAI Paga)
- [x] Report Export (CSV + JSON with IVA 14%)
- [x] Role-based UI (admin/partner/user)
- [x] Tuendi: rides, deliveries, driver assignment, chat
- [x] Restaurants: search, menu, cart, checkout, reviews
- [x] Tourism: listings, bookings
- [x] Real Estate: listings, inquiries
- [x] Partner: tiers, basic + advanced analytics, bank details, menu CRUD
- [x] Admin: config, user mgmt, doc review, IVA toggle
- [x] Notifications, Referral, Wallet, Profile
- [x] Pitch Deck: Presentation + export HTML/PDF
- [x] Landing Page + Static Site with deploy script
- [x] Mobile Conversion (Capacitor.js v7 - iOS + Android)
- [x] Backend Refactoring (server.py 1007 -> ~280 lines)
- [x] **WebSocket Module**: Real-time notifications, ride tracking, chat
- [x] **Advanced Partner Dashboard**: KPIs, charts (recharts), activity heatmaps, transactions
- [x] **Real-time Notification Badge**: WebSocket with HTTP polling fallback

## Simulated/Mocked
- Payment gateway (no real API)
- Driver assignment (random names)
- Chat auto-reply from driver

## Backlog
### P1
- [ ] Push notifications (native mobile)
- [ ] Exportacao de relatorios em PDF

### P2
- [ ] Real payment gateway API integration
- [ ] Multi-language support (Portuguese/English)

## Test Credentials
- Admin: maria@tudoaqui.ao / maria123456
- Seeded coupons: TUENDI20, COMIDA10, ENTREGAGRATIS, VIP500
