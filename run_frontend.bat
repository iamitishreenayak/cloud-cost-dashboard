@echo off
title Cloud Cost Dashboard - Frontend
echo ====================================================
echo Starting Frontend (Vite + React on http://localhost:5173)...
echo ====================================================
cd /d "%~dp0frontend"

if not exist node_modules (
    echo Installing dependencies...
    npm install
)

npm run dev
pause
