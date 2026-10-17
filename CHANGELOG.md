# Changelog

Tüm önemli değişiklikler bu dosyada tutulur.
Format: tarih + kısa maddeler.

## 2026-10-17
- Practice sayfasindaki unite secicide, dersi tamamlanmamis kilitli uniteler de gorsel olarak listelendi.

## 2026-10-17
- Practice sayfasindaki coklu unite secimi ve kart tasarimi (UI) duzeltildi.

## 2026-10-17 (Faz 7.5)
- Practice sayfasindaki unite secici, coklu secim (multi-select) yapilabilir hale getirildi.
- Karisik Mod (Mixed Mode) arayuzu eklendi ve 4 soru tipini rastgele harmanlayacak sekilde guncellendi.

## 2026-10-17
- Oyunlastirma (XP, Seri, Istatistik) tamamen kaldirildi.
- Yiyecek, Hobiler, Hava Durumu ve Zaman uniteleri eklendi.
- Bulunma Hali ve Gelecek Zaman gramer notlari eklendi.

## 2026-10-17 (Faz 6.6)
- Unite icinde Ders tamamlanmadan Alistirma, Test ve Tekrar kisimlarina gecis kilitlendi.
- Unite icine "Tekrar" (Review) asamasi eklendi.
- Genel Review sayfasi artik sadece dersi tamamlanmis unitelerin kelimelerini gosteriyor.
- Practice sayfasindaki unite secici, sadece dersi tamamlanmis uniteleri listeliyor.

## 2026-10-17 (Faz 6.5.1)
- Renk unitisindeki kelime kartlarina gorsel renk kutulari eklendi.

## 2026-10-17 (Faz 6.5)
- Yeni unitelerde Test ve Alistirma butonlarinin calismama hatasi giderildi.
- Unite testleri artik sadece coktan secmeli (multipleChoice) sorulardan olusuyor.
- Gramer testleri 8 soruya cikarildi, gecme esigi %75 (6/8) olarak ayarlandi.
- Renk unitisine hexCode alanlari eklendi, gorsel renk kutulari eklendi.

## 2026-10-17 (Faz 6)
- Renkler, Aile, Temel Fiiller ve Temel Sifatlar uniteleri eklendi.
- Isimlerde Cogul, Sifat Uyumu, Belirtme Hali ve Gecmis Zaman gramer notlari eklendi.
- Yeni uniteler ve gramer notlari birbirine baglandi.

## 2026-10-16 (Faz 5.1)
- Turkce telaffuz alanlari (pronunciationTr) kaldirildi.
- Telaffuz artik her zaman Ingilizce gosteriliyor (arayuz ve ceviri dilinden bagimsiz).
- пожалуйста ve повторите пожалуйста telaffuzlari duzeltildi.

## 2026-10-16 (Faz 5)
- Gramer modulu eklendi.
- grammarProgress tablosu Dexie semasina eklendi.
- 4 gramer notu eklendi: cinsiyet, zamirler, olmak fiili, simdiki zaman.
- /grammar ve /grammar/[id] sayfalari olusturuldu.
- Navbar'a Gramer sekmesi eklendi.
- Ana sayfaya Gramer karti eklendi.
- Unite detayina "Ilgili Gramer" bolumu eklendi.

## 2026-10-16 (Faz 4.8.1)
- Bosluk doldurmada ipucu cumlesi artik soru asamasinda da gosteriliyor.

## 2026-10-16 (Faz 4.8)
- Eslestirmede Rusca kelimeye tiklayinca otomatik seslendirme duzeltildi.
- Sayilar unitisi 0-100 arasi tam listeye genisletildi (101 sayi).
- Bosluk doldurmada soru hint'i duzeltildi: tam cumle cevirisi ve {cevap} vurgusu.

## 2026-10-16 (Faz 4.7)
- Ayarlara telaffuz goster/gizle secenegi eklendi.
- Seslendirme butonu eklendi (ders, review, alistirma, test).
- Seslendirme sadece sorularda gosteriliyor, cevaplarda yok.
- Eslestirmede Rusca kelimeye tiklayinca otomatik seslendirme eklendi.
- Practice sayfasinda oturum baslayinca unite secici gizleniyor.
- Sayilar unitisi siralama duzeltildi (0-100 artan).
- Sayi kartlarinin sag ust kosesine sayisal deger rozeti eklendi.

## 2026-10-16 (Faz 4.6)
- Alistirma ve testte telaffuz sizintisi giderildi (sadece cevap sonrasi gosteriliyor).
- Alfabe unitisine Kiril alfabesinin 33 harfinin tamami eklendi.
- Selamlasma unitisine 10+ yeni ifade eklendi.

## 2026-10-16 (Faz 4.5)
- Alfabe unitisinde Alistirma/Test butonlari gizlendi.
- Alistirma ve Test farki netlestirildi (esik + uniteyi tamamlama).
- /practice sayfasina unite filtresi eklendi.
- Coktan secmeli sorulara ters yon destegi eklendi (%70 RU->EN, %30 EN->RU).
- Icerige pronunciationTr ve pronunciationEn alanlari eklendi.
- Selamlasma ve sayilar unitelerine telaffuzlar yazildi.
- Telaffuz ders, alistirma, test ve kart ekranlarinda gosteriliyor.

## 2026-10-16 (Faz 4)
- Unite akisi eklendi: Ders -> Alistirma -> Test.
- Ilerleme takibi (progress tablosu aktif kullanima alindi).
- Ana sayfaya genel ilerleme cubugu eklendi.
- Unite kartlarina durum rozetleri eklendi.
- Test modu eklendi (/unit/[id]/test), 10 soruluk, gecme esigi %80.
- Unite alistirma sayfasi eklendi (/unit/[id]/practice).
- Alistirma geri bildirimleri dogru/yanlis cevabin anlamini da gosteriyor.
- Sayilar unitesi 0-100 araligina genisletildi (35 kelime).

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
