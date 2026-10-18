/**
 * İçerik yönetimi modülü.
 * content/ klasöründeki JSON dosyalarını okuyup Dexie'ye yükler.
 * Yoksa ekle, varsa güncelle (upsert) mantığıyla çalışır.
 */

import { db } from "@/lib/db";
import type { UnitData, Item, Lang } from "@/types";

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
import unitGreetings from "@/content/unit-01-greetings.json";
import unitNumbers from "@/content/unit-02-numbers.json";
import unitColors from "@/content/unit-03-colors.json";
import unitFamily from "@/content/unit-04-family.json";
import unitVerbs from "@/content/unit-05-verbs.json";
import unitAdjectives from "@/content/unit-06-adjectives.json";
import unitFood from "@/content/unit-07-food.json";
import unitHobbies from "@/content/unit-08-hobbies.json";
import unitWeather from "@/content/unit-09-weather.json";
import unitTime from "@/content/unit-10-time.json";
import unitHouse from "@/content/unit-11-house.json";
import unitCity from "@/content/unit-12-city.json";
import unitClothes from "@/content/unit-13-clothes.json";
import unitBody from "@/content/unit-14-body.json";

const UNIT_MODULES: UnitData[] = [
  unitAlphabet as UnitData,
  unitGreetings as UnitData,
  unitNumbers as UnitData,
  unitColors as UnitData,
  unitFamily as UnitData,
  unitVerbs as UnitData,
  unitAdjectives as UnitData,
  unitFood as UnitData,
  unitHobbies as UnitData,
  unitWeather as UnitData,
  unitTime as UnitData,
  unitHouse as UnitData,
  unitCity as UnitData,
  unitClothes as UnitData,
  unitBody as UnitData,
];

/**
 * Arayüz diline göre ünite başlığını döndürür.
 * uiLang "tr" ise titleTr, "en" ise titleEn kullanılır.
 */
export function getUnitTitle(unit: { titleTr: string; titleEn: string }, uiLang: Lang): string {
  return uiLang === "tr" ? unit.titleTr : unit.titleEn;
}

/**
 * Ünitede alıştırma/test yapılabilecek (type="word") öğe var mı?
 * Sadece harf içeren üniteler (alfabe) için false döner.
 */
export function unitHasExercises(unit: { items: { type: string }[] }): boolean {
  return unit.items.some((i) => i.type === "word");
}

/**
 * Tüm üniteleri döndürür (başlık ve meta bilgi).
 * Sayfalar arası navigasyonda kullanılır.
 */
export function getAllUnits(): {
  id: string;
  titleTr: string;
  titleEn: string;
  level: string;
  itemCount: number;
  hasExercises: boolean;
}[] {
  return UNIT_MODULES.map((unit) => ({
    id: unit.id,
    titleTr: unit.titleTr,
    titleEn: unit.titleEn,
    level: unit.level,
    itemCount: unit.items.length,
    hasExercises: unitHasExercises(unit),
  }));
}

/**
 * Belirli bir ünitenin verisini döndürür.
 */
export function getUnitById(unitId: string): UnitData | undefined {
  if (!unitId) return undefined;
  return UNIT_MODULES.find(
    (u) => u.id === unitId || unitId.startsWith(u.id) || u.id.startsWith(unitId)
  );
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
      pronunciationEn: raw.pronunciationEn,
      numberValue: raw.numberValue,
      hexCode: raw.hexCode,
      tags: raw.tags,
    }));

    // bulkPut: varsa güncelle, yoksa ekle
    await db.items.bulkPut(items);
  }
}

// Faz 7.6: Doğrusal ilerleme kontrolü re-export
export { isUnitUnlocked } from "@/lib/progress";
