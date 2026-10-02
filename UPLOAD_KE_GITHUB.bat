@echo off
title Upload Otomatis ke GitHub - EXAM BROWSER
color 0a
echo ========================================================
echo          UPLOAD OTOMATIS PROYEK KE GITHUB
echo ========================================================
echo.
echo Pastikan Anda sudah membuat Repository Baru di:
echo https://github.com/new
echo.
set /p REPO_URL="Masukkan Link Repository GitHub Anda (contoh https://github.com/username/exam-browser.git): "

if "%REPO_URL%"=="" (
    echo [ERROR] Link repository tidak boleh kosong!
    pause
    exit /b
)

echo.
echo [1/5] Menginisialisasi Git...
git init

echo [2/5] Menambahkan file proyek...
git add .

echo [3/5] Membuat commit...
git commit -m "Initial commit Exam Browser CBT"

echo [4/5] Mengatur branch main dan remote...
git branch -M main
git remote remove origin >nul 2>&1
git remote add origin %REPO_URL%

echo [5/5] Mengunggah (push) ke GitHub...
echo (Jika muncul jendela browser untuk Login ke GitHub, silakan klik tombol Sign In/Authorize)
git push -u origin main

if %errorlevel% equ 0 (
    echo.
    echo ========================================================
    echo [SUKSES] Seluruh file proyek BERHASIL diunggah ke GitHub!
    echo Sekarang Anda bisa kembali ke Render.com dan menghubungkan repo ini.
    echo ========================================================
) else (
    echo.
    echo [PERHATIAN] Terjadi kendala saat push. Pastikan link repository benar dan Anda sudah login ke GitHub.
)

echo.
pause
