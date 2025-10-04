# SMS Task Management Backend v2 - API Documentation

## Overview

This API provides SMS-integrated task management functionality with Twilio integration. All endpoints return JSON responses and support CORS for web applications.

**Base URL**: `http://localhost:8000` (development)  
**API Version**: 2.0.0

## Authentication

Currently, the API does not implement authentication. In production, you should add proper authentication middleware.

## Response Format

All responses follow this format:

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "details": { ... }
}
```

## Endpoints

### Health Check

#### GET /health
Check if the service is running.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-10T10:00:00Z"
}
```

---

### Task Management

#### POST /tasks
Create a new task and send SMS notification.

**Request Body:**
```json
{
  "title": "Complete Chapter 5",
  "subject_id": "math_101",
  "chapter_id": "chapter_5",
  "pages": 25,
  "start_page": 100,
  "end_page": 125,
  "task_type": "chapter",
  "revision_number": 1,
  "assigned_to": "student_user_id",
  "created_by": "partner_user_id",
  "deadline": "2024-01-15T23:59:59Z"
}
```

**Response:**
```json
{
  "success": true,
  "task_id": "task_123",
  "message": "Task created successfully"
}
```

#### PUT /tasks/{task_id}
Update a task and send SMS notification.

**Request Body:**
```json
{
  "title": "Updated Task Title",
  "pages": 30,
  "deadline": "2024-01-20T23:59:59Z",
  "status": "in_progress"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Task updated successfully"
}
```

#### POST /tasks/{task_id}/complete
Mark a task as completed and send SMS notification.

**Response:**
```json
{
  "success": true,
  "message": "Task completed successfully"
}
```

#### GET /tasks/user/{user_id}
Get all tasks for a user.

**Response:**
```json
[
  {
    "id": "task_123",
    "title": "Complete Chapter 5",
    "subjectId": "math_101",
    "chapterId": "chapter_5",
    "taskType": "chapter",
    "completed": false,
    "assignedTo": "student_user_id",
    "createdBy": "partner_user_id",
    "createdAt": "2024-01-10T10:00:00Z",
    "deadline": "2024-01-15T23:59:59Z"
  }
]
```

#### GET /tasks/user/{user_id}/pending
Get pending tasks for a user.

**Response:**
```json
[
  {
    "id": "task_123",
    "title": "Complete Chapter 5",
    "subjectId": "math_101",
    "completed": false,
    "deadline": "2024-01-15T23:59:59Z"
  }
]
```

---

### SMS Notifications

#### POST /sms/send
Send SMS notification to a specific user.

**Request Body:**
```json
{
  "user_id": "student_user_id",
  "notification_type": "motivational",
  "task_id": "task_123",
  "custom_message": "Custom message here",
  "additional_data": {
    "streak": 5,
    "progress": 75
  }
}
```

**Notification Types:**
- `task_created` - Task creation notification
- `task_updated` - Task update notification
- `task_completed` - Task completion notification
- `task_reminder` - Task reminder
- `progress_update` - Progress update
- `motivational` - Motivational message
- `daily_summary` - Daily summary

**Response:**
```json
{
  "success": true,
  "message_sid": "SM1234567890abcdef",
  "to": "+1234567890",
  "status": "sent",
  "error": null
}
```

#### POST /sms/bulk
Send SMS notifications to multiple users.

**Request Body:**
```json
{
  "user_ids": ["user_1", "user_2", "user_3"],
  "notification_type": "motivational",
  "custom_message": "Keep up the great work!",
  "additional_data": {
    "streak": 5
  }
}
```

**Response:**
```json
[
  {
    "success": true,
    "message_sid": "SM1234567890abcdef",
    "to": "+1234567890",
    "status": "sent",
    "error": null
  },
  {
    "success": false,
    "message_sid": null,
    "to": "user_2",
    "status": "failed",
    "error": "No phone number found"
  }
]
```

---

### Scheduler

#### POST /scheduler/reminder
Schedule a specific task reminder.

**Query Parameters:**
- `user_id` (string) - User ID
- `task_id` (string) - Task ID
- `reminder_time` (datetime) - When to send the reminder

**Example:**
```
POST /scheduler/reminder?user_id=student_123&task_id=task_456&reminder_time=2024-01-15T09:00:00Z
```

**Response:**
```json
{
  "success": true,
  "message": "Reminder scheduled successfully"
}
```

#### POST /scheduler/daily-summary/{user_id}
Send daily summary to a specific user.

**Response:**
```json
{
  "success": true,
  "message": "Daily summary sent"
}
```

---

### User Management

#### GET /users
Get all users.

**Response:**
```json
[
  {
    "id": "user_123",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "student",
    "phone_number": "+1234567890",
    "daily_streak": 5,
    "sms_notifications_enabled": true
  }
]
```

#### GET /users/students
Get all students.

**Response:**
```json
[
  {
    "id": "student_123",
    "name": "Jane Smith",
    "email": "jane@example.com",
    "role": "student",
    "phone_number": "+1234567890",
    "daily_streak": 3
  }
]
```

#### GET /users/{user_id}
Get user by ID.

**Response:**
```json
{
  "id": "user_123",
  "name": "John Doe",
  "email": "john@example.com",
  "role": "student",
  "phone_number": "+1234567890",
  "daily_streak": 5,
  "sms_notifications_enabled": true,
  "last_activity_date": "2024-01-10T10:00:00Z"
}
```

---

## Data Models

### Task
```json
{
  "id": "string",
  "title": "string",
  "subject_id": "string",
  "chapter_id": "string (optional)",
  "pages": "number (optional)",
  "start_page": "number (optional)",
  "end_page": "number (optional)",
  "task_type": "chapter | pages | revision",
  "revision_number": "number (optional)",
  "completed": "boolean",
  "assigned_to": "string",
  "created_by": "string",
  "created_at": "datetime",
  "deadline": "datetime (optional)",
  "completed_at": "datetime (optional)",
  "status": "pending | in_progress | completed"
}
```

### User
```json
{
  "id": "string",
  "name": "string",
  "email": "string",
  "role": "student | partner",
  "phone_number": "string (optional)",
  "daily_streak": "number (optional)",
  "last_activity_date": "datetime (optional)",
  "sms_notifications_enabled": "boolean (optional)"
}
```

### SMS Response
```json
{
  "success": "boolean",
  "message_sid": "string (optional)",
  "to": "string",
  "status": "string",
  "error": "string (optional)"
}
```

---

## Error Codes

| Status Code | Description |
|-------------|-------------|
| 200 | Success |
| 400 | Bad Request - Invalid input data |
| 404 | Not Found - Resource not found |
| 500 | Internal Server Error - Server error |

---

## Scheduled Jobs

The system automatically runs the following scheduled jobs:

### Daily Jobs
- **9:00 AM** - Daily task reminders
- **6:00 PM** - Daily motivational messages

### Weekly Jobs
- **Sunday 8:00 PM** - Weekly progress updates

### Continuous Jobs
- **Every hour** - Check for overdue tasks

---

## Example Usage

### Python Example
```python
import requests
import json

# Create a task
task_data = {
    "title": "Complete Chapter 5",
    "subject_id": "math_101",
    "task_type": "chapter",
    "assigned_to": "student_123",
    "created_by": "partner_456",
    "deadline": "2024-01-15T23:59:59Z"
}

response = requests.post("http://localhost:8000/tasks", json=task_data)
print(response.json())

# Send motivational message
sms_data = {
    "user_id": "student_123",
    "notification_type": "motivational",
    "additional_data": {"streak": 5}
}

response = requests.post("http://localhost:8000/sms/send", json=sms_data)
print(response.json())
```

### JavaScript Example
```javascript
// Create a task
const taskData = {
    title: "Complete Chapter 5",
    subject_id: "math_101",
    task_type: "chapter",
    assigned_to: "student_123",
    created_by: "partner_456",
    deadline: "2024-01-15T23:59:59Z"
};

fetch('http://localhost:8000/tasks', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify(taskData)
})
.then(response => response.json())
.then(data => console.log(data));

// Send motivational message
const smsData = {
    user_id: "student_123",
    notification_type: "motivational",
    additional_data: {streak: 5}
};

fetch('http://localhost:8000/sms/send', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify(smsData)
})
.then(response => response.json())
.then(data => console.log(data));
```

---

## Rate Limits

Currently, there are no rate limits implemented. In production, consider implementing rate limiting to prevent abuse.

## Monitoring

Monitor the following metrics:
- SMS delivery rates
- API response times
- Error rates
- Scheduled job execution
- Task completion rates

## Support

For issues and questions:
1. Check the application logs
2. Verify configuration settings
3. Test SMS functionality with the test script
4. Review the API documentation
5. Contact the development team