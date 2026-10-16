/**
 * Dexie.js (IndexedDB) veritabanı tanımı.
 * Tüm uygulama verileri tarayıcıda yerel olarak saklanır.
 * İnternet bağlantısı gerekmez.
 */

import Dexie, { type Table } from "dexie";
import type { Item, Review, Progress, Setting } from "@/types";

/**
 * RussianLearnDB — IndexedDB üzerinde çalışan yerel veritabanı.
 * Tablolar:
 *  - items: Öğrenme öğeleri (harf, kelime, kalıp vb.)
 *  - reviews: SRS tekrar kayıtları (Faz 2)
 *  - progress: Ünite ilerleme durumları
 *  - settings: Uygulama ayarları (tema vb.)
 */
class RussianLearnDB extends Dexie {
  items!: Table<Item, string>;
  reviews!: Table<Review, string>;
  progress!: Table<Progress, string>;
  settings!: Table<Setting, string>;

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
  }
}

/** Singleton veritabanı örneği */
export const db = new RussianLearnDB();
