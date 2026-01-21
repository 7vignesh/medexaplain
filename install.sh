#!/bin/bash

# MedExplain Installation Script
# This script helps set up the MedExplain application

echo "========================================="
echo "  MedExplain - Installation Script"
echo "========================================="
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    echo "Please install Node.js 18+ from https://nodejs.org"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}❌ Node.js version must be 18 or higher${NC}"
    echo "Current version: $(node -v)"
    exit 1
fi

echo -e "${GREEN}✓ Node.js $(node -v) detected${NC}"

# Install Backend Dependencies
echo ""
echo "Installing backend dependencies..."
cd backend
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ package.json not found in backend directory${NC}"
    exit 1
fi

npm install
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Backend dependencies installed${NC}"
else
    echo -e "${RED}❌ Failed to install backend dependencies${NC}"
    exit 1
fi

# Create backend .env if doesn't exist
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo -e "${YELLOW}⚠ Created backend/.env from template${NC}"
    echo -e "${YELLOW}⚠ Please edit backend/.env with your credentials${NC}"
else
    echo -e "${GREEN}✓ Backend .env file exists${NC}"
fi

# Install Frontend Dependencies
echo ""
echo "Installing frontend dependencies..."
cd ../frontend
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ package.json not found in frontend directory${NC}"
    exit 1
fi

npm install
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Frontend dependencies installed${NC}"
else
    echo -e "${RED}❌ Failed to install frontend dependencies${NC}"
    exit 1
fi

# Create frontend .env.local if doesn't exist
if [ ! -f ".env.local" ]; then
    cp .env.local.example .env.local
    echo -e "${YELLOW}⚠ Created frontend/.env.local from template${NC}"
    echo -e "${YELLOW}⚠ Please edit frontend/.env.local with your credentials${NC}"
else
    echo -e "${GREEN}✓ Frontend .env.local file exists${NC}"
fi

cd ..

echo ""
echo "========================================="
echo -e "${GREEN}✓ Installation Complete!${NC}"
echo "========================================="
echo ""
echo "Next steps:"
echo "1. Set up MongoDB Atlas: https://www.mongodb.com/cloud/atlas"
echo "2. Set up Firebase: https://console.firebase.google.com"
echo "3. Get OpenAI API key: https://platform.openai.com"
echo "4. Update backend/.env with your credentials"
echo "5. Update frontend/.env.local with your credentials"
echo ""
echo "To start the application:"
echo "  Backend:  cd backend && npm run dev"
echo "  Frontend: cd frontend && npm run dev"
echo ""
echo "For detailed setup instructions, see SETUP.md"
echo ""
