"""Smoke test for the ML service health endpoint."""

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health() -> None:
    res = client.get("/health")
    assert res.status_code == 200
    body = res.json()
    assert body["service"] == "signbridge-ml"
    assert body["status"] == "ok"
