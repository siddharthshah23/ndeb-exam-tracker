from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime
from enum import Enum

class TaskType(str, Enum):
    CHAPTER = "chapter"
    PAGES = "pages"
    REVISION = "revision"

class UserRole(str, Enum):
    STUDENT = "student"
    PARTNER = "partner"

class TaskStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"

class SMSNotificationType(str, Enum):
    TASK_CREATED = "task_created"
    TASK_UPDATED = "task_updated"
    TASK_COMPLETED = "task_completed"
    TASK_REMINDER = "task_reminder"
    PROGRESS_UPDATE = "progress_update"
    MOTIVATIONAL = "motivational"
    DAILY_SUMMARY = "daily_summary"

class User(BaseModel):
    id: str
    name: str
    email: str
    role: UserRole
    phone_number: Optional[str] = None
    daily_streak: Optional[int] = 0
    last_activity_date: Optional[datetime] = None
    sms_notifications_enabled: Optional[bool] = True

class Task(BaseModel):
    id: str
    title: str
    subject_id: str
    chapter_id: Optional[str] = None
    pages: Optional[int] = None
    start_page: Optional[int] = None
    end_page: Optional[int] = None
    task_type: TaskType
    revision_number: Optional[int] = None
    completed: bool = False
    user_id: Optional[str] = None  # For backwards compatibility
    assigned_to: str
    created_by: str
    created_at: datetime
    deadline: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    status: Optional[TaskStatus] = TaskStatus.PENDING

class TaskCreateRequest(BaseModel):
    title: str
    subject_id: str
    chapter_id: Optional[str] = None
    pages: Optional[int] = None
    start_page: Optional[int] = None
    end_page: Optional[int] = None
    task_type: TaskType
    revision_number: Optional[int] = None
    assigned_to: str
    created_by: str
    deadline: Optional[datetime] = None

class TaskUpdateRequest(BaseModel):
    title: Optional[str] = None
    pages: Optional[int] = None
    start_page: Optional[int] = None
    end_page: Optional[int] = None
    deadline: Optional[datetime] = None
    status: Optional[TaskStatus] = None

class SMSNotificationRequest(BaseModel):
    user_id: str
    notification_type: SMSNotificationType
    task_id: Optional[str] = None
    custom_message: Optional[str] = None
    additional_data: Optional[Dict[str, Any]] = None

class SMSResponse(BaseModel):
    success: bool
    message_sid: Optional[str] = None
    to: str
    status: str
    error: Optional[str] = None

class ProgressStats(BaseModel):
    subject_progress: Dict[str, Dict[str, Any]]
    overall_progress: int
    total_revisions: int

class ScheduledJobRequest(BaseModel):
    job_type: str
    user_id: Optional[str] = None
    task_id: Optional[str] = None
    scheduled_time: datetime
    repeat_interval: Optional[str] = None  # e.g., "daily", "weekly"
    message_data: Optional[Dict[str, Any]] = None

class BulkSMSRequest(BaseModel):
    user_ids: List[str]
    notification_type: SMSNotificationType
    custom_message: Optional[str] = None
    additional_data: Optional[Dict[str, Any]] = None