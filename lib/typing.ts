import { RUSSIAN_WORDS } from "./russian-words";

export type TypingDifficulty = "very-easy" | "easy" | "medium" | "hard" | "very-hard";

export interface DifficultyOption {
  id: TypingDifficulty;
  labelEn: string;
  labelTr: string;
  descEn: string;
  descTr: string;
}

export const TYPING_DIFFICULTIES: DifficultyOption[] = [
  {
    id: "very-easy",
    labelEn: "Very Easy",
    labelTr: "Çok Kolay",
    descEn: "1-3 letters (дом, кот, да)",
    descTr: "1-3 harfli (дом, кот, да)",
  },
  {
    id: "easy",
    labelEn: "Easy",
    labelTr: "Kolay",
    descEn: "4-5 letters (книга, вода)",
    descTr: "4-5 harfli (книга, вода)",
  },
  {
    id: "medium",
    labelEn: "Medium",
    labelTr: "Orta",
    descEn: "6-7 letters (человек, машина)",
    descTr: "6-7 harfli (человек, машина)",
  },
  {
    id: "hard",
    labelEn: "Hard",
    labelTr: "Zor",
    descEn: "8-10 letters (университет, интересный)",
    descTr: "8-10 harfli (университет, интересный)",
  },
  {
    id: "very-hard",
    labelEn: "Very Hard",
    labelTr: "Çok Zor",
    descEn: "10+ letters or ъ, ь, щ (объявление, борщ)",
    descTr: "10+ harf veya ъ, ь, щ (объявление, борщ)",
  },
];

/**
 * Zorluk derecesine göre kelimeleri filtreleme fonksiyonu.
 * TypeScript `filter` ve `length` metodları kullanılarak kelime uzunluğuna göre filtrelenir.
 */
export function filterWordsByDifficulty(difficulty: TypingDifficulty): string[] {
  let pool: string[] = [];

  switch (difficulty) {
    case "very-easy":
      // Sadece 1-3 harfli kelimeler (дом, кот, да)
      pool = RUSSIAN_WORDS.filter((w) => w.length >= 1 && w.length <= 3);
      break;

    case "easy":
      // 4-5 harfli kelimeler (книга, вода)
      pool = RUSSIAN_WORDS.filter((w) => w.length >= 4 && w.length <= 5);
      break;

    case "medium":
      // 6-7 harfli kelimeler (человек, машина)
      pool = RUSSIAN_WORDS.filter((w) => w.length >= 6 && w.length <= 7);
      break;

    case "hard":
      // 8-10 harfli kelimeler (университет, интересный)
      pool = RUSSIAN_WORDS.filter((w) => w.length >= 8 && w.length <= 10);
      break;

    case "very-hard":
      // 10+ harfli kelimeler veya içinde ъ, ь, щ gibi zor harfler barındıranlar
      pool = RUSSIAN_WORDS.filter((w) => w.length >= 10 || /[ъьщ]/i.test(w));
      break;

    default:
      pool = RUSSIAN_WORDS;
      break;
  }

  // Eğer seçilen zorlukta yeterli kelime yoksa, diğer havuzlardan takviye yap
  if (pool.length < 20) {
    const supplement = RUSSIAN_WORDS.filter((w) => !pool.includes(w));
    pool = [...pool, ...supplement];
  }

  return pool;
}

export interface GenerateTypingWordsOptions {
  count: number;
  difficulty: TypingDifficulty;
  punctuation?: boolean;
  numbers?: boolean;
}

/**
 * Monkeytype kelime üreticisi.
 * Zorluk seviyesine göre filtrelenmiş havuzdan kelimeleri seçer,
 * isteğe bağlı olarak noktalama işaretleri (punct) ve sayılar (numbers) ekler.
 */
export function generateTypingWords(options: GenerateTypingWordsOptions): string[] {
  const { count, difficulty, punctuation = false, numbers = false } = options;
  const pool = filterWordsByDifficulty(difficulty);

  const punctuations = [".", ",", "!", "?", ";", ":"];
  const result: string[] = [];

  for (let i = 0; i < count; i++) {
    // Sayılar açıksa yaklaşık %10 olasılıkla rastgele sayı ekle
    if (numbers && Math.random() < 0.1) {
      const num = Math.floor(Math.random() * 999) + 1;
      result.push(num.toString());
      continue;
    }

    let word = pool[Math.floor(Math.random() * pool.length)] || "дом";

    // Noktalama işaretleri açıksa büyük harf ve noktalama ekle
    if (punctuation) {
      if (i === 0 || Math.random() < 0.22) {
        word = word.charAt(0).toUpperCase() + word.slice(1);
      }
      if (Math.random() < 0.25) {
        const p = punctuations[Math.floor(Math.random() * punctuations.length)];
        word = word + p;
      }
    }

    result.push(word);
  }

  return result;
}
