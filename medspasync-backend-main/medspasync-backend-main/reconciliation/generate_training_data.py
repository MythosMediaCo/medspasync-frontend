import os
import json
import random

import pandas as pd
from faker import Faker
from rapidfuzz import fuzz


def load_reward_transactions(path: str) -> pd.DataFrame:
    """Load reward transactions from CSV."""
    return pd.read_csv(path)


def generate_synthetic_pos(n: int = 100) -> pd.DataFrame:
    """Generate synthetic POS transactions."""
    faker = Faker()
    data = []
    for _ in range(n):
        data.append({
            "name": faker.name(),
            "phone": faker.numerify(text="###-###-####"),
            "amount": round(random.uniform(10, 200), 2),
            "timestamp": faker.date_time_this_year().isoformat(),
        })
    return pd.DataFrame(data)


def similarity(a: pd.Series, b: pd.Series) -> float:
    """Compute similarity score between two transactions."""
    name_score = fuzz.token_set_ratio(str(a["name"]), str(b["name"])) / 100.0
    phone_score = fuzz.ratio(str(a["phone"]), str(b["phone"])) / 100.0
    amount_diff = abs(float(a["amount"]) - float(b["amount"]))
    max_amount = max(float(a["amount"]), float(b["amount"]), 1.0)
    amount_score = max(0.0, 1.0 - amount_diff / max_amount)
    time_diff = abs(pd.to_datetime(a["timestamp"]) - pd.to_datetime(b["timestamp"]))
    time_score = max(0.0, 1.0 - time_diff.total_seconds() / 86400.0)  # degrade after a day
    return (name_score + phone_score + amount_score + time_score) / 4.0


def main():
    rewards_path = "DEMO1.csv"
    reward_df = load_reward_transactions(rewards_path)
    pos_df = generate_synthetic_pos(len(reward_df))

    rows = []
    for _, reward in reward_df.iterrows():
        for _, pos in pos_df.iterrows():
            score = similarity(reward, pos)
            if score >= 0.97:
                label = True
            elif score <= 0.70:
                label = False
            else:
                continue  # skip uncertain pairs
            rows.append({
                "reward": reward.to_dict(),
                "pos": pos.to_dict(),
                "is_match": label,
                "score": score,
            })

    os.makedirs("data", exist_ok=True)
    with open(os.path.join("data", "training_data.json"), "w") as f:
        json.dump(rows, f, indent=2)


if __name__ == "__main__":
    main()
