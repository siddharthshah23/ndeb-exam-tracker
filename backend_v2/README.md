# SMS Task Management Backend v2

A Python FastAPI backend service that integrates with Twilio SMS for task management notifications. This service provides SMS notifications for task events and scheduled reminders, updates, progress reports, and motivational messages.

## Features

### Core Functionality
- **Task Management**: Create, update, and complete tasks with automatic SMS notifications
- **SMS Integration**: Twilio-powered SMS notifications for all task events
- **Scheduled Jobs**: Automated reminders, progress updates, and motivational messages
- **Firebase Integration**: Seamless integration with existing Firebase Firestore database
- **User Management**: Support for students and partners with SMS preferences

### SMS Notification Types
1. **Task Created**: Notifies when a new task is assigned
2. **Task Updated**: Alerts when task details are modified
3. **Task Completed**: Celebrates task completion
4. **Task Reminders**: Sends reminders for pending tasks
5. **Progress Updates**: Weekly progress summaries
6. **Motivational Messages**: Daily motivational content
7. **Daily Summaries**: End-of-day task summaries

### Scheduled Jobs
- **Daily Reminders**: 9:00 AM task reminders
- **Daily Motivation**: 6:00 PM motivational messages
- **Weekly Progress**: Sunday 8:00 PM progress updates
- **Overdue Check**: Hourly checks for overdue tasks
- **Custom Reminders**: On-demand task-specific reminders

## Installation

### Prerequisites
- Python 3.8+
- Twilio Account with SMS capabilities
- Firebase project with Firestore database
- Environment variables configured

### Setup

1. **Clone and navigate to the backend directory**:
   ```bash
   cd backend_v2
   ```

2. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env with your actual credentials
   ```

4. **Set up environment variables**:
   ```env
   # Twilio Configuration
   TWILIO_ACCOUNT_SID=your_twilio_account_sid
   TWILIO_AUTH_TOKEN=your_twilio_auth_token
   TWILIO_PHONE_NUMBER=your_twilio_phone_number

   # Firebase Configuration
   FIREBASE_PROJECT_ID=your_firebase_project_id
   FIREBASE_PRIVATE_KEY_ID=your_firebase_private_key_id
   FIREBASE_PRIVATE_KEY=your_firebase_private_key
   FIREBASE_CLIENT_EMAIL=your_firebase_client_email
   FIREBASE_CLIENT_ID=your_firebase_client_id

   # Application Configuration
   APP_ENV=development
   PORT=8000
   ```

## Usage

### Starting the Server

```bash
python main.py
```

Or using uvicorn directly:
```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### API Endpoints

#### Task Management
- `POST /tasks` - Create a new task
- `PUT /tasks/{task_id}` - Update a task
- `POST /tasks/{task_id}/complete` - Mark task as completed
- `GET /tasks/user/{user_id}` - Get user's tasks
- `GET /tasks/user/{user_id}/pending` - Get user's pending tasks

#### SMS Notifications
- `POST /sms/send` - Send SMS notification to a user
- `POST /sms/bulk` - Send bulk SMS notifications

#### Scheduler
- `POST /scheduler/reminder` - Schedule a task reminder
- `POST /scheduler/daily-summary/{user_id}` - Send daily summary

#### User Management
- `GET /users` - Get all users
- `GET /users/students` - Get all students
- `GET /users/{user_id}` - Get user by ID

### Example Usage

#### Creating a Task with SMS Notification
```python
import requests

task_data = {
    "title": "Complete Chapter 5",
    "subject_id": "math_101",
    "chapter_id": "chapter_5",
    "task_type": "chapter",
    "assigned_to": "student_user_id",
    "created_by": "partner_user_id",
    "deadline": "2024-01-15T23:59:59"
}

response = requests.post("http://localhost:8000/tasks", json=task_data)
print(response.json())
```

#### Sending a Motivational Message
```python
sms_data = {
    "user_id": "student_user_id",
    "notification_type": "motivational",
    "additional_data": {"streak": 5}
}

response = requests.post("http://localhost:8000/sms/send", json=sms_data)
print(response.json())
```

## Configuration

### Twilio Setup
1. Create a Twilio account at [twilio.com](https://twilio.com)
2. Get your Account SID and Auth Token from the console
3. Purchase a phone number for sending SMS
4. Add these credentials to your `.env` file

### Firebase Setup
1. Create a Firebase project
2. Enable Firestore database
3. Create a service account and download the credentials
4. Add the service account credentials to your `.env` file

### User Phone Numbers
Users need to have phone numbers stored in the Firebase `users` collection with the field `phone_number`. The format should include country code (e.g., `+1234567890`).

## Database Schema

### Users Collection
```json
{
  "id": "user_id",
  "name": "John Doe",
  "email": "john@example.com",
  "role": "student",
  "phone_number": "+1234567890",
  "daily_streak": 5,
  "sms_notifications_enabled": true,
  "last_activity_date": "2024-01-10T10:00:00Z"
}
```

### Tasks Collection
```json
{
  "id": "task_id",
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
```

## Error Handling

The service includes comprehensive error handling:
- Twilio API errors
- Firebase connection issues
- Invalid user/task references
- Missing phone numbers
- SMS notification preferences

## Logging

The service logs all important events:
- SMS sending attempts and results
- Task operations
- Scheduled job executions
- Error conditions

## Development

### Running in Development Mode
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Testing SMS Functionality
You can test SMS functionality by:
1. Using the `/sms/send` endpoint with a test phone number
2. Creating tasks and observing automatic notifications
3. Triggering scheduled jobs manually

## Production Deployment

### Environment Variables
Ensure all production environment variables are properly set:
- Twilio credentials
- Firebase service account credentials
- Production database URLs
- Security settings

### Security Considerations
- Use environment variables for all sensitive data
- Implement proper authentication/authorization
- Configure CORS appropriately
- Use HTTPS in production
- Monitor SMS usage and costs

## Monitoring

### Health Checks
- `GET /health` - Basic health check
- `GET /` - Service status and version

### Metrics to Monitor
- SMS delivery rates
- Task completion rates
- Scheduled job execution
- Error rates
- Response times

## Troubleshooting

### Common Issues

1. **SMS Not Sending**
   - Check Twilio credentials
   - Verify phone number format
   - Check user's SMS preferences
   - Review Twilio account balance

2. **Firebase Connection Issues**
   - Verify service account credentials
   - Check Firebase project configuration
   - Ensure Firestore is enabled

3. **Scheduled Jobs Not Running**
   - Check scheduler service status
   - Verify cron expressions
   - Review application logs

### Logs
Check application logs for detailed error information:
```bash
# View logs if running with uvicorn
tail -f logs/app.log
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions:
- Check the logs for error details
- Review the API documentation
- Test with the provided examples
- Contact the development team