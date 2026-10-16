/**
 * Ünite alıştırma sayfası — /unit/[id]/practice
 * O ünitenin item'larıyla sınırlı çoktan seçmeli alıştırma.
 * 5 sorudan en az 4'ü doğruysa progress'te practice=true.
 */

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { db } from "@/lib/db";
import { getUnitById, getUnitTitle } from "@/lib/content";
import { useLang } from "@/lib/lang-context";
import { getMessages } from "@/lib/i18n";
import { generateMultipleChoice } from "@/lib/exercises";
import { setPracticeComplete } from "@/lib/progress";
import { recordMistake, removeMistakeByKey } from "@/lib/mistakes";
import type { Item } from "@/types";
import type { MultipleChoiceQuestion } from "@/lib/exercises";

export default function UnitPracticePage() {
  const params = useParams<{ id: string }>();
  const unit = getUnitById(params.id);
  const { uiLang, translationLang } = useLang();
  const t = getMessages(uiLang);

  const [items, setItems] = useState<Item[]>([]);
  const [questions, setQuestions] = useState<MultipleChoiceQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [phase, setPhase] = useState<"intro" | "active" | "result">("intro");
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (!unit) return;
    async function load() {
      const unitItems = await db.items
        .where("unitId").equals(unit!.id)
        .and((i) => i.type === "word")
        .toArray();
      setItems(unitItems);
      setLoading(false);
    }
    load();
  }, [unit]);

  const startPractice = () => {
    if (items.length < 2) return;
    const q = generateMultipleChoice(items, translationLang, 5);
    setQuestions(q);
    setIndex(0);
    setScore(0);
    setPhase("active");
    setSelected(null);
    setRevealed(false);
  };

  const handleSelect = async (idx: number) => {
    if (revealed) return;
    const q = questions[index];
    setSelected(idx);
    setRevealed(true);
    if (idx === q.correctIndex) {
      setScore((s) => s + 1);
      await removeMistakeByKey("multipleChoice", q.item.id);
    } else {
      await recordMistake({
        exerciseType: "multipleChoice",
        itemId: q.item.id,
        questionData: { question: q.question, options: q.options, correctIndex: q.correctIndex },
        userAnswer: q.options[idx],
        correctAnswer: q.options[q.correctIndex],
      });
    }
  };

  const nextQuestion = async () => {
    if (index + 1 >= questions.length) {
      const pct = Math.round((score / questions.length) * 100);
      await setPracticeComplete(unit!.id, pct);
      setPhase("result");
    } else {
      setIndex((i) => i + 1);
      setSelected(null);
      setRevealed(false);
    }
  };

  const getMeaning = (item: Item): string => {
    const tr = translationLang === "tr" ? item.tr : item.en;
    return tr || item.tr || item.en || "";
  };

  if (!unit || loading) {
    return <div className="page-container"><div className="review-loading">...</div></div>;
  }

  if (phase === "result") {
    const pct = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;
    const passed = pct >= 80;
    return (
      <div className="page-container">
        <div className="practice-result">
          <h2 className="practice-result-title">{t.exerciseComplete}</h2>
          <p className="practice-result-score">{t.yourScore}: {score} / {questions.length} ({pct}%)</p>
          <p className={`test-verdict ${passed ? "test-passed" : "test-failed"}`}>
            {passed ? t.passed : t.failed}
          </p>
          <div className="practice-result-actions">
            <button className="practice-btn practice-btn-primary" onClick={() => { setPhase("intro"); setScore(0); }}>
              {t.retry}
            </button>
            <Link href={`/unit/${unit.id}`} className="practice-btn practice-btn-secondary">
              {t.backToUnit}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (phase === "intro") {
    return (
      <div className="page-container">
        <Link href={`/unit/${unit.id}`} className="back-link">
          <svg className="back-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          {t.backToUnit}
        </Link>
        <div className="page-header">
          <h1 className="page-title">{getUnitTitle(unit, uiLang)} — {t.unitPractice}</h1>
        </div>
        <div className="practice-start-area">
          <button className="practice-btn practice-btn-primary" onClick={startPractice} disabled={items.length < 2}>
            {t.startPractice}
          </button>
        </div>
      </div>
    );
  }

  const q = questions[index];
  const feedbackMeaning = `${q.item.ru} ${t.meaningEquals} ${getMeaning(q.item)}`;

  return (
    <div className="page-container">
      <div className="practice-progress-row">
        <span className="review-progress">{index + 1} / {questions.length}</span>
        <span className="practice-type-badge">{t.unitPractice}</span>
      </div>
      <div className="review-progress-bar">
        <div className="review-progress-fill" style={{ width: `${(index / questions.length) * 100}%` }} />
      </div>

      <div className="flashcard">
        <div className="flashcard-ru">{q.question}</div>
        <p className="practice-instruction">{t.chooseAnswer}</p>
      </div>

      <div className="mc-options">
        {q.options.map((opt, idx) => {
          let cls = "mc-option";
          if (revealed) {
            if (idx === q.correctIndex) cls += " mc-option-correct";
            else if (idx === selected) cls += " mc-option-wrong";
          }
          return (
            <button key={idx} className={cls} onClick={() => handleSelect(idx)} disabled={revealed}>
              {opt}
            </button>
          );
        })}
      </div>

      {revealed && (
        <div className="practice-feedback">
          <div>
            <span className={selected === q.correctIndex ? "feedback-correct" : "feedback-wrong"}>
              {selected === q.correctIndex ? t.correct : t.wrong}
            </span>
            <span className="feedback-meaning"> — {feedbackMeaning}</span>
          </div>
          <button className="practice-btn practice-btn-primary" onClick={nextQuestion}>
            {t.next}
          </button>
        </div>
      )}
    </div>
  );
}
