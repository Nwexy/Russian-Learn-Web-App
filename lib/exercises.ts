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
  fullTranslation?: string;   // Boşluğa denk gelen kelime { } ile vurgulanmış tam cümle çevirisi
  hintSentence?: string;      // fullTranslation ile aynı (tam çeviri + {cevap})
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

/** Konuşma sorusu */
export interface SpeakingQuestion {
  item: Item;
  targetText: string;    // Rusça söylenmesi gereken kelime / cümle
  translation: string;   // Çevirisi (ipucu)
}

/** Kelime Bankası (Cümle Kurucu) sorusu */
export interface WordBankQuestion {
  item: Item;
  targetSentence: string;    // Orijinal Rusça cümle (örn: "Это зелёный чай.")
  hint: string;              // Çeviri dilindeki ipucu (örn: "Bu yeşil çay.")
  targetWords: string[];     // Hedef kelimeler sırasıyla: ["Это", "зелёный", "чай."]
  shuffledWords: string[];   // Hedef kelimeler + 3-4 çeldirici kelime, karıştırılmış
}

/* ========================================
   Fisher-Yates Shuffle & Adil Dağıtım
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

/**
 * Üniteler arası adil (dengeli) soru seçimi.
 * Gelen item listesini üniteye (unitId) göre gruplar.
 * Seçilen üniteler arasında Round-Robin mantığıyla eşit (veya en yakın) sayıda item seçer.
 * Sonucu karıştırarak döndürür.
 *
 * @param items       - Uygun kelime öğeleri
 * @param targetCount - İstenen soru / öğe sayısı
 */
export function selectBalancedItems(items: Item[], targetCount: number): Item[] {
  if (items.length <= targetCount) {
    return shuffle([...items]);
  }

  // 1. Üniteye (unitId) göre grupla
  const unitMap = new Map<string, Item[]>();
  for (const item of items) {
    const key = item.unitId || "default";
    if (!unitMap.has(key)) {
      unitMap.set(key, []);
    }
    unitMap.get(key)!.push(item);
  }

  // Tek ünite varsa doğrudan karıştır ve al
  if (unitMap.size <= 1) {
    return shuffle([...items]).slice(0, targetCount);
  }

  // 2. Her ünitenin havuzunu kendi içinde karıştır
  // Ünitelerin sırasını da karıştır ki artan slotlar hep aynı üniteye gitmesin
  const pools = shuffle(Array.from(unitMap.values()).map((p) => shuffle([...p])));

  // 3. Adil Round-Robin dağıtımı: her turda her üniteden 1 öğe al
  const selected: Item[] = [];
  while (selected.length < targetCount) {
    let anyAdded = false;
    for (const pool of pools) {
      if (pool.length > 0) {
        selected.push(pool.pop()!);
        anyAdded = true;
        if (selected.length === targetCount) break;
      }
    }
    // Tüm havuzlar tükendiyse çık
    if (!anyAdded) break;
  }

  // 4. Farklı ünitelerden gelen soruları karıştır
  return shuffle(selected);
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
 * Okunuşu döndürür (her zaman İngilizce telaffuz — Faz 5.1).
 * Alan yoksa boş string döner.
 */
export function getPronunciation(
  item: { pronunciationEn?: string },
  _lang?: Lang
): string {
  return item.pronunciationEn || "";
}

/**
 * Rusça metni karşılaştırma için normalize eder (küçük harf, е/ё denkliği).
 */
function normalizeRu(str: string): string {
  return str.toLowerCase().replace(/ё/g, "е");
}

/**
 * Rusça örnek cümlede kelimeyi bularak ___ ile değiştirir.
 * Büyük/küçük harf duyarsızdır ve е/ё esnekliğini destekler.
 * Çekimli Rusça kelimeleri ve bulunamama durumlarını 3 aşamalı mantıkla çözer:
 *  1. Tam eşleşme (exact match): Cümle içindeki hedef kelime veya kelime öbeğini bularak ___ yapar.
 *  2. Kök eşleşmesi (stem match): Kelime çekimlenmişse (örn. ilk 4 veya 3 harf kökü), o kelimeyi ___ ile değiştirir.
 *  3. Bulunamazsa: Hata vermemesi için cümlenin son kelimesini silip ___ koyar (veya cümlenin sonuna ___ ekler).
 */
export function makeSentenceWithBlank(sentence: string, targetWord: string): string {
  if (!sentence) return "___";
  if (!targetWord) return sentence.trimEnd() + " ___";

  // Hedef kelime varyantlarını ayıkla (örn: "друг / подруга" -> ["друг", "подруга"])
  // Parantez içi açıklamaları temizle: "(он) читает" -> "читает"
  const candidates = targetWord
    .split("/")
    .map((w) => w.replace(/\(.*?\)/g, "").trim())
    .filter(Boolean);

  if (candidates.length === 0) candidates.push(targetWord.trim());

  // 1. Tam Eşleşme (Exact Match) — tek kelime veya kelime öbeği
  for (const cand of candidates) {
    const pattern = cand
      .split("")
      .map((ch) => {
        if (ch === "е" || ch === "ё") return "[её]";
        if (ch === "Е" || ch === "Ё") return "[ЕЁ]";
        return escapeRegex(ch);
      })
      .join("");

    const rxExact = new RegExp(`(?<![а-яёА-ЯЁa-zA-Z0-9])${pattern}(?![а-яёА-ЯЁa-zA-Z0-9])`, "iu");
    if (rxExact.test(sentence)) {
      return sentence.replace(rxExact, "___");
    }
  }

  // Cümleyi kelimelere ve aradaki işaretlere/boşluklara ayır
  const tokens = sentence.split(/([а-яёА-ЯЁa-zA-Z0-9-]+)/);

  // 2. Kök Eşleşmesi (Stem Match) — çekimli formlar (örn: зелёный -> зелёная, вода -> воду)
  for (const cand of candidates) {
    const normCand = normalizeRu(cand);
    const stemLengths: number[] = [];
    if (normCand.length >= 4) stemLengths.push(4);
    if (normCand.length >= 3) stemLengths.push(3);

    for (const len of stemLengths) {
      const stem = normCand.slice(0, len);
      let foundIndex = -1;
      for (let i = 0; i < tokens.length; i++) {
        if (/[а-яёА-ЯЁa-zA-Z]/.test(tokens[i])) {
          if (normalizeRu(tokens[i]).startsWith(stem)) {
            foundIndex = i;
            break;
          }
        }
      }
      if (foundIndex !== -1) {
        const res = [...tokens];
        res[foundIndex] = "___";
        return res.join("");
      }
    }
  }

  // 3. Fallback: Kelime hiç bulunamazsa cümlenin son kelimesini silip ___ koy
  let lastWordIndex = -1;
  for (let i = tokens.length - 1; i >= 0; i--) {
    if (/[а-яёА-ЯЁa-zA-Z]/.test(tokens[i])) {
      lastWordIndex = i;
      break;
    }
  }

  if (lastWordIndex !== -1) {
    const res = [...tokens];
    res[lastWordIndex] = "___";
    return res.join("");
  }

  return sentence.trimEnd() + " ___";
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
  const selected = selectBalancedItems(eligible, questionCount);

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
 * exampleRu içindeki Rusça kelimeyi boşlukla (___) değiştirir.
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
  // Sadece örnek cümlesi ve Rusça kelimesi olan öğeler
  const eligible = items.filter((i) => i.exampleRu && i.ru);
  if (eligible.length === 0) return [];

  const questionCount = Math.min(count, eligible.length);
  const selectedItems = selectBalancedItems(eligible, questionCount);

  return selectedItems.map((item) => {
    const sentenceWithBlank = makeSentenceWithBlank(item.exampleRu!, item.ru);
    const fullTranslation = getHighlightedTranslation(item, lang);
    return {
      item,
      sentenceWithBlank,
      correctWord: item.ru,
      hint: getTranslationText(item, lang),
      fullTranslation,
      hintSentence: fullTranslation,
    };
  });
}

/**
 * Örnek cümlenin çevirisinde doğru kelimenin karşılığını bulup { } içine alır.
 * Örn: "The store opens at nine." -> "The store opens at {nine}."
 */
export function getHighlightedTranslation(item: Item, lang: Lang): string {
  const sentence =
    (lang === "tr" ? item.exampleTr : item.exampleEn) ||
    (lang === "tr" ? item.exampleEn : item.exampleTr) ||
    "";
  const word =
    (lang === "tr" ? item.tr : item.en) ||
    (lang === "tr" ? item.en : item.tr) ||
    "";

  if (!sentence || !word) return sentence || word;

  const rawCandidates = word
    .split("/")
    .map((w) => w.replace(/\(.*?\)/g, "").trim())
    .filter(Boolean);
  const candidates = [...rawCandidates];

  rawCandidates.forEach((cand) => {
    if (cand.includes("'s")) candidates.push(cand.replace("'s", " is"));
    if (cand.includes("’s")) candidates.push(cand.replace("’s", " is"));
  });

  // 1. Türkçe (İ/i, I/ı) ve İngilizce büyük/küçük harf duyarsız arama
  for (const cand of candidates) {
    const pattern = cand
      .split("")
      .map((ch) => {
        if (ch === "i" || ch === "İ") return "[iİ]";
        if (ch === "ı" || ch === "I") return "[ıI]";
        return escapeRegex(ch);
      })
      .join("");

    const rx = new RegExp("(" + pattern + ")", "i");
    if (rx.test(sentence)) {
      return sentence.replace(rx, "{$1}");
    }
  }

  // 2. Çok kelimeli kalıplarda parçalı arama
  for (const cand of candidates) {
    const parts = cand.split(/\s+/).filter(Boolean);
    if (parts.length > 1) {
      const allFound = parts.every((p) => {
        const pRx = p
          .split("")
          .map((ch) =>
            ch === "i" || ch === "İ"
              ? "[iİ]"
              : ch === "ı" || ch === "I"
                ? "[ıI]"
                : escapeRegex(ch)
          )
          .join("");
        return new RegExp(pRx, "i").test(sentence);
      });
      if (allFound) {
        const mainPart = parts.slice(0, 3).join(" ");
        const mRx = mainPart
          .split("")
          .map((ch) =>
            ch === "i" || ch === "İ"
              ? "[iİ]"
              : ch === "ı" || ch === "I"
                ? "[ıI]"
                : escapeRegex(ch)
          )
          .join("");
        const rx = new RegExp("(" + mRx + ")", "i");
        if (rx.test(sentence)) {
          return sentence.replace(rx, "{$1}");
        }
      }
    }
  }

  // Fallback: tüm cümle çevirisini göster, boşluğu parantezle belirt
  return `${sentence} ({${word}})`;
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

/** Tekil eşleştirme modunda ekranda gösterilecek maksimum çift sayısı */
export const MATCHING_MAX_PAIRS = 4;

/**
 * Karışık modda bir eşleştirme sorusu için çift sayısını rastgele seçer.
 * Kısa oturumlarda (15 sorudan az) 4-5, daha uzun oturumlarda 4-6 çift.
 */
export function pickMixedMatchingPairCount(sessionCount: number): number {
  const maxPairs = sessionCount >= 15 ? 6 : 5;
  const minPairs = 4;
  return minPairs + Math.floor(Math.random() * (maxPairs - minPairs + 1));
}

/**
 * Eşleştirme sorusu üretir.
 * Sol sütun: ru (sıralı), sağ sütun: çeviri (karışık).
 *
 * @param items     - Tüm kelime öğeleri
 * @param lang      - Çeviri dili
 * @param pairCount - Eşleştirme çifti sayısı (varsayılan 4)
 */
export function generateMatching(
  items: Item[],
  lang: Lang,
  pairCount: number = MATCHING_MAX_PAIRS
): MatchingQuestion {
  const eligible = items.filter((i) => getTranslationText(i, lang) !== "—");
  const actualCount = Math.min(pairCount, eligible.length);
  const selected = selectBalancedItems(eligible, actualCount);

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
  const selected = selectBalancedItems(eligible, questionCount);

  return selected.map((item) => ({
    item,
    correctWord: item.ru,
  }));
}

/* ========================================
   Konuşma (Speaking)
   ======================================== */

/**
 * Konuşma soruları üretir.
 * Kullanıcı ekranda Rusça kelimeyi ve çevirisini görür, mikrofonla telaffuz eder.
 *
 * @param items - Tüm kelime öğeleri
 * @param lang  - Çeviri dili
 * @param count - Soru sayısı
 */
export function generateSpeaking(
  items: Item[],
  lang: Lang,
  count: number = 10
): SpeakingQuestion[] {
  const eligible = items.filter((i) => i.ru && getTranslationText(i, lang) !== "—");
  if (eligible.length === 0) return [];

  const questionCount = Math.min(count, eligible.length);
  const selected = selectBalancedItems(eligible, questionCount);

  return selected.map((item) => ({
    item,
    targetText: item.ru,
    translation: getTranslationText(item, lang),
  }));
}

/* ========================================
   Kelime Bankası (Word Bank / Cümle Kurucu)
   ======================================== */

/**
 * Kelimeyi veya parçasını tüm noktalama işaretlerinden (. , ! ? - — ; : " ' « » vb.) temizler.
 * Sadece harf ve rakamlardan oluşan temiz kelimeleri döndürür.
 * Eğer parça tire (—, -) veya sadece noktalama ise boş döner.
 */
export function cleanPunctuationWord(raw: string): string {
  if (!raw) return "";
  const cleaned = raw
    .replace(/[.,!?;:"'`«»()[\]{}…—]/g, "")
    .replace(/^-+|-+$/g, "")
    .trim();
  if (!cleaned || cleaned === "—" || cleaned === "-") {
    return "";
  }
  return cleaned;
}

/**
 * Kelime Bankası (Cümle Kurucu / Word Bank) soruları üretir.
 * Örnek cümledeki kelimeler ile çeldirici kelimeleri karıştırarak kullanıcıya sunar.
 * Cümle ve çeldiricilerdeki tüm noktalama işaretleri temizlenir.
 *
 * @param items - Tüm kelime öğeleri
 * @param lang  - Çeviri dili
 * @param count - Soru sayısı (varsayılan 10)
 */
export function generateWordBank(
  items: Item[],
  lang: Lang = "tr",
  count: number = 10
): WordBankQuestion[] {
  // Sadece exampleRu ve seçili dile göre çevirisi olan öğeler
  const eligible = items.filter((i) => {
    const hasRu = Boolean(i.exampleRu && i.exampleRu.trim().length > 0);
    const trans = lang === "tr" ? i.exampleTr : i.exampleEn || i.exampleTr;
    const hasTrans = Boolean(trans && trans.trim().length > 0);
    return hasRu && hasTrans;
  });

  if (eligible.length === 0) return [];

  const questionCount = Math.min(count, eligible.length);
  const selected = selectBalancedItems(eligible, questionCount);

  // Çeldiriciler için havuzdaki temiz Rusça kelimeleri topla
  const poolWords = new Set<string>();
  items.forEach((item) => {
    if (item.ru && item.ru.trim() && !item.ru.includes(" ")) {
      const clean = cleanPunctuationWord(item.ru.trim());
      if (clean.length >= 2) {
        poolWords.add(clean);
      }
    }
    if (item.exampleRu && item.exampleRu.trim()) {
      const parts = item.exampleRu.trim().split(/\s+/);
      parts.forEach((p) => {
        const clean = cleanPunctuationWord(p);
        if (clean.length >= 2) {
          poolWords.add(clean);
        }
      });
    }
  });

  return selected.map((item) => {
    const hint = (lang === "tr" ? item.exampleTr : item.exampleEn || item.exampleTr)!.trim();

    // Cümleyi kelimelere ayır ve tüm noktalama işaretlerini (. , ! ? - — vb.) temizle
    const rawParts = item.exampleRu!.trim().split(/\s+/);
    const targetWords = rawParts
      .map(cleanPunctuationWord)
      .filter((w) => w.length > 0);

    // Temizlenmiş kelimelerden oluşan hedef cümle
    const targetSentence = targetWords.join(" ");

    // Hedef kelimelerin normalizasyonu (çeldirici çakışmasını engellemek için)
    const targetWordNorms = new Set(
      targetWords.map((w) => w.toLowerCase().replace(/[^а-яёa-z0-9]/gi, ""))
    );

    // Çeldirici adayları (sadece hedefte olmayan temiz kelimeler)
    const candidates = Array.from(poolWords).filter((w) => {
      const norm = w.toLowerCase().replace(/[^а-яёa-z0-9]/gi, "");
      return norm.length > 0 && !targetWordNorms.has(norm);
    });

    const shuffledCandidates = shuffle([...candidates]);
    const distractorCount = Math.min(
      Math.floor(Math.random() * 2) + 3, // 3 veya 4 adet
      shuffledCandidates.length
    );
    const distractors = shuffledCandidates.slice(0, distractorCount);

    const allWords = [...targetWords, ...distractors];
    const shuffledWords = shuffle([...allWords]);

    return {
      item,
      targetSentence,
      hint,
      targetWords,
      shuffledWords,
    };
  });
}

/* ========================================
   Karışık Alıştırma (Mixed Practice)
   ======================================== */

/** Karışık oturumdaki tek bir soru */
export type MixedQuestion =
  | { kind: "multipleChoice"; data: MultipleChoiceQuestion }
  | { kind: "fillBlank"; data: FillBlankQuestion }
  | { kind: "matching"; data: MatchingQuestion }
  | { kind: "listening"; data: ListeningQuestion }
  | { kind: "speaking"; data: SpeakingQuestion }
  | { kind: "wordBank"; data: WordBankQuestion };


/**
 * Karışık alıştırma oturumu üretir.
 * Soru tipleri rastgele dağıtılır; uygun olmayan tipler atlanır
 * (örn. TTS yoksa dinleme, mikrofon desteği yoksa konuşma, örnek cümle yoksa boşluk doldurma).
 * Bir eşleştirme sorusu tek soru sayılır.
 *
 * @param items           - Kelime öğeleri (type="word")
 * @param lang            - Çeviri dili
 * @param count           - Toplam soru sayısı (varsayılan 10)
 * @param ttsSupported    - Tarayıcı ses okumayı destekliyor mu
 * @param speechSupported - Tarayıcı konuşma tanımayı destekliyor mu
 */
export function generateMixedPractice(
  items: Item[],
  lang: Lang,
  count: number = 10,
  ttsSupported: boolean = true,
  speechSupported: boolean = false
): MixedQuestion[] {
  const withTranslation = items.filter((i) => getTranslationText(i, lang) !== "—");
  const withExample = items.filter((i) => i.exampleRu && i.ru);

  // Kullanılabilir tipler
  const kinds: MixedQuestion["kind"][] = [];
  if (withTranslation.length >= 2) kinds.push("multipleChoice");
  if (withExample.length > 0) kinds.push("fillBlank");
  if (withTranslation.length >= 3) kinds.push("matching");
  if (ttsSupported && items.length > 0) kinds.push("listening");
  if (speechSupported && items.length > 0) kinds.push("speaking");
  if (withExample.length > 0) kinds.push("wordBank");
  if (kinds.length === 0) return [];

  // Her slot için rastgele tip seç (eşleştirme en fazla 2 kez, konuşma en fazla 1 veya 2 kez)
  const plan: Record<MixedQuestion["kind"], number> = {
    multipleChoice: 0,
    fillBlank: 0,
    matching: 0,
    listening: 0,
    speaking: 0,
    wordBank: 0,
  };

  const maxSpeaking = count >= 20 ? 2 : 1;

  for (let s = 0; s < count; s++) {
    let kind = kinds[Math.floor(Math.random() * kinds.length)];
    if (
      (kind === "matching" && plan.matching >= 2) ||
      (kind === "speaking" && plan.speaking >= maxSpeaking)
    ) {
      const others = kinds.filter(
        (k) =>
          (k !== "matching" || plan.matching < 2) &&
          (k !== "speaking" || plan.speaking < maxSpeaking)
      );
      if (others.length > 0) {
        kind = others[Math.floor(Math.random() * others.length)];
      }
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
      data: generateMatching(items, lang, pickMixedMatchingPairCount(count)),
    })),
    ...generateListening(items, plan.listening).map(
      (data) => ({ kind: "listening" as const, data })
    ),
    ...generateSpeaking(items, lang, plan.speaking).map(
      (data) => ({ kind: "speaking" as const, data })
    ),
    ...generateWordBank(items, lang, plan.wordBank).map(
      (data) => ({ kind: "wordBank" as const, data })
    ),
  ];

  return shuffle(questions).slice(0, count);
}
