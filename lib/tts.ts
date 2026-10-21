/**
 * TTS (Text-to-Speech) modülü.
 * Web Speech API (window.speechSynthesis) kullanır. Harici kütüphane yok.
 *
 * Tarayıcı desteklemiyorsa sessizce döner, hata fırlatmaz.
 */

let russianVoice: SpeechSynthesisVoice | null = null;
let isVoicesListening = false;

/**
 * Tarayıcının TTS desteğini kontrol eder.
 */
export function isTTSSupported(): boolean {
  if (typeof window === "undefined") return false;
  return "speechSynthesis" in window;
}

/**
 * Seslerin tarayıcıda erkenden yüklenmesini sağlar (pre-load).
 * Bulunan Rusça sesini değişkende tutarak speak() anındaki gecikmeyi yok eder.
 */
export function initVoices(): void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

  const updateRussianVoice = () => {
    try {
      const voices = window.speechSynthesis.getVoices();
      if (!voices || voices.length === 0) return;

      const voice =
        voices.find((v) => v.lang === "ru-RU") ||
        voices.find((v) => v.lang === "ru_RU") ||
        voices.find((v) => v.lang.toLowerCase().startsWith("ru")) ||
        null;

      if (voice) {
        russianVoice = voice;
      }
    } catch {
      // Sessizce yut
    }
  };

  // İlk çağrıda sesleri almayı dene
  updateRussianVoice();

  // Tarayıcı sesleri asenkron yükleyebilir, onvoiceschanged ile dinle
  if (!isVoicesListening && typeof window.speechSynthesis !== "undefined") {
    isVoicesListening = true;
    if (typeof window.speechSynthesis.onvoiceschanged !== "undefined") {
      window.speechSynthesis.onvoiceschanged = updateRussianVoice;
    }
    if (typeof window.speechSynthesis.addEventListener === "function") {
      window.speechSynthesis.addEventListener("voiceschanged", updateRussianVoice);
    }
  }
}

// Modül istemci tarafında ilk import edildiğinde sesleri yüklemeyi başlat
if (typeof window !== "undefined") {
  initVoices();
}

/**
 * Yüklenmiş Rusça sesini döndürür (varsa).
 */
export function getRussianVoice(): SpeechSynthesisVoice | null {
  return russianVoice;
}

/**
 * Verilen metni sesli okur.
 *
 * @param text - Okunacak metin
 * @param lang - BCP-47 dil kodu (varsayılan: "ru-RU")
 *
 * Davranış:
 *  - Önceki konuşmaları hemen iptal eder (kuyruğu temizler).
 *  - Önceden yüklenmiş Rusça sesini doğrudan atayarak arama gecikmesini sıfırlar.
 *  - Hız: 0.9 (yeni başlayanlar için ideal tempo).
 *  - Tarayıcı TTS desteklemiyorsa sessizce döner.
 */
export function speak(text: string, lang: string = "ru-RU"): void {
  if (!isTTSSupported() || !text) return;

  // Ses henüz hafızaya alınmadıysa tekrar dene
  if (!russianVoice) {
    initVoices();
  }

  // Tarayıcı duraklatılmışsa devam ettir
  if (window.speechSynthesis.paused) {
    window.speechSynthesis.resume();
  }

  // Önceki konuşmaları hemen iptal et (kuyruğu temizle)
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);

  // Önceden yüklediğimiz Rusça sesi varsa doğrudan ata
  if (russianVoice && (lang === "ru-RU" || lang.startsWith("ru"))) {
    utterance.voice = russianVoice;
  } else {
    try {
      const voices = window.speechSynthesis.getVoices();
      const match =
        voices.find((v) => v.lang === lang) ||
        voices.find((v) => v.lang.startsWith(lang.split("-")[0]));
      if (match) {
        utterance.voice = match;
      }
    } catch {
      // Tarayıcı varsayılanı kullanılır
    }
  }

  utterance.lang = lang;
  utterance.rate = 0.9;

  window.speechSynthesis.speak(utterance);
}
