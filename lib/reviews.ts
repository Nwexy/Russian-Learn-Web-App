/**
 * Reviews tablosu yardımcı fonksiyonları.
 * Dexie (IndexedDB) üzerindeki reviews tablosunu okuma / yazma işlemleri.
 *
 * Kart ilk kez görülüyorsa varsayılan değerlerle otomatik oluşturulur.
 */

import { db } from "@/lib/db";
import { createDefaultReview } from "@/lib/srs";
import type { Review } from "@/types";

/**
 * Belirli bir öğenin tekrar kaydını döndürür.
 * Kayıt yoksa varsayılan değerlerle oluşturur ve kaydeder.
 */
export async function getReview(itemId: string): Promise<Review> {
  const existing = await db.reviews.get(itemId);
  if (existing) return existing;

  // İlk kez görülüyor — varsayılan kayıt oluştur
  const defaultReview = createDefaultReview(itemId);
  await db.reviews.put(defaultReview);
  return defaultReview;
}

/**
 * Tekrar kaydını günceller veya oluşturur (upsert).
 * put: aynı itemId varsa üzerine yazar, yoksa ekler.
 */
export async function upsertReview(review: Review): Promise<void> {
  await db.reviews.put(review);
}

/**
 * Tüm tekrar kayıtlarını döndürür.
 */
export async function getAllReviews(): Promise<Review[]> {
  return db.reviews.toArray();
}
