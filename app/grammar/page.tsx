/**
 * Gramer notları listesi sayfası — app/grammar/page.tsx
 * Tüm gramer konularını listeler.
 * Her notun durumunu (Başlanmadı / Devam ediyor / Tamamlandı) Dexie'den okur.
 */

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { loadGrammarNotes } from "@/lib/grammar";
import { getAllGrammarProgress } from "@/lib/grammar-progress";
import { useLang } from "@/lib/lang-context";
import { getMessages } from "@/lib/i18n";
import type { GrammarProgress } from "@/types";

export default function GrammarPage() {
  const notes = loadGrammarNotes();
  const { uiLang } = useLang();
  const t = getMessages(uiLang);

  const [progressMap, setProgressMap] = useState<Record<string, GrammarProgress>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProgress() {
      try {
        const list = await getAllGrammarProgress();
        const map: Record<string, GrammarProgress> = {};
        for (const item of list) {
          map[item.noteId] = item;
        }
        setProgressMap(map);
      } catch {
        setProgressMap({});
      } finally {
        setLoading(false);
      }
    }
    fetchProgress();
  }, []);

  const completedCount = Object.values(progressMap).filter((p) => p.completed).length;
  const totalCount = notes.length;
  const pct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="page-container">
      {/* Geri dön butonu */}
      <Link href="/" className="back-link">
        <svg
          className="back-icon"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        {t.back}
      </Link>

      <div className="page-header">
        <h1 className="page-title">{t.grammarNotes}</h1>
        <p className="page-subtitle">
          {uiLang === "tr"
            ? "Temel Rusça dilbilgisi kuralları, tablolar ve mini alıştırmalar."
            : "Essential Russian grammar rules, reference tables, and mini exercises."}
        </p>
      </div>

      {/* İlerleme çubuğu */}
      {!loading && (
        <div className="overall-progress" style={{ marginBottom: "1.5rem" }}>
          <div className="overall-progress-text">
            {completedCount} / {totalCount} {t.grammarCompleted.toLowerCase()}
          </div>
          <div className="review-progress-bar">
            <div className="review-progress-fill" style={{ width: `${pct}%` }} />
          </div>
        </div>
      )}

      {/* Gramer notları listesi */}
      <div className="units-list">
        {notes.map((note) => {
          const prog = progressMap[note.id];
          const isCompleted = prog?.completed;
          const isInProgress = !isCompleted && prog?.lastViewedAt;

          const badgeCls = isCompleted
            ? "unit-status-completed"
            : isInProgress
            ? "unit-status-in-progress"
            : "unit-status-not-started";

          const badgeText = isCompleted
            ? t.grammarCompleted
            : isInProgress
            ? t.grammarInProgress
            : t.grammarNotStarted;

          const title = uiLang === "tr" ? note.titleTr : note.titleEn;
          const summary = uiLang === "tr" ? note.summaryTr : note.summaryEn;

          return (
            <Link
              key={note.id}
              href={`/grammar/${note.id}`}
              className="card card-clickable"
            >
              <div className="unit-card-header">
                <span className="unit-card-level">{note.level}</span>
                <span className={`unit-status-badge ${badgeCls}`}>{badgeText}</span>
              </div>
              <h2 className="unit-card-title">{title}</h2>
              <p
                style={{
                  fontSize: "0.9rem",
                  color: "var(--text-secondary)",
                  marginTop: "0.5rem",
                  lineHeight: 1.5,
                }}
              >
                {summary}
              </p>
              <div className="unit-card-arrow">
                {t.reviewGrammar} <span>→</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
