# MedExplain - Explainable Health Report AI

A full-stack web application that allows users to upload medical reports (PDF or image), extract parameters using OCR, interpret them using AI/NLP, and visualize results in a clean dashboard.

## 🚀 Tech Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Styling**: TailwindCSS
- **Language**: TypeScript
- **Charts**: Chart.js & Recharts
- **OCR**: Tesseract.js
- **Authentication**: Firebase Auth

### Backend
- **Runtime**: Node.js
- **Framework**: Express
- **Database**: MongoDB Atlas
- **AI/NLP**: LangChain + OpenAI API
- **File Processing**: Multer, PDF-parse

### Deployment
- **Frontend**: Vercel
- **Backend**: Render / AWS

## 📁 Project Structure

```
medexplain/
├── frontend/                 # Next.js application
│   ├── src/
│   │   ├── app/             # App router pages
│   │   ├── components/      # React components
│   │   ├── lib/             # Utilities and configs
│   │   ├── types/           # TypeScript types
│   │   └── hooks/           # Custom React hooks
│   ├── public/              # Static assets
│   └── package.json
│
├── backend/                 # Express server
│   ├── src/
│   │   ├── controllers/     # Route controllers
│   │   ├── models/          # MongoDB models
│   │   ├── routes/          # API routes
│   │   ├── middleware/      # Auth & validation
│   │   ├── services/        # Business logic
│   │   ├── utils/           # Helper functions
│   │   └── config/          # Configuration files
│   ├── data/                # Medical parameters dictionary
│   └── package.json
│
└── README.md
```

## 🔧 Setup Instructions

### Prerequisites
- Node.js 18+
- MongoDB Atlas account
- Firebase project
- OpenAI API key

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
npm install
```

2. Create `.env` file:
```env
PORT=5000
MONGODB_URI=your_mongodb_atlas_uri
OPENAI_API_KEY=your_openai_api_key
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_PRIVATE_KEY=your_firebase_private_key
FIREBASE_CLIENT_EMAIL=your_firebase_client_email
JWT_SECRET=your_jwt_secret
ENCRYPTION_KEY=your_encryption_key
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
```

3. Start the server:
```bash
npm run dev
```

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
npm install
```

2. Create `.env.local` file:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id
```

3. Start the development server:
```bash
npm run dev
```

## ✨ Core Features

### 1. User Authentication
- Email/password signup and login
- Google OAuth integration
- Secure session management with Firebase

### 2. File Upload & OCR Processing
- Upload PDF or image medical reports
- Tesseract.js extracts text from documents
- Intelligent parameter parsing and detection

### 3. AI-Powered Explanations
- LangChain + OpenAI integration
- Plain-language explanations of medical parameters
- Context-aware health insights

### 4. Interactive Dashboard
- Card-based UI with parameter details
- Color-coded indicators (normal/high/critical)
- Trend visualization with Chart.js/Recharts
- Historical data tracking

### 5. Report History
- View all previously uploaded reports
- Compare values over time
- Export summarized reports as PDF

### 6. Security & Privacy
- End-to-end data encryption
- Secure API authentication
- Medical disclaimer compliance

## 🎨 UI Design

- Clean, minimal design with white background
- Light green/blue accent colors
- Fully responsive layout
- Loading states for async operations
- Smooth transitions and animations

## 🔒 Security Features

- All user data encrypted before storage
- Environment variables for sensitive data
- Firebase authentication tokens
- Input validation and sanitization
- Rate limiting on API endpoints

## ⚠️ Disclaimer

**This application does not provide medical advice, diagnosis, or treatment. Always consult with qualified healthcare professionals for medical decisions.**

## 📄 License

MIT License

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Support

For issues and questions, please open an issue on GitHub.
