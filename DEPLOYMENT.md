# Deployment Guide

## 🚀 Deploying AFK Study Buddy to Production

This guide covers deploying your app to Firebase Hosting with production backend.

---

## 📋 Prerequisites

- ✅ Completed [PRODUCTION_SETUP.md](PRODUCTION_SETUP.md)
- ✅ App working locally (`npm run dev`)
- ✅ Firebase project configured
- ✅ Logged into Firebase CLI (`npm run firebase:login`)

**Note**: All commands use `npx` - no global installations required!

---

## 🎯 Deployment Steps

### 1. Build the Next.js App

```bash
npm run build
```

Or directly with npx:
```bash
npx next build
```

This creates an optimized production build in the `.next` folder.

### 2. Export for Static Hosting (if needed)

If you want static export:

```bash
# Add to package.json scripts:
"export": "next build && next export"

# Then run:
npm run export
```

Output will be in the `out` folder.

### 3. Deploy Firestore Rules & Indexes

```bash
npm run firebase:deploy:rules
```

This ensures your security rules and database indexes are up-to-date.

### 4. Deploy Firebase Functions (Optional)

```bash
npm run firebase:deploy:functions
```

**Note**: Functions are optional. The app works with just the client SDK.

### 5. Deploy to Firebase Hosting

```bash
npm run firebase:deploy
```

Or directly with npx:

```bash
npx firebase-tools deploy
```

Or deploy only hosting:

```bash
npx firebase-tools deploy --only hosting
```

---

## 🌐 Your Live App

After deployment, your app will be available at:

```
https://your-project-id.web.app
https://your-project-id.firebaseapp.com
```

---

## 🔧 Deployment Scripts

### Deploy Everything

```bash
npm run firebase:deploy
```

Deploys:
- Firestore rules & indexes
- Firebase Functions
- Firebase Hosting

### Deploy Specific Services

```bash
# Rules & Indexes only
npm run firebase:deploy:rules

# Functions only
npm run firebase:deploy:functions

# Hosting only
npx firebase-tools deploy --only hosting
```

---

## 📊 Post-Deployment

### 1. Verify Deployment

1. Open your live URL
2. Test login with your account
3. Check all pages load correctly
4. Verify data from Firestore displays

### 2. Monitor Usage

Firebase Console → Usage tab:
- Authentication usage
- Firestore reads/writes
- Function invocations
- Hosting bandwidth

### 3. Set Up Custom Domain (Optional)

1. Firebase Console → Hosting
2. Click "Add custom domain"
3. Follow the verification steps
4. Update DNS records

---

## 🔐 Production Checklist

Before going live:

- [ ] Firestore security rules deployed
- [ ] All environment variables set correctly
- [ ] Database seeded with subjects/chapters
- [ ] User accounts created
- [ ] Exam date configured
- [ ] Test login/logout works
- [ ] Test all features (dashboard, subjects, tasks, notes)
- [ ] Check mobile responsiveness
- [ ] Verify no console errors
- [ ] Test on different browsers

---

## 🛠️ Troubleshooting

### Build Fails

```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules
npm install

# Try build again
npm run build
```

### Deployment Fails

```bash
# Check you're logged in
npm run firebase:login

# Verify project ID in .firebaserc
# Make sure it matches your Firebase project

# Try deploying with debug
npx firebase-tools deploy --debug
```

### App Works Locally But Not in Production

- Check `.env.local` variables are correct
- Verify Firestore rules are deployed
- Check browser console for errors
- Ensure Firebase config is correct

### Firestore Permission Denied

- Deploy rules: `npm run firebase:deploy:rules`
- Check rules in Firebase Console
- Verify user is authenticated

---

## 📈 Scaling Considerations

### Free Tier Limits (Spark Plan)

- **Authentication**: 50,000 monthly active users
- **Firestore**: 50,000 reads/20,000 writes per day
- **Functions**: 125,000 invocations per month
- **Hosting**: 10 GB storage, 360 MB/day transfer

### Upgrade to Blaze (Pay-as-you-go)

For production use with more users, upgrade to Blaze plan:
- Firebase Console → Upgrade
- Set budget alerts
- Monitor usage regularly

---

## 🔄 CI/CD (Optional)

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Firebase

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
          projectId: your-project-id
```

---

## 📱 Progressive Web App (Future)

To make it installable:

1. Add `manifest.json`
2. Add service worker
3. Configure in `next.config.js`
4. Deploy

---

## 🎉 You're Live!

Your AFK Study Buddy is now deployed and ready to help dental students ace their exams!

**Share your live URL with users and start tracking study progress!** 🎓✨

---

## 📚 Resources

- [Firebase Hosting Docs](https://firebase.google.com/docs/hosting)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Firebase Console](https://console.firebase.google.com)

