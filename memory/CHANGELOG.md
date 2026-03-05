# TudoAqui - CHANGELOG

## March 5, 2026 - Auth Consolidation & Module Interactivity (Iteration 8-9)

### P0 - Auth Consolidation (COMPLETED)
- Unified dual auth systems into single JWT-based system
- Removed duplicate auth routes from server.py
- Updated get_current_user() for JWT, session_token fallback
- Google OAuth session exchange in auth_module.py
- Fixed wallet_module.py, ProtectedRoute.jsx for new auth
- **Tests**: 18 backend + 11 frontend = 100% (iteration 8)

### P1 - Module Interactivity (COMPLETED)
- Ride/delivery/order completion → points + wallet transactions + notifications
- Chat functionality verified
- **Tests**: 14 backend + all frontend = 100% (iteration 9)

## March 5, 2026 - Coupons, Streak, Payments, Reports, Role UI (Iteration 10)

### P0 - Sistema de Cupons Avançado (COMPLETED)
- Universal coupon system: percent, fixed, free_delivery types
- Tier-locked coupons (e.g. VIP500 requires gold+)
- Usage limits per user, min order amount, expiry dates
- Admin CRUD, user listing and validation
- Seeded: TUENDI20, COMIDA10, ENTREGAGRATIS, VIP500

### P0 - Sistema de Streak Diário (COMPLETED)
- Daily check-in with auto-streak on Dashboard load
- Milestones: 3d=2x (50pts), 7d=3x (150pts), 14d=5x (400pts), 30d=10x (1000pts)
- Leaderboard endpoint, streak badge on Dashboard

### P1 - Gateway de Pagamento Simulado (COMPLETED)
- 4 methods: Multicaixa Express, Unitel Money, BAI Paga, Transferência Bancária
- Full flow: select method → generate reference + code → confirm with code
- Payment history with status tracking

### P1 - Exportação de Relatórios (COMPLETED)
- Admin: sales summary (JSON) + CSV with IVA 14%
- Partner: sales summary + CSV
- User: history summary + CSV
- Period filters: today/week/month/quarter/year

### P2 - UI/UX + Role Restrictions (COMPLETED)
- Dashboard: streak badge, quick tools (Cupons, Pagar, Convidar, Relatórios)
- Admin button visible only for admin role
- Partner analytics only for partners
- Admin reports card only for admins
- **Tests**: 27 backend + all frontend = 100% (iteration 10)

### New Files Created
- `backend/coupon_module.py` - Universal coupon system
- `backend/streak_module.py` - Daily streak with milestones
- `backend/reports_module.py` - CSV + JSON report exports
- `frontend/src/pages/CouponsPage.jsx` - Coupons listing and validation
- `frontend/src/pages/PaymentsPage.jsx` - Payment gateway UI
- `frontend/src/pages/ReportsPage.jsx` - Reports with CSV export

### Modified Files
- `backend/server.py` - Added coupon, streak, reports routers
- `backend/payments_module.py` - Enhanced with 4 payment methods
- `frontend/src/App.js` - Added routes for coupons, payments, reports
- `frontend/src/pages/Dashboard.jsx` - Streak badge, quick tools, role-based UI
