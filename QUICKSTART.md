# ⚡ Quick Start - AFK Study Buddy

Get up and running in 10 minutes!

## 🎯 What You'll Do

1. Install dependencies
2. Set up Firebase project
3. Configure environment
4. Seed database
5. Create user account
6. Start app

---

## 📋 Step-by-Step

### 1. Install (2 min)

```bash
npm install
cd functions && npm install && cd ..
```

**Note**: All commands use `npx` - no need to install anything globally!

### 2. Firebase Project (3 min)

1. Go to https://console.firebase.google.com
2. Create project: "afk-study-buddy"
3. Enable **Authentication** → Email/Password
4. Create **Firestore Database** (production mode)

### 3. Get Firebase Config (2 min)

1. Project Settings → Your apps → Web
2. Register app
3. Copy the config values

### 4. Create `.env.local` (1 min)

Create this file in project root:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 5. Update `.firebaserc` (30 sec)

Edit `.firebaserc`, replace `your-project-id` with your actual Firebase project ID.

### 6. Firebase Setup (1 min)

```bash
npm run firebase:login
npm run firebase:deploy:rules
```

### 7. Seed Database (1 min)

Download service account key from Firebase Console → Save as `serviceAccountKey.json`

```bash
npm run seed
```

This creates 8 subjects + 102 chapters!

### 8. Create User (1 min)

**In Firebase Console → Authentication:**
- Add user with email/password
- Copy the User UID

**In Firestore Database:**
- Create collection: `users`
- Document ID: (paste UID)
- Add fields:
  ```
  email: "your@email.com"
  name: "Your Name"
  role: "student"
  createdAt: [timestamp]
  ```

### 9. Run! (30 sec)

```bash
npm run dev
```

Open http://localhost:3000 → Login → Done! 🎉

---

## 🎁 What You Get

✅ 8 medical subjects  
✅ 102 chapters (3,464 pages)  
✅ Exam countdown timer  
✅ Progress dashboard  
✅ Task management  
✅ Revision tracking  
✅ Motivational notes  

---

## 🆘 Issues?

**Can't login?**  
→ Check Firebase Auth Email/Password is enabled

**No data?**  
→ Run `npm run seed` again

**Wrong role?**  
→ Firestore document ID must match Auth UID exactly

---

## 📚 Need More Help?

- Full guide: [PRODUCTION_SETUP.md](PRODUCTION_SETUP.md)
- Features: [FEATURES.md](FEATURES.md)
- Architecture: [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md)

---

**You're all set! Happy studying! 🎓**
