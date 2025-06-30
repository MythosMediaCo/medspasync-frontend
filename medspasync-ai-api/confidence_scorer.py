import logging
import re
import phonenumbers
from datetime import datetime, timedelta
from typing import Dict, List, Tuple, Optional
import numpy as np
from fuzzywuzzy import fuzz
from textblob import TextBlob
import spacy
from sentence_transformers import SentenceTransformer
import pandas as pd
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestClassifier
import joblib
import os

class AdvancedConfidenceScorer:
    """Advanced ML-powered confidence scoring for transaction reconciliation."""

    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.nlp = None
        self.sentence_model = None
        self.scaler = StandardScaler()
        self.classifier = RandomForestClassifier(n_estimators=100, random_state=42)
        self.feature_names = [
            'name_similarity', 'amount_diff', 'date_diff_days', 'phone_similarity',
            'email_similarity', 'service_similarity', 'location_similarity',
            'amount_ratio', 'time_diff_hours', 'provider_match'
        ]
        self._load_models()
        
    def _load_models(self):
        """Load NLP models and pre-trained classifier."""
        try:
            # Load spaCy model for text processing
            self.nlp = spacy.load("en_core_web_sm")
            self.logger.info("Loaded spaCy model")
        except OSError:
            self.logger.warning("spaCy model not found, installing...")
            os.system("python -m spacy download en_core_web_sm")
            self.nlp = spacy.load("en_core_web_sm")
        
        try:
            # Load sentence transformer for semantic similarity
            self.sentence_model = SentenceTransformer('all-MiniLM-L6-v2')
            self.logger.info("Loaded sentence transformer model")
        except Exception as e:
            self.logger.warning(f"Could not load sentence transformer: {e}")
            self.sentence_model = None
            
        # Load pre-trained classifier if available
        self._load_classifier()
    
    def _load_classifier(self):
        """Load pre-trained classifier from disk."""
        try:
            if os.path.exists('models/transaction_classifier.joblib'):
                self.classifier = joblib.load('models/transaction_classifier.joblib')
                self.logger.info("Loaded pre-trained classifier")
        except Exception as e:
            self.logger.warning(f"Could not load classifier: {e}")
    
    def _save_classifier(self):
        """Save trained classifier to disk."""
        try:
            os.makedirs('models', exist_ok=True)
            joblib.dump(self.classifier, 'models/transaction_classifier.joblib')
            self.logger.info("Saved classifier model")
        except Exception as e:
            self.logger.error(f"Could not save classifier: {e}")

    def _normalize_name(self, name: str) -> str:
        """Normalize customer names for comparison."""
        if not name:
            return ""
        
        # Remove extra spaces and convert to lowercase
        normalized = re.sub(r'\s+', ' ', name.strip().lower())
        
        # Remove common titles and suffixes
        titles = ['dr', 'doctor', 'mr', 'mrs', 'ms', 'miss', 'prof', 'professor']
        suffixes = ['jr', 'sr', 'ii', 'iii', 'iv', 'phd', 'md', 'dds']
        
        words = normalized.split()
        filtered_words = []
        
        for word in words:
            if word not in titles and word not in suffixes:
                filtered_words.append(word)
        
        return ' '.join(filtered_words)

    def _calculate_name_similarity(self, name1: str, name2: str) -> float:
        """Calculate name similarity using multiple methods."""
        if not name1 or not name2:
            return 0.0
        
        norm_name1 = self._normalize_name(name1)
        norm_name2 = self._normalize_name(name2)
        
        if not norm_name1 or not norm_name2:
            return 0.0
        
        # Multiple similarity metrics
        exact_match = 1.0 if norm_name1 == norm_name2 else 0.0
        token_sort_ratio = fuzz.token_sort_ratio(norm_name1, norm_name2) / 100.0
        token_set_ratio = fuzz.token_set_ratio(norm_name1, norm_name2) / 100.0
        partial_ratio = fuzz.partial_ratio(norm_name1, norm_name2) / 100.0
        
        # Semantic similarity using sentence transformers
        semantic_similarity = 0.0
        if self.sentence_model:
            try:
                embeddings = self.sentence_model.encode([norm_name1, norm_name2])
                semantic_similarity = np.dot(embeddings[0], embeddings[1]) / (
                    np.linalg.norm(embeddings[0]) * np.linalg.norm(embeddings[1])
                )
            except Exception as e:
                self.logger.warning(f"Semantic similarity failed: {e}")
        
        # Weighted combination
        weights = [0.3, 0.2, 0.2, 0.15, 0.15]
        similarities = [exact_match, token_sort_ratio, token_set_ratio, partial_ratio, semantic_similarity]
        
        return sum(w * s for w, s in zip(weights, similarities))

    def _normalize_phone(self, phone: str) -> str:
        """Normalize phone numbers for comparison."""
        if not phone:
            return ""
        
        try:
            # Parse phone number
            parsed = phonenumbers.parse(phone, "US")
            return phonenumbers.format_number(parsed, phonenumbers.PhoneNumberFormat.E164)
        except:
            # Fallback to basic cleaning
            return re.sub(r'[^\d]', '', phone)

    def _calculate_phone_similarity(self, phone1: str, phone2: str) -> float:
        """Calculate phone number similarity."""
        if not phone1 or not phone2:
            return 0.0
        
        norm_phone1 = self._normalize_phone(phone1)
        norm_phone2 = self._normalize_phone(phone2)
        
        if not norm_phone1 or not norm_phone2:
            return 0.0
        
        # Exact match
        if norm_phone1 == norm_phone2:
            return 1.0
        
        # Partial match (last 7 digits)
        if len(norm_phone1) >= 7 and len(norm_phone2) >= 7:
            if norm_phone1[-7:] == norm_phone2[-7:]:
                return 0.8
        
        # Fuzzy match
        return fuzz.ratio(norm_phone1, norm_phone2) / 100.0

    def _normalize_email(self, email: str) -> str:
        """Normalize email addresses for comparison."""
        if not email:
            return ""
        
        return email.strip().lower()

    def _calculate_email_similarity(self, email1: str, email2: str) -> float:
        """Calculate email similarity."""
        if not email1 or not email2:
            return 0.0
        
        norm_email1 = self._normalize_email(email1)
        norm_email2 = self._normalize_email(email2)
        
        if norm_email1 == norm_email2:
            return 1.0
        
        # Compare local part and domain separately
        try:
            local1, domain1 = norm_email1.split('@')
            local2, domain2 = norm_email2.split('@')
            
            local_similarity = fuzz.ratio(local1, local2) / 100.0
            domain_similarity = 1.0 if domain1 == domain2 else 0.0
            
            return (local_similarity * 0.7 + domain_similarity * 0.3)
        except:
            return fuzz.ratio(norm_email1, norm_email2) / 100.0

    def _parse_date(self, date_str: str) -> Optional[datetime]:
        """Parse date string to datetime object."""
        if not date_str:
            return None
        
        try:
            # Try multiple date formats
            formats = [
                '%Y-%m-%d',
                '%m/%d/%Y',
                '%d/%m/%Y',
                '%Y-%m-%d %H:%M:%S',
                '%m/%d/%Y %H:%M:%S',
                '%Y-%m-%dT%H:%M:%S',
                '%Y-%m-%dT%H:%M:%S.%fZ'
            ]
            
            for fmt in formats:
                try:
                    return datetime.strptime(date_str, fmt)
                except ValueError:
                    continue
            
            # Try pandas parsing as fallback
            return pd.to_datetime(date_str)
        except:
            return None

    def _calculate_date_similarity(self, date1: str, date2: str) -> Tuple[float, float]:
        """Calculate date similarity and time difference."""
        dt1 = self._parse_date(date1)
        dt2 = self._parse_date(date2)
        
        if not dt1 or not dt2:
            return 0.0, float('inf')
        
        # Calculate time difference
        time_diff = abs((dt1 - dt2).total_seconds())
        hours_diff = time_diff / 3600
        days_diff = time_diff / (24 * 3600)
        
        # Date similarity (higher for closer dates)
        if days_diff <= 1:
            date_similarity = 1.0
        elif days_diff <= 7:
            date_similarity = 0.8
        elif days_diff <= 30:
            date_similarity = 0.5
        else:
            date_similarity = 0.1
        
        return date_similarity, hours_diff

    def _calculate_service_similarity(self, service1: str, service2: str) -> float:
        """Calculate service similarity using NLP."""
        if not service1 or not service2:
            return 0.0
        
        # Normalize service names
        service1_norm = service1.strip().lower()
        service2_norm = service2.strip().lower()
        
        if service1_norm == service2_norm:
            return 1.0
        
        # Token-based similarity
        token_similarity = fuzz.token_sort_ratio(service1_norm, service2_norm) / 100.0
        
        # Semantic similarity using spaCy
        semantic_similarity = 0.0
        if self.nlp:
            try:
                doc1 = self.nlp(service1_norm)
                doc2 = self.nlp(service2_norm)
                semantic_similarity = doc1.similarity(doc2)
            except Exception as e:
                self.logger.warning(f"spaCy similarity failed: {e}")
        
        # Weighted combination
        return token_similarity * 0.6 + semantic_similarity * 0.4

    def _extract_features(self, reward_txn: Dict, pos_txn: Dict) -> List[float]:
        """Extract comprehensive features for ML classification."""
        features = []
        
        # Name similarity
        name_sim = self._calculate_name_similarity(
            reward_txn.get('customer_name', ''),
            pos_txn.get('customer_name', '')
        )
        features.append(name_sim)
        
        # Amount difference
        amount1 = float(reward_txn.get('amount', 0))
        amount2 = float(pos_txn.get('amount', 0))
        amount_diff = abs(amount1 - amount2)
        features.append(amount_diff)
        
        # Date similarity and time difference
        date_sim, hours_diff = self._calculate_date_similarity(
            reward_txn.get('date', ''),
            pos_txn.get('date', '')
        )
        features.append(hours_diff / 24)  # Convert to days
        features.append(hours_diff)
        
        # Phone similarity
        phone_sim = self._calculate_phone_similarity(
            reward_txn.get('customer_phone', ''),
            pos_txn.get('customer_phone', '')
        )
        features.append(phone_sim)
        
        # Email similarity
        email_sim = self._calculate_email_similarity(
            reward_txn.get('customer_email', ''),
            pos_txn.get('customer_email', '')
        )
        features.append(email_sim)
        
        # Service similarity
        service_sim = self._calculate_service_similarity(
            reward_txn.get('service', ''),
            pos_txn.get('service', '')
        )
        features.append(service_sim)
        
        # Location similarity
        location_sim = fuzz.ratio(
            reward_txn.get('location', '').lower(),
            pos_txn.get('location', '').lower()
        ) / 100.0
        features.append(location_sim)
        
        # Amount ratio
        amount_ratio = min(amount1, amount2) / max(amount1, amount2) if max(amount1, amount2) > 0 else 0
        features.append(amount_ratio)
        
        # Provider match
        provider_match = 1.0 if reward_txn.get('provider') == pos_txn.get('provider') else 0.0
        features.append(provider_match)
        
        return features

    def calculate_comprehensive_confidence(self, reward_txn: Dict, pos_txn: Dict) -> Dict:
        """Calculate comprehensive confidence score using ML features."""
        start_time = datetime.now()
        
        try:
            # Extract features
            features = self._extract_features(reward_txn, pos_txn)
            
            # Use ML classifier for prediction
            if hasattr(self.classifier, 'predict_proba'):
                # Get probability from trained classifier
                features_scaled = self.scaler.transform([features])
                match_probability = self.classifier.predict_proba(features_scaled)[0][1]
            else:
                # Fallback to rule-based scoring
                match_probability = self._rule_based_scoring(features)
            
            # Calculate processing time
            processing_time = (datetime.now() - start_time).total_seconds() * 1000
            
            # Determine confidence level and recommendation
            confidence_level = self._get_confidence_level(match_probability)
            recommendation = self._get_recommendation(match_probability)
            
            # Component scores for transparency
            component_scores = {
                'name_match': features[0],
                'amount_diff': features[1],
                'date_similarity': 1.0 - min(features[2], 1.0),  # Convert days diff to similarity
                'phone_similarity': features[3],
                'email_similarity': features[4],
                'service_similarity': features[5],
                'location_similarity': features[6],
                'amount_ratio': features[7],
                'provider_match': features[8]
            }
            
            return {
                'overall_confidence': match_probability,
                'confidence_level': confidence_level,
                'recommendation': recommendation,
                'component_scores': component_scores,
                'processing_time_ms': processing_time,
                'features_used': self.feature_names,
                'model_version': '1.0.0'
            }
            
        except Exception as e:
            self.logger.error(f"Error in confidence calculation: {e}")
            return {
                'overall_confidence': 0.0,
                'confidence_level': 'Low',
                'recommendation': 'REVIEW_REQUIRED',
                'component_scores': {},
                'processing_time_ms': 0,
                'error': str(e)
            }

    def _rule_based_scoring(self, features: List[float]) -> float:
        """Fallback rule-based scoring when ML model is not available."""
        name_sim, amount_diff, days_diff, hours_diff, phone_sim, email_sim, service_sim, location_sim, amount_ratio, provider_match = features
        
        # Weighted scoring
        score = 0.0
        
        # Name similarity (30% weight)
        score += name_sim * 0.3
        
        # Amount similarity (25% weight)
        if amount_diff < 0.01:  # Exact match
            score += 0.25
        elif amount_diff < 1.0:  # Within $1
            score += 0.2
        elif amount_diff < 5.0:  # Within $5
            score += 0.1
        
        # Date similarity (20% weight)
        if days_diff <= 1:
            score += 0.2
        elif days_diff <= 7:
            score += 0.15
        elif days_diff <= 30:
            score += 0.1
        
        # Contact similarity (15% weight)
        contact_sim = max(phone_sim, email_sim)
        score += contact_sim * 0.15
        
        # Service similarity (10% weight)
        score += service_sim * 0.1
        
        return min(score, 1.0)

    def _get_confidence_level(self, probability: float) -> str:
        """Convert probability to confidence level."""
        if probability >= 0.95:
            return 'Very High'
        elif probability >= 0.85:
            return 'High'
        elif probability >= 0.70:
            return 'Medium'
        elif probability >= 0.50:
            return 'Low'
        else:
            return 'Very Low'

    def _get_recommendation(self, probability: float) -> str:
        """Convert probability to recommendation."""
        if probability >= 0.95:
            return 'AUTO_APPROVE'
        elif probability >= 0.85:
            return 'APPROVE_RECOMMENDED'
        elif probability >= 0.70:
            return 'REVIEW_RECOMMENDED'
        else:
            return 'REVIEW_REQUIRED'

    def train_model(self, training_data: List[Dict]) -> Dict:
        """Train the ML model with labeled transaction pairs."""
        try:
            X = []  # Features
            y = []  # Labels (1 for match, 0 for no match)
            
            for pair in training_data:
                features = self._extract_features(pair['reward_txn'], pair['pos_txn'])
                X.append(features)
                y.append(1 if pair['is_match'] else 0)
            
            if len(X) < 10:
                return {'error': 'Insufficient training data (need at least 10 samples)'}
            
            # Convert to numpy arrays
            X = np.array(X)
            y = np.array(y)
            
            # Scale features
            X_scaled = self.scaler.fit_transform(X)
            
            # Train classifier
            self.classifier.fit(X_scaled, y)
            
            # Save model
            self._save_classifier()
            
            # Calculate accuracy
            accuracy = self.classifier.score(X_scaled, y)
            
            return {
                'success': True,
                'accuracy': accuracy,
                'training_samples': len(X),
                'model_version': '1.0.0'
            }
            
        except Exception as e:
            self.logger.error(f"Training error: {e}")
            return {'error': str(e)}

    def get_model_info(self) -> Dict:
        """Get information about the current model."""
        return {
            'model_type': 'RandomForest',
            'feature_count': len(self.feature_names),
            'features': self.feature_names,
            'is_trained': hasattr(self.classifier, 'feature_importances_'),
            'version': '1.0.0',
            'nlp_models_loaded': {
                'spacy': self.nlp is not None,
                'sentence_transformer': self.sentence_model is not None
            }
        }
