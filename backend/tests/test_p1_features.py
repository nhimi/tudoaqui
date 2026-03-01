"""
P1 Features Test Suite for TudoAqui Marketplace Angola
Tests for: Auth, Restaurants (search/filters), Fiscal compliance, User tier, Partner system, Accounting module
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test unique email for this run
TEST_EMAIL = f"test_p1_{uuid.uuid4().hex[:8]}@tudoaqui.ao"
TEST_PASSWORD = "test123"
TEST_NAME = "P1 Test User"

class TestAuthenticationFlow:
    """Authentication endpoint tests"""
    session_token = None
    user_id = None
    
    def test_01_register_user(self):
        """Test user registration"""
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD,
            "name": TEST_NAME
        })
        print(f"Register response: {response.status_code}")
        assert response.status_code == 200, f"Registration failed: {response.text}"
        
        data = response.json()
        assert "user" in data
        assert data["user"]["email"] == TEST_EMAIL
        TestAuthenticationFlow.user_id = data["user"]["user_id"]
        
        # Save session cookie
        if "session_token" in response.cookies:
            TestAuthenticationFlow.session_token = response.cookies.get("session_token")
        print(f"✅ User registered: {data['user']['user_id']}")
    
    def test_02_login_user(self):
        """Test user login"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        print(f"Login response: {response.status_code}")
        assert response.status_code == 200, f"Login failed: {response.text}"
        
        data = response.json()
        assert "user" in data
        assert data["user"]["email"] == TEST_EMAIL
        
        # Save session token
        if "session_token" in response.cookies:
            TestAuthenticationFlow.session_token = response.cookies.get("session_token")
        print(f"✅ User logged in successfully")
    
    def test_03_invalid_login(self):
        """Test login with invalid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "nonexistent@test.com",
            "password": "wrongpassword"
        })
        assert response.status_code == 401


class TestUserTierSystem:
    """User tier management tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self, auth_session):
        self.session = auth_session
    
    def test_01_get_user_tier(self, auth_session):
        """GET /api/user/tier - returns current tier (default: normal)"""
        response = auth_session.get(f"{BASE_URL}/api/user/tier")
        print(f"User tier response: {response.status_code} - {response.text}")
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert "current_tier" in data
        assert data["current_tier"] in ["normal", "premium"]
        print(f"✅ User tier: {data['current_tier']}")
    
    def test_02_get_tier_options(self, auth_session):
        """GET /api/partners/tiers - returns available tiers"""
        response = auth_session.get(f"{BASE_URL}/api/partners/tiers")
        print(f"Tiers response: {response.status_code}")
        assert response.status_code == 200
        
        data = response.json()
        assert "user_tiers" in data
        assert "normal" in data["user_tiers"]
        assert "premium" in data["user_tiers"]
        print(f"✅ Tier options: {list(data['user_tiers'].keys())}")
    
    def test_03_upgrade_to_premium(self, auth_session):
        """POST /api/partners/user-tier/upgrade - upgrade to premium"""
        response = auth_session.post(f"{BASE_URL}/api/partners/user-tier/upgrade", json={
            "tier": "premium"
        })
        print(f"Upgrade response: {response.status_code} - {response.text}")
        assert response.status_code == 200, f"Upgrade failed: {response.text}"
        
        data = response.json()
        assert data["new_tier"] == "premium"
        print(f"✅ User upgraded to premium")
    
    def test_04_verify_premium_tier(self, auth_session):
        """Verify tier was upgraded"""
        response = auth_session.get(f"{BASE_URL}/api/user/tier")
        assert response.status_code == 200
        
        data = response.json()
        assert data["current_tier"] == "premium"
        print(f"✅ Premium tier verified")
    
    def test_05_downgrade_to_normal(self, auth_session):
        """POST /api/partners/user-tier/upgrade - downgrade to normal"""
        response = auth_session.post(f"{BASE_URL}/api/partners/user-tier/upgrade", json={
            "tier": "normal"
        })
        print(f"Downgrade response: {response.status_code}")
        assert response.status_code == 200
        
        data = response.json()
        assert data["new_tier"] == "normal"
        print(f"✅ User downgraded to normal")


class TestRestaurantSearch:
    """Restaurant search and filtering tests"""
    
    def test_01_get_restaurants(self, auth_session):
        """GET /api/restaurants - returns restaurant list"""
        response = auth_session.get(f"{BASE_URL}/api/restaurants")
        print(f"Restaurants response: {response.status_code}")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        
        # Check restaurant structure
        restaurant = data[0]
        assert "restaurant_id" in restaurant
        assert "name" in restaurant
        assert "cuisine_type" in restaurant
        print(f"✅ Found {len(data)} restaurants")
    
    def test_02_search_restaurants_by_query(self, auth_session):
        """GET /api/restaurants/search?q=grill - search restaurants"""
        response = auth_session.get(f"{BASE_URL}/api/restaurants/search", params={"q": "grill"})
        print(f"Search response: {response.status_code} - {response.text}")
        assert response.status_code == 200
        
        data = response.json()
        assert "restaurants" in data
        assert "cuisines" in data
        print(f"✅ Search returned {len(data['restaurants'])} results, cuisines: {data['cuisines']}")
    
    def test_03_filter_by_cuisine(self, auth_session):
        """GET /api/restaurants/search?cuisine=Angolana - filter by cuisine"""
        response = auth_session.get(f"{BASE_URL}/api/restaurants/search", params={"cuisine": "Angolana"})
        print(f"Cuisine filter response: {response.status_code}")
        assert response.status_code == 200
        
        data = response.json()
        assert "restaurants" in data
        # All results should have the specified cuisine
        for r in data["restaurants"]:
            assert "angolana" in r["cuisine_type"].lower()
        print(f"✅ Cuisine filter returned {len(data['restaurants'])} results")
    
    def test_04_search_and_filter_combined(self, auth_session):
        """GET /api/restaurants/search with both query and cuisine"""
        response = auth_session.get(f"{BASE_URL}/api/restaurants/search", params={
            "q": "restaurante",
            "cuisine": "all"
        })
        assert response.status_code == 200
        
        data = response.json()
        assert "restaurants" in data
        print(f"✅ Combined search/filter works")


class TestFiscalCompliance:
    """Angolan fiscal compliance tests"""
    
    def test_01_calculate_iva(self, auth_session):
        """GET /api/fiscal/iva-calculate?amount=10000 - calculates 14% IVA"""
        response = auth_session.get(f"{BASE_URL}/api/fiscal/iva-calculate", params={"amount": 10000})
        print(f"IVA response: {response.status_code} - {response.text}")
        assert response.status_code == 200
        
        data = response.json()
        assert "base_amount" in data
        assert data["base_amount"] == 10000
        assert data["iva_rate"] == 0.14
        assert data["iva_amount"] == 1400  # 14% of 10000
        assert data["total_with_iva"] == 11400
        print(f"✅ IVA calculated: {data['iva_amount']} Kz (14% of {data['base_amount']})")
    
    def test_02_get_fiscal_rules(self, auth_session):
        """GET /api/fiscal/rules - returns Angolan fiscal rules"""
        response = auth_session.get(f"{BASE_URL}/api/fiscal/rules")
        print(f"Fiscal rules response: {response.status_code}")
        assert response.status_code == 200
        
        data = response.json()
        assert "rules" in data
        assert "iva_rates" in data
        assert data["iva_rates"]["normal"] == 0.14
        print(f"✅ Fiscal rules retrieved: {list(data['rules'].keys())}")
    
    def test_03_validate_nif_valid(self, auth_session):
        """POST /api/fiscal/validate-nif - validates NIF"""
        response = auth_session.post(f"{BASE_URL}/api/fiscal/validate-nif", json={
            "nif": "123456789"
        })
        print(f"NIF validation response: {response.status_code} - {response.text}")
        assert response.status_code == 200
        
        data = response.json()
        assert "is_valid" in data
        assert data["is_valid"] == True
        print(f"✅ NIF validation: {data['nif']} is valid={data['is_valid']}")
    
    def test_04_validate_nif_invalid(self, auth_session):
        """Validate invalid NIF (too short)"""
        response = auth_session.post(f"{BASE_URL}/api/fiscal/validate-nif", json={
            "nif": "123"
        })
        assert response.status_code == 200
        
        data = response.json()
        assert data["is_valid"] == False
        print(f"✅ Short NIF correctly rejected")
    
    def test_05_commission_calculate(self, auth_session):
        """GET /api/fiscal/commission-calculate - commission with taxes"""
        response = auth_session.get(f"{BASE_URL}/api/fiscal/commission-calculate", params={
            "amount": 100000,
            "commission_rate": 0.10
        })
        print(f"Commission response: {response.status_code} - {response.text}")
        assert response.status_code == 200
        
        data = response.json()
        assert "commission_base" in data
        assert "iva_amount" in data
        assert "net_to_partner" in data
        print(f"✅ Commission calculated: {data['commission_base']} Kz")


class TestPartnerSystem:
    """Partner registration and dashboard tests"""
    partner_id = None
    
    def test_01_register_partner(self, auth_session):
        """POST /api/partners/register - creates partner with basico tier"""
        response = auth_session.post(f"{BASE_URL}/api/partners/register", json={
            "business_name": f"Test Business {uuid.uuid4().hex[:6]}",
            "business_type": "restaurant"
        })
        print(f"Partner register response: {response.status_code} - {response.text}")
        assert response.status_code == 200, f"Partner registration failed: {response.text}"
        
        data = response.json()
        assert "partner_id" in data
        assert data["status"] == "pending"
        TestPartnerSystem.partner_id = data["partner_id"]
        print(f"✅ Partner registered: {data['partner_id']}")
    
    def test_02_get_partner_dashboard(self, auth_session):
        """GET /api/partners/dashboard - returns partner statistics"""
        response = auth_session.get(f"{BASE_URL}/api/partners/dashboard")
        print(f"Dashboard response: {response.status_code} - {response.text}")
        assert response.status_code == 200
        
        data = response.json()
        assert "partner" in data
        assert "stats" in data
        assert "tier_info" in data
        assert data["partner"]["tier"] == "basico"
        print(f"✅ Partner dashboard loaded, tier: {data['partner']['tier']}")


class TestAccountingModule:
    """PGCA Accounting module tests"""
    entry_id = None
    
    def test_01_get_chart_of_accounts(self, auth_session):
        """GET /api/accounting/chart-of-accounts - returns PGCA chart"""
        response = auth_session.get(f"{BASE_URL}/api/accounting/chart-of-accounts")
        print(f"Chart response: {response.status_code}")
        assert response.status_code == 200
        
        data = response.json()
        assert "chart_of_accounts" in data
        assert "by_class" in data
        assert "class_names" in data
        
        # Verify PGCA account codes
        chart = data["chart_of_accounts"]
        assert "11" in chart  # Caixa
        assert "21" in chart  # Clientes
        assert "71" in chart  # Vendas
        print(f"✅ Chart of accounts loaded: {len(chart)} accounts")
    
    def test_02_create_journal_entry(self, auth_session):
        """POST /api/accounting/journal-entry - creates balanced journal entry"""
        # First ensure we have a partner (from previous test)
        response = auth_session.post(f"{BASE_URL}/api/accounting/journal-entry", json={
            "description": "Test sale entry",
            "reference": "FT 2026/000001",
            "lines": [
                {"account_code": "11", "debit": 1000, "credit": 0},  # Caixa (debit)
                {"account_code": "71", "debit": 0, "credit": 1000}   # Vendas (credit)
            ]
        })
        print(f"Journal entry response: {response.status_code} - {response.text}")
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert "entry_id" in data
        TestAccountingModule.entry_id = data["entry_id"]
        print(f"✅ Journal entry created: {data['entry_id']}")
    
    def test_03_journal_entry_must_balance(self, auth_session):
        """Journal entry with unbalanced debits/credits should fail"""
        response = auth_session.post(f"{BASE_URL}/api/accounting/journal-entry", json={
            "description": "Unbalanced entry",
            "lines": [
                {"account_code": "11", "debit": 1000, "credit": 0},
                {"account_code": "71", "debit": 0, "credit": 500}  # Doesn't balance!
            ]
        })
        print(f"Unbalanced entry response: {response.status_code}")
        assert response.status_code == 400
        print(f"✅ Unbalanced entry correctly rejected")
    
    def test_04_get_trial_balance(self, auth_session):
        """GET /api/accounting/trial-balance - returns trial balance"""
        response = auth_session.get(f"{BASE_URL}/api/accounting/trial-balance")
        print(f"Trial balance response: {response.status_code} - {response.text}")
        assert response.status_code == 200
        
        data = response.json()
        assert "trial_balance" in data
        assert "summary" in data
        print(f"✅ Trial balance retrieved: {len(data['trial_balance'])} accounts")
    
    def test_05_get_balance_sheet(self, auth_session):
        """GET /api/accounting/balance-sheet - returns balance sheet"""
        response = auth_session.get(f"{BASE_URL}/api/accounting/balance-sheet")
        print(f"Balance sheet response: {response.status_code}")
        assert response.status_code == 200
        
        data = response.json()
        assert "balance_sheet" in data
        assert "ativo" in data["balance_sheet"]
        assert "passivo" in data["balance_sheet"]
        print(f"✅ Balance sheet retrieved")
    
    def test_06_get_journal(self, auth_session):
        """GET /api/accounting/journal - returns journal entries"""
        response = auth_session.get(f"{BASE_URL}/api/accounting/journal")
        print(f"Journal response: {response.status_code}")
        assert response.status_code == 200
        
        data = response.json()
        assert "journal" in data
        assert len(data["journal"]) > 0  # Should have at least our test entry
        print(f"✅ Journal retrieved: {len(data['journal'])} entries")


# Fixtures
@pytest.fixture(scope="module")
def auth_session():
    """Create authenticated session for tests"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    
    # Register or login test user
    email = f"test_session_{uuid.uuid4().hex[:8]}@tudoaqui.ao"
    
    # Try to register
    response = session.post(f"{BASE_URL}/api/auth/register", json={
        "email": email,
        "password": "test123",
        "name": "Test Session User"
    })
    
    if response.status_code != 200:
        # Maybe already exists, try login
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@tudoaqui.ao",
            "password": "test123"
        })
    
    if response.status_code == 200:
        cookies = response.cookies
        for cookie in cookies:
            session.cookies.set(cookie.name, cookie.value)
    
    # Also try to register as partner for accounting tests
    session.post(f"{BASE_URL}/api/partners/register", json={
        "business_name": f"Test Partner {uuid.uuid4().hex[:6]}",
        "business_type": "restaurant"
    })
    
    return session


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
