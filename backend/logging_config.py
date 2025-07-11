"""
Advanced Logging Configuration
Provides structured logging with different levels and outputs
"""

import logging
import logging.config
import sys
import json
from datetime import datetime
from typing import Dict, Any
import os

# Custom JSON Formatter
class JSONFormatter(logging.Formatter):
    """Custom JSON formatter for structured logging"""
    
    def format(self, record):
        log_entry = {
            'timestamp': datetime.utcnow().isoformat(),
            'level': record.levelname,
            'logger': record.name,
            'message': record.getMessage(),
            'module': record.module,
            'function': record.funcName,
            'line': record.lineno,
        }
        
        # Add exception info if present
        if record.exc_info:
            log_entry['exception'] = self.formatException(record.exc_info)
        
        # Add extra fields if present
        if hasattr(record, 'user_id'):
            log_entry['user_id'] = record.user_id
        
        if hasattr(record, 'request_id'):
            log_entry['request_id'] = record.request_id
        
        if hasattr(record, 'duration'):
            log_entry['duration'] = record.duration
        
        return json.dumps(log_entry)

# Logging Configuration
LOGGING_CONFIG = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'standard': {
            'format': '%(asctime)s [%(levelname)s] %(name)s: %(message)s'
        },
        'detailed': {
            'format': '%(asctime)s [%(levelname)s] %(name)s:%(lineno)d: %(message)s'
        },
        'json': {
            '()': JSONFormatter
        }
    },
    'handlers': {
        'console': {
            'level': 'INFO',
            'class': 'logging.StreamHandler',
            'formatter': 'standard',
            'stream': sys.stdout
        },
        'file': {
            'level': 'DEBUG',
            'class': 'logging.handlers.RotatingFileHandler',
            'formatter': 'detailed',
            'filename': 'logs/app.log',
            'maxBytes': 10485760,  # 10MB
            'backupCount': 5
        },
        'error_file': {
            'level': 'ERROR',
            'class': 'logging.handlers.RotatingFileHandler',
            'formatter': 'json',
            'filename': 'logs/error.log',
            'maxBytes': 10485760,  # 10MB
            'backupCount': 5
        },
        'access_file': {
            'level': 'INFO',
            'class': 'logging.handlers.RotatingFileHandler',
            'formatter': 'json',
            'filename': 'logs/access.log',
            'maxBytes': 10485760,  # 10MB
            'backupCount': 5
        }
    },
    'loggers': {
        '': {  # root logger
            'handlers': ['console', 'file'],
            'level': 'INFO',
            'propagate': False
        },
        'uvicorn': {
            'handlers': ['console', 'access_file'],
            'level': 'INFO',
            'propagate': False
        },
        'uvicorn.error': {
            'handlers': ['console', 'error_file'],
            'level': 'INFO',
            'propagate': False
        },
        'uvicorn.access': {
            'handlers': ['access_file'],
            'level': 'INFO',
            'propagate': False
        },
        'job_automation': {
            'handlers': ['console', 'file'],
            'level': 'DEBUG',
            'propagate': False
        },
        'celery': {
            'handlers': ['console', 'file'],
            'level': 'INFO',
            'propagate': False
        },
        'sqlalchemy.engine': {
            'handlers': ['file'],
            'level': 'WARNING',
            'propagate': False
        }
    }
}

def setup_logging():
    """Setup logging configuration"""
    # Create logs directory if it doesn't exist
    os.makedirs('logs', exist_ok=True)
    
    # Apply logging configuration
    logging.config.dictConfig(LOGGING_CONFIG)
    
    # Get logger for this module
    logger = logging.getLogger('job_automation.logging')
    logger.info("Logging configuration initialized")

def get_logger(name: str) -> logging.Logger:
    """Get a logger with the specified name"""
    return logging.getLogger(f'job_automation.{name}')

class LoggerAdapter(logging.LoggerAdapter):
    """Custom logger adapter for adding context"""
    
    def process(self, msg, kwargs):
        # Add extra context to log records
        extra = kwargs.get('extra', {})
        extra.update(self.extra)
        kwargs['extra'] = extra
        return msg, kwargs

def get_context_logger(name: str, **context) -> LoggerAdapter:
    """Get a logger with additional context"""
    logger = get_logger(name)
    return LoggerAdapter(logger, context)

# Performance logging decorator
def log_performance(logger_name: str = None):
    """Decorator to log function performance"""
    def decorator(func):
        def wrapper(*args, **kwargs):
            logger = get_logger(logger_name or func.__module__)
            start_time = datetime.utcnow()
            
            try:
                result = func(*args, **kwargs)
                duration = (datetime.utcnow() - start_time).total_seconds()
                
                logger.info(
                    f"Function {func.__name__} completed",
                    extra={
                        'function': func.__name__,
                        'duration': duration,
                        'status': 'success'
                    }
                )
                
                return result
                
            except Exception as e:
                duration = (datetime.utcnow() - start_time).total_seconds()
                
                logger.error(
                    f"Function {func.__name__} failed: {str(e)}",
                    extra={
                        'function': func.__name__,
                        'duration': duration,
                        'status': 'error',
                        'error_type': type(e).__name__
                    },
                    exc_info=True
                )
                
                raise
        
        return wrapper
    return decorator

# Initialize logging on module import
setup_logging()

# Export main components
__all__ = [
    'setup_logging',
    'get_logger',
    'get_context_logger',
    'LoggerAdapter',
    'log_performance'
]
