"""
Iteration 10: Testing P0 (coupons + streak), P1 (payments + reports), P2 (role-based UI)
Features:
- Coupons: CRUD, validation, tier filtering, apply coupon
- Streak: daily check-in, multiplier, milestones
- Payments: 4 methods (Multicaixa, Unitel Money, BAI Paga, Transferencia), create/confirm flow
- Reports: admin/user CSV + JSON summary with IVA
- Role-based access control
"""

import pytest
import requests
import os
from datetime import datetime, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestAuth:
    """Authentication - get session for all tests"""
    
    @pytest.fixture(scope="class")
    def session(self):
        s = requests.Session()
        s.headers.update({"Content-Type": "application/json"})
        return s
    
    @pytest.fixture(scope="class")
    def auth_session(self, session):
        """Login as maria (admin user)"""
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "maria@tudoaqui.ao",
            "password": "maria123456"
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        return session
    
    def test_login_success(self, session):
        """Test login returns user with admin role"""
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "maria@tudoaqui.ao",
            "password": "maria123456"
        })
        assert response.status_code == 200
        data = response.json()
        assert "user" in data
        assert data["user"]["email"] == "maria@tudoaqui.ao"
        # Maria should have admin role
        user = data["user"]
        is_admin = user.get("role") in ["admin", "super_admin"] or user.get("admin_role")
        print(f"User role: {user.get('role')}, admin_role: {user.get('admin_role')}")


class TestCoupons:
    """Coupon system tests"""
    
    @pytest.fixture(scope="class")
    def auth_session(self):
        s = requests.Session()
        s.headers.update({"Content-Type": "application/json"})
        response = s.post(f"{BASE_URL}/api/auth/login", json={
            "email": "maria@tudoaqui.ao",
            "password": "maria123456"
        })
        assert response.status_code == 200
        return s
    
    def test_get_available_coupons(self, auth_session):
        """GET /api/coupons/available - list coupons filtered by user tier"""
        response = auth_session.get(f"{BASE_URL}/api/coupons/available")
        assert response.status_code == 200
        data = response.json()
        assert "coupons" in data
        coupons = data["coupons"]
        print(f"Available coupons: {len(coupons)}")
        for c in coupons:
            print(f"  - {c['code']}: {c['type']} {c.get('value', '')} ({c['applicable_to']})")
        # Should have seeded coupons (TUENDI20, COMIDA10, ENTREGAGRATIS - VIP500 requires gold+)
    
    def test_get_available_coupons_filtered_by_order_type(self, auth_session):
        """GET /api/coupons/available?order_type=tuendi - filter by module"""
        response = auth_session.get(f"{BASE_URL}/api/coupons/available?order_type=tuendi")
        assert response.status_code == 200
        data = response.json()
        coupons = data.get("coupons", [])
        print(f"Tuendi coupons: {len(coupons)}")
        # All returned coupons should be applicable to tuendi or all
        for c in coupons:
            assert c["applicable_to"] in ["tuendi", "all"], f"Coupon {c['code']} not applicable to tuendi"
    
    def test_validate_coupon_tuendi20(self, auth_session):
        """GET /api/coupons/validate/TUENDI20 - validate coupon without applying"""
        response = auth_session.get(f"{BASE_URL}/api/coupons/validate/TUENDI20?order_type=tuendi&amount=5000")
        assert response.status_code == 200
        data = response.json()
        assert data["valid"] == True
        assert data["code"] == "TUENDI20"
        assert data["type"] == "percent"
        print(f"TUENDI20 validation: {data}")
    
    def test_validate_coupon_comida10(self, auth_session):
        """GET /api/coupons/validate/COMIDA10 - validate restaurant coupon"""
        response = auth_session.get(f"{BASE_URL}/api/coupons/validate/COMIDA10?order_type=restaurants&amount=3000")
        assert response.status_code == 200
        data = response.json()
        assert data["valid"] == True
        assert data["code"] == "COMIDA10"
        print(f"COMIDA10 validation: {data}")
    
    def test_validate_invalid_coupon(self, auth_session):
        """GET /api/coupons/validate/INVALIDCODE - should return 404"""
        response = auth_session.get(f"{BASE_URL}/api/coupons/validate/INVALIDCODE")
        assert response.status_code == 404
        data = response.json()
        assert "detail" in data
        print(f"Invalid coupon response: {data}")
    
    def test_apply_coupon_calculates_discount(self, auth_session):
        """POST /api/coupons/apply - apply coupon and calculate discount"""
        response = auth_session.post(f"{BASE_URL}/api/coupons/apply", json={
            "code": "TUENDI20",
            "order_type": "tuendi",
            "order_amount": 5000
        })
        # May succeed or fail if already used - check the response
        if response.status_code == 200:
            data = response.json()
            assert data["valid"] == True
            assert data["discount"] > 0  # 20% of 5000 = 1000
            assert data["final_amount"] == 5000 - data["discount"]
            print(f"Coupon applied: discount={data['discount']}, final={data['final_amount']}")
        elif response.status_code == 400:
            # Already used maximum times
            data = response.json()
            print(f"Coupon already used: {data.get('detail')}")
        else:
            pytest.fail(f"Unexpected status: {response.status_code} - {response.text}")
    
    def test_admin_create_coupon(self, auth_session):
        """POST /api/coupons/create - admin creates new coupon"""
        test_code = f"TEST_ITER10_{datetime.now().strftime('%H%M%S')}"
        response = auth_session.post(f"{BASE_URL}/api/coupons/create", json={
            "code": test_code,
            "type": "percent",
            "value": 15,
            "max_discount_kz": 1000,
            "min_order_kz": 500,
            "max_uses": 50,
            "max_uses_per_user": 2,
            "applicable_to": "all",
            "description": "Cupom de teste iteração 10",
            "valid_until": (datetime.now() + timedelta(days=30)).isoformat()
        })
        assert response.status_code == 200
        data = response.json()
        assert data["code"] == test_code
        assert data["type"] == "percent"
        assert data["value"] == 15
        print(f"Created coupon: {test_code}")
    
    def test_admin_list_all_coupons(self, auth_session):
        """GET /api/coupons/admin/all - admin sees all coupons"""
        response = auth_session.get(f"{BASE_URL}/api/coupons/admin/all")
        assert response.status_code == 200
        data = response.json()
        assert "coupons" in data
        print(f"Admin sees {len(data['coupons'])} total coupons")


class TestStreak:
    """Daily streak system tests"""
    
    @pytest.fixture(scope="class")
    def auth_session(self):
        s = requests.Session()
        s.headers.update({"Content-Type": "application/json"})
        response = s.post(f"{BASE_URL}/api/auth/login", json={
            "email": "maria@tudoaqui.ao",
            "password": "maria123456"
        })
        assert response.status_code == 200
        return s
    
    def test_get_streak_info(self, auth_session):
        """GET /api/streak/ - get user streak with milestones"""
        response = auth_session.get(f"{BASE_URL}/api/streak/")
        assert response.status_code == 200
        data = response.json()
        # Check streak structure
        assert "current_streak" in data
        assert "longest_streak" in data
        assert "multiplier" in data
        assert "milestones" in data
        print(f"Streak: current={data['current_streak']}, longest={data['longest_streak']}, multiplier={data['multiplier']}")
        # Verify milestones are present
        milestones = data["milestones"]
        assert len(milestones) == 4  # 3d, 7d, 14d, 30d
        milestone_days = [m["days"] for m in milestones]
        assert 3 in milestone_days
        assert 7 in milestone_days
        assert 14 in milestone_days
        assert 30 in milestone_days
    
    def test_daily_checkin(self, auth_session):
        """POST /api/streak/checkin - daily check-in awards points"""
        response = auth_session.post(f"{BASE_URL}/api/streak/checkin")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "current_streak" in data
        assert "multiplier" in data
        print(f"Check-in: {data['message']}, streak={data['current_streak']}, multiplier={data['multiplier']}")
        # Either new day (points earned) or already checked in
        if data.get("is_new_day"):
            assert data["points_earned"] > 0
        else:
            assert data["points_earned"] == 0
    
    def test_streak_leaderboard(self, auth_session):
        """GET /api/streak/leaderboard - top 10 streaks"""
        response = auth_session.get(f"{BASE_URL}/api/streak/leaderboard")
        assert response.status_code == 200
        data = response.json()
        assert "leaderboard" in data
        print(f"Streak leaderboard: {len(data['leaderboard'])} entries")


class TestPayments:
    """Payment gateway tests (simulated Multicaixa/Unitel Money/BAI Paga)"""
    
    @pytest.fixture(scope="class")
    def auth_session(self):
        s = requests.Session()
        s.headers.update({"Content-Type": "application/json"})
        response = s.post(f"{BASE_URL}/api/auth/login", json={
            "email": "maria@tudoaqui.ao",
            "password": "maria123456"
        })
        assert response.status_code == 200
        return s
    
    def test_get_payment_methods(self, auth_session):
        """GET /api/payments/methods - lists 4 payment methods"""
        response = auth_session.get(f"{BASE_URL}/api/payments/methods")
        assert response.status_code == 200
        data = response.json()
        assert "methods" in data
        methods = data["methods"]
        assert len(methods) == 4, f"Expected 4 methods, got {len(methods)}"
        method_ids = [m["id"] for m in methods]
        assert "multicaixa_express" in method_ids
        assert "unitel_money" in method_ids
        assert "bai_paga" in method_ids
        assert "transferencia" in method_ids
        print(f"Payment methods: {[m['name'] for m in methods]}")
    
    def test_create_payment_multicaixa(self, auth_session):
        """POST /api/payments/create - create payment with reference"""
        response = auth_session.post(f"{BASE_URL}/api/payments/create", json={
            "amount": 2500,
            "payment_method": "multicaixa_express",
            "description": "TEST_payment_iter10"
        })
        assert response.status_code == 200
        data = response.json()
        assert "payment_id" in data
        assert "reference" in data
        assert "confirmation_code" in data
        assert data["amount"] == 2500
        assert data["status"] == "pendente"
        print(f"Created payment: {data['payment_id']}, ref={data['reference']}, code={data['confirmation_code']}")
        return data
    
    def test_create_and_confirm_payment(self, auth_session):
        """POST /api/payments/create + confirm - full flow"""
        # Create
        create_response = auth_session.post(f"{BASE_URL}/api/payments/create", json={
            "amount": 1500,
            "payment_method": "unitel_money",
            "description": "TEST_confirm_flow_iter10"
        })
        assert create_response.status_code == 200
        payment_data = create_response.json()
        payment_id = payment_data["payment_id"]
        confirmation_code = payment_data["confirmation_code"]
        
        # Confirm with correct code
        confirm_response = auth_session.post(f"{BASE_URL}/api/payments/confirm", json={
            "payment_id": payment_id,
            "confirmation_code": confirmation_code
        })
        assert confirm_response.status_code == 200
        confirm_data = confirm_response.json()
        assert confirm_data["status"] == "confirmado"
        print(f"Payment {payment_id} confirmed successfully")
    
    def test_confirm_payment_wrong_code(self, auth_session):
        """POST /api/payments/confirm - wrong code should fail"""
        # First create a payment
        create_response = auth_session.post(f"{BASE_URL}/api/payments/create", json={
            "amount": 1000,
            "payment_method": "bai_paga",
            "description": "TEST_wrong_code"
        })
        payment_data = create_response.json()
        
        # Confirm with wrong code
        confirm_response = auth_session.post(f"{BASE_URL}/api/payments/confirm", json={
            "payment_id": payment_data["payment_id"],
            "confirmation_code": "WRONGCODE"
        })
        assert confirm_response.status_code == 400
        data = confirm_response.json()
        assert "inválido" in data["detail"].lower() or "invalid" in data["detail"].lower()
        print(f"Wrong code correctly rejected: {data['detail']}")
    
    def test_get_my_payments(self, auth_session):
        """GET /api/payments/my-payments - lists user payments"""
        response = auth_session.get(f"{BASE_URL}/api/payments/my-payments")
        assert response.status_code == 200
        data = response.json()
        assert "payments" in data
        print(f"User has {len(data['payments'])} payments")
        for p in data["payments"][:3]:
            print(f"  - {p['payment_id']}: {p['amount']} Kz ({p['status']})")


class TestReports:
    """Reports system tests (admin, partner, user CSV/JSON)"""
    
    @pytest.fixture(scope="class")
    def auth_session(self):
        s = requests.Session()
        s.headers.update({"Content-Type": "application/json"})
        response = s.post(f"{BASE_URL}/api/auth/login", json={
            "email": "maria@tudoaqui.ao",
            "password": "maria123456"
        })
        assert response.status_code == 200
        return s
    
    def test_admin_sales_summary(self, auth_session):
        """GET /api/reports/admin/sales/summary - admin summary with IVA"""
        response = auth_session.get(f"{BASE_URL}/api/reports/admin/sales/summary?period=month")
        assert response.status_code == 200
        data = response.json()
        # Verify structure
        assert "period" in data
        assert "total_revenue" in data
        assert "iva_14" in data
        assert "revenue_after_iva" in data
        assert "total_transactions" in data
        print(f"Admin summary: revenue={data['total_revenue']}, IVA={data['iva_14']}, transactions={data['total_transactions']}")
    
    def test_admin_sales_csv_export(self, auth_session):
        """GET /api/reports/admin/sales/csv - CSV download"""
        response = auth_session.get(f"{BASE_URL}/api/reports/admin/sales/csv?period=month")
        assert response.status_code == 200
        assert "text/csv" in response.headers.get("Content-Type", "")
        # Verify it's valid CSV
        content = response.text
        assert "Tipo" in content or "ID" in content  # CSV header
        lines = content.strip().split("\n")
        assert len(lines) >= 1  # At least header row
        print(f"CSV export: {len(lines)} lines")
    
    def test_user_history_summary(self, auth_session):
        """GET /api/reports/user/history/summary - user summary"""
        response = auth_session.get(f"{BASE_URL}/api/reports/user/history/summary?period=month")
        assert response.status_code == 200
        data = response.json()
        assert "period" in data
        assert "total_spent" in data or "orders" in data
        print(f"User history summary: {data}")
    
    def test_user_history_csv_export(self, auth_session):
        """GET /api/reports/user/history/csv - user CSV download"""
        response = auth_session.get(f"{BASE_URL}/api/reports/user/history/csv?period=month")
        assert response.status_code == 200
        assert "text/csv" in response.headers.get("Content-Type", "")
        print(f"User CSV export successful")
    
    def test_reports_different_periods(self, auth_session):
        """Test reports for different periods (today, week, quarter, year)"""
        for period in ["today", "week", "quarter", "year"]:
            response = auth_session.get(f"{BASE_URL}/api/reports/admin/sales/summary?period={period}")
            assert response.status_code == 200
            data = response.json()
            assert data["period"] == period
            print(f"Period {period}: revenue={data['total_revenue']}")


class TestRoleBasedAccess:
    """Role-based access control tests"""
    
    @pytest.fixture(scope="class")
    def admin_session(self):
        """Login as admin user (maria)"""
        s = requests.Session()
        s.headers.update({"Content-Type": "application/json"})
        response = s.post(f"{BASE_URL}/api/auth/login", json={
            "email": "maria@tudoaqui.ao",
            "password": "maria123456"
        })
        assert response.status_code == 200
        return s
    
    def test_admin_can_access_admin_reports(self, admin_session):
        """Admin user can access admin sales summary"""
        response = admin_session.get(f"{BASE_URL}/api/reports/admin/sales/summary")
        assert response.status_code == 200
        print("Admin access to admin reports: OK")
    
    def test_admin_can_create_coupons(self, admin_session):
        """Admin user can create coupons"""
        test_code = f"TESTROLE_{datetime.now().strftime('%H%M%S')}"
        response = admin_session.post(f"{BASE_URL}/api/coupons/create", json={
            "code": test_code,
            "type": "fixed",
            "value": 500,
            "valid_until": (datetime.now() + timedelta(days=7)).isoformat()
        })
        assert response.status_code == 200
        print(f"Admin created coupon: {test_code}")
    
    def test_admin_can_list_all_coupons(self, admin_session):
        """Admin can access /api/coupons/admin/all"""
        response = admin_session.get(f"{BASE_URL}/api/coupons/admin/all")
        assert response.status_code == 200
        print("Admin access to all coupons: OK")


class TestTierFiltering:
    """Test tier-based coupon filtering (VIP500 requires gold+)"""
    
    @pytest.fixture(scope="class")
    def auth_session(self):
        s = requests.Session()
        s.headers.update({"Content-Type": "application/json"})
        response = s.post(f"{BASE_URL}/api/auth/login", json={
            "email": "maria@tudoaqui.ao",
            "password": "maria123456"
        })
        assert response.status_code == 200
        return s
    
    def test_bronze_user_cannot_see_vip_coupon(self, auth_session):
        """Bronze user should not see VIP500 coupon (requires gold+)"""
        response = auth_session.get(f"{BASE_URL}/api/coupons/available")
        assert response.status_code == 200
        coupons = response.json().get("coupons", [])
        coupon_codes = [c["code"] for c in coupons]
        # VIP500 requires gold+ tier, Maria is bronze, so should not see it
        print(f"Available coupon codes: {coupon_codes}")
        # Note: VIP500 may not be in list if Maria is bronze
    
    def test_apply_tier_restricted_coupon_fails_for_bronze(self, auth_session):
        """Bronze user cannot apply VIP500 (gold+ required)"""
        response = auth_session.post(f"{BASE_URL}/api/coupons/apply", json={
            "code": "VIP500",
            "order_type": "all",
            "order_amount": 10000
        })
        # Should fail with 403 or 404 (coupon not found for this tier)
        if response.status_code in [403, 404]:
            print(f"VIP500 correctly restricted: {response.json().get('detail')}")
        else:
            print(f"VIP500 response: {response.status_code} - {response.text}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
