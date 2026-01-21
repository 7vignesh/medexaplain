# MedExplain - Setup Guide

## Prerequisites

- Node.js 18+ installed
- MongoDB Atlas account (free tier available)
- Firebase project created
- OpenAI API key
- Git installed

## Quick Start

### 1. Clone or Navigate to Project

```bash
cd c:\Users\vigne\Desktop\projects\medexplain
```

### 2. Backend Setup

```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Create environment file
copy .env.example .env

# Edit .env file with your credentials
notepad .env
```

**Required Environment Variables:**

```env
PORT=5000
MONGODB_URI=
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxx
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=
JWT_SECRET=your-super-secret-jwt-key-min-32-characters
ENCRYPTION_KEY=your-32-character-encryption-key-here
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
```

**Start Backend:**

```bash
npm run dev
```

Backend will run on http://localhost:5000

### 3. Frontend Setup

Open a new terminal:

```bash
# Navigate to frontend
cd c:\Users\vigne\Desktop\projects\medexplain\frontend

# Install dependencies
npm install

# Create environment file
copy .env.local.example .env.local

# Edit .env.local with your credentials
notepad .env.local
```

**Required Environment Variables:**

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXX
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef123456
```

**Start Frontend:**

```bash
npm run dev
```

Frontend will run on http://localhost:3000

## Service Setup Guides

### MongoDB Atlas

1. Go to https://www.mongodb.com/cloud/atlas
2. Create free account
3. Create new cluster (M0 Free tier)
4. Database Access → Add New User (save credentials)
5. Network Access → Add IP (0.0.0.0/0 for development)
6. Connect → Connect your application → Copy connection string
7. Replace `<password>` in connection string

### Firebase

1. Go to https://console.firebase.google.com
2. Create new project
3. **Enable Authentication:**
   - Authentication → Get Started
   - Sign-in method → Enable "Email/Password"
   - Sign-in method → Enable "Google"
4. **Get Web Config:**
   - Project Settings → General
   - Scroll to "Your apps" → Web app
   - Copy config values to frontend `.env.local`
5. **Generate Service Account (for backend):**
   - Project Settings → Service Accounts
   - Generate new private key → Download JSON
   - Extract `project_id`, `private_key`, `client_email` to backend `.env`
6. **Authorized Domains:**
   - Authentication → Settings → Authorized domains
   - Add `localhost` for development
   - Add your production domain later

### OpenAI API

1. Go to https://platform.openai.com
2. Sign up / Login
3. API Keys → Create new secret key
4. Copy key to backend `.env`
5. Billing → Add payment method
6. Set usage limits (recommended: $10/month for testing)

## Verify Installation

### Test Backend

```bash
# In backend directory
curl http://localhost:5000/health
```

Should return:
```json
{
  "status": "OK",
  "message": "MedExplain API is running",
  "timestamp": "..."
}
```

### Test Frontend

1. Open http://localhost:3000
2. Click "Sign up"
3. Create an account
4. You should be redirected to dashboard

## Common Issues

### Backend won't start

**Error: MongoDB connection failed**
- Check `MONGODB_URI` is correct
- Verify IP is whitelisted in MongoDB Atlas
- Check username/password

**Error: Firebase initialization failed**
- Verify all Firebase environment variables
- Check `FIREBASE_PRIVATE_KEY` has proper line breaks (`\n`)
- Ensure service account JSON is correct

### Frontend won't start

**Error: Cannot find module**
```bash
# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

**Build errors**
```bash
# Clear Next.js cache
rm -rf .next
npm run dev
```

### Authentication Issues

**Sign up fails**
- Check Firebase console → Authentication is enabled
- Verify all `NEXT_PUBLIC_FIREBASE_*` variables in `.env.local`
- Check browser console for specific errors

**API requests fail (401 Unauthorized)**
- Check backend is running
- Verify `NEXT_PUBLIC_API_URL` in frontend `.env.local`
- Check CORS settings in backend

## Development Workflow

### Making Changes

**Backend changes:**
- Edit files in `backend/src`
- Server auto-restarts (nodemon)
- Check terminal for errors

**Frontend changes:**
- Edit files in `frontend/src`
- Browser auto-refreshes
- Check browser console for errors

### Testing File Upload

1. Login to application
2. Navigate to Dashboard
3. Click "Upload Report" or drag & drop
4. Use sample medical reports (PDF or images)
5. Check processing status
6. View results when completed

### Viewing Logs

**Backend logs:**
- Terminal running `npm run dev`
- MongoDB Atlas → Clusters → Metrics

**Frontend logs:**
- Browser Developer Console (F12)
- Terminal running `npm run dev`

## Project Structure

```
medexplain/
├── backend/
│   ├── src/
│   │   ├── config/      # Database, Firebase, LangChain setup
│   │   ├── controllers/ # Request handlers
│   │   ├── middleware/  # Auth, error handling, rate limiting
│   │   ├── models/      # MongoDB schemas
│   │   ├── routes/      # API endpoints
│   │   ├── services/    # Business logic
│   │   └── utils/       # Helper functions
│   ├── data/           # Medical parameters dictionary
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── app/        # Next.js pages
│   │   ├── components/ # React components
│   │   ├── lib/        # API client, Firebase config
│   │   └── types/      # TypeScript types
│   └── package.json
└── README.md
```

## Next Steps

1. **Explore the Dashboard** - Upload a test medical report
2. **Check AI Processing** - View parameter explanations
3. **Try Visualization** - See parameter trends over time
4. **Customize** - Modify components and styling
5. **Deploy** - See DEPLOYMENT.md for production setup

## Getting Help

- Check browser console for frontend errors
- Check terminal for backend errors
- Review error messages carefully
- Ensure all environment variables are set
- Verify all services (MongoDB, Firebase, OpenAI) are configured

## Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [MongoDB Atlas Docs](https://docs.atlas.mongodb.com/)
- [Firebase Docs](https://firebase.google.com/docs)
- [OpenAI API Reference](https://platform.openai.com/docs)
- [LangChain Docs](https://js.langchain.com/docs/)
