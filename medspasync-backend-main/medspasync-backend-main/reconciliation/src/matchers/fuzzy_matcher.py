from datetime import datetime
from thefuzz import fuzz

class EnhancedMedSpaFuzzyMatcher:
    def __init__(self):
        self.weights = {
            'phone': 0.40,
            'name': 0.30,
            'amount': 0.20,
            'timing': 0.10
        }

    def normalize_and_compare_phones(self, phone1, phone2):
        def normalize(phone):
            return ''.join(filter(str.isdigit, str(phone or "")))
        return 1.0 if normalize(phone1) == normalize(phone2) else 0.0

    def medical_spa_name_match(self, name1, name2):
        return fuzz.token_sort_ratio(name1 or '', name2 or '') / 100.0

    def amount_match_with_tolerance(self, amount1, amount2, tolerance_percent=0.05):
        try:
            a1 = float(amount1)
            a2 = float(amount2)
            return 1.0 if abs(a1 - a2) <= tolerance_percent * max(a1, a2) else 0.0
        except:
            return 0.0

    def calculate_timing_score(self, ts1, ts2, max_hours=24):
        try:
            if isinstance(ts1, str): ts1 = datetime.fromisoformat(ts1)
            if isinstance(ts2, str): ts2 = datetime.fromisoformat(ts2)
            diff_hours = abs((ts1 - ts2).total_seconds()) / 3600
            return max(0.0, 1.0 - min(diff_hours / max_hours, 1.0))
        except:
            return 0.0

    def classify_confidence(self, score):
        if score >= 0.95:
            return 'high'
        elif score >= 0.85:
            return 'medium'
        else:
            return 'low'

    def calculate_match_score(self, txn1, txn2):
        scores = {
            'phone': self.normalize_and_compare_phones(txn1.get('phone'), txn2.get('phone')),
            'name': self.medical_spa_name_match(txn1.get('customer_name'), txn2.get('customer_name')),
            'amount': self.amount_match_with_tolerance(txn1.get('amount'), txn2.get('amount')),
            'timing': self.calculate_timing_score(txn1.get('timestamp'), txn2.get('timestamp'))
        }

        final_score = sum(scores[k] * self.weights[k] for k in scores)
        return {
            'overall_score': final_score,
            'component_scores': scores,
            'is_match': final_score >= 0.85,
            'confidence_level': self.classify_confidence(final_score)
        }


class ExactMatcher:
    def find_exact_matches(self, rewards, pos_data):
        matches = []
        for r in rewards:
            for p in pos_data:
                if r.get('amount') == p.get('amount') and r.get('timestamp') == p.get('timestamp'):
                    matches.append({'reward_txn': r, 'pos_txn': p, 'confidence': 1.0})
        return matches


class MedSpaSyncMultiStageReconciler:
    def __init__(self):
        self.stage1_exact = ExactMatcher()
        self.stage2_fuzzy = EnhancedMedSpaFuzzyMatcher()

    def exclude_matched(self, dataset, matches):
        matched_ids = {(m['reward_txn'].get('id'), m['pos_txn'].get('id')) for m in matches}
        return [
            txn for txn in dataset
            if txn.get('id') not in {mid for pair in matched_ids for mid in pair}
        ]

    def deduplicate_matches(self, matches):
        seen = set()
        unique = []
        for m in sorted(matches, key=lambda x: -x['confidence']):
            key = (m['reward_txn'].get('id'), m['pos_txn'].get('id'))
            if key not in seen:
                seen.add(key)
                unique.append(m)
        return unique

    def reconcile_transactions(self, alle_data, aspire_data, pos_data):
        results = {
            'stage1_exact': [],
            'stage2_fuzzy': [],
            'unmatched': []
        }

        combined_rewards = alle_data + aspire_data
        exact_matches = self.stage1_exact.find_exact_matches(combined_rewards, pos_data)
        results['stage1_exact'] = exact_matches

        remaining_rewards = self.exclude_matched(combined_rewards, exact_matches)
        remaining_pos = self.exclude_matched(pos_data, exact_matches)

        fuzzy_matches = []
        for reward_txn in remaining_rewards:
            for pos_txn in remaining_pos:
                match_result = self.stage2_fuzzy.calculate_match_score(reward_txn, pos_txn)
                if match_result['is_match']:
                    fuzzy_matches.append({
                        'reward_txn': reward_txn,
                        'pos_txn': pos_txn,
                        'confidence': match_result['overall_score'],
                        'details': match_result['component_scores']
                    })

        results['stage2_fuzzy'] = self.deduplicate_matches(fuzzy_matches)
        return results
