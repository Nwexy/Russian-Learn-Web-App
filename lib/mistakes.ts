/**
 * Mistakes tablosu yardımcı fonksiyonları.
 * Yanlış yapılan soruları kaydet, güncelle, sil.
 *
 * Aynı itemId + exerciseType için tek kayıt tutulur.
 * Tekrar yanlış yapılırsa mevcut kayıt güncellenir.
 * Bir kez doğru yapılırsa kayıt silinir.
 */

import { db } from "@/lib/db";
import type { Mistake, ExerciseType } from "@/types";

/**
 * Yanlış cevabı kaydet.
 * Aynı exerciseType + itemId varsa güncelle, yoksa yeni oluştur.
 */
export async function recordMistake(data: {
  exerciseType: ExerciseType;
  itemId: string;
  questionData: Record<string, unknown>;
  userAnswer: string;
  correctAnswer: string;
}): Promise<void> {
  const now = new Date();

  // Mevcut kaydı bul (bileşik indeks ile)
  const existing = await db.mistakes
    .where("[exerciseType+itemId]")
    .equals([data.exerciseType, data.itemId])
    .first();

  if (existing) {
    // Güncelle: timesWrong+1, son cevabı ve tarihi güncelle
    await db.mistakes.update(existing.id!, {
      userAnswer: data.userAnswer,
      correctAnswer: data.correctAnswer,
      questionData: data.questionData,
      lastTriedAt: now,
      timesWrong: existing.timesWrong + 1,
    });
  } else {
    // Yeni kayıt
    await db.mistakes.add({
      exerciseType: data.exerciseType,
      itemId: data.itemId,
      questionData: data.questionData,
      userAnswer: data.userAnswer,
      correctAnswer: data.correctAnswer,
      createdAt: now,
      lastTriedAt: now,
      timesWrong: 1,
    });
  }
}

/**
 * ID ile tek kayıt sil.
 */
export async function removeMistake(id: number): Promise<void> {
  await db.mistakes.delete(id);
}

/**
 * exerciseType + itemId eşleşen kaydı sil.
 * Bir soruyu doğru yapınca çağrılır.
 */
export async function removeMistakeByKey(
  exerciseType: ExerciseType,
  itemId: string
): Promise<void> {
  await db.mistakes
    .where("[exerciseType+itemId]")
    .equals([exerciseType, itemId])
    .delete();
}

/**
 * Tüm yanlış kayıtlarını döndür (createdAt sırasıyla).
 */
export async function getAllMistakes(): Promise<Mistake[]> {
  return db.mistakes.orderBy("createdAt").toArray();
}

/**
 * Toplam yanlış kayıt sayısını döndür.
 */
export async function getMistakeCount(): Promise<number> {
  return db.mistakes.count();
}

/**
 * Tüm yanlış kayıtlarını sil.
 * Ayarlar sayfasındaki "Yanlışları Temizle" için.
 */
export async function clearAllMistakes(): Promise<void> {
  await db.mistakes.clear();
}
