@echo off
REM ==========================================
REM Rusca Ogren - Tek tikla baslatma (Windows)
REM ==========================================

echo [*] Rusca Ogren baslatiliyor...

REM node_modules yoksa npm install calistir
if not exist "node_modules\" (
    echo [*] Bagimliliklar yukleniyor (ilk calistirma)...
    npm install
    if errorlevel 1 (
        echo [!] npm install basarisiz. Node.js kurulu mu?
        pause
        exit /b 1
    )
)

echo [*] Gelistirme sunucusu baslatiliyor...
echo [*] Tarayici acilacak: http://localhost:3000

REM Tarayiciyi 3 saniye sonra ac (sunucunun baslamasi icin)
start "" cmd /c "timeout /t 3 /nobreak >nul && start http://localhost:3000"

REM Dev sunucusunu baslat
npm run dev
