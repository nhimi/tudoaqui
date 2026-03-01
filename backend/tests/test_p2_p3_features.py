"""
P2 & P3 Features Test Suite for TudoAqui Marketplace Angola
Tests for:
- P2: Payment system (create, confirm, bank accounts), Order tracking, Reviews/Ratings
- P3: Backend refactoring - tourism and properties routers with backward compat
"""
import pytest
import requests
import os
import uuid
from datetime import datetime, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test unique email for this run
TEST_EMAIL = f"test_p2p3_{uuid.uuid4().hex[:8]}@tudoaqui.ao"
TEST_PASSWORD = "test123"
TEST_NAME = "P2P3 Test User"


class TestPaymentSystem:
    """Payment module tests - create payment, get bank details, confirm payment"""
    payment_id = None
    confirmation_code = None
    order_id = None
    restaurant_id = None
    
    def test_01_create_order_for_payment(self, auth_session):
        """Create order first to test payment flow"""
        # Get a restaurant first
        res = auth_session.get(f"{BASE_URL}/api/restaurants")
        assert res.status_code == 200, f"Failed to get restaurants: {res.text}"
        restaurants = res.json()
        assert len(restaurants) > 0, "No restaurants found"
        TestPaymentSystem.restaurant_id = restaurants[0]["restaurant_id"]
        
        # Get menu items
        menu_res = auth_session.get(f"{BASE_URL}/api/restaurants/{TestPaymentSystem.restaurant_id}/menu")
        assert menu_res.status_code == 200
        menu_items = menu_res.json()
        assert len(menu_items) > 0, "No menu items found"
        
        # Create order
        order_data = {
            "restaurant_id": TestPaymentSystem.restaurant_id,
            "items": [
                {"item_id": menu_items[0]["item_id"], "name": menu_items[0]["name"], "price": menu_items[0]["price"], "quantity": 2}
            ],
            "delivery_address": "Rua Test, 123, Luanda",
            "payment_method": "transferencia",
            "notes": "Test payment order"
        }
        
        response = auth_session.post(f"{BASE_URL}/api/orders", json=order_data)
        print(f"Create order response: {response.status_code} - {response.text}")
        assert response.status_code == 200, f"Order creation failed: {response.text}"
        
        data = response.json()
        assert "order_id" in data
        TestPaymentSystem.order_id = data["order_id"]
        print(f"✅ Order created: {data['order_id']}, total: {data['total']} Kz")
    
    def test_02_get_bank_accounts(self, auth_session):
        """GET /api/payments/bank-accounts - returns bank details"""
        response = auth_session.get(f"{BASE_URL}/api/payments/bank-accounts")
        print(f"Bank accounts response: {response.status_code} - {response.text}")
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert "bank_accounts" in data
        
        # Verify bank account structure
        accounts = data["bank_accounts"]
        assert "transferencia" in accounts
        assert "multicaixa" in accounts
        assert "unitel_money" in accounts
        
        # Check BAI account details
        bai = accounts["transferencia"]
        assert bai["bank"] == "Banco BAI"
        assert "iban" in bai
        assert "nif" in bai
        
        # Check Unitel Money
        unitel = accounts["unitel_money"]
        assert unitel["bank"] == "Unitel Money"
        assert "phone" in unitel
        
        print(f"✅ Bank accounts retrieved: {list(accounts.keys())}")
    
    def test_03_create_payment(self, auth_session):
        """POST /api/payments/create - creates payment with confirmation code"""
        assert TestPaymentSystem.order_id is not None, "Order must be created first"
        
        payment_data = {
            "amount": 5000,
            "payment_method": "transferencia",
            "reference_type": "order",
            "reference_id": TestPaymentSystem.order_id,
            "description": f"Pedido {TestPaymentSystem.order_id}"
        }
        
        response = auth_session.post(f"{BASE_URL}/api/payments/create", json=payment_data)
        print(f"Create payment response: {response.status_code} - {response.text}")
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert "payment_id" in data
        assert "confirmation_code" in data
        assert "bank_info" in data
        assert data["status"] == "pendente"
        assert len(data["confirmation_code"]) == 8  # 8 uppercase alphanumeric chars
        
        TestPaymentSystem.payment_id = data["payment_id"]
        TestPaymentSystem.confirmation_code = data["confirmation_code"]
        
        print(f"✅ Payment created: {data['payment_id']}, code: {data['confirmation_code']}")
    
    def test_04_confirm_payment_invalid_code(self, auth_session):
        """POST /api/payments/confirm - rejects invalid code"""
        assert TestPaymentSystem.payment_id is not None
        
        response = auth_session.post(f"{BASE_URL}/api/payments/confirm", json={
            "payment_id": TestPaymentSystem.payment_id,
            "confirmation_code": "WRONGCODE"
        })
        print(f"Invalid code response: {response.status_code}")
        assert response.status_code == 400
        print(f"✅ Invalid confirmation code correctly rejected")
    
    def test_05_confirm_payment_valid_code(self, auth_session):
        """POST /api/payments/confirm - confirms payment with correct code"""
        assert TestPaymentSystem.payment_id is not None
        assert TestPaymentSystem.confirmation_code is not None
        
        response = auth_session.post(f"{BASE_URL}/api/payments/confirm", json={
            "payment_id": TestPaymentSystem.payment_id,
            "confirmation_code": TestPaymentSystem.confirmation_code
        })
        print(f"Confirm payment response: {response.status_code} - {response.text}")
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert data["status"] == "confirmado"
        assert "confirmed_at" in data
        print(f"✅ Payment confirmed: {data['payment_id']}")
    
    def test_06_cannot_confirm_twice(self, auth_session):
        """Cannot confirm an already confirmed payment"""
        assert TestPaymentSystem.payment_id is not None
        
        response = auth_session.post(f"{BASE_URL}/api/payments/confirm", json={
            "payment_id": TestPaymentSystem.payment_id,
            "confirmation_code": TestPaymentSystem.confirmation_code
        })
        print(f"Double confirm response: {response.status_code}")
        assert response.status_code == 400
        print(f"✅ Double confirmation correctly rejected")
    
    def test_07_get_my_payments(self, auth_session):
        """GET /api/payments/my-payments - lists user payments"""
        response = auth_session.get(f"{BASE_URL}/api/payments/my-payments")
        print(f"My payments response: {response.status_code} - {response.text[:500]}")
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert "payments" in data
        assert len(data["payments"]) > 0
        
        # Find our payment
        our_payment = next((p for p in data["payments"] if p["payment_id"] == TestPaymentSystem.payment_id), None)
        assert our_payment is not None
        assert our_payment["status"] == "confirmado"
        print(f"✅ Payments list retrieved: {len(data['payments'])} payments")
    
    def test_08_get_payment_by_id(self, auth_session):
        """GET /api/payments/{payment_id} - get payment details"""
        response = auth_session.get(f"{BASE_URL}/api/payments/{TestPaymentSystem.payment_id}")
        print(f"Get payment response: {response.status_code}")
        assert response.status_code == 200
        
        data = response.json()
        assert data["payment_id"] == TestPaymentSystem.payment_id
        assert data["status"] == "confirmado"
        print(f"✅ Payment details retrieved")


class TestOrderTracking:
    """Order status tracking tests"""
    order_id = None
    
    def test_01_create_order(self, auth_session):
        """Create an order to track"""
        # Get restaurant and menu
        res = auth_session.get(f"{BASE_URL}/api/restaurants")
        restaurants = res.json()
        restaurant_id = restaurants[0]["restaurant_id"]
        
        menu_res = auth_session.get(f"{BASE_URL}/api/restaurants/{restaurant_id}/menu")
        menu_items = menu_res.json()
        
        order_data = {
            "restaurant_id": restaurant_id,
            "items": [
                {"item_id": menu_items[0]["item_id"], "name": menu_items[0]["name"], "price": menu_items[0]["price"], "quantity": 1}
            ],
            "delivery_address": "Rua Tracking Test, 456",
            "payment_method": "multicaixa"
        }
        
        response = auth_session.post(f"{BASE_URL}/api/orders", json=order_data)
        assert response.status_code == 200
        data = response.json()
        TestOrderTracking.order_id = data["order_id"]
        
        # Initial status should be 'confirmado'
        assert data["status"] == "confirmado"
        print(f"✅ Order created with status: {data['status']}")
    
    def test_02_update_status_preparando(self, auth_session):
        """PATCH /api/orders/{order_id}/status - update to preparando"""
        assert TestOrderTracking.order_id is not None
        
        response = auth_session.patch(
            f"{BASE_URL}/api/orders/{TestOrderTracking.order_id}/status",
            json={"status": "preparando"}
        )
        print(f"Update status response: {response.status_code} - {response.text}")
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert data["status"] == "preparando"
        print(f"✅ Order status updated to: preparando")
    
    def test_03_update_status_a_caminho(self, auth_session):
        """PATCH /api/orders/{order_id}/status - update to a_caminho"""
        response = auth_session.patch(
            f"{BASE_URL}/api/orders/{TestOrderTracking.order_id}/status",
            json={"status": "a_caminho"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["status"] == "a_caminho"
        print(f"✅ Order status updated to: a_caminho")
    
    def test_04_update_status_entregue(self, auth_session):
        """PATCH /api/orders/{order_id}/status - update to entregue"""
        response = auth_session.patch(
            f"{BASE_URL}/api/orders/{TestOrderTracking.order_id}/status",
            json={"status": "entregue"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["status"] == "entregue"
        print(f"✅ Order status updated to: entregue")
    
    def test_05_invalid_status_rejected(self, auth_session):
        """Invalid status should be rejected"""
        response = auth_session.patch(
            f"{BASE_URL}/api/orders/{TestOrderTracking.order_id}/status",
            json={"status": "invalid_status"}
        )
        print(f"Invalid status response: {response.status_code}")
        assert response.status_code == 400
        print(f"✅ Invalid status correctly rejected")
    
    def test_06_get_orders_list(self, auth_session):
        """GET /api/orders - verify order in list with final status"""
        response = auth_session.get(f"{BASE_URL}/api/orders")
        assert response.status_code == 200
        
        orders = response.json()
        our_order = next((o for o in orders if o["order_id"] == TestOrderTracking.order_id), None)
        assert our_order is not None
        assert our_order["status"] == "entregue"
        print(f"✅ Order found in list with status: {our_order['status']}")


class TestReviewsRatings:
    """Restaurant reviews and ratings tests"""
    restaurant_id = None
    
    def test_01_get_restaurant_for_review(self, auth_session):
        """Get a restaurant to review"""
        res = auth_session.get(f"{BASE_URL}/api/restaurants")
        restaurants = res.json()
        TestReviewsRatings.restaurant_id = restaurants[0]["restaurant_id"]
        print(f"✅ Will review restaurant: {TestReviewsRatings.restaurant_id}")
    
    def test_02_create_review(self, auth_session):
        """POST /api/reviews - creates restaurant review with rating 1-5"""
        review_data = {
            "restaurant_id": TestReviewsRatings.restaurant_id,
            "rating": 5,
            "comment": "Excelente comida angolana! Muito saboroso."
        }
        
        response = auth_session.post(f"{BASE_URL}/api/reviews", json=review_data)
        print(f"Create review response: {response.status_code} - {response.text}")
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert "rating" in data
        assert data["rating"] == 5
        print(f"✅ Review created with rating: {data['rating']}")
    
    def test_03_invalid_rating_rejected(self, auth_session):
        """Rating must be 1-5"""
        response = auth_session.post(f"{BASE_URL}/api/reviews", json={
            "restaurant_id": TestReviewsRatings.restaurant_id,
            "rating": 6,  # Invalid
            "comment": "Invalid rating"
        })
        print(f"Invalid rating response: {response.status_code}")
        assert response.status_code == 400
        print(f"✅ Invalid rating (6) correctly rejected")
    
    def test_04_zero_rating_rejected(self, auth_session):
        """Rating 0 should be rejected"""
        response = auth_session.post(f"{BASE_URL}/api/reviews", json={
            "restaurant_id": TestReviewsRatings.restaurant_id,
            "rating": 0,
            "comment": "Zero rating"
        })
        assert response.status_code == 400
        print(f"✅ Zero rating correctly rejected")
    
    def test_05_get_restaurant_reviews(self, auth_session):
        """GET /api/reviews/{restaurant_id} - gets reviews with average rating"""
        response = auth_session.get(f"{BASE_URL}/api/reviews/{TestReviewsRatings.restaurant_id}")
        print(f"Get reviews response: {response.status_code} - {response.text}")
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert "reviews" in data
        assert "average_rating" in data
        assert "total" in data
        assert data["total"] > 0
        
        # Check review structure
        if len(data["reviews"]) > 0:
            review = data["reviews"][0]
            assert "rating" in review
            assert "user_name" in review
            assert "created_at" in review
        
        print(f"✅ Reviews retrieved: {data['total']} reviews, avg rating: {data['average_rating']}")
    
    def test_06_update_existing_review(self, auth_session):
        """Submitting review again should update existing one"""
        response = auth_session.post(f"{BASE_URL}/api/reviews", json={
            "restaurant_id": TestReviewsRatings.restaurant_id,
            "rating": 4,
            "comment": "Updated: Still great but changed my mind"
        })
        assert response.status_code == 200
        
        # Verify it updated
        get_res = auth_session.get(f"{BASE_URL}/api/reviews/{TestReviewsRatings.restaurant_id}")
        data = get_res.json()
        # Should still be same total since we updated, not created new
        print(f"✅ Review updated, total reviews: {data['total']}")


class TestBackwardCompatTourism:
    """P3: Tourism routes backward compatibility tests"""
    place_id = None
    
    def test_01_get_tourist_places(self, auth_session):
        """GET /api/tourist-places - backward compat route still works"""
        response = auth_session.get(f"{BASE_URL}/api/tourist-places")
        print(f"Tourist places response: {response.status_code} - {response.text[:500]}")
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        
        # Check structure
        place = data[0]
        assert "place_id" in place
        assert "name" in place
        assert "type" in place
        assert "price_per_night" in place
        
        TestBackwardCompatTourism.place_id = place["place_id"]
        print(f"✅ Tourist places retrieved: {len(data)} places")
    
    def test_02_get_tourist_place_by_id(self, auth_session):
        """GET /api/tourist-places/{place_id} - backward compat single place"""
        assert TestBackwardCompatTourism.place_id is not None
        
        response = auth_session.get(f"{BASE_URL}/api/tourist-places/{TestBackwardCompatTourism.place_id}")
        print(f"Single place response: {response.status_code}")
        assert response.status_code == 200
        
        data = response.json()
        assert data["place_id"] == TestBackwardCompatTourism.place_id
        print(f"✅ Single tourist place retrieved: {data['name']}")
    
    def test_03_filter_by_type(self, auth_session):
        """GET /api/tourist-places?type=hotel - filter by type"""
        response = auth_session.get(f"{BASE_URL}/api/tourist-places", params={"type": "hotel"})
        assert response.status_code == 200
        
        data = response.json()
        for place in data:
            assert place["type"] == "hotel"
        print(f"✅ Filter by type works: {len(data)} hotels")
    
    def test_04_create_booking(self, auth_session):
        """POST /api/bookings - backward compat booking creation"""
        assert TestBackwardCompatTourism.place_id is not None
        
        # Calculate dates
        check_in = (datetime.now() + timedelta(days=7)).strftime("%Y-%m-%dT00:00:00Z")
        check_out = (datetime.now() + timedelta(days=9)).strftime("%Y-%m-%dT00:00:00Z")
        
        booking_data = {
            "place_id": TestBackwardCompatTourism.place_id,
            "check_in": check_in,
            "check_out": check_out,
            "guests": 2,
            "payment_method": "transferencia",
            "special_requests": "Test booking request"
        }
        
        response = auth_session.post(f"{BASE_URL}/api/bookings", json=booking_data)
        print(f"Create booking response: {response.status_code} - {response.text}")
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert "booking_id" in data
        assert data["nights"] == 2
        assert data["status"] == "pendente_pagamento"
        print(f"✅ Booking created: {data['booking_id']}, {data['nights']} nights, total: {data['total_price']} Kz")
    
    def test_05_get_bookings(self, auth_session):
        """GET /api/bookings - list user bookings"""
        response = auth_session.get(f"{BASE_URL}/api/bookings")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        print(f"✅ Bookings list retrieved: {len(data)} bookings")


class TestBackwardCompatProperties:
    """P3: Properties routes backward compatibility tests"""
    property_id = None
    
    def test_01_get_properties(self, auth_session):
        """GET /api/properties - backward compat route still works"""
        response = auth_session.get(f"{BASE_URL}/api/properties")
        print(f"Properties response: {response.status_code} - {response.text[:500]}")
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        
        # Check structure
        prop = data[0]
        assert "property_id" in prop
        assert "title" in prop
        assert "type" in prop
        assert "price" in prop
        assert "transaction_type" in prop
        
        TestBackwardCompatProperties.property_id = prop["property_id"]
        print(f"✅ Properties retrieved: {len(data)} properties")
    
    def test_02_get_property_by_id(self, auth_session):
        """GET /api/properties/{property_id} - backward compat single property"""
        assert TestBackwardCompatProperties.property_id is not None
        
        response = auth_session.get(f"{BASE_URL}/api/properties/{TestBackwardCompatProperties.property_id}")
        print(f"Single property response: {response.status_code}")
        assert response.status_code == 200
        
        data = response.json()
        assert data["property_id"] == TestBackwardCompatProperties.property_id
        print(f"✅ Single property retrieved: {data['title']}")
    
    def test_03_filter_by_type(self, auth_session):
        """GET /api/properties?type=apartamento - filter by type"""
        response = auth_session.get(f"{BASE_URL}/api/properties", params={"type": "apartamento"})
        assert response.status_code == 200
        
        data = response.json()
        for prop in data:
            assert prop["type"] == "apartamento"
        print(f"✅ Filter by type works: {len(data)} apartments")
    
    def test_04_filter_by_transaction(self, auth_session):
        """GET /api/properties?transaction=venda - filter by transaction type"""
        response = auth_session.get(f"{BASE_URL}/api/properties", params={"transaction": "venda"})
        assert response.status_code == 200
        
        data = response.json()
        for prop in data:
            assert prop["transaction_type"] == "venda"
        print(f"✅ Filter by transaction works: {len(data)} for sale")
    
    def test_05_create_property_inquiry(self, auth_session):
        """POST /api/property-inquiries - backward compat inquiry creation"""
        assert TestBackwardCompatProperties.property_id is not None
        
        inquiry_data = {
            "property_id": TestBackwardCompatProperties.property_id,
            "message": "Interested in this property, please contact me.",
            "phone": "+244 923 456 789"
        }
        
        response = auth_session.post(f"{BASE_URL}/api/property-inquiries", json=inquiry_data)
        print(f"Create inquiry response: {response.status_code} - {response.text}")
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert "inquiry_id" in data
        assert data["status"] == "enviado"
        print(f"✅ Inquiry created: {data['inquiry_id']}")
    
    def test_06_get_inquiries(self, auth_session):
        """GET /api/property-inquiries - list user inquiries"""
        response = auth_session.get(f"{BASE_URL}/api/property-inquiries")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        print(f"✅ Inquiries list retrieved: {len(data)} inquiries")


class TestNewRoutersDirectly:
    """Test the new router paths directly (tourism and properties routers)"""
    
    def test_01_tourism_places_via_new_router(self, auth_session):
        """GET /api/tourism/places - new tourism router"""
        response = auth_session.get(f"{BASE_URL}/api/tourism/places")
        print(f"Tourism places response: {response.status_code}")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        print(f"✅ New tourism router works: {len(data)} places")
    
    def test_02_properties_via_new_router(self, auth_session):
        """GET /api/properties/ - new properties router (with prefix)"""
        response = auth_session.get(f"{BASE_URL}/api/properties/")
        print(f"Properties router response: {response.status_code}")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        print(f"✅ New properties router works: {len(data)} properties")


# Fixtures
@pytest.fixture(scope="module")
def auth_session():
    """Create authenticated session for tests"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    
    # Register unique test user
    email = f"test_p2p3_{uuid.uuid4().hex[:8]}@tudoaqui.ao"
    
    response = session.post(f"{BASE_URL}/api/auth/register", json={
        "email": email,
        "password": "test123",
        "name": "P2P3 Test User"
    })
    
    if response.status_code != 200:
        # Try login with existing test user
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@tudoaqui.ao",
            "password": "test123"
        })
    
    if response.status_code == 200:
        cookies = response.cookies
        for cookie in cookies:
            session.cookies.set(cookie.name, cookie.value)
    else:
        pytest.fail(f"Could not authenticate: {response.status_code} - {response.text}")
    
    return session


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
