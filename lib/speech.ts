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
 * Rusça konuşma tanıma ve karşılaştırma metnini normalize eder.
 * - Küçük harfe çevirir.
 * - 'ё' harfini 'е' olarak eşitler.
 * - Noktalama işaretlerini, parantezleri ve özel sembolleri temizler.
 * - Fazla boşlukları teke indirir ve kırpar.
 */
export function normalizeRussianSpeechText(s: string): string {
  if (!s) return "";
  return s
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'«»—–]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Kullanıcının söylediği metin ile hedef Rusça metni karşılaştırır.
 * Küçük/büyük harf duyarsızdır, noktalama işaretlerini, boşlukları ve е/ё farkını normalize eder.
 * Sayılar için (numberValue): Hem Rusça kelime ("двадцать пять") hem de rakam ("25") geçerli kabul edilir.
 *
 * @param transcript  - Web Speech API'den dönen metin
 * @param targetRu    - Hedef Rusça kelime (örn: "двадцать пять")
 * @param numberValue - Varsa öğenin sayısal değeri (örn: 25 veya 0)
 */
export function compareRussianSpeech(
  transcript: string,
  targetRu: string,
  numberValue?: number
): boolean {
  if (!transcript || !targetRu) return false;

  const normTranscript = normalizeRussianSpeechText(transcript);
  if (!normTranscript) return false;

  // Sayısal değer kontrolü: Web Speech API Rusça sayıları bazen rakam ("25"), bazen kelime ("двадцать пять") olarak döndürür
  if (numberValue !== undefined && numberValue !== null) {
    const numStr = String(numberValue);

    // 1. Transcript doğrudan sayının rakam haline eşit mi ("25")
    if (normTranscript === numStr) return true;

    // 2. Transcript içinde sayının rakamı bağımsız bir kelime olarak geçiyor mu ("номер 25" -> true)
    const transcriptWords = normTranscript.split(" ");
    if (transcriptWords.includes(numStr)) return true;

    // 3. Transcript'teki sadece rakamlar hedefe eşit mi ("25." veya "№25" -> "25")
    const digitsOnly = normTranscript.replace(/\D/g, "");
    if (digitsOnly === numStr) return true;
  }

  // targetRu alternatifleri içerebilir ("друг / подруга") veya parantez içi ("(он) читает")
  const targets = targetRu
    .split("/")
    .map((t) => normalizeRussianSpeechText(t.replace(/\(.*?\)/g, "")))
    .filter(Boolean);

  if (targets.length === 0) {
    targets.push(normalizeRussianSpeechText(targetRu));
  }

  for (const t of targets) {
    // Tam eşitlik
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

