"""
Iteration 7 Features Test Suite - TudoAqui Marketplace Angola
New features testing:
- Document Verification (Partner uploads, Admin reviews)
- IVA Toggle (Admin controls, Public IVA settings)
- Partner Menu Management (CRUD menu items, auto-create restaurant)
- Partner Order Management (View orders, update status, notifications)
- Advanced Sales Reports (period filter, IVA calculation)
- Referral System (unique codes, apply code, coupons)
"""
import pytest
import requests
import os
import uuid
import base64
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')


# ============ DOCUMENT VERIFICATION MODULE ============

class TestDocumentVerification:
    """Partner document upload and admin review tests"""
    document_id = None
    
    def test_01_upload_document(self, partner_session):
        """POST /api/partners/documents/upload - uploads document for review"""
        # Create a simple test file (base64 encoded)
        test_content = b"Test document content for BI verification"
        file_base64 = "data:application/pdf;base64," + base64.b64encode(test_content).decode()
        
        doc_data = {
            "doc_type": "bi",
            "file_data": file_base64,
            "file_name": f"test_bi_{uuid.uuid4().hex[:6]}.pdf"
        }
        
        response = partner_session.post(f"{BASE_URL}/api/partners/documents/upload", json=doc_data)
        print(f"Upload document response: {response.status_code}")
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert "document_id" in data
        assert data["status"] == "pendente"
        assert "message" in data
        
        TestDocumentVerification.document_id = data["document_id"]
        print(f"✅ Document uploaded: {data['document_id']}, status=pendente")
    
    def test_02_get_my_documents(self, partner_session):
        """GET /api/partners/documents - lists partner documents without file_data"""
        response = partner_session.get(f"{BASE_URL}/api/partners/documents")
        print(f"Get my documents response: {response.status_code}")
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert "documents" in data
        
        # Verify file_data is NOT included in listing
        for doc in data["documents"]:
            assert "file_data" not in doc, "file_data should NOT be in listing"
            assert "document_id" in doc
            assert "doc_type" in doc
            assert "status" in doc
        
        print(f"✅ Partner documents: {len(data['documents'])} docs (no file_data exposed)")
    
    def test_03_invalid_doc_type_rejected(self, partner_session):
        """Invalid doc_type should be rejected"""
        doc_data = {
            "doc_type": "invalid_type",
            "file_data": "data:application/pdf;base64,dGVzdA==",
            "file_name": "test.pdf"
        }
        
        response = partner_session.post(f"{BASE_URL}/api/partners/documents/upload", json=doc_data)
        print(f"Invalid doc_type response: {response.status_code}")
        assert response.status_code == 400
        print(f"✅ Invalid doc_type correctly rejected")


class TestAdminDocumentReview:
    """Admin document review tests"""
    
    def test_01_get_pending_documents(self, admin_session):
        """GET /api/admin/documents/pending - lists pending documents"""
        response = admin_session.get(f"{BASE_URL}/api/admin/documents/pending")
        print(f"Pending documents response: {response.status_code}")
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert "documents" in data
        assert "total" in data
        
        # Check structure
        for doc in data["documents"]:
            assert "document_id" in doc
            assert "status" in doc
            assert doc["status"] == "pendente"
            assert "business_name" in doc  # Enriched with partner info
        
        print(f"✅ Pending documents: {data['total']} pending for review")
    
    def test_02_approve_document(self, admin_session):
        """POST /api/admin/documents/{doc_id}/review - approve document"""
        # Get a pending document
        pending_res = admin_session.get(f"{BASE_URL}/api/admin/documents/pending")
        pending_docs = pending_res.json()["documents"]
        
        if not pending_docs:
            pytest.skip("No pending documents to approve")
        
        doc_id = pending_docs[0]["document_id"]
        
        response = admin_session.post(
            f"{BASE_URL}/api/admin/documents/{doc_id}/review",
            json={"action": "approve"}
        )
        print(f"Approve document response: {response.status_code}")
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert data["status"] == "aprovado"
        print(f"✅ Document {doc_id} approved")
    
    def test_03_reject_document_with_reason(self, admin_session):
        """POST /api/admin/documents/{doc_id}/review - reject with reason"""
        # First upload a new doc to reject
        test_content = b"Test document to reject"
        file_base64 = "data:application/pdf;base64," + base64.b64encode(test_content).decode()
        
        upload_res = admin_session.post(f"{BASE_URL}/api/partners/documents/upload", json={
            "doc_type": "nif",
            "file_data": file_base64,
            "file_name": "test_nif_reject.pdf"
        })
        
        if upload_res.status_code != 200:
            pytest.skip("Could not upload test document")
        
        doc_id = upload_res.json()["document_id"]
        
        response = admin_session.post(
            f"{BASE_URL}/api/admin/documents/{doc_id}/review",
            json={"action": "reject", "reason": "Documento ilegível"}
        )
        print(f"Reject document response: {response.status_code}")
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert data["status"] == "rejeitado"
        print(f"✅ Document {doc_id} rejected with reason")


# ============ IVA TOGGLE MODULE ============

class TestIVASettings:
    """IVA toggle and settings tests"""
    
    def test_01_get_iva_settings_admin(self, admin_session):
        """GET /api/admin/iva-settings - get IVA toggle state"""
        response = admin_session.get(f"{BASE_URL}/api/admin/iva-settings")
        print(f"Get IVA settings response: {response.status_code}")
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert "enabled" in data
        assert "rate" in data
        print(f"✅ IVA settings: enabled={data['enabled']}, rate={data['rate']}%")
    
    def test_02_update_iva_settings(self, admin_session):
        """PUT /api/admin/iva-settings - toggle IVA on/off"""
        # Toggle IVA on with 14%
        iva_data = {"enabled": True, "rate": 14.0}
        
        response = admin_session.put(f"{BASE_URL}/api/admin/iva-settings", json=iva_data)
        print(f"Update IVA settings response: {response.status_code}")
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert data["message"] == "IVA atualizado"
        assert data["iva_settings"]["enabled"] == True
        assert data["iva_settings"]["rate"] == 14.0
        print(f"✅ IVA enabled at {data['iva_settings']['rate']}%")
    
    def test_03_get_public_iva_settings(self, partner_session):
        """GET /api/settings/iva - public IVA settings for checkout"""
        response = partner_session.get(f"{BASE_URL}/api/settings/iva")
        print(f"Public IVA settings response: {response.status_code}")
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert "enabled" in data
        assert "rate" in data
        print(f"✅ Public IVA: enabled={data['enabled']}, rate={data['rate']}%")


# ============ PARTNER MENU MANAGEMENT ============

class TestPartnerMenuManagement:
    """Partner menu CRUD tests"""
    menu_item_id = None
    restaurant_id = None
    
    def test_01_get_menu_items_creates_restaurant(self, partner_session):
        """GET /api/partners/menu-items - lists items and auto-creates restaurant"""
        response = partner_session.get(f"{BASE_URL}/api/partners/menu-items")
        print(f"Get menu items response: {response.status_code}")
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert "restaurant" in data
        assert "menu_items" in data
        
        # Restaurant should be auto-created
        restaurant = data["restaurant"]
        assert "restaurant_id" in restaurant
        assert "name" in restaurant
        
        TestPartnerMenuManagement.restaurant_id = restaurant["restaurant_id"]
        print(f"✅ Menu items: {len(data['menu_items'])} items, restaurant={restaurant['name']}")
    
    def test_02_create_menu_item(self, partner_session):
        """POST /api/partners/menu-items - creates new menu item"""
        item_data = {
            "name": f"Test Item {uuid.uuid4().hex[:6]}",
            "description": "Delicious test item for testing",
            "price": 1500.0,
            "category": "Principal",
            "image": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c"
        }
        
        response = partner_session.post(f"{BASE_URL}/api/partners/menu-items", json=item_data)
        print(f"Create menu item response: {response.status_code}")
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert "item_id" in data
        assert data["name"] == item_data["name"]
        assert data["price"] == item_data["price"]
        assert data["available"] == True
        
        TestPartnerMenuManagement.menu_item_id = data["item_id"]
        print(f"✅ Menu item created: {data['item_id']}, price={data['price']} Kz")
    
    def test_03_update_menu_item(self, partner_session):
        """PUT /api/partners/menu-items/{id} - updates menu item"""
        if not TestPartnerMenuManagement.menu_item_id:
            pytest.skip("No menu_item_id from previous test")
        
        update_data = {
            "name": "Updated Test Item",
            "price": 2000.0,
            "available": False
        }
        
        response = partner_session.put(
            f"{BASE_URL}/api/partners/menu-items/{TestPartnerMenuManagement.menu_item_id}",
            json=update_data
        )
        print(f"Update menu item response: {response.status_code}")
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert data["name"] == "Updated Test Item"
        assert data["price"] == 2000.0
        assert data["available"] == False
        print(f"✅ Menu item updated: {data['name']}, price={data['price']} Kz, available={data['available']}")
    
    def test_04_delete_menu_item(self, partner_session):
        """DELETE /api/partners/menu-items/{id} - deletes menu item"""
        # Create a new item to delete
        create_res = partner_session.post(f"{BASE_URL}/api/partners/menu-items", json={
            "name": "Item to Delete",
            "description": "Will be deleted",
            "price": 500.0,
            "category": "Teste"
        })
        
        if create_res.status_code != 200:
            pytest.skip("Could not create test item for deletion")
        
        item_id = create_res.json()["item_id"]
        
        response = partner_session.delete(f"{BASE_URL}/api/partners/menu-items/{item_id}")
        print(f"Delete menu item response: {response.status_code}")
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert data["message"] == "Item removido com sucesso"
        print(f"✅ Menu item {item_id} deleted")


# ============ PARTNER ORDER MANAGEMENT ============

class TestPartnerOrderManagement:
    """Partner incoming orders tests"""
    order_id = None
    
    def test_01_get_incoming_orders(self, partner_session):
        """GET /api/partners/incoming-orders - lists orders for partner's restaurant"""
        response = partner_session.get(f"{BASE_URL}/api/partners/incoming-orders")
        print(f"Get incoming orders response: {response.status_code}")
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert "orders" in data
        assert "total" in data
        
        if data["orders"]:
            TestPartnerOrderManagement.order_id = data["orders"][0]["order_id"]
        
        print(f"✅ Incoming orders: {data['total']} orders")
    
    def test_02_create_order_for_partner_restaurant(self, second_user_session, partner_session):
        """Create an order to test partner order management"""
        # Get partner's restaurant
        menu_res = partner_session.get(f"{BASE_URL}/api/partners/menu-items")
        if menu_res.status_code != 200:
            pytest.skip("Could not get partner restaurant")
        
        restaurant_id = menu_res.json()["restaurant"]["restaurant_id"]
        menu_items = menu_res.json()["menu_items"]
        
        if not menu_items:
            # Create a menu item first
            item_res = partner_session.post(f"{BASE_URL}/api/partners/menu-items", json={
                "name": "Muamba Test",
                "description": "Test dish",
                "price": 2500.0,
                "category": "Principal"
            })
            if item_res.status_code == 200:
                menu_items = [item_res.json()]
        
        if not menu_items:
            pytest.skip("No menu items available")
        
        # Create order as second user
        order_data = {
            "restaurant_id": restaurant_id,
            "items": [{"item_id": menu_items[0].get("item_id", "test"), "name": menu_items[0]["name"], "price": menu_items[0]["price"], "quantity": 2}],
            "delivery_address": "Rua Test 456, Luanda",
            "payment_method": "transferencia",
            "notes": "Test order for partner management"
        }
        
        response = second_user_session.post(f"{BASE_URL}/api/orders", json=order_data)
        print(f"Create order response: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            TestPartnerOrderManagement.order_id = data["order_id"]
            print(f"✅ Test order created: {data['order_id']}")
        else:
            print(f"Order creation failed (may not have restaurant): {response.text}")
    
    def test_03_update_order_status(self, partner_session):
        """PATCH /api/partners/incoming-orders/{id} - updates order status"""
        # Get an order to update
        orders_res = partner_session.get(f"{BASE_URL}/api/partners/incoming-orders")
        orders = orders_res.json().get("orders", [])
        
        if not orders:
            pytest.skip("No orders available to update")
        
        order_id = orders[0]["order_id"]
        current_status = orders[0]["status"]
        
        # Determine next status
        status_flow = {"confirmado": "preparando", "pago": "preparando", "preparando": "a_caminho", "a_caminho": "entregue"}
        next_status = status_flow.get(current_status, "preparando")
        
        response = partner_session.patch(
            f"{BASE_URL}/api/partners/incoming-orders/{order_id}",
            json={"status": next_status}
        )
        print(f"Update order status response: {response.status_code}")
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert data["status"] == next_status
        print(f"✅ Order {order_id} status updated to: {next_status}")
    
    def test_04_filter_orders_by_status(self, partner_session):
        """GET /api/partners/incoming-orders?status=X - filters by status"""
        response = partner_session.get(f"{BASE_URL}/api/partners/incoming-orders?status=preparando")
        print(f"Filter orders response: {response.status_code}")
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        for order in data["orders"]:
            assert order["status"] == "preparando"
        
        print(f"✅ Filtered orders by status 'preparando': {len(data['orders'])} found")
    
    def test_05_invalid_status_rejected(self, partner_session):
        """Invalid order status should be rejected"""
        orders_res = partner_session.get(f"{BASE_URL}/api/partners/incoming-orders")
        orders = orders_res.json().get("orders", [])
        
        if not orders:
            pytest.skip("No orders available")
        
        order_id = orders[0]["order_id"]
        
        response = partner_session.patch(
            f"{BASE_URL}/api/partners/incoming-orders/{order_id}",
            json={"status": "invalid_status"}
        )
        print(f"Invalid status response: {response.status_code}")
        assert response.status_code == 400
        print(f"✅ Invalid order status correctly rejected")


# ============ SALES REPORTS ============

class TestSalesReports:
    """Admin sales reports tests"""
    
    def test_01_sales_report_day(self, admin_session):
        """GET /api/admin/reports/sales?period=day"""
        response = admin_session.get(f"{BASE_URL}/api/admin/reports/sales?period=day")
        print(f"Sales report (day) response: {response.status_code}")
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert data["period"] == "day"
        assert "start_date" in data
        assert "orders" in data
        assert "payments" in data
        assert "iva" in data
        
        # Check IVA calculation
        iva = data["iva"]
        assert "enabled" in iva
        assert "rate" in iva
        assert "amount" in iva
        
        print(f"✅ Sales report (day): {data['orders']['total']} orders, IVA={iva['amount']} Kz")
    
    def test_02_sales_report_week(self, admin_session):
        """GET /api/admin/reports/sales?period=week"""
        response = admin_session.get(f"{BASE_URL}/api/admin/reports/sales?period=week")
        print(f"Sales report (week) response: {response.status_code}")
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert data["period"] == "week"
        print(f"✅ Sales report (week): {data['orders']['total']} orders, revenue={data['orders']['revenue']} Kz")
    
    def test_03_sales_report_month(self, admin_session):
        """GET /api/admin/reports/sales?period=month"""
        response = admin_session.get(f"{BASE_URL}/api/admin/reports/sales?period=month")
        print(f"Sales report (month) response: {response.status_code}")
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert data["period"] == "month"
        assert "data" in data
        assert "orders" in data["data"]
        assert "payments" in data["data"]
        print(f"✅ Sales report (month): revenue={data['orders']['revenue']} Kz, commission={data['commission']['estimated']} Kz")


# ============ REFERRAL SYSTEM ============

class TestReferralSystem:
    """Referral codes and coupons tests"""
    referral_code = None
    
    def test_01_get_my_referral_code(self, partner_session):
        """GET /api/referral/my-code - generates/returns unique referral code"""
        response = partner_session.get(f"{BASE_URL}/api/referral/my-code")
        print(f"Get referral code response: {response.status_code}")
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert "referral_code" in data
        assert data["referral_code"].startswith("TUDO")
        assert len(data["referral_code"]) == 10  # TUDO + 6 chars
        assert "rewards" in data
        assert "stats" in data
        assert "share_message" in data
        
        TestReferralSystem.referral_code = data["referral_code"]
        print(f"✅ Referral code: {data['referral_code']}, stats={data['stats']}")
    
    def test_02_referral_rewards_structure(self, partner_session):
        """Verify referral rewards structure"""
        response = partner_session.get(f"{BASE_URL}/api/referral/my-code")
        data = response.json()
        
        rewards = data["rewards"]
        assert "referrer" in rewards
        assert "referred" in rewards
        
        # Referrer: 500Kz discount
        assert rewards["referrer"]["type"] == "discount"
        assert rewards["referrer"]["amount"] == 500
        
        # Referred: 20% off first order
        assert rewards["referred"]["type"] == "percentage"
        assert rewards["referred"]["amount"] == 20
        
        print(f"✅ Rewards: referrer={rewards['referrer']['amount']}Kz, referred={rewards['referred']['amount']}%")
    
    def test_03_get_my_referrals(self, partner_session):
        """GET /api/referral/my-referrals - lists referrals made by user"""
        response = partner_session.get(f"{BASE_URL}/api/referral/my-referrals")
        print(f"Get my referrals response: {response.status_code}")
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert "referrals" in data
        print(f"✅ My referrals: {len(data['referrals'])} referrals made")
    
    def test_04_get_my_coupons(self, partner_session):
        """GET /api/referral/my-coupons - lists user's coupons"""
        response = partner_session.get(f"{BASE_URL}/api/referral/my-coupons")
        print(f"Get my coupons response: {response.status_code}")
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert "coupons" in data
        print(f"✅ My coupons: {len(data['coupons'])} coupons")
    
    def test_05_cannot_use_own_code(self, partner_session):
        """User cannot apply their own referral code"""
        if not TestReferralSystem.referral_code:
            pytest.skip("No referral code from previous test")
        
        response = partner_session.post(
            f"{BASE_URL}/api/referral/apply",
            json={"code": TestReferralSystem.referral_code}
        )
        print(f"Apply own code response: {response.status_code}")
        assert response.status_code == 400
        assert "próprio código" in response.text.lower() or "already" in response.text.lower() or "já utilizou" in response.text.lower()
        print(f"✅ Cannot use own referral code correctly rejected")
    
    def test_06_invalid_code_rejected(self, second_user_session):
        """Invalid referral code should be rejected"""
        response = second_user_session.post(
            f"{BASE_URL}/api/referral/apply",
            json={"code": "INVALID123"}
        )
        print(f"Invalid code response: {response.status_code}")
        assert response.status_code in [400, 404]
        print(f"✅ Invalid referral code correctly rejected")


# ============ FIXTURES ============

@pytest.fixture(scope="module")
def admin_session():
    """Create authenticated session with CEO admin user"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    
    response = session.post(f"{BASE_URL}/api/auth/login", json={
        "email": "test@tudoaqui.ao",
        "password": "test123"
    })
    
    if response.status_code == 200:
        for cookie in response.cookies:
            session.cookies.set(cookie.name, cookie.value)
        print(f"✅ Authenticated as CEO admin user (test@tudoaqui.ao)")
    else:
        pytest.fail(f"Could not authenticate admin: {response.status_code} - {response.text}")
    
    return session


@pytest.fixture(scope="module")
def partner_session():
    """Create authenticated session with partner user (same as admin in this case)"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    
    response = session.post(f"{BASE_URL}/api/auth/login", json={
        "email": "test@tudoaqui.ao",
        "password": "test123"
    })
    
    if response.status_code == 200:
        for cookie in response.cookies:
            session.cookies.set(cookie.name, cookie.value)
        print(f"✅ Authenticated as partner user (test@tudoaqui.ao)")
    else:
        pytest.fail(f"Could not authenticate partner: {response.status_code} - {response.text}")
    
    return session


@pytest.fixture(scope="module")
def second_user_session():
    """Create authenticated session with second test user"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    
    response = session.post(f"{BASE_URL}/api/auth/login", json={
        "email": "amigo@tudoaqui.ao",
        "password": "test123"
    })
    
    if response.status_code == 200:
        for cookie in response.cookies:
            session.cookies.set(cookie.name, cookie.value)
        print(f"✅ Authenticated as second user (amigo@tudoaqui.ao)")
    else:
        pytest.fail(f"Could not authenticate second user: {response.status_code} - {response.text}")
    
    return session


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
