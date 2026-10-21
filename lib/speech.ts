/**
 * Web Speech API (SpeechRecognition) modülü.
 * Konuşma tanıma (Speech-to-Text) için saf yardımcı fonksiyonlar.
 * Harici kütüphane gerektirmez.
 */

// Tarayıcıdaki SpeechRecognition sınıfını güvenle döndürür
function getSpeechRecognitionClass(): any {
  if (typeof window === "undefined") return null;
  const win = window as any;
  return win.SpeechRecognition || win.webkitSpeechRecognition || null;
}

/**
 * Tarayıcının konuşma tanımayı (SpeechRecognition) destekleyip desteklemediğini kontrol eder.
 */
export function isSpeechRecognitionSupported(): boolean {
  return getSpeechRecognitionClass() !== null;
}

// Aktif dinleme oturumu referansı
let currentRecognitionInstance: any = null;

/**
 * Mikrofonu dinler ve konuşulan metni Promise olarak döndürür.
 *
 * @param lang - BCP-47 dil kodu (varsayılan: "ru-RU")
 * @returns Tanınan metin (transcript)
 */
export function recognizeSpeech(lang: string = "ru-RU"): Promise<string> {
  return new Promise((resolve, reject) => {
    const SpeechRecognition = getSpeechRecognitionClass();
    if (!SpeechRecognition) {
      reject(new Error("SpeechRecognition is not supported in this browser"));
      return;
    }

    // Devam eden başka bir oturum varsa durdur
    if (currentRecognitionInstance) {
      try {
        currentRecognitionInstance.abort();
      } catch {
        // yoksay
      }
      currentRecognitionInstance = null;
    }

    try {
      const recognition = new SpeechRecognition();
      currentRecognitionInstance = recognition;
      recognition.lang = lang;
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      let recognizedText = "";
      let hasFinished = false;

      recognition.onresult = (event: any) => {
        if (event.results && event.results.length > 0) {
          const firstResult = event.results[0];
          if (firstResult && firstResult.length > 0) {
            recognizedText = firstResult[0].transcript || "";
          }
        }
      };

      recognition.onerror = (event: any) => {
        if (hasFinished) return;
        hasFinished = true;
        currentRecognitionInstance = null;
        reject(new Error(event.error || "Speech recognition error"));
      };

      recognition.onend = () => {
        currentRecognitionInstance = null;
        if (!hasFinished) {
          hasFinished = true;
          if (recognizedText && recognizedText.trim().length > 0) {
            resolve(recognizedText.trim());
          } else {
            reject(new Error("no-speech"));
          }
        }
      };

      recognition.start();
    } catch (err) {
      currentRecognitionInstance = null;
      reject(err instanceof Error ? err : new Error(String(err)));
    }
  });
}

/**
 * Devam eden bir konuşma tanıma oturumu varsa durdurur.
 */
export function stopSpeechRecognition(): void {
  if (currentRecognitionInstance) {
    try {
      currentRecognitionInstance.stop();
    } catch {
      try {
        currentRecognitionInstance.abort();
      } catch {
        // yoksay
      }
    }
    currentRecognitionInstance = null;
  }
}

/**
 * Kullanıcının söylediği metin ile hedef Rusça metni karşılaştırır.
 * Küçük/büyük harf duyarsızdır, noktalama işaretlerini, boşlukları ve е/ё farkını normalize eder.
 */
export function compareRussianSpeech(transcript: string, targetRu: string): boolean {
  if (!transcript || !targetRu) return false;

  const clean = (s: string) =>
    s
      .toLowerCase()
      .replace(/ё/g, "е")
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'«»—]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

  const normTranscript = clean(transcript);

  // targetRu alternatifleri içerebilir ("друг / подруга")
  const targets = targetRu
    .split("/")
    .map((t) => clean(t.replace(/\(.*?\)/g, "")))
    .filter(Boolean);

  if (targets.length === 0) targets.push(clean(targetRu));

  for (const t of targets) {
    if (normTranscript === t) return true;

    // Hedef kelime transcript içinde tam bir kelime olarak geçiyor mu
    const words = normTranscript.split(" ");
    if (words.includes(t)) return true;

    // Transcript hedefin bir alt parçası mı veya hedef transcript'i kapsıyor mu (en az 4 harf)
    if (t.length >= 4 && (normTranscript.startsWith(t) || t.startsWith(normTranscript))) {
      return true;
    }
  }

  return false;
}
