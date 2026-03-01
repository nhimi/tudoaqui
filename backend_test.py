#!/usr/bin/env python3
"""
Angola Marketplace Backend API Testing
Tests all endpoints: auth, taxi, restaurants, orders
"""
import requests
import sys
import json
from datetime import datetime

class AngolaMarketplaceAPITester:
    def __init__(self, base_url="https://angola-connect-2.preview.emergentagent.com"):
        self.base_url = base_url
        self.session = requests.Session()
        self.session.headers.update({'Content-Type': 'application/json'})
        self.tests_run = 0
        self.tests_passed = 0
        self.user_data = None
        
    def log_test(self, name, success, details=""):
        """Log test results"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED")
        else:
            print(f"❌ {name} - FAILED: {details}")
        
    def test_user_registration(self):
        """Test user registration endpoint"""
        test_email = f"test.user.{datetime.now().strftime('%Y%m%d%H%M%S')}@test.com"
        
        try:
            response = self.session.post(
                f"{self.base_url}/api/auth/register",
                json={
                    "email": test_email,
                    "password": "TestPassword123!",
                    "name": "Utilizador Teste",
                    "phone": "+244912345678"
                }
            )
            
            success = response.status_code == 200
            if success:
                data = response.json()
                self.user_data = data.get('user')
                # Check if session cookie is set
                has_session = 'session_token' in self.session.cookies
                if not has_session:
                    success = False
                    details = "Session token not set in cookies"
                else:
                    details = f"User created: {self.user_data.get('user_id')}"
            else:
                details = f"Status {response.status_code}: {response.text}"
                
        except Exception as e:
            success = False
            details = str(e)
            
        self.log_test("User Registration", success, details)
        return success
        
    def test_user_login(self):
        """Test user login endpoint"""
        if not self.user_data:
            self.log_test("User Login", False, "No user data available for login test")
            return False
            
        try:
            # Clear existing session first
            self.session.cookies.clear()
            
            response = self.session.post(
                f"{self.base_url}/api/auth/login",
                json={
                    "email": self.user_data['email'],
                    "password": "TestPassword123!"
                }
            )
            
            success = response.status_code == 200
            if success:
                data = response.json()
                has_session = 'session_token' in self.session.cookies
                if not has_session:
                    success = False
                    details = "Session token not set in cookies"
                else:
                    details = f"Login successful for: {data['user']['email']}"
            else:
                details = f"Status {response.status_code}: {response.text}"
                
        except Exception as e:
            success = False
            details = str(e)
            
        self.log_test("User Login", success, details)
        return success
        
    def test_auth_me(self):
        """Test get current user endpoint"""
        try:
            response = self.session.get(f"{self.base_url}/api/auth/me")
            
            success = response.status_code == 200
            if success:
                data = response.json()
                details = f"User: {data.get('name')} ({data.get('email')})"
            else:
                details = f"Status {response.status_code}: {response.text}"
                
        except Exception as e:
            success = False
            details = str(e)
            
        self.log_test("Get Current User", success, details)
        return success
        
    def test_taxi_price_comparison(self):
        """Test taxi price comparison endpoint"""
        try:
            response = self.session.get(
                f"{self.base_url}/api/rides/compare",
                params={
                    "pickup_lat": -8.8383,
                    "pickup_lng": 13.2344,
                    "dest_lat": -8.8500,
                    "dest_lng": 13.2500
                }
            )
            
            success = response.status_code == 200
            if success:
                data = response.json()
                providers = data.get('providers', [])
                if len(providers) >= 4:
                    # Check if all expected providers are present
                    provider_names = [p['name'] for p in providers]
                    expected_providers = ['Yango', 'Heetch', 'Ugo', 'Tupuca Taxi']
                    has_all_providers = all(name in provider_names for name in expected_providers)
                    
                    if has_all_providers:
                        details = f"Found {len(providers)} providers with prices"
                    else:
                        success = False
                        details = f"Missing expected providers. Found: {provider_names}"
                else:
                    success = False
                    details = f"Expected 4+ providers, got {len(providers)}"
            else:
                details = f"Status {response.status_code}: {response.text}"
                
        except Exception as e:
            success = False
            details = str(e)
            
        self.log_test("Taxi Price Comparison", success, details)
        return success
        
    def test_ride_creation(self):
        """Test ride creation endpoint"""
        try:
            response = self.session.post(
                f"{self.base_url}/api/rides",
                json={
                    "pickup_address": "Largo da Independência, Luanda",
                    "pickup_lat": -8.8383,
                    "pickup_lng": 13.2344,
                    "destination_address": "Aeroporto Internacional de Luanda",
                    "destination_lat": -8.8500,
                    "destination_lng": 13.2500,
                    "provider": "Yango"
                }
            )
            
            success = response.status_code == 200
            if success:
                data = response.json()
                details = f"Ride created: {data.get('ride_id')} - Status: {data.get('status')}"
            else:
                details = f"Status {response.status_code}: {response.text}"
                
        except Exception as e:
            success = False
            details = str(e)
            
        self.log_test("Ride Creation", success, details)
        return success
        
    def test_get_restaurants(self):
        """Test restaurant listing endpoint"""
        try:
            response = self.session.get(f"{self.base_url}/api/restaurants")
            
            success = response.status_code == 200
            if success:
                data = response.json()
                if isinstance(data, list) and len(data) > 0:
                    details = f"Found {len(data)} restaurants"
                else:
                    success = False
                    details = "No restaurants returned"
            else:
                details = f"Status {response.status_code}: {response.text}"
                
        except Exception as e:
            success = False
            details = str(e)
            
        self.log_test("Get Restaurants", success, details)
        return success
        
    def test_restaurant_menu(self):
        """Test restaurant menu endpoint"""
        # First get a restaurant
        try:
            restaurants_response = self.session.get(f"{self.base_url}/api/restaurants")
            if restaurants_response.status_code != 200:
                self.log_test("Restaurant Menu", False, "Could not fetch restaurants")
                return False
                
            restaurants = restaurants_response.json()
            if not restaurants:
                self.log_test("Restaurant Menu", False, "No restaurants available")
                return False
                
            restaurant_id = restaurants[0]['restaurant_id']
            
            response = self.session.get(f"{self.base_url}/api/restaurants/{restaurant_id}/menu")
            
            success = response.status_code == 200
            if success:
                data = response.json()
                if isinstance(data, list) and len(data) > 0:
                    details = f"Found {len(data)} menu items for restaurant {restaurant_id}"
                else:
                    success = False
                    details = "No menu items returned"
            else:
                details = f"Status {response.status_code}: {response.text}"
                
        except Exception as e:
            success = False
            details = str(e)
            
        self.log_test("Restaurant Menu", success, details)
        return success
        
    def test_create_order(self):
        """Test order creation endpoint"""
        try:
            # First get restaurants and menu
            restaurants_response = self.session.get(f"{self.base_url}/api/restaurants")
            if restaurants_response.status_code != 200:
                self.log_test("Order Creation", False, "Could not fetch restaurants")
                return False
                
            restaurants = restaurants_response.json()
            if not restaurants:
                self.log_test("Order Creation", False, "No restaurants available")
                return False
                
            restaurant_id = restaurants[0]['restaurant_id']
            
            menu_response = self.session.get(f"{self.base_url}/api/restaurants/{restaurant_id}/menu")
            if menu_response.status_code != 200:
                self.log_test("Order Creation", False, "Could not fetch menu")
                return False
                
            menu_items = menu_response.json()
            if not menu_items:
                self.log_test("Order Creation", False, "No menu items available")
                return False
                
            # Create order with first menu item
            first_item = menu_items[0]
            
            response = self.session.post(
                f"{self.base_url}/api/orders",
                json={
                    "restaurant_id": restaurant_id,
                    "items": [{
                        "item_id": first_item['item_id'],
                        "name": first_item['name'],
                        "price": first_item['price'],
                        "quantity": 2
                    }],
                    "delivery_address": "Rua da Missão 123, Luanda, Angola",
                    "payment_method": "multicaixa",
                    "notes": "Teste de pedido via API"
                }
            )
            
            success = response.status_code == 200
            if success:
                data = response.json()
                details = f"Order created: {data.get('order_id')} - Total: {data.get('total')} Kz"
            else:
                details = f"Status {response.status_code}: {response.text}"
                
        except Exception as e:
            success = False
            details = str(e)
            
        self.log_test("Order Creation", success, details)
        return success
        
    def test_get_orders(self):
        """Test get user orders endpoint"""
        try:
            response = self.session.get(f"{self.base_url}/api/orders")
            
            success = response.status_code == 200
            if success:
                data = response.json()
                details = f"Found {len(data)} orders for user"
            else:
                details = f"Status {response.status_code}: {response.text}"
                
        except Exception as e:
            success = False
            details = str(e)
            
        self.log_test("Get Orders", success, details)
        return success
        
    def test_get_tourist_places(self):
        """Test tourist places listing endpoint"""
        try:
            response = self.session.get(f"{self.base_url}/api/tourist-places")
            
            success = response.status_code == 200
            if success:
                data = response.json()
                if isinstance(data, list) and len(data) >= 8:
                    # Check if we have the expected types
                    types = set(place.get('type') for place in data)
                    expected_types = {'hotel', 'resort', 'museu', 'parque', 'atrativo'}
                    has_expected_types = expected_types.issubset(types)
                    
                    if has_expected_types:
                        details = f"Found {len(data)} tourist places with correct types"
                    else:
                        success = False
                        details = f"Missing expected types. Found: {types}"
                else:
                    success = False
                    details = f"Expected at least 8 tourist places, got {len(data) if isinstance(data, list) else 0}"
            else:
                details = f"Status {response.status_code}: {response.text}"
                
        except Exception as e:
            success = False
            details = str(e)
            
        self.log_test("Get Tourist Places", success, details)
        return success
        
    def test_get_tourist_places_filtered(self):
        """Test tourist places filtered by type"""
        try:
            response = self.session.get(f"{self.base_url}/api/tourist-places?type=hotel")
            
            success = response.status_code == 200
            if success:
                data = response.json()
                if isinstance(data, list):
                    # Check if all returned places are hotels
                    all_hotels = all(place.get('type') == 'hotel' for place in data)
                    if all_hotels and len(data) > 0:
                        details = f"Found {len(data)} hotels filtered correctly"
                    elif len(data) == 0:
                        success = False
                        details = "No hotels found in filter"
                    else:
                        success = False
                        details = "Filter returned non-hotel places"
                else:
                    success = False
                    details = "Invalid response format"
            else:
                details = f"Status {response.status_code}: {response.text}"
                
        except Exception as e:
            success = False
            details = str(e)
            
        self.log_test("Get Tourist Places (Filtered)", success, details)
        return success
        
    def test_get_tourist_place_detail(self):
        """Test individual tourist place detail endpoint"""
        try:
            # First get tourist places to get an ID
            places_response = self.session.get(f"{self.base_url}/api/tourist-places")
            if places_response.status_code != 200:
                self.log_test("Tourist Place Detail", False, "Could not fetch tourist places")
                return False
                
            places = places_response.json()
            if not places:
                self.log_test("Tourist Place Detail", False, "No tourist places available")
                return False
                
            place_id = places[0]['place_id']
            
            response = self.session.get(f"{self.base_url}/api/tourist-places/{place_id}")
            
            success = response.status_code == 200
            if success:
                data = response.json()
                required_fields = ['place_id', 'name', 'type', 'description', 'location', 'price_per_night', 'images', 'rating', 'amenities', 'capacity']
                has_all_fields = all(field in data for field in required_fields)
                
                if has_all_fields:
                    details = f"Place detail loaded: {data.get('name')} ({data.get('type')})"
                else:
                    success = False
                    missing_fields = [field for field in required_fields if field not in data]
                    details = f"Missing fields: {missing_fields}"
            else:
                details = f"Status {response.status_code}: {response.text}"
                
        except Exception as e:
            success = False
            details = str(e)
            
        self.log_test("Tourist Place Detail", success, details)
        return success
        
    def test_create_booking(self):
        """Test booking creation endpoint"""
        try:
            # First get tourist places to get an ID
            places_response = self.session.get(f"{self.base_url}/api/tourist-places")
            if places_response.status_code != 200:
                self.log_test("Booking Creation", False, "Could not fetch tourist places")
                return False
                
            places = places_response.json()
            if not places:
                self.log_test("Booking Creation", False, "No tourist places available")
                return False
                
            place_id = places[0]['place_id']
            
            # Create booking
            from datetime import datetime, timedelta
            check_in = (datetime.now() + timedelta(days=7)).isoformat()
            check_out = (datetime.now() + timedelta(days=9)).isoformat()
            
            response = self.session.post(
                f"{self.base_url}/api/bookings",
                json={
                    "place_id": place_id,
                    "check_in": check_in,
                    "check_out": check_out,
                    "guests": 2,
                    "payment_method": "multicaixa",
                    "special_requests": "Teste de reserva via API"
                }
            )
            
            success = response.status_code == 200
            if success:
                data = response.json()
                # Verify calculated values
                expected_nights = 2
                if data.get('nights') == expected_nights:
                    details = f"Booking created: {data.get('booking_id')} - {expected_nights} nights, Total: {data.get('total_price')} Kz"
                else:
                    success = False
                    details = f"Wrong nights calculation: expected {expected_nights}, got {data.get('nights')}"
            else:
                details = f"Status {response.status_code}: {response.text}"
                
        except Exception as e:
            success = False
            details = str(e)
            
        self.log_test("Booking Creation", success, details)
        return success
        
    def test_get_bookings(self):
        """Test get user bookings endpoint"""
        try:
            response = self.session.get(f"{self.base_url}/api/bookings")
            
            success = response.status_code == 200
            if success:
                data = response.json()
                details = f"Found {len(data)} bookings for user"
            else:
                details = f"Status {response.status_code}: {response.text}"
                
        except Exception as e:
            success = False
            details = str(e)
            
        self.log_test("Get Bookings", success, details)
        return success
        
    def test_get_properties(self):
        """Test properties listing endpoint"""
        try:
            response = self.session.get(f"{self.base_url}/api/properties")
            
            success = response.status_code == 200
            if success:
                data = response.json()
                if isinstance(data, list) and len(data) >= 8:
                    # Check if we have the expected types
                    types = set(prop.get('type') for prop in data)
                    expected_types = {'apartamento', 'casa', 'terreno', 'comercial'}
                    has_expected_types = expected_types.issubset(types)
                    
                    # Check transaction types
                    transactions = set(prop.get('transaction_type') for prop in data)
                    expected_transactions = {'venda', 'aluguel'}
                    has_expected_transactions = expected_transactions.issubset(transactions)
                    
                    if has_expected_types and has_expected_transactions:
                        details = f"Found {len(data)} properties with correct types and transactions"
                    else:
                        success = False
                        details = f"Missing expected types or transactions. Types: {types}, Transactions: {transactions}"
                else:
                    success = False
                    details = f"Expected at least 8 properties, got {len(data) if isinstance(data, list) else 0}"
            else:
                details = f"Status {response.status_code}: {response.text}"
                
        except Exception as e:
            success = False
            details = str(e)
            
        self.log_test("Get Properties", success, details)
        return success
        
    def test_get_properties_filtered(self):
        """Test properties filtered by type and transaction"""
        try:
            # Test filtering by type
            response = self.session.get(f"{self.base_url}/api/properties?type=apartamento")
            
            success = response.status_code == 200
            if success:
                data = response.json()
                if isinstance(data, list):
                    # Check if all returned properties are apartments
                    all_apartments = all(prop.get('type') == 'apartamento' for prop in data)
                    if all_apartments and len(data) > 0:
                        details = f"Found {len(data)} apartments filtered correctly"
                    elif len(data) == 0:
                        success = False
                        details = "No apartments found in filter"
                    else:
                        success = False
                        details = "Filter returned non-apartment properties"
                else:
                    success = False
                    details = "Invalid response format"
            else:
                details = f"Status {response.status_code}: {response.text}"
                
        except Exception as e:
            success = False
            details = str(e)
            
        self.log_test("Get Properties (Filtered)", success, details)
        return success
        
    def test_get_property_detail(self):
        """Test individual property detail endpoint"""
        try:
            # First get properties to get an ID
            properties_response = self.session.get(f"{self.base_url}/api/properties")
            if properties_response.status_code != 200:
                self.log_test("Property Detail", False, "Could not fetch properties")
                return False
                
            properties = properties_response.json()
            if not properties:
                self.log_test("Property Detail", False, "No properties available")
                return False
                
            property_id = properties[0]['property_id']
            
            response = self.session.get(f"{self.base_url}/api/properties/{property_id}")
            
            success = response.status_code == 200
            if success:
                data = response.json()
                required_fields = ['property_id', 'type', 'transaction_type', 'title', 'description', 'price', 'location', 'area', 'images', 'features', 'owner_name', 'owner_phone', 'status']
                has_all_fields = all(field in data for field in required_fields)
                
                if has_all_fields:
                    details = f"Property detail loaded: {data.get('title')} ({data.get('type')})"
                else:
                    success = False
                    missing_fields = [field for field in required_fields if field not in data]
                    details = f"Missing fields: {missing_fields}"
            else:
                details = f"Status {response.status_code}: {response.text}"
                
        except Exception as e:
            success = False
            details = str(e)
            
        self.log_test("Property Detail", success, details)
        return success
        
    def test_create_property_inquiry(self):
        """Test property inquiry creation endpoint"""
        try:
            # First get properties to get an ID
            properties_response = self.session.get(f"{self.base_url}/api/properties")
            if properties_response.status_code != 200:
                self.log_test("Property Inquiry Creation", False, "Could not fetch properties")
                return False
                
            properties = properties_response.json()
            if not properties:
                self.log_test("Property Inquiry Creation", False, "No properties available")
                return False
                
            property_id = properties[0]['property_id']
            
            # Create inquiry
            response = self.session.post(
                f"{self.base_url}/api/property-inquiries",
                json={
                    "property_id": property_id,
                    "message": "Tenho interesse neste imóvel. Gostaria de mais informações sobre preço e disponibilidade.",
                    "phone": "+244912345678"
                }
            )
            
            success = response.status_code == 200
            if success:
                data = response.json()
                required_fields = ['inquiry_id', 'user_id', 'property_id', 'property_title', 'property_price', 'message', 'phone', 'status', 'created_at']
                has_all_fields = all(field in data for field in required_fields)
                
                if has_all_fields:
                    details = f"Property inquiry created: {data.get('inquiry_id')} - Status: {data.get('status')}"
                else:
                    success = False
                    missing_fields = [field for field in required_fields if field not in data]
                    details = f"Missing fields: {missing_fields}"
            else:
                details = f"Status {response.status_code}: {response.text}"
                
        except Exception as e:
            success = False
            details = str(e)
            
        self.log_test("Property Inquiry Creation", success, details)
        return success
        
    def test_get_property_inquiries(self):
        """Test get user property inquiries endpoint"""
        try:
            response = self.session.get(f"{self.base_url}/api/property-inquiries")
            
            success = response.status_code == 200
            if success:
                data = response.json()
                details = f"Found {len(data)} property inquiries for user"
            else:
                details = f"Status {response.status_code}: {response.text}"
                
        except Exception as e:
            success = False
            details = str(e)
            
        self.log_test("Get Property Inquiries", success, details)
        return success
        
    def test_logout(self):
        """Test user logout endpoint"""
        try:
            response = self.session.post(f"{self.base_url}/api/auth/logout")
            
            success = response.status_code == 200
            if success:
                details = "Logout successful"
            else:
                details = f"Status {response.status_code}: {response.text}"
                
        except Exception as e:
            success = False
            details = str(e)
            
        self.log_test("User Logout", success, details)
        return success
        
    def run_all_tests(self):
        """Run complete test suite"""
        print(f"\n🧪 Angola Marketplace API Testing")
        print(f"🌐 Backend URL: {self.base_url}")
        print("=" * 60)
        
        # Test sequence - order matters for authentication
        test_sequence = [
            self.test_user_registration,
            self.test_user_login,
            self.test_auth_me,
            self.test_taxi_price_comparison,
            self.test_ride_creation,
            self.test_get_restaurants,
            self.test_restaurant_menu,
            self.test_create_order,
            self.test_get_orders,
            self.test_get_tourist_places,
            self.test_get_tourist_places_filtered,
            self.test_get_tourist_place_detail,
            self.test_create_booking,
            self.test_get_bookings,
            self.test_logout
        ]
        
        for test in test_sequence:
            try:
                test()
            except Exception as e:
                print(f"❌ {test.__name__} - ERROR: {str(e)}")
                self.tests_run += 1
                
        print("\n" + "=" * 60)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All backend tests PASSED!")
            return 0
        else:
            print(f"⚠️  {self.tests_run - self.tests_passed} tests FAILED")
            return 1

def main():
    """Main test execution"""
    tester = AngolaMarketplaceAPITester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())