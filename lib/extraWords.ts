/**
 * Örnek cümlelerden (exampleRu) ana kelime olmayan yardımcı / ekstra kelimeleri çıkarma modülü.
 * Faz 11.2: "Include All Words" açıkken havuza bu ekstra kelimeler de dahil edilir.
 */

import { getAllUnits, getUnitById } from "@/lib/content";
import type { Item, UnitData } from "@/types";

// Statik import edilen modülleri content.ts üzerinden alabiliriz veya doğrudan okuyabiliriz
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

const ALL_UNIT_DATA: UnitData[] = [
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
 * Açık olan ünitelerin örnek cümlelerindeki (exampleRu) ana kelime harici ekstra kelimeleri çıkarır.
 *
 * @param unlockedUnitIds - Açık/tamamlanmış ünite ID'leri kümesi
 * @returns Ekstra kelimeler listesi (Item formatında, id: "extra_...")
 */
export function extractExtraWords(unlockedUnitIds: Set<string> | string[]): Item[] {
  const allowedSet =
    unlockedUnitIds instanceof Set ? unlockedUnitIds : new Set(unlockedUnitIds);

  // Sadece kilitleri açılmış üniteleri al
  const activeUnits = ALL_UNIT_DATA.filter((unit) => allowedSet.has(unit.id));

  // 1. Tüm açık ünitelerdeki ana kelimeleri topla (normalize edilmiş Set)
  const mainWordsSet = new Set<string>();

  for (const unit of activeUnits) {
    for (const item of unit.items) {
      if (item.ru) {
        const clean = item.ru.trim().toLowerCase();
        mainWordsSet.add(clean);

        // Eğer kelime birden fazla kelimeden oluşuyorsa (örn: "до свидания"), parçalarını da ekle
        const parts = clean.match(/[а-яё]+/gu);
        if (parts && parts.length > 1) {
          for (const p of parts) {
            mainWordsSet.add(p);
          }
        }
      }
    }
  }

  // 2. Örnek cümlelerden ekstra kelimeleri ayıkla
  const extraWordsMap = new Map<string, Item>();

  for (const unit of activeUnits) {
    for (const item of unit.items) {
      if (!item.exampleRu) continue;

      // Cümledeki Kiril harfli kelimeleri ayıkla
      const wordsInSentence = item.exampleRu.match(/[а-яА-ЯёЁ]+/gu);
      if (!wordsInSentence) continue;

      for (const rawWord of wordsInSentence) {
        const norm = rawWord.trim().toLowerCase();

        // En az 2 harfli olmalı (tek harfli edat veya rastgele harfler hariç)
        if (norm.length < 2) continue;

        // Ana kelimeler kümesinde varsa ekstra kelime değildir
        if (mainWordsSet.has(norm)) continue;

        // Zaten bu ekstra kelimeyi eklediysek tekrar ekleme (tekilleştir)
        if (extraWordsMap.has(norm)) continue;

        // Yeni ekstra kelime kartı oluştur
        const extraItem: Item = {
          id: `extra_${norm}`,
          unitId: unit.id,
          type: "word",
          ru: norm,
          tr: item.exampleTr || "",
          en: item.exampleEn || "",
          exampleRu: item.exampleRu,
          exampleTr: item.exampleTr,
          exampleEn: item.exampleEn,
          tags: ["extra"],
        };

        extraWordsMap.set(norm, extraItem);
      }
    }
  }

  return Array.from(extraWordsMap.values());
}
