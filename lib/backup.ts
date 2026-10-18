/**
 * Veri Yedekleme ve Geri Yukleme Sistemi (Faz 9)
 * IndexedDB (Dexie) tablolarini JSON olarak disari aktarir (export)
 * ve yedek dosyasindan geri yukler (import).
 */

import { db } from "@/lib/db";
import type { Item, Review, Progress, Setting, Mistake, GrammarProgress } from "@/types";

export interface BackupTables {
  items: Item[];
  reviews: Review[];
  progress: Progress[];
  settings: Setting[];
  mistakes: Mistake[];
  grammarProgress: GrammarProgress[];
}

export interface BackupData {
  version: number;
  exportedAt: string;
  tables: BackupTables;
}

/**
 * Dexie veritabanindaki tum tablolari okur ve tarayicida .json dosyasi olarak indirir.
 * Dosya adi formati: russian-learn-backup-YYYY-MM-DD.json
 */
export async function exportData(): Promise<void> {
  const [items, reviews, progress, settings, mistakes, grammarProgress] = await Promise.all([
    db.items.toArray(),
    db.reviews.toArray(),
    db.progress.toArray(),
    db.settings.toArray(),
    db.mistakes.toArray(),
    db.grammarProgress.toArray(),
  ]);

  const backupData: BackupData = {
    version: 1,
    exportedAt: new Date().toISOString(),
    tables: {
      items,
      reviews,
      progress,
      settings,
      mistakes,
      grammarProgress,
    },
  };

  const jsonString = JSON.stringify(backupData, null, 2);
  const blob = new Blob([jsonString], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const filename = `russian-learn-backup-${year}-${month}-${day}.json`;

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * JSON string olarak gelen yedek verisini dogrular,
 * mevcut veritabanini temizler ve yeni verileri Dexie tablolarina yazar.
 * Basarili olursa true dondurur.
 */
export async function importData(jsonString: string): Promise<boolean> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonString);
  } catch {
    throw new Error("Gecersiz JSON formati.");
  }

  if (!parsed || typeof parsed !== "object") {
    throw new Error("Gecersiz yedek dosyasi yapisi.");
  }

  const rawObj = parsed as Record<string, unknown>;

  if (typeof rawObj.version !== "number") {
    throw new Error("Yedek dosyasi surum numarasi (version) bulunamadi.");
  }

  // tables objesi altinda veya dogrudan ana objede tablolari ara
  const tablesObj =
    rawObj.tables && typeof rawObj.tables === "object"
      ? (rawObj.tables as Record<string, unknown>)
      : rawObj;

  const requiredTables = ["items", "reviews", "progress", "settings", "mistakes", "grammarProgress"];
  for (const table of requiredTables) {
    if (!Array.isArray(tablesObj[table])) {
      throw new Error(`Eksik veya gecersiz tablo: ${table}`);
    }
  }

  const items = tablesObj.items as Item[];
  const rawReviews = tablesObj.reviews as Record<string, unknown>[];
  const rawProgress = tablesObj.progress as Record<string, unknown>[];
  const settings = tablesObj.settings as Setting[];
  const rawMistakes = tablesObj.mistakes as Record<string, unknown>[];
  const rawGrammarProgress = tablesObj.grammarProgress as Record<string, unknown>[];

  // Tarih alanlarini Date nesnesine donustur
  const reviews: Review[] = rawReviews.map((r) => ({
    ...(r as unknown as Review),
    due: r.due ? new Date(r.due as string | number | Date) : new Date(),
    lastReviewed: r.lastReviewed ? new Date(r.lastReviewed as string | number | Date) : undefined,
  }));

  const progress: Progress[] = rawProgress.map((p) => ({
    ...(p as unknown as Progress),
    updatedAt: p.updatedAt ? new Date(p.updatedAt as string | number | Date) : new Date(),
  }));

  const mistakes: Mistake[] = rawMistakes.map((m) => ({
    ...(m as unknown as Mistake),
    createdAt: m.createdAt ? new Date(m.createdAt as string | number | Date) : new Date(),
    lastTriedAt: m.lastTriedAt ? new Date(m.lastTriedAt as string | number | Date) : new Date(),
  }));

  const grammarProgress: GrammarProgress[] = rawGrammarProgress.map((g) => ({
    ...(g as unknown as GrammarProgress),
    lastViewedAt: g.lastViewedAt ? new Date(g.lastViewedAt as string | number | Date) : new Date(),
    completedAt: g.completedAt ? new Date(g.completedAt as string | number | Date) : undefined,
  }));

  // Atomik islem: tum tablolari temizle ve yeni verileri yukle
  await db.transaction(
    "rw",
    [db.items, db.reviews, db.progress, db.settings, db.mistakes, db.grammarProgress],
    async () => {
      await Promise.all([
        db.items.clear(),
        db.reviews.clear(),
        db.progress.clear(),
        db.settings.clear(),
        db.mistakes.clear(),
        db.grammarProgress.clear(),
      ]);

      if (items.length > 0) await db.items.bulkPut(items);
      if (reviews.length > 0) await db.reviews.bulkPut(reviews);
      if (progress.length > 0) await db.progress.bulkPut(progress);
      if (settings.length > 0) await db.settings.bulkPut(settings);
      if (mistakes.length > 0) await db.mistakes.bulkPut(mistakes);
      if (grammarProgress.length > 0) await db.grammarProgress.bulkPut(grammarProgress);
    }
  );

  return true;
}
