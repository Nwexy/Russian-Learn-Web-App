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
 * Hata fırlatmaması için try-catch ile korunur.
 */
export async function recordMistake(data: {
  exerciseType: ExerciseType;
  itemId: string;
  questionData: Record<string, unknown>;
  userAnswer: string;
  correctAnswer: string;
}): Promise<void> {
  try {
    const now = new Date();

    if (!data.exerciseType || !data.itemId) {
      console.warn("recordMistake missing exerciseType or itemId:", data);
      return;
    }

    // Mevcut kaydı bul (bileşik indeks ile veya filtre ile fallback)
    let existing: Mistake | undefined;
    try {
      existing = await db.mistakes
        .where("[exerciseType+itemId]")
        .equals([data.exerciseType, data.itemId])
        .first();
    } catch {
      existing = await db.mistakes
        .filter((m) => m.exerciseType === data.exerciseType && m.itemId === data.itemId)
        .first();
    }

    if (existing && existing.id) {
      // Güncelle: timesWrong+1, son cevabı ve tarihi güncelle
      await db.mistakes.update(existing.id, {
        userAnswer: data.userAnswer ?? "",
        correctAnswer: data.correctAnswer ?? "",
        questionData: data.questionData ?? {},
        lastTriedAt: now,
        timesWrong: (existing.timesWrong || 1) + 1,
      });
    } else {
      // Yeni kayıt
      await db.mistakes.add({
        exerciseType: data.exerciseType,
        itemId: data.itemId,
        questionData: data.questionData ?? {},
        userAnswer: data.userAnswer ?? "",
        correctAnswer: data.correctAnswer ?? "",
        createdAt: now,
        lastTriedAt: now,
        timesWrong: 1,
      });
    }
  } catch (err) {
    console.error("recordMistake error:", err);
  }
}

/**
 * ID ile tek kayıt sil.
 */
export async function removeMistake(id: number): Promise<void> {
  try {
    await db.mistakes.delete(id);
  } catch (err) {
    console.error("removeMistake error:", err);
  }
}

/**
 * exerciseType + itemId eşleşen kaydı sil.
 * Bir soruyu doğru yapınca çağrılır.
 */
export async function removeMistakeByKey(
  exerciseType: ExerciseType,
  itemId: string
): Promise<void> {
  try {
    if (!exerciseType || !itemId) return;
    try {
      await db.mistakes
        .where("[exerciseType+itemId]")
        .equals([exerciseType, itemId])
        .delete();
    } catch {
      const matches = await db.mistakes
        .filter((m) => m.exerciseType === exerciseType && m.itemId === itemId)
        .toArray();
      for (const m of matches) {
        if (m.id) await db.mistakes.delete(m.id);
      }
    }
  } catch (err) {
    console.error("removeMistakeByKey error:", err);
  }
}

/**
 * Tüm yanlış kayıtlarını döndür (createdAt sırasıyla).
 * Index arama hatası vermemesi için güvenli toArray() ve hafızada sıralama kullanılır.
 */
export async function getAllMistakes(): Promise<Mistake[]> {
  try {
    const list = await db.mistakes.toArray();
    return list.sort((a, b) => {
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return timeA - timeB;
    });
  } catch (err) {
    console.error("getAllMistakes error:", err);
    return [];
  }
}

/**
 * Toplam yanlış kayıt sayısını döndür.
 */
export async function getMistakeCount(): Promise<number> {
  try {
    return await db.mistakes.count();
  } catch (err) {
    console.error("getMistakeCount error:", err);
    return 0;
  }
}

/**
 * Tüm yanlış kayıtlarını sil.
 * Ayarlar sayfasındaki "Yanlışları Temizle" için.
 */
export async function clearAllMistakes(): Promise<void> {
  try {
    await db.mistakes.clear();
  } catch (err) {
    console.error("clearAllMistakes error:", err);
  }
}
