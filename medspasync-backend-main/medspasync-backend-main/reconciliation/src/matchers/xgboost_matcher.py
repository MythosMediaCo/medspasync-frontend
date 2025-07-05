import json
from datetime import datetime
from typing import Any, Dict, List

import numpy as np
from xgboost import XGBClassifier
from thefuzz import fuzz
import pickle


class MedSpaXGBoostMatcher:
    """Matcher that uses an XGBoost classifier to predict transaction matches."""

    def __init__(self, model: XGBClassifier | None = None):
        self.model = model or XGBClassifier(use_label_encoder=False, eval_metric="logloss")

    @staticmethod
    def _normalize_phone(phone: str | None) -> str:
        return "".join(filter(str.isdigit, str(phone or "")))

    @staticmethod
    def _name_similarity(name1: str | None, name2: str | None) -> float:
        return fuzz.token_set_ratio(name1 or "", name2 or "") / 100.0

    @staticmethod
    def _phone_match(phone1: str | None, phone2: str | None) -> float:
        return float(MedSpaXGBoostMatcher._normalize_phone(phone1) == MedSpaXGBoostMatcher._normalize_phone(phone2))

    @staticmethod
    def _email_domain_match(email1: str | None, email2: str | None) -> float:
        def domain(email: str | None) -> str:
            if not email or "@" not in email:
                return ""
            return email.split("@", 1)[1].lower()

        return float(domain(email1) == domain(email2) and domain(email1) != "")

    @staticmethod
    def _amount_diff_percent(a1: Any, a2: Any) -> float:
        try:
            a1f = float(a1)
            a2f = float(a2)
            diff = abs(a1f - a2f)
            return diff / max(max(a1f, a2f), 1.0)
        except Exception:
            return 1.0

    @staticmethod
    def _timestamp_diff_seconds(t1: Any, t2: Any) -> float:
        try:
            if isinstance(t1, str):
                t1 = datetime.fromisoformat(t1)
            if isinstance(t2, str):
                t2 = datetime.fromisoformat(t2)
            return abs((t1 - t2).total_seconds())
        except Exception:
            return 1e9

    @staticmethod
    def _service_similarity(s1: str | None, s2: str | None) -> float:
        if not s1 or not s2:
            return 0.0
        return fuzz.token_set_ratio(s1, s2) / 100.0

    @classmethod
    def _extract_features(cls, txn1: Dict[str, Any], txn2: Dict[str, Any]) -> List[float]:
        return [
            cls._name_similarity(txn1.get("name"), txn2.get("name")),
            cls._phone_match(txn1.get("phone"), txn2.get("phone")),
            cls._email_domain_match(txn1.get("email"), txn2.get("email")),
            cls._amount_diff_percent(txn1.get("amount"), txn2.get("amount")),
            cls._timestamp_diff_seconds(txn1.get("timestamp"), txn2.get("timestamp")),
            cls._service_similarity(txn1.get("service"), txn2.get("service")),
        ]

    @staticmethod
    def _load_training_data(path: str) -> List[Dict[str, Any]]:
        with open(path, "r") as f:
            return json.load(f)

    def train_model(self, path: str = "data/training_data.json") -> None:
        data = self._load_training_data(path)
        X = []
        y = []
        for row in data:
            reward = row.get("reward", {})
            pos = row.get("pos", {})
            X.append(self._extract_features(reward, pos))
            y.append(1 if row.get("is_match") else 0)
        X = np.array(X)
        y = np.array(y)
        if len(set(y)) <= 1:
            # Ensure XGBoost has at least two classes by injecting a dummy sample
            dummy_label = 1 - int(y[0]) if len(y) else 1
            dummy_features = np.zeros(X.shape[1])
            X = np.vstack([X, dummy_features])
            y = np.append(y, dummy_label)
        self.model.fit(X, y)

    def predict_match(self, txn1: Dict[str, Any], txn2: Dict[str, Any]) -> float:
        features = np.array([self._extract_features(txn1, txn2)])
        proba = self.model.predict_proba(features)[0, 1]
        return float(proba)

    def save_model(self, path: str) -> None:
        with open(path, "wb") as f:
            pickle.dump(self.model, f)

    def load_model(self, path: str) -> None:
        with open(path, "rb") as f:
            self.model = pickle.load(f)
