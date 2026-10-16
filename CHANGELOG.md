# Changelog

Tüm önemli değişiklikler bu dosyada tutulur.
Format: tarih + kısa maddeler.

## 2026-10-16 (Faz 3.5)
- mistakes tablosu Dexie semasina eklendi.
- Yanlis cevaplar kalici olarak kaydediliyor.
- Bir soruyu bir kez dogru yapinca listeden dusuyor.
- /practice/mistakes sayfasi eklendi.
- Ana sayfa ve alistirma sayfasina "Yanlislarim" kartlari eklendi.
- Ayarlara "Yanlislari Temizle" butonu eklendi.

## 2026-10-16 (Faz 3)
- Sayilar unitesi eklendi (unit-02-numbers.json).
- Web Speech API ile TTS destegi eklendi (lib/tts.ts).
- Alistirma motoru eklendi (lib/exercises.ts).
- Alistirma sayfasi eklendi (/practice) — coktan secmeli, bosluk doldurma, eslestirme, dinleme.
- Ana sayfaya Alistirmalar karti eklendi.
- Navbar'a Alistirma linki eklendi.
- i18n anahtarlari genisletildi.

## 2026-10-16 (Faz 2)
- Unite basliklari arayuz diline baglandi (titleTr / titleEn).
- Selamlasma unitesi eklendi (unit-01-greetings.json, 12 kelime).
- Basit SM-2 tabanli SRS motoru eklendi (lib/srs.ts).
- Kelime karti tekrar ekrani eklendi (/review).
- Ana sayfaya "Bugunun Tekrari" karti eklendi.
- i18n anahtarlari genisletildi.
- Navbar'a Tekrar linki eklendi.
- Dexie reviews tablosu yardimci fonksiyonlari eklendi (lib/reviews.ts).

## 2026-10-16 (Faz 1.5)
- Arayüz dili (tr/en) desteği eklendi.
- Çeviri dili (tr/en) seçimi eklendi.
- İçerik formatı tr ve en alanlarını destekleyecek şekilde güncellendi.
- Ayarlar sayfasına dil seçimleri eklendi.
- Kelime kartlarında seçili çeviri dili gösteriliyor, eksikse diğer dile düşüyor.
- lib/i18n.ts ve lib/lang-context.tsx oluşturuldu.
- Footer bileşeni ayrıldı (i18n desteği için).
- README.md'ye Diller bölümü eklendi.

## 2026-10-16
- Proje iskeleti kuruldu (Next.js 15, TypeScript, Tailwind CSS).
- Dexie veritabanı şeması eklendi (items, reviews, progress, settings).
- Alfabe ünitesi (unit-00-alphabet.json) eklendi (12 harf).
- Ana sayfa, ünite detay sayfası ve ayarlar sayfası oluşturuldu.
- Tema yönetimi eklendi (açık/koyu mod, localStorage ile kalıcı).
- Navbar eklendi (logo, ana sayfa, ayarlar, tema geçişi).
- start.bat ve start.sh ile tek tıkla başlatma eklendi.
- README.md ve CHANGELOG.md oluşturuldu.
