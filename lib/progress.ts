/**
 * Ünite ilerleme yönetimi.
 * Dexie progress tablosu üzerinden 3 aşamalı (Ders, Alıştırma, Test) ilerleme takibi.
 */

import { db } from "@/lib/db";
import type { Progress, UnitStatus } from "@/types";

/**
 * Belirli bir ünitenin ilerleme kaydını döndürür.
 * Kayıt yoksa varsayılan (boş) kayıt döner.
 */
export async function getProgress(unitId: string): Promise<Progress> {
  const existing = await db.progress.get(unitId);
  if (existing) return existing;

  return {
    unitId,
    lessonDone: false,
    practiceDone: false,
    testDone: false,
    practiceScore: 0,
    testScore: 0,
    updatedAt: new Date(),
  };
}

/**
 * Ders aşamasını tamamlandı olarak işaretle.
 */
export async function setLessonComplete(unitId: string): Promise<void> {
  const prog = await getProgress(unitId);
  prog.lessonDone = true;
  prog.updatedAt = new Date();
  await db.progress.put(prog);
}

/**
 * Alıştırma aşamasını kaydet.
 * score >= 80 ise practiceDone = true.
 */
export async function setPracticeComplete(unitId: string, score: number): Promise<void> {
  const prog = await getProgress(unitId);
  prog.practiceScore = score;
  if (score >= 80) prog.practiceDone = true;
  prog.updatedAt = new Date();
  await db.progress.put(prog);
}

/**
 * Test aşamasını kaydet.
 * score >= 80 ise testDone = true.
 */
export async function setTestComplete(unitId: string, score: number): Promise<void> {
  const prog = await getProgress(unitId);
  prog.testScore = score;
  if (score >= 80) prog.testDone = true;
  prog.updatedAt = new Date();
  await db.progress.put(prog);
}

/**
 * Kullanıcının kilitli bir üniteyi onay vererek manuel olarak açmasını (kilidi aşmasını) sağlar.
 * Faz 11.5: forceUnlocked = true olarak kaydedilir.
 */
export async function setForceUnlocked(unitId: string): Promise<void> {
  const prog = await getProgress(unitId);
  prog.forceUnlocked = true;
  prog.updatedAt = new Date();
  await db.progress.put(prog);
}

import { getUnitById, unitHasExercises } from "@/lib/content";

/**
 * Ünitenin genel durumunu döndürür.
 * - Alıştırması olmayan (alfabe gibi) ünitelerde sadece ders tamamlandığında "completed" olur.
 * - Alıştırmalı ünitelerde ders ve test tamamlandığında "completed" olur (test üniteyi tamamlar).
 */
export async function getUnitStatus(unitId: string): Promise<UnitStatus> {
  const prog = await getProgress(unitId);
  const unit = getUnitById(unitId);
  const hasExercises = unit ? unitHasExercises(unit) : true;

  if (!hasExercises) {
    return prog.lessonDone ? "completed" : "notStarted";
  }

  if (prog.lessonDone && prog.testDone) {
    return "completed";
  }
  if (prog.testDone) {
    return "completed";
  }
  if (prog.lessonDone || prog.practiceDone || prog.testScore > 0 || prog.practiceScore > 0) {
    return "inProgress";
  }
  return "notStarted";
}

/**
 * Tüm ünitelerin ilerleme kayıtlarını döndürür.
 */
export async function getAllProgress(): Promise<Progress[]> {
  return db.progress.toArray();
}

/**
 * Bir ünitenin kilitli olup olmadığını doğrusal ilerleme kuralına göre hesaplar.
 * - allUnits dizisi ID'lerine göre sıralanır (unit-00, unit-01, unit-02...).
 * - İlk ünite (Alfabe / unit-00) HER ZAMAN açıktır.
 * - Diğer üniteler için: Bir önceki ünitenin lessonDone ve testDone değerlerine bakılır.
 *   (Alfabe ünitesi veya alıştırmasız ünite ise sadece lessonDone yeterlidir, çünkü testi yoktur).
 * - Eğer bir önceki ünite tamamlanmamışsa sıradaki ünite KİLİTLİDİR (false).
 * - Tamamlanmışsa açıktır (true).
 */
export function isUnitUnlocked(
  unitId: string,
  allUnits: { id: string; hasExercises?: boolean }[],
  allProgress: Progress[] | Record<string, Progress>
): boolean {
  // allUnits dizisini ID'lerine göre sırala (örn: unit-00, unit-01, unit-02...)
  const sortedUnits = [...allUnits].sort((a, b) => a.id.localeCompare(b.id));
  const targetIndex = sortedUnits.findIndex((u) => u.id === unitId);

  // İlk ünite (unit-00) veya bulunamayan ünite her zaman açıktır
  if (targetIndex <= 0) {
    return true;
  }

  const getProg = (id: string): Progress | undefined => {
    if (Array.isArray(allProgress)) {
      return allProgress.find((p) => p.unitId === id);
    }
    return allProgress[id];
  };

  // Faz 11.5: Eğer bu ünite manuel olarak açılmışsa (forceUnlocked === true) açıktır
  const targetProg = getProg(unitId);
  if (targetProg?.forceUnlocked) {
    return true;
  }

  // Doğrusal ilerleme: Hedef üniteye kadar olan tüm önceki ünitelerin tamamlanmış olması gerekir
  for (let i = 0; i < targetIndex; i++) {
    const prevUnit = sortedUnits[i];
    const prevProg = getProg(prevUnit.id);
    if (!prevProg) {
      return false;
    }

    const prevHasNoExercises = prevUnit.id === "unit-00" || prevUnit.hasExercises === false;
    if (prevHasNoExercises) {
      if (!prevProg.lessonDone) {
        return false;
      }
    } else {
      if (!prevProg.lessonDone || !prevProg.testDone) {
        return false;
      }
    }
  }

  return true;
}
