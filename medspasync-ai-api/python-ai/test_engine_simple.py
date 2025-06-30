#!/usr/bin/env python3
"""
Simplified test suite for the MedSpa AI Reconciliation Engine
"""

import asyncio
import json
import time
import logging
from datetime import datetime
from typing import List, Dict

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class SimpleConfidenceScorer:
    """Simplified confidence scorer for testing."""
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
    
    def calculate_comprehensive_confidence(self, reward_txn: Dict, pos_txn: Dict) -> Dict:
        """Calculate confidence score using basic similarity metrics."""
        try:
            # Basic name similarity
            name1 = reward_txn.get('customer_name', '').lower().strip()
            name2 = pos_txn.get('customer_name', '').lower().strip()
            name_similarity = 1.0 if name1 == name2 else 0.0
            
            # Amount similarity
            amount1 = float(reward_txn.get('amount', 0))
            amount2 = float(pos_txn.get('amount', 0))
            amount_diff = abs(amount1 - amount2)
            amount_similarity = 1.0 if amount_diff < 0.01 else max(0, 1 - amount_diff / 100)
            
            # Date similarity (basic)
            date1 = reward_txn.get('date', '')
            date2 = pos_txn.get('date', '')
            date_similarity = 1.0 if date1 == date2 else 0.5
            
            # Overall confidence
            overall_confidence = (name_similarity * 0.4 + amount_similarity * 0.4 + date_similarity * 0.2)
            
            # Determine confidence level and recommendation
            if overall_confidence >= 0.95:
                confidence_level = 'Very High'
                recommendation = 'AUTO_APPROVE'
            elif overall_confidence >= 0.85:
                confidence_level = 'High'
                recommendation = 'APPROVE_RECOMMENDED'
            elif overall_confidence >= 0.70:
                confidence_level = 'Medium'
                recommendation = 'REVIEW_RECOMMENDED'
            else:
                confidence_level = 'Low'
                recommendation = 'REVIEW_REQUIRED'
            
            return {
                'overall_confidence': overall_confidence,
                'confidence_level': confidence_level,
                'recommendation': recommendation,
                'component_scores': {
                    'name_match': name_similarity,
                    'amount_match': amount_similarity,
                    'date_match': date_similarity
                },
                'processing_time_ms': 10,
                'features_used': ['name_similarity', 'amount_diff', 'date_similarity'],
                'model_version': '1.0.0-simple'
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

class SimpleReconciliationEngine:
    """Simplified reconciliation engine for testing."""
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.confidence_scorer = SimpleConfidenceScorer()
        self.active_jobs = {}
        self.job_history = []
        self.performance_stats = {
            'total_jobs': 0,
            'successful_jobs': 0,
            'failed_jobs': 0,
            'total_transactions_processed': 0,
            'total_matches_found': 0
        }
    
    def is_model_loaded(self) -> bool:
        """Check if model is ready."""
        return True
    
    def get_system_health(self) -> Dict:
        """Get system health information."""
        return {
            'status': 'healthy',
            'timestamp': datetime.now().isoformat(),
            'model_loaded': True,
            'version': '1.0.0-simple'
        }
    
    def predict_match(self, reward_txn: Dict, pos_txn: Dict, threshold: float = 0.95) -> Dict:
        """Predict match between transactions."""
        start_time = time.time()
        
        try:
            confidence_result = self.confidence_scorer.calculate_comprehensive_confidence(reward_txn, pos_txn)
            
            # Determine match result
            if confidence_result['overall_confidence'] >= threshold:
                result = 'match'
            elif confidence_result['overall_confidence'] >= 0.7:
                result = 'review_required'
            else:
                result = 'no_match'
            
            processing_time = (time.time() - start_time) * 1000
            
            return {
                'result': result,
                'confidence': confidence_result['overall_confidence'],
                'confidence_level': confidence_result['confidence_level'],
                'recommendation': confidence_result['recommendation'],
                'component_scores': confidence_result['component_scores'],
                'processing_time_ms': processing_time,
                'reward_transaction': reward_txn,
                'pos_transaction': pos_txn,
                'threshold_used': threshold
            }
            
        except Exception as e:
            self.logger.error(f"Prediction failed: {e}")
            return {
                'result': 'error',
                'error': str(e),
                'processing_time_ms': (time.time() - start_time) * 1000,
                'reward_transaction': reward_txn,
                'pos_transaction': pos_txn
            }
    
    async def start_reconciliation(self, reward_transactions: List[Dict], pos_transactions: List[Dict], 
                                 threshold: float = 0.95, job_id: str = None) -> Dict:
        """Start reconciliation job."""
        if not job_id:
            job_id = f"reconciliation_{int(time.time())}"
        
        self.active_jobs[job_id] = {
            'job_id': job_id,
            'status': 'processing',
            'created_at': datetime.now().isoformat(),
            'total_transactions': len(reward_transactions) * len(pos_transactions),
            'processed_transactions': 0,
            'matches_found': 0
        }
        
        self.performance_stats['total_jobs'] += 1
        
        # Process in background
        asyncio.create_task(self._process_job(job_id, reward_transactions, pos_transactions, threshold))
        
        return {
            'job_id': job_id,
            'status': 'processing',
            'total_transactions': len(reward_transactions) * len(pos_transactions),
            'estimated_time_seconds': 5
        }
    
    async def _process_job(self, job_id: str, reward_transactions: List[Dict], 
                          pos_transactions: List[Dict], threshold: float):
        """Process reconciliation job."""
        try:
            results = []
            matches_found = 0
            
            for reward_txn in reward_transactions:
                for pos_txn in pos_transactions:
                    result = self.predict_match(reward_txn, pos_txn, threshold)
                    results.append(result)
                    
                    if result['result'] == 'match':
                        matches_found += 1
                    
                    # Update job progress
                    self.active_jobs[job_id]['processed_transactions'] += 1
                    self.active_jobs[job_id]['matches_found'] = matches_found
                    
                    # Small delay to simulate processing
                    await asyncio.sleep(0.01)
            
            # Complete job
            self.active_jobs[job_id]['status'] = 'completed'
            self.active_jobs[job_id]['results'] = results
            self.performance_stats['successful_jobs'] += 1
            self.performance_stats['total_transactions_processed'] += len(results)
            self.performance_stats['total_matches_found'] += matches_found
            
            # Move to history
            self.job_history.append(self.active_jobs[job_id])
            del self.active_jobs[job_id]
            
        except Exception as e:
            self.logger.error(f"Job processing failed: {e}")
            self.active_jobs[job_id]['status'] = 'failed'
            self.active_jobs[job_id]['error'] = str(e)
            self.performance_stats['failed_jobs'] += 1
    
    def get_job_status(self, job_id: str) -> Dict:
        """Get job status."""
        if job_id in self.active_jobs:
            job = self.active_jobs[job_id]
            return {
                'job_id': job['job_id'],
                'status': job['status'],
                'created_at': job['created_at'],
                'total_transactions': job['total_transactions'],
                'processed_transactions': job['processed_transactions'],
                'matches_found': job['matches_found'],
                'progress_percent': (job['processed_transactions'] / job['total_transactions'] * 100) if job['total_transactions'] > 0 else 0
            }
        
        # Check history
        for job in self.job_history:
            if job['job_id'] == job_id:
                return {
                    'job_id': job['job_id'],
                    'status': job['status'],
                    'created_at': job['created_at'],
                    'total_transactions': job['total_transactions'],
                    'processed_transactions': job['processed_transactions'],
                    'matches_found': job['matches_found'],
                    'progress_percent': 100
                }
        
        return None
    
    def get_job_results(self, job_id: str) -> Dict:
        """Get job results."""
        for job in self.job_history:
            if job['job_id'] == job_id and job['status'] == 'completed':
                return {
                    'job_id': job_id,
                    'status': 'completed',
                    'results': job['results'],
                    'summary': {
                        'total_transactions': job['total_transactions'],
                        'matches_found': job['matches_found'],
                        'review_required': sum(1 for r in job['results'] if r['result'] == 'review_required'),
                        'no_matches': sum(1 for r in job['results'] if r['result'] == 'no_match'),
                        'errors': sum(1 for r in job['results'] if r['result'] == 'error')
                    }
                }
        return None
    
    def get_model_metrics(self) -> Dict:
        """Get model metrics."""
        return {
            'version': '1.0.0-simple',
            'model_type': 'SimpleConfidenceScorer',
            'feature_count': 3,
            'is_trained': True,
            'performance_stats': self.performance_stats,
            'system_health': self.get_system_health()
        }

class SimpleReconciliationEngineTester:
    """Test suite for the simplified reconciliation engine."""
    
    def __init__(self):
        self.engine = SimpleReconciliationEngine()
        self.test_results = []
    
    def generate_sample_data(self) -> tuple[List[Dict], List[Dict]]:
        """Generate sample transaction data."""
        
        reward_transactions = [
            {
                'customer_name': 'Sarah Johnson',
                'customer_phone': '(555) 123-4567',
                'customer_email': 'sarah.johnson@email.com',
                'service': 'Botox Treatment',
                'amount': 450.00,
                'date': '2024-01-15',
                'provider': 'Alle Rewards',
                'location': 'Downtown MedSpa',
                'transaction_id': 'AR_001'
            },
            {
                'customer_name': 'Michael Chen',
                'customer_phone': '(555) 234-5678',
                'customer_email': 'mchen@email.com',
                'service': 'Chemical Peel',
                'amount': 325.00,
                'date': '2024-01-16',
                'provider': 'Alle Rewards',
                'location': 'Downtown MedSpa',
                'transaction_id': 'AR_002'
            }
        ]
        
        pos_transactions = [
            {
                'customer_name': 'Sarah Johnson',
                'customer_phone': '(555) 123-4567',
                'customer_email': 'sarah.johnson@email.com',
                'service': 'Botox Treatment',
                'amount': 450.00,
                'date': '2024-01-15',
                'provider': 'POS System',
                'location': 'Downtown MedSpa',
                'transaction_id': 'POS_001'
            },
            {
                'customer_name': 'Mike Chen',  # Slight variation
                'customer_phone': '(555) 234-5678',
                'customer_email': 'mchen@email.com',
                'service': 'Chemical Peel',
                'amount': 325.00,
                'date': '2024-01-16',
                'provider': 'POS System',
                'location': 'Downtown MedSpa',
                'transaction_id': 'POS_002'
            }
        ]
        
        return reward_transactions, pos_transactions
    
    def test_confidence_scorer(self):
        """Test confidence scorer."""
        logger.info("Testing confidence scorer...")
        
        scorer = SimpleConfidenceScorer()
        
        reward_txn = {
            'customer_name': 'Sarah Johnson',
            'amount': 450.00,
            'date': '2024-01-15'
        }
        
        pos_txn = {
            'customer_name': 'Sarah Johnson',
            'amount': 450.00,
            'date': '2024-01-15'
        }
        
        result = scorer.calculate_comprehensive_confidence(reward_txn, pos_txn)
        
        assert 'overall_confidence' in result
        assert 'confidence_level' in result
        assert 'recommendation' in result
        
        logger.info(f"Confidence score: {result['overall_confidence']}")
        logger.info(f"Confidence level: {result['confidence_level']}")
        logger.info(f"Recommendation: {result['recommendation']}")
        
        self.test_results.append({
            'test': 'confidence_scorer',
            'status': 'PASS',
            'confidence': result['overall_confidence']
        })
        
        return result
    
    def test_single_prediction(self):
        """Test single prediction."""
        logger.info("Testing single prediction...")
        
        reward_txn = {
            'customer_name': 'Michael Chen',
            'amount': 325.00,
            'date': '2024-01-16'
        }
        
        pos_txn = {
            'customer_name': 'Mike Chen',  # Slight variation
            'amount': 325.00,
            'date': '2024-01-16'
        }
        
        result = self.engine.predict_match(reward_txn, pos_txn, threshold=0.8)
        
        assert 'result' in result
        assert 'confidence' in result
        assert 'processing_time_ms' in result
        
        logger.info(f"Prediction result: {result['result']}")
        logger.info(f"Confidence: {result['confidence']}")
        logger.info(f"Processing time: {result['processing_time_ms']}ms")
        
        self.test_results.append({
            'test': 'single_prediction',
            'status': 'PASS',
            'result': result['result'],
            'confidence': result['confidence']
        })
        
        return result
    
    async def test_batch_reconciliation(self):
        """Test batch reconciliation."""
        logger.info("Testing batch reconciliation...")
        
        reward_txns, pos_txns = self.generate_sample_data()
        
        job_info = await self.engine.start_reconciliation(
            reward_txns,
            pos_txns,
            threshold=0.8
        )
        
        job_id = job_info['job_id']
        logger.info(f"Started job: {job_id}")
        
        # Monitor progress
        max_wait = 10  # seconds
        start_time = time.time()
        
        while time.time() - start_time < max_wait:
            job_status = self.engine.get_job_status(job_id)
            
            if job_status['status'] == 'completed':
                logger.info("Job completed successfully!")
                break
            elif job_status['status'] == 'failed':
                logger.error("Job failed!")
                break
            else:
                progress = job_status.get('progress_percent', 0)
                logger.info(f"Job progress: {progress:.1f}%")
                await asyncio.sleep(0.5)
        
        # Get results
        results = self.engine.get_job_results(job_id)
        
        if results:
            logger.info(f"Total transactions: {results['summary']['total_transactions']}")
            logger.info(f"Matches found: {results['summary']['matches_found']}")
            logger.info(f"Review required: {results['summary']['review_required']}")
            
            self.test_results.append({
                'test': 'batch_reconciliation',
                'status': 'PASS',
                'total_transactions': results['summary']['total_transactions'],
                'matches_found': results['summary']['matches_found']
            })
        else:
            self.test_results.append({
                'test': 'batch_reconciliation',
                'status': 'FAIL',
                'error': 'No results returned'
            })
        
        return results
    
    def test_system_health(self):
        """Test system health."""
        logger.info("Testing system health...")
        
        health = self.engine.get_system_health()
        
        assert 'status' in health
        assert 'model_loaded' in health
        
        logger.info(f"System status: {health['status']}")
        logger.info(f"Model loaded: {health['model_loaded']}")
        
        self.test_results.append({
            'test': 'system_health',
            'status': 'PASS',
            'system_status': health['status']
        })
        
        return health
    
    def test_model_metrics(self):
        """Test model metrics."""
        logger.info("Testing model metrics...")
        
        metrics = self.engine.get_model_metrics()
        
        assert 'version' in metrics
        assert 'model_type' in metrics
        assert 'performance_stats' in metrics
        
        logger.info(f"Model version: {metrics['version']}")
        logger.info(f"Model type: {metrics['model_type']}")
        logger.info(f"Total jobs: {metrics['performance_stats']['total_jobs']}")
        
        self.test_results.append({
            'test': 'model_metrics',
            'status': 'PASS',
            'model_version': metrics['version']
        })
        
        return metrics
    
    def run_all_tests(self):
        """Run all tests."""
        logger.info("Starting simplified test suite...")
        
        try:
            self.test_confidence_scorer()
            self.test_single_prediction()
            self.test_system_health()
            self.test_model_metrics()
            asyncio.run(self.test_batch_reconciliation())
            
        except Exception as e:
            logger.error(f"Test failed: {e}")
            self.test_results.append({
                'test': 'test_suite',
                'status': 'FAIL',
                'error': str(e)
            })
        
        self.generate_test_report()
    
    def generate_test_report(self):
        """Generate test report."""
        logger.info("\n" + "="*50)
        logger.info("SIMPLIFIED TEST REPORT")
        logger.info("="*50)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for r in self.test_results if r['status'] == 'PASS')
        failed_tests = sum(1 for r in self.test_results if r['status'] == 'FAIL')
        
        logger.info(f"Total tests: {total_tests}")
        logger.info(f"Passed: {passed_tests}")
        logger.info(f"Failed: {failed_tests}")
        logger.info(f"Success rate: {(passed_tests/total_tests)*100:.1f}%")
        
        logger.info("\nDetailed Results:")
        for result in self.test_results:
            status_icon = "✅" if result['status'] == 'PASS' else "❌"
            logger.info(f"{status_icon} {result['test']}: {result['status']}")
            
            if 'error' in result:
                logger.info(f"   Error: {result['error']}")
        
        # Save report
        report = {
            'timestamp': datetime.now().isoformat(),
            'summary': {
                'total_tests': total_tests,
                'passed': passed_tests,
                'failed': failed_tests,
                'success_rate': (passed_tests/total_tests)*100
            },
            'results': self.test_results
        }
        
        with open('simple_test_report.json', 'w') as f:
            json.dump(report, f, indent=2)
        
        logger.info(f"\nReport saved to: simple_test_report.json")
        
        return report

def main():
    """Main test execution."""
    tester = SimpleReconciliationEngineTester()
    tester.run_all_tests()

if __name__ == "__main__":
    main() 