# AFK Study Buddy 📚

A production-ready web application for dental students preparing for the AFK exam. Track subjects, chapters, page progress, revision cycles, and exam countdown with a beautiful modern interface.

## 🎯 Features

- **Authentication**: Secure email/password login with Firebase Auth
- **8 AFK Subjects**: Pharmacology, Pathology, Physiology, Microbiology, Anatomy, Biochemistry, Dental Materials, Oral Pathology
- **102 Chapters**: Pre-seeded with realistic page counts (3,464 total pages)
- **Progress Tracking**: Visual dashboards, charts, and progress bars
- **Revision Cycles**: Track 3 revision cycles per chapter
- **Task Management**: Create tasks by chapter or page count
- **Exam Countdown**: Prominent countdown timer to your exam date
- **Motivational System**: Random quotes and partner notes
- **Responsive Design**: Works on desktop, tablet, and mobile

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm (comes with Node.js)
- Firebase account

**Note**: No global installations required! All commands use `npx`.

### Installation

```bash
# 1. Install dependencies
npm install
cd functions && npm install && cd ..

# 2. Create .env.local with your Firebase config
# (See PRODUCTION_SETUP.md for details)

# 3. Login to Firebase
npm run firebase:login

# 4. Deploy Firestore rules
npm run firebase:deploy:rules

# 5. Seed database
npm run seed

# 6. Run the app
npm run dev
```

Open http://localhost:3000

📖 **For detailed setup instructions, see [PRODUCTION_SETUP.md](PRODUCTION_SETUP.md)**

## 📊 Tech Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **Charts**: Recharts
- **Icons**: Lucide React

### Backend (Production Firebase)
- **Authentication**: Firebase Authentication
- **Database**: Cloud Firestore
- **Functions**: Firebase Cloud Functions (optional)
- **Hosting**: Firebase Hosting

## 📁 Project Structure

```
afk-study-buddy/
├── app/                    # Next.js pages
│   ├── dashboard/         # Main dashboard
│   ├── subjects/          # Subjects & chapters
│   ├── tasks/             # Task management
│   ├── notes/             # Motivational notes
│   └── login/             # Authentication
├── components/            # Reusable components
├── contexts/              # React contexts (Auth)
├── lib/                   # Firebase, utilities, types
├── functions/             # Firebase Cloud Functions
└── scripts/               # Database seeding scripts
```

## 📝 Available Scripts

```bash
npm run dev              # Start development server
npm run build            # Build for production
npm run start            # Start production server
npm run seed             # Seed database with subjects/chapters
npm run firebase:login   # Login to Firebase
npm run firebase:deploy  # Deploy everything to Firebase
npm run firebase:deploy:rules     # Deploy Firestore rules only
npm run firebase:deploy:functions # Deploy functions only
```

## 🗄️ Database Collections

### Firestore Structure

```
users/{uid}
├─ email: string
├─ name: string
├─ role: "student" | "partner"
└─ createdAt: timestamp

subjects/{subjectId}
├─ name: string
├─ totalChapters: number
└─ createdAt: timestamp

chapters/{chapterId}
├─ subjectId: string
├─ name: string
├─ totalPages: number
├─ completedPages: number
└─ revisionsCompleted: 0-3

tasks/{taskId}
├─ title: string
├─ subjectId: string
├─ chapterId?: string
├─ pages?: number
├─ completed: boolean
├─ userId: string
└─ createdAt: timestamp

notes/{noteId}
├─ text: string
├─ fromUser: string
├─ fromUserName: string
└─ createdAt: timestamp

config/exam
└─ date: timestamp
```

## 🎓 Seeded Subjects

1. **Pharmacology** - 12 chapters, 404 pages
2. **Pathology** - 15 chapters, 608 pages
3. **Physiology** - 10 chapters, 440 pages
4. **Microbiology** - 14 chapters, 455 pages
5. **Anatomy** - 11 chapters, 418 pages
6. **Biochemistry** - 9 chapters, 348 pages
7. **Dental Materials** - 8 chapters, 280 pages
8. **Oral Pathology** - 13 chapters, 511 pages

**Total**: 102 chapters, 3,464 pages

## 🔐 User Management

### Creating Users

Users must be created in Firebase Console:

1. **Authentication**: Add user with email/password
2. **Firestore**: Create user document with matching UID

**Roles**:
- `student`: Main user who tracks progress
- `partner`: Can add motivational notes

See [PRODUCTION_SETUP.md](PRODUCTION_SETUP.md) for detailed instructions.

## 🎨 Features Overview

### Dashboard
- Exam countdown (days remaining)
- Overall progress percentage
- Total revision cycles completed
- Subject progress bar chart
- Subject breakdown table

### Subjects & Chapters
- Grid view of all subjects with progress
- Detailed chapter view with page tracking
- Interactive page counters (+/- 1, +/- 10)
- 3 sequential revision cycles per chapter
- Completion status indicators

### Task Management
- Create tasks by chapter or page count
- Mark tasks complete/incomplete
- Separate pending and completed sections
- Delete tasks
- Auto-generated titles

### Motivational Notes
- Random motivational quotes
- Partner-created custom notes
- Beautiful gradient card design
- Timestamp and author display

## 🚀 Deployment

### Deploy to Firebase Hosting

```bash
# Build the app
npm run build

# Deploy
npm run firebase:deploy
```

Your app will be live at: `https://your-project-id.web.app`

### Deploy Functions Only

```bash
npm run firebase:deploy:functions
```

### Deploy Rules Only

```bash
npm run firebase:deploy:rules
```

## 🔒 Security

- Firestore security rules enforce data access control
- Users can only access their own tasks
- Notes deletable only by creator
- All queries require authentication

## 🐛 Troubleshooting

### Can't Login?
- Check Firebase Auth Email/Password is enabled
- Verify `.env.local` has correct config
- Ensure user document exists in Firestore with matching UID

### No Data?
- Run `npm run seed` to populate database
- Check Firebase Console → Firestore for data
- Verify Firestore rules are deployed

### Build Errors?
- Delete `.next`: `rm -rf .next`
- Reinstall: `npm install`
- Check Node.js version: `node --version` (18+)

## 📚 Documentation

- [PRODUCTION_SETUP.md](PRODUCTION_SETUP.md) - Detailed setup guide
- [FEATURES.md](FEATURES.md) - Complete feature list
- [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) - Code architecture
- [QUICKSTART.md](QUICKSTART.md) - 10-minute setup

## 🎯 Development Workflow

```bash
# 1. Make changes to code
# 2. Test locally with npm run dev
# 3. Deploy rules: npm run firebase:deploy:rules
# 4. Deploy functions: npm run firebase:deploy:functions
# 5. Deploy hosting: npm run firebase:deploy
```

## 💡 Tips

- **Update Exam Date**: Edit `config/exam` in Firestore Console
- **Add Subjects**: Add documents to `subjects` collection
- **Monitor Usage**: Check Firebase Console Usage tab
- **Backup Data**: Use Firestore export feature

## 📄 License

Created for educational purposes - AFK Exam Preparation

## 🤝 Support

For issues or questions:
- Check [PRODUCTION_SETUP.md](PRODUCTION_SETUP.md) for setup help
- Review [Firebase documentation](https://firebase.google.com/docs)
- Check [Next.js documentation](https://nextjs.org/docs)

---

**Built with ❤️ for dental students preparing for the AFK exam**

**Good luck with your studies! 🎓✨**
