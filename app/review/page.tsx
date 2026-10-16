/**
 * Kelime kartı tekrar sayfası — /review
 * Tekrar zamanı gelmiş kartları tek tek gösterir.
 * Ön yüz: Rusça metin + örnek cümle.
 * Arka yüz: Seçili çeviri dilinde karşılık + örnek cümle.
 * SM-2 tabanlı SRS puanlaması.
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { db } from "@/lib/db";
import { useLang } from "@/lib/lang-context";
import { getMessages } from "@/lib/i18n";
import { getDueCards, reviewCard } from "@/lib/srs";
import { getReview, upsertReview, getAllReviews } from "@/lib/reviews";
import { PronunciationText } from "@/components/pronunciation-text";
import { SpeakButton } from "@/components/SpeakButton";
import type { Item, Review, Lang } from "@/types";
import type { Rating } from "@/lib/srs";

/**
 * Çeviri dilinde karşılığı döndürür, yoksa diğer dile fallback yapar.
 */
function getTranslation(
  item: Item,
  lang: Lang
): { text: string; fallbackLang?: Lang } {
  const primary = lang === "tr" ? item.tr : item.en;
  const fallback = lang === "tr" ? item.en : item.tr;
  const fallbackLangCode: Lang = lang === "tr" ? "en" : "tr";

  if (primary) return { text: primary };
  if (fallback) return { text: fallback, fallbackLang: fallbackLangCode };
  return { text: "—" };
}

/**
 * Çeviri dilinde örnek cümleyi döndürür.
 */
function getExampleTranslation(
  item: Item,
  lang: Lang
): { text: string; fallbackLang?: Lang } | null {
  const primary = lang === "tr" ? item.exampleTr : item.exampleEn;
  const fallback = lang === "tr" ? item.exampleEn : item.exampleTr;
  const fallbackLangCode: Lang = lang === "tr" ? "en" : "tr";

  if (primary) return { text: primary };
  if (fallback) return { text: fallback, fallbackLang: fallbackLangCode };
  return null;
}

export default function ReviewPage() {
  const { uiLang, translationLang } = useLang();
  const t = getMessages(uiLang);

  const [dueCards, setDueCards] = useState<Item[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [loading, setLoading] = useState(true);
  const [totalCards, setTotalCards] = useState(0);

  /** Tekrar edilecek kartları yükle */
  useEffect(() => {
    async function load() {
      try {
        const allItems: Item[] = await db.items
          .where("type")
          .equals("word")
          .toArray();
        const reviews: Review[] = await getAllReviews();
        const due = getDueCards(allItems, reviews, new Date());
        setDueCards(due);
        setTotalCards(due.length);
      } catch {
        setDueCards([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  /** Puanlama butonu */
  const handleRating = useCallback(
    async (rating: Rating) => {
      const card = dueCards[currentIndex];
      if (!card) return;

      // Mevcut review kaydını al (yoksa varsayılan oluşturulur)
      const currentReview = await getReview(card.id);
      // SM-2 ile yeni değerleri hesapla
      const updatedReview = reviewCard(currentReview, rating);
      // Dexie'ye kaydet
      await upsertReview(updatedReview);

      // Sonraki karta geç
      setShowAnswer(false);
      setCurrentIndex((prev) => prev + 1);
    },
    [dueCards, currentIndex]
  );

  // Yükleniyor
  if (loading) {
    return (
      <div className="page-container">
        <div className="review-loading">...</div>
      </div>
    );
  }

  // Tüm kartlar bitti veya hiç kart yok
  const currentCard = dueCards[currentIndex];
  if (!currentCard) {
    return (
      <div className="page-container">
        <div className="review-done">
          <div className="review-done-icon">✅</div>
          <p className="review-done-text">{t.noCardsDue}</p>
          <Link href="/" className="review-done-link">
            ← {t.backToHome}
          </Link>
        </div>
      </div>
    );
  }

  const translation = getTranslation(currentCard, translationLang);
  const exampleTr = getExampleTranslation(currentCard, translationLang);

  return (
    <div className="page-container">
      {/* Geri dön bağlantısı */}
      <Link href="/" className="back-link">
        <svg
          className="back-icon"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 19l-7-7 7-7"
          />
        </svg>
        {t.backToHome}
      </Link>

      {/* Başlık ve ilerleme */}
      <div className="review-header">
        <h1 className="page-title">{t.review}</h1>
        <span className="review-progress">
          {currentIndex + 1} / {totalCards}
        </span>
      </div>

      {/* İlerleme çubuğu */}
      <div className="review-progress-bar">
        <div
          className="review-progress-fill"
          style={{ width: `${((currentIndex) / totalCards) * 100}%` }}
        />
      </div>

      {/* Kart */}
      <div className="flashcard">
        {/* Ön yüz — her zaman görünür */}
        <div className="flashcard-front">
          <div className="flashcard-ru" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
            <span>{currentCard.ru}</span>
            <SpeakButton text={currentCard.ru} size="md" />
          </div>
          <PronunciationText item={currentCard} />
          {currentCard.exampleRu && (
            <div className="flashcard-example-ru" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem" }}>
              <span>« {currentCard.exampleRu} »</span>
              <SpeakButton text={currentCard.exampleRu} size="sm" />
            </div>
          )}
        </div>

        {/* Arka yüz — sadece cevap gösterildiğinde */}
        {showAnswer && (
          <div className="flashcard-back">
            <div className="flashcard-divider" />
            <div className="flashcard-tr">
              {translation.text}
              {translation.fallbackLang && (
                <span className="fallback-badge">({translation.fallbackLang})</span>
              )}
            </div>
            {exampleTr && (
              <div className="flashcard-example-tr">
                {exampleTr.text}
                {exampleTr.fallbackLang && (
                  <span className="fallback-badge">({exampleTr.fallbackLang})</span>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Butonlar */}
      {!showAnswer ? (
        <div className="review-actions">
          <button
            className="review-show-btn"
            onClick={() => setShowAnswer(true)}
          >
            {t.showAnswer}
          </button>
        </div>
      ) : (
        <div className="review-actions review-rating-grid">
          <button
            className="review-btn review-btn-again"
            onClick={() => handleRating("again")}
          >
            {t.again}
          </button>
          <button
            className="review-btn review-btn-hard"
            onClick={() => handleRating("hard")}
          >
            {t.hard}
          </button>
          <button
            className="review-btn review-btn-good"
            onClick={() => handleRating("good")}
          >
            {t.good}
          </button>
          <button
            className="review-btn review-btn-easy"
            onClick={() => handleRating("easy")}
          >
            {t.easy}
          </button>
        </div>
      )}
    </div>
  );
}
