from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Dict

from reconciliation.src.matchers.xgboost_matcher import MedSpaXGBoostMatcher
from reconciliation.confidence_engine import ConfidenceBasedDecisionEngine

app = FastAPI(title="MedSpa AI Reconciliation API")

model = MedSpaXGBoostMatcher()
model_path = 'reconciliation/xgboost_model.pkl'
try:
    model.load_model(model_path)
except FileNotFoundError:
    # Model not trained yet
    model = None

decision_engine = ConfidenceBasedDecisionEngine()


class Transaction(BaseModel):
    id: str | None = None
    name: str | None = None
    phone: str | None = None
    email: str | None = None
    amount: float | None = None
    timestamp: str | None = None
    service: str | None = None


class PredictionRequest(BaseModel):
    reward: Transaction
    pos: Transaction


@app.post('/predict')
async def predict(req: PredictionRequest) -> Dict:
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded")

    score = model.predict_match(req.reward.dict(), req.pos.dict())
    decision = decision_engine.decide(score)
    return {"score": score, "decision": decision}


@app.get('/health')
async def health() -> Dict:
    return {"status": "ok", "model_loaded": model is not None}


