/**
 * SRS (Spaced Repetition System) motoru — SM-2 algoritması.
 * Saf TypeScript, harici kütüphane bağımlılığı yok.
 *
 * SM-2 parametreleri:
 *   - ease:     Kolaylık faktörü (başlangıç 2.5, minimum 1.3)
 *   - interval: Tekrar aralığı (gün cinsinden, başlangıç 0)
 *   - reps:     Başarılı tekrar sayısı (başlangıç 0)
 *   - lapses:   Unutma sayısı (başlangıç 0)
 *   - due:      Bir sonraki tekrar tarihi
 */

import type { Review, Item } from "@/types";

/** Kullanıcının bir karta verdiği puan */
export type Rating = "again" | "hard" | "good" | "easy";

/** Minimum kolaylık faktörü — bunun altına düşmez */
const MIN_EASE = 1.3;

/** Varsayılan başlangıç değerleri */
const DEFAULT_EASE = 2.5;

/**
 * Bir karta tekrar puanı verdikten sonra yeni SRS değerlerini hesaplar.
 *
 * @param review  - Mevcut tekrar kaydı
 * @param rating  - Kullanıcının verdiği puan
 * @returns         Güncellenmiş Review nesnesi
 */
export function reviewCard(review: Review, rating: Rating): Review {
  const now = new Date();
  let { ease, interval, reps, lapses } = review;

  switch (rating) {
    case "again":
      // Unuttum: sıfırla, aynı gün tekrar et
      reps = 0;
      interval = 0;
      lapses += 1;
      ease = Math.max(MIN_EASE, ease - 0.2);
      break;

    case "hard":
      // Zor: aralığı biraz artır, ease düşür
      if (reps === 0) {
        interval = 1;
      } else {
        interval = Math.max(1, Math.round(interval * 1.2));
      }
      reps += 1;
      ease = Math.max(MIN_EASE, ease - 0.15);
      break;

    case "good":
      // İyi: standart SM-2 akışı
      if (reps === 0) {
        interval = 1;
      } else if (reps === 1) {
        interval = 6;
      } else {
        interval = Math.round(interval * ease);
      }
      reps += 1;
      // ease değişmez
      break;

    case "easy":
      // Kolay: hızlandırılmış aralık, ease artır
      if (reps === 0) {
        interval = 4;
      } else {
        interval = Math.round(interval * ease * 1.3);
      }
      reps += 1;
      ease += 0.15;
      break;
  }

  // due tarihini hesapla: interval 0 ise bugün, yoksa interval gün sonra
  const due = new Date(now);
  if (interval > 0) {
    due.setDate(due.getDate() + interval);
    // Günün başlangıcına ayarla (gece yarısı)
    due.setHours(0, 0, 0, 0);
  }

  return {
    itemId: review.itemId,
    due,
    interval,
    ease,
    reps,
    lapses,
    lastReviewed: now,
  };
}

/**
 * Bir öğenin sayı olup olmadığını kontrol eder.
 * Faz 11.4: Sayılar ünitesi (unitId: "unit-02" veya "unit-numbers") veya
 * numberValue içeren öğeler genel SRS Review havuzundan ve Bugünün Tekrarı sayacından hariç tutulur.
 *
 * @param item - Kontrol edilecek öğe
 * @returns      Sayı ise true, değilse false
 */
export function isNumberItem(
  item: { unitId?: string; numberValue?: number } | null | undefined
): boolean {
  if (!item) return false;
  if (item.unitId === "unit-02" || item.unitId === "unit-numbers") {
    return true;
  }
  if (item.numberValue !== undefined && item.numberValue !== null) {
    return true;
  }
  return false;
}

/**
 * Tekrar zamanı gelmiş kartları döndürür.
 * due tarihi şimdiki zamandan küçük veya eşit olan kartlar "due" sayılır.
 * Reviews tablosunda kaydı olmayan kartlar da due sayılır (ilk kez görülecek).
 * unlockedUnitIds verilirse sadece bu açık/tamamlanmış ünitelerdeki kartlar değerlendirilir.
 * excludeNumbers true ise sayı kartları (unit-02 veya numberValue olanlar) değerlendirmeye alınmaz.
 *
 * @param allItems        - Tüm öğeler
 * @param reviews         - Mevcut tekrar kayıtları
 * @param now             - Şimdiki zaman
 * @param unlockedUnitIds - Açık/tamamlanmış ünite ID'leri (opsiyonel filtre)
 * @param excludeNumbers  - Sayıları hariç tut (varsayılan: true)
 * @returns                 Tekrar edilecek Item listesi
 */
export function getDueCards(
  allItems: Item[],
  reviews: Review[],
  now: Date,
  unlockedUnitIds?: Set<string> | string[],
  excludeNumbers: boolean = true
): Item[] {
  const allowedSet = unlockedUnitIds
    ? unlockedUnitIds instanceof Set
      ? unlockedUnitIds
      : new Set(unlockedUnitIds)
    : null;

  // itemId → Review haritası
  const reviewMap = new Map<string, Review>();
  for (const r of reviews) {
    reviewMap.set(r.itemId, r);
  }

  return allItems.filter((item) => {
    // Faz 11.4: Sayılar ünitesi ve numberValue içeren kartlar SRS tekrar havuzundan hariç tutulur
    if (excludeNumbers && isNumberItem(item)) {
      return false;
    }

    // Ünite kısıtlaması varsa ve bu ünite açık değilse atla
    if (allowedSet && !allowedSet.has(item.unitId)) {
      return false;
    }

    const review = reviewMap.get(item.id);

    // Henüz hiç tekrar edilmemiş → due
    if (!review) return true;

    // due tarihi geçmiş veya bugün → due
    return review.due <= now;
  });
}

/**
 * Yeni bir kart için varsayılan Review kaydı oluşturur.
 * due = şimdi (hemen çalışılabilir).
 */
export function createDefaultReview(itemId: string): Review {
  return {
    itemId,
    due: new Date(),
    interval: 0,
    ease: DEFAULT_EASE,
    reps: 0,
    lapses: 0,
  };
}
