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
import type { Item, Review, UnitStatus } from "@/types";

export default function HomePage() {
  const units = getAllUnits();
  const { uiLang } = useLang();
  const t = getMessages(uiLang);

  /** Bugün tekrar edilecek kart sayısı */
  const [dueCount, setDueCount] = useState<number>(0);
  const [mistakeCount, setMistakeCount] = useState<number>(0);
  const [unitStatuses, setUnitStatuses] = useState<Record<string, UnitStatus>>({});
  const [loading, setLoading] = useState(true);

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
        <span className="hero-emoji">🇷🇺</span>
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
