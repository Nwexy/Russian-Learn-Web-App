# Rusça Öğren

Yerel çalışan, internet gerektirmeyen Rusça öğrenme uygulaması.
Tek kullanıcı. Auth, Supabase, Vercel, PWA yok.

## Gereksinimler

- [Node.js](https://nodejs.org/) 18 veya üzeri
- npm (Node.js ile birlikte gelir)

## Kurulum (Tek Seferlik)

```bash
npm install
```

## Çalıştırma

```bash
npm run dev
```

Tarayıcıda [http://localhost:3000](http://localhost:3000) adresini açın.

## Tek Tıkla Başlatma

### Windows
`start.bat` dosyasına çift tıklayın. Bağımlılıkları yükler, sunucuyu başlatır ve tarayıcıyı açar.

### Mac / Linux
```bash
chmod +x start.sh   # Sadece ilk seferde gerekli
./start.sh
```

## Proje Yapısı

```
├── app/                    # Next.js App Router sayfaları
│   ├── layout.tsx          # Kök layout (tema, navbar, db init)
│   ├── page.tsx            # Ana sayfa (ünite listesi)
│   ├── globals.css         # Tasarım sistemi
│   ├── settings/
│   │   └── page.tsx        # Ayarlar sayfası
│   └── unit/
│       └── [id]/
│           └── page.tsx    # Ünite detay sayfası
├── components/             # Yeniden kullanılabilir bileşenler
│   ├── navbar.tsx          # Navigasyon çubuğu
│   ├── theme-provider.tsx  # Tema yönetimi (açık/koyu)
│   └── database-init.tsx   # Veritabanı başlatma
├── lib/                    # Yardımcı modüller
│   ├── db.ts               # Dexie veritabanı tanımı
│   └── content.ts          # İçerik yükleme ve seed
├── types/                  # TypeScript tip tanımları
│   └── index.ts
├── content/                # Ünite JSON dosyaları
│   └── unit-00-alphabet.json
├── start.bat               # Windows tek tıkla başlatma
├── start.sh                # Mac/Linux tek tıkla başlatma
├── CHANGELOG.md            # Değişiklik kaydı
└── README.md               # Bu dosya
```

## Yeni Ünite Ekleme

1. `content/` klasörüne JSON dosyası ekleyin (örnek: `unit-01-greetings.json`).
2. `lib/content.ts` dosyasında yeni üniteyi import edin ve `UNIT_MODULES` dizisine ekleyin.

JSON formatı:
```json
{
  "id": "unit-01",
  "title": "Selamlaşma",
  "level": "A1",
  "items": [
    {
      "id": "g1",
      "type": "word",
      "ru": "Привет",
      "tr": "Merhaba",
      "exampleRu": "Привет, как дела?",
      "exampleTr": "Merhaba, nasılsın?"
    }
  ]
}
```

## Diller

Uygulama iki bağımsız dil ayarı destekler:

- **Arayüz dili**: Menü, başlık ve buton metinlerinin dili. Türkçe (tr) veya İngilizce (en).
- **Çeviri dili**: Rusça kelimelerin karşılıklarının gösterileceği dil. Türkçe (tr) veya İngilizce (en).

İkisi birbirinden bağımsız olarak Ayarlar sayfasından seçilir. Seçimler Dexie (IndexedDB) settings tablosunda saklanır; sayfa yenilendiğinde korunur.

Eğer seçili çeviri dilinde karşılık yoksa, diğer dile otomatik olarak düşülür (fallback) ve yanında dil etiketi gösterilir.

## Geliştirme Notları

- Değişiklikler `CHANGELOG.md` dosyasında tutulur.
- Commit mesajları sade ve açıklayıcıdır.
- Proje tamamen yerel çalışır, internet bağlantısı gerekmez.

## Teknolojiler

- Next.js 15+ (App Router)
- TypeScript
- Tailwind CSS v4
- Dexie.js (IndexedDB)
