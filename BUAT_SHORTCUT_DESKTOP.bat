@echo off
title Buat Shortcut Desktop - EXAM BROWSER
color 0a
echo ========================================================
echo       MEMBUAT SHORTCUT DESKTOP EXAM BROWSER
echo ========================================================
echo.

set "SCRIPT_DIR=%~dp0"
set "TARGET_BAT=%SCRIPT_DIR%JALANKAN_EXAM_BROWSER.bat"
set "DESKTOP_DIR=%USERPROFILE%\Desktop"
set "SHORTCUT_PATH=%DESKTOP_DIR%\EXAM BROWSER.lnk"

echo Membuat shortcut ke Desktop...
powershell -NoProfile -Command "$WshShell = New-Object -ComObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%SHORTCUT_PATH%'); $Shortcut.TargetPath = '%TARGET_BAT%'; $Shortcut.WorkingDirectory = '%SCRIPT_DIR%'; $Shortcut.WindowStyle = 1; $Shortcut.Description = 'Aplikasi Exam Browser dan CBT Terpadu'; $Shortcut.Save();"

if exist "%SHORTCUT_PATH%" (
    echo.
    echo [BERHASIL] Shortcut "EXAM BROWSER" telah berhasil dibuat di Desktop!
    echo Lokasi: %SHORTCUT_PATH%
    echo Anda kini dapat membuka Exam Browser langsung dari Desktop.
) else (
    echo.
    echo [INFO] Jika shortcut belum muncul otomatis, Anda dapat:
    echo 1. Klik kanan pada file 'JALANKAN_EXAM_BROWSER.bat'
    echo 2. Pilih 'Send to' ^> 'Desktop (create shortcut)'
)

echo.
pause
