"""
Advanced API Monitoring and Metrics Collection
Provides comprehensive monitoring, logging, and performance metrics
"""

from fastapi import FastAPI, Request, Response
from fastapi.middleware.base import BaseHTTPMiddleware
from prometheus_client import Counter, Histogram, Gauge, generate_latest, CONTENT_TYPE_LATEST
import time
import logging
import psutil
import json
from typing import Dict, Any
from datetime import datetime, timedelta
from db import SessionLocal
from models import User, Job, JobApplication

logger = logging.getLogger(__name__)

# Prometheus Metrics
REQUEST_COUNT = Counter(
    'http_requests_total',
    'Total HTTP requests',
    ['method', 'endpoint', 'status_code']
)

REQUEST_DURATION = Histogram(
    'http_request_duration_seconds',
    'HTTP request duration in seconds',
    ['method', 'endpoint']
)

ACTIVE_CONNECTIONS = Gauge(
    'active_connections',
    'Number of active connections'
)

DATABASE_CONNECTIONS = Gauge(
    'database_connections_active',
    'Number of active database connections'
)

CELERY_TASKS = Counter(
    'celery_tasks_total',
    'Total Celery tasks',
    ['task_name', 'status']
)

JOB_SCRAPING_METRICS = Counter(
    'job_scraping_total',
    'Total job scraping operations',
    ['platform', 'status']
)

APPLICATION_METRICS = Counter(
    'job_applications_total',
    'Total job applications',
    ['status', 'auto_applied']
)

SYSTEM_METRICS = Gauge(
    'system_resource_usage',
    'System resource usage',
    ['resource_type']
)

class MetricsMiddleware(BaseHTTPMiddleware):
    """Middleware to collect HTTP request metrics"""
    
    async def dispatch(self, request: Request, call_next):
        start_time = time.time()
        
        # Get endpoint pattern
        endpoint = request.url.path
        method = request.method
        
        # Increment active connections
        ACTIVE_CONNECTIONS.inc()
        
        try:
            response = await call_next(request)
            status_code = response.status_code
            
            # Record metrics
            REQUEST_COUNT.labels(
                method=method,
                endpoint=endpoint,
                status_code=status_code
            ).inc()
            
            duration = time.time() - start_time
            REQUEST_DURATION.labels(
                method=method,
                endpoint=endpoint
            ).observe(duration)
            
            return response
            
        except Exception as e:
            # Record error metrics
            REQUEST_COUNT.labels(
                method=method,
                endpoint=endpoint,
                status_code=500
            ).inc()
            
            duration = time.time() - start_time
            REQUEST_DURATION.labels(
                method=method,
                endpoint=endpoint
            ).observe(duration)
            
            logger.error(f"Request failed: {endpoint} - {str(e)}")
            raise
            
        finally:
            # Decrement active connections
            ACTIVE_CONNECTIONS.dec()

class AdvancedMonitoring:
    """Advanced monitoring and analytics system"""
    
    def __init__(self):
        self.start_time = datetime.utcnow()
        self.request_logs = []
        self.error_logs = []
        
    def collect_system_metrics(self) -> Dict[str, Any]:
        """Collect system performance metrics"""
        try:
            # CPU Usage
            cpu_percent = psutil.cpu_percent(interval=1)
            SYSTEM_METRICS.labels(resource_type='cpu_percent').set(cpu_percent)
            
            # Memory Usage
            memory = psutil.virtual_memory()
            SYSTEM_METRICS.labels(resource_type='memory_percent').set(memory.percent)
            SYSTEM_METRICS.labels(resource_type='memory_available_gb').set(memory.available / (1024**3))
            
            # Disk Usage
            disk = psutil.disk_usage('/')
            disk_percent = (disk.used / disk.total) * 100
            SYSTEM_METRICS.labels(resource_type='disk_percent').set(disk_percent)
            
            # Network I/O
            network = psutil.net_io_counters()
            SYSTEM_METRICS.labels(resource_type='network_bytes_sent').set(network.bytes_sent)
            SYSTEM_METRICS.labels(resource_type='network_bytes_recv').set(network.bytes_recv)
            
            return {
                'cpu_percent': cpu_percent,
                'memory_percent': memory.percent,
                'memory_available_gb': memory.available / (1024**3),
                'disk_percent': disk_percent,
                'network_bytes_sent': network.bytes_sent,
                'network_bytes_recv': network.bytes_recv,
                'timestamp': datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Failed to collect system metrics: {e}")
            return {}
    
    def collect_database_metrics(self) -> Dict[str, Any]:
        """Collect database performance metrics"""
        try:
            db = SessionLocal()
            
            # Count active sessions (approximate)
            active_connections = len(db.get_bind().pool.checkedin()) + len(db.get_bind().pool.checkedout())
            DATABASE_CONNECTIONS.set(active_connections)
            
            # Get table row counts
            user_count = db.query(User).count()
            job_count = db.query(Job).count()
            application_count = db.query(JobApplication).count()
            
            # Recent activity
            recent_jobs = db.query(Job).filter(
                Job.scraped_at >= datetime.utcnow() - timedelta(hours=24)
            ).count()
            
            recent_applications = db.query(JobApplication).filter(
                JobApplication.applied_at >= datetime.utcnow() - timedelta(hours=24)
            ).count()
            
            db.close()
            
            return {
                'active_connections': active_connections,
                'total_users': user_count,
                'total_jobs': job_count,
                'total_applications': application_count,
                'jobs_last_24h': recent_jobs,
                'applications_last_24h': recent_applications,
                'timestamp': datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Failed to collect database metrics: {e}")
            return {}
    
    def collect_application_metrics(self) -> Dict[str, Any]:
        """Collect application-specific metrics"""
        try:
            uptime = datetime.utcnow() - self.start_time
            
            return {
                'uptime_seconds': uptime.total_seconds(),
                'uptime_hours': uptime.total_seconds() / 3600,
                'start_time': self.start_time.isoformat(),
                'current_time': datetime.utcnow().isoformat(),
                'error_count_last_hour': len([
                    log for log in self.error_logs
                    if log['timestamp'] >= datetime.utcnow() - timedelta(hours=1)
                ]),
                'request_count_last_hour': len([
                    log for log in self.request_logs
                    if log['timestamp'] >= datetime.utcnow() - timedelta(hours=1)
                ])
            }
            
        except Exception as e:
            logger.error(f"Failed to collect application metrics: {e}")
            return {}
    
    def log_request(self, request: Request, response: Response, duration: float):
        """Log request details for analytics"""
        log_entry = {
            'timestamp': datetime.utcnow(),
            'method': request.method,
            'url': str(request.url),
            'status_code': response.status_code,
            'duration': duration,
            'user_agent': request.headers.get('user-agent', ''),
            'ip_address': request.client.host if request.client else 'unknown'
        }
        
        self.request_logs.append(log_entry)
        
        # Keep only last 1000 requests in memory
        if len(self.request_logs) > 1000:
            self.request_logs = self.request_logs[-1000:]
    
    def log_error(self, error: Exception, context: Dict[str, Any] = None):
        """Log error details for monitoring"""
        error_entry = {
            'timestamp': datetime.utcnow(),
            'error_type': type(error).__name__,
            'error_message': str(error),
            'context': context or {}
        }
        
        self.error_logs.append(error_entry)
        
        # Keep only last 500 errors in memory
        if len(self.error_logs) > 500:
            self.error_logs = self.error_logs[-500:]
        
        logger.error(f"Error logged: {error_entry}")
    
    def get_health_status(self) -> Dict[str, Any]:
        """Get comprehensive health status"""
        try:
            system_metrics = self.collect_system_metrics()
            db_metrics = self.collect_database_metrics()
            app_metrics = self.collect_application_metrics()
            
            # Determine overall health
            health_status = "healthy"
            
            # Check critical thresholds
            if system_metrics.get('cpu_percent', 0) > 90:
                health_status = "degraded"
            
            if system_metrics.get('memory_percent', 0) > 90:
                health_status = "degraded"
            
            if len(self.error_logs) > 10:  # More than 10 recent errors
                health_status = "degraded"
            
            return {
                'status': health_status,
                'timestamp': datetime.utcnow().isoformat(),
                'system': system_metrics,
                'database': db_metrics,
                'application': app_metrics,
                'checks': {
                    'database_connection': 'healthy' if db_metrics else 'unhealthy',
                    'system_resources': 'healthy' if system_metrics.get('cpu_percent', 100) < 90 else 'degraded',
                    'error_rate': 'healthy' if len(self.error_logs) < 10 else 'degraded'
                }
            }
            
        except Exception as e:
            logger.error(f"Health check failed: {e}")
            return {
                'status': 'unhealthy',
                'error': str(e),
                'timestamp': datetime.utcnow().isoformat()
            }
    
    def get_performance_report(self) -> Dict[str, Any]:
        """Generate comprehensive performance report"""
        try:
            recent_requests = [
                log for log in self.request_logs
                if log['timestamp'] >= datetime.utcnow() - timedelta(hours=1)
            ]
            
            if not recent_requests:
                return {'message': 'No recent requests'}
            
            # Calculate statistics
            durations = [req['duration'] for req in recent_requests]
            avg_duration = sum(durations) / len(durations)
            max_duration = max(durations)
            min_duration = min(durations)
            
            # Status code distribution
            status_codes = {}
            for req in recent_requests:
                code = req['status_code']
                status_codes[code] = status_codes.get(code, 0) + 1
            
            # Most accessed endpoints
            endpoints = {}
            for req in recent_requests:
                endpoint = req['url']
                endpoints[endpoint] = endpoints.get(endpoint, 0) + 1
            
            top_endpoints = sorted(endpoints.items(), key=lambda x: x[1], reverse=True)[:10]
            
            return {
                'period': 'last_hour',
                'total_requests': len(recent_requests),
                'average_duration': avg_duration,
                'max_duration': max_duration,
                'min_duration': min_duration,
                'status_code_distribution': status_codes,
                'top_endpoints': top_endpoints,
                'timestamp': datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Performance report generation failed: {e}")
            return {'error': str(e)}

# Global monitoring instance
monitoring = AdvancedMonitoring()

# Export monitoring functions
def get_metrics_endpoint():
    """Prometheus metrics endpoint"""
    return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)

def track_celery_task(task_name: str, status: str):
    """Track Celery task execution"""
    CELERY_TASKS.labels(task_name=task_name, status=status).inc()

def track_job_scraping(platform: str, status: str):
    """Track job scraping operations"""
    JOB_SCRAPING_METRICS.labels(platform=platform, status=status).inc()

def track_job_application(status: str, auto_applied: bool = False):
    """Track job application attempts"""
    APPLICATION_METRICS.labels(status=status, auto_applied=str(auto_applied)).inc()

# Export all monitoring components
__all__ = [
    'MetricsMiddleware',
    'AdvancedMonitoring',
    'monitoring',
    'get_metrics_endpoint',
    'track_celery_task',
    'track_job_scraping',
    'track_job_application'
]
