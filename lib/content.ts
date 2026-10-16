/**
 * İçerik yönetimi modülü.
 * content/ klasöründeki JSON dosyalarını okuyup Dexie'ye yükler.
 * Yoksa ekle, varsa güncelle (upsert) mantığıyla çalışır.
 */

import { db } from "@/lib/db";
import type { UnitData, Item } from "@/types";

/**
 * Tüm ünite verilerini içe aktarır.
 * Her ünite JSON modülü statik olarak import edilir (Next.js bundling).
 *
 * Yeni ünite eklemek için:
 *  1. content/ içine JSON dosyası koy
 *  2. Bu dosyada UNIT_MODULES dizisine import ekle
 */

// Statik import — content/ altındaki tüm ünite dosyaları
// Yeni ünite eklerken buraya bir satır eklemen yeterli.
import unitAlphabet from "@/content/unit-00-alphabet.json";

const UNIT_MODULES: UnitData[] = [
  unitAlphabet as UnitData,
];

/**
 * Tüm üniteleri döndürür (başlık ve meta bilgi).
 * Sayfalar arası navigasyonda kullanılır.
 */
export function getAllUnits(): { id: string; title: string; level: string; itemCount: number }[] {
  return UNIT_MODULES.map((unit) => ({
    id: unit.id,
    title: unit.title,
    level: unit.level,
    itemCount: unit.items.length,
  }));
}

/**
 * Belirli bir ünitenin verisini döndürür.
 */
export function getUnitById(unitId: string): UnitData | undefined {
  return UNIT_MODULES.find((u) => u.id === unitId);
}

/**
 * Tüm ünitelerin öğelerini Dexie'ye yükler (upsert).
 * Uygulama ilk açılışta veya içerik güncellendiğinde çağrılır.
 *
 * - Yoksa ekler (put).
 * - Varsa günceller (put aynı id ile üzerine yazar).
 */
export async function seedDatabase(): Promise<void> {
  for (const unit of UNIT_MODULES) {
    const items: Item[] = unit.items.map((raw) => ({
      id: raw.id,
      unitId: unit.id,
      type: raw.type,
      ru: raw.ru,
      tr: raw.tr,
      en: raw.en,
      exampleRu: raw.exampleRu,
      exampleTr: raw.exampleTr,
      exampleEn: raw.exampleEn,
      tags: raw.tags,
    }));

    // bulkPut: varsa güncelle, yoksa ekle
    await db.items.bulkPut(items);
  }
}
