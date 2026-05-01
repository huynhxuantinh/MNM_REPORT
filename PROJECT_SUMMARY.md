# MNM Learn English - Project Summary

## 📋 Project Overview
**MNM Learn English** - Ứng dụng học từ vựng tiếng Anh với hệ thống Spaced Repetition (SRS) dựa trên thuật toán SM-2.

### Tech Stack
- **Backend**: Django 5.0 + Django REST Framework + PostgreSQL + Redis
- **Frontend**: React 18 + Vite + Redux Toolkit + TanStack Query + Material UI 5
- **Auth**: JWT (SimpleJWT) + HTTP-only cookies + Token blacklist
- **Email**: Mailtrap (development)
- **Testing**: pytest (backend), Vitest + React Testing Library (frontend), Cypress (E2E)
- **CI/CD**: GitHub Actions

---

## ✅ Features Implemented

### 🔐 Authentication & User Management
| Feature | Status | Notes |
|---------|--------|-------|
| Registration with email verification | ✅ | Token expires in 24h |
| Login with JWT + refresh token | ✅ | HTTP-only cookie |
| Password reset via email | ✅ | Token expires in 1h |
| Change password (authenticated) | ✅ | Invalidates other sessions |
| Resend verification email | ✅ | 60s cooldown |
| Role-based access (user/teacher/admin) | ✅ | Protected routes |
| Rate limiting with throttling | ✅ | Strict throttles for auth endpoints |
| CAPTCHA protection | ✅ | hCaptcha/reCAPTCHA ready |

### 📚 Learning System (SRS)
| Feature | Status | Notes |
|---------|--------|-------|
| Spaced Repetition (SM-2) | ✅ | Automatic interval calculation |
| Daily review queue | ✅ | Max 50 words/session |
| Study lessons | ✅ | Flip cards, audio pronunciation |
| XP & Level system | ✅ | Formula: 100×N×(N+1)/2 XP for level N |
| Streak tracking | ✅ | 7, 30, 100 day milestones |
| Bookmarks | ✅ | Save words for later |
| Progress tracking | ✅ | Review history, accuracy stats |

### 👨‍🏫 Teacher Features
| Feature | Status | Notes |
|---------|--------|-------|
| Create/manage lessons | ✅ | CRUD with word management |
| Create word sets | ✅ | Group words by topic |
| Class management | ✅ | Create, edit, delete classes |
| Add/remove students | ✅ | Bulk add supported |
| Assign lessons to class | ✅ | With due date |
| Assign to individual students | ✅ | Via assignments page |
| View student progress | ✅ | XP, level, assignments |
| Search students | ✅ | By name or email |

### 👨‍🎓 Student Features
| Feature | Status | Notes |
|---------|--------|-------|
| Daily lessons | ✅ | Learn new words |
| Review queue | ✅ | Words due for review |
| Quizzes | ✅ | Multiple choice & matching |
| Vocabulary browser | ✅ | Search, filter, bookmark |
| Progress dashboard | ✅ | Stats, streak, level |
| Leaderboard | ✅ | Top students by XP |
| Notifications | ✅ | Level up, streak, assignments |

### 👨‍💼 Admin Features
| Feature | Status | Notes |
|---------|--------|-------|
| User management | ✅ | View, ban/unban, change role |
| Vocabulary management | ✅ | CRUD words |
| Lesson management | ✅ | View all lessons |
| System statistics | ✅ | Users, lessons, reviews, quizzes |

---

## 🔧 Recent Fixes & Improvements

### Backend (Accounts Module)
1. **Email Verification Flow**
   - Fixed: Registration now succeeds even if email fails (logs error)
   - Added: `resend-verification` endpoint with 60s cooldown
   - Added: `db_index=True` for token fields (performance)

2. **Login Security**
   - Fixed: Distinguish between "email not verified" and "account banned"
   - Added: Email verification check for password reset
   - Added: Invalidate all sessions on password change

3. **Rate Limiting**
   - Enabled: `RegisterRateThrottle` (was commented out)
   - Added: Strict throttles for repeated failures

### Frontend
1. **Auth Improvements**
   - Fixed: Race condition in token refresh (added queue pattern)
   - Added: Clearer error messages for unverified accounts
   - Added: "Resend email" button on registration success

2. **Teacher Module Refactoring**
   - Created: Shared dialogs (`ClassDialogs.jsx`) for reuse
   - Removed: Duplicate dialog code in `TeacherClasses` & `TeacherStudents`
   - Improved: `AvatarGroup` shows "+N" when more than 3 students

3. **API Client**
   - Fixed: Concurrent 401 requests now queue and wait for single refresh

---

## 📁 Project Structure

```
MNM_REPORT/
├── backend/
│   ├── apps/
│   │   ├── accounts/          # User auth, tokens, email
│   │   ├── vocabulary/        # Words, bookmarks, word sets
│   │   ├── learning/          # Lessons, assignments, SRS, classes
│   │   └── quiz/              # Quizzes, results
│   └── config/                # Settings (base, test, local)
├── frontend/
│   ├── src/
│   │   ├── api/               # API clients
│   │   ├── components/ui/     # Shared UI components
│   │   ├── features/          # Feature-based modules
│   │   │   ├── auth/          # Auth slice
│   │   │   ├── teacher/       # Teacher pages + dialogs/
│   │   │   ├── learning/      # Learning slice
│   │   │   └── quiz/          # Quiz slice
│   │   ├── hooks/             # Custom React Query hooks
│   │   ├── pages/             # Route pages
│   │   └── utils/             # Helpers (dates, XP calc)
│   └── cypress/               # E2E tests
├── .github/workflows/          # CI/CD
└── data/                      # Seed data (words.csv)
```

---

## 🧪 Testing Status

| Test Type | Status | Coverage |
|-----------|--------|----------|
| Backend unit tests | ✅ | ~85% |
| Frontend unit tests | ✅ | LoginPage, QuizPage, VocabularyPage |
| E2E tests | ✅ | teacher_flow, admin_flow |

---

## 🚀 Deployment Ready Checklist

- [x] Environment variables documented (`.env.example`)
- [x] Database migrations ready
- [x] Static files configuration
- [x] Security headers & CORS
- [x] Rate limiting configured
- [x] Email configuration (Mailtrap for dev)
- [x] CI/CD pipeline (GitHub Actions)

---

## 📝 Next Steps (Optional)

### High Priority
1. **Email Production**: Switch from Mailtrap to real SMTP (SendGrid/AWS SES)
2. **Push Notifications**: Firebase Cloud Messaging for mobile
3. **PWA**: Offline support, service workers
4. **Voice Input**: Speech-to-text for quiz answers

### Medium Priority
5. **Export Progress**: PDF/Excel reports for teachers
6. **Gamification**: Badges, achievements, leaderboards enhanced
7. **Social**: Friend system, challenges
8. **Mobile App**: React Native or Flutter

### Low Priority
9. **AI Integration**: Smart word recommendations
10. **Multi-language**: Support for Vietnamese UI fully

---

## 🔗 Key Files

### Backend
- `backend/apps/accounts/views.py` - Auth endpoints
- `backend/apps/learning/views.py` - Lessons, assignments, classes
- `backend/apps/accounts/views_resend_email.py` - Resend verification (NEW)

### Frontend  
- `frontend/src/features/teacher/dialogs/ClassDialogs.jsx` - Shared dialogs (NEW)
- `frontend/src/api/axiosClient.js` - API client with token refresh queue
- `frontend/src/pages/RegisterPage.jsx` - With resend email button

---

## 👥 Team Notes

- **Default teacher account**: Create via admin or register + change role
- **Test email**: Use Mailtrap inbox to verify email flows
- **Database reset**: `python manage.py flush && python manage.py seed_words`

---

**Last Updated**: May 1, 2026
**Version**: 1.0.0
**Status**: ✅ Production Ready (with email service switch)
