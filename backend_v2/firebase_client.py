import firebase_admin
from firebase_admin import credentials, firestore
from typing import Dict, Any, List, Optional
import json
from config import config

class FirebaseClient:
    def __init__(self):
        self.db = None
        self._initialize_firebase()
    
    def _initialize_firebase(self):
        """Initialize Firebase Admin SDK"""
        if not config.validate_firebase_config():
            raise ValueError("Firebase configuration is incomplete. Please check your environment variables.")
        
        # Create credentials from environment variables
        cred_dict = {
            "type": "service_account",
            "project_id": config.FIREBASE_PROJECT_ID,
            "private_key_id": config.FIREBASE_PRIVATE_KEY_ID,
            "private_key": config.FIREBASE_PRIVATE_KEY.replace('\\n', '\n'),
            "client_email": config.FIREBASE_CLIENT_EMAIL,
            "client_id": config.FIREBASE_CLIENT_ID,
            "auth_uri": config.FIREBASE_AUTH_URI,
            "token_uri": config.FIREBASE_TOKEN_URI,
        }
        
        cred = credentials.Certificate(cred_dict)
        
        # Initialize Firebase Admin SDK
        if not firebase_admin._apps:
            firebase_admin.initialize_app(cred)
        
        self.db = firestore.client()
    
    def get_collection(self, collection_name: str):
        """Get a Firestore collection reference"""
        return self.db.collection(collection_name)
    
    def get_document(self, collection_name: str, doc_id: str):
        """Get a Firestore document reference"""
        return self.db.collection(collection_name).document(doc_id)
    
    async def get_user_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get user data by ID"""
        try:
            doc_ref = self.get_document('users', user_id)
            doc = doc_ref.get()
            
            if doc.exists:
                data = doc.to_dict()
                data['id'] = doc.id
                return data
            return None
        except Exception as e:
            print(f"Error getting user {user_id}: {e}")
            return None
    
    async def get_task_by_id(self, task_id: str) -> Optional[Dict[str, Any]]:
        """Get task data by ID"""
        try:
            doc_ref = self.get_document('tasks', task_id)
            doc = doc_ref.get()
            
            if doc.exists:
                data = doc.to_dict()
                data['id'] = doc.id
                return data
            return None
        except Exception as e:
            print(f"Error getting task {task_id}: {e}")
            return None
    
    async def get_tasks_by_user(self, user_id: str) -> List[Dict[str, Any]]:
        """Get all tasks assigned to a user"""
        try:
            tasks_ref = self.get_collection('tasks')
            query = tasks_ref.where('assignedTo', '==', user_id)
            docs = query.stream()
            
            tasks = []
            for doc in docs:
                data = doc.to_dict()
                data['id'] = doc.id
                tasks.append(data)
            
            return tasks
        except Exception as e:
            print(f"Error getting tasks for user {user_id}: {e}")
            return []
    
    async def get_pending_tasks_by_user(self, user_id: str) -> List[Dict[str, Any]]:
        """Get all pending (incomplete) tasks assigned to a user"""
        try:
            tasks_ref = self.get_collection('tasks')
            query = tasks_ref.where('assignedTo', '==', user_id).where('completed', '==', False)
            docs = query.stream()
            
            tasks = []
            for doc in docs:
                data = doc.to_dict()
                data['id'] = doc.id
                tasks.append(data)
            
            return tasks
        except Exception as e:
            print(f"Error getting pending tasks for user {user_id}: {e}")
            return []
    
    async def get_all_users(self) -> List[Dict[str, Any]]:
        """Get all users from the database"""
        try:
            users_ref = self.get_collection('users')
            docs = users_ref.stream()
            
            users = []
            for doc in docs:
                data = doc.to_dict()
                data['id'] = doc.id
                users.append(data)
            
            return users
        except Exception as e:
            print(f"Error getting all users: {e}")
            return []
    
    async def get_students(self) -> List[Dict[str, Any]]:
        """Get all students from the database"""
        try:
            users_ref = self.get_collection('users')
            query = users_ref.where('role', '==', 'student')
            docs = query.stream()
            
            students = []
            for doc in docs:
                data = doc.to_dict()
                data['id'] = doc.id
                students.append(data)
            
            return students
        except Exception as e:
            print(f"Error getting students: {e}")
            return []

# Global Firebase client instance
firebase_client = FirebaseClient()