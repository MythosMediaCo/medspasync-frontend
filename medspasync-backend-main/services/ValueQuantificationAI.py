import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
import json
import logging
from dataclasses import dataclass
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import StandardScaler
import joblib
import os

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class ValueMetrics:
    total_roi: float
    time_saved: float
    revenue_recovered: float
    efficiency_gain: float
    accuracy_improvement: float
    cost_savings: float
    predicted_lifetime_value: float
    confidence_interval: Tuple[float, float]

class ValueQuantificationAI:
    def __init__(self):
        self.model = None
        self.scaler = StandardScaler()
        self.is_trained = False
        
        # Industry benchmarks for medical spas
        self.benchmarks = {
            'hourly_rate': 45.0,  # Average hourly rate for medical spa staff
            'transaction_processing_time': 0.25,  # Hours per transaction
            'error_rate_reduction': 0.85,  # 85% reduction in errors
            'revenue_leakage_rate': 0.03,  # 3% average revenue leakage
            'efficiency_improvement': 0.67,  # 67% efficiency improvement
            'accuracy_target': 0.947  # 94.7% target accuracy
        }
        
        # Load pre-trained model if available
        self.load_model()
    
    def load_model(self):
        """Load pre-trained value quantification model"""
        try:
            model_path = os.path.join(os.path.dirname(__file__), 'models', 'value_quantification_model.pkl')
            if os.path.exists(model_path):
                self.model = joblib.load(model_path)
                self.is_trained = True
                logger.info("Loaded pre-trained value quantification model")
            else:
                logger.info("No pre-trained model found, will train new model")
        except Exception as e:
            logger.error(f"Error loading model: {e}")
    
    def save_model(self):
        """Save the trained model"""
        try:
            model_dir = os.path.join(os.path.dirname(__file__), 'models')
            os.makedirs(model_dir, exist_ok=True)
            model_path = os.path.join(model_dir, 'value_quantification_model.pkl')
            joblib.dump(self.model, model_path)
            logger.info("Model saved successfully")
        except Exception as e:
            logger.error(f"Error saving model: {e}")
    
    def calculate_real_time_value(self, practice_data: Dict) -> ValueMetrics:
        """
        Calculate real-time value metrics for a practice
        
        Args:
            practice_data: Dictionary containing practice usage and performance data
            
        Returns:
            ValueMetrics object with calculated values
        """
        try:
            # Extract key metrics from practice data
            transactions_processed = practice_data.get('transactions_processed', 0)
            time_spent = practice_data.get('time_spent', 0)
            errors_detected = practice_data.get('errors_detected', 0)
            revenue_found = practice_data.get('revenue_found', 0)
            accuracy_rate = practice_data.get('accuracy_rate', 0.947)
            
            # Calculate time savings
            manual_processing_time = transactions_processed * self.benchmarks['transaction_processing_time']
            time_saved = manual_processing_time - time_spent
            
            # Calculate revenue recovery
            total_revenue_recovered = revenue_found + (errors_detected * 150)  # Average $150 per error
            
            # Calculate efficiency gain
            efficiency_gain = (time_saved / manual_processing_time) * 100 if manual_processing_time > 0 else 0
            
            # Calculate accuracy improvement
            accuracy_improvement = (accuracy_rate - 0.85) * 100  # Baseline 85%
            
            # Calculate cost savings
            labor_savings = time_saved * self.benchmarks['hourly_rate']
            error_savings = errors_detected * 150  # Average cost per error
            cost_savings = labor_savings + error_savings
            
            # Calculate total ROI
            total_investment = practice_data.get('monthly_subscription', 299)
            total_benefits = cost_savings + total_revenue_recovered
            total_roi = (total_benefits / total_investment) * 100 if total_investment > 0 else 0
            
            # Predict lifetime value
            predicted_lifetime_value = self.predict_lifetime_value(practice_data)
            
            # Calculate confidence interval
            confidence_interval = self.calculate_confidence_interval(practice_data)
            
            return ValueMetrics(
                total_roi=total_roi,
                time_saved=time_saved,
                revenue_recovered=total_revenue_recovered,
                efficiency_gain=efficiency_gain,
                accuracy_improvement=accuracy_improvement,
                cost_savings=cost_savings,
                predicted_lifetime_value=predicted_lifetime_value,
                confidence_interval=confidence_interval
            )
            
        except Exception as e:
            logger.error(f"Error calculating real-time value: {e}")
            raise
    
    def predict_lifetime_value(self, practice_data: Dict) -> float:
        """
        Predict customer lifetime value based on current usage patterns
        
        Args:
            practice_data: Dictionary containing practice data
            
        Returns:
            Predicted lifetime value in dollars
        """
        try:
            # Extract features for prediction
            features = self.extract_prediction_features(practice_data)
            
            if self.model is not None and self.is_trained:
                # Use trained model for prediction
                prediction = self.model.predict([features])[0]
                return max(0, prediction)
            else:
                # Use heuristic-based prediction
                return self.heuristic_lifetime_value(practice_data)
                
        except Exception as e:
            logger.error(f"Error predicting lifetime value: {e}")
            return 0.0
    
    def extract_prediction_features(self, practice_data: Dict) -> List[float]:
        """Extract features for lifetime value prediction"""
        features = [
            practice_data.get('transactions_processed', 0),
            practice_data.get('time_spent', 0),
            practice_data.get('accuracy_rate', 0.947),
            practice_data.get('days_since_signup', 30),
            practice_data.get('feature_adoption_rate', 0.5),
            practice_data.get('support_tickets', 0),
            practice_data.get('monthly_revenue', 50000),
            practice_data.get('team_size', 5)
        ]
        return features
    
    def heuristic_lifetime_value(self, practice_data: Dict) -> float:
        """Calculate lifetime value using heuristic approach"""
        try:
            monthly_revenue = practice_data.get('monthly_revenue', 50000)
            team_size = practice_data.get('team_size', 5)
            accuracy_rate = practice_data.get('accuracy_rate', 0.947)
            
            # Base lifetime value calculation
            base_lifetime = monthly_revenue * 12 * 3  # 3 years average
            
            # Adjust for team size
            team_multiplier = min(team_size / 5, 2.0)
            
            # Adjust for accuracy improvement
            accuracy_multiplier = 1 + (accuracy_rate - 0.85) * 2
            
            # Calculate predicted lifetime value
            predicted_lifetime = base_lifetime * team_multiplier * accuracy_multiplier
            
            return max(0, predicted_lifetime)
            
        except Exception as e:
            logger.error(f"Error in heuristic lifetime value calculation: {e}")
            return 0.0
    
    def calculate_confidence_interval(self, practice_data: Dict) -> Tuple[float, float]:
        """
        Calculate confidence interval for value predictions
        
        Args:
            practice_data: Dictionary containing practice data
            
        Returns:
            Tuple of (lower_bound, upper_bound)
        """
        try:
            # Calculate standard deviation based on data quality
            data_quality = practice_data.get('data_quality_score', 0.8)
            sample_size = practice_data.get('transactions_processed', 100)
            
            # Base confidence level
            confidence_level = 0.95
            
            # Adjust confidence based on data quality and sample size
            adjusted_confidence = confidence_level * data_quality * min(sample_size / 1000, 1.0)
            
            # Calculate margin of error
            margin_of_error = (1 - adjusted_confidence) * 0.2  # 20% base margin
            
            # Get base prediction
            base_prediction = self.predict_lifetime_value(practice_data)
            
            # Calculate bounds
            lower_bound = base_prediction * (1 - margin_of_error)
            upper_bound = base_prediction * (1 + margin_of_error)
            
            return (lower_bound, upper_bound)
            
        except Exception as e:
            logger.error(f"Error calculating confidence interval: {e}")
            return (0.0, 0.0)
    
    def generate_value_insights(self, practice_data: Dict, value_metrics: ValueMetrics) -> List[Dict]:
        """
        Generate actionable insights based on value metrics
        
        Args:
            practice_data: Dictionary containing practice data
            value_metrics: Calculated value metrics
            
        Returns:
            List of insight dictionaries
        """
        insights = []
        
        try:
            # ROI insights
            if value_metrics.total_roi < 100:
                insights.append({
                    'type': 'roi_optimization',
                    'priority': 'high',
                    'title': 'Optimize Your ROI',
                    'description': f'Your current ROI is {value_metrics.total_roi:.1f}%. Let\'s get it above 100%.',
                    'recommendations': [
                        'Increase transaction volume',
                        'Improve data quality',
                        'Use advanced features'
                    ]
                })
            
            # Time savings insights
            if value_metrics.time_saved < 10:
                insights.append({
                    'type': 'time_savings',
                    'priority': 'medium',
                    'title': 'Increase Time Savings',
                    'description': f'You\'ve saved {value_metrics.time_saved:.1f} hours. Target: 10+ hours.',
                    'recommendations': [
                        'Process more transactions',
                        'Automate manual workflows',
                        'Use batch processing'
                    ]
                })
            
            # Accuracy insights
            if value_metrics.accuracy_improvement < 10:
                insights.append({
                    'type': 'accuracy_improvement',
                    'priority': 'medium',
                    'title': 'Improve Accuracy',
                    'description': f'Accuracy improvement: {value_metrics.accuracy_improvement:.1f}%. Target: 10%+.',
                    'recommendations': [
                        'Review data quality',
                        'Use validation rules',
                        'Enable AI suggestions'
                    ]
                })
            
            # Efficiency insights
            if value_metrics.efficiency_gain < 50:
                insights.append({
                    'type': 'efficiency_gain',
                    'priority': 'medium',
                    'title': 'Boost Efficiency',
                    'description': f'Efficiency gain: {value_metrics.efficiency_gain:.1f}%. Target: 50%+.',
                    'recommendations': [
                        'Streamline workflows',
                        'Use templates',
                        'Enable automation'
                    ]
                })
            
            # Revenue recovery insights
            if value_metrics.revenue_recovered < 1000:
                insights.append({
                    'type': 'revenue_recovery',
                    'priority': 'high',
                    'title': 'Recover More Revenue',
                    'description': f'Revenue recovered: ${value_metrics.revenue_recovered:.0f}. Target: $1,000+.',
                    'recommendations': [
                        'Review all transactions',
                        'Enable error detection',
                        'Use reconciliation tools'
                    ]
                })
            
            return insights
            
        except Exception as e:
            logger.error(f"Error generating insights: {e}")
            return []
    
    def calculate_trend_analysis(self, historical_data: List[Dict]) -> Dict:
        """
        Analyze value trends over time
        
        Args:
            historical_data: List of historical value metrics
            
        Returns:
            Dictionary containing trend analysis
        """
        try:
            if not historical_data or len(historical_data) < 2:
                return {
                    'trend': 'insufficient_data',
                    'growth_rate': 0.0,
                    'projection': 0.0,
                    'confidence': 0.0
                }
            
            # Convert to DataFrame for analysis
            df = pd.DataFrame(historical_data)
            df['date'] = pd.to_datetime(df['date'])
            df = df.sort_values('date')
            
            # Calculate growth rates
            roi_growth = self.calculate_growth_rate(df['total_roi'].values)
            time_savings_growth = self.calculate_growth_rate(df['time_saved'].values)
            revenue_growth = self.calculate_growth_rate(df['revenue_recovered'].values)
            
            # Determine overall trend
            avg_growth = (roi_growth + time_savings_growth + revenue_growth) / 3
            
            if avg_growth > 0.1:
                trend = 'strong_growth'
            elif avg_growth > 0:
                trend = 'moderate_growth'
            elif avg_growth > -0.1:
                trend = 'stable'
            else:
                trend = 'declining'
            
            # Calculate projection
            latest_values = df.iloc[-1]
            projection = {
                'roi': latest_values['total_roi'] * (1 + roi_growth),
                'time_saved': latest_values['time_saved'] * (1 + time_savings_growth),
                'revenue_recovered': latest_values['revenue_recovered'] * (1 + revenue_growth)
            }
            
            # Calculate confidence based on data consistency
            confidence = self.calculate_trend_confidence(df)
            
            return {
                'trend': trend,
                'growth_rate': avg_growth,
                'projection': projection,
                'confidence': confidence,
                'details': {
                    'roi_growth': roi_growth,
                    'time_savings_growth': time_savings_growth,
                    'revenue_growth': revenue_growth
                }
            }
            
        except Exception as e:
            logger.error(f"Error calculating trend analysis: {e}")
            return {
                'trend': 'error',
                'growth_rate': 0.0,
                'projection': 0.0,
                'confidence': 0.0
            }
    
    def calculate_growth_rate(self, values: np.ndarray) -> float:
        """Calculate growth rate between first and last values"""
        if len(values) < 2:
            return 0.0
        
        initial_value = values[0]
        final_value = values[-1]
        
        if initial_value == 0:
            return 0.0
        
        return (final_value - initial_value) / initial_value
    
    def calculate_trend_confidence(self, df: pd.DataFrame) -> float:
        """Calculate confidence in trend analysis based on data consistency"""
        try:
            # Calculate coefficient of variation for key metrics
            roi_cv = df['total_roi'].std() / df['total_roi'].mean() if df['total_roi'].mean() > 0 else 1
            time_cv = df['time_saved'].std() / df['time_saved'].mean() if df['time_saved'].mean() > 0 else 1
            revenue_cv = df['revenue_recovered'].std() / df['revenue_recovered'].mean() if df['revenue_recovered'].mean() > 0 else 1
            
            # Average coefficient of variation
            avg_cv = (roi_cv + time_cv + revenue_cv) / 3
            
            # Convert to confidence score (lower CV = higher confidence)
            confidence = max(0, 1 - avg_cv)
            
            return confidence
            
        except Exception as e:
            logger.error(f"Error calculating trend confidence: {e}")
            return 0.5
    
    def generate_value_report(self, practice_data: Dict, value_metrics: ValueMetrics) -> Dict:
        """
        Generate comprehensive value report
        
        Args:
            practice_data: Dictionary containing practice data
            value_metrics: Calculated value metrics
            
        Returns:
            Dictionary containing comprehensive value report
        """
        try:
            # Calculate insights
            insights = self.generate_value_insights(practice_data, value_metrics)
            
            # Calculate trends if historical data available
            historical_data = practice_data.get('historical_data', [])
            trend_analysis = self.calculate_trend_analysis(historical_data)
            
            # Generate recommendations
            recommendations = self.generate_recommendations(practice_data, value_metrics)
            
            # Calculate benchmarks
            benchmarks = self.calculate_benchmarks(practice_data, value_metrics)
            
            report = {
                'summary': {
                    'total_roi': value_metrics.total_roi,
                    'time_saved': value_metrics.time_saved,
                    'revenue_recovered': value_metrics.revenue_recovered,
                    'efficiency_gain': value_metrics.efficiency_gain,
                    'predicted_lifetime_value': value_metrics.predicted_lifetime_value
                },
                'insights': insights,
                'trends': trend_analysis,
                'recommendations': recommendations,
                'benchmarks': benchmarks,
                'confidence_interval': value_metrics.confidence_interval,
                'generated_at': datetime.now().isoformat()
            }
            
            return report
            
        except Exception as e:
            logger.error(f"Error generating value report: {e}")
            return {
                'error': str(e),
                'generated_at': datetime.now().isoformat()
            }
    
    def generate_recommendations(self, practice_data: Dict, value_metrics: ValueMetrics) -> List[Dict]:
        """Generate actionable recommendations"""
        recommendations = []
        
        try:
            # ROI recommendations
            if value_metrics.total_roi < 200:
                recommendations.append({
                    'category': 'roi_optimization',
                    'title': 'Optimize for Higher ROI',
                    'description': 'Focus on high-impact activities to increase ROI',
                    'actions': [
                        'Process more transactions per session',
                        'Use advanced reconciliation features',
                        'Implement automated workflows'
                    ],
                    'expected_impact': '20-40% ROI increase'
                })
            
            # Time savings recommendations
            if value_metrics.time_saved < 20:
                recommendations.append({
                    'category': 'time_optimization',
                    'title': 'Maximize Time Savings',
                    'description': 'Streamline processes to save more time',
                    'actions': [
                        'Use batch processing for large files',
                        'Enable automatic error detection',
                        'Set up recurring reconciliation tasks'
                    ],
                    'expected_impact': 'Additional 10-15 hours saved per month'
                })
            
            # Accuracy recommendations
            if value_metrics.accuracy_improvement < 15:
                recommendations.append({
                    'category': 'accuracy_improvement',
                    'title': 'Improve Reconciliation Accuracy',
                    'description': 'Enhance data quality and validation',
                    'actions': [
                        'Review and clean source data',
                        'Use validation rules and templates',
                        'Enable AI-powered suggestions'
                    ],
                    'expected_impact': '5-10% accuracy improvement'
                })
            
            return recommendations
            
        except Exception as e:
            logger.error(f"Error generating recommendations: {e}")
            return []
    
    def calculate_benchmarks(self, practice_data: Dict, value_metrics: ValueMetrics) -> Dict:
        """Calculate performance against industry benchmarks"""
        try:
            benchmarks = {
                'roi': {
                    'current': value_metrics.total_roi,
                    'industry_average': 150.0,
                    'top_percentile': 300.0,
                    'performance': 'average'
                },
                'time_savings': {
                    'current': value_metrics.time_saved,
                    'industry_average': 15.0,
                    'top_percentile': 30.0,
                    'performance': 'average'
                },
                'accuracy': {
                    'current': value_metrics.accuracy_improvement,
                    'industry_average': 10.0,
                    'top_percentile': 20.0,
                    'performance': 'average'
                },
                'efficiency': {
                    'current': value_metrics.efficiency_gain,
                    'industry_average': 50.0,
                    'top_percentile': 75.0,
                    'performance': 'average'
                }
            }
            
            # Determine performance levels
            for metric, data in benchmarks.items():
                current = data['current']
                average = data['industry_average']
                top = data['top_percentile']
                
                if current >= top:
                    data['performance'] = 'excellent'
                elif current >= average:
                    data['performance'] = 'good'
                elif current >= average * 0.7:
                    data['performance'] = 'fair'
                else:
                    data['performance'] = 'needs_improvement'
            
            return benchmarks
            
        except Exception as e:
            logger.error(f"Error calculating benchmarks: {e}")
            return {}
    
    def train_model(self, training_data: List[Dict]):
        """
        Train the value quantification model
        
        Args:
            training_data: List of training examples with features and targets
        """
        try:
            if not training_data:
                logger.warning("No training data provided")
                return
            
            # Extract features and targets
            features = []
            targets = []
            
            for example in training_data:
                feature_vector = self.extract_prediction_features(example)
                target = example.get('lifetime_value', 0)
                
                features.append(feature_vector)
                targets.append(target)
            
            # Convert to numpy arrays
            X = np.array(features)
            y = np.array(targets)
            
            # Scale features
            X_scaled = self.scaler.fit_transform(X)
            
            # Train model
            self.model = RandomForestRegressor(n_estimators=100, random_state=42)
            self.model.fit(X_scaled, y)
            
            self.is_trained = True
            
            # Save model
            self.save_model()
            
            logger.info("Model trained successfully")
            
        except Exception as e:
            logger.error(f"Error training model: {e}")
            raise

# Create singleton instance
value_quantification_ai = ValueQuantificationAI()

if __name__ == "__main__":
    # Example usage
    practice_data = {
        'transactions_processed': 500,
        'time_spent': 8.5,
        'errors_detected': 12,
        'revenue_found': 850,
        'accuracy_rate': 0.947,
        'monthly_revenue': 75000,
        'team_size': 8,
        'days_since_signup': 45,
        'feature_adoption_rate': 0.7,
        'support_tickets': 2,
        'data_quality_score': 0.9
    }
    
    # Calculate value metrics
    metrics = value_quantification_ai.calculate_real_time_value(practice_data)
    
    # Generate report
    report = value_quantification_ai.generate_value_report(practice_data, metrics)
    
    print("Value Quantification Results:")
    print(f"Total ROI: {metrics.total_roi:.1f}%")
    print(f"Time Saved: {metrics.time_saved:.1f} hours")
    print(f"Revenue Recovered: ${metrics.revenue_recovered:.0f}")
    print(f"Predicted Lifetime Value: ${metrics.predicted_lifetime_value:.0f}")
    print(f"Confidence Interval: ${metrics.confidence_interval[0]:.0f} - ${metrics.confidence_interval[1]:.0f}") 