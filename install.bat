@echo off
REM MedExplain Installation Script for Windows
REM This script helps set up the MedExplain application

echo =========================================
echo   MedExplain - Installation Script
echo =========================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed
    echo Please install Node.js 18+ from https://nodejs.org
    pause
    exit /b 1
)

echo [OK] Node.js detected
node -v

REM Install Backend Dependencies
echo.
echo Installing backend dependencies...
cd backend
if not exist package.json (
    echo [ERROR] package.json not found in backend directory
    pause
    exit /b 1
)

call npm install
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to install backend dependencies
    pause
    exit /b 1
)
echo [OK] Backend dependencies installed

REM Create backend .env if doesn't exist
if not exist .env (
    copy .env.example .env
    echo [WARNING] Created backend\.env from template
    echo [WARNING] Please edit backend\.env with your credentials
) else (
    echo [OK] Backend .env file exists
)

REM Install Frontend Dependencies
echo.
echo Installing frontend dependencies...
cd ..\frontend
if not exist package.json (
    echo [ERROR] package.json not found in frontend directory
    pause
    exit /b 1
)

call npm install
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to install frontend dependencies
    pause
    exit /b 1
)
echo [OK] Frontend dependencies installed

REM Create frontend .env.local if doesn't exist
if not exist .env.local (
    copy .env.local.example .env.local
    echo [WARNING] Created frontend\.env.local from template
    echo [WARNING] Please edit frontend\.env.local with your credentials
) else (
    echo [OK] Frontend .env.local file exists
)

cd ..

echo.
echo =========================================
echo [OK] Installation Complete!
echo =========================================
echo.
echo Next steps:
echo 1. Set up MongoDB Atlas: https://www.mongodb.com/cloud/atlas
echo 2. Set up Firebase: https://console.firebase.google.com
echo 3. Get OpenAI API key: https://platform.openai.com
echo 4. Update backend\.env with your credentials
echo 5. Update frontend\.env.local with your credentials
echo.
echo To start the application:
echo   Backend:  cd backend ^&^& npm run dev
echo   Frontend: cd frontend ^&^& npm run dev
echo.
echo For detailed setup instructions, see SETUP.md
echo.
pause
