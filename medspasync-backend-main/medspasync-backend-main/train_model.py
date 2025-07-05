import json
from pathlib import Path

from reconciliation.src.matchers.xgboost_matcher import MedSpaXGBoostMatcher


def main():
    data_path = Path('reconciliation/src/ml/training_data.json ')
    model_path = Path('reconciliation/xgboost_model.pkl')

    matcher = MedSpaXGBoostMatcher()
    matcher.train_model(str(data_path))
    matcher.save_model(str(model_path))

    print(f"Model trained and saved to {model_path}")


if __name__ == '__main__':
    main()
