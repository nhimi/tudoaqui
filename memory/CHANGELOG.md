# TudoAqui - CHANGELOG

## March 5, 2026 - Auth Consolidation & Module Interactivity (Iteration 8-9)

### P0 - Auth Consolidation (COMPLETED)
- Unified dual auth systems (server.py session_token + auth_module.py JWT) into single JWT-based system
- Removed duplicate auth routes from server.py (register, login, me, logout, session)
- Updated server.py `get_current_user()` to check JWT access_token first, session_token fallback
- Added Google OAuth session exchange endpoint to auth_module.py
- Fixed wallet_module.py to use JWT-based auth via server.py import
- Updated ProtectedRoute.jsx to handle nested `{user: {...}, tier_info: {...}}` response
- Fixed password field compatibility (password vs password_hash)
- Added `app.state.db` for modules using `request.app.state.db`
- **Tests**: 18 backend + 11 frontend = 100% pass (iteration 8)

### P1 - Module Interactivity (COMPLETED)
- Tuendi ride completion now awards points (1 per 50 Kz), creates wallet transactions, sends notifications
- Tuendi delivery completion same interactivity flow
- Restaurant order delivery ("entregue") awards points with notifications
- Chat functionality verified (send/receive messages for rides/deliveries)
- **Tests**: 14 backend + all frontend UI = 100% pass (iteration 9)

### Files Modified
- `backend/server.py` - Auth routes removed, get_current_user updated for JWT, order completion interactivity
- `backend/auth_module.py` - Google OAuth session exchange added, password compat, partner info in /me
- `backend/wallet_module.py` - Auth updated to use server.py get_current_user
- `backend/tuendi_module.py` - Ride/delivery completion awards points, wallet txns, notifications
- `frontend/src/components/ProtectedRoute.jsx` - Handles nested user response from auth_module
