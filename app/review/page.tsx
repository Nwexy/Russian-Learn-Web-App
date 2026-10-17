/**
 * Kelime kartı tekrar sayfası — /review
 * Tekrar zamanı gelmiş kartları tek tek gösterir.
 * URL'de ?unit=unit-01 varsa sadece o ünitenin kartlarını getirir.
 * URL'de unit yoksa sadece lessonCompleted (lessonDone === true) olan ünitelerin kartlarını getirir.
 * SM-2 tabanlı SRS puanlaması.
 */

"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { db } from "@/lib/db";
import { useLang } from "@/lib/lang-context";
import { getMessages } from "@/lib/i18n";
import { getDueCards, reviewCard } from "@/lib/srs";
import { getReview, upsertReview, getAllReviews } from "@/lib/reviews";
import { getUnitById, getUnitTitle } from "@/lib/content";
import { PronunciationText } from "@/components/pronunciation-text";
import { SpeakButton } from "@/components/SpeakButton";
import { addXp, updateStreak } from "@/lib/gamification";
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

function ReviewContent() {
  const searchParams = useSearchParams();
  const unitParam = searchParams.get("unit");
  const unitObj = unitParam ? getUnitById(unitParam) : null;

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
        let candidateItems: Item[] = [];

        if (unitParam) {
          // Belirli bir üniteye özel filtreli review
          candidateItems = await db.items
            .where("unitId")
            .equals(unitParam)
            .and((i) => i.type === "word")
            .toArray();

          if (candidateItems.length === 0 && unitObj?.items) {
            candidateItems = unitObj.items
              .filter((i) => i.type === "word")
              .map((raw) => ({
                id: raw.id,
                unitId: unitObj.id,
                type: raw.type,
                ru: raw.ru,
                tr: raw.tr,
                en: raw.en,
                exampleRu: raw.exampleRu,
                exampleTr: raw.exampleTr,
                exampleEn: raw.exampleEn,
                pronunciationEn: raw.pronunciationEn,
                numberValue: raw.numberValue,
                hexCode: raw.hexCode,
                tags: raw.tags,
              }));
          }
        } else {
          // Genel review: Sadece dersi tamamlanmış (lessonDone === true) ünitelerin kelimeleri
          const allProgress = await db.progress.toArray();
          const completedUnitIds = new Set(
            allProgress.filter((p) => Boolean(p.lessonDone)).map((p) => p.unitId)
          );

          const allWords: Item[] = await db.items
            .where("type")
            .equals("word")
            .toArray();

          candidateItems = allWords.filter((i) => completedUnitIds.has(i.unitId));
        }

        const reviews: Review[] = await getAllReviews();
        const due = getDueCards(candidateItems, reviews, new Date());
        setDueCards(due);
        setTotalCards(due.length);
      } catch {
        setDueCards([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [unitParam, unitObj]);

  /** Puanlama butonu */
  const handleRating = useCallback(
    async (rating: Rating) => {
      const card = dueCards[currentIndex];
      if (!card) return;

      const currentReview = await getReview(card.id);
      const updatedReview = reviewCard(currentReview, rating);
      await upsertReview(updatedReview);
      await addXp(1);
      await updateStreak();

      setShowAnswer(false);
      setCurrentIndex((prev) => prev + 1);
    },
    [dueCards, currentIndex]
  );

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
          <p className="review-done-text">{t.noCardsDue}</p>
          <Link href={unitParam ? `/unit/${unitParam}` : "/"} className="review-done-link">
            ← {unitParam ? t.backToUnit : t.backToHome}
          </Link>
        </div>
      </div>
    );
  }

  const translation = getTranslation(currentCard, translationLang);
  const exampleTr = getExampleTranslation(currentCard, translationLang);
  const pageTitle = unitObj ? `${getUnitTitle(unitObj, uiLang)} — ${t.review}` : t.review;

  return (
    <div className="page-container">
      {/* Geri dön bağlantısı */}
      <Link href={unitParam ? `/unit/${unitParam}` : "/"} className="back-link">
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
        {unitParam ? t.backToUnit : t.backToHome}
      </Link>

      {/* Başlık ve ilerleme */}
      <div className="review-header">
        <h1 className="page-title">{pageTitle}</h1>
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
        <div style={{ position: "absolute", top: "1rem", right: "1rem", display: "flex", alignItems: "center", gap: "0.5rem", zIndex: 10 }}>
          {currentCard.numberValue !== undefined && (
            <span className="item-number-badge" style={{ position: "static" }} title={`Sayı: ${currentCard.numberValue}`}>
              {currentCard.numberValue}
            </span>
          )}
          {(currentCard.hexCode || getUnitById(currentCard.unitId)?.items.find((i) => i.id === currentCard.id)?.hexCode) && (
            <div 
              className="w-8 h-8 rounded-md border border-gray-400 dark:border-gray-600 shadow-sm" 
              style={{
                backgroundColor: currentCard.hexCode || getUnitById(currentCard.unitId)?.items.find((i) => i.id === currentCard.id)?.hexCode,
                width: "2rem",
                height: "2rem",
                minWidth: "2rem",
                minHeight: "2rem",
                borderRadius: "0.375rem",
                border: "1px solid #9ca3af",
              }} 
              title={currentCard.en || currentCard.ru}
            />
          )}
        </div>
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

export default function ReviewPage() {
  return (
    <Suspense fallback={<div className="page-container"><div className="review-loading">...</div></div>}>
      <ReviewContent />
    </Suspense>
  );
}
