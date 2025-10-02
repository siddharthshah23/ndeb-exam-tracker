# Production Setup Guide - AFK Study Buddy

This guide will help you set up AFK Study Buddy with production Firebase backend while running the frontend locally.

---

## 📋 Prerequisites

- Node.js 18+ installed
- npm installed
- A Firebase account

**Note**: No global installations needed! All tools run via `npx`.

---

## 🚀 Step-by-Step Setup

### 1. Install Dependencies

```bash
npm install
cd functions && npm install && cd ..
```

**Note**: All commands use `npx` - no global installations required!

### 2. Create Firebase Project

1. Go to https://console.firebase.google.com
2. Click "Add Project"
3. Name it: `afk-study-buddy` (or your choice)
4. Disable Google Analytics (optional)
5. Create project

### 3. Enable Firebase Services

#### Enable Authentication:
1. In Firebase Console → **Authentication**
2. Click "Get Started"
3. Click "Email/Password" provider
4. Toggle **Enable**
5. Click "Save"

#### Create Firestore Database:
1. In Firebase Console → **Firestore Database**
2. Click "Create database"
3. Start in **production mode**
4. Choose your nearest location
5. Click "Enable"

### 4. Get Firebase Configuration

1. In Firebase Console → Project Settings (gear icon)
2. Scroll to "Your apps" section
3. Click the web icon `</>`
4. Register app nickname: "AFK Study Buddy Web"
5. **Don't** check Firebase Hosting
6. Click "Register app"
7. **Copy the firebaseConfig object**

### 5. Create Environment File

Create `.env.local` in project root:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIza...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-app.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-app.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
```

Paste your values from step 4.

### 6. Update Firebase Project ID

Edit `.firebaserc`:
```json
{
  "projects": {
    "default": "your-actual-project-id"
  }
}
```

### 7. Firebase CLI Login

```bash
npm run firebase:login
```

This opens your browser for authentication.

### 8. Deploy Firestore Rules & Indexes

```bash
npm run firebase:deploy:rules
```

This deploys security rules and database indexes to production.

### 9. Seed Database with Subjects & Chapters

#### Get Service Account Key:
1. Firebase Console → Project Settings → Service Accounts
2. Click "Generate New Private Key"
3. Save as `serviceAccountKey.json` in project root

#### Run Seed Script:
```bash
npm run seed
```

This creates:
- 8 subjects (Pharmacology, Pathology, Physiology, etc.)
- 102 chapters with page counts
- Exam date (6 months from now)

### 10. Create Your User Account

#### In Firebase Console → Authentication:
1. Click "Add user"
2. Enter email: `your@email.com`
3. Enter password (min 6 characters)
4. Click "Add user"
5. **Copy the User UID** (important!)

#### In Firebase Console → Firestore Database:
1. Click "Start collection"
2. Collection ID: `users`
3. Document ID: **Paste the User UID from above**
4. Add fields:
   - `email` (string): `your@email.com`
   - `name` (string): `Your Name`
   - `role` (string): `student` or `partner`
   - `createdAt` (timestamp): Click to set current time
5. Click "Save"

**IMPORTANT**: The Firestore document ID MUST match the Authentication UID exactly!

### 11. Run the App

```bash
npm run dev
```

Open http://localhost:3000

### 12. Login & Start Studying!

1. Go to http://localhost:3000/login
2. Enter your email and password
3. Click "Sign In"
4. Start tracking your progress! 🎉

---

## 📊 What You Get

- ✅ 8 Medical subjects
- ✅ 102 Chapters (3,464 total pages)
- ✅ Exam countdown timer
- ✅ Progress tracking dashboard
- ✅ Task management
- ✅ 3 revision cycles per chapter
- ✅ Motivational notes system

---

## 🔧 Optional: Deploy Functions

If you want to use Cloud Functions (optional for MVP):

```bash
npm run firebase:deploy:functions
```

**Note**: The app works fine without deploying functions. All core functionality uses the Firebase client SDK.

---

## 🔐 Managing Users

### Add Another User:

Repeat step 10 for each new user (student or partner).

### Update User Role:

1. Firebase Console → Firestore Database
2. Navigate to `users/{uid}`
3. Edit the `role` field
4. Change to `student` or `partner`
5. User must sign out and sign in again

---

## 🐛 Troubleshooting

### Can't Login?
- Verify Email/Password authentication is enabled in Firebase Console
- Check `.env.local` has correct Firebase config
- Ensure password is at least 6 characters

### Shows Wrong Role?
- Check Firestore document ID matches Authentication UID
- Verify `role` field is lowercase (`student` or `partner`)
- Sign out and sign in again

### No Data Showing?
- Verify seed script ran successfully (`npm run seed`)
- Check Firebase Console → Firestore for collections: `subjects`, `chapters`, `config`
- Ensure Firestore rules are deployed

### Build Errors?
- Delete `.next` folder: `rm -rf .next` (or `rmdir /s .next` on Windows)
- Reinstall dependencies: `npm install`
- Restart dev server

---

## 📝 Project Structure

```
Frontend (Local):
  - Next.js app running on http://localhost:3000
  - Uses React, TypeScript, TailwindCSS
  
Backend (Production Firebase):
  - Authentication: Firebase Auth
  - Database: Cloud Firestore
  - Functions: Firebase Functions (optional)
  - Hosting: Firebase Hosting (for deployment)
```

---

## 🚀 Deploying to Production

When ready to deploy the frontend to Firebase Hosting:

```bash
# Build the Next.js app
npm run build

# Deploy to Firebase
npm run firebase:deploy
```

Your app will be live at `https://your-project-id.web.app`

---

## 📚 Next Steps

1. ✅ Create your student account
2. ✅ Explore the dashboard
3. ✅ Add some study tasks
4. ✅ Mark pages as completed
5. ✅ Track your revision cycles
6. ✅ Add motivational notes (if you're a partner)
7. ✅ Customize exam date in Firestore

---

## 💡 Tips

- **Update Exam Date**: Edit `config/exam` document in Firestore
- **Add More Subjects**: Add documents to `subjects` collection
- **Backup Data**: Use Firestore export feature in console
- **Monitor Usage**: Check Firebase Console → Usage tab

---

**Good luck with your AFK exam preparation! 🎓✨**

