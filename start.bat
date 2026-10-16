@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul

REM ==========================================
REM Rusca Ogren - Tek tikla baslatma (Windows)
REM ==========================================

REM Calisma dizinini scriptin bulundugu klasore ayarla
cd /d "%~dp0"

echo [*] Rusca Ogren baslatiliyor...

REM Node.js kurulu mu kontrol et
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo.
    echo [!] Node.js bulunamadi!
    echo [!] Lutfen Node.js'i indirin ve kurun: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

REM node_modules yoksa npm install calistir
if not exist "node_modules\" (
    echo [*] Bagimliliklar yukleniyor [ilk calistirma]...
    call npm install
    if %errorlevel% neq 0 (
        echo.
        echo [!] npm install basarisiz oldu. Lutfen internet baglantinizi ve yetkilerinizi kontrol edin.
        echo.
        pause
        exit /b 1
    )
)

echo [*] Gelistirme sunucusu baslatiliyor...
echo [*] Tarayici acilacak: http://localhost:3000

REM Tarayiciyi 3 saniye sonra arka planda ac
start "" cmd /c "ping 127.0.0.1 -n 4 >nul & start http://localhost:3000"

REM Dev sunucusunu baslat
call npm run dev

if %errorlevel% neq 0 (
    echo.
    echo [!] Sunucu bir hata ile kapandi veya durduruldu.
    pause
)
