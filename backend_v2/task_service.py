from typing import Dict, Any, Optional, List
from datetime import datetime
import logging
from firebase_client import firebase_client
from sms_service import sms_service
from models import Task, TaskCreateRequest, TaskUpdateRequest, User, SMSNotificationType

logger = logging.getLogger(__name__)

class TaskService:
    def __init__(self):
        self.firebase = firebase_client
        self.sms = sms_service
    
    async def create_task(self, task_data: TaskCreateRequest) -> Dict[str, Any]:
        """Create a new task and send SMS notification"""
        try:
            # Create task in Firebase
            task_dict = {
                'title': task_data.title,
                'subjectId': task_data.subject_id,
                'chapterId': task_data.chapter_id,
                'pages': task_data.pages,
                'startPage': task_data.start_page,
                'endPage': task_data.end_page,
                'taskType': task_data.task_type.value,
                'revisionNumber': task_data.revision_number,
                'completed': False,
                'assignedTo': task_data.assigned_to,
                'createdBy': task_data.created_by,
                'createdAt': datetime.now(),
                'deadline': task_data.deadline
            }
            
            # Remove None values
            task_dict = {k: v for k, v in task_dict.items() if v is not None}
            
            # Add to Firebase
            doc_ref = self.firebase.get_collection('tasks').add(task_dict)
            task_id = doc_ref[1].id
            
            logger.info(f"Task created successfully: {task_id}")
            
            # Send SMS notification
            await self._send_task_created_sms(task_data.assigned_to, task_data.title, task_data.created_by)
            
            return {
                "success": True,
                "task_id": task_id,
                "message": "Task created successfully"
            }
            
        except Exception as e:
            logger.error(f"Error creating task: {e}")
            return {
                "success": False,
                "task_id": None,
                "message": f"Error creating task: {str(e)}"
            }
    
    async def update_task(self, task_id: str, updates: TaskUpdateRequest) -> Dict[str, Any]:
        """Update a task and send SMS notification"""
        try:
            # Get current task data
            task_data = await self.firebase.get_task_by_id(task_id)
            if not task_data:
                return {
                    "success": False,
                    "message": "Task not found"
                }
            
            # Prepare update data
            update_dict = {}
            if updates.title is not None:
                update_dict['title'] = updates.title
            if updates.pages is not None:
                update_dict['pages'] = updates.pages
            if updates.start_page is not None:
                update_dict['startPage'] = updates.start_page
            if updates.end_page is not None:
                update_dict['endPage'] = updates.end_page
            if updates.deadline is not None:
                update_dict['deadline'] = updates.deadline
            if updates.status is not None:
                update_dict['status'] = updates.status.value
            
            # Update in Firebase
            doc_ref = self.firebase.get_document('tasks', task_id)
            doc_ref.update(update_dict)
            
            logger.info(f"Task updated successfully: {task_id}")
            
            # Send SMS notification
            await self._send_task_updated_sms(
                task_data['assignedTo'], 
                task_data['title'], 
                update_dict
            )
            
            return {
                "success": True,
                "message": "Task updated successfully"
            }
            
        except Exception as e:
            logger.error(f"Error updating task {task_id}: {e}")
            return {
                "success": False,
                "message": f"Error updating task: {str(e)}"
            }
    
    async def complete_task(self, task_id: str) -> Dict[str, Any]:
        """Mark a task as completed and send SMS notification"""
        try:
            # Get current task data
            task_data = await self.firebase.get_task_by_id(task_id)
            if not task_data:
                return {
                    "success": False,
                    "message": "Task not found"
                }
            
            # Update task as completed
            doc_ref = self.firebase.get_document('tasks', task_id)
            doc_ref.update({
                'completed': True,
                'completedAt': datetime.now(),
                'status': 'completed'
            })
            
            logger.info(f"Task completed successfully: {task_id}")
            
            # Send SMS notification
            await self._send_task_completed_sms(
                task_data['assignedTo'], 
                task_data['title']
            )
            
            return {
                "success": True,
                "message": "Task completed successfully"
            }
            
        except Exception as e:
            logger.error(f"Error completing task {task_id}: {e}")
            return {
                "success": False,
                "message": f"Error completing task: {str(e)}"
            }
    
    async def _send_task_created_sms(self, user_id: str, task_title: str, created_by: str):
        """Send SMS notification for task creation"""
        try:
            user = await self.firebase.get_user_by_id(user_id)
            if not user or not user.get('sms_notifications_enabled', True):
                return
            
            phone_number = user.get('phone_number')
            if not phone_number:
                logger.warning(f"No phone number found for user {user_id}")
                return
            
            # Get creator name
            creator = await self.firebase.get_user_by_id(created_by)
            creator_name = creator.get('name', 'Unknown') if creator else 'Unknown'
            
            await self.sms.send_task_created_notification(phone_number, task_title, creator_name)
            
        except Exception as e:
            logger.error(f"Error sending task created SMS: {e}")
    
    async def _send_task_updated_sms(self, user_id: str, task_title: str, updates: Dict[str, Any]):
        """Send SMS notification for task updates"""
        try:
            user = await self.firebase.get_user_by_id(user_id)
            if not user or not user.get('sms_notifications_enabled', True):
                return
            
            phone_number = user.get('phone_number')
            if not phone_number:
                logger.warning(f"No phone number found for user {user_id}")
                return
            
            await self.sms.send_task_updated_notification(phone_number, task_title, updates)
            
        except Exception as e:
            logger.error(f"Error sending task updated SMS: {e}")
    
    async def _send_task_completed_sms(self, user_id: str, task_title: str):
        """Send SMS notification for task completion"""
        try:
            user = await self.firebase.get_user_by_id(user_id)
            if not user or not user.get('sms_notifications_enabled', True):
                return
            
            phone_number = user.get('phone_number')
            if not phone_number:
                logger.warning(f"No phone number found for user {user_id}")
                return
            
            await self.sms.send_task_completed_notification(phone_number, task_title)
            
        except Exception as e:
            logger.error(f"Error sending task completed SMS: {e}")
    
    async def get_user_tasks(self, user_id: str) -> List[Dict[str, Any]]:
        """Get all tasks for a user"""
        try:
            return await self.firebase.get_tasks_by_user(user_id)
        except Exception as e:
            logger.error(f"Error getting tasks for user {user_id}: {e}")
            return []
    
    async def get_pending_tasks(self, user_id: str) -> List[Dict[str, Any]]:
        """Get pending tasks for a user"""
        try:
            return await self.firebase.get_pending_tasks_by_user(user_id)
        except Exception as e:
            logger.error(f"Error getting pending tasks for user {user_id}: {e}")
            return []

# Global task service instance
task_service = TaskService()