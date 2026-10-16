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
 * Ünitenin genel durumunu döndürür.
 */
export async function getUnitStatus(unitId: string): Promise<UnitStatus> {
  const prog = await getProgress(unitId);

  if (prog.lessonDone && prog.practiceDone && prog.testDone) {
    return "completed";
  }
  if (prog.lessonDone || prog.practiceDone || prog.testDone) {
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
