#!/usr/bin/env python3
"""
Test script for SMS functionality
Run this script to test SMS sending capabilities
"""

import asyncio
import os
from dotenv import load_dotenv
from sms_service import sms_service
from config import config

# Load environment variables
load_dotenv()

async def test_sms_functionality():
    """Test various SMS functionality"""
    
    print("🧪 Testing SMS Functionality")
    print("=" * 50)
    
    # Test phone number (replace with your test number)
    test_phone = input("Enter test phone number (with country code, e.g., +1234567890): ").strip()
    
    if not test_phone:
        print("❌ No phone number provided. Exiting.")
        return
    
    print(f"\n📱 Testing with phone number: {test_phone}")
    
    # Test 1: Basic SMS
    print("\n1️⃣ Testing basic SMS...")
    result = await sms_service.send_sms(test_phone, "🧪 Test message from SMS Task Management Backend v2!")
    print(f"   Result: {'✅ Success' if result['success'] else '❌ Failed'}")
    if not result['success']:
        print(f"   Error: {result['error']}")
    
    await asyncio.sleep(2)
    
    # Test 2: Task Created Notification
    print("\n2️⃣ Testing task created notification...")
    result = await sms_service.send_task_created_notification(
        test_phone, 
        "Complete Chapter 5: Advanced Mathematics", 
        "Dr. Smith"
    )
    print(f"   Result: {'✅ Success' if result['success'] else '❌ Failed'}")
    if not result['success']:
        print(f"   Error: {result['error']}")
    
    await asyncio.sleep(2)
    
    # Test 3: Task Updated Notification
    print("\n3️⃣ Testing task updated notification...")
    updates = {
        "deadline": "2024-01-15 23:59",
        "pages": "25-30"
    }
    result = await sms_service.send_task_updated_notification(
        test_phone, 
        "Complete Chapter 5: Advanced Mathematics", 
        updates
    )
    print(f"   Result: {'✅ Success' if result['success'] else '❌ Failed'}")
    if not result['success']:
        print(f"   Error: {result['error']}")
    
    await asyncio.sleep(2)
    
    # Test 4: Task Completed Notification
    print("\n4️⃣ Testing task completed notification...")
    result = await sms_service.send_task_completed_notification(
        test_phone, 
        "Complete Chapter 5: Advanced Mathematics"
    )
    print(f"   Result: {'✅ Success' if result['success'] else '❌ Failed'}")
    if not result['success']:
        print(f"   Error: {result['error']}")
    
    await asyncio.sleep(2)
    
    # Test 5: Task Reminder
    print("\n5️⃣ Testing task reminder...")
    result = await sms_service.send_task_reminder(
        test_phone, 
        "Complete Chapter 5: Advanced Mathematics", 
        "2024-01-15 23:59"
    )
    print(f"   Result: {'✅ Success' if result['success'] else '❌ Failed'}")
    if not result['success']:
        print(f"   Error: {result['error']}")
    
    await asyncio.sleep(2)
    
    # Test 6: Progress Update
    print("\n6️⃣ Testing progress update...")
    progress_stats = {
        "overallProgress": 75,
        "totalRevisions": 12
    }
    result = await sms_service.send_progress_update(test_phone, progress_stats)
    print(f"   Result: {'✅ Success' if result['success'] else '❌ Failed'}")
    if not result['success']:
        print(f"   Error: {result['error']}")
    
    await asyncio.sleep(2)
    
    # Test 7: Motivational Message
    print("\n7️⃣ Testing motivational message...")
    result = await sms_service.send_motivational_message(test_phone, 5)
    print(f"   Result: {'✅ Success' if result['success'] else '❌ Failed'}")
    if not result['success']:
        print(f"   Error: {result['error']}")
    
    await asyncio.sleep(2)
    
    # Test 8: Daily Summary
    print("\n8️⃣ Testing daily summary...")
    result = await sms_service.send_daily_summary(test_phone, 3, 2)
    print(f"   Result: {'✅ Success' if result['success'] else '❌ Failed'}")
    if not result['success']:
        print(f"   Error: {result['error']}")
    
    print("\n🎉 SMS testing completed!")
    print("Check your phone for the test messages.")

def check_configuration():
    """Check if configuration is properly set up"""
    print("🔧 Checking Configuration")
    print("=" * 30)
    
    # Check Twilio config
    twilio_ok = config.validate_twilio_config()
    print(f"Twilio Config: {'✅ Valid' if twilio_ok else '❌ Invalid'}")
    
    if not twilio_ok:
        print("   Missing Twilio configuration:")
        if not config.TWILIO_ACCOUNT_SID:
            print("   - TWILIO_ACCOUNT_SID")
        if not config.TWILIO_AUTH_TOKEN:
            print("   - TWILIO_AUTH_TOKEN")
        if not config.TWILIO_PHONE_NUMBER:
            print("   - TWILIO_PHONE_NUMBER")
    
    # Check Firebase config
    firebase_ok = config.validate_firebase_config()
    print(f"Firebase Config: {'✅ Valid' if firebase_ok else '❌ Invalid'}")
    
    if not firebase_ok:
        print("   Missing Firebase configuration:")
        if not config.FIREBASE_PROJECT_ID:
            print("   - FIREBASE_PROJECT_ID")
        if not config.FIREBASE_PRIVATE_KEY_ID:
            print("   - FIREBASE_PRIVATE_KEY_ID")
        if not config.FIREBASE_PRIVATE_KEY:
            print("   - FIREBASE_PRIVATE_KEY")
        if not config.FIREBASE_CLIENT_EMAIL:
            print("   - FIREBASE_CLIENT_EMAIL")
        if not config.FIREBASE_CLIENT_ID:
            print("   - FIREBASE_CLIENT_ID")
    
    return twilio_ok and firebase_ok

async def main():
    """Main test function"""
    print("🚀 SMS Task Management Backend v2 - Test Suite")
    print("=" * 60)
    
    # Check configuration first
    if not check_configuration():
        print("\n❌ Configuration check failed. Please fix the issues above.")
        return
    
    print("\n✅ Configuration looks good!")
    
    # Ask if user wants to proceed
    proceed = input("\nProceed with SMS testing? (y/N): ").strip().lower()
    if proceed != 'y':
        print("Test cancelled.")
        return
    
    # Run SMS tests
    await test_sms_functionality()

if __name__ == "__main__":
    asyncio.run(main())