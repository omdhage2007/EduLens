# EduLens v2 — Firebase Connected

## 🚀 Setup

```bash
npm install
npm run dev
```

## 🔥 Firebase Setup (Required)

1. Go to your [Firebase Console](https://console.firebase.google.com/project/edulens-544ff)
2. Enable **Authentication → Email/Password**
3. Enable **Firestore Database** (start in test mode)
4. Deploy Firestore rules: `firebase deploy --only firestore:rules`

## 👤 Demo Accounts

Login as **Admin/Teacher** first and click **"Seed Demo Data"** on the dashboard. This will:
- Create 12 student records in Firestore
- Generate 7 days of attendance data
- Add 8 assignments per student
- Auto-generate risk alerts

Then use these demo accounts:

| Role    | Email                   | Password   |
|---------|-------------------------|------------|
| Admin   | admin@edulens.com       | admin123   |
| Teacher | teacher@edulens.com     | teach123   |
| Student | student@edulens.com     | student123 |

## 🗂 Firestore Collections

| Collection       | Description                         |
|-----------------|-------------------------------------|
| `users`         | User profiles (role, displayName)   |
| `students`      | Student records with full data      |
| `attendance`    | Per-student per-day attendance      |
| `assignments`   | Student assignments                 |
| `alerts`        | Auto-generated risk alerts          |
| `questionPapers`| Uploaded question papers            |
| `answerSheets`  | Graded answer sheets                |

## ⚡ Features

- **Real-time sync** — all data updates live via Firestore `onSnapshot`
- **Firebase Auth** — login, signup, role-based access
- **Seed Data** — one-click demo data seeding from the teacher dashboard
- **Security Rules** — teachers write, students read their own data
