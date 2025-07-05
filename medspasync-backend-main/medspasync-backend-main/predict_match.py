import json
import sys
from pathlib import Path

from reconciliation.src.matchers.xgboost_matcher import MedSpaXGBoostMatcher
from reconciliation.confidence_engine import ConfidenceBasedDecisionEngine


def load_json(path: str):
    with open(path, 'r') as f:
        return json.load(f)


def main():
    if len(sys.argv) != 3:
        print("Usage: python predict_match.py reward_txn.json pos_txn.json")
        sys.exit(1)

    reward = load_json(sys.argv[1])
    pos = load_json(sys.argv[2])

    model = MedSpaXGBoostMatcher()
    model.load_model('reconciliation/xgboost_model.pkl')
    score = model.predict_match(reward, pos)

    engine = ConfidenceBasedDecisionEngine()
    decision = engine.decide(score)
    print(json.dumps({'score': score, 'decision': decision}, indent=2))


if __name__ == '__main__':
    main()
