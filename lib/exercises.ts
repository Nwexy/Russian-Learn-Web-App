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

/** Çoktan seçmeli soru yönü */
export type McDirection = "ru-to-target" | "target-to-ru";

/** RU→çeviri yönünün seçilme olasılığı (kalanı ters yön) */
const RU_TO_TARGET_PROBABILITY = 0.7;

/** Çoktan seçmeli soru */
export interface MultipleChoiceQuestion {
  item: Item;
  question: string;         // ru-to-target: Rusça kelime, target-to-ru: çeviri
  options: string[];        // 4 şık (yöne göre çeviri dilinde veya Rusça)
  correctIndex: number;     // Doğru şıkkın indeksi
  direction: McDirection;   // Soru yönü
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

/**
 * Okunuşu çeviri diline göre döndürür (pronunciationLang = translationLang).
 * Alan yoksa boş string döner; fallback yapılmaz çünkü okunuş yazımı dile özgüdür.
 */
export function getPronunciation(
  item: { pronunciationTr?: string; pronunciationEn?: string },
  lang: Lang
): string {
  return (lang === "tr" ? item.pronunciationTr : item.pronunciationEn) || "";
}

/* ========================================
   Çoktan Seçmeli (Multiple Choice)
   ======================================== */

/**
 * Çoktan seçmeli sorular üretir.
 * Her soru için rastgele yön seçilir:
 *  - %70 ru-to-target: soru Rusça, şıklar çeviri dilinde
 *  - %30 target-to-ru: soru çeviri dilinde, şıklar Rusça
 *
 * @param items - Tüm kelime öğeleri
 * @param lang  - Çeviri dili
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
    const direction: McDirection =
      Math.random() < RU_TO_TARGET_PROBABILITY ? "ru-to-target" : "target-to-ru";

    // Yöne göre soru ve şık metnini belirleyen fonksiyonlar
    const optionText = (i: Item) =>
      direction === "ru-to-target" ? getTranslationText(i, lang) : i.ru;
    const question =
      direction === "ru-to-target" ? item.ru : getTranslationText(item, lang);

    const correctAnswer = optionText(item);

    // Yanlış şıklar: aynı havuzdan, doğru cevap hariç, tekrar eden metin olmadan
    const distractors: string[] = [];
    for (const other of shuffle(eligible.filter((i) => i.id !== item.id))) {
      const text = optionText(other);
      if (text !== correctAnswer && !distractors.includes(text)) distractors.push(text);
      if (distractors.length === 3) break;
    }

    // 4 şıkkı birleştir ve karıştır
    const options = shuffle([correctAnswer, ...distractors]);
    const correctIndex = options.indexOf(correctAnswer);

    return {
      item,
      question,
      options,
      correctIndex,
      direction,
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

/* ========================================
   Karışık Alıştırma (Mixed Practice)
   ======================================== */

/** Karışık oturumdaki tek bir soru */
export type MixedQuestion =
  | { kind: "multipleChoice"; data: MultipleChoiceQuestion }
  | { kind: "fillBlank"; data: FillBlankQuestion }
  | { kind: "matching"; data: MatchingQuestion }
  | { kind: "listening"; data: ListeningQuestion };

/** Karışık oturumda bir eşleştirme sorusundaki çift sayısı */
const MIXED_MATCHING_PAIRS = 4;

/**
 * Karışık alıştırma oturumu üretir.
 * Soru tipleri rastgele dağıtılır; uygun olmayan tipler atlanır
 * (örn. TTS yoksa dinleme, örnek cümle yoksa boşluk doldurma).
 * Bir eşleştirme sorusu tek soru sayılır.
 *
 * @param items        - Kelime öğeleri (type="word")
 * @param lang         - Çeviri dili
 * @param count        - Toplam soru sayısı (varsayılan 10)
 * @param ttsSupported - Tarayıcı ses okumayı destekliyor mu
 */
export function generateMixedPractice(
  items: Item[],
  lang: Lang,
  count: number = 10,
  ttsSupported: boolean = true
): MixedQuestion[] {
  const withTranslation = items.filter((i) => getTranslationText(i, lang) !== "—");
  const withExample = items.filter((i) => i.exampleRu && i.ru);

  // Kullanılabilir tipler
  const kinds: MixedQuestion["kind"][] = [];
  if (withTranslation.length >= 2) kinds.push("multipleChoice");
  if (withExample.length > 0) kinds.push("fillBlank");
  if (withTranslation.length >= 3) kinds.push("matching");
  if (ttsSupported && items.length > 0) kinds.push("listening");
  if (kinds.length === 0) return [];

  // Her slot için rastgele tip seç (eşleştirme en fazla 2 kez)
  const plan: Record<MixedQuestion["kind"], number> = {
    multipleChoice: 0, fillBlank: 0, matching: 0, listening: 0,
  };
  for (let s = 0; s < count; s++) {
    let kind = kinds[Math.floor(Math.random() * kinds.length)];
    if (kind === "matching" && plan.matching >= 2) {
      const others = kinds.filter((k) => k !== "matching");
      if (others.length === 0) continue;
      kind = others[Math.floor(Math.random() * others.length)];
    }
    plan[kind]++;
  }

  const questions: MixedQuestion[] = [
    ...generateMultipleChoice(items, lang, plan.multipleChoice).map(
      (data) => ({ kind: "multipleChoice" as const, data })
    ),
    ...generateFillBlank(items, lang, plan.fillBlank).map(
      (data) => ({ kind: "fillBlank" as const, data })
    ),
    ...Array.from({ length: plan.matching }, () => ({
      kind: "matching" as const,
      data: generateMatching(items, lang, MIXED_MATCHING_PAIRS),
    })),
    ...generateListening(items, plan.listening).map(
      (data) => ({ kind: "listening" as const, data })
    ),
  ];

  return shuffle(questions).slice(0, count);
}
