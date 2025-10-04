from twilio.rest import Client
from twilio.base.exceptions import TwilioException
from typing import Optional, Dict, Any
import logging
from config import config

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class SMSService:
    def __init__(self):
        if not config.validate_twilio_config():
            raise ValueError("Twilio configuration is incomplete. Please check your environment variables.")
        
        self.client = Client(config.TWILIO_ACCOUNT_SID, config.TWILIO_AUTH_TOKEN)
        self.from_number = config.TWILIO_PHONE_NUMBER
    
    async def send_sms(self, to_number: str, message: str) -> Dict[str, Any]:
        """
        Send SMS message using Twilio
        
        Args:
            to_number: Recipient phone number (with country code, e.g., +1234567890)
            message: SMS message content
            
        Returns:
            Dict containing success status and message details
        """
        try:
            # Validate phone number format
            if not to_number.startswith('+'):
                to_number = '+' + to_number.lstrip('+')
            
            # Send SMS
            message_obj = self.client.messages.create(
                body=message,
                from_=self.from_number,
                to=to_number
            )
            
            logger.info(f"SMS sent successfully to {to_number}. Message SID: {message_obj.sid}")
            
            return {
                "success": True,
                "message_sid": message_obj.sid,
                "to": to_number,
                "status": message_obj.status,
                "error": None
            }
            
        except TwilioException as e:
            logger.error(f"Twilio error sending SMS to {to_number}: {e}")
            return {
                "success": False,
                "message_sid": None,
                "to": to_number,
                "status": "failed",
                "error": str(e)
            }
        except Exception as e:
            logger.error(f"Unexpected error sending SMS to {to_number}: {e}")
            return {
                "success": False,
                "message_sid": None,
                "to": to_number,
                "status": "failed",
                "error": str(e)
            }
    
    async def send_task_created_notification(self, user_phone: str, task_title: str, created_by: str) -> Dict[str, Any]:
        """Send SMS notification when a task is created"""
        message = f"📝 New Task Assigned!\n\nTask: {task_title}\nCreated by: {created_by}\n\nCheck your dashboard to get started!"
        return await self.send_sms(user_phone, message)
    
    async def send_task_updated_notification(self, user_phone: str, task_title: str, updates: Dict[str, Any]) -> Dict[str, Any]:
        """Send SMS notification when a task is updated"""
        update_details = []
        if 'deadline' in updates:
            update_details.append(f"Deadline: {updates['deadline']}")
        if 'title' in updates:
            update_details.append(f"Title: {updates['title']}")
        if 'pages' in updates:
            update_details.append(f"Pages: {updates['pages']}")
        
        update_text = "\n".join(update_details) if update_details else "Task details updated"
        
        message = f"📋 Task Updated!\n\nTask: {task_title}\n\nChanges:\n{update_text}\n\nCheck your dashboard for details!"
        return await self.send_sms(user_phone, message)
    
    async def send_task_completed_notification(self, user_phone: str, task_title: str) -> Dict[str, Any]:
        """Send SMS notification when a task is completed"""
        message = f"🎉 Task Completed!\n\nGreat job completing: {task_title}\n\nKeep up the excellent work! 💪"
        return await self.send_sms(user_phone, message)
    
    async def send_task_reminder(self, user_phone: str, task_title: str, deadline: Optional[str] = None) -> Dict[str, Any]:
        """Send SMS reminder for pending tasks"""
        deadline_text = f"\nDeadline: {deadline}" if deadline else ""
        message = f"⏰ Task Reminder!\n\nDon't forget: {task_title}{deadline_text}\n\nTime to focus and get it done! 🎯"
        return await self.send_sms(user_phone, message)
    
    async def send_progress_update(self, user_phone: str, progress_stats: Dict[str, Any]) -> Dict[str, Any]:
        """Send SMS with progress update"""
        overall_progress = progress_stats.get('overallProgress', 0)
        total_revisions = progress_stats.get('totalRevisions', 0)
        
        message = f"📊 Progress Update!\n\nOverall Progress: {overall_progress}%\nTotal Revisions: {total_revisions}\n\nYou're making great progress! Keep it up! 🚀"
        return await self.send_sms(user_phone, message)
    
    async def send_motivational_message(self, user_phone: str, streak: int = 0) -> Dict[str, Any]:
        """Send motivational SMS message"""
        motivational_quotes = [
            "🌟 Every expert was once a beginner. Keep going!",
            "💪 Success is the sum of small efforts repeated day in and day out.",
            "🎯 The only impossible journey is the one you never begin.",
            "🔥 Your potential is limitless. Believe in yourself!",
            "⭐ Great things never come from comfort zones.",
            "🚀 Today's hard work is tomorrow's success story.",
            "💎 You are capable of amazing things. Keep pushing forward!",
            "🌈 Every challenge is an opportunity to grow stronger.",
            "🎪 Consistency is the key to mastery. You've got this!",
            "🏆 Champions are made when nobody's watching. Keep training!"
        ]
        
        import random
        quote = random.choice(motivational_quotes)
        
        streak_text = f"\n\n🔥 Current Streak: {streak} days!" if streak > 0 else ""
        message = f"💪 Motivational Boost!\n\n{quote}{streak_text}\n\nYou're doing amazing! Keep up the great work! 🌟"
        return await self.send_sms(user_phone, message)
    
    async def send_daily_summary(self, user_phone: str, completed_tasks: int, pending_tasks: int) -> Dict[str, Any]:
        """Send daily summary SMS"""
        message = f"📅 Daily Summary!\n\n✅ Completed: {completed_tasks} tasks\n📋 Pending: {pending_tasks} tasks\n\n"
        
        if completed_tasks > 0:
            message += "🎉 Great work today! You're making excellent progress!"
        elif pending_tasks > 0:
            message += "⏰ You have pending tasks. Time to tackle them tomorrow!"
        else:
            message += "🌟 All caught up! Enjoy your well-deserved rest!"
        
        return await self.send_sms(user_phone, message)

# Global SMS service instance
sms_service = SMSService()