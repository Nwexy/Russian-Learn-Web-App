/**
 * Ana sayfa — Ünite listesi, hoş geldiniz bölümü ve bugünün tekrarı kartı.
 * content/ klasöründeki tüm üniteleri listeler.
 * Arayüz dili uiLang'e göre gösterilir.
 */

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getAllUnits, getUnitTitle } from "@/lib/content";
import { useLang } from "@/lib/lang-context";
import { getMessages } from "@/lib/i18n";
import { db } from "@/lib/db";
import { getDueCards } from "@/lib/srs";
import { getAllReviews } from "@/lib/reviews";
import { getMistakeCount } from "@/lib/mistakes";
import { getUnitStatus } from "@/lib/progress";
import { loadGrammarNotes } from "@/lib/grammar";
import { getAllGrammarProgress } from "@/lib/grammar-progress";
import { FlagRu } from "@/components/icons/flag-icons";
import { Lock } from "lucide-react";
import { isUnitUnlocked } from "@/lib/progress";
import type { Item, Review, UnitStatus, Progress } from "@/types";

export default function HomePage() {
  const units = getAllUnits();
  const { uiLang } = useLang();
  const t = getMessages(uiLang);

  /** Bugün tekrar edilecek kart sayısı */
  const [dueCount, setDueCount] = useState<number>(0);
  const [mistakeCount, setMistakeCount] = useState<number>(0);
  const [grammarStats, setGrammarStats] = useState({ completed: 0, total: 0 });
  const [unitStatuses, setUnitStatuses] = useState<Record<string, UnitStatus>>({});
  const [allProgress, setAllProgress] = useState<Progress[]>([]);
  const [lockedNoticeUnitId, setLockedNoticeUnitId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const handleLockedClick = (unitId: string) => {
    setLockedNoticeUnitId(unitId);
    setTimeout(() => {
      setLockedNoticeUnitId((curr) => (curr === unitId ? null : curr));
    }, 3500);
  };

  useEffect(() => {
    async function fetchDueCount() {
      try {
        // Sadece word tipindeki kartlar
        const allItems: Item[] = await db.items
          .where("type")
          .equals("word")
          .toArray();
        const reviews: Review[] = await getAllReviews();
        const due = getDueCards(allItems, reviews, new Date());
        setDueCount(due.length);
        const mc = await getMistakeCount();
        setMistakeCount(mc);
        // Gramer ilerlemesini çek
        const gNotes = loadGrammarNotes();
        const gProgress = await getAllGrammarProgress();
        const gCompleted = gProgress.filter((p) => p.completed).length;
        setGrammarStats({ completed: gCompleted, total: gNotes.length });
        // Dexie progress kayıtlarını çek
        const progs: Progress[] = await db.progress.toArray();
        setAllProgress(progs);

        // Ünite durumlarını çek
        const statuses: Record<string, UnitStatus> = {};
        for (const u of units) {
          statuses[u.id] = await getUnitStatus(u.id);
        }
        setUnitStatuses(statuses);
      } catch {
        setDueCount(0);
      } finally {
        setLoading(false);
      }
    }
    fetchDueCount();
  }, []);

  return (
    <div className="page-container">
      {/* Hero bölümü */}
      <section className="hero">
        <span className="hero-emoji" style={{ display: "inline-flex", justifyContent: "center", alignItems: "center" }}>
          <FlagRu
            width="84"
            height="56"
            style={{
              width: "84px",
              height: "56px",
              borderRadius: "10px",
              boxShadow: "0 10px 25px rgba(0, 0, 0, 0.35)",
            }}
          />
        </span>
        <h1 className="hero-title">{t.appName}</h1>
        <p className="hero-desc">{t.heroDesc}</p>
      </section>

      {/* Bugünün Tekrarı kartı */}
      <section className="review-banner">
        <div className="review-banner-content">
          <div className="review-banner-left">
            <h2 className="review-banner-title">
              <span className="review-banner-icon">🔄</span>
              {t.todayReview}
            </h2>
            <p className="review-banner-desc">
              {loading
                ? "..."
                : dueCount > 0
                  ? `${dueCount} ${t.dueCards}`
                  : t.nothingDue}
            </p>
          </div>
          <Link
            href="/review"
            className={`review-banner-btn ${dueCount === 0 && !loading ? "review-banner-btn-disabled" : ""}`}
            aria-disabled={dueCount === 0 && !loading}
            onClick={(e) => {
              if (dueCount === 0 && !loading) e.preventDefault();
            }}
          >
            {t.study}
          </Link>
        </div>
      </section>

      {/* Alıştırmalar kartı */}
      <section className="review-banner">
        <div className="review-banner-content">
          <div className="review-banner-left">
            <h2 className="review-banner-title">
              <span className="review-banner-icon">✏️</span>
              {t.practiceTitle}
            </h2>
            <p className="review-banner-desc">{t.practiceDesc}</p>
          </div>
          <Link href="/practice" className="review-banner-btn">
            {t.practice}
          </Link>
        </div>
      </section>

      {/* Yanlışlarım kartı */}
      <section className="review-banner">
        <div className="review-banner-content">
          <div className="review-banner-left">
            <h2 className="review-banner-title">
              <span className="review-banner-icon">📝</span>
              {t.myMistakes}
            </h2>
            <p className="review-banner-desc">
              {mistakeCount > 0
                ? `${mistakeCount} ${t.mistakesCount}`
                : t.noMistakes}
            </p>
          </div>
          <Link
            href="/practice/mistakes"
            className={`review-banner-btn ${mistakeCount === 0 ? "review-banner-btn-disabled" : ""}`}
            aria-disabled={mistakeCount === 0}
            onClick={(e) => {
              if (mistakeCount === 0) e.preventDefault();
            }}
          >
            {t.startMistakesReview}
          </Link>
        </div>
      </section>

      {/* Gramer kartı */}
      <section className="review-banner">
        <div className="review-banner-content">
          <div className="review-banner-left">
            <h2 className="review-banner-title">
              <span className="review-banner-icon" style={{ display: "inline-flex", alignItems: "center" }}>
                <svg
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  style={{ width: "1.25rem", height: "1.25rem" }}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
              </span>
              {t.grammar}
            </h2>
            <p className="review-banner-desc">
              {grammarStats.completed} / {grammarStats.total} {t.grammarCompleted.toLowerCase()}
            </p>
          </div>
          <Link href="/grammar" className="review-banner-btn">
            {t.grammar}
          </Link>
        </div>
      </section>

      {/* Ünite listesi */}
      <section>
        <h2 className="section-title">
          <span className="section-title-icon">📚</span>
          {t.units}
        </h2>

        {/* Genel ilerleme çubuğu */}
        {units.length > 0 && (() => {
          const completedCount = Object.values(unitStatuses).filter((s) => s === "completed").length;
          const totalCount = units.length;
          const pct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
          return (
            <div className="overall-progress">
              <div className="overall-progress-text">
                {completedCount} / {totalCount} {t.unitsCompleted}
              </div>
              <div className="review-progress-bar">
                <div className="review-progress-fill" style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })()}

        {units.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">--</div>
            <p className="empty-state-text">{t.noContent}</p>
          </div>
        ) : (
          <div className="units-list">
            {units.map((unit) => {
              const status = unitStatuses[unit.id] || "notStarted";
              const isUnlocked = isUnitUnlocked(unit.id, units, allProgress);

              const badgeCls = status === "completed"
                ? "unit-status-completed"
                : status === "inProgress"
                  ? "unit-status-in-progress"
                  : "unit-status-not-started";
              const badgeText = status === "completed"
                ? t.completed
                : status === "inProgress"
                  ? t.inProgress
                  : t.notStarted;

              if (!isUnlocked) {
                return (
                  <div
                    key={unit.id}
                    role="button"
                    tabIndex={0}
                    className="card opacity-50 grayscale cursor-not-allowed select-none relative"
                    onClick={() => handleLockedClick(unit.id)}
                    title={t.completePreviousUnitToUnlock}
                  >
                    <div className="absolute top-4 right-4 text-muted-foreground p-1.5 rounded-full bg-secondary/80">
                      <Lock className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="unit-card-header pr-8">
                      <span className="unit-card-level">{unit.level}</span>
                      <span className="unit-status-badge unit-status-locked">{t.unitLocked}</span>
                      <span className="unit-card-count">
                        {unit.itemCount} {t.items}
                      </span>
                    </div>
                    <h3 className="unit-card-title text-muted-foreground">
                      {getUnitTitle(unit, uiLang)}
                    </h3>
                    <div className="unit-card-arrow text-muted-foreground flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5" />
                      <span>{t.unitLocked}</span>
                    </div>
                    {lockedNoticeUnitId === unit.id && (
                      <div className="mt-3 py-1.5 px-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-500 dark:text-amber-400 text-xs font-medium text-center">
                        {t.completePreviousUnitToUnlock}
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <Link
                  key={unit.id}
                  href={`/unit/${unit.id}`}
                  className="card card-clickable"
                >
                  <div className="unit-card-header">
                    <span className="unit-card-level">{unit.level}</span>
                    <span className={`unit-status-badge ${badgeCls}`}>{badgeText}</span>
                    <span className="unit-card-count">
                      {unit.itemCount} {t.items}
                    </span>
                  </div>
                  <h3 className="unit-card-title">
                    {getUnitTitle(unit, uiLang)}
                  </h3>
                  <div className="unit-card-arrow">
                    {t.goToUnit} <span>→</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
