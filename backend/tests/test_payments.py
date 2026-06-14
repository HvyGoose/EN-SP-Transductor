"""Backend tests for Stripe payment endpoints."""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://bilingual-voice-6.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"


@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# --- create-checkout endpoint ---
class TestCreateCheckout:
    def test_create_checkout_success(self, session):
        payload = {
            "origin_url": "https://bilingual-voice-6.preview.emergentagent.com",
            "email": "TEST_payments_user@example.com",
        }
        r = session.post(f"{API}/payments/create-checkout", json=payload, timeout=30)
        assert r.status_code == 200, f"Status {r.status_code}: {r.text}"
        data = r.json()
        assert "checkout_url" in data
        assert "session_id" in data
        assert isinstance(data["checkout_url"], str) and data["checkout_url"].startswith("http")
        assert isinstance(data["session_id"], str) and len(data["session_id"]) > 0
        # save for next test
        pytest.checkout_session_id = data["session_id"]

    def test_create_checkout_missing_origin(self, session):
        r = session.post(f"{API}/payments/create-checkout", json={"email": "TEST_x@example.com"}, timeout=15)
        # Pydantic should reject (422) or 500
        assert r.status_code in (400, 422, 500)

    def test_create_checkout_anonymous_email(self, session):
        r = session.post(
            f"{API}/payments/create-checkout",
            json={"origin_url": "https://bilingual-voice-6.preview.emergentagent.com"},
            timeout=30,
        )
        assert r.status_code == 200
        data = r.json()
        assert "checkout_url" in data and "session_id" in data


# --- payment status endpoint ---
class TestPaymentStatus:
    def test_get_status_for_existing_session(self, session):
        # Use session_id from previous create-checkout
        sid = getattr(pytest, "checkout_session_id", None)
        if not sid:
            pytest.skip("No session id available")
        r = session.get(f"{API}/payments/status/{sid}", timeout=30)
        assert r.status_code == 200, f"Status {r.status_code}: {r.text}"
        data = r.json()
        assert "status" in data
        assert "payment_status" in data
        # newly created session is typically 'open' / 'unpaid'
        assert data["payment_status"] in ("paid", "unpaid", "no_payment_required")

    def test_get_status_invalid_session(self, session):
        r = session.get(f"{API}/payments/status/cs_test_invalid_xxx", timeout=30)
        # Stripe returns error -> backend converts to 500
        assert r.status_code in (400, 404, 500)


# --- check-premium endpoint ---
class TestCheckPremium:
    def test_check_premium_non_existing_email(self, session):
        r = session.post(
            f"{API}/payments/check-premium",
            json={"email": "TEST_nonexistent_user_xyz@example.com"},
            timeout=15,
        )
        assert r.status_code == 200
        data = r.json()
        assert not data.get("is_premium")
        assert "email" in data

    def test_check_premium_missing_email(self, session):
        r = session.post(f"{API}/payments/check-premium", json={}, timeout=15)
        assert r.status_code in (400, 422)
