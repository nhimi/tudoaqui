# TudoAqui Marketplace - PRD (Product Requirements Document)

## Original Problem Statement
Build a comprehensive marketplace app for Angola called **TudoAqui**, developed by **Sincesoft-Sinceridade Service**.

### Core Modules
1. **Taxi** - Price comparison with existing apps (Yango, Heetch, Ugo, Tupuca), interactive GPS map
2. **Restaurant** - Integration with delivery systems, menu browsing, ordering
3. **Tourism** - Directory for tourist spots with information, pricing, reservations
4. **Real Estate (Mixeiro)** - B2B/B2C platform for renting/selling properties
5. **Payments** - Angolan payment systems (Multicaixa Express, Unitelmoney, BAI Paga)
6. **Partner System** - B2B/B2C with tier management, wallet, service control
7. **Accounting** - PGCA-based accounting (Journal, Ledger, Trial Balance, Balance Sheet)
8. **Fiscal Compliance** - Angolan fiscal regulations (IVA 14%, retention, industrial tax)

### User Personas
- **Regular Users**: Browse services, order food, book taxis, find properties
- **Premium Users**: Discounts, no service fees, priority support
- **Partners (Básico/Premium/Enterprise)**: Business owners managing services on the platform

## Architecture
- **Frontend**: React, React Router, Tailwind CSS, Shadcn UI, react-leaflet
- **Backend**: FastAPI, Motor (async MongoDB), Pydantic
- **Database**: MongoDB
- **Auth**: Session-based + Emergent Google OAuth

## What's Been Implemented

### Completed Features
- [x] User authentication (email/password + Google OAuth)
- [x] Landing page with TudoAqui branding
- [x] Dashboard with quick actions
- [x] Taxi module with interactive map (react-leaflet), price comparison
- [x] Restaurant module with search, cuisine filters, menu, ordering, checkout
- [x] Tourism module with listings, detail pages, booking
- [x] Real Estate module with property listings, detail, inquiries
- [x] Partner registration and dashboard
- [x] Partner tier system (Básico/Premium/Enterprise)
- [x] User tier system (Normal/Premium) with upgrade/downgrade
- [x] Accounting module (PGCA chart of accounts, journal entries, trial balance, balance sheet, income statement)
- [x] Journal entry creation form
- [x] Fiscal compliance calculations (IVA, retention, industrial tax)
- [x] Bottom navigation
- [x] Profile page with tier management

### Mocked/Simulated Features
- Payment gateways (Multicaixa Express, Unitelmoney, BAI Paga)
- External app integrations (Yango, Heetch, Tupuca)
- Taxi price comparison (random simulation)
- Order tracking/status updates

## Backlog

### P0 - System Audit & Fiscal Integration
- [ ] Integrate fiscal compliance into partner transactions
- [ ] Full end-to-end system audit
- [ ] Apply IVA to orders and partner commissions

### P1 - Core Logic Enhancement
- [ ] Implement real payment gateway integrations (requires API keys)
- [ ] External app integrations (Tupuca, Mano - requires API keys)
- [ ] Partner document verification workflow
- [ ] Define and implement Premium user feature restrictions

### P2 - UI/UX Polish
- [ ] Restaurant module: order tracking with status updates
- [ ] Restaurant module: ratings and reviews
- [ ] Partner dashboard: analytics page
- [ ] Partner services management page

### P3 - Refactoring
- [ ] Move Tourism routes from server.py to tourism_router.py
- [ ] Move Properties routes from server.py to properties_router.py

## Key API Endpoints
- Auth: `/api/auth/register`, `/api/auth/login`, `/api/auth/session`, `/api/auth/me`
- Taxi: `/api/rides/compare`, `/api/taxi/navigation-route`
- Restaurants: `/api/restaurants`, `/api/restaurants/search`, `/api/restaurants/{id}/menu`
- Orders: `/api/orders`
- Tourism: `/api/tourist-places`, `/api/bookings`
- Properties: `/api/properties`, `/api/property-inquiries`
- Partners: `/api/partners/register`, `/api/partners/dashboard`, `/api/partners/user-tier/upgrade`
- Accounting: `/api/accounting/journal-entry`, `/api/accounting/trial-balance`, `/api/accounting/balance-sheet`
- Fiscal: `/api/fiscal/iva-calculate`, `/api/fiscal/rules`, `/api/fiscal/validate-nif`

## Database Collections
users, user_sessions, restaurants, menu_items, orders, tourist_places, bookings, properties, property_inquiries, partners, partner_wallets, transactions, service_listings, accounting_records, journal_entries, journal_lines, app_connections, rides
