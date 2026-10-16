/**
 * TTS (Text-to-Speech) modülü.
 * Web Speech API (window.speechSynthesis) kullanır. Harici kütüphane yok.
 *
 * Tarayıcı desteklemiyorsa sessizce false döner, hata fırlatmaz.
 */

/**
 * Tarayıcının TTS desteğini kontrol eder.
 */
export function isTTSSupported(): boolean {
  if (typeof window === "undefined") return false;
  return "speechSynthesis" in window;
}

/**
 * Verilen metni sesli okur.
 *
 * @param text - Okunacak metin
 * @param lang - BCP-47 dil kodu (varsayılan: "ru-RU")
 *
 * Davranış:
 *  - Aynı anda birden fazla çağrıda önceki okumayı iptal eder.
 *  - Rusça için uygun sesi seçer (varsa ru-RU, yoksa ilk bulunan).
 *  - Hız 0.9 — yeni başlayanlar için biraz yavaş.
 *  - Tarayıcı TTS desteklemiyorsa sessizce döner.
 */
export function speak(text: string, lang: string = "ru-RU"): void {
  if (!isTTSSupported()) return;

  // Önceki okumayı iptal et
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  utterance.rate = 0.9;

  // Uygun sesi bulmaya çalış
  const voices = window.speechSynthesis.getVoices();
  const exactMatch = voices.find((v) => v.lang === lang);
  const partialMatch = voices.find((v) => v.lang.startsWith(lang.split("-")[0]));

  if (exactMatch) {
    utterance.voice = exactMatch;
  } else if (partialMatch) {
    utterance.voice = partialMatch;
  }
  // Hiçbiri bulunamazsa tarayıcı varsayılanını kullanır

  window.speechSynthesis.speak(utterance);
}
