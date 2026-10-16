/**
 * Gramer ilerleme yönetimi — lib/grammar-progress.ts
 * Dexie grammarProgress tablosu üzerinde çalışır.
 * Saf TypeScript + Dexie.
 */

import { db } from "@/lib/db";
import type { GrammarProgress } from "@/types";

/**
 * Belirtilen gramer notunun ilerleme kaydını döndürür.
 * Kayıt yoksa undefined döner.
 */
export async function getGrammarProgress(noteId: string): Promise<GrammarProgress | undefined> {
  return db.grammarProgress.get(noteId);
}

/**
 * Gramer notunun görüntülendiğini kaydeder (markViewed).
 * Kayıt henüz yoksa completed=false olarak başlatır.
 * Kayıt varsa lastViewedAt tarihini günceller.
 */
export async function markViewed(noteId: string): Promise<void> {
  const existing = await db.grammarProgress.get(noteId);
  const now = new Date();

  if (existing) {
    await db.grammarProgress.put({
      ...existing,
      lastViewedAt: now,
    });
  } else {
    await db.grammarProgress.put({
      noteId,
      completed: false,
      lastViewedAt: now,
    });
  }
}

/**
 * Gramer notunun tamamlandığını kaydeder (markCompleted).
 * completed=true ve completedAt=new Date() ayarlanır.
 */
export async function markCompleted(noteId: string): Promise<void> {
  const existing = await db.grammarProgress.get(noteId);
  const now = new Date();

  await db.grammarProgress.put({
    noteId,
    completed: true,
    lastViewedAt: existing?.lastViewedAt ?? now,
    completedAt: now,
  });
}

/**
 * Tüm gramer ilerleme kayıtlarını döndürür.
 */
export async function getAllGrammarProgress(): Promise<GrammarProgress[]> {
  return db.grammarProgress.toArray();
}

/**
 * Gramer notunun durumunu döner:
 * - "completed": Tamamlandı (mini alıştırmalar başarıyla bitirildi)
 * - "inProgress": Görüntülendi ama henüz tamamlanmadı
 * - "notStarted": Hiç görüntülenmedi
 */
export async function getGrammarStatus(
  noteId: string
): Promise<"notStarted" | "inProgress" | "completed"> {
  const progress = await db.grammarProgress.get(noteId);
  if (!progress) return "notStarted";
  if (progress.completed) return "completed";
  return "inProgress";
}
