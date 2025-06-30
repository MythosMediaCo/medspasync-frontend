import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from app import app

def test_health():
    client = app.test_client()
    resp = client.get('/health')
    assert resp.status_code == 200
    data = resp.get_json()
    assert data['status'] == 'OK'


def test_predict_missing_fields():
    client = app.test_client()
    resp = client.post('/predict', json={})
    assert resp.status_code == 400
    data = resp.get_json()
    assert data['success'] is False


def test_predict_success():
    client = app.test_client()
    payload = {
        'reward_transaction': {
            'customer_name': 'Sarah Johnson',
            'service': 'Botox Treatment',
            'amount': 35.0,
            'date': '2024-08-15'
        },
        'pos_transaction': {
            'customer_name': 'Johnson, Sarah',
            'service': 'Neurotoxin Injection',
            'amount': 350.0,
            'date': '2024-08-15 14:30:00'
        },
        'threshold': 0.5
    }
    resp = client.post('/predict', json=payload)
    assert resp.status_code == 200
    data = resp.get_json()
    assert data['success'] is True
    assert 'result' in data
