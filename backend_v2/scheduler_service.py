from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.date import DateTrigger
from apscheduler.triggers.interval import IntervalTrigger
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
import logging
from firebase_client import firebase_client
from sms_service import sms_service
from models import SMSNotificationType

logger = logging.getLogger(__name__)

class SchedulerService:
    def __init__(self):
        self.scheduler = AsyncIOScheduler()
        self.firebase = firebase_client
        self.sms = sms_service
    
    def start_scheduler(self):
        """Start the scheduler"""
        self.scheduler.start()
        logger.info("Scheduler started")
        
        # Schedule recurring jobs
        self._schedule_recurring_jobs()
    
    def stop_scheduler(self):
        """Stop the scheduler"""
        self.scheduler.shutdown()
        logger.info("Scheduler stopped")
    
    def _schedule_recurring_jobs(self):
        """Schedule recurring jobs for reminders and motivation"""
        
        # Daily reminder at 9 AM
        self.scheduler.add_job(
            self._send_daily_reminders,
            CronTrigger(hour=9, minute=0),
            id='daily_reminders',
            name='Daily Task Reminders',
            replace_existing=True
        )
        
        # Daily motivation at 6 PM
        self.scheduler.add_job(
            self._send_daily_motivation,
            CronTrigger(hour=18, minute=0),
            id='daily_motivation',
            name='Daily Motivation',
            replace_existing=True
        )
        
        # Weekly progress update on Sundays at 8 PM
        self.scheduler.add_job(
            self._send_weekly_progress,
            CronTrigger(day_of_week=6, hour=20, minute=0),  # Sunday
            id='weekly_progress',
            name='Weekly Progress Update',
            replace_existing=True
        )
        
        # Hourly check for overdue tasks
        self.scheduler.add_job(
            self._check_overdue_tasks,
            IntervalTrigger(hours=1),
            id='overdue_check',
            name='Overdue Task Check',
            replace_existing=True
        )
    
    async def _send_daily_reminders(self):
        """Send daily reminders to all students"""
        try:
            students = await self.firebase.get_students()
            
            for student in students:
                if not student.get('sms_notifications_enabled', True):
                    continue
                
                phone_number = student.get('phone_number')
                if not phone_number:
                    continue
                
                # Get pending tasks for this student
                pending_tasks = await self.firebase.get_pending_tasks_by_user(student['id'])
                
                if pending_tasks:
                    # Send reminder for the first pending task
                    task = pending_tasks[0]
                    deadline = task.get('deadline')
                    deadline_str = deadline.strftime('%Y-%m-%d %H:%M') if deadline else None
                    
                    await self.sms.send_task_reminder(
                        phone_number, 
                        task['title'], 
                        deadline_str
                    )
                    
                    logger.info(f"Sent daily reminder to {student['name']}")
        
        except Exception as e:
            logger.error(f"Error sending daily reminders: {e}")
    
    async def _send_daily_motivation(self):
        """Send daily motivation to all students"""
        try:
            students = await self.firebase.get_students()
            
            for student in students:
                if not student.get('sms_notifications_enabled', True):
                    continue
                
                phone_number = student.get('phone_number')
                if not phone_number:
                    continue
                
                streak = student.get('dailyStreak', 0)
                await self.sms.send_motivational_message(phone_number, streak)
                
                logger.info(f"Sent motivation to {student['name']}")
        
        except Exception as e:
            logger.error(f"Error sending daily motivation: {e}")
    
    async def _send_weekly_progress(self):
        """Send weekly progress update to all students"""
        try:
            students = await self.firebase.get_students()
            
            for student in students:
                if not student.get('sms_notifications_enabled', True):
                    continue
                
                phone_number = student.get('phone_number')
                if not phone_number:
                    continue
                
                # Calculate progress for this student
                progress_stats = await self._calculate_student_progress(student['id'])
                
                await self.sms.send_progress_update(phone_number, progress_stats)
                
                logger.info(f"Sent weekly progress to {student['name']}")
        
        except Exception as e:
            logger.error(f"Error sending weekly progress: {e}")
    
    async def _check_overdue_tasks(self):
        """Check for overdue tasks and send reminders"""
        try:
            students = await self.firebase.get_students()
            current_time = datetime.now()
            
            for student in students:
                if not student.get('sms_notifications_enabled', True):
                    continue
                
                phone_number = student.get('phone_number')
                if not phone_number:
                    continue
                
                # Get pending tasks with deadlines
                pending_tasks = await self.firebase.get_pending_tasks_by_user(student['id'])
                overdue_tasks = []
                
                for task in pending_tasks:
                    deadline = task.get('deadline')
                    if deadline and deadline < current_time:
                        overdue_tasks.append(task)
                
                if overdue_tasks:
                    # Send reminder for overdue tasks
                    task = overdue_tasks[0]  # Send reminder for the first overdue task
                    await self.sms.send_task_reminder(
                        phone_number, 
                        task['title'], 
                        f"OVERDUE: {task['deadline'].strftime('%Y-%m-%d %H:%M')}"
                    )
                    
                    logger.info(f"Sent overdue reminder to {student['name']}")
        
        except Exception as e:
            logger.error(f"Error checking overdue tasks: {e}")
    
    async def _calculate_student_progress(self, user_id: str) -> Dict[str, Any]:
        """Calculate progress statistics for a student"""
        try:
            # This is a simplified version - you might want to implement
            # the full progress calculation logic here
            tasks = await self.firebase.get_tasks_by_user(user_id)
            
            total_tasks = len(tasks)
            completed_tasks = len([t for t in tasks if t.get('completed', False)])
            
            overall_progress = (completed_tasks / total_tasks * 100) if total_tasks > 0 else 0
            
            return {
                'overallProgress': round(overall_progress),
                'totalRevisions': 0,  # You can implement this based on your data structure
                'completedTasks': completed_tasks,
                'totalTasks': total_tasks
            }
        
        except Exception as e:
            logger.error(f"Error calculating progress for user {user_id}: {e}")
            return {
                'overallProgress': 0,
                'totalRevisions': 0,
                'completedTasks': 0,
                'totalTasks': 0
            }
    
    async def schedule_task_reminder(self, user_id: str, task_id: str, reminder_time: datetime) -> bool:
        """Schedule a specific task reminder"""
        try:
            job_id = f"task_reminder_{task_id}_{user_id}"
            
            self.scheduler.add_job(
                self._send_specific_task_reminder,
                DateTrigger(run_date=reminder_time),
                args=[user_id, task_id],
                id=job_id,
                name=f'Task Reminder for {task_id}',
                replace_existing=True
            )
            
            logger.info(f"Scheduled reminder for task {task_id} at {reminder_time}")
            return True
            
        except Exception as e:
            logger.error(f"Error scheduling task reminder: {e}")
            return False
    
    async def _send_specific_task_reminder(self, user_id: str, task_id: str):
        """Send reminder for a specific task"""
        try:
            user = await self.firebase.get_user_by_id(user_id)
            if not user or not user.get('sms_notifications_enabled', True):
                return
            
            phone_number = user.get('phone_number')
            if not phone_number:
                return
            
            task = await self.firebase.get_task_by_id(task_id)
            if not task:
                return
            
            deadline = task.get('deadline')
            deadline_str = deadline.strftime('%Y-%m-%d %H:%M') if deadline else None
            
            await self.sms.send_task_reminder(phone_number, task['title'], deadline_str)
            
            logger.info(f"Sent specific reminder for task {task_id} to user {user_id}")
            
        except Exception as e:
            logger.error(f"Error sending specific task reminder: {e}")
    
    async def send_daily_summary(self, user_id: str) -> Dict[str, Any]:
        """Send daily summary to a specific user"""
        try:
            user = await self.firebase.get_user_by_id(user_id)
            if not user or not user.get('sms_notifications_enabled', True):
                return {"success": False, "message": "User not found or SMS disabled"}
            
            phone_number = user.get('phone_number')
            if not phone_number:
                return {"success": False, "message": "No phone number found"}
            
            # Get tasks for today
            tasks = await self.firebase.get_tasks_by_user(user_id)
            today = datetime.now().date()
            
            completed_today = 0
            pending_tasks = 0
            
            for task in tasks:
                if task.get('completed', False):
                    completed_at = task.get('completedAt')
                    if completed_at and completed_at.date() == today:
                        completed_today += 1
                else:
                    pending_tasks += 1
            
            await self.sms.send_daily_summary(phone_number, completed_today, pending_tasks)
            
            return {"success": True, "message": "Daily summary sent"}
            
        except Exception as e:
            logger.error(f"Error sending daily summary: {e}")
            return {"success": False, "message": str(e)}

# Global scheduler service instance
scheduler_service = SchedulerService()