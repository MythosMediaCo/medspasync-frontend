#!/usr/bin/env python3
"""
MedSpa Reconciliation API - Complete Production Version
Standalone API for medical spa transaction reconciliation
"""

import pandas as pd
import numpy as np
import joblib
import json
import sys
from datetime import datetime
from fuzzywuzzy import fuzz
from difflib import SequenceMatcher

class MedSpaReconciliationAPI:
    """Production API for medical spa transaction reconciliation"""
    
    def __init__(self, model_path='model.pkl'):
        """Initialize the API with the trained model"""
        try:
            print(f"Loading model from: {model_path}")
            self.model_data = joblib.load(model_path)
            self.model = self.model_data['model']
            self.scaler = self.model_data['scaler']
            self.feature_names = self.model_data['feature_names']
            print(f"✅ Model loaded successfully")
            print(f"📊 Features: {len(self.feature_names)}")
        except Exception as e:
            print(f"❌ Error loading model: {e}")
            raise
    
    def engineer_features(self, reward_txn, pos_txn):
        """Engineer features for prediction (same as training)"""
        
        features = {}
        
        # Name similarity
        reward_name = str(reward_txn.get('customer_name', '')).lower()
        pos_name = str(pos_txn.get('customer_name', '')).lower()
        
        # Handle "Last, First" format
        if ',' in pos_name:
            parts = pos_name.split(',')
            if len(parts) == 2:
                pos_name = f"{parts[1].strip()} {parts[0].strip()}"
        
        features['name_fuzz_ratio'] = fuzz.ratio(reward_name, pos_name) / 100.0
        features['name_partial_ratio'] = fuzz.partial_ratio(reward_name, pos_name) / 100.0
        features['name_token_sort'] = fuzz.token_sort_ratio(reward_name, pos_name) / 100.0
        features['name_sequence_match'] = SequenceMatcher(None, reward_name, pos_name).ratio()
        
        # Service similarity
        reward_service = str(reward_txn.get('service', '')).lower()
        pos_service = str(pos_txn.get('service', '')).lower()
        
        features['service_fuzz_ratio'] = fuzz.ratio(reward_service, pos_service) / 100.0
        features['service_partial_ratio'] = fuzz.partial_ratio(reward_service, pos_service) / 100.0
        features['service_token_sort'] = fuzz.token_sort_ratio(reward_service, pos_service) / 100.0
        
        # Service category matching
        service_keywords = {
            'botox': ['botox', 'lyft', 'neurotoxin', 'dysport'],
            'filler': ['filler', 'juvederm', 'voluma', 'restylane'],
            'coolsculpting': ['coolsculpting', 'body sculpting', 'fat freezing'],
            'cooltone': ['cooltone', 'body toning'],
            'laser': ['laser', 'ipl', 'photofacial'],
            'iv': ['iv', 'im', 'injection', 'vitamin', 'b-12']
        }
        
        features['service_category_match'] = 0
        for category, keywords in service_keywords.items():
            reward_match = any(kw in reward_service for kw in keywords)
            pos_match = any(kw in pos_service for kw in keywords)
            if reward_match and pos_match:
                features['service_category_match'] = 1
                break
        
        # Date proximity
        try:
            reward_date = pd.to_datetime(reward_txn.get('date', ''))
            pos_date = pd.to_datetime(pos_txn.get('date', ''))
            
            if pd.notna(reward_date) and pd.notna(pos_date):
                hours_diff = abs((reward_date - pos_date).total_seconds() / 3600)
                features['date_hours_diff'] = hours_diff
                features['date_same_day'] = 1 if hours_diff <= 24 else 0
                features['date_within_week'] = 1 if hours_diff <= 168 else 0
                features['date_proximity_score'] = max(0, 1 - (hours_diff / 168))
            else:
                features['date_hours_diff'] = 999
                features['date_same_day'] = 0
                features['date_within_week'] = 0
                features['date_proximity_score'] = 0
        except:
            features['date_hours_diff'] = 999
            features['date_same_day'] = 0
            features['date_within_week'] = 0
            features['date_proximity_score'] = 0
        
        # Amount analysis
        try:
            reward_amount = float(reward_txn.get('amount', 0))
            pos_amount = float(pos_txn.get('amount', 0))
            
            if pos_amount > 0:
                amount_ratio = reward_amount / pos_amount
                features['amount_ratio'] = amount_ratio
                features['amount_ratio_in_range'] = 1 if 0.05 <= amount_ratio <= 0.5 else 0
            else:
                features['amount_ratio'] = 0
                features['amount_ratio_in_range'] = 0
            
            features['reward_amount'] = reward_amount
            features['pos_amount'] = pos_amount
            
        except:
            features['amount_ratio'] = 0
            features['amount_ratio_in_range'] = 0
            features['reward_amount'] = 0
            features['pos_amount'] = 0
        
        # Provider similarity
        reward_provider = str(reward_txn.get('provider', '')).lower()
        pos_provider = str(pos_txn.get('provider', '')).lower()
        
        if reward_provider and pos_provider:
            features['provider_match'] = fuzz.ratio(reward_provider, pos_provider) / 100.0
        else:
            features['provider_match'] = 0
        
        # Phone matching
        reward_phone = str(reward_txn.get('phone', '')).replace('(', '').replace(')', '').replace('-', '').replace(' ', '')
        pos_phone = str(pos_txn.get('phone', '')).replace('(', '').replace(')', '').replace('-', '').replace(' ', '')
        
        if reward_phone and pos_phone and len(reward_phone) >= 10 and len(pos_phone) >= 10:
            features['phone_match'] = 1 if reward_phone[-10:] == pos_phone[-10:] else 0
        else:
            features['phone_match'] = 0
        
        # Composite features
        features['name_service_combo'] = (features['name_fuzz_ratio'] + features['service_fuzz_ratio']) / 2
        features['overall_similarity'] = (
            features['name_fuzz_ratio'] * 0.4 +
            features['service_fuzz_ratio'] * 0.3 +
            features['date_proximity_score'] * 0.2 +
            features['amount_ratio_in_range'] * 0.1
        )
        
        return features
    
    def predict_match(self, reward_txn, pos_txn, threshold=0.95):
        """
        Predict if two transactions match
        
        Args:
            reward_txn: Dictionary with reward transaction data
            pos_txn: Dictionary with POS transaction data  
            threshold: Confidence threshold for match decision
            
        Returns:
            Dictionary with prediction results
        """
        
        # Engineer features
        features = self.engineer_features(reward_txn, pos_txn)
        
        # Create feature vector
        feature_vector = []
        for feature_name in self.feature_names:
            feature_vector.append(features.get(feature_name, 0))
        
        # Scale features
        feature_vector = np.array(feature_vector).reshape(1, -1)
        feature_vector_scaled = self.scaler.transform(feature_vector)
        
        # Make prediction
        probability = self.model.predict_proba(feature_vector_scaled)[0, 1]
        prediction = 1 if probability >= threshold else 0
        
        # Determine confidence level and recommendation
        if probability >= 0.95:
            confidence = "High"
            recommendation = "Auto-Accept"
        elif probability >= 0.80:
            confidence = "Medium"
            recommendation = "Manual Review"
        else:
            confidence = "Low"
            recommendation = "Likely No Match"
        
        return {
            'match_probability': probability,
            'predicted_match': prediction,
            'confidence_level': confidence,
            'recommendation': recommendation,
            'threshold_used': threshold,
            'feature_analysis': {
                'name_similarity': features.get('name_fuzz_ratio', 0),
                'service_similarity': features.get('service_fuzz_ratio', 0),
                'date_proximity': features.get('date_proximity_score', 0),
                'amount_ratio_valid': features.get('amount_ratio_in_range', 0),
                'overall_similarity': features.get('overall_similarity', 0)
            },
            'processing_timestamp': datetime.now().isoformat()
        }
    
    def batch_predict(self, transaction_pairs, threshold=0.95):
        """
        Process multiple transaction pairs at once
        
        Args:
            transaction_pairs: List of dictionaries with 'reward_transaction' and 'pos_transaction'
            threshold: Confidence threshold for match decisions
            
        Returns:
            List of prediction results
        """
        
        results = []
        
        for i, pair in enumerate(transaction_pairs):
            try:
                result = self.predict_match(
                    pair['reward_transaction'],
                    pair['pos_transaction'],
                    threshold
                )
                result['pair_index'] = i
                results.append(result)
                
            except Exception as e:
                # Handle errors gracefully
                error_result = {
                    'pair_index': i,
                    'error': str(e),
                    'match_probability': 0.0,
                    'predicted_match': 0,
                    'confidence_level': 'Error',
                    'recommendation': 'Manual Review Required'
                }
                results.append(error_result)
        
        return results

def main():
    """Main function for standalone testing"""
    
    print("🏥 MedSpa Reconciliation API - Test Mode")
    print("=" * 50)
    
    # Initialize API
    try:
        api = MedSpaReconciliationAPI()
    except Exception as e:
        print(f"Failed to initialize API: {e}")
        return
    
    # Test with sample data
    sample_pairs = [
        {
            'reward_transaction': {
                'customer_name': 'Sarah Rhea',
                'service': 'CoolSculpting Elite',
                'amount': 50.0,
                'date': '2024-08-15',
                'provider': 'Alondra Aguirre, MA',
                'phone': '(615) 476-7458'
            },
            'pos_transaction': {
                'customer_name': 'Rhea, Sarah',
                'service': 'Body Sculpting',
                'amount': 500.0,
                'date': '2024-08-15 14:30:00',
                'provider': 'Alondra Aguirre, MA',
                'payment_method': 'Alle Rewards'
            }
        },
        {
            'reward_transaction': {
                'customer_name': 'Kristin Bailey',
                'service': 'Juvéderm Voluma XC',
                'amount': 30.0,
                'date': '2024-08-15'
            },
            'pos_transaction': {
                'customer_name': 'Bailey, Kristin',
                'service': 'Dermal Filler Treatment',
                'amount': 300.0,
                'date': '2024-08-15 16:00:00'
            }
        },
        {
            'reward_transaction': {
                'customer_name': 'John Smith',
                'service': 'Botox',
                'amount': 35.0,
                'date': '2024-08-10'
            },
            'pos_transaction': {
                'customer_name': 'Williams, Jane',
                'service': 'Chemical Peel',
                'amount': 200.0,
                'date': '2024-08-20 10:00:00'
            }
        }
    ]
    
    print(f"\n🧪 Testing {len(sample_pairs)} transaction pairs...")
    
    # Test individual predictions
    for i, pair in enumerate(sample_pairs, 1):
        print(f"\n--- Test {i} ---")
        print(f"Reward: {pair['reward_transaction']['customer_name']} | {pair['reward_transaction']['service']}")
        print(f"POS:    {pair['pos_transaction']['customer_name']} | {pair['pos_transaction']['service']}")
        
        try:
            result = api.predict_match(
                pair['reward_transaction'],
                pair['pos_transaction']
            )
            
            print(f"Result: {result['match_probability']:.3f} probability")
            print(f"        {result['confidence_level']} confidence")
            print(f"        {result['recommendation']}")
            
        except Exception as e:
            print(f"Error: {e}")
    
    # Test batch processing
    print(f"\n🔄 Testing batch processing...")
    try:
        batch_results = api.batch_predict(sample_pairs)
        
        auto_accept = sum(1 for r in batch_results if r.get('recommendation') == 'Auto-Accept')
        manual_review = sum(1 for r in batch_results if r.get('recommendation') == 'Manual Review')
        no_match = sum(1 for r in batch_results if r.get('recommendation') == 'Likely No Match')
        
        print(f"📊 Batch Results:")
        print(f"   Auto-Accept: {auto_accept}")
        print(f"   Manual Review: {manual_review}")
        print(f"   No Match: {no_match}")
        
    except Exception as e:
        print(f"Batch processing error: {e}")
    
    print(f"\n✅ API testing complete!")

if __name__ == "__main__":
    # Check if running as a script with arguments (for integration)
    if len(sys.argv) > 1:
        try:
            # Parse input from command line (for Node.js integration)
            input_data = json.loads(sys.argv[1])
            api = MedSpaReconciliationAPI()
            
            result = api.predict_match(
                input_data['reward_transaction'],
                input_data['pos_transaction'],
                input_data.get('threshold', 0.95)
            )
            
            print(json.dumps(result))
            
        except Exception as e:
            error_result = {
                'error': str(e),
                'match_probability': 0.0,
                'confidence_level': 'Error'
            }
            print(json.dumps(error_result))
    else:
        # Run in test mode
        main()