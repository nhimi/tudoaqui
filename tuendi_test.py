#!/usr/bin/env python3
"""
Tuendi Module API Testing - Focused test for Uber clone functionality
Tests all Tuendi endpoints specifically
"""
import requests
import sys
import json
from datetime import datetime

class TuendiAPITester:
    def __init__(self, base_url="https://tuendi-preview.preview.emergentagent.com"):
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
            print(f"✅ {name} - PASSED: {details}")
        else:
            print(f"❌ {name} - FAILED: {details}")
        
    def setup_user_session(self):
        """Create user and login for testing"""
        test_email = f"tuendi.test.{datetime.now().strftime('%Y%m%d%H%M%S')}@test.com"
        
        # Register user
        response = self.session.post(
            f"{self.base_url}/api/auth/register",
            json={
                "email": test_email,
                "password": "TestPassword123!",
                "name": "Tuendi Test User",
                "phone": "+244923456789"
            }
        )
        
        if response.status_code == 200:
            self.user_data = response.json().get('user')
            print(f"✅ User setup successful: {self.user_data.get('user_id')}")
            return True
        else:
            print(f"❌ User setup failed: {response.status_code} - {response.text}")
            return False
            
    def test_tuendi_config(self):
        """Test GET /api/tuendi/config"""
        try:
            response = self.session.get(f"{self.base_url}/api/tuendi/config")
            
            success = response.status_code == 200
            if success:
                data = response.json()
                
                # Detailed validation
                required_fields = ['vehicle_types', 'delivery_sizes', 'payment_methods', 'currency']
                missing_fields = [field for field in required_fields if field not in data]
                
                if not missing_fields:
                    vehicle_types = data['vehicle_types']
                    delivery_sizes = data['delivery_sizes']
                    expected_vehicles = ['moto', 'standard', 'comfort', 'premium']
                    expected_deliveries = ['small', 'medium', 'large']
                    
                    vehicle_ids = [v['id'] for v in vehicle_types]
                    delivery_ids = [d['id'] for d in delivery_sizes]
                    
                    vehicles_ok = all(vid in vehicle_ids for vid in expected_vehicles)
                    deliveries_ok = all(did in delivery_ids for did in expected_deliveries)
                    
                    if vehicles_ok and deliveries_ok:
                        details = f"Config complete: {len(vehicle_types)} vehicle types, {len(delivery_sizes)} delivery sizes, currency: {data['currency']}"
                    else:
                        success = False
                        details = f"Missing vehicle types or delivery sizes. Vehicles: {vehicle_ids}, Deliveries: {delivery_ids}"
                else:
                    success = False
                    details = f"Missing required fields: {missing_fields}"
            else:
                details = f"HTTP {response.status_code}: {response.text}"
                
        except Exception as e:
            success = False
            details = f"Exception: {str(e)}"
            
        self.log_test("Tuendi Config", success, details)
        return success

    def test_tuendi_ride_estimate(self):
        """Test GET /api/tuendi/estimate/ride"""
        try:
            params = {
                "pickup_lat": -8.8383,
                "pickup_lng": 13.2344,
                "dest_lat": -8.85,
                "dest_lng": 13.25
            }
            response = self.session.get(f"{self.base_url}/api/tuendi/estimate/ride", params=params)
            
            success = response.status_code == 200
            if success:
                data = response.json()
                estimates = data.get('estimates', [])
                
                if len(estimates) >= 4:
                    # Check all vehicle types are present
                    vehicle_types = [e.get('vehicle_type') for e in estimates]
                    expected_types = ['moto', 'standard', 'comfort', 'premium']
                    all_types_present = all(vtype in vehicle_types for vtype in expected_types)
                    
                    if all_types_present:
                        prices = [e.get('price', 0) for e in estimates]
                        distances = [e.get('distance_km', 0) for e in estimates]
                        durations = [e.get('duration_min', 0) for e in estimates]
                        
                        details = f"Estimates for {distances[0]:.2f}km: {len(estimates)} vehicles, prices {min(prices)}-{max(prices)} Kz, duration {min(durations)}-{max(durations)} min"
                    else:
                        success = False
                        details = f"Missing vehicle types. Expected: {expected_types}, Got: {vehicle_types}"
                else:
                    success = False
                    details = f"Expected 4+ estimates, got {len(estimates)}"
            else:
                details = f"HTTP {response.status_code}: {response.text}"
                
        except Exception as e:
            success = False
            details = f"Exception: {str(e)}"
            
        self.log_test("Tuendi Ride Estimate", success, details)
        return success

    def test_tuendi_create_ride(self):
        """Test POST /api/tuendi/rides"""
        try:
            ride_data = {
                "pickup_address": "Largo do Kinaxixi",
                "pickup_lat": -8.8383,
                "pickup_lng": 13.2344,
                "destination_address": "Marginal de Luanda",
                "dest_lat": -8.85,
                "dest_lng": 13.25,
                "vehicle_type": "standard",
                "payment_method": "wallet"
            }
            
            response = self.session.post(f"{self.base_url}/api/tuendi/rides", json=ride_data)
            
            success = response.status_code == 200
            if success:
                data = response.json()
                
                # Comprehensive validation
                required_fields = ['ride_id', 'status', 'price', 'driver', 'pickup_address', 'destination_address', 'distance_km', 'vehicle_type']
                missing_fields = [field for field in required_fields if field not in data]
                
                if not missing_fields:
                    # Validate driver info
                    driver = data.get('driver', {})
                    driver_fields = ['name', 'phone', 'rating', 'trips', 'vehicle', 'plate']
                    driver_complete = all(field in driver for field in driver_fields)
                    
                    if driver_complete:
                        details = f"Ride created: {data['ride_id']}, Status: {data['status']}, Price: {data['price']} Kz, Distance: {data['distance_km']}km, Driver: {driver['name']} ({driver['vehicle']})"
                    else:
                        success = False
                        missing_driver_fields = [field for field in driver_fields if field not in driver]
                        details = f"Incomplete driver info. Missing: {missing_driver_fields}"
                else:
                    success = False
                    details = f"Missing ride fields: {missing_fields}"
            else:
                details = f"HTTP {response.status_code}: {response.text}"
                
        except Exception as e:
            success = False
            details = f"Exception: {str(e)}"
            
        self.log_test("Tuendi Create Ride", success, details)
        return success

    def test_tuendi_get_rides(self):
        """Test GET /api/tuendi/rides"""
        try:
            response = self.session.get(f"{self.base_url}/api/tuendi/rides")
            
            success = response.status_code == 200
            if success:
                data = response.json()
                rides = data.get('rides', [])
                
                # Should have at least the ride we just created
                if len(rides) > 0:
                    last_ride = rides[0]  # Most recent
                    if 'ride_id' in last_ride and 'status' in last_ride:
                        details = f"Found {len(rides)} rides. Latest: {last_ride['ride_id']} ({last_ride['status']})"
                    else:
                        success = False
                        details = "Ride data incomplete"
                else:
                    details = "No rides found (this may be expected for new user)"
            else:
                details = f"HTTP {response.status_code}: {response.text}"
                
        except Exception as e:
            success = False
            details = f"Exception: {str(e)}"
            
        self.log_test("Tuendi Get Rides", success, details)
        return success

    def test_tuendi_create_delivery(self):
        """Test POST /api/tuendi/deliveries"""
        try:
            delivery_data = {
                "pickup_address": "Largo do Kinaxixi",
                "pickup_lat": -8.8383,
                "pickup_lng": 13.2344,
                "destination_address": "Talatona",
                "dest_lat": -8.9,
                "dest_lng": 13.2,
                "package_size": "small",
                "package_description": "Documentos importantes",
                "recipient_name": "João Silva",
                "recipient_phone": "+244 923 456 789",
                "payment_method": "wallet"
            }
            
            response = self.session.post(f"{self.base_url}/api/tuendi/deliveries", json=delivery_data)
            
            success = response.status_code == 200
            if success:
                data = response.json()
                
                # Comprehensive validation
                required_fields = ['delivery_id', 'status', 'price', 'driver', 'package_description', 'recipient_name', 'recipient_phone', 'distance_km', 'package_size']
                missing_fields = [field for field in required_fields if field not in data]
                
                if not missing_fields:
                    # Validate driver info (should be moto for deliveries)
                    driver = data.get('driver', {})
                    
                    details = f"Delivery created: {data['delivery_id']}, Status: {data['status']}, Price: {data['price']} Kz, Package: {data['package_size']}, Recipient: {data['recipient_name']}, Driver: {driver.get('name', 'Unknown')}"
                else:
                    success = False
                    details = f"Missing delivery fields: {missing_fields}"
            else:
                details = f"HTTP {response.status_code}: {response.text}"
                
        except Exception as e:
            success = False
            details = f"Exception: {str(e)}"
            
        self.log_test("Tuendi Create Delivery", success, details)
        return success

    def test_tuendi_get_wallet(self):
        """Test GET /api/tuendi/wallet"""
        try:
            response = self.session.get(f"{self.base_url}/api/tuendi/wallet")
            
            success = response.status_code == 200
            if success:
                data = response.json()
                
                # Validate wallet structure
                required_fields = ['balance', 'transactions']
                missing_fields = [field for field in required_fields if field not in data]
                
                if not missing_fields:
                    balance = data['balance']
                    transactions = data['transactions']
                    
                    details = f"Wallet loaded: Balance {balance} Kz, {len(transactions)} transactions"
                else:
                    success = False
                    details = f"Missing wallet fields: {missing_fields}"
            else:
                details = f"HTTP {response.status_code}: {response.text}"
                
        except Exception as e:
            success = False
            details = f"Exception: {str(e)}"
            
        self.log_test("Tuendi Get Wallet", success, details)
        return success

    def test_tuendi_wallet_topup(self):
        """Test POST /api/tuendi/wallet/topup"""
        try:
            topup_data = {
                "amount": 5000,
                "payment_reference": "REF123456"
            }
            
            response = self.session.post(f"{self.base_url}/api/tuendi/wallet/topup", json=topup_data)
            
            success = response.status_code == 200
            if success:
                data = response.json()
                
                # Validate topup response
                required_fields = ['balance', 'transaction_id']
                missing_fields = [field for field in required_fields if field not in data]
                
                if not missing_fields:
                    new_balance = data['balance']
                    transaction_id = data['transaction_id']
                    
                    # Verify balance increased
                    if new_balance >= 5000:
                        details = f"Wallet topped up: New balance {new_balance} Kz, Transaction: {transaction_id}"
                    else:
                        success = False
                        details = f"Balance didn't increase properly: {new_balance} Kz"
                else:
                    success = False
                    details = f"Missing topup response fields: {missing_fields}"
            else:
                details = f"HTTP {response.status_code}: {response.text}"
                
        except Exception as e:
            success = False
            details = f"Exception: {str(e)}"
            
        self.log_test("Tuendi Wallet TopUp", success, details)
        return success

    def test_tuendi_get_history(self):
        """Test GET /api/tuendi/history"""
        try:
            response = self.session.get(f"{self.base_url}/api/tuendi/history")
            
            success = response.status_code == 200
            if success:
                data = response.json()
                history = data.get('history', [])
                
                # Should have the ride and delivery we created
                if len(history) > 0:
                    # Check types of history items
                    types = [item.get('type', 'unknown') for item in history]
                    ride_count = types.count('ride')
                    delivery_count = types.count('delivery')
                    
                    details = f"History loaded: {len(history)} items ({ride_count} rides, {delivery_count} deliveries)"
                else:
                    details = "History empty (may be expected for new user)"
            else:
                details = f"HTTP {response.status_code}: {response.text}"
                
        except Exception as e:
            success = False
            details = f"Exception: {str(e)}"
            
        self.log_test("Tuendi Get History", success, details)
        return success

    def run_tuendi_tests(self):
        """Run Tuendi-specific test suite"""
        print(f"\n🚗 Tuendi Module API Testing (Uber Clone)")
        print(f"🌐 Backend URL: {self.base_url}")
        print("=" * 70)
        
        # Setup user session first
        if not self.setup_user_session():
            print("❌ Cannot proceed without user session")
            return 1
            
        print("\n🔧 Testing Tuendi APIs...")
        print("-" * 70)
        
        # Test sequence
        test_sequence = [
            self.test_tuendi_config,
            self.test_tuendi_ride_estimate,
            self.test_tuendi_create_ride,
            self.test_tuendi_get_rides,
            self.test_tuendi_create_delivery,
            self.test_tuendi_get_wallet,
            self.test_tuendi_wallet_topup,
            self.test_tuendi_get_history,
        ]
        
        for test in test_sequence:
            try:
                test()
            except Exception as e:
                print(f"❌ {test.__name__} - ERROR: {str(e)}")
                self.tests_run += 1
                
        print("\n" + "=" * 70)
        print(f"📊 Tuendi Test Results: {self.tests_passed}/{self.tests_run} passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All Tuendi tests PASSED!")
            return 0
        else:
            print(f"⚠️  {self.tests_run - self.tests_passed} Tuendi tests FAILED")
            return 1

def main():
    """Main test execution"""
    tester = TuendiAPITester()
    return tester.run_tuendi_tests()

if __name__ == "__main__":
    sys.exit(main())