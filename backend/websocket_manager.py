# Real-time WebSocket Integration for Job Application Progress
"""
This module provides WebSocket functionality for real-time updates
on job application progress, scraping status, and task completion.
"""

from fastapi import WebSocket, WebSocketDisconnect
from typing import Dict, List, Set
import json
import asyncio
import logging
from datetime import datetime
from enum import Enum

logger = logging.getLogger(__name__)

class MessageType(Enum):
    JOB_SEARCH_START = "job_search_start"
    JOB_SEARCH_PROGRESS = "job_search_progress"
    JOB_SEARCH_COMPLETE = "job_search_complete"
    APPLICATION_START = "application_start"
    APPLICATION_PROGRESS = "application_progress"
    APPLICATION_COMPLETE = "application_complete"
    APPLICATION_ERROR = "application_error"
    TASK_STATUS_UPDATE = "task_status_update"
    ANALYTICS_UPDATE = "analytics_update"
    ERROR = "error"
    HEARTBEAT = "heartbeat"

class WebSocketManager:
    def __init__(self):
        # Store active connections by user_id
        self.active_connections: Dict[int, Set[WebSocket]] = {}
        self.connection_metadata: Dict[WebSocket, Dict] = {}

    async def connect(self, websocket: WebSocket, user_id: int):
        """Accept a new WebSocket connection"""
        await websocket.accept()

        if user_id not in self.active_connections:
            self.active_connections[user_id] = set()

        self.active_connections[user_id].add(websocket)
        self.connection_metadata[websocket] = {
            'user_id': user_id,
            'connected_at': datetime.utcnow(),
            'last_heartbeat': datetime.utcnow()
        }

        logger.info(f"WebSocket connected for user {user_id}")

        # Send welcome message
        await self.send_personal_message({
            'type': MessageType.HEARTBEAT.value,
            'message': 'Connected successfully',
            'timestamp': datetime.utcnow().isoformat()
        }, websocket)

    async def disconnect(self, websocket: WebSocket):
        """Handle WebSocket disconnection"""
        if websocket in self.connection_metadata:
            user_id = self.connection_metadata[websocket]['user_id']

            # Remove from active connections
            if user_id in self.active_connections:
                self.active_connections[user_id].discard(websocket)
                if not self.active_connections[user_id]:
                    del self.active_connections[user_id]

            # Remove metadata
            del self.connection_metadata[websocket]

            logger.info(f"WebSocket disconnected for user {user_id}")

    async def send_personal_message(self, message: Dict, websocket: WebSocket):
        """Send message to specific WebSocket connection"""
        try:
            await websocket.send_text(json.dumps(message))
        except Exception as e:
            logger.error(f"Error sending message to WebSocket: {str(e)}")
            await self.disconnect(websocket)

    async def send_to_user(self, message: Dict, user_id: int):
        """Send message to all connections for a specific user"""
        if user_id in self.active_connections:
            connections = list(self.active_connections[user_id])  # Create copy to avoid modification during iteration

            for websocket in connections:
                try:
                    await websocket.send_text(json.dumps(message))
                except Exception as e:
                    logger.error(f"Error sending message to user {user_id}: {str(e)}")
                    await self.disconnect(websocket)

    async def broadcast_to_all(self, message: Dict):
        """Send message to all active connections"""
        for user_id in list(self.active_connections.keys()):
            await self.send_to_user(message, user_id)

    async def send_job_search_update(self, user_id: int, status: str, progress: int, data: Dict = None):
        """Send job search progress update"""
        message = {
            'type': MessageType.JOB_SEARCH_PROGRESS.value,
            'status': status,
            'progress': progress,
            'data': data or {},
            'timestamp': datetime.utcnow().isoformat()
        }
        await self.send_to_user(message, user_id)

    async def send_application_update(self, user_id: int, job_id: str, status: str, message_text: str = None):
        """Send job application progress update"""
        message = {
            'type': MessageType.APPLICATION_PROGRESS.value,
            'job_id': job_id,
            'status': status,
            'message': message_text,
            'timestamp': datetime.utcnow().isoformat()
        }
        await self.send_to_user(message, user_id)

    async def send_task_status_update(self, user_id: int, task_id: str, status: str, progress: int = None, result: Dict = None):
        """Send background task status update"""
        message = {
            'type': MessageType.TASK_STATUS_UPDATE.value,
            'task_id': task_id,
            'status': status,
            'progress': progress,
            'result': result,
            'timestamp': datetime.utcnow().isoformat()
        }
        await self.send_to_user(message, user_id)

    async def send_analytics_update(self, user_id: int, analytics_data: Dict):
        """Send analytics dashboard update"""
        message = {
            'type': MessageType.ANALYTICS_UPDATE.value,
            'data': analytics_data,
            'timestamp': datetime.utcnow().isoformat()
        }
        await self.send_to_user(message, user_id)

    async def send_error(self, user_id: int, error_message: str, error_code: str = None):
        """Send error message to user"""
        message = {
            'type': MessageType.ERROR.value,
            'error': error_message,
            'error_code': error_code,
            'timestamp': datetime.utcnow().isoformat()
        }
        await self.send_to_user(message, user_id)

    async def heartbeat_check(self):
        """Periodic heartbeat check to remove stale connections"""
        while True:
            try:
                current_time = datetime.utcnow()
                stale_connections = []

                for websocket, metadata in self.connection_metadata.items():
                    last_heartbeat = metadata['last_heartbeat']
                    if (current_time - last_heartbeat).total_seconds() > 300:  # 5 minutes
                        stale_connections.append(websocket)

                for websocket in stale_connections:
                    await self.disconnect(websocket)

                # Send heartbeat to all active connections
                heartbeat_message = {
                    'type': MessageType.HEARTBEAT.value,
                    'timestamp': current_time.isoformat()
                }
                await self.broadcast_to_all(heartbeat_message)

                await asyncio.sleep(60)  # Check every minute

            except Exception as e:
                logger.error(f"Error in heartbeat check: {str(e)}")
                await asyncio.sleep(60)

    def get_active_users(self) -> List[int]:
        """Get list of users with active connections"""
        return list(self.active_connections.keys())

    def get_connection_count(self, user_id: int = None) -> int:
        """Get number of active connections for user or total"""
        if user_id:
            return len(self.active_connections.get(user_id, set()))
        else:
            return sum(len(connections) for connections in self.active_connections.values())

# Global WebSocket manager instance
websocket_manager = WebSocketManager()

# Background task to start heartbeat check
async def start_websocket_heartbeat():
    """Start the WebSocket heartbeat background task"""
    asyncio.create_task(websocket_manager.heartbeat_check())

# WebSocket event handlers for integration with existing services
class WebSocketEventHandler:
    """Event handler to integrate WebSocket updates with existing services"""

    @staticmethod
    async def on_job_search_started(user_id: int, search_params: Dict, task_id: str):
        """Handle job search start event"""
        await websocket_manager.send_to_user({
            'type': MessageType.JOB_SEARCH_START.value,
            'task_id': task_id,
            'search_params': search_params,
            'timestamp': datetime.utcnow().isoformat()
        }, user_id)

    @staticmethod
    async def on_job_search_progress(user_id: int, platform: str, found_count: int, total_expected: int, task_id: str):
        """Handle job search progress event"""
        progress = int((found_count / max(total_expected, 1)) * 100)

        await websocket_manager.send_job_search_update(
            user_id=user_id,
            status='in_progress',
            progress=progress,
            data={
                'platform': platform,
                'found_count': found_count,
                'total_expected': total_expected,
                'task_id': task_id
            }
        )

    @staticmethod
    async def on_job_search_completed(user_id: int, results: List[Dict], task_id: str):
        """Handle job search completion event"""
        await websocket_manager.send_to_user({
            'type': MessageType.JOB_SEARCH_COMPLETE.value,
            'task_id': task_id,
            'total_jobs': len(results),
            'jobs': results[:10],  # Send first 10 jobs for preview
            'timestamp': datetime.utcnow().isoformat()
        }, user_id)

    @staticmethod
    async def on_application_started(user_id: int, job_id: str, job_title: str, company: str, task_id: str):
        """Handle job application start event"""
        await websocket_manager.send_to_user({
            'type': MessageType.APPLICATION_START.value,
            'task_id': task_id,
            'job_id': job_id,
            'job_title': job_title,
            'company': company,
            'timestamp': datetime.utcnow().isoformat()
        }, user_id)

    @staticmethod
    async def on_application_progress(user_id: int, job_id: str, step: str, message: str, task_id: str):
        """Handle job application progress event"""
        await websocket_manager.send_application_update(
            user_id=user_id,
            job_id=job_id,
            status=step,
            message_text=message
        )

    @staticmethod
    async def on_application_completed(user_id: int, job_id: str, success: bool, message: str, task_id: str):
        """Handle job application completion event"""
        await websocket_manager.send_to_user({
            'type': MessageType.APPLICATION_COMPLETE.value,
            'task_id': task_id,
            'job_id': job_id,
            'success': success,
            'message': message,
            'timestamp': datetime.utcnow().isoformat()
        }, user_id)

    @staticmethod
    async def on_task_status_changed(user_id: int, task_id: str, status: str, progress: int = None, result: Dict = None):
        """Handle general task status change event"""
        await websocket_manager.send_task_status_update(
            user_id=user_id,
            task_id=task_id,
            status=status,
            progress=progress,
            result=result
        )

    @staticmethod
    async def on_analytics_updated(user_id: int, analytics_data: Dict):
        """Handle analytics data update event"""
        await websocket_manager.send_analytics_update(user_id, analytics_data)

    @staticmethod
    async def on_error_occurred(user_id: int, error_message: str, error_code: str = None, task_id: str = None):
        """Handle error event"""
        await websocket_manager.send_error(user_id, error_message, error_code)

# Global event handler instance
websocket_events = WebSocketEventHandler()
