# Changelog

Tüm önemli değişiklikler bu dosyada tutulur.
Format: tarih + kısa maddeler.

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
