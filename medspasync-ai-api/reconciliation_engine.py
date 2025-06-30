import logging
import asyncio
import time
import json
import os
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple, Any
import pandas as pd
import numpy as np
from concurrent.futures import ThreadPoolExecutor, as_completed
import psutil
from dataclasses import dataclass
from enum import Enum

from confidence_scorer import AdvancedConfidenceScorer
from metrics import metrics_collector

class MatchStatus(Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"

class ReconciliationResult(Enum):
    MATCH = "match"
    NO_MATCH = "no_match"
    REVIEW_REQUIRED = "review_required"
    ERROR = "error"

@dataclass
class ReconciliationJob:
    job_id: str
    status: MatchStatus
    created_at: datetime
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    total_transactions: int = 0
    processed_transactions: int = 0
    matches_found: int = 0
    errors: List[str] = None
    results: List[Dict] = None
    performance_metrics: Dict = None
    
    def __post_init__(self):
        if self.errors is None:
            self.errors = []
        if self.results is None:
            self.results = []
        if self.performance_metrics is None:
            self.performance_metrics = {}

class ReconciliationEngine:
    """Advanced ML-powered reconciliation engine for transaction matching."""

    def __init__(self, max_workers: int = 4, batch_size: int = 100):
        self.logger = logging.getLogger(__name__)
        self.confidence_scorer = AdvancedConfidenceScorer()
        self.max_workers = max_workers
        self.batch_size = batch_size
        self.active_jobs: Dict[str, ReconciliationJob] = {}
        self.job_history: List[ReconciliationJob] = []
        self.performance_stats = {
            'total_jobs': 0,
            'successful_jobs': 0,
            'failed_jobs': 0,
            'avg_processing_time': 0,
            'total_transactions_processed': 0,
            'total_matches_found': 0
        }
        self._load_performance_stats()

    def _load_performance_stats(self):
        """Load performance statistics from disk."""
        try:
            if os.path.exists('data/performance_stats.json'):
                with open('data/performance_stats.json', 'r') as f:
                    self.performance_stats = json.load(f)
        except Exception as e:
            self.logger.warning(f"Could not load performance stats: {e}")

    def _save_performance_stats(self):
        """Save performance statistics to disk."""
        try:
            os.makedirs('data', exist_ok=True)
            with open('data/performance_stats.json', 'w') as f:
                json.dump(self.performance_stats, f, default=str)
        except Exception as e:
            self.logger.error(f"Could not save performance stats: {e}")

    def is_model_loaded(self) -> bool:
        """Check if ML models are loaded and ready."""
        try:
            model_info = self.confidence_scorer.get_model_info()
            return model_info['nlp_models_loaded']['spacy'] or model_info['nlp_models_loaded']['sentence_transformer']
        except Exception as e:
            self.logger.error(f"Model check failed: {e}")
            return False

    def get_system_health(self) -> Dict:
        """Get comprehensive system health information."""
        try:
            # CPU and memory usage
            cpu_percent = psutil.cpu_percent(interval=1)
            memory = psutil.virtual_memory()
            
            # Disk usage
            disk = psutil.disk_usage('/')
            
            # Model status
            model_info = self.confidence_scorer.get_model_info()
            
            return {
                'status': 'healthy' if cpu_percent < 90 and memory.percent < 90 else 'warning',
                'timestamp': datetime.now().isoformat(),
                'system_metrics': {
                    'cpu_percent': cpu_percent,
                    'memory_percent': memory.percent,
                    'memory_available_gb': memory.available / (1024**3),
                    'disk_percent': disk.percent,
                    'disk_free_gb': disk.free / (1024**3)
                },
                'model_status': {
                    'is_loaded': self.is_model_loaded(),
                    'model_info': model_info,
                    'is_trained': model_info.get('is_trained', False)
                },
                'performance_stats': self.performance_stats,
                'active_jobs': len(self.active_jobs)
            }
        except Exception as e:
            self.logger.error(f"Health check failed: {e}")
            return {
                'status': 'error',
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            }

    def predict_match(self, reward_txn: Dict, pos_txn: Dict, threshold: float = 0.95) -> Dict:
        """Predict match between reward and POS transactions."""
        start_time = time.time()
        
        try:
            # Get confidence score
            confidence_result = self.confidence_scorer.calculate_comprehensive_confidence(reward_txn, pos_txn)
            
            # Determine match result
            if confidence_result['overall_confidence'] >= threshold:
                result = ReconciliationResult.MATCH
            elif confidence_result['overall_confidence'] >= 0.7:
                result = ReconciliationResult.REVIEW_REQUIRED
            else:
                result = ReconciliationResult.NO_MATCH
            
            processing_time = (time.time() - start_time) * 1000
            
            # Record transaction processing metric
            metrics_collector.record_transaction_processed(result.value, "development")
            
            return {
                'result': result.value,
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
            # Record failed transaction
            metrics_collector.record_transaction_processed("failed", "development")
            return {
                'result': ReconciliationResult.ERROR.value,
                'error': str(e),
                'processing_time_ms': (time.time() - start_time) * 1000,
                'reward_transaction': reward_txn,
                'pos_transaction': pos_txn
            }

    def _create_transaction_pairs(self, reward_transactions: List[Dict], pos_transactions: List[Dict]) -> List[Tuple[Dict, Dict]]:
        """Create potential transaction pairs for matching."""
        pairs = []
        
        # Simple cartesian product for now
        # In production, this could be optimized with pre-filtering
        for reward_txn in reward_transactions:
            for pos_txn in pos_transactions:
                pairs.append((reward_txn, pos_txn))
        
        return pairs

    def _process_batch(self, batch: List[Tuple[Dict, Dict]], threshold: float) -> List[Dict]:
        """Process a batch of transaction pairs."""
        results = []
        
        for reward_txn, pos_txn in batch:
            try:
                result = self.predict_match(reward_txn, pos_txn, threshold)
                results.append(result)
            except Exception as e:
                self.logger.error(f"Batch processing error: {e}")
                results.append({
                    'result': ReconciliationResult.ERROR.value,
                    'error': str(e),
                    'reward_transaction': reward_txn,
                    'pos_transaction': pos_txn
                })
        
        return results

    async def start_reconciliation(self, reward_transactions: List[Dict], pos_transactions: List[Dict], 
                                 threshold: float = 0.95, job_id: Optional[str] = None) -> Dict:
        """Start an asynchronous reconciliation job."""
        if not job_id:
            job_id = f"reconciliation_{int(time.time())}"
        
        # Create job
        job = ReconciliationJob(
            job_id=job_id,
            status=MatchStatus.PENDING,
            created_at=datetime.now(),
            total_transactions=len(reward_transactions) * len(pos_transactions)
        )
        
        self.active_jobs[job_id] = job
        self.performance_stats['total_jobs'] += 1
        
        # Start processing in background
        asyncio.create_task(self._process_reconciliation_job(job, reward_transactions, pos_transactions, threshold))
        
        return {
            'job_id': job_id,
            'status': job.status.value,
            'total_transactions': job.total_transactions,
            'estimated_time_seconds': self._estimate_processing_time(job.total_transactions)
        }

    async def _process_reconciliation_job(self, job: ReconciliationJob, reward_transactions: List[Dict], 
                                        pos_transactions: List[Dict], threshold: float):
        """Process reconciliation job asynchronously."""
        job.status = MatchStatus.PROCESSING
        job.started_at = datetime.now()
        
        try:
            # Create transaction pairs
            pairs = self._create_transaction_pairs(reward_transactions, pos_transactions)
            
            # Process in batches
            results = []
            matches_found = 0
            
            with ThreadPoolExecutor(max_workers=self.max_workers) as executor:
                # Split pairs into batches
                batches = [pairs[i:i + self.batch_size] for i in range(0, len(pairs), self.batch_size)]
                
                # Submit batch processing tasks
                future_to_batch = {
                    executor.submit(self._process_batch, batch, threshold): batch 
                    for batch in batches
                }
                
                # Collect results
                for future in as_completed(future_to_batch):
                    try:
                        batch_results = future.result()
                        results.extend(batch_results)
                        
                        # Update progress
                        job.processed_transactions += len(batch_results)
                        matches_found += sum(1 for r in batch_results if r['result'] == ReconciliationResult.MATCH.value)
                        
                        # Update job progress
                        job.matches_found = matches_found
                        
                        # Small delay to prevent overwhelming
                        await asyncio.sleep(0.01)
                        
                    except Exception as e:
                        self.logger.error(f"Batch processing failed: {e}")
                        job.errors.append(str(e))
            
            # Finalize job
            job.status = MatchStatus.COMPLETED
            job.completed_at = datetime.now()
            job.results = results
            job.matches_found = matches_found
            
            # Calculate performance metrics
            processing_time = (job.completed_at - job.started_at).total_seconds()
            job.performance_metrics = {
                'processing_time_seconds': processing_time,
                'transactions_per_second': job.total_transactions / processing_time if processing_time > 0 else 0,
                'match_rate': matches_found / job.total_transactions if job.total_transactions > 0 else 0,
                'memory_usage_mb': psutil.Process().memory_info().rss / (1024 * 1024)
            }
            
            # Update performance stats
            self.performance_stats['successful_jobs'] += 1
            self.performance_stats['total_transactions_processed'] += job.total_transactions
            self.performance_stats['total_matches_found'] += matches_found
            
            # Calculate average processing time
            if self.performance_stats['successful_jobs'] > 0:
                total_time = self.performance_stats.get('total_processing_time', 0) + processing_time
                self.performance_stats['total_processing_time'] = total_time
                self.performance_stats['avg_processing_time'] = total_time / self.performance_stats['successful_jobs']
            
            self._save_performance_stats()
            
        except Exception as e:
            self.logger.error(f"Reconciliation job failed: {e}")
            job.status = MatchStatus.FAILED
            job.errors.append(str(e))
            self.performance_stats['failed_jobs'] += 1
            self._save_performance_stats()
        
        finally:
            # Move job to history
            self.job_history.append(job)
            if job.job_id in self.active_jobs:
                del self.active_jobs[job.job_id]

    def get_job_status(self, job_id: str) -> Optional[Dict]:
        """Get status of a reconciliation job."""
        # Check active jobs
        if job_id in self.active_jobs:
            job = self.active_jobs[job_id]
            return self._job_to_dict(job)
        
        # Check job history
        for job in self.job_history:
            if job.job_id == job_id:
                return self._job_to_dict(job)
        
        return None

    def _job_to_dict(self, job: ReconciliationJob) -> Dict:
        """Convert job to dictionary for API response."""
        return {
            'job_id': job.job_id,
            'status': job.status.value,
            'created_at': job.created_at.isoformat(),
            'started_at': job.started_at.isoformat() if job.started_at else None,
            'completed_at': job.completed_at.isoformat() if job.completed_at else None,
            'total_transactions': job.total_transactions,
            'processed_transactions': job.processed_transactions,
            'matches_found': job.matches_found,
            'errors': job.errors,
            'performance_metrics': job.performance_metrics,
            'progress_percent': (job.processed_transactions / job.total_transactions * 100) if job.total_transactions > 0 else 0
        }

    def get_job_results(self, job_id: str) -> Optional[Dict]:
        """Get results of a completed reconciliation job."""
        job = None
        
        # Check active jobs
        if job_id in self.active_jobs:
            job = self.active_jobs[job_id]
        
        # Check job history
        if not job:
            for j in self.job_history:
                if j.job_id == job_id:
                    job = j
                    break
        
        if not job or job.status != MatchStatus.COMPLETED:
            return None
        
        return {
            'job_id': job_id,
            'status': job.status.value,
            'results': job.results,
            'summary': {
                'total_transactions': job.total_transactions,
                'matches_found': job.matches_found,
                'review_required': sum(1 for r in job.results if r['result'] == ReconciliationResult.REVIEW_REQUIRED.value),
                'no_matches': sum(1 for r in job.results if r['result'] == ReconciliationResult.NO_MATCH.value),
                'errors': sum(1 for r in job.results if r['result'] == ReconciliationResult.ERROR.value)
            },
            'performance_metrics': job.performance_metrics
        }

    def cancel_job(self, job_id: str) -> bool:
        """Cancel an active reconciliation job."""
        if job_id in self.active_jobs:
            job = self.active_jobs[job_id]
            if job.status == MatchStatus.PROCESSING:
                job.status = MatchStatus.CANCELLED
        return True
        return False

    def get_active_jobs(self) -> List[Dict]:
        """Get list of active reconciliation jobs."""
        return [self._job_to_dict(job) for job in self.active_jobs.values()]

    def get_job_history(self, limit: int = 50) -> List[Dict]:
        """Get recent job history."""
        recent_jobs = sorted(self.job_history, key=lambda x: x.created_at, reverse=True)[:limit]
        return [self._job_to_dict(job) for job in recent_jobs]

    def _estimate_processing_time(self, total_transactions: int) -> float:
        """Estimate processing time based on historical data."""
        if self.performance_stats['successful_jobs'] == 0:
            return total_transactions * 0.001  # Rough estimate: 1ms per transaction
        
        avg_tps = self.performance_stats['total_transactions_processed'] / max(self.performance_stats['total_processing_time'], 1)
        return total_transactions / avg_tps if avg_tps > 0 else total_transactions * 0.001

    def get_model_metrics(self) -> Dict:
        """Get comprehensive model metrics."""
        model_info = self.confidence_scorer.get_model_info()
        
        return {
            'version': '2.0.0',
            'model_type': model_info['model_type'],
            'feature_count': model_info['feature_count'],
            'is_trained': model_info['is_trained'],
            'nlp_models_loaded': model_info['nlp_models_loaded'],
            'performance_stats': self.performance_stats,
            'system_health': self.get_system_health()
        }

    def retrain_model(self, training_data: List[Dict]) -> Dict:
        """Retrain the ML model with new data."""
        try:
            result = self.confidence_scorer.train_model(training_data)
            
            if result.get('success'):
                self.logger.info(f"Model retrained successfully with {result['training_samples']} samples")
                return {
                    'success': True,
                    'message': f"Model retrained with {result['training_samples']} samples",
                    'accuracy': result['accuracy'],
                    'model_version': '2.0.0'
                }
            else:
                return {
                    'success': False,
                    'error': result.get('error', 'Unknown training error')
                }
                
        except Exception as e:
            self.logger.error(f"Model retraining failed: {e}")
            return {
                'success': False,
                'error': str(e)
            }

    def export_results(self, job_id: str, format: str = 'json') -> Optional[str]:
        """Export reconciliation results in specified format."""
        results = self.get_job_results(job_id)
        if not results:
            return None
        
        try:
            if format.lower() == 'json':
                return json.dumps(results, indent=2, default=str)
            elif format.lower() == 'csv':
                # Convert results to CSV format
                df_data = []
                for result in results['results']:
                    df_data.append({
                        'result': result['result'],
                        'confidence': result.get('confidence', 0),
                        'confidence_level': result.get('confidence_level', ''),
                        'recommendation': result.get('recommendation', ''),
                        'processing_time_ms': result.get('processing_time_ms', 0),
                        'reward_customer': result.get('reward_transaction', {}).get('customer_name', ''),
                        'pos_customer': result.get('pos_transaction', {}).get('customer_name', ''),
                        'reward_amount': result.get('reward_transaction', {}).get('amount', 0),
                        'pos_amount': result.get('pos_transaction', {}).get('amount', 0),
                        'reward_date': result.get('reward_transaction', {}).get('date', ''),
                        'pos_date': result.get('pos_transaction', {}).get('date', '')
                    })
                
                df = pd.DataFrame(df_data)
                return df.to_csv(index=False)
            else:
                raise ValueError(f"Unsupported format: {format}")
                
        except Exception as e:
            self.logger.error(f"Export failed: {e}")
            return None
