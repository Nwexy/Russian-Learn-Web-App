/**
 * Oyunlaştırma (Gamification) Motoru — Faz 7
 * XP (Deneyim Puanı), Günlük Seri (Streak) ve Günlük XP Takibi.
 * Saf TypeScript, harici kütüphane bağımlılığı yoktur.
 */

import { db } from "@/lib/db";
import type { UserStats } from "@/types";

/**
 * Yerel tarih için YYYY-MM-DD formatında string döndürür.
 */
export function getLocalDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Dünün tarihini YYYY-MM-DD formatında string olarak döndürür.
 */
export function getYesterdayDateString(today: Date = new Date()): string {
  const d = new Date(today);
  d.setDate(d.getDate() - 1);
  return getLocalDateString(d);
}

/**
 * Varsayılan kullanıcı istatistik nesnesi.
 */
function createDefaultStats(): UserStats {
  return {
    id: "main",
    totalXp: 0,
    currentStreak: 0,
    dailyXp: {},
  };
}

/**
 * userStats tablosundan "main" kaydını getirir.
 * Yoksa varsayılan kaydı oluşturup döner.
 */
export async function getStats(): Promise<UserStats> {
  const existing = await db.userStats.get("main");
  if (existing) {
    // dailyXp nesnesinin her zaman tanımlı olmasını garantile
    if (!existing.dailyXp || typeof existing.dailyXp !== "object") {
      existing.dailyXp = {};
    }
    return existing;
  }

  const defaultStats = createDefaultStats();
  await db.userStats.put(defaultStats);
  return defaultStats;
}

/**
 * Günlük seriyi (Streak) günceller.
 * - Bugün zaten aktiftiyse seriyi korur.
 * - Dün aktiftiyse seriyi 1 artırır ve tarihi bugün yapar.
 * - Dünden daha eskiyse seriyi 1 yapar ve tarihi bugün yapar.
 * - Hiç aktif kaydı yoksa seriyi 1 yapar ve tarihi bugün yapar.
 */
export async function updateStreak(): Promise<UserStats> {
  const stats = await getStats();
  const todayStr = getLocalDateString();
  const yesterdayStr = getYesterdayDateString();

  if (stats.lastActiveDate === todayStr) {
    // Bugün zaten güncellenmiş, işlem yapma
    return stats;
  }

  if (stats.lastActiveDate === yesterdayStr) {
    // Dün aktifti, seriyi 1 artır
    stats.currentStreak = (stats.currentStreak || 0) + 1;
    stats.lastActiveDate = todayStr;
  } else {
    // Dünden daha eski veya ilk aktiflik
    stats.currentStreak = 1;
    stats.lastActiveDate = todayStr;
  }

  await db.userStats.put(stats);
  return stats;
}

/**
 * Kullanıcıya XP ekler ve günlük XP tablosunu günceller.
 * Seriyi de otomatik olarak günceller.
 *
 * @param amount - Eklenecek XP miktarı
 */
export async function addXp(amount: number): Promise<UserStats> {
  if (amount <= 0) return getStats();

  const stats = await getStats();
  const todayStr = getLocalDateString();

  stats.totalXp = (stats.totalXp || 0) + amount;
  if (!stats.dailyXp) {
    stats.dailyXp = {};
  }
  stats.dailyXp[todayStr] = (stats.dailyXp[todayStr] || 0) + amount;

  await db.userStats.put(stats);

  // Günlük seriyi de tazele
  await updateStreak();

  return getStats();
}
