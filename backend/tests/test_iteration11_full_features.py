"""
Test Suite: Iteration 11 - Full Feature Coverage
Tests all major modules after refactoring:
- Auth: register, login, /api/auth/me
- Rides module (refactored): connected-apps, compare, request, rides, status update
- Restaurants module (refactored): restaurants, search, menu, orders, reviews
- Backward compat routes: tourist-places, properties, bookings, property-inquiries
- Other modules: wallet, coupons, streak, notifications, payments
"""

import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://super-app-hybrid.preview.emergentagent.com').rstrip('/')

# Generate unique test user for this run
TEST_EMAIL = f"pytest_iter11_{uuid.uuid4().hex[:6]}@test.com"
TEST_PASSWORD = "test123456"
TEST_NAME = "Pytest Iter11 User"


@pytest.fixture(scope="module")
def session():
    """Create a requests session"""
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def auth_data(session):
    """Register and login to get auth token and user data"""
    # Register new user
    resp = session.post(f"{BASE_URL}/api/auth/register", json={
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD,
        "name": TEST_NAME
    })
    assert resp.status_code == 200, f"Register failed: {resp.text}"
    data = resp.json()
    token = data.get("token")
    user = data.get("user")
    assert token, "No token in register response"
    assert user, "No user in register response"
    return {"token": token, "user": user}


@pytest.fixture(scope="module")
def headers(auth_data):
    """Auth headers for API calls"""
    return {"Authorization": f"Bearer {auth_data['token']}", "Content-Type": "application/json"}


# ==================== AUTH MODULE TESTS ====================

class TestAuthModule:
    """Test auth_module.py endpoints"""

    def test_register_returns_user_and_token(self, auth_data):
        """Verify register returns correct user data"""
        assert auth_data["user"]["email"] == TEST_EMAIL.lower()
        assert auth_data["user"]["name"] == TEST_NAME
        assert auth_data["user"]["tier"] == "bronze"  # New users start as bronze
        assert auth_data["user"]["points"] == 100  # Welcome bonus

    def test_login_with_valid_credentials(self, session):
        """Test login with valid credentials"""
        resp = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert resp.status_code == 200
        data = resp.json()
        assert "token" in data
        assert "user" in data
        assert data["user"]["email"] == TEST_EMAIL.lower()

    def test_login_with_invalid_credentials(self, session):
        """Test login with wrong password returns 401"""
        resp = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": "wrongpassword"
        })
        assert resp.status_code == 401

    def test_auth_me_returns_user_info(self, session, headers):
        """Test /api/auth/me returns current user"""
        resp = session.get(f"{BASE_URL}/api/auth/me", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        assert "user" in data
        assert "tier_info" in data
        assert data["user"]["email"] == TEST_EMAIL.lower()


# ==================== RIDES MODULE TESTS ====================

class TestRidesModule:
    """Test rides_module.py endpoints (extracted from server.py)"""

    def test_get_connected_apps(self, session, headers):
        """GET /api/taxi/connected-apps returns app list"""
        resp = session.get(f"{BASE_URL}/api/taxi/connected-apps", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        assert "apps" in data
        assert len(data["apps"]) >= 4
        app_names = [a["app_name"] for a in data["apps"]]
        assert "Yango" in app_names
        assert "Heetch" in app_names

    def test_compare_ride_prices(self, session, headers):
        """GET /api/rides/compare returns providers with prices"""
        resp = session.get(f"{BASE_URL}/api/rides/compare", headers=headers, params={
            "pickup_lat": -8.8383, "pickup_lng": 13.2344,
            "dest_lat": -8.85, "dest_lng": 13.25
        })
        assert resp.status_code == 200
        data = resp.json()
        assert "providers" in data
        assert len(data["providers"]) >= 4
        # Verify each provider has required fields
        for p in data["providers"]:
            assert "name" in p
            assert "price" in p
            assert "eta" in p

    def test_request_ride_creates_and_assigns_driver(self, session, headers):
        """POST /api/rides/request creates ride and assigns driver"""
        resp = session.post(f"{BASE_URL}/api/rides/request", headers=headers, json={
            "pickup_address": "Marginal, Luanda",
            "destination_address": "Talatona",
            "pickup_lat": -8.8383, "pickup_lng": 13.2344,
            "dest_lat": -8.95, "dest_lng": 13.30,
            "vehicle_type": "standard"
        })
        assert resp.status_code == 200
        data = resp.json()
        assert data["ride_id"]
        assert data["status"] == "aceite"
        assert data["driver_name"]  # Driver assigned
        assert data["driver_phone"]
        # Store ride_id for status update test
        pytest.ride_id = data["ride_id"]

    def test_get_rides_list(self, session, headers):
        """GET /api/rides returns user's rides"""
        resp = session.get(f"{BASE_URL}/api/rides", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        assert isinstance(data, list)
        assert len(data) >= 1

    def test_update_ride_status(self, session, headers):
        """PATCH /api/rides/{id}/status updates ride status"""
        ride_id = getattr(pytest, 'ride_id', None)
        if not ride_id:
            pytest.skip("No ride_id from previous test")
        
        resp = session.patch(f"{BASE_URL}/api/rides/{ride_id}/status", headers=headers,
                             json={"status": "em_andamento"})
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "em_andamento"

    def test_update_ride_status_to_concluido(self, session, headers):
        """PATCH /api/rides/{id}/status to concluido"""
        ride_id = getattr(pytest, 'ride_id', None)
        if not ride_id:
            pytest.skip("No ride_id from previous test")
        
        resp = session.patch(f"{BASE_URL}/api/rides/{ride_id}/status", headers=headers,
                             json={"status": "concluido"})
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "concluido"


# ==================== RESTAURANTS MODULE TESTS ====================

class TestRestaurantsModule:
    """Test restaurants_module.py endpoints (extracted from server.py)"""

    def test_get_restaurants_list(self, session, headers):
        """GET /api/restaurants returns restaurant list"""
        resp = session.get(f"{BASE_URL}/api/restaurants", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        assert isinstance(data, list)
        assert len(data) >= 1
        # Verify structure
        for r in data:
            assert "restaurant_id" in r
            assert "name" in r
            assert "cuisine_type" in r
        # Store restaurant_id for menu test
        pytest.restaurant_id = data[0]["restaurant_id"]

    def test_search_restaurants(self, session, headers):
        """GET /api/restaurants/search with query"""
        resp = session.get(f"{BASE_URL}/api/restaurants/search", headers=headers,
                          params={"q": "restaurante"})
        assert resp.status_code == 200
        data = resp.json()
        assert "restaurants" in data
        assert "cuisines" in data

    def test_get_restaurant_menu(self, session, headers):
        """GET /api/restaurants/{id}/menu returns menu items"""
        rid = getattr(pytest, 'restaurant_id', None)
        if not rid:
            # Get a restaurant first
            resp = session.get(f"{BASE_URL}/api/restaurants", headers=headers)
            rid = resp.json()[0]["restaurant_id"]
        
        resp = session.get(f"{BASE_URL}/api/restaurants/{rid}/menu", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        assert isinstance(data, list)
        assert len(data) >= 1
        # Store menu item for order test
        pytest.menu_item = data[0]

    def test_create_order(self, session, headers):
        """POST /api/orders creates restaurant order"""
        rid = getattr(pytest, 'restaurant_id', None)
        item = getattr(pytest, 'menu_item', None)
        if not rid or not item:
            pytest.skip("No restaurant/menu data from previous tests")
        
        resp = session.post(f"{BASE_URL}/api/orders", headers=headers, json={
            "restaurant_id": rid,
            "items": [{
                "item_id": item["item_id"],
                "name": item["name"],
                "price": item["price"],
                "quantity": 2
            }],
            "delivery_address": "Rua Major Kanhangulo 123, Luanda",
            "payment_method": "transferencia"
        })
        assert resp.status_code == 200
        data = resp.json()
        assert data["order_id"]
        assert data["status"] == "confirmado"
        assert data["subtotal"] == item["price"] * 2
        pytest.order_id = data["order_id"]

    def test_get_orders_list(self, session, headers):
        """GET /api/orders returns user's orders"""
        resp = session.get(f"{BASE_URL}/api/orders", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        assert isinstance(data, list)
        assert len(data) >= 1

    def test_create_review(self, session, headers):
        """POST /api/reviews creates restaurant review"""
        rid = getattr(pytest, 'restaurant_id', None)
        if not rid:
            pytest.skip("No restaurant_id from previous tests")
        
        resp = session.post(f"{BASE_URL}/api/reviews", headers=headers, json={
            "restaurant_id": rid,
            "rating": 5,
            "comment": "Excelente comida e atendimento!"
        })
        assert resp.status_code == 200
        data = resp.json()
        assert data["rating"] == 5

    def test_get_reviews(self, session, headers):
        """GET /api/reviews/{restaurant_id} returns reviews"""
        rid = getattr(pytest, 'restaurant_id', None)
        if not rid:
            pytest.skip("No restaurant_id from previous tests")
        
        resp = session.get(f"{BASE_URL}/api/reviews/{rid}", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        assert "reviews" in data
        assert "total" in data
        assert "average_rating" in data


# ==================== BACKWARD COMPAT ROUTES TESTS ====================

class TestBackwardCompatRoutes:
    """Test backward compatibility routes in server.py"""

    def test_get_tourist_places(self, session, headers):
        """GET /api/tourist-places returns places"""
        resp = session.get(f"{BASE_URL}/api/tourist-places", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        assert isinstance(data, list)

    def test_get_properties(self, session, headers):
        """GET /api/properties returns properties"""
        resp = session.get(f"{BASE_URL}/api/properties", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        assert isinstance(data, list)
        if data:
            pytest.property_id = data[0]["property_id"]

    def test_create_booking(self, session, headers):
        """POST /api/bookings creates tourism booking"""
        # First get a tourist place
        resp = session.get(f"{BASE_URL}/api/tourist-places", headers=headers)
        places = resp.json()
        if not places:
            pytest.skip("No tourist places available")
        
        place_id = places[0]["place_id"]
        
        resp = session.post(f"{BASE_URL}/api/bookings", headers=headers, json={
            "place_id": place_id,
            "check_in": "2026-02-15T00:00:00Z",
            "check_out": "2026-02-17T00:00:00Z",
            "guests": 2,
            "payment_method": "transferencia"
        })
        assert resp.status_code == 200
        data = resp.json()
        assert data["booking_id"]
        assert data["nights"] >= 1  # Nights calculated based on day difference

    def test_get_bookings(self, session, headers):
        """GET /api/bookings returns user's bookings"""
        resp = session.get(f"{BASE_URL}/api/bookings", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        assert isinstance(data, list)

    def test_create_property_inquiry(self, session, headers):
        """POST /api/property-inquiries creates inquiry"""
        prop_id = getattr(pytest, 'property_id', None)
        if not prop_id:
            # Get a property first
            resp = session.get(f"{BASE_URL}/api/properties", headers=headers)
            props = resp.json()
            if not props:
                pytest.skip("No properties available")
            prop_id = props[0]["property_id"]
        
        resp = session.post(f"{BASE_URL}/api/property-inquiries", headers=headers, json={
            "property_id": prop_id,
            "message": "Tenho interesse neste imóvel. Qual é a disponibilidade?",
            "phone": "+244 923 456 789"
        })
        assert resp.status_code == 200
        data = resp.json()
        assert data["inquiry_id"]
        assert data["status"] == "enviado"

    def test_get_property_inquiries(self, session, headers):
        """GET /api/property-inquiries returns user's inquiries"""
        resp = session.get(f"{BASE_URL}/api/property-inquiries", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        assert isinstance(data, list)


# ==================== OTHER MODULES TESTS ====================

class TestOtherModules:
    """Test other module endpoints: wallet, coupons, streak, notifications, payments"""

    def test_get_wallet(self, session, headers):
        """GET /api/wallet returns wallet with transactions"""
        resp = session.get(f"{BASE_URL}/api/wallet", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        assert "wallet" in data
        assert "transactions" in data
        assert data["wallet"]["currency"] == "AOA"

    def test_get_available_coupons(self, session, headers):
        """GET /api/coupons/available returns coupons"""
        resp = session.get(f"{BASE_URL}/api/coupons/available", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        assert "coupons" in data

    def test_streak_checkin(self, session, headers):
        """POST /api/streak/checkin performs daily checkin"""
        resp = session.post(f"{BASE_URL}/api/streak/checkin", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        assert "current_streak" in data
        assert "multiplier" in data

    def test_get_notifications(self, session, headers):
        """GET /api/notifications/ returns user notifications"""
        resp = session.get(f"{BASE_URL}/api/notifications/", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        assert "notifications" in data

    def test_get_payment_methods(self, session, headers):
        """GET /api/payments/methods returns payment methods"""
        resp = session.get(f"{BASE_URL}/api/payments/methods", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        assert "methods" in data
        assert len(data["methods"]) >= 4
        method_ids = [m["id"] for m in data["methods"]]
        assert "multicaixa_express" in method_ids
        assert "unitel_money" in method_ids
