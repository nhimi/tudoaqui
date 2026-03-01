# TudoAqui Marketplace - PRD

## Original Problem Statement
Build a comprehensive marketplace app for Angola called **TudoAqui**, developed by **Sincesoft-Sinceridade Service**.

### Core Modules
1. **Taxi** - Price comparison with interactive GPS map (react-leaflet)
2. **Restaurant** - Menu browsing, ordering, checkout with payment, reviews/ratings
3. **Tourism** - Directory for tourist spots with booking
4. **Real Estate (Mixeiro)** - B2B/B2C platform for renting/selling properties
5. **Payments** - Temporary bank transfer system with confirmation codes
6. **Partner System** - B2B/B2C with tier management, wallet, service control
7. **Accounting** - PGCA-based accounting (Journal, Trial Balance, Balance Sheet)
8. **Fiscal Compliance** - Angolan fiscal regulations (IVA 14%, retention)

## Architecture
- **Frontend**: React, React Router, Tailwind CSS, Shadcn UI, react-leaflet
- **Backend**: FastAPI (modular routers), Motor (async MongoDB), Pydantic
- **Database**: MongoDB
- **Auth**: Session-based + Emergent Google OAuth

### Backend Modules
- `server.py` - Main API (auth, restaurants, orders, reviews, fiscal, backward compat routes)
- `payments_module.py` - Bank transfer payments with confirmation codes
- `partners_module.py` - Partner B2B system and user tier management
- `accounting_module.py` - PGCA accounting module
- `fiscal_compliance.py` - Angolan tax calculations
- `tourism_router.py` - Tourist places and bookings
- `properties_router.py` - Real estate listings and inquiries

## What's Been Implemented

### Completed Features (Feb 2026)
- [x] User auth (email/password + Google OAuth)
- [x] Dashboard with quick actions
- [x] Taxi module with interactive map, price comparison
- [x] Restaurant module with search, cuisine filters, menu, ordering, checkout
- [x] Restaurant reviews and ratings system
- [x] Tourism module with listings, detail, booking
- [x] Real Estate module with property listings, detail, inquiries
- [x] Partner registration and dashboard with tiers
- [x] User tier system (Normal/Premium) with upgrade/downgrade
- [x] Accounting module (PGCA chart, journal entries, trial balance, balance sheet)
- [x] Journal entry creation form
- [x] Fiscal compliance calculations (IVA, retention, industrial tax)
- [x] **Payment system via bank transfer with confirmation codes**
- [x] **Order tracking with status steps (confirmado -> preparando -> a_caminho -> entregue)**
- [x] **Restaurant reviews/ratings**
- [x] **Backend refactored** (tourism, properties extracted to separate routers)

### Payment Flow
1. User creates order -> payment created with unique 8-char code
2. Bank details displayed (BAI IBAN, NIF, or Unitel Money phone)
3. User makes transfer, enters confirmation code
4. Payment confirmed -> order status updated

### Simulated Features
- Bank transfer verification (code matching only, no real bank API)
- Bank account details are example data
- External app integrations (Yango, Heetch, Tupuca)

## Backlog

### P0 - Remaining
- [ ] Integrate fiscal compliance into actual partner transactions (IVA on orders)
- [ ] Full end-to-end system audit

### P1 - Core
- [ ] Real payment gateway integration (Multicaixa Express API, Unitelmoney API, BAI Paga API) - requires API keys
- [ ] Partner document verification workflow
- [ ] Premium user feature restrictions enforcement
- [ ] Partner analytics dashboard

### P2 - Enhancements
- [ ] Restaurant: order tracking real-time updates
- [ ] Push notifications for order status changes
- [ ] Partner: manage incoming orders

### P3 - Future
- [ ] External app integrations (Tupuca, Mano)
- [ ] Fully flesh out Restaurant module (partner-managed menus)

## Key Endpoints
- Auth: `/api/auth/register`, `/api/auth/login`, `/api/auth/session`
- Restaurants: `/api/restaurants`, `/api/restaurants/search`, `/api/restaurants/{id}/menu`
- Orders: `/api/orders`, `PATCH /api/orders/{id}/status`
- Reviews: `POST /api/reviews`, `GET /api/reviews/{restaurant_id}`
- Payments: `POST /api/payments/create`, `POST /api/payments/confirm`, `GET /api/payments/bank-accounts`
- Tourism: `/api/tourist-places`, `/api/bookings`
- Properties: `/api/properties`, `/api/property-inquiries`
- Partners: `/api/partners/register`, `/api/partners/dashboard`, `/api/partners/user-tier/upgrade`
- Accounting: `/api/accounting/journal-entry`, `/api/accounting/trial-balance`
- Fiscal: `/api/fiscal/iva-calculate`, `/api/fiscal/rules`
