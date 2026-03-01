# TudoAqui Marketplace - PRD

## Original Problem Statement
Comprehensive marketplace for Angola called **TudoAqui** by **Sincesoft-Sinceridade Service**.

## Architecture
- **Frontend**: React, Tailwind CSS, Shadcn UI, react-leaflet
- **Backend**: FastAPI (modular routers), Motor (async MongoDB)
- **Database**: MongoDB

### Backend Modules
| Module | File | Features |
|--------|------|----------|
| Core | `server.py` | Auth, restaurants, orders, reviews, fiscal, taxi, IVA in orders |
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
- **Admin**: CEO(4), Admin(3), Suporte(2), Finanças(1)
- **Users**: Normal, Premium
- **Partners**: Básico, Premium, Enterprise

## Implemented Features (Feb 2026)
- [x] Auth (email/password + Google OAuth)
- [x] Dashboard with notifications, admin link, referral link
- [x] Taxi: vehicle types, ride request, driver assignment, navigation GPS
- [x] Restaurant: search, filters, menu, cart, checkout, reviews/ratings
- [x] Tourism: listings, detail, bookings
- [x] Real Estate: listings, detail, inquiries
- [x] Payment: bank transfer with confirmation codes (direct to partner)
- [x] Order tracking with status steps
- [x] Partner: tiers, analytics, bank details, wallet
- [x] **Partner Menu Management** - CRUD menu items, auto-create restaurant
- [x] **Partner Incoming Orders** - Status flow + customer notifications
- [x] **Document Verification** - Upload BI/NIF/Alvará (base64), admin review
- [x] **IVA Optional** - Toggle (14%) in admin, applied to orders
- [x] **Sales Reports** - Period filter (day/week/month), IVA calculation
- [x] **Referral System** - TUDO codes, 500Kz referrer, 20% referred, coupons
- [x] Accounting: PGCA chart, journal entries, trial balance
- [x] Fiscal: IVA calc, retention, NIF validation
- [x] Admin: config, APIs, contacts, about, users/roles
- [x] Notifications: in-app, read/unread

## Simulated
- Driver assignment (random names), Bank accounts (example IBAN/NIF)

## Backlog
### P1
- [ ] Real payment gateway APIs (Multicaixa, Unitelmoney, BAI Paga)
- [ ] PDF/CSV report export (data available, need formatter)
- [ ] WebSocket real-time order tracking

### P2
- [ ] Push notifications
- [ ] Advanced coupon system (expiry, min order)
- [ ] Partner ratings and featured listings
