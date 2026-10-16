#!/bin/bash
# ==========================================
# Rusca Ogren - Tek tikla baslatma (Mac/Linux)
# ==========================================

echo "[*] Rusca Ogren baslatiliyor..."

# node_modules yoksa npm install calistir
if [ ! -d "node_modules" ]; then
    echo "[*] Bagimliliklar yukleniyor (ilk calistirma)..."
    npm install
    if [ $? -ne 0 ]; then
        echo "[!] npm install basarisiz. Node.js kurulu mu?"
        exit 1
    fi
fi

echo "[*] Gelistirme sunucusu baslatiliyor..."
echo "[*] Tarayici acilacak: http://localhost:3000"

# Tarayiciyi 3 saniye sonra ac (arka planda)
(sleep 3 && open http://localhost:3000 2>/dev/null || xdg-open http://localhost:3000 2>/dev/null) &

# Dev sunucusunu baslat
npm run dev
