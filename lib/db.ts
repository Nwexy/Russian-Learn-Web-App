/**
 * Dexie.js (IndexedDB) veritabanı tanımı.
 * Tüm uygulama verileri tarayıcıda yerel olarak saklanır.
 * İnternet bağlantısı gerekmez.
 */

import Dexie, { type Table } from "dexie";
import type { Item, Review, Progress, Setting, Mistake, GrammarProgress } from "@/types";

/**
 * RussianLearnDB — IndexedDB üzerinde çalışan yerel veritabanı.
 * Tablolar:
 *  - items: Öğrenme öğeleri (harf, kelime, kalıp vb.)
 *  - reviews: SRS tekrar kayıtları
 *  - progress: Ünite ilerleme durumları
 *  - settings: Uygulama ayarları (tema, uiLang, translationLang, showPronunciation: "true"|"false")
 *  - mistakes: Yanlış yapılan sorular (Faz 3.5)
 *  - grammarProgress: Gramer notları ilerleme durumları (Faz 5)
 */
class RussianLearnDB extends Dexie {
  items!: Table<Item, string>;
  reviews!: Table<Review, string>;
  progress!: Table<Progress, string>;
  settings!: Table<Setting, string>;
  mistakes!: Table<Mistake, number>;
  grammarProgress!: Table<GrammarProgress, string>;

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

    // Sürüm 3: grammarProgress tablosu eklendi (Faz 5)
    this.version(3).stores({
      items: "id, unitId, type, tags",
      reviews: "itemId, due",
      progress: "unitId",
      settings: "key",
      mistakes: "++id, [exerciseType+itemId], exerciseType, itemId, createdAt",
      grammarProgress: "noteId, completed, lastViewedAt, completedAt",
    });

    // Sürüm 4: userStats tablosu eklendi (önceki adım)
    this.version(4).stores({
      items: "id, unitId, type, tags",
      reviews: "itemId, due",
      progress: "unitId",
      settings: "key",
      mistakes: "++id, [exerciseType+itemId], exerciseType, itemId, createdAt",
      grammarProgress: "noteId, completed, lastViewedAt, completedAt",
      userStats: "id",
    });

    // Sürüm 5: userStats tablosu kaldırıldı (Faz 7)
    this.version(5).stores({
      userStats: null,
    });
  }
}

/** Singleton veritabanı örneği */
export const db = new RussianLearnDB();
