/**
 * Uygulamada kullanılan tüm TypeScript tip tanımları.
 * Her tablo ve veri yapısı burada merkezi olarak tanımlanır.
 */

/** Desteklenen diller */
export type Lang = "tr" | "en";

/** Öğrenme öğesi türleri */
export type ItemType = "letter" | "word" | "phrase" | "grammar";

/** Dexie items tablosundaki bir öğe */
export interface Item {
  id: string;
  unitId: string;
  type: ItemType;
  ru: string;          // Rusça metin
  tr?: string;         // Türkçe karşılık
  en?: string;         // İngilizce karşılık
  exampleRu?: string;  // Rusça örnek cümle
  exampleTr?: string;  // Türkçe örnek cümle
  exampleEn?: string;  // İngilizce örnek cümle
  pronunciationTr?: string;  // Türkçe okunuş (vurgulu hece büyük harf)
  pronunciationEn?: string;  // İngilizce okunuş (vurgulu hece büyük harf)
  numberValue?: number;      // Sayısal değer (örn. 0-100)
  tags?: string[];     // Etiketler (opsiyonel)
}

/** SRS tekrar kaydı (Faz 2 için hazırlık) */
export interface Review {
  itemId: string;
  due: Date;
  interval: number;    // Gün cinsinden tekrar aralığı
  ease: number;        // Kolaylık faktörü
  reps: number;        // Toplam tekrar sayısı
  lapses: number;      // Unutma sayısı
  lastReviewed?: Date;
}

/** Ünite ilerleme kaydı — 3 aşamalı (Ders, Alıştırma, Test) */
export interface Progress {
  unitId: string;
  lessonDone: boolean;       // Ders tamamlandı mı
  practiceDone: boolean;     // Alıştırma geçildi mi (>= %80)
  testDone: boolean;         // Test geçildi mi (>= %80)
  practiceScore: number;     // Alıştırma puanı (0-100)
  testScore: number;         // Test puanı (0-100)
  updatedAt: Date;
}

/** Ünite genel durum */
export type UnitStatus = "notStarted" | "inProgress" | "completed";

/** Uygulama ayarları (key-value) */
export interface Setting {
  key: string;
  value: string;
}

/** JSON dosyasındaki ham öğe (unitId henüz yok) */
export interface RawItem {
  id: string;
  type: ItemType;
  ru: string;
  tr?: string;
  en?: string;
  exampleRu?: string;
  exampleTr?: string;
  exampleEn?: string;
  pronunciationTr?: string;
  pronunciationEn?: string;
  numberValue?: number;
  tags?: string[];
}

/** content/ klasöründeki ünite JSON yapısı */
export interface UnitData {
  id: string;
  titleTr: string;
  titleEn: string;
  level: string;
  items: RawItem[];
}

/** Alıştırma tipleri */
export type ExerciseType = "multipleChoice" | "fillBlank" | "matching" | "listening";

/** Yanlış yapılan soru kaydı (Dexie mistakes tablosu) */
export interface Mistake {
  id?: number;               // auto-increment
  exerciseType: ExerciseType;
  itemId: string;
  questionData: Record<string, unknown>;  // Sorunun yeniden üretilebilmesi için veri
  userAnswer: string;        // Kullanıcının verdiği cevap
  correctAnswer: string;     // Doğru cevap
  createdAt: Date;
  lastTriedAt: Date;
  timesWrong: number;        // Bu soru kaç kez yanlış yapıldı
}

/** Dexie grammarProgress tablosundaki kayıt (Faz 5) */
export interface GrammarProgress {
  noteId: string;            // primary key
  completed: boolean;
  lastViewedAt: Date;
  completedAt?: Date;
}

/** Gramer içerik bölümleri */
export type GrammarSection =
  | { type: "text"; bodyTr: string; bodyEn: string }
  | {
      type: "table";
      headersTr: string[];
      headersEn: string[];
      rows: { cellsTr: string[]; cellsEn: string[] }[];
    }
  | {
      type: "examples";
      items: { ru: string; tr: string; en: string; note?: string }[];
    };

/** Gramer mini alıştırma sorusu */
export interface MiniExercise {
  type: "multipleChoice";
  question: string;
  questionLang: "ru" | "tr" | "en";
  options: string[];
  correctIndex: number;
  explanationTr: string;
  explanationEn: string;
}

/** Gramer notu yapısı */
export interface GrammarNote {
  id: string;
  level: string;
  titleTr: string;
  titleEn: string;
  summaryTr: string;
  summaryEn: string;
  sections: GrammarSection[];
  relatedUnits: string[];
  miniExercises: MiniExercise[];
}

