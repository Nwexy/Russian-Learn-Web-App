/**
 * Gramer notu detay sayfası — app/grammar/[id]/page.tsx
 * İçeriği (metin, tablo, örnekler) sırayla render eder.
 * Örneklerde seslendirme butonu (SpeakButton) yer alır.
 * Sayfa açıldığında markViewed(noteId) çalışır.
 * Mini alıştırmalar tek tek çözülür, tümü doğruysa markCompleted(noteId) çağrılır.
 */

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getGrammarNote } from "@/lib/grammar";
import { markViewed, markCompleted, getGrammarProgress } from "@/lib/grammar-progress";
import { addXp, updateStreak } from "@/lib/gamification";
import { useLang } from "@/lib/lang-context";
import { getMessages } from "@/lib/i18n";
import { SpeakButton } from "@/components/SpeakButton";
import type { GrammarProgress } from "@/types";

export default function GrammarDetailPage() {
  const params = useParams<{ id: string }>();
  const note = getGrammarNote(params.id);
  const { uiLang } = useLang();
  const t = getMessages(uiLang);

  const [progress, setProgress] = useState<GrammarProgress | null>(null);

  // Mini alıştırma durumları
  const [exerciseIndex, setExerciseIndex] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [hasAnswered, setHasAnswered] = useState<boolean>(false);
  const [correctCount, setCorrectCount] = useState<number>(0);
  const [exerciseFinished, setExerciseFinished] = useState<boolean>(false);

  // Sayfa açıldığında görüntülendi olarak işaretle
  useEffect(() => {
    if (!note) return;
    markViewed(note.id).then(() => {
      getGrammarProgress(note.id).then((p) => {
        if (p) setProgress(p);
      });
    });
  }, [note]);

  if (!note) {
    return (
      <div className="page-container">
        <Link href="/grammar" className="back-link">
          <svg className="back-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          {t.backToGrammar}
        </Link>
        <div className="empty-state">
          <p className="empty-state-text">
            {uiLang === "tr" ? "Gramer notu bulunamadı." : "Grammar note not found."}
          </p>
        </div>
      </div>
    );
  }

  const title = uiLang === "tr" ? note.titleTr : note.titleEn;
  const exercises = note.miniExercises || [];
  const currentEx = exercises[exerciseIndex];

  // Seçenek tıklama
  const handleSelectOption = (idx: number) => {
    if (hasAnswered) return;
    setSelectedOption(idx);
    setHasAnswered(true);

    const isCorrect = idx === currentEx.correctIndex;
    if (isCorrect) {
      setCorrectCount((prev) => prev + 1);
    }
  };

  // Sonraki soruya geç veya bitir
  const handleNextQuestion = async () => {
    if (exerciseIndex + 1 < exercises.length) {
      setExerciseIndex((prev) => prev + 1);
      setSelectedOption(null);
      setHasAnswered(false);
    } else {
      // Tüm sorular bitti
      setExerciseFinished(true);
      if (correctCount >= 6) {
        await markCompleted(note.id);
        const updated = await getGrammarProgress(note.id);
        if (updated) setProgress(updated);
        await addXp(15);
        await updateStreak();
      }
    }
  };

  // Alıştırmayı sıfırla
  const handleRestartExercise = () => {
    setExerciseIndex(0);
    setSelectedOption(null);
    setHasAnswered(false);
    setCorrectCount(0);
    setExerciseFinished(false);
  };

  return (
    <div className="page-container">
      {/* Geri dön butonu */}
      <Link href="/grammar" className="back-link">
        <svg className="back-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        {t.backToGrammar}
      </Link>

      {/* Başlık ve durum */}
      <div className="page-header">
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
          <span className="unit-card-level">{note.level}</span>
          {progress?.completed && (
            <span className="unit-status-badge unit-status-completed">
              {t.grammarCompleted}
            </span>
          )}
        </div>
        <h1 className="page-title">{title}</h1>
      </div>

      {/* Bölümleri sırayla render et */}
      <div className="grammar-sections">
        {note.sections.map((sec, secIdx) => {
          if (sec.type === "text") {
            const body = uiLang === "tr" ? sec.bodyTr : sec.bodyEn;
            return (
              <section key={secIdx} className="grammar-section">
                <div className="grammar-text-block">{body}</div>
              </section>
            );
          }

          if (sec.type === "table") {
            const headers = uiLang === "tr" ? sec.headersTr : sec.headersEn;
            return (
              <section key={secIdx} className="grammar-section">
                <div className="grammar-table-container">
                  <table className="grammar-table">
                    <thead>
                      <tr>
                        {headers.map((h, hIdx) => (
                          <th key={hIdx}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {sec.rows.map((row, rIdx) => {
                        const cells = uiLang === "tr" ? row.cellsTr : row.cellsEn;
                        return (
                          <tr key={rIdx}>
                            {cells.map((cell, cIdx) => (
                              <td key={cIdx}>{cell}</td>
                            ))}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
            );
          }

          if (sec.type === "examples") {
            return (
              <section key={secIdx} className="grammar-section">
                <h3
                  style={{
                    fontSize: "1.1rem",
                    fontWeight: 700,
                    marginBottom: "0.75rem",
                    color: "var(--text-primary)",
                  }}
                >
                  {uiLang === "tr" ? "Örnekler" : "Examples"}
                </h3>
                <div className="grammar-examples-grid">
                  {sec.items.map((item, itemIdx) => {
                    const translation = uiLang === "tr" ? item.tr : item.en;
                    return (
                      <div key={itemIdx} className="grammar-example-card">
                        <div className="grammar-example-top">
                          <span className="grammar-example-ru">{item.ru}</span>
                          <SpeakButton text={item.ru} size="sm" />
                        </div>
                        <div className="grammar-example-tr">{translation}</div>
                        {item.note && (
                          <div className="grammar-example-note">{item.note}</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          }

          return null;
        })}
      </div>

      {/* Mini alıştırmalar bölümü */}
      {exercises.length > 0 && (
        <section className="grammar-exercise-box">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "1rem",
              borderBottom: "1px solid var(--border)",
              paddingBottom: "0.75rem",
            }}
          >
            <h3
              style={{
                fontSize: "1.2rem",
                fontWeight: 700,
                color: "var(--text-primary)",
                margin: 0,
              }}
            >
              {uiLang === "tr" ? "Mini Alıştırma" : "Mini Exercise"}
            </h3>
            {!exerciseFinished && (
              <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                {exerciseIndex + 1} / {exercises.length}
              </span>
            )}
          </div>

          {!exerciseFinished ? (
            <div>
              <div className="grammar-exercise-question">{currentEx.question}</div>

              <div className="grammar-options-grid">
                {currentEx.options.map((opt, optIdx) => {
                  let optCls = "grammar-option-btn";
                  if (hasAnswered) {
                    if (optIdx === currentEx.correctIndex) {
                      optCls += " grammar-option-correct";
                    } else if (optIdx === selectedOption) {
                      optCls += " grammar-option-wrong";
                    }
                  }

                  return (
                    <button
                      key={optIdx}
                      type="button"
                      className={optCls}
                      disabled={hasAnswered}
                      onClick={() => handleSelectOption(optIdx)}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>

              {/* Geri bildirim ve sonraki buton */}
              {hasAnswered && (
                <div>
                  <div
                    className={`grammar-feedback-box ${
                      selectedOption === currentEx.correctIndex
                        ? "grammar-feedback-correct"
                        : "grammar-feedback-wrong"
                    }`}
                  >
                    <strong>
                      {selectedOption === currentEx.correctIndex
                        ? t.correct
                        : t.wrong}
                      :{" "}
                    </strong>
                    {uiLang === "tr"
                      ? currentEx.explanationTr
                      : currentEx.explanationEn}
                  </div>

                  <div style={{ textAlign: "right", marginTop: "1rem" }}>
                    <button
                      type="button"
                      className="practice-btn practice-btn-primary"
                      onClick={handleNextQuestion}
                    >
                      {exerciseIndex + 1 < exercises.length ? t.next : t.check}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Sonuç Ekranı */
            <div style={{ textAlign: "center", padding: "1.5rem 0" }}>
              <div
                style={{
                  fontSize: "1.5rem",
                  fontWeight: 800,
                  color: "var(--text-primary)",
                  marginBottom: "0.5rem",
                }}
              >
                {t.result}
              </div>
              <p
                style={{
                  fontSize: "1.1rem",
                  color: "var(--text-secondary)",
                  marginBottom: "1rem",
                }}
              >
                {t.correctAnswers}: {correctCount} / {exercises.length} ({exercises.length > 0 ? Math.round((correctCount / exercises.length) * 100) : 0}%)
              </p>

              {correctCount >= 6 ? (
                <div style={{ marginBottom: "1.5rem" }}>
                  <div style={{ fontSize: "1.15rem", fontWeight: 700, color: "var(--success, #16a34a)", marginBottom: "0.75rem" }}>
                    {uiLang === "tr" ? "Tebrikler, geçtiniz" : "Congratulations, you passed"}
                  </div>
                  <span className="unit-status-badge unit-status-completed" style={{ fontSize: "0.9rem", padding: "0.4rem 1rem" }}>
                    {t.lessonComplete}
                  </span>
                </div>
              ) : (
                <div style={{ marginBottom: "1.5rem" }}>
                  <div style={{ fontSize: "1.15rem", fontWeight: 700, color: "var(--danger, #dc2626)", marginBottom: "0.75rem" }}>
                    {uiLang === "tr" ? "Kaldınız, tekrar deneyin" : "Failed, try again"}
                  </div>
                  <button
                    type="button"
                    className="practice-btn practice-btn-secondary"
                    onClick={handleRestartExercise}
                  >
                    {uiLang === "tr" ? "Tekrar Dene" : t.tryAgain}
                  </button>
                </div>
              )}

              <div>
                <Link href="/grammar" className="practice-btn practice-btn-primary">
                  {t.backToGrammar}
                </Link>
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
