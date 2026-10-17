# Rusça Öğren

Yerel çalışan, Rusça öğrenme uygulaması.  
Tek kullanıcı. Auth, Supabase, Vercel, PWA yok.

## Gereksinimler

*   [Node.js](https://nodejs.org/) 18 veya üzeri
*   npm (Node.js ile birlikte gelir)

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

```python
├── app/                    # Next.js App Router sayfaları
│   ├── layout.tsx          # Kök layout (tema, navbar, db init)
│   ├── page.tsx            # Ana sayfa (ünite listesi + tekrar + alıştırma)
│   ├── globals.css         # Tasarım sistemi
│   ├── review/
│   │   └── page.tsx        # Kelime kartı tekrar sayfası (SRS)
│   ├── practice/
│   │   └── page.tsx        # Alıştırma sayfası (4 tip)
│   ├── settings/
│   │   └── page.tsx        # Ayarlar sayfası
│   └── unit/
│       └── [id]/
│           └── page.tsx    # Ünite detay sayfası
├── components/             # Yeniden kullanılabilir bileşenler
│   ├── navbar.tsx          # Navigasyon çubuğu
│   ├── footer.tsx          # Alt bilgi
│   ├── theme-provider.tsx  # Tema yönetimi (açık/koyu)
│   └── database-init.tsx   # Veritabanı başlatma
├── lib/                    # Yardımcı modüller
│   ├── db.ts               # Dexie veritabanı tanımı
│   ├── content.ts          # İçerik yükleme ve seed
│   ├── i18n.ts             # Çoklu dil (tr/en) mesajları
│   ├── lang-context.tsx    # Dil yönetimi context
│   ├── srs.ts              # SM-2 tabanlı SRS motoru
│   ├── reviews.ts          # Dexie reviews tablosu yardımcıları
│   ├── exercises.ts        # Alıştırma motoru (4 tip)
│   └── tts.ts              # Web Speech API TTS
├── types/                  # TypeScript tip tanımları
│   └── index.ts
├── content/                # Ünite JSON dosyaları
│   ├── unit-00-alphabet.json
│   ├── unit-01-greetings.json
│   └── unit-02-numbers.json
├── start.bat               # Windows tek tıkla başlatma
├── start.sh                # Mac/Linux tek tıkla başlatma
├── CHANGELOG.md            # Değişiklik kaydı
└── README.md               # Bu dosya
```

## Yeni Ünite Ekleme

1. content/ klasörüne JSON dosyası ekleyin (örnek: unit-01-greetings.json).
2. lib/content.ts dosyasında yeni üniteyi import edin ve UNIT_MODULES dizisine ekleyin.

JSON formatı:

```json
{
  "id": "unit-01",
  "titleTr": "Selamlaşma ve Tanışma",
  "titleEn": "Greetings and Introductions",
  "level": "A0",
  "items": [
    {
      "id": "g1",
      "type": "word",
      "ru": "привет",
      "tr": "merhaba",
      "en": "hello",
      "exampleRu": "Привет, как дела?",
      "exampleTr": "Merhaba, nasılsın?",
      "exampleEn": "Hello, how are you?",
      "tags": ["selamlasma"]
    }
  ]
}
```

## Diller

Uygulama iki bağımsız dil ayarı destekler:

*   **Arayüz dili**: Menü, başlık ve buton metinlerinin dili. Türkçe (tr) veya İngilizce (en).
*   **Çeviri dili**: Rusça kelimelerin karşılıklarının gösterileceği dil. Türkçe (tr) veya İngilizce (en).

İkisi birbirinden bağımsız olarak Ayarlar sayfasından seçilir. Seçimler Dexie (IndexedDB) settings tablosunda saklanır; sayfa yenilendiğinde korunur.

Eğer seçili çeviri dilinde karşılık yoksa, diğer dile otomatik olarak düşülür (fallback) ve yanında dil etiketi gösterilir.

Ünite başlıkları da arayüz diline göre gösterilir (titleTr / titleEn).

## SRS (Aralıklı Tekrar)

Uygulama basit bir SM-2 tabanlı SRS (Spaced Repetition System) motoru içerir.

*   Kelime kartları `/review` sayfasında çalışılır.
*   Her kart için 4 puan verilebilir: Tekrar (Again), Zor (Hard), İyi (Good), Kolay (Easy).
*   Verilen puana göre kartın tekrar aralığı ve kolaylık faktörü güncellenir.
*   Tekrar tarihleri Dexie `reviews` tablosunda saklanır.
*   Ana sayfadaki “Bugünün Tekrarı” kartı, kaç kartın tekrar zamanının geldiğini gösterir.
*   Sadece `type: "word"` olan öğeler tekrar havuzuna dahil edilir.

## Alıştırmalar

Uygulama 4 farklı alıştırma tipi sunar (`/practice` sayfası):

*   **Çoktan Seçmeli**: Rusça kelime gösterilir, 4 şıktan doğru çeviriyi seçin.
*   **Boşluk Doldurma**: Cümledeki boşluğa Rusça kelimeyi yazın.
*   **Eşleştirme**: Rusça kelimeleri çevirileriyle eşleştirin.
*   **Dinleme**: TTS ile kelimeleri dinleyip Rusça yazın (Web Speech API).

Tüm alıştırmalarda ilerleme göstergesi ve sonuç ekranı vardır. Dinleme alıştırması tarayıcının TTS desteğine bağlıdır.

## Geliştirme Notları

*   Değişiklikler `CHANGELOG.md` dosyasında tutulur.
*   Commit mesajları sade ve açıklayıcıdır.
*   Proje tamamen yerel çalışır.

## Teknolojiler

*   Next.js 15+ (App Router)
*   TypeScript
*   Tailwind CSS v4
*   Dexie.js (IndexedDB)