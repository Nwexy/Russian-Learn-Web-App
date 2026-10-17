/**
 * Ünite detay sayfası — /unit/[id]
 * 3 aşamalı akış: Ders (kelime kartları), Alıştırma, Test.
 * Her aşamanın durumu progress tablosundan okunur.
 */

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getUnitById, getUnitTitle, getAllUnits } from "@/lib/content";
import { getGrammarByUnit } from "@/lib/grammar";
import { useLang } from "@/lib/lang-context";
import { getMessages } from "@/lib/i18n";
import { getProgress, setLessonComplete, isUnitUnlocked } from "@/lib/progress";
import { db } from "@/lib/db";
import { Lock } from "lucide-react";
import { PronunciationText } from "@/components/pronunciation-text";
import { SpeakButton } from "@/components/SpeakButton";
import type { Lang, RawItem, Progress } from "@/types";

/**
 * Seçili çeviri diline göre karşılığı döndürür.
 */
function getTranslation(
  item: RawItem,
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
 * Seçili çeviri diline göre örnek cümleyi döndürür.
 */
function getExampleTranslation(
  item: RawItem,
  lang: Lang
): { text: string; fallbackLang?: Lang } | null {
  const primary = lang === "tr" ? item.exampleTr : item.exampleEn;
  const fallback = lang === "tr" ? item.exampleEn : item.exampleTr;
  const fallbackLangCode: Lang = lang === "tr" ? "en" : "tr";

  if (primary) return { text: primary };
  if (fallback) return { text: fallback, fallbackLang: fallbackLangCode };
  return null;
}

/** Sayfa görünüm tipi */
type ViewMode = "overview" | "lesson";

export default function UnitPage() {
  const params = useParams<{ id: string }>();
  const unit = getUnitById(params.id);
  const { uiLang, translationLang } = useLang();
  const t = getMessages(uiLang);

  const [progress, setProgress] = useState<Progress | null>(null);
  const [unlocked, setUnlocked] = useState<boolean | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("overview");
  const [lessonMarked, setLessonMarked] = useState(false);

  useEffect(() => {
    if (!unit) return;
    async function checkLockAndProgress() {
      const allUnits = getAllUnits();
      const allProgress = await db.progress.toArray();
      const isOk = isUnitUnlocked(unit!.id, allUnits, allProgress);
      setUnlocked(isOk);
      const prog = await getProgress(unit!.id);
      setProgress(prog);
    }
    checkLockAndProgress();
  }, [unit]);

  const relatedGrammarNotes = unit ? getGrammarByUnit(unit.id) : [];

  if (!unit) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <div className="empty-state-icon">--</div>
          <p className="empty-state-text">{t.noContent}</p>
        </div>
      </div>
    );
  }

  if (unlocked === null) {
    return (
      <div className="page-container">
        <div className="review-loading">...</div>
      </div>
    );
  }

  if (unlocked === false) {
    return (
      <div className="page-container">
        <Link href="/" className="back-link">
          <svg className="back-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          {t.backToHome}
        </Link>
        <div className="flex flex-col items-center justify-center text-center py-16 px-4">
          <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center text-muted-foreground mb-6 shadow-inner">
            <Lock className="w-10 h-10 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            {t.unitLocked}
          </h1>
          <p className="text-muted-foreground text-sm max-w-md mb-8">
            {t.unitLockedMessage}
          </p>
          <Link
            href="/"
            className="px-6 py-3 rounded-xl bg-accent text-white font-medium hover:opacity-90 transition-opacity shadow-md"
          >
            {t.backToHome}
          </Link>
        </div>
      </div>
    );
  }

  /** Ünitede kelime (type="word") var mı? Yoksa alıştırma/test gizlenir */
  const hasWordItems = unit.items.some((item) => item.type === "word");
  const isLessonCompleted = Boolean(progress?.lessonDone);

  /** Ders tamamla */
  const handleCompleteLesson = async () => {
    await setLessonComplete(unit.id);
    const updated = await getProgress(unit.id);
    setProgress(updated);
    setLessonMarked(true);
    setTimeout(() => setLessonMarked(false), 3000);
  };

  /** İlerleme yüzdesini hesapla */
  const progressPct = hasWordItems
    ? Math.round(
        ([progress?.lessonDone, progress?.testDone].filter(Boolean).length / 2) * 100
      )
    : progress?.lessonDone
    ? 100
    : 0;

  /** Ders görünümü */
  if (viewMode === "lesson") {
    return (
      <div className="page-container">
        <button className="back-link" onClick={() => setViewMode("overview")}>
          <svg className="back-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          {t.backToUnit}
        </button>

        <div className="page-header">
          <span className="unit-card-level">{unit.level}</span>
          <h1 className="page-title">{getUnitTitle(unit, uiLang)} — {t.lesson}</h1>
          <p className="page-subtitle">{unit.items.length} {t.items}</p>
        </div>

        <div className="items-grid">
          {unit.items.map((item) => {
            const translation = getTranslation(item, translationLang);
            const exampleTr = getExampleTranslation(item, translationLang);
            const isNumber = (item.tags?.includes("number") || item.type === "word") && item.numberValue !== undefined;
            const hexColor = item.hexCode || getUnitById(unit.id)?.items.find((i) => i.id === item.id)?.hexCode;

            return (
              <div key={item.id} className="item-card">
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
                  <span className="item-type-badge" style={{ marginBottom: 0 }}>{item.type}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    {isNumber && (
                      <span className="item-number-badge" style={{ position: "static" }} title={`Sayı: ${item.numberValue}`}>
                        {item.numberValue}
                      </span>
                    )}
                    {hexColor && (
                      <div 
                        className="w-8 h-8 rounded-md border border-gray-400 dark:border-gray-600 shadow-sm" 
                        style={{
                          backgroundColor: hexColor,
                          width: "2rem",
                          height: "2rem",
                          minWidth: "2rem",
                          minHeight: "2rem",
                          borderRadius: "0.375rem",
                          border: "1px solid #9ca3af",
                        }} 
                        title={item.en || item.ru}
                      />
                    )}
                  </div>
                </div>
                <div className="item-ru" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span>{item.ru}</span>
                  <SpeakButton text={item.ru} size="sm" />
                </div>
                <div className="item-tr">
                  {translation.text}
                  {translation.fallbackLang && (
                    <span className="fallback-badge">({translation.fallbackLang})</span>
                  )}
                </div>
                {/* Telaffuz (çevirinin altında küçük puntoyla) */}
                <PronunciationText item={item} className="item-card-pronunciation" />
                {(item.exampleRu || exampleTr) && (
                  <div className="item-example">
                    {item.exampleRu && (
                      <span className="item-example-ru" style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                        <span>« {item.exampleRu} »</span>
                        <SpeakButton text={item.exampleRu} size="sm" />
                      </span>
                    )}
                    {exampleTr && (
                      <span className="item-example-tr">
                        {exampleTr.text}
                        {exampleTr.fallbackLang && (
                          <span className="fallback-badge">({exampleTr.fallbackLang})</span>
                        )}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Dersi Tamamla butonu */}
        <div className="practice-start-area" style={{ marginTop: "1.5rem" }}>
          {progress?.lessonDone ? (
            <span className="unit-status-badge unit-status-completed">{t.lessonCompleted}</span>
          ) : (
            <button className="practice-btn practice-btn-primary" onClick={handleCompleteLesson}>
              {lessonMarked ? t.lessonCompleted : t.completeLesson}
            </button>
          )}
        </div>
      </div>
    );
  }

  /** Ana görünüm — akış kartları */
  return (
    <div className="page-container">
      <Link href="/" className="back-link">
        <svg className="back-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        {t.back}
      </Link>

      <div className="page-header">
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
          <span className="unit-card-level">{unit.level}</span>
        </div>
        <h1 className="page-title">{getUnitTitle(unit, uiLang)}</h1>
        <p className="page-subtitle">{unit.items.length} {t.items}</p>
      </div>

      {/* İlgili Gramer bölümü */}
      {relatedGrammarNotes.length > 0 && (
        <section style={{ marginBottom: "1.75rem" }}>
          <h2
            style={{
              fontSize: "1.05rem",
              fontWeight: 700,
              color: "var(--text-primary)",
              marginBottom: "0.75rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <svg
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2}
              style={{ width: "1.1rem", height: "1.1rem" }}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
            {t.relatedGrammar}
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
              gap: "0.75rem",
            }}
          >
            {relatedGrammarNotes.map((gNote) => {
              const gTitle = uiLang === "tr" ? gNote.titleTr : gNote.titleEn;
              const gSummary = uiLang === "tr" ? gNote.summaryTr : gNote.summaryEn;
              return (
                <Link
                  key={gNote.id}
                  href={`/grammar/${gNote.id}`}
                  className="card card-clickable"
                  style={{ padding: "1rem" }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.35rem" }}>
                    <span className="unit-card-level">{gNote.level}</span>
                    <span style={{ fontSize: "0.8rem", color: "var(--accent)", fontWeight: 500 }}>
                      {t.goToUnit} →
                    </span>
                  </div>
                  <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.25rem" }}>
                    {gTitle}
                  </h3>
                  <p
                    style={{
                      fontSize: "0.8rem",
                      color: "var(--text-secondary)",
                      margin: 0,
                      lineHeight: 1.4,
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {gSummary}
                  </p>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* İlerleme çubuğu */}
      <div className="review-progress-bar" style={{ marginBottom: "1.5rem" }}>
        <div className="review-progress-fill" style={{ width: `${progressPct}%` }} />
      </div>

      {/* Akış kartları */}
      <div className="unit-phases">
        {/* Ders aşaması (her zaman görünür) */}
        <div className={`unit-phase-card ${progress?.lessonDone ? "unit-phase-done" : ""}`}>
          <div className="unit-phase-header">
            <span className="unit-phase-number">1</span>
            <span className="unit-phase-title">{t.lesson}</span>
            <span className={`unit-status-badge ${progress?.lessonDone ? "unit-status-completed" : "unit-status-not-started"}`}>
              {progress?.lessonDone ? t.completed : t.notStarted}
            </span>
          </div>
          <button className="practice-btn practice-btn-primary" onClick={() => setViewMode("lesson")}>
            {t.lesson}
          </button>
        </div>

        {/* Kelime yoksa (Alfabe ünitesi): Alıştırma ve Test yerine bilgi notu göster */}
        {!hasWordItems ? (
          <div className="unit-no-exercises-box">
            <span className="unit-no-exercises-icon">ℹ️</span>
            <p className="unit-no-exercises-text">{t.buUnitHasNoExercises}</p>
          </div>
        ) : (
          <>
            {/* 2. Alıştırma (sadece kelime içeren ünitelerde) */}
            <div className={`unit-phase-card ${!isLessonCompleted ? "unit-phase-locked" : ""}`}>
              <div className="unit-phase-header">
                <span className="unit-phase-number">2</span>
                <span className="unit-phase-title">{t.practice}</span>
                {!isLessonCompleted && (
                  <span className="unit-status-badge unit-status-locked" title={t.mustCompleteLessonFirst}>
                    {t.locked}
                  </span>
                )}
              </div>
              {isLessonCompleted ? (
                <Link href={`/unit/${unit.id}/practice`} className="practice-btn practice-btn-primary">
                  {t.startPractice}
                </Link>
              ) : (
                <button
                  type="button"
                  disabled
                  className="practice-btn practice-btn-disabled"
                  title={t.mustCompleteLessonFirst}
                >
                  {t.startPractice}
                </button>
              )}
            </div>

            {/* 3. Test (sadece kelime içeren ünitelerde) */}
            <div className={`unit-phase-card ${progress?.testDone ? "unit-phase-done" : ""} ${!isLessonCompleted ? "unit-phase-locked" : ""}`}>
              <div className="unit-phase-header">
                <span className="unit-phase-number">3</span>
                <span className="unit-phase-title">{t.test}</span>
                {!isLessonCompleted ? (
                  <span className="unit-status-badge unit-status-locked" title={t.mustCompleteLessonFirst}>
                    {t.locked}
                  </span>
                ) : (
                  <span className={`unit-status-badge ${progress?.testDone ? "unit-status-completed" : progress?.testScore ? "unit-status-in-progress" : "unit-status-not-started"}`}>
                    {progress?.testDone ? t.completed : progress?.testScore ? t.inProgress : t.notStarted}
                  </span>
                )}
              </div>
              {isLessonCompleted && progress?.testScore ? (
                <p className="unit-phase-score">{t.yourScore}: {progress.testScore}%</p>
              ) : null}
              {isLessonCompleted ? (
                <Link href={`/unit/${unit.id}/test`} className="practice-btn practice-btn-primary">
                  {t.startTest}
                </Link>
              ) : (
                <button
                  type="button"
                  disabled
                  className="practice-btn practice-btn-disabled"
                  title={t.mustCompleteLessonFirst}
                >
                  {t.startTest}
                </button>
              )}
            </div>

            {/* 4. Tekrar / Review (sadece kelime içeren ünitelerde) */}
            <div className={`unit-phase-card ${!isLessonCompleted ? "unit-phase-locked" : ""}`}>
              <div className="unit-phase-header">
                <span className="unit-phase-number">4</span>
                <span className="unit-phase-title">{t.review}</span>
                {!isLessonCompleted && (
                  <span className="unit-status-badge unit-status-locked" title={t.mustCompleteLessonFirst}>
                    {t.locked}
                  </span>
                )}
              </div>
              {isLessonCompleted ? (
                <Link href={`/review?unit=${unit.id}`} className="practice-btn practice-btn-primary">
                  {t.review}
                </Link>
              ) : (
                <button
                  type="button"
                  disabled
                  className="practice-btn practice-btn-disabled"
                  title={t.mustCompleteLessonFirst}
                >
                  {t.review}
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
