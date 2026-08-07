@echo off
title Cloud Cost Dashboard - Backend
echo ====================================================
echo Starting Backend (FastAPI on http://localhost:8000)...
echo ====================================================
cd /d "%~dp0backend"

if exist .venv\Scripts\python.exe (
    .\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000
) else (
    echo Python virtual environment not found. Setting up...
    py -m venv .venv
    .\.venv\Scripts\pip install -r requirements.txt
    .\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000
)
pause
