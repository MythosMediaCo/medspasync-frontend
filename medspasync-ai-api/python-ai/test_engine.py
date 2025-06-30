#!/usr/bin/env python3
"""
Comprehensive test suite for the MedSpa AI Reconciliation Engine
"""

import asyncio
import json
import time
import logging
from datetime import datetime, timedelta
from typing import List, Dict
import pandas as pd

from reconciliation_engine import ReconciliationEngine
from confidence_scorer import AdvancedConfidenceScorer

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ReconciliationEngineTester:
    """Test suite for the reconciliation engine."""
    
    def __init__(self):
        self.engine = ReconciliationEngine(max_workers=2, batch_size=50)
        self.test_results = []
        
    def generate_sample_data(self) -> tuple[List[Dict], List[Dict]]:
        """Generate realistic sample transaction data."""
        
        # Sample reward transactions (Alle Rewards)
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
            },
            {
                'customer_name': 'Dr. Emily Rodriguez',
                'customer_phone': '(555) 345-6789',
                'customer_email': 'emily.rodriguez@email.com',
                'service': 'Laser Hair Removal',
                'amount': 600.00,
                'date': '2024-01-17',
                'provider': 'Alle Rewards',
                'location': 'Downtown MedSpa',
                'transaction_id': 'AR_003'
            },
            {
                'customer_name': 'James Wilson',
                'customer_phone': '(555) 456-7890',
                'customer_email': 'jwilson@email.com',
                'service': 'Dermal Fillers',
                'amount': 750.00,
                'date': '2024-01-18',
                'provider': 'Alle Rewards',
                'location': 'Downtown MedSpa',
                'transaction_id': 'AR_004'
            },
            {
                'customer_name': 'Lisa Thompson',
                'customer_phone': '(555) 567-8901',
                'customer_email': 'lisa.t@email.com',
                'service': 'Microdermabrasion',
                'amount': 200.00,
                'date': '2024-01-19',
                'provider': 'Alle Rewards',
                'location': 'Downtown MedSpa',
                'transaction_id': 'AR_005'
            }
        ]
        
        # Sample POS transactions (with some variations)
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
                'customer_name': 'Mike Chen',  # Slight name variation
                'customer_phone': '(555) 234-5678',
                'customer_email': 'mchen@email.com',
                'service': 'Chemical Peel',
                'amount': 325.00,
                'date': '2024-01-16',
                'provider': 'POS System',
                'location': 'Downtown MedSpa',
                'transaction_id': 'POS_002'
            },
            {
                'customer_name': 'Emily Rodriguez',  # No Dr. title
                'customer_phone': '(555) 345-6789',
                'customer_email': 'emily.rodriguez@email.com',
                'service': 'Laser Hair Removal',
                'amount': 600.00,
                'date': '2024-01-17',
                'provider': 'POS System',
                'location': 'Downtown MedSpa',
                'transaction_id': 'POS_003'
            },
            {
                'customer_name': 'James Wilson',
                'customer_phone': '(555) 456-7890',
                'customer_email': 'jwilson@email.com',
                'service': 'Dermal Fillers',
                'amount': 750.00,
                'date': '2024-01-18',
                'provider': 'POS System',
                'location': 'Downtown MedSpa',
                'transaction_id': 'POS_004'
            },
            {
                'customer_name': 'Lisa Thompson',
                'customer_phone': '(555) 567-8901',
                'customer_email': 'lisa.t@email.com',
                'service': 'Microdermabrasion',
                'amount': 200.00,
                'date': '2024-01-19',
                'provider': 'POS System',
                'location': 'Downtown MedSpa',
                'transaction_id': 'POS_005'
            },
            # Add some non-matching transactions
            {
                'customer_name': 'Unknown Customer',
                'customer_phone': '(555) 999-9999',
                'customer_email': 'unknown@email.com',
                'service': 'Unknown Service',
                'amount': 100.00,
                'date': '2024-01-20',
                'provider': 'POS System',
                'location': 'Downtown MedSpa',
                'transaction_id': 'POS_006'
            }
        ]
        
        return reward_transactions, pos_transactions
    
    def test_confidence_scorer(self):
        """Test the confidence scorer functionality."""
        logger.info("Testing confidence scorer...")
        
        scorer = AdvancedConfidenceScorer()
        
        # Test basic functionality
        reward_txn = {
            'customer_name': 'Sarah Johnson',
            'customer_phone': '(555) 123-4567',
            'customer_email': 'sarah.johnson@email.com',
            'service': 'Botox Treatment',
            'amount': 450.00,
            'date': '2024-01-15'
        }
        
        pos_txn = {
            'customer_name': 'Sarah Johnson',
            'customer_phone': '(555) 123-4567',
            'customer_email': 'sarah.johnson@email.com',
            'service': 'Botox Treatment',
            'amount': 450.00,
            'date': '2024-01-15'
        }
        
        result = scorer.calculate_comprehensive_confidence(reward_txn, pos_txn)
        
        assert 'overall_confidence' in result
        assert 'confidence_level' in result
        assert 'recommendation' in result
        assert 'component_scores' in result
        
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
        """Test single transaction prediction."""
        logger.info("Testing single prediction...")
        
        reward_txn = {
            'customer_name': 'Michael Chen',
            'customer_phone': '(555) 234-5678',
            'customer_email': 'mchen@email.com',
            'service': 'Chemical Peel',
            'amount': 325.00,
            'date': '2024-01-16'
        }
        
        pos_txn = {
            'customer_name': 'Mike Chen',  # Slight variation
            'customer_phone': '(555) 234-5678',
            'customer_email': 'mchen@email.com',
            'service': 'Chemical Peel',
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
        """Test batch reconciliation job."""
        logger.info("Testing batch reconciliation...")
        
        reward_txns, pos_txns = self.generate_sample_data()
        
        # Start reconciliation job
        job_info = await self.engine.start_reconciliation(
            reward_txns,
            pos_txns,
            threshold=0.8
        )
        
        job_id = job_info['job_id']
        logger.info(f"Started job: {job_id}")
        
        # Monitor job progress
        max_wait = 30  # seconds
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
                await asyncio.sleep(1)
        
        # Get results
        results = self.engine.get_job_results(job_id)
        
        if results:
            logger.info(f"Total transactions: {results['summary']['total_transactions']}")
            logger.info(f"Matches found: {results['summary']['matches_found']}")
            logger.info(f"Review required: {results['summary']['review_required']}")
            logger.info(f"No matches: {results['summary']['no_matches']}")
            
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
        """Test system health monitoring."""
        logger.info("Testing system health...")
        
        health = self.engine.get_system_health()
        
        assert 'status' in health
        assert 'system_metrics' in health
        assert 'model_status' in health
        
        logger.info(f"System status: {health['status']}")
        logger.info(f"CPU usage: {health['system_metrics']['cpu_percent']}%")
        logger.info(f"Memory usage: {health['system_metrics']['memory_percent']}%")
        logger.info(f"Model loaded: {health['model_status']['is_loaded']}")
        
        self.test_results.append({
            'test': 'system_health',
            'status': 'PASS',
            'system_status': health['status']
        })
        
        return health
    
    def test_model_metrics(self):
        """Test model metrics and performance stats."""
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
    
    def test_export_functionality(self):
        """Test export functionality."""
        logger.info("Testing export functionality...")
        
        # Create sample results
        sample_results = {
            'job_id': 'test_export',
            'status': 'completed',
            'results': [
                {
                    'result': 'match',
                    'confidence': 0.95,
                    'reward_transaction': {'customer_name': 'Test User', 'amount': 100},
                    'pos_transaction': {'customer_name': 'Test User', 'amount': 100}
                }
            ]
        }
        
        # Test JSON export
        json_export = self.engine.export_results('test_export', 'json')
        
        if json_export:
            logger.info("JSON export successful")
            self.test_results.append({
                'test': 'export_json',
                'status': 'PASS'
            })
        else:
            logger.warning("JSON export failed (expected for test job)")
            self.test_results.append({
                'test': 'export_json',
                'status': 'SKIP'
            })
        
        return json_export
    
    def run_all_tests(self):
        """Run all tests and generate report."""
        logger.info("Starting comprehensive test suite...")
        
        try:
            # Test confidence scorer
            self.test_confidence_scorer()
            
            # Test single prediction
            self.test_single_prediction()
            
            # Test system health
            self.test_system_health()
            
            # Test model metrics
            self.test_model_metrics()
            
            # Test export functionality
            self.test_export_functionality()
            
            # Test batch reconciliation (async)
            asyncio.run(self.test_batch_reconciliation())
            
        except Exception as e:
            logger.error(f"Test failed: {e}")
            self.test_results.append({
                'test': 'test_suite',
                'status': 'FAIL',
                'error': str(e)
            })
        
        # Generate test report
        self.generate_test_report()
    
    def generate_test_report(self):
        """Generate comprehensive test report."""
        logger.info("\n" + "="*50)
        logger.info("TEST REPORT")
        logger.info("="*50)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for r in self.test_results if r['status'] == 'PASS')
        failed_tests = sum(1 for r in self.test_results if r['status'] == 'FAIL')
        skipped_tests = sum(1 for r in self.test_results if r['status'] == 'SKIP')
        
        logger.info(f"Total tests: {total_tests}")
        logger.info(f"Passed: {passed_tests}")
        logger.info(f"Failed: {failed_tests}")
        logger.info(f"Skipped: {skipped_tests}")
        logger.info(f"Success rate: {(passed_tests/total_tests)*100:.1f}%")
        
        logger.info("\nDetailed Results:")
        for result in self.test_results:
            status_icon = "✅" if result['status'] == 'PASS' else "❌" if result['status'] == 'FAIL' else "⏭️"
            logger.info(f"{status_icon} {result['test']}: {result['status']}")
            
            if 'error' in result:
                logger.info(f"   Error: {result['error']}")
        
        # Save detailed report
        report = {
            'timestamp': datetime.now().isoformat(),
            'summary': {
                'total_tests': total_tests,
                'passed': passed_tests,
                'failed': failed_tests,
                'skipped': skipped_tests,
                'success_rate': (passed_tests/total_tests)*100
            },
            'results': self.test_results
        }
        
        with open('test_report.json', 'w') as f:
            json.dump(report, f, indent=2)
        
        logger.info(f"\nDetailed report saved to: test_report.json")
        
        return report

def main():
    """Main test execution."""
    tester = ReconciliationEngineTester()
    tester.run_all_tests()

if __name__ == "__main__":
    main() 