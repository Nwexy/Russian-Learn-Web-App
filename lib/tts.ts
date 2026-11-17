/**
 * TTS (Text-to-Speech) modülü.
 *
 * Birincil: Web Speech API (window.speechSynthesis)
 * İkincil / Yedek (Faz 12.3): ResponsiveVoice (CDN üzerinden yüklenen harici ses kütüphanesi).
 *
 * Cihazda yerel Rusça ses paketi yoksa veya yerel ses hata verirse otomatik olarak
 * ResponsiveVoice ("Russian Female") devreye girer ve kullanıcıya bir kez toast bildirimi gösterilir.
 */

import { toast } from "sonner";

declare global {
  interface Window {
    responsiveVoice?: {
      speak: (
        text: string,
        voice?: string,
        parameters?: {
          pitch?: number;
          rate?: number;
          volume?: number;
          onstart?: () => void;
          onend?: () => void;
          onerror?: () => void;
        }
      ) => void;
      cancel: () => void;
      isPlaying: () => boolean;
      voiceSupport: () => boolean;
    };
  }
}

let russianVoice: SpeechSynthesisVoice | null = null;
let isVoicesListening = false;
let voicesLoaded = false;
let voicesReadyListeners: Array<() => void> = [];
let speakTimer: ReturnType<typeof setTimeout> | null = null;
let currentFallbackAudio: HTMLAudioElement | null = null;

const TTS_FALLBACK_STORAGE_KEY = "ttsFallbackNotified";
const RESPONSIVE_VOICE_KEY = "FQ9r4hgY";

// ResponsiveVoice kütüphanesinin anahtar eksik hatası vermesini engelle
if (typeof window !== "undefined") {
  try {
    (window as unknown as { rvApiKey?: string }).rvApiKey = RESPONSIVE_VOICE_KEY;
  } catch {}
}

export interface SpeakOptions {
  delayMs?: number;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: () => void;
}

/**
 * Tarayıcının TTS desteğini kontrol eder.
 * Web Speech API veya ResponsiveVoice mevcutsa true döner.
 */
export function isTTSSupported(): boolean {
  if (typeof window === "undefined") return false;
  return "speechSynthesis" in window || "responsiveVoice" in window;
}

/**
 * Cihazda yerel bir Rusça ses bulunup bulunmadığını kontrol eder.
 * Test / Simülasyon: URL'de ?fallback=1 veya localStorage'da forceFallbackTts="true"
 * tanımlanmışsa yerel ses yok sayılarak doğrudan ResponsiveVoice test edilebilir.
 */
export function hasRussianVoice(): boolean {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return false;
  }
  try {
    if (
      localStorage.getItem("forceFallbackTts") === "true" ||
      new URLSearchParams(window.location.search).get("fallback") === "1"
    ) {
      return false;
    }
  } catch {}

  try {
    const voices = window.speechSynthesis.getVoices();
    if (voices && voices.length > 0) {
      return voices.some((v) => {
        const l = (v.lang || "").toLowerCase();
        return l.includes("ru") || l.startsWith("ru");
      });
    }
    return russianVoice !== null;
  } catch {
    return false;
  }
}

/**
 * Cihazda Rusça ses paketi eksikse ve kullanıcı daha önce uyarılmadıysa
 * tek seferlik toast bildirimi gösterir ve localStorage'a kaydeder.
 */
export function notifyTtsFallbackIfNeeded(preferredLang?: string): void {
  if (typeof window === "undefined") return;
  try {
    if (localStorage.getItem(TTS_FALLBACK_STORAGE_KEY) === "true") {
      return;
    }

    // Yerel Rusça ses mevcutsa bildirim gösterme
    if (hasRussianVoice()) {
      return;
    }

    let lang = preferredLang;
    if (!lang) {
      try {
        lang = document.documentElement.lang || "en";
      } catch {
        lang = "en";
      }
    }

    const isTr = lang.toLowerCase().startsWith("tr");
    const message = isTr
      ? "Cihazınızda Rusça ses paketi bulunamadı. Yedek ses sistemi kullanılıyor."
      : "No Russian voice pack found on your device. Fallback voice system is being used.";

    toast.info(message, {
      duration: 6000,
    });

    localStorage.setItem(TTS_FALLBACK_STORAGE_KEY, "true");
  } catch (err) {
    console.error("[TTS] Bildirim hatası:", err);
  }
}

/**
 * Tarayıcı seslerinin yüklenmesini dinler ve callback'i tetikler.
 * Sesler yüklenemezse 800ms sonra zaman aşımı ile callback'i çağırır.
 */
export function onVoicesReady(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};

  if (voicesLoaded || (window.speechSynthesis && window.speechSynthesis.getVoices().length > 0)) {
    callback();
    return () => {};
  }

  voicesReadyListeners.push(callback);

  const fallbackTimer = setTimeout(() => {
    callback();
  }, 800);

  return () => {
    clearTimeout(fallbackTimer);
    voicesReadyListeners = voicesReadyListeners.filter((cb) => cb !== callback);
  };
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

      voicesLoaded = true;

      const voice =
        voices.find((v) => v.lang === "ru-RU") ||
        voices.find((v) => v.lang === "ru_RU") ||
        voices.find((v) => v.lang.toLowerCase().startsWith("ru")) ||
        null;

      if (voice) {
        russianVoice = voice;
      }

      if (voicesReadyListeners.length > 0) {
        const listeners = [...voicesReadyListeners];
        voicesReadyListeners = [];
        listeners.forEach((cb) => {
          try {
            cb();
          } catch {}
        });
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
 * ResponsiveVoice getvoice.php servisi üzerinden Audio nesnesi ile doğrudan oynatma yapar.
 * JS kütüphanesine bağımlı kalmadan sesi doğrudan tarayıcı ses motoruyla çalar.
 */
export function playAudioFallback(
  text: string,
  lang: string = "ru-RU",
  opts: SpeakOptions = {}
): boolean {
  if (typeof window === "undefined" || !text) return false;

  try {
    if (currentFallbackAudio) {
      try {
        currentFallbackAudio.pause();
        currentFallbackAudio.currentTime = 0;
      } catch {}
      currentFallbackAudio = null;
    }

    const tl = lang.toLowerCase().startsWith("ru") ? "ru" : "en";
    const url = `https://code.responsivevoice.org/getvoice.php?t=${encodeURIComponent(text)}&tl=${tl}&key=${RESPONSIVE_VOICE_KEY}`;

    const audio = new Audio(url);
    currentFallbackAudio = audio;

    if (opts.onStart) {
      audio.onplay = () => opts.onStart?.();
    }
    if (opts.onEnd) {
      audio.onended = () => {
        currentFallbackAudio = null;
        opts.onEnd?.();
      };
    }
    if (opts.onError) {
      audio.onerror = () => {
        currentFallbackAudio = null;
        opts.onError?.();
      };
    }

    audio.play().catch((err) => {
      console.error("[TTS] Audio fallback oynatma hatası:", err);
      opts.onError?.();
    });

    return true;
  } catch (err) {
    console.error("[TTS] Audio fallback başlatılamadı:", err);
    opts.onError?.();
    return false;
  }
}

/**
 * ResponsiveVoice üzerinden metni seslendirir.
 * Başarılı başlatıldıysa true, kütüphane henüz hazır değilse veya hata oluşursa doğrudan Audio fallback'e geçer.
 */
export function speakWithResponsiveVoice(
  text: string,
  lang: string = "ru-RU",
  opts: SpeakOptions = {}
): boolean {
  if (typeof window === "undefined") return false;

  const rv = window.responsiveVoice;
  if (!rv || typeof rv.speak !== "function") {
    // Kütüphane yüklenirken gecikme olursa anında doğrudan Audio fallback'i kullan
    return playAudioFallback(text, lang, opts);
  }

  try {
    if (rv.isPlaying && rv.isPlaying()) {
      rv.cancel();
    }
  } catch {}

  const isRu = lang.toLowerCase().includes("ru");
  const voiceName = isRu ? "Russian Female" : "UK English Female";

  try {
    rv.speak(text, voiceName, {
      rate: 0.9,
      onstart: opts.onStart,
      onend: opts.onEnd,
      onerror: () => {
        // ResponsiveVoice hata verirse doğrudan Audio fallback ile kurtar
        playAudioFallback(text, lang, opts);
      },
    });
    return true;
  } catch (err) {
    console.error("[TTS] ResponsiveVoice hatası, Audio fallback deneniyor:", err);
    return playAudioFallback(text, lang, opts);
  }
}

/**
 * Verilen metni sesli okur.
 *
 * @param text - Okunacak metin
 * @param lang - BCP-47 dil kodu (varsayılan: "ru-RU")
 * @param options - Gecikme süresi (varsayılan: 0ms) veya callback seçenekleri
 *
 * Çalışma Mantığı:
 *  1. Önceki konuşmaları (hem SpeechSynthesis hem ResponsiveVoice) hemen iptal eder.
 *  2. Rusça bir metin isteniyorsa ve yerel cihazda Rusça ses paketi YOKSA:
 *     - Kullanıcıya ilk seferde toast bildirimi gösterir.
 *     - ResponsiveVoice ile seslendirir.
 *  3. Yerel Rusça ses paketi VARSA:
 *     - window.speechSynthesis ile seslendirir.
 *     - Eğer yerel oynatma esnasında hata (onerror) oluşursa, otomatik olarak ResponsiveVoice yedeğine geçer.
 */
export function speak(
  text: string,
  lang: string = "ru-RU",
  options?: SpeakOptions | number
): void {
  if (!text) return;

  const opts: SpeakOptions =
    typeof options === "number" ? { delayMs: options } : options || {};
  const delayMs = opts.delayMs !== undefined ? opts.delayMs : 0;

  // Ses henüz hafızaya alınmadıysa tekrar dene
  if (!russianVoice) {
    initVoices();
  }

  // Önceki konuşmaları ve bekleyen zamanlayıcıyı hemen iptal et
  if (speakTimer) {
    clearTimeout(speakTimer);
    speakTimer = null;
  }

  if (typeof window !== "undefined") {
    if ("speechSynthesis" in window) {
      try {
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }
        window.speechSynthesis.cancel();
      } catch {}
    }

    if (window.responsiveVoice) {
      try {
        window.responsiveVoice.cancel();
      } catch {}
    }

    if (currentFallbackAudio) {
      try {
        currentFallbackAudio.pause();
        currentFallbackAudio.currentTime = 0;
      } catch {}
      currentFallbackAudio = null;
    }
  }

  const doSpeak = () => {
    const isRu = lang === "ru-RU" || lang.toLowerCase().startsWith("ru");

    // Yerel Rusça ses paketi yoksa doğrudan ResponsiveVoice yedeğine git
    if (isRu && !hasRussianVoice()) {
      notifyTtsFallbackIfNeeded();
      const started = speakWithResponsiveVoice(text, lang, opts);
      if (started) return;
    }

    // Yerel Web Speech API ile oynatmayı dene
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        const utterance = new SpeechSynthesisUtterance(text);

        if (russianVoice && isRu) {
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

        if (opts.onStart) utterance.onstart = opts.onStart;
        if (opts.onEnd) utterance.onend = opts.onEnd;

        utterance.onerror = () => {
          // Yerel TTS hata verirse ResponsiveVoice yedeğine geç
          notifyTtsFallbackIfNeeded();
          const fallbackStarted = speakWithResponsiveVoice(text, lang, opts);
          if (!fallbackStarted) {
            opts.onError?.();
          }
        };

        window.speechSynthesis.speak(utterance);
        return;
      } catch (err) {
        console.error("[TTS] SpeechSynthesis hatası, yedek deneniyor:", err);
      }
    }

    // SpeechSynthesis bulunamadıysa veya fırlattıysa ResponsiveVoice yedeğini dene
    notifyTtsFallbackIfNeeded();
    const fallbackOk = speakWithResponsiveVoice(text, lang, opts);
    if (!fallbackOk) {
      opts.onError?.();
    }
  };

  if (delayMs > 0) {
    speakTimer = setTimeout(doSpeak, delayMs);
  } else {
    doSpeak();
  }
}
