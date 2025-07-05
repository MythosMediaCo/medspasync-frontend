import json
from pathlib import Path

from reconciliation.src.matchers.xgboost_matcher import MedSpaXGBoostMatcher

CORRECTIONS_FILE = Path('reconciliation/corrections.jsonl')
TRAINING_DATA = Path('reconciliation/src/ml/training_data.json ')
MODEL_PATH = Path('reconciliation/xgboost_model.pkl')


def load_corrections():
    if not CORRECTIONS_FILE.exists():
        return []
    with open(CORRECTIONS_FILE, 'r') as f:
        return [json.loads(line) for line in f]


def append_to_training(data):
    if TRAINING_DATA.exists():
        existing = json.loads(TRAINING_DATA.read_text())
    else:
        existing = []
    existing.extend(data)
    TRAINING_DATA.write_text(json.dumps(existing, indent=2))


def main():
    corrections = load_corrections()
    if not corrections:
        print('No corrections found.')
        return

    append_to_training(corrections)
    matcher = MedSpaXGBoostMatcher()
    matcher.train_model(str(TRAINING_DATA))
    matcher.save_model(str(MODEL_PATH))
    CORRECTIONS_FILE.unlink()
    print('Model retrained with corrections.')


if __name__ == '__main__':
    main()
