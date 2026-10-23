/**
 * Kelime kartı tekrar sayfası — /review
 * Tekrar zamanı gelmiş kartları tek tek gösterir.
 * URL'de ?unit=unit-01 varsa sadece o ünitenin kartlarını getirir.
 * URL'de unit yoksa sadece lessonCompleted (lessonDone === true) olan ünitelerin kartlarını getirir.
 * "Tüm Kelimeleri Dahil Et" açıksa kilitli ünitelerdeki kelimeler de dahil edilir.
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
import { RatingGuidePopover } from "@/components/rating-guide-popover";
import { InfoTooltip } from "@/components/info-tooltip";
import { extractExtraWords } from "@/lib/extraWords";
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

/** "Tüm Kelimeleri Dahil Et" toggle switch'i */
function IncludeAllToggle({
  checked,
  onChange,
  t,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  t: ReturnType<typeof getMessages>;
}) {
  return (
    <div className="review-toggle-row">
      <div className="review-toggle-left">
        <span className="review-toggle-text">{t.includeAllWords}</span>
        <InfoTooltip content={t.includeAllWordsHelp} title={t.includeAllWords} size={15} />
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={t.includeAllWords}
        className={`review-toggle-switch ${checked ? "review-toggle-on" : ""}`}
        onClick={() => onChange(!checked)}
      >
        <span className="review-toggle-thumb" />
      </button>
    </div>
  );
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
  const [includeAll, setIncludeAll] = useState(false);
  const [settingLoaded, setSettingLoaded] = useState(false);

  /** Ayarı Dexie'den yükle */
  useEffect(() => {
    async function loadSetting() {
      try {
        const row = await db.settings.get("reviewAllWords");
        if (row) setIncludeAll(row.value === "true");
      } catch {
        /* ignore */
      } finally {
        setSettingLoaded(true);
      }
    }
    loadSetting();
  }, []);

  /** Toggle değişince Dexie'ye kaydet ve kartları yeniden yükle */
  const handleToggle = useCallback(async (val: boolean) => {
    setIncludeAll(val);
    await db.settings.put({ key: "reviewAllWords", value: val ? "true" : "false" });
  }, []);

  /** Tekrar edilecek kartları yükle */
  useEffect(() => {
    if (!settingLoaded) return;

    async function load() {
      setLoading(true);
      try {
        if (unitParam) {
          // Belirli bir üniteye özel filtreli review
          let candidateItems: Item[] = await db.items
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

          let pool = candidateItems;
          if (includeAll) {
            // Açık olan bu ünitedeki örnek cümlelerden ekstra kelimeleri de havuza ekle
            const extraWords = extractExtraWords([unitParam]);
            pool = [...candidateItems, ...extraWords];
          }

          const reviews: Review[] = await getAllReviews();
          const due = getDueCards(pool, reviews, new Date());
          setDueCards(due);
          setTotalCards(due.length);
        } else {
          // Genel review: Sadece dersi tamamlanmış (lessonDone === true) ünitelerin ID'leri
          const allProgress = await db.progress.toArray();
          const unlockedUnitIds = new Set(
            allProgress.filter((p) => Boolean(p.lessonDone)).map((p) => p.unitId)
          );

          if (unlockedUnitIds.size === 0) {
            setDueCards([]);
            setTotalCards(0);
          } else {
            // Sadece word tipindeki kelimeleri çek
            const allWords: Item[] = await db.items
              .where("type")
              .equals("word")
              .toArray();

            // Sadece açık/tamamlanmış ünitelerin kelimeleri
            const unlockedItems = allWords.filter((i) => unlockedUnitIds.has(i.unitId));

            let pool = unlockedItems;
            if (includeAll) {
              // "Include All Words" AÇIK: Ana kelimelere EK OLARAK açık ünitelerin örnek cümlelerindeki ekstra kelimeleri de havuza ekle
              const extraWords = extractExtraWords(unlockedUnitIds);
              pool = [...unlockedItems, ...extraWords];
            }

            // SRS due tarihine uyarak due olan kartları getir
            const reviews: Review[] = await getAllReviews();
            const due = getDueCards(pool, reviews, new Date(), unlockedUnitIds);
            setDueCards(due);
            setTotalCards(due.length);
          }
        }

        setCurrentIndex(0);
        setShowAnswer(false);
      } catch {
        setDueCards([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [unitParam, unitObj, includeAll, settingLoaded]);

  /** Puanlama butonu */
  const handleRating = useCallback(
    async (rating: Rating) => {
      const card = dueCards[currentIndex];
      if (!card) return;

      const currentReview = await getReview(card.id);
      const updatedReview = reviewCard(currentReview, rating);
      await upsertReview(updatedReview);

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

          {/* Unit-specific review yoksa toggle göster */}
          {!unitParam && (
            <div style={{ marginBottom: "1rem" }}>
              <IncludeAllToggle checked={includeAll} onChange={handleToggle} t={t} />
            </div>
          )}

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

      {/* Başlık, yardım butonu ve ilerleme */}
      <div className="review-header">
        <div className="review-header-left">
          <h1 className="page-title">{pageTitle}</h1>
          <RatingGuidePopover align="left" size={18} />
        </div>
        <span className="review-progress">
          {currentIndex + 1} / {totalCards}
        </span>
      </div>

      {/* Tüm Kelimeleri Dahil Et toggle — sadece genel review'da göster */}
      {!unitParam && (
        <IncludeAllToggle checked={includeAll} onChange={handleToggle} t={t} />
      )}

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
            {currentCard.id.startsWith("extra_") ? (
              <div className="flashcard-extra-back">
                <div className="flashcard-tr" style={{ fontSize: "1.15rem", fontWeight: 700, marginBottom: "0.5rem" }}>
                  <span>{currentCard.ru}</span>
                  <span className="extra-word-pill">
                    {uiLang === "tr" ? "Cümleden Ekstra Kelime" : "Sentence Extra Word"}
                  </span>
                </div>
                {currentCard.exampleRu && (
                  <div className="flashcard-extra-box">
                    <div className="flashcard-extra-ru">
                      <span>« {currentCard.exampleRu} »</span>
                      <SpeakButton text={currentCard.exampleRu} size="sm" />
                    </div>
                    {exampleTr && (
                      <div className="flashcard-extra-tr">
                        → {exampleTr.text}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <>
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
              </>
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
