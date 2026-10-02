@echo off
title EXAM BROWSER - SERVER ONLINE DARI RUMAH (PJJ)
color 0e
echo ========================================================
echo     MEMULAI SERVER UJIAN ONLINE DARI RUMAH (PJJ)
echo ========================================================
echo.
echo Sedang memeriksa Node.js...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js belum terinstall!
    pause
    exit /b
)

echo Mempersiapkan tunneling internet untuk siswa di rumah...
node online-launcher.js
pause
