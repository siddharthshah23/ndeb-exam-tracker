import os
from dotenv import load_dotenv
from typing import Optional

load_dotenv()

class Config:
    # Twilio Configuration
    TWILIO_ACCOUNT_SID: str = os.getenv("TWILIO_ACCOUNT_SID", "")
    TWILIO_AUTH_TOKEN: str = os.getenv("TWILIO_AUTH_TOKEN", "")
    TWILIO_PHONE_NUMBER: str = os.getenv("TWILIO_PHONE_NUMBER", "")
    
    # Firebase Configuration
    FIREBASE_PROJECT_ID: str = os.getenv("FIREBASE_PROJECT_ID", "")
    FIREBASE_PRIVATE_KEY_ID: str = os.getenv("FIREBASE_PRIVATE_KEY_ID", "")
    FIREBASE_PRIVATE_KEY: str = os.getenv("FIREBASE_PRIVATE_KEY", "")
    FIREBASE_CLIENT_EMAIL: str = os.getenv("FIREBASE_CLIENT_EMAIL", "")
    FIREBASE_CLIENT_ID: str = os.getenv("FIREBASE_CLIENT_ID", "")
    FIREBASE_AUTH_URI: str = os.getenv("FIREBASE_AUTH_URI", "https://accounts.google.com/o/oauth2/auth")
    FIREBASE_TOKEN_URI: str = os.getenv("FIREBASE_TOKEN_URI", "https://oauth2.googleapis.com/token")
    
    # Application Configuration
    APP_ENV: str = os.getenv("APP_ENV", "development")
    PORT: int = int(os.getenv("PORT", "8000"))
    
    @classmethod
    def validate_twilio_config(cls) -> bool:
        """Validate that all required Twilio configuration is present"""
        return all([
            cls.TWILIO_ACCOUNT_SID,
            cls.TWILIO_AUTH_TOKEN,
            cls.TWILIO_PHONE_NUMBER
        ])
    
    @classmethod
    def validate_firebase_config(cls) -> bool:
        """Validate that all required Firebase configuration is present"""
        return all([
            cls.FIREBASE_PROJECT_ID,
            cls.FIREBASE_PRIVATE_KEY_ID,
            cls.FIREBASE_PRIVATE_KEY,
            cls.FIREBASE_CLIENT_EMAIL,
            cls.FIREBASE_CLIENT_ID
        ])

config = Config()