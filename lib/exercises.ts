/**
 * Alıştırma motoru — saf fonksiyonlar, kütüphane yok.
 *
 * Dört alıştırma tipi:
 *  1. Çoktan Seçmeli (Multiple Choice)
 *  2. Boşluk Doldurma (Fill in the Blank)
 *  3. Eşleştirme (Matching)
 *  4. Dinleme (Listening)
 */

import type { Item, Lang } from "@/types";

/* ========================================
   Soru tipleri
   ======================================== */

/** Çoktan seçmeli soru */
export interface MultipleChoiceQuestion {
  item: Item;
  question: string;        // Rusça kelime
  options: string[];        // 4 şık (çeviri dilinde)
  correctIndex: number;     // Doğru şıkkın indeksi
}

/** Boşluk doldurma sorusu */
export interface FillBlankQuestion {
  item: Item;
  sentenceWithBlank: string;  // ____ ile boşluk bırakılmış cümle
  correctWord: string;        // Boşluğa gelecek Rusça kelime
  hint: string;               // Çeviri dilinde ipucu
}

/** Eşleştirme çifti */
export interface MatchingPair {
  id: string;
  ru: string;
  translation: string;
}

/** Eşleştirme sorusu */
export interface MatchingQuestion {
  pairs: MatchingPair[];
}

/** Dinleme sorusu */
export interface ListeningQuestion {
  item: Item;
  correctWord: string;  // Kullanıcının yazması gereken Rusça kelime
}

/* ========================================
   Fisher-Yates Shuffle
   ======================================== */

/**
 * Diziyi yerinde karıştırır (Fisher-Yates algoritması).
 * Orijinal diziyi değiştirir ve döndürür.
 */
function shuffle<T>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

/* ========================================
   Yardımcı fonksiyonlar
   ======================================== */

/**
 * Çeviri dilinde karşılığı döndürür, fallback uygular.
 */
function getTranslationText(item: Item, lang: Lang): string {
  const primary = lang === "tr" ? item.tr : item.en;
  const fallback = lang === "tr" ? item.en : item.tr;
  return primary || fallback || "—";
}

/**
 * Çeviri dilinde örnek cümleyi döndürür.
 */
function getExampleText(item: Item, lang: Lang): string {
  const primary = lang === "tr" ? item.exampleTr : item.exampleEn;
  const fallback = lang === "tr" ? item.exampleEn : item.exampleTr;
  return primary || fallback || "";
}

/* ========================================
   Çoktan Seçmeli (Multiple Choice)
   ======================================== */

/**
 * Çoktan seçmeli sorular üretir.
 *
 * @param items - Tüm kelime öğeleri
 * @param lang  - Çeviri dili (şıkların dili)
 * @param count - Soru sayısı (varsayılan 10, item sayısını aşamaz)
 */
export function generateMultipleChoice(
  items: Item[],
  lang: Lang,
  count: number = 10
): MultipleChoiceQuestion[] {
  // Sadece çevirisi olan öğeler
  const eligible = items.filter((i) => getTranslationText(i, lang) !== "—");
  if (eligible.length < 2) return [];

  const questionCount = Math.min(count, eligible.length);
  const selected = shuffle([...eligible]).slice(0, questionCount);

  return selected.map((item) => {
    const correctAnswer = getTranslationText(item, lang);

    // Yanlış şıklar: aynı havuzdan, doğru cevap hariç
    const distractors = shuffle(
      eligible.filter((i) => i.id !== item.id)
    )
      .slice(0, 3)
      .map((i) => getTranslationText(i, lang));

    // 4 şıkkı birleştir ve karıştır
    const options = shuffle([correctAnswer, ...distractors]);
    const correctIndex = options.indexOf(correctAnswer);

    return {
      item,
      question: item.ru,
      options,
      correctIndex,
    };
  });
}

/* ========================================
   Boşluk Doldurma (Fill in the Blank)
   ======================================== */

/**
 * Boşluk doldurma soruları üretir.
 * exampleRu içindeki Rusça kelimeyi boşlukla değiştirir.
 *
 * @param items - Tüm kelime öğeleri
 * @param lang  - Çeviri dili (ipucu için)
 * @param count - Soru sayısı
 */
export function generateFillBlank(
  items: Item[],
  lang: Lang,
  count: number = 10
): FillBlankQuestion[] {
  // Sadece exampleRu olan öğeler
  const eligible = items.filter((i) => i.exampleRu && i.ru);
  if (eligible.length === 0) return [];

  const questionCount = Math.min(count, eligible.length);
  const selected = shuffle([...eligible]).slice(0, questionCount);

  return selected.map((item) => {
    const sentence = item.exampleRu!;
    // Rusça kelimeyi cümle içinde bul ve ____ ile değiştir
    // Büyük/küçük harf duyarsız arama (Rusça cümle başında büyük harf olabilir)
    const regex = new RegExp(escapeRegex(item.ru), "gi");
    const sentenceWithBlank = sentence.replace(regex, "____");

    return {
      item,
      sentenceWithBlank,
      correctWord: item.ru,
      hint: getTranslationText(item, lang),
    };
  });
}

/**
 * Regex özel karakterlerini escape eder.
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/* ========================================
   Eşleştirme (Matching)
   ======================================== */

/**
 * Eşleştirme sorusu üretir.
 * Sol sütun: ru (sıralı), sağ sütun: çeviri (karışık).
 *
 * @param items     - Tüm kelime öğeleri
 * @param lang      - Çeviri dili
 * @param pairCount - Eşleştirme çifti sayısı (varsayılan 6)
 */
export function generateMatching(
  items: Item[],
  lang: Lang,
  pairCount: number = 6
): MatchingQuestion {
  const eligible = items.filter((i) => getTranslationText(i, lang) !== "—");
  const actualCount = Math.min(pairCount, eligible.length);
  const selected = shuffle([...eligible]).slice(0, actualCount);

  const pairs: MatchingPair[] = selected.map((item) => ({
    id: item.id,
    ru: item.ru,
    translation: getTranslationText(item, lang),
  }));

  return { pairs };
}

/* ========================================
   Dinleme (Listening)
   ======================================== */

/**
 * Dinleme soruları üretir.
 * Kullanıcı TTS ile kelimeyi duyar, Rusça yazar.
 *
 * @param items - Tüm kelime öğeleri
 * @param count - Soru sayısı
 */
export function generateListening(
  items: Item[],
  count: number = 10
): ListeningQuestion[] {
  const eligible = items.filter((i) => i.ru);
  if (eligible.length === 0) return [];

  const questionCount = Math.min(count, eligible.length);
  const selected = shuffle([...eligible]).slice(0, questionCount);

  return selected.map((item) => ({
    item,
    correctWord: item.ru,
  }));
}
