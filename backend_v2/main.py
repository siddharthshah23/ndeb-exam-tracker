from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime

from models import (
    TaskCreateRequest, TaskUpdateRequest, SMSNotificationRequest, 
    SMSResponse, BulkSMSRequest, ScheduledJobRequest, User
)
from task_service import task_service
from sms_service import sms_service
from scheduler_service import scheduler_service
from firebase_client import firebase_client

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    # Startup
    logger.info("Starting SMS Task Management Backend v2")
    scheduler_service.start_scheduler()
    yield
    # Shutdown
    logger.info("Shutting down SMS Task Management Backend v2")
    scheduler_service.stop_scheduler()

app = FastAPI(
    title="SMS Task Management Backend v2",
    description="Backend API for task management with SMS notifications using Twilio",
    version="2.0.0",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure this properly for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "SMS Task Management Backend v2",
        "version": "2.0.0",
        "status": "running"
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "timestamp": datetime.now()}

# Task Management Endpoints
@app.post("/tasks", response_model=Dict[str, Any])
async def create_task(task_data: TaskCreateRequest):
    """Create a new task and send SMS notification"""
    try:
        result = await task_service.create_task(task_data)
        if not result["success"]:
            raise HTTPException(status_code=400, detail=result["message"])
        return result
    except Exception as e:
        logger.error(f"Error in create_task endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/tasks/{task_id}", response_model=Dict[str, Any])
async def update_task(task_id: str, updates: TaskUpdateRequest):
    """Update a task and send SMS notification"""
    try:
        result = await task_service.update_task(task_id, updates)
        if not result["success"]:
            raise HTTPException(status_code=400, detail=result["message"])
        return result
    except Exception as e:
        logger.error(f"Error in update_task endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/tasks/{task_id}/complete", response_model=Dict[str, Any])
async def complete_task(task_id: str):
    """Mark a task as completed and send SMS notification"""
    try:
        result = await task_service.complete_task(task_id)
        if not result["success"]:
            raise HTTPException(status_code=400, detail=result["message"])
        return result
    except Exception as e:
        logger.error(f"Error in complete_task endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/tasks/user/{user_id}", response_model=List[Dict[str, Any]])
async def get_user_tasks(user_id: str):
    """Get all tasks for a user"""
    try:
        tasks = await task_service.get_user_tasks(user_id)
        return tasks
    except Exception as e:
        logger.error(f"Error in get_user_tasks endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/tasks/user/{user_id}/pending", response_model=List[Dict[str, Any]])
async def get_pending_tasks(user_id: str):
    """Get pending tasks for a user"""
    try:
        tasks = await task_service.get_pending_tasks(user_id)
        return tasks
    except Exception as e:
        logger.error(f"Error in get_pending_tasks endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# SMS Notification Endpoints
@app.post("/sms/send", response_model=SMSResponse)
async def send_sms_notification(request: SMSNotificationRequest):
    """Send SMS notification to a specific user"""
    try:
        user = await firebase_client.get_user_by_id(request.user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        if not user.get('sms_notifications_enabled', True):
            raise HTTPException(status_code=400, detail="SMS notifications disabled for this user")
        
        phone_number = user.get('phone_number')
        if not phone_number:
            raise HTTPException(status_code=400, detail="No phone number found for user")
        
        # Send appropriate SMS based on notification type
        if request.notification_type.value == "task_created":
            task_data = await firebase_client.get_task_by_id(request.task_id) if request.task_id else None
            if task_data:
                creator = await firebase_client.get_user_by_id(task_data.get('createdBy', ''))
                creator_name = creator.get('name', 'Unknown') if creator else 'Unknown'
                result = await sms_service.send_task_created_notification(
                    phone_number, task_data['title'], creator_name
                )
            else:
                raise HTTPException(status_code=404, detail="Task not found")
        
        elif request.notification_type.value == "task_updated":
            task_data = await firebase_client.get_task_by_id(request.task_id) if request.task_id else None
            if task_data:
                result = await sms_service.send_task_updated_notification(
                    phone_number, task_data['title'], request.additional_data or {}
                )
            else:
                raise HTTPException(status_code=404, detail="Task not found")
        
        elif request.notification_type.value == "task_completed":
            task_data = await firebase_client.get_task_by_id(request.task_id) if request.task_id else None
            if task_data:
                result = await sms_service.send_task_completed_notification(
                    phone_number, task_data['title']
                )
            else:
                raise HTTPException(status_code=404, detail="Task not found")
        
        elif request.notification_type.value == "task_reminder":
            task_data = await firebase_client.get_task_by_id(request.task_id) if request.task_id else None
            if task_data:
                deadline = task_data.get('deadline')
                deadline_str = deadline.strftime('%Y-%m-%d %H:%M') if deadline else None
                result = await sms_service.send_task_reminder(
                    phone_number, task_data['title'], deadline_str
                )
            else:
                raise HTTPException(status_code=404, detail="Task not found")
        
        elif request.notification_type.value == "progress_update":
            progress_stats = request.additional_data or {}
            result = await sms_service.send_progress_update(phone_number, progress_stats)
        
        elif request.notification_type.value == "motivational":
            streak = request.additional_data.get('streak', 0) if request.additional_data else 0
            result = await sms_service.send_motivational_message(phone_number, streak)
        
        elif request.notification_type.value == "daily_summary":
            completed = request.additional_data.get('completed_tasks', 0) if request.additional_data else 0
            pending = request.additional_data.get('pending_tasks', 0) if request.additional_data else 0
            result = await sms_service.send_daily_summary(phone_number, completed, pending)
        
        else:
            raise HTTPException(status_code=400, detail="Invalid notification type")
        
        return SMSResponse(**result)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in send_sms_notification endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/sms/bulk", response_model=List[SMSResponse])
async def send_bulk_sms(request: BulkSMSRequest):
    """Send SMS notifications to multiple users"""
    try:
        results = []
        
        for user_id in request.user_ids:
            user = await firebase_client.get_user_by_id(user_id)
            if not user or not user.get('sms_notifications_enabled', True):
                results.append(SMSResponse(
                    success=False,
                    to=user_id,
                    status="failed",
                    error="User not found or SMS disabled"
                ))
                continue
            
            phone_number = user.get('phone_number')
            if not phone_number:
                results.append(SMSResponse(
                    success=False,
                    to=user_id,
                    status="failed",
                    error="No phone number found"
                ))
                continue
            
            # Send appropriate SMS based on notification type
            if request.notification_type.value == "motivational":
                streak = request.additional_data.get('streak', 0) if request.additional_data else 0
                result = await sms_service.send_motivational_message(phone_number, streak)
            elif request.notification_type.value == "daily_summary":
                completed = request.additional_data.get('completed_tasks', 0) if request.additional_data else 0
                pending = request.additional_data.get('pending_tasks', 0) if request.additional_data else 0
                result = await sms_service.send_daily_summary(phone_number, completed, pending)
            else:
                result = await sms_service.send_sms(phone_number, request.custom_message or "Notification")
            
            results.append(SMSResponse(**result))
        
        return results
        
    except Exception as e:
        logger.error(f"Error in send_bulk_sms endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Scheduler Endpoints
@app.post("/scheduler/reminder")
async def schedule_task_reminder(user_id: str, task_id: str, reminder_time: datetime):
    """Schedule a specific task reminder"""
    try:
        success = await scheduler_service.schedule_task_reminder(user_id, task_id, reminder_time)
        if not success:
            raise HTTPException(status_code=400, detail="Failed to schedule reminder")
        return {"success": True, "message": "Reminder scheduled successfully"}
    except Exception as e:
        logger.error(f"Error in schedule_task_reminder endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/scheduler/daily-summary/{user_id}")
async def send_daily_summary(user_id: str):
    """Send daily summary to a specific user"""
    try:
        result = await scheduler_service.send_daily_summary(user_id)
        if not result["success"]:
            raise HTTPException(status_code=400, detail=result["message"])
        return result
    except Exception as e:
        logger.error(f"Error in send_daily_summary endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# User Management Endpoints
@app.get("/users", response_model=List[Dict[str, Any]])
async def get_all_users():
    """Get all users"""
    try:
        users = await firebase_client.get_all_users()
        return users
    except Exception as e:
        logger.error(f"Error in get_all_users endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/users/students", response_model=List[Dict[str, Any]])
async def get_students():
    """Get all students"""
    try:
        students = await firebase_client.get_students()
        return students
    except Exception as e:
        logger.error(f"Error in get_students endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/users/{user_id}", response_model=Dict[str, Any])
async def get_user(user_id: str):
    """Get user by ID"""
    try:
        user = await firebase_client.get_user_by_id(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        return user
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in get_user endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)