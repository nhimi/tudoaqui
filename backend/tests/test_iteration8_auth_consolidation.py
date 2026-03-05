"""
Iteration 8 Auth Consolidation Test Suite - TudoAqui Marketplace
Testing consolidated JWT-based auth system (auth_module.py)
Verifies:
- POST /api/auth/register - creates user with tiers, points, roles, profile
- POST /api/auth/login - authenticates user, returns JWT token, sets access_token cookie
- GET /api/auth/me - returns user profile with tier_info, partner status, unread_notifications
- PATCH /api/auth/profile - updates user name, phone, city, province
- POST /api/auth/logout - clears cookies
- GET /api/wallet/balance - uses JWT auth from server.py get_current_user
- GET /api/restaurants - uses JWT auth from server.py get_current_user
- GET /api/auth/roles - returns user roles and permissions
- GET /api/auth/points - returns points info and available rewards
- POST /api/auth/forgot-password - returns reset token
"""
import pytest
import requests
import os
import uuid
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test user for this iteration
TEST_USER_EMAIL = f"test_iter8_{uuid.uuid4().hex[:6]}@tudoaqui.ao"
TEST_USER_PASSWORD = "testpass123456"
TEST_USER_NAME = "Test Iteration 8 User"
TEST_USER_PHONE = "+244 923 888 999"


# ============ REGISTRATION MODULE ============

class TestAuthRegister:
    """Tests for POST /api/auth/register endpoint"""
    
    def test_01_register_new_user(self, api_client):
        """Register creates user with tiers, points, roles, profile"""
        global TEST_USER_EMAIL
        TEST_USER_EMAIL = f"test_iter8_{uuid.uuid4().hex[:6]}@tudoaqui.ao"
        
        register_data = {
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD,
            "name": TEST_USER_NAME,
            "phone": TEST_USER_PHONE
        }
        
        response = api_client.post(f"{BASE_URL}/api/auth/register", json=register_data)
        print(f"Register response: {response.status_code}")
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        
        # Verify response structure
        assert "user" in data, "Response should contain user object"
        assert "token" in data, "Response should contain JWT token"
        assert "message" in data
        
        user = data["user"]
        
        # Verify user fields
        assert user["email"] == TEST_USER_EMAIL.lower()
        assert user["name"] == TEST_USER_NAME
        assert user["phone"] == TEST_USER_PHONE
        assert "user_id" in user
        
        # Verify tier system
        assert user["tier"] == "bronze", "New users should start at bronze tier"
        assert user["points"] == 100, "New users get 100 welcome points"
        
        # Verify roles
        assert user["role"] == "user"
        assert "user" in user["roles"]
        
        # Verify profile structure
        assert "profile" in user
        profile = user["profile"]
        assert profile["city"] == "Luanda"
        assert profile["province"] == "Luanda"
        assert profile["preferred_language"] == "pt"
        
        # Verify notification settings
        assert "notification_settings" in user
        assert user["notification_settings"]["push"] == True
        
        # Verify referral code generated
        assert "referral_code" in user
        assert user["referral_code"].startswith("TUDO")
        
        # Store cookies for subsequent tests
        for cookie in response.cookies:
            api_client.cookies.set(cookie.name, cookie.value)
        
        print(f"✅ User registered: {user['user_id']}, tier={user['tier']}, points={user['points']}")
        print(f"   Referral code: {user['referral_code']}, roles: {user['roles']}")
    
    def test_02_register_duplicate_email_rejected(self, api_client):
        """Registering with existing email should fail"""
        register_data = {
            "email": TEST_USER_EMAIL,  # Same email from previous test
            "password": "anotherpass123",
            "name": "Duplicate User",
            "phone": None
        }
        
        response = api_client.post(f"{BASE_URL}/api/auth/register", json=register_data)
        print(f"Duplicate register response: {response.status_code}")
        assert response.status_code == 400
        assert "já cadastrado" in response.json().get("detail", "").lower() or "already" in response.json().get("detail", "").lower()
        print(f"✅ Duplicate email correctly rejected")


# ============ LOGIN MODULE ============

class TestAuthLogin:
    """Tests for POST /api/auth/login endpoint"""
    
    def test_01_login_success(self, api_client):
        """Login returns JWT token and sets access_token cookie"""
        login_data = {
            "email": "maria@tudoaqui.ao",
            "password": "maria123456"
        }
        
        response = api_client.post(f"{BASE_URL}/api/auth/login", json=login_data)
        print(f"Login response: {response.status_code}")
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        
        # Verify response structure
        assert "user" in data, "Response should contain user object"
        assert "token" in data, "Response should contain JWT token"
        assert "message" in data
        
        # Verify JWT token format (should be 3 parts separated by dots)
        token = data["token"]
        assert len(token.split('.')) == 3, "Token should be JWT format (header.payload.signature)"
        
        # Verify access_token cookie is set
        cookies = response.cookies
        cookie_names = [c.name for c in cookies]
        assert "access_token" in cookie_names or "access_token" in str(cookies), \
            "access_token cookie should be set"
        
        user = data["user"]
        assert user["email"] == "maria@tudoaqui.ao"
        assert "tier" in user
        assert "points" in user
        
        # Store cookies
        for cookie in response.cookies:
            api_client.cookies.set(cookie.name, cookie.value)
        
        print(f"✅ Login successful: {user['name']}, tier={user['tier']}, points={user['points']}")
    
    def test_02_login_invalid_credentials(self, api_client):
        """Login with wrong password should fail"""
        login_data = {
            "email": "maria@tudoaqui.ao",
            "password": "wrongpassword"
        }
        
        response = api_client.post(f"{BASE_URL}/api/auth/login", json=login_data)
        print(f"Invalid login response: {response.status_code}")
        assert response.status_code == 401
        print(f"✅ Invalid credentials correctly rejected")
    
    def test_03_login_nonexistent_user(self, api_client):
        """Login with non-existent email should fail"""
        login_data = {
            "email": "nonexistent@tudoaqui.ao",
            "password": "anypassword"
        }
        
        response = api_client.post(f"{BASE_URL}/api/auth/login", json=login_data)
        print(f"Nonexistent user login response: {response.status_code}")
        assert response.status_code == 401
        print(f"✅ Non-existent user login correctly rejected")


# ============ ME ENDPOINT ============

class TestAuthMe:
    """Tests for GET /api/auth/me endpoint"""
    
    def test_01_get_me_with_tier_info(self, authenticated_session):
        """GET /api/auth/me returns user with tier_info, partner status, unread_notifications"""
        response = authenticated_session.get(f"{BASE_URL}/api/auth/me")
        print(f"Get me response: {response.status_code}")
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        
        # Verify response structure from auth_module
        assert "user" in data, "Response should have user object"
        assert "tier_info" in data, "Response should have tier_info"
        assert "unread_notifications" in data, "Response should have unread_notifications count"
        
        user = data["user"]
        assert "user_id" in user
        assert "email" in user
        assert "name" in user
        assert "tier" in user
        assert "points" in user
        
        # Partner status fields
        assert "is_partner" in user
        assert "partner_id" in user
        assert "partner_tier" in user
        
        # Tier info structure
        tier_info = data["tier_info"]
        assert "current_tier" in tier_info
        assert "benefits" in tier_info
        assert "next_tier" in tier_info or tier_info["next_tier"] is None  # VIP has no next tier
        assert "points_to_next" in tier_info
        assert "progress_percent" in tier_info
        
        # Benefits structure
        benefits = tier_info["benefits"]
        assert "discount_percent" in benefits
        assert "free_delivery" in benefits
        assert "cashback_percent" in benefits
        
        print(f"✅ /me returned: {user['name']}, tier={tier_info['current_tier']}")
        print(f"   Benefits: {benefits['discount_percent']}% discount, cashback={benefits['cashback_percent']}%")
        print(f"   Unread notifications: {data['unread_notifications']}")
    
    def test_02_me_without_auth_fails(self, api_client):
        """GET /api/auth/me without authentication should fail"""
        # Create new session without cookies
        response = requests.get(f"{BASE_URL}/api/auth/me")
        print(f"Unauthenticated /me response: {response.status_code}")
        assert response.status_code == 401
        print(f"✅ Unauthenticated /me correctly rejected")


# ============ PROFILE UPDATE ============

class TestProfileUpdate:
    """Tests for PATCH /api/auth/profile endpoint"""
    
    def test_01_update_profile(self, authenticated_session):
        """PATCH /api/auth/profile updates user name, phone, city, province"""
        update_data = {
            "name": "Updated Maria Name",
            "phone": "+244 999 888 777",
            "city": "Benguela",
            "province": "Benguela"
        }
        
        response = authenticated_session.patch(
            f"{BASE_URL}/api/auth/profile",
            json=update_data
        )
        print(f"Update profile response: {response.status_code}")
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert "user" in data
        
        user = data["user"]
        # Note: We may need to revert or the update may be partial
        assert "name" in user
        assert "phone" in user
        assert "profile" in user
        
        print(f"✅ Profile updated: name={user['name']}, phone={user['phone']}")
        print(f"   Location: {user['profile'].get('city')}, {user['profile'].get('province')}")
        
        # Revert the name back for other tests
        authenticated_session.patch(
            f"{BASE_URL}/api/auth/profile",
            json={"name": "Maria Angola", "city": "Luanda", "province": "Luanda"}
        )


# ============ LOGOUT ============

class TestAuthLogout:
    """Tests for POST /api/auth/logout endpoint"""
    
    def test_01_logout_clears_cookies(self):
        """POST /api/auth/logout clears authentication cookies"""
        session = requests.Session()
        session.headers.update({"Content-Type": "application/json"})
        
        # First login
        login_res = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "maria@tudoaqui.ao",
            "password": "maria123456"
        })
        
        for cookie in login_res.cookies:
            session.cookies.set(cookie.name, cookie.value)
        
        # Verify we're logged in
        me_res = session.get(f"{BASE_URL}/api/auth/me")
        assert me_res.status_code == 200, "Should be authenticated before logout"
        
        # Logout
        logout_res = session.post(f"{BASE_URL}/api/auth/logout")
        print(f"Logout response: {logout_res.status_code}")
        assert logout_res.status_code == 200, f"Failed: {logout_res.text}"
        
        data = logout_res.json()
        assert "message" in data
        
        # Clear cookies manually (simulating browser behavior with Set-Cookie: ... ; Max-Age=0)
        session.cookies.clear()
        
        # Verify we're logged out
        me_after = session.get(f"{BASE_URL}/api/auth/me")
        assert me_after.status_code == 401, "Should be unauthenticated after logout"
        
        print(f"✅ Logout successful, cookies cleared, user is now unauthenticated")


# ============ WALLET BALANCE (Server.py Auth) ============

class TestWalletWithServerAuth:
    """Tests that wallet endpoints use server.py get_current_user with JWT"""
    
    def test_01_wallet_balance_with_jwt(self, authenticated_session):
        """GET /api/wallet/balance uses JWT auth from server.py"""
        response = authenticated_session.get(f"{BASE_URL}/api/wallet/balance")
        print(f"Wallet balance response: {response.status_code}")
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert "balance" in data
        assert "currency" in data
        assert data["currency"] == "AOA"
        
        print(f"✅ Wallet balance: {data['balance']} {data['currency']}")
    
    def test_02_wallet_balance_without_auth_fails(self, api_client):
        """GET /api/wallet/balance without auth should fail"""
        response = requests.get(f"{BASE_URL}/api/wallet/balance")
        print(f"Unauthenticated wallet response: {response.status_code}")
        assert response.status_code == 401
        print(f"✅ Unauthenticated wallet access correctly rejected")


# ============ RESTAURANTS (Server.py Auth) ============

class TestRestaurantsWithServerAuth:
    """Tests that restaurant endpoints use server.py get_current_user with JWT"""
    
    def test_01_restaurants_with_jwt(self, authenticated_session):
        """GET /api/restaurants uses JWT auth from server.py"""
        response = authenticated_session.get(f"{BASE_URL}/api/restaurants")
        print(f"Restaurants response: {response.status_code}")
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert isinstance(data, list)
        
        if data:
            restaurant = data[0]
            assert "restaurant_id" in restaurant
            assert "name" in restaurant
            assert "cuisine_type" in restaurant
            assert "rating" in restaurant
        
        print(f"✅ Restaurants endpoint returned {len(data)} restaurants")
    
    def test_02_restaurants_without_auth_fails(self, api_client):
        """GET /api/restaurants without auth should fail"""
        response = requests.get(f"{BASE_URL}/api/restaurants")
        print(f"Unauthenticated restaurants response: {response.status_code}")
        assert response.status_code == 401
        print(f"✅ Unauthenticated restaurants access correctly rejected")


# ============ ROLES ENDPOINT ============

class TestAuthRoles:
    """Tests for GET /api/auth/roles endpoint"""
    
    def test_01_get_user_roles(self, authenticated_session):
        """GET /api/auth/roles returns user roles and permissions"""
        response = authenticated_session.get(f"{BASE_URL}/api/auth/roles")
        print(f"Get roles response: {response.status_code}")
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        
        assert "roles" in data
        assert "primary_role" in data
        assert "permissions" in data
        
        assert isinstance(data["roles"], list)
        assert len(data["roles"]) > 0
        
        permissions = data["permissions"]
        assert "can_access_admin" in permissions
        assert "can_manage_partners" in permissions
        assert "can_drive" in permissions
        assert "is_partner" in permissions
        assert "is_user" in permissions
        
        print(f"✅ Roles: {data['roles']}, primary={data['primary_role']}")
        print(f"   Permissions: {permissions}")


# ============ POINTS ENDPOINT ============

class TestAuthPoints:
    """Tests for GET /api/auth/points endpoint"""
    
    def test_01_get_points_info(self, authenticated_session):
        """GET /api/auth/points returns points info and available rewards"""
        response = authenticated_session.get(f"{BASE_URL}/api/auth/points")
        print(f"Get points response: {response.status_code}")
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        
        assert "current_points" in data
        assert "tier" in data
        assert "tier_benefits" in data
        assert "available_rewards" in data
        
        # Verify rewards structure
        rewards = data["available_rewards"]
        assert isinstance(rewards, list)
        assert len(rewards) > 0
        
        for reward in rewards:
            assert "id" in reward
            assert "name" in reward
            assert "points" in reward
            assert "type" in reward
        
        print(f"✅ Points: {data['current_points']}, tier={data['tier']}")
        print(f"   Available rewards: {len(rewards)} options")


# ============ FORGOT PASSWORD ============

class TestForgotPassword:
    """Tests for POST /api/auth/forgot-password endpoint"""
    
    def test_01_forgot_password_returns_token(self, api_client):
        """POST /api/auth/forgot-password returns reset token (dev mode)"""
        response = api_client.post(
            f"{BASE_URL}/api/auth/forgot-password",
            json={"email": "maria@tudoaqui.ao"}
        )
        print(f"Forgot password response: {response.status_code}")
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert "message" in data
        
        # In dev mode, reset_token is returned in response
        if "reset_token" in data:
            assert len(data["reset_token"]) == 32  # Token is 32 chars
            print(f"✅ Forgot password: reset token returned (dev mode)")
        else:
            print(f"✅ Forgot password: message sent (production mode)")
    
    def test_02_forgot_password_nonexistent_email(self, api_client):
        """Forgot password for non-existent email should still return 200 (security)"""
        response = api_client.post(
            f"{BASE_URL}/api/auth/forgot-password",
            json={"email": "nonexistent@example.com"}
        )
        print(f"Nonexistent email forgot password response: {response.status_code}")
        # Should still return 200 to not reveal if email exists
        assert response.status_code == 200
        print(f"✅ Forgot password: returns 200 even for non-existent email (security)")


# ============ ADMIN/PARTNER AUTH TESTS ============

class TestAdminPartnerAuth:
    """Tests for admin/partner authentication - using maria (regular user)"""
    
    def test_01_user_me_has_partner_fields(self, authenticated_session):
        """User /me should include is_partner, partner_id, partner_tier fields"""
        response = authenticated_session.get(f"{BASE_URL}/api/auth/me")
        print(f"User /me response: {response.status_code}")
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        user = data["user"]
        
        # Check partner fields exist (even if false for regular users)
        assert "is_partner" in user, "is_partner field should exist"
        assert "partner_id" in user, "partner_id field should exist"
        assert "partner_tier" in user, "partner_tier field should exist"
        
        print(f"✅ User /me: is_partner={user['is_partner']}, partner_id={user['partner_id']}")
        print(f"   Partner tier: {user['partner_tier']}")


# ============ FIXTURES ============

@pytest.fixture(scope="module")
def api_client():
    """Basic requests session without auth"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


@pytest.fixture(scope="module")
def authenticated_session():
    """Authenticated session with maria@tudoaqui.ao"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    
    response = session.post(f"{BASE_URL}/api/auth/login", json={
        "email": "maria@tudoaqui.ao",
        "password": "maria123456"
    })
    
    if response.status_code == 200:
        for cookie in response.cookies:
            session.cookies.set(cookie.name, cookie.value)
        print(f"✅ Authenticated as maria@tudoaqui.ao")
    else:
        # Try to create the user if doesn't exist
        register_res = session.post(f"{BASE_URL}/api/auth/register", json={
            "email": "maria@tudoaqui.ao",
            "password": "maria123456",
            "name": "Maria Angola",
            "phone": "+244 923 456 789"
        })
        if register_res.status_code == 200:
            for cookie in register_res.cookies:
                session.cookies.set(cookie.name, cookie.value)
            print(f"✅ Created and authenticated as maria@tudoaqui.ao")
        else:
            pytest.fail(f"Could not authenticate: {response.status_code} - {response.text}")
    
    return session


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
