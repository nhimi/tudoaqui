# TudoAqui Marketplace - PRD

## Original Problem Statement
Comprehensive marketplace for Angola called **TudoAqui** by **Sincesoft-Sinceridade Service**.

## Architecture
- **Frontend**: React, Tailwind CSS, Shadcn UI, react-leaflet
- **Backend**: FastAPI (modular routers), Motor (async MongoDB)
- **Database**: MongoDB

### Backend Modules
| Module | File | Description |
|--------|------|-------------|
| Core | `server.py` | Auth, restaurants, orders, reviews, fiscal, taxi, backward compat |
| Admin | `admin_module.py` | Roles (CEO/Admin/Suporte/Finanças), config, user management |
| Partners | `partners_module.py` | B2B system, tiers, analytics, bank details |
| Payments | `payments_module.py` | Bank transfer with confirmation codes |
| Accounting | `accounting_module.py` | PGCA accounting (journal, balance sheet) |
| Fiscal | `fiscal_compliance.py` | Angolan taxes (IVA 14%) |
| Notifications | `notifications_module.py` | In-app notifications |
| Tourism | `tourism_router.py` | Tourist places and bookings |
| Properties | `properties_router.py` | Real estate listings |

## Role System
- **Admin**: CEO(4), Admin(3), Suporte(2), Finanças(1)
- **Users**: Normal, Premium
- **Partners**: Básico, Premium, Enterprise

## Implemented Features
- [x] Auth (email/password + Google OAuth)
- [x] Dashboard with notification bell + admin link
- [x] Taxi: vehicle types (standard/comfort/premium), ride request, driver assignment, navigation
- [x] Restaurant: search, filters, menu, cart, checkout, reviews/ratings
- [x] Tourism: listings, detail, bookings
- [x] Real Estate: listings, detail, inquiries
- [x] Payment system: bank transfer with confirmation codes (direct to partner)
- [x] Order tracking with status steps
- [x] Partner system: tiers, analytics dashboard, bank details, wallet
- [x] Accounting: PGCA chart, journal entries, trial balance, balance sheet
- [x] Fiscal: IVA calc, retention, NIF validation
- [x] Admin dashboard: system config, API management, contacts, about, users/roles
- [x] Notifications: in-app, read/unread, mark all read
- [x] User tier management (normal/premium)

## Simulated Features
- Driver assignment (random names)
- Bank accounts (example IBAN/NIF)
- External app integrations (Yango, Heetch, Tupuca)

## Backlog
### P0
- [ ] Integrate IVA into actual order transactions
- [ ] Full system audit

### P1
- [ ] Real payment gateway APIs (Multicaixa, Unitelmoney, BAI Paga)
- [ ] Partner document verification workflow
- [ ] Partner-managed menus and orders

### P2
- [ ] Real-time order tracking (WebSocket)
- [ ] Push notifications
- [ ] Coupon/discount system

### P3
- [ ] External app API integrations
- [ ] Advanced reporting/export
