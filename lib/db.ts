/**
 * Dexie.js (IndexedDB) veritabanı tanımı.
 * Tüm uygulama verileri tarayıcıda yerel olarak saklanır.
 * İnternet bağlantısı gerekmez.
 */

import Dexie, { type Table } from "dexie";
import type { Item, Review, Progress, Setting, Mistake } from "@/types";

/**
 * RussianLearnDB — IndexedDB üzerinde çalışan yerel veritabanı.
 * Tablolar:
 *  - items: Öğrenme öğeleri (harf, kelime, kalıp vb.)
 *  - reviews: SRS tekrar kayıtları
 *  - progress: Ünite ilerleme durumları
 *  - settings: Uygulama ayarları (tema, uiLang, translationLang, showPronunciation: "true"|"false")
 *  - mistakes: Yanlış yapılan sorular (Faz 3.5)
 */
class RussianLearnDB extends Dexie {
  items!: Table<Item, string>;
  reviews!: Table<Review, string>;
  progress!: Table<Progress, string>;
  settings!: Table<Setting, string>;
  mistakes!: Table<Mistake, number>;

  constructor() {
    super("RussianLearnDB");

    // Veritabanı şeması — sürüm 1
    // İndekslenecek alanlar belirtilir; diğer alanlar otomatik saklanır.
    this.version(1).stores({
      items: "id, unitId, type, tags",
      reviews: "itemId, due",
      progress: "unitId",
      settings: "key",
    });

    // Sürüm 2: mistakes tablosu eklendi
    // Mevcut tablolar aynı kalır, yeni tablo eklenir.
    // [exerciseType+itemId] bileşik indeks — aynı soru için tek kayıt tutulur.
    this.version(2).stores({
      items: "id, unitId, type, tags",
      reviews: "itemId, due",
      progress: "unitId",
      settings: "key",
      mistakes: "++id, [exerciseType+itemId], exerciseType, itemId, createdAt",
    });
  }
}

/** Singleton veritabanı örneği */
export const db = new RussianLearnDB();
