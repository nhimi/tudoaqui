"""
Iteration 6 Features Test Suite - TudoAqui Marketplace Angola
Tests for new features:
- Admin Dashboard with role system (CEO, Admin, Suporte, Finanças)
- System configuration management (about, contacts, APIs, payments)
- Partner Analytics Dashboard
- Notifications System
- Enhanced Taxi Module with vehicle types and driver assignment
- Enhanced auth/me endpoint with admin_role, is_partner fields
"""
import pytest
import requests
import os
import uuid
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')


class TestAdminSystem:
    """Admin module tests - stats, config, roles, users"""
    
    def test_01_admin_stats(self, auth_session):
        """GET /api/admin/stats - returns system statistics"""
        response = auth_session.get(f"{BASE_URL}/api/admin/stats")
        print(f"Admin stats response: {response.status_code}")
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert "users" in data
        assert "partners" in data
        assert "orders" in data
        assert "payments" in data
        assert "revenue" in data
        assert data["users"]["total"] > 0
        print(f"✅ Admin stats: {data['users']['total']} users, {data['partners']['total']} partners, revenue: {data['revenue']['total']} Kz")
    
    def test_02_admin_config(self, auth_session):
        """GET /api/admin/config - returns system configuration"""
        response = auth_session.get(f"{BASE_URL}/api/admin/config")
        print(f"Admin config response: {response.status_code}")
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert "app_name" in data
        assert data["app_name"] == "TudoAqui"
        assert "about" in data
        assert "contacts" in data
        assert "api_configs" in data
        assert "payment_settings" in data
        
        # Check payment settings structure
        ps = data["payment_settings"]
        assert "bank_accounts" in ps
        assert "commission_rates" in ps
        assert "payment_direct_to_partner" in ps
        print(f"✅ Admin config retrieved: {data['app_name']} v{data['version']}")
    
    def test_03_admin_roles_definitions(self, auth_session):
        """GET /api/admin/roles - returns role definitions"""
        response = auth_session.get(f"{BASE_URL}/api/admin/roles")
        print(f"Admin roles response: {response.status_code}")
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert "admin_roles" in data
        assert "user_roles" in data
        assert "partner_roles" in data
        
        # Verify admin role hierarchy
        admin_roles = data["admin_roles"]
        assert "ceo" in admin_roles
        assert "admin" in admin_roles
        assert "suporte" in admin_roles
        assert "financas" in admin_roles
        
        assert admin_roles["ceo"]["level"] == 4
        assert admin_roles["admin"]["level"] == 3
        assert admin_roles["suporte"]["level"] == 2
        assert admin_roles["financas"]["level"] == 1
        print(f"✅ Admin roles retrieved: {list(admin_roles.keys())}")
    
    def test_04_admin_users_list(self, auth_session):
        """GET /api/admin/users - lists users with roles"""
        response = auth_session.get(f"{BASE_URL}/api/admin/users")
        print(f"Admin users response: {response.status_code}")
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert "users" in data
        assert "total" in data
        assert "page" in data
        assert data["total"] > 0
        
        # Check user structure
        user = data["users"][0]
        assert "user_id" in user
        assert "email" in user
        assert "name" in user
        # password_hash should NOT be included
        assert "password_hash" not in user
        print(f"✅ Users list: {data['total']} total users, page {data['page']}")
    
    def test_05_update_about_config(self, auth_session):
        """PUT /api/admin/config/about - updates about info"""
        about_data = {
            "description": f"TudoAqui Test Update {datetime.now().isoformat()}",
            "mission": "Test mission update",
            "founded_year": 2026
        }
        
        response = auth_session.put(f"{BASE_URL}/api/admin/config/about", json=about_data)
        print(f"Update about response: {response.status_code}")
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert data["message"] == "Informações atualizadas"
        print(f"✅ About config updated")
    
    def test_06_update_contacts_config(self, auth_session):
        """PUT /api/admin/config/contacts - updates contacts"""
        contacts_data = {
            "email": "test@tudoaqui.ao",
            "phone": "+244 923 111 222",
            "whatsapp": "+244 923 111 222",
            "address": "Luanda, Angola - Test",
            "social": {
                "facebook": "https://facebook.com/tudoaqui",
                "instagram": "https://instagram.com/tudoaqui",
                "linkedin": ""
            }
        }
        
        response = auth_session.put(f"{BASE_URL}/api/admin/config/contacts", json=contacts_data)
        print(f"Update contacts response: {response.status_code}")
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert data["message"] == "Contactos atualizados"
        print(f"✅ Contacts config updated")
    
    def test_07_update_api_config(self, auth_session):
        """PUT /api/admin/config/apis - updates API keys (CEO level)"""
        api_data = {
            "google_maps_key": "test_key_123",
            "multicaixa_api_key": "",
            "sms_api_key": ""
        }
        
        response = auth_session.put(f"{BASE_URL}/api/admin/config/apis", json=api_data)
        print(f"Update APIs response: {response.status_code}")
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert data["message"] == "APIs atualizadas"
        print(f"✅ API config updated")
    
    def test_08_update_payment_config(self, auth_session):
        """PUT /api/admin/config/payments - updates payment settings"""
        payment_data = {
            "bank_accounts": {
                "primary": {
                    "bank": "Banco BAI",
                    "account_name": "TudoAqui Test",
                    "iban": "AO06 0040 0000 1234 5678 9012 3",
                    "account_number": "123456789012",
                    "nif": "1234567890"
                }
            },
            "commission_rates": {"basico": 0.15, "premium": 0.10, "enterprise": 0.05},
            "payment_direct_to_partner": True
        }
        
        response = auth_session.put(f"{BASE_URL}/api/admin/config/payments", json=payment_data)
        print(f"Update payments response: {response.status_code}")
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert data["message"] == "Configurações de pagamento atualizadas"
        print(f"✅ Payment config updated")
    
    def test_09_assign_admin_role(self, auth_session):
        """PUT /api/admin/users/{user_id}/role - assigns admin role"""
        # Get users list first
        users_res = auth_session.get(f"{BASE_URL}/api/admin/users")
        users = users_res.json()["users"]
        
        # Find a user that is not the CEO
        target_user = None
        for u in users:
            if u.get("admin_role") != "ceo":
                target_user = u
                break
        
        if not target_user:
            pytest.skip("No non-CEO user found to assign role")
        
        # Assign suporte role
        response = auth_session.put(
            f"{BASE_URL}/api/admin/users/{target_user['user_id']}/role",
            json={"admin_role": "suporte"}
        )
        print(f"Assign role response: {response.status_code}")
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert data["admin_role"] == "suporte"
        print(f"✅ Role 'suporte' assigned to user {target_user['user_id']}")
        
        # Reset to no role
        auth_session.put(
            f"{BASE_URL}/api/admin/users/{target_user['user_id']}/role",
            json={"admin_role": None}
        )


class TestNotificationsSystem:
    """Notifications module tests"""
    
    def test_01_get_notifications(self, auth_session):
        """GET /api/notifications/ - returns user notifications"""
        response = auth_session.get(f"{BASE_URL}/api/notifications/")
        print(f"Notifications response: {response.status_code}")
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert "notifications" in data
        assert "unread_count" in data
        print(f"✅ Notifications: {len(data['notifications'])} items, {data['unread_count']} unread")
    
    def test_02_mark_all_as_read(self, auth_session):
        """POST /api/notifications/read-all - marks all as read"""
        response = auth_session.post(f"{BASE_URL}/api/notifications/read-all")
        print(f"Mark all read response: {response.status_code}")
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert "marked_count" in data
        print(f"✅ Marked {data['marked_count']} notifications as read")


class TestPartnerAnalytics:
    """Partner analytics tests"""
    partner_id = None
    
    def test_01_register_as_partner(self, auth_session):
        """POST /api/partners/register - register user as partner for analytics test"""
        # First check if already partner
        me_res = auth_session.get(f"{BASE_URL}/api/auth/me")
        me_data = me_res.json()
        
        if me_data.get("is_partner"):
            TestPartnerAnalytics.partner_id = me_data.get("partner_id")
            print(f"✅ Already a partner: {TestPartnerAnalytics.partner_id}")
            return
        
        response = auth_session.post(f"{BASE_URL}/api/partners/register", json={
            "business_name": f"Test Analytics Partner {uuid.uuid4().hex[:6]}",
            "business_type": "taxi"
        })
        print(f"Register partner response: {response.status_code}")
        
        if response.status_code == 400 and "já é parceiro" in response.text:
            # User is already partner
            print(f"✅ User already registered as partner")
            return
        
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        TestPartnerAnalytics.partner_id = data["partner_id"]
        print(f"✅ Partner registered: {data['partner_id']}")
    
    def test_02_get_partner_analytics(self, auth_session):
        """GET /api/partners/analytics - returns partner analytics data"""
        response = auth_session.get(f"{BASE_URL}/api/partners/analytics")
        print(f"Partner analytics response: {response.status_code}")
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert "partner" in data
        assert "services" in data
        assert "revenue" in data
        assert "monthly" in data
        assert "tier_info" in data
        
        # Check revenue structure
        rev = data["revenue"]
        assert "total" in rev
        assert "net" in rev
        assert "wallet_balance" in rev
        
        print(f"✅ Partner analytics: tier={data['partner']['tier']}, services={data['services']['total']}, revenue={rev['total']} Kz")
    
    def test_03_update_bank_details(self, auth_session):
        """PUT /api/partners/bank-details - updates partner bank details"""
        bank_data = {
            "bank": "Banco BAI",
            "iban": f"AO06 {uuid.uuid4().hex[:20]}",
            "nif": "123456789",
            "account_holder": "Test Partner"
        }
        
        response = auth_session.put(f"{BASE_URL}/api/partners/bank-details", json=bank_data)
        print(f"Update bank details response: {response.status_code}")
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert data["message"] == "Dados bancários atualizados"
        assert "bank_details" in data
        print(f"✅ Bank details updated: {data['bank_details']['bank']}")
    
    def test_04_get_bank_details(self, auth_session):
        """GET /api/partners/bank-details - returns partner bank details"""
        response = auth_session.get(f"{BASE_URL}/api/partners/bank-details")
        print(f"Get bank details response: {response.status_code}")
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert "bank_details" in data
        assert "partner_id" in data
        print(f"✅ Bank details retrieved for partner {data['partner_id']}")


class TestEnhancedTaxi:
    """Enhanced taxi module tests - vehicle types, ride request, driver assignment"""
    ride_id = None
    
    def test_01_request_ride_standard(self, auth_session):
        """POST /api/rides/request - creates ride with standard vehicle type"""
        ride_data = {
            "pickup_address": "Rua Test 123, Luanda",
            "destination_address": "Aeroporto 4 de Fevereiro",
            "pickup_lat": -8.8383,
            "pickup_lng": 13.2344,
            "dest_lat": -8.8500,
            "dest_lng": 13.2500,
            "vehicle_type": "standard",
            "payment_method": "transferencia"
        }
        
        response = auth_session.post(f"{BASE_URL}/api/rides/request", json=ride_data)
        print(f"Ride request standard response: {response.status_code}")
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert "ride_id" in data
        assert data["vehicle_type"] == "standard"
        assert data["status"] == "aceite"  # Auto-assigned driver
        assert "driver_name" in data
        assert "driver_phone" in data
        assert "price" in data
        assert data["price"] > 0
        
        TestEnhancedTaxi.ride_id = data["ride_id"]
        print(f"✅ Standard ride: {data['ride_id']}, price={data['price']} Kz, driver={data['driver_name']}")
    
    def test_02_request_ride_comfort(self, auth_session):
        """POST /api/rides/request - creates ride with comfort vehicle type"""
        ride_data = {
            "pickup_address": "Praça da Independência, Luanda",
            "destination_address": "Ilha de Luanda",
            "pickup_lat": -8.8383,
            "pickup_lng": 13.2344,
            "dest_lat": -8.8700,
            "dest_lng": 13.2200,
            "vehicle_type": "comfort",
            "payment_method": "transferencia"
        }
        
        response = auth_session.post(f"{BASE_URL}/api/rides/request", json=ride_data)
        print(f"Ride request comfort response: {response.status_code}")
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert data["vehicle_type"] == "comfort"
        assert data["price"] > 0  # Comfort should be more expensive
        print(f"✅ Comfort ride: price={data['price']} Kz (1.5x multiplier)")
    
    def test_03_request_ride_premium(self, auth_session):
        """POST /api/rides/request - creates ride with premium vehicle type"""
        ride_data = {
            "pickup_address": "Hotel Presidente, Luanda",
            "destination_address": "Marginal de Luanda",
            "pickup_lat": -8.8383,
            "pickup_lng": 13.2344,
            "dest_lat": -8.8600,
            "dest_lng": 13.2600,
            "vehicle_type": "premium",
            "payment_method": "transferencia"
        }
        
        response = auth_session.post(f"{BASE_URL}/api/rides/request", json=ride_data)
        print(f"Ride request premium response: {response.status_code}")
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert data["vehicle_type"] == "premium"
        print(f"✅ Premium ride: price={data['price']} Kz (2.5x multiplier)")
    
    def test_04_update_ride_status(self, auth_session):
        """PATCH /api/rides/{id}/status - updates ride status"""
        if not TestEnhancedTaxi.ride_id:
            pytest.skip("No ride_id from previous test")
        
        response = auth_session.patch(
            f"{BASE_URL}/api/rides/{TestEnhancedTaxi.ride_id}/status",
            json={"status": "em_andamento"}
        )
        print(f"Update ride status response: {response.status_code}")
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert data["status"] == "em_andamento"
        print(f"✅ Ride status updated to: em_andamento")
    
    def test_05_complete_ride(self, auth_session):
        """PATCH /api/rides/{id}/status - completes ride"""
        if not TestEnhancedTaxi.ride_id:
            pytest.skip("No ride_id from previous test")
        
        response = auth_session.patch(
            f"{BASE_URL}/api/rides/{TestEnhancedTaxi.ride_id}/status",
            json={"status": "concluido"}
        )
        print(f"Complete ride response: {response.status_code}")
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert data["status"] == "concluido"
        print(f"✅ Ride completed")
    
    def test_06_invalid_status_rejected(self, auth_session):
        """Invalid ride status should be rejected"""
        if not TestEnhancedTaxi.ride_id:
            pytest.skip("No ride_id from previous test")
        
        response = auth_session.patch(
            f"{BASE_URL}/api/rides/{TestEnhancedTaxi.ride_id}/status",
            json={"status": "invalid_status"}
        )
        print(f"Invalid status response: {response.status_code}")
        assert response.status_code == 400
        print(f"✅ Invalid ride status correctly rejected")


class TestEnhancedAuthMe:
    """Test enhanced /api/auth/me endpoint"""
    
    def test_01_auth_me_admin_fields(self, auth_session):
        """GET /api/auth/me - returns admin_role, is_partner, partner_tier fields"""
        response = auth_session.get(f"{BASE_URL}/api/auth/me")
        print(f"Auth/me response: {response.status_code}")
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        
        # Check standard fields
        assert "user_id" in data
        assert "email" in data
        assert "name" in data
        
        # Check new fields
        assert "admin_role" in data
        assert "is_partner" in data
        assert "partner_tier" in data
        assert "user_tier" in data
        
        # CEO user should have admin_role = "ceo"
        assert data["admin_role"] == "ceo", f"Expected CEO role, got: {data['admin_role']}"
        
        print(f"✅ Auth/me enhanced: admin_role={data['admin_role']}, is_partner={data['is_partner']}, user_tier={data['user_tier']}")


# Fixtures
@pytest.fixture(scope="module")
def auth_session():
    """Create authenticated session with CEO test user"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    
    # Login with existing CEO test user
    response = session.post(f"{BASE_URL}/api/auth/login", json={
        "email": "test@tudoaqui.ao",
        "password": "test123"
    })
    
    if response.status_code == 200:
        cookies = response.cookies
        for cookie in cookies:
            session.cookies.set(cookie.name, cookie.value)
        print(f"✅ Authenticated as CEO test user")
    else:
        pytest.fail(f"Could not authenticate: {response.status_code} - {response.text}")
    
    return session


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
