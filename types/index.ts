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

/** Ünite ilerleme kaydı */
export interface Progress {
  unitId: string;
  completed: boolean;
  score: number;       // 0-100 arası puan
  updatedAt: Date;
}

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
