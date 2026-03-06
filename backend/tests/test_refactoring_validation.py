"""
Test Suite: Backend Refactoring Validation
Validates that rides_module.py and restaurants_module.py work correctly
after extraction from server.py, and all backward-compat routes still work.
"""

import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://super-app-hybrid.preview.emergentagent.com').rstrip('/')

TEST_EMAIL = f"pytest_refactor_{uuid.uuid4().hex[:6]}@test.com"
TEST_PASSWORD = "test123456"
TEST_NAME = "Pytest Refactor User"


@pytest.fixture(scope="module")
def auth_token():
    """Register and login to get auth token"""
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})

    resp = s.post(f"{BASE_URL}/api/auth/register", json={
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD,
        "name": TEST_NAME
    })
    assert resp.status_code == 200, f"Register failed: {resp.text}"
    data = resp.json()
    token = data.get("token")
    assert token, "No token in register response"
    return token


@pytest.fixture(scope="module")
def headers(auth_token):
    return {"Authorization": f"Bearer {auth_token}", "Content-Type": "application/json"}


class TestRidesModule:
    """Test rides extracted to rides_module.py"""

    def test_get_connected_apps(self, headers):
        resp = requests.get(f"{BASE_URL}/api/taxi/connected-apps", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        assert "apps" in data
        assert len(data["apps"]) >= 4

    def test_connect_app(self, headers):
        resp = requests.post(f"{BASE_URL}/api/taxi/connect-app", headers=headers,
                             json={"app_name": "Yango", "credentials": "test"})
        assert resp.status_code == 200
        assert resp.json()["connected"] is True

    def test_disconnect_app(self, headers):
        resp = requests.delete(f"{BASE_URL}/api/taxi/disconnect-app/Yango", headers=headers)
        assert resp.status_code == 200

    def test_navigation_route(self, headers):
        resp = requests.get(f"{BASE_URL}/api/taxi/navigation-route",
                            headers=headers,
                            params={"pickup_lat": -8.8383, "pickup_lng": 13.2344,
                                    "dest_lat": -8.85, "dest_lng": 13.25})
        assert resp.status_code == 200
        data = resp.json()
        assert "distance" in data
        assert "duration" in data
        assert "steps" in data

    def test_compare_ride_prices(self, headers):
        resp = requests.get(f"{BASE_URL}/api/rides/compare",
                            headers=headers,
                            params={"pickup_lat": -8.8383, "pickup_lng": 13.2344,
                                    "dest_lat": -8.85, "dest_lng": 13.25})
        assert resp.status_code == 200
        data = resp.json()
        assert "providers" in data
        assert len(data["providers"]) >= 4

    def test_create_ride(self, headers):
        resp = requests.post(f"{BASE_URL}/api/rides", headers=headers,
                             json={
                                 "pickup_address": "Marginal, Luanda",
                                 "pickup_lat": -8.8383,
                                 "pickup_lng": 13.2344,
                                 "destination_address": "Talatona",
                                 "destination_lat": -8.95,
                                 "destination_lng": 13.25,
                                 "provider": "TudoAqui"
                             })
        assert resp.status_code == 200
        data = resp.json()
        assert data["ride_id"]
        assert data["status"] == "solicitado"

    def test_request_ride(self, headers):
        resp = requests.post(f"{BASE_URL}/api/rides/request", headers=headers,
                             json={
                                 "pickup_address": "Marginal",
                                 "destination_address": "Viana",
                                 "pickup_lat": -8.8383,
                                 "pickup_lng": 13.2344,
                                 "dest_lat": -8.9,
                                 "dest_lng": 13.3,
                                 "vehicle_type": "standard"
                             })
        assert resp.status_code == 200
        data = resp.json()
        assert data["ride_id"]
        assert data["status"] == "aceite"
        assert data["driver_name"]

    def test_get_rides(self, headers):
        resp = requests.get(f"{BASE_URL}/api/rides", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) >= 2


class TestRestaurantsModule:
    """Test restaurants extracted to restaurants_module.py"""

    def test_get_restaurants(self, headers):
        resp = requests.get(f"{BASE_URL}/api/restaurants", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) >= 1

    def test_search_restaurants(self, headers):
        resp = requests.get(f"{BASE_URL}/api/restaurants/search",
                            headers=headers, params={"q": "grill"})
        assert resp.status_code == 200
        data = resp.json()
        assert "restaurants" in data
        assert "cuisines" in data

    def test_get_menu(self, headers):
        restaurants = requests.get(f"{BASE_URL}/api/restaurants", headers=headers).json()
        if restaurants:
            rid = restaurants[0]["restaurant_id"]
            resp = requests.get(f"{BASE_URL}/api/restaurants/{rid}/menu", headers=headers)
            assert resp.status_code == 200
            data = resp.json()
            assert len(data) >= 1

    def test_create_order(self, headers):
        restaurants = requests.get(f"{BASE_URL}/api/restaurants", headers=headers).json()
        if restaurants:
            rid = restaurants[0]["restaurant_id"]
            menu = requests.get(f"{BASE_URL}/api/restaurants/{rid}/menu", headers=headers).json()
            if menu:
                resp = requests.post(f"{BASE_URL}/api/orders", headers=headers,
                                     json={
                                         "restaurant_id": rid,
                                         "items": [{"item_id": menu[0]["item_id"],
                                                     "name": menu[0]["name"],
                                                     "price": menu[0]["price"],
                                                     "quantity": 1}],
                                         "delivery_address": "Rua Major, Luanda",
                                         "payment_method": "transferencia"
                                     })
                assert resp.status_code == 200
                data = resp.json()
                assert data["order_id"]
                assert data["status"] == "confirmado"

    def test_get_orders(self, headers):
        resp = requests.get(f"{BASE_URL}/api/orders", headers=headers)
        assert resp.status_code == 200

    def test_create_review(self, headers):
        restaurants = requests.get(f"{BASE_URL}/api/restaurants", headers=headers).json()
        if restaurants:
            rid = restaurants[0]["restaurant_id"]
            resp = requests.post(f"{BASE_URL}/api/reviews", headers=headers,
                                 json={"restaurant_id": rid, "rating": 5, "comment": "Excelente!"})
            assert resp.status_code == 200

    def test_get_reviews(self, headers):
        restaurants = requests.get(f"{BASE_URL}/api/restaurants", headers=headers).json()
        if restaurants:
            rid = restaurants[0]["restaurant_id"]
            resp = requests.get(f"{BASE_URL}/api/reviews/{rid}", headers=headers)
            assert resp.status_code == 200
            data = resp.json()
            assert "reviews" in data


class TestBackwardCompat:
    """Test backward compatibility routes still in server.py"""

    def test_tourist_places(self, headers):
        resp = requests.get(f"{BASE_URL}/api/tourist-places", headers=headers)
        assert resp.status_code == 200

    def test_properties(self, headers):
        resp = requests.get(f"{BASE_URL}/api/properties", headers=headers)
        assert resp.status_code == 200

    def test_fiscal_iva(self, headers):
        resp = requests.get(f"{BASE_URL}/api/fiscal/iva-calculate",
                            headers=headers, params={"amount": 1000})
        assert resp.status_code == 200

    def test_user_tier(self, headers):
        resp = requests.get(f"{BASE_URL}/api/user/tier", headers=headers)
        assert resp.status_code == 200

    def test_iva_settings(self, headers):
        resp = requests.get(f"{BASE_URL}/api/settings/iva", headers=headers)
        assert resp.status_code == 200


class TestExistingModules:
    """Test that other modules still work"""

    def test_wallet(self, headers):
        resp = requests.get(f"{BASE_URL}/api/wallet", headers=headers)
        assert resp.status_code == 200

    def test_coupons(self, headers):
        resp = requests.get(f"{BASE_URL}/api/coupons/available", headers=headers)
        assert resp.status_code == 200

    def test_streaks(self, headers):
        resp = requests.post(f"{BASE_URL}/api/streak/checkin", headers=headers)
        assert resp.status_code == 200

    def test_notifications(self, headers):
        resp = requests.get(f"{BASE_URL}/api/notifications/", headers=headers)
        assert resp.status_code in [200, 401]

    def test_auth_me(self, headers):
        resp = requests.get(f"{BASE_URL}/api/auth/me", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        assert "user" in data
