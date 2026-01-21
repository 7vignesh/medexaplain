# MedExplain - Deployment Guide

## Backend Deployment (Render / AWS)

### Option 1: Render Deployment

1. **Create Render Account**
   - Go to [render.com](https://render.com)
   - Sign up with GitHub

2. **Create Web Service**
   - Click "New" → "Web Service"
   - Connect your GitHub repository
   - Configure:
     ```
     Name: medexplain-api
     Environment: Node
     Build Command: cd backend && npm install
     Start Command: cd backend && npm start
     ```

3. **Set Environment Variables**
   Add all variables from `backend/.env.example`:
   - `MONGODB_URI`
   - `OPENAI_API_KEY`
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_PRIVATE_KEY`
   - `FIREBASE_CLIENT_EMAIL`
   - `JWT_SECRET`
   - `ENCRYPTION_KEY`
   - `NODE_ENV=production`
   - `CORS_ORIGIN=https://your-frontend-domain.vercel.app`

4. **Deploy**
   - Click "Create Web Service"
   - Render will automatically build and deploy

### Option 2: AWS EC2 Deployment

1. **Launch EC2 Instance**
   - Ubuntu Server 22.04 LTS
   - t2.micro (free tier) or larger
   - Configure security groups (ports 80, 443, 5000)

2. **SSH into Instance**
   ```bash
   ssh -i your-key.pem ubuntu@your-ec2-ip
   ```

3. **Install Dependencies**
   ```bash
   sudo apt update
   sudo apt install nodejs npm nginx -y
   sudo npm install -g pm2
   ```

4. **Clone & Setup**
   ```bash
   git clone your-repo
   cd medexplain/backend
   npm install
   cp .env.example .env
   # Edit .env with your values
   nano .env
   ```

5. **Start with PM2**
   ```bash
   pm2 start src/index.js --name medexplain-api
   pm2 startup
   pm2 save
   ```

6. **Configure Nginx**
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       location / {
           proxy_pass http://localhost:5000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

## Frontend Deployment (Vercel)

### Vercel Deployment Steps

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy Frontend**
   ```bash
   cd frontend
   vercel --prod
   ```

4. **Set Environment Variables**
   In Vercel Dashboard → Project Settings → Environment Variables:
   ```
   NEXT_PUBLIC_API_URL=https://your-backend-domain.com
   NEXT_PUBLIC_FIREBASE_API_KEY=your-key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
   NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
   ```

5. **Redeploy After Env Variables**
   ```bash
   vercel --prod
   ```

## MongoDB Atlas Setup

1. **Create Account** at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)

2. **Create Cluster**
   - Choose Free Tier (M0)
   - Select region closest to your backend

3. **Create Database User**
   - Database Access → Add New Database User
   - Username/password authentication

4. **Whitelist IP Addresses**
   - Network Access → Add IP Address
   - For development: Allow access from anywhere (0.0.0.0/0)
   - For production: Add specific IPs

5. **Get Connection String**
   - Clusters → Connect → Connect your application
   - Copy connection string
   - Replace `<password>` with your database user password

## Firebase Setup

1. **Create Project** at [console.firebase.google.com](https://console.firebase.google.com)

2. **Enable Authentication**
   - Authentication → Sign-in method
   - Enable Email/Password
   - Enable Google

3. **Get Web App Credentials**
   - Project Settings → General → Your apps
   - Add web app
   - Copy configuration values

4. **Generate Service Account Key** (for backend)
   - Project Settings → Service Accounts
   - Generate new private key
   - Download JSON file
   - Extract values for backend `.env`

## OpenAI API Setup

1. **Create Account** at [platform.openai.com](https://platform.openai.com)

2. **Generate API Key**
   - API Keys → Create new secret key
   - Copy and save securely

3. **Add Billing**
   - Billing → Add payment method
   - Set usage limits to control costs

## Post-Deployment Checklist

- [ ] Backend API is accessible and returns health check
- [ ] Frontend loads and connects to backend
- [ ] Firebase authentication works (email & Google)
- [ ] File upload processes correctly
- [ ] OCR extracts text from images
- [ ] AI explanations generate successfully
- [ ] MongoDB stores data correctly
- [ ] Environment variables are set correctly
- [ ] HTTPS is enabled (use Let's Encrypt for free SSL)
- [ ] CORS is configured properly
- [ ] Rate limiting is active
- [ ] Error logging is set up

## Monitoring & Maintenance

### Backend Monitoring
```bash
# Check PM2 processes
pm2 status

# View logs
pm2 logs medexplain-api

# Restart service
pm2 restart medexplain-api
```

### Database Backups
- MongoDB Atlas automatically backs up clusters
- Configure backup schedule in Atlas dashboard

### Cost Optimization
- MongoDB: Use M0 free tier (512MB storage)
- OpenAI: Set monthly spending limits
- Vercel: Free tier supports hobby projects
- Render/AWS: Use free tier or scale based on usage

## Troubleshooting

### Common Issues

1. **CORS Errors**
   - Check `CORS_ORIGIN` in backend `.env`
   - Ensure it matches frontend domain

2. **Firebase Auth Fails**
   - Verify all Firebase config variables
   - Check authorized domains in Firebase console

3. **MongoDB Connection Timeout**
   - Whitelist correct IP addresses
   - Check connection string format

4. **OpenAI Rate Limits**
   - Implement request throttling
   - Use GPT-3.5-turbo instead of GPT-4 for lower costs

## Security Best Practices

1. **Never commit `.env` files**
2. **Use strong encryption keys** (32+ characters)
3. **Rotate API keys regularly**
4. **Enable 2FA** on all service accounts
5. **Monitor usage** for unusual activity
6. **Keep dependencies updated**
7. **Use HTTPS** for all connections
8. **Implement rate limiting**
9. **Sanitize user inputs**
10. **Log security events**

## Scaling Considerations

### When to Scale

- **Database**: Upgrade from M0 when storage exceeds 512MB
- **Backend**: Add more instances when CPU > 70%
- **Frontend**: Vercel auto-scales
- **AI Processing**: Consider batch processing for large files

### Performance Optimization

1. **Caching**: Implement Redis for frequently accessed data
2. **CDN**: Use Vercel's CDN for static assets
3. **Database Indexing**: Ensure proper indexes on MongoDB
4. **Image Compression**: Compress uploads before processing
5. **Lazy Loading**: Load components on-demand
6. **Code Splitting**: Split frontend bundles
