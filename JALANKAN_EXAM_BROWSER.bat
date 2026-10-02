@echo off
title EXAM BROWSER - KIOSK CBT INDONESIA
color 0b
echo ========================================================
echo       MEMULAI EXAM BROWSER ^& CBT SERVER TERKUNCI
echo ========================================================
echo.
echo Sedang memeriksa Node.js...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js belum terinstall! Silakan install Node.js terlebih dahulu.
    pause
    exit /b
)

echo Menjalankan Kiosk Exam Browser...
node start.js
pause
