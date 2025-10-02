# 🚀 Vercel Deployment Guide

This guide will help you deploy your AFK Study Buddy app to Vercel so you can access it from mobile.

## ✅ Prerequisites

- Your code is ready to deploy (all changes committed)
- You have a GitHub account
- Your Firebase backend is already set up

---

## 📤 Step 1: Push Code to GitHub

### If you don't have a GitHub repo yet:

1. Go to **https://github.com/new**
2. Repository name: `ndeb-exam-tracker`
3. Set as **Private** (to keep your project secure)
4. Click **"Create repository"**

### Push your code:

```bash
cd C:\personal\ndeb-exam-tracker

# Initialize git (if not already done)
git init
git add .
git commit -m "Initial commit - ready for Vercel deployment"

# Add GitHub remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/ndeb-exam-tracker.git
git branch -M main
git push -u origin main
```

---

## 🌐 Step 2: Deploy to Vercel

### Option A: Via Vercel Dashboard (Recommended)

1. Go to **https://vercel.com/signup**
2. Click **"Continue with GitHub"**
3. Authorize Vercel to access your GitHub
4. Click **"Add New Project"**
5. Find and import `ndeb-exam-tracker`
6. Vercel will auto-detect Next.js settings ✅
7. **DON'T CLICK DEPLOY YET!** - We need to add environment variables first

---

## 🔐 Step 3: Add Environment Variables

Before deploying, click **"Environment Variables"** and add these:

```
NEXT_PUBLIC_FIREBASE_API_KEY=<your_firebase_api_key>
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=<your_project_id>.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=ndeb-exam-tracker
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=<your_project_id>.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=<your_sender_id>
NEXT_PUBLIC_FIREBASE_APP_ID=<your_app_id>
```

**Where to find these values:**
- Open your local `.env.local` file
- Copy the values (without the quotes)

**Important:** 
- Add these to **Production**, **Preview**, AND **Development** environments
- Click the checkbox for all three

---

## 🎉 Step 4: Deploy!

1. Click **"Deploy"** button
2. Wait 2-3 minutes for build to complete
3. You'll get a URL like: `https://ndeb-exam-tracker.vercel.app`
4. Open it on your mobile! 📱

---

## 🔄 How to Redeploy After Making Changes

### Automatic Deployment (Easiest - Recommended)

Vercel automatically redeploys when you push to GitHub:

```bash
# Make your changes to the code
# Then commit and push:

git add .
git commit -m "Description of your changes"
git push origin main
```

**That's it!** Vercel will automatically:
- Detect the push
- Build your app
- Deploy the new version
- Takes ~2 minutes

You'll get a notification when deployment is complete.

---

### Manual Deployment (If needed)

If you need to force a redeploy:

1. Go to **https://vercel.com/dashboard**
2. Click on your project
3. Go to **Deployments** tab
4. Click **"..."** on latest deployment
5. Click **"Redeploy"**

---

## 🔧 Updating Environment Variables

If you need to change Firebase settings:

1. Go to **https://vercel.com/dashboard**
2. Click on your project
3. Go to **Settings** → **Environment Variables**
4. Edit the variable
5. Click **"Save"**
6. Go to **Deployments** tab
7. Click **"Redeploy"** on the latest deployment

---

## 📱 Accessing on Mobile

### iOS:
1. Open Safari
2. Go to your Vercel URL: `https://your-app.vercel.app`
3. Tap the **Share** button
4. Tap **"Add to Home Screen"**
5. Now it works like an app! 🎉

### Android:
1. Open Chrome
2. Go to your Vercel URL
3. Tap the **Menu** (3 dots)
4. Tap **"Add to Home screen"**
5. Now it works like an app! 🎉

---

## 🐛 Troubleshooting

### Build Fails
- Check the build logs in Vercel dashboard
- Make sure all environment variables are set
- Make sure `package.json` has all dependencies

### App Won't Load
- Check browser console for errors
- Verify Firebase environment variables are correct
- Make sure Firebase project allows your Vercel domain

### Database Not Connecting
1. Go to **Firebase Console** → **Authentication** → **Settings**
2. Add your Vercel domain to **Authorized domains**:
   - `your-app.vercel.app`
   - `your-app-*.vercel.app` (for preview deployments)

---

## 📊 Monitoring Deployments

### View Deployment Status:
- Go to **https://vercel.com/dashboard**
- Click on your project
- See all deployments with status (✅ Ready, 🔄 Building, ❌ Error)

### View Build Logs:
- Click on any deployment
- Click **"Building"** or **"Deployment"**
- See full build logs

### View Analytics:
- Go to **Analytics** tab
- See page views, performance, and errors

---

## 💡 Pro Tips

### Custom Domain (Optional)
Want a custom domain like `study.yourdomain.com`?
1. Go to **Settings** → **Domains**
2. Add your domain
3. Follow DNS setup instructions

### Preview Deployments
Every branch gets a preview URL:
- Create a new branch: `git checkout -b feature-name`
- Push it: `git push origin feature-name`
- Get a preview URL to test before merging to main

### Rollback to Previous Version
If something breaks:
1. Go to **Deployments**
2. Find a working deployment
3. Click **"..."** → **"Promote to Production"**

---

## 🎯 Quick Reference

**Deploy new changes:**
```bash
git add .
git commit -m "Your changes"
git push origin main
```

**Check deployment status:**
https://vercel.com/dashboard

**Your production URL:**
https://your-app.vercel.app

---

## ✅ Checklist

Before deploying:
- [ ] Code is committed to Git
- [ ] Pushed to GitHub
- [ ] Environment variables added in Vercel
- [ ] Firebase allows Vercel domain

After deploying:
- [ ] Test on desktop browser
- [ ] Test on mobile browser
- [ ] Add to home screen
- [ ] Test authentication
- [ ] Test all features

---

## 📞 Need Help?

If you encounter issues:
1. Check Vercel deployment logs
2. Check browser console for errors
3. Verify all environment variables
4. Make sure Firebase settings allow your domain

---

**You're all set! 🎉 Your app will be live and accessible from any device!**

