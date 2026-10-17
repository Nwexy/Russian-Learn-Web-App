/**
 * Ünite test sayfası — /unit/[id]/test
 * O ünitenin item'larından 10 soruluk SADECE çoktan seçmeli (multipleChoice) test.
 * >= %80 geçti (en az 8/10), progress'e test=true yazılır.
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
import { setTestComplete, getProgress } from "@/lib/progress";
import { recordMistake, removeMistakeByKey } from "@/lib/mistakes";
import { PronunciationText } from "@/components/pronunciation-text";
import { shouldShowPronunciation } from "@/lib/exercises-ui";
import { SpeakButton } from "@/components/SpeakButton";
import { addXp, updateStreak } from "@/lib/gamification";
import type { Item } from "@/types";

interface TestQuestion {
  type: "mc";
  item: Item;
  question: string;
  options: string[];
  correctIndex: number;
  direction: "ru-to-target" | "target-to-ru";
}

type Phase = "intro" | "active" | "result";

export default function TestPage() {
  const params = useParams<{ id: string }>();
  const unit = getUnitById(params.id);
  const { uiLang, translationLang } = useLang();
  const t = getMessages(uiLang);

  const [items, setItems] = useState<Item[]>([]);
  const [questions, setQuestions] = useState<TestQuestion[]>([]);
  const [phase, setPhase] = useState<Phase>("intro");
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isLocked, setIsLocked] = useState(false);

  // Answer state
  const [mcSelected, setMcSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  useEffect(() => {
    if (!unit) return;
    async function load() {
      let unitItems = await db.items
        .where("unitId").equals(unit!.id)
        .and((i) => i.type === "word")
        .toArray();

      // IndexedDB henüz seed edilmediyse veya boşsa doğrudan ünite JSON içeriğini kullan
      if (unitItems.length === 0 && unit?.items) {
        unitItems = unit.items
          .filter((i) => i.type === "word")
          .map((raw) => ({
            id: raw.id,
            unitId: unit.id,
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

      const prog = await getProgress(unit!.id);
      if (!prog.lessonDone) {
        setIsLocked(true);
        setLoading(false);
        return;
      }

      setItems(unitItems);
      setLoading(false);
    }
    load();
  }, [unit]);

  /** Test sorularını üret (Sadece 10 çoktan seçmeli soru) */
  const startTest = () => {
    if (items.length < 2) return;

    const mcQs = generateMultipleChoice(items, translationLang, 10);
    const testQs: TestQuestion[] = mcQs.map((q) => ({
      type: "mc" as const,
      item: q.item,
      question: q.question,
      options: q.options,
      correctIndex: q.correctIndex,
      direction: q.direction,
    }));

    setQuestions(testQs);
    setIndex(0);
    setScore(0);
    setPhase("active");
    resetQ();
  };

  const resetQ = () => {
    setMcSelected(null);
    setRevealed(false);
    setIsCorrect(null);
  };

  /** Çoktan seçmeli cevabı kontrol et */
  const checkAnswer = async (selectedIdx: number) => {
    const q = questions[index];
    const correct = selectedIdx === q.correctIndex;
    setIsCorrect(correct);
    setRevealed(true);

    if (correct) {
      setScore((s) => s + 1);
      await removeMistakeByKey("multipleChoice", q.item.id);
    } else {
      await recordMistake({
        exerciseType: "multipleChoice",
        itemId: q.item.id,
        questionData: {
          question: q.question,
          options: q.options,
          correctIndex: q.correctIndex,
          direction: q.direction,
        },
        userAnswer: q.options[selectedIdx],
        correctAnswer: q.options[q.correctIndex],
      });
    }
  };

  /** Sonraki soru veya sonuç */
  const nextQuestion = async () => {
    if (index + 1 >= questions.length) {
      // Test bitti — sonucu kaydet
      const finalScore = Math.round((score / questions.length) * 100);
      await setTestComplete(unit!.id, finalScore);
      if (score > 0) {
        await addXp(score * 2);
      }
      await updateStreak();
      setPhase("result");
    } else {
      setIndex((i) => i + 1);
      resetQ();
    }
  };

  /** Anlam metni */
  const getMeaning = (item: Item): string => {
    const tr = translationLang === "tr" ? item.tr : item.en;
    return tr || item.tr || item.en || "";
  };

  if (!unit || loading) {
    return (
      <div className="page-container">
        <div className="review-loading">...</div>
      </div>
    );
  }

  if (isLocked) {
    return (
      <div className="page-container">
        <Link href={`/unit/${unit.id}`} className="back-link">
          <svg className="back-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          {t.backToUnit}
        </Link>
        <div className="empty-state">
          <p className="empty-state-text">{t.mustCompleteLessonFirst}</p>
          <Link href={`/unit/${unit.id}`} className="practice-btn practice-btn-primary" style={{ marginTop: "1rem" }}>
            {t.lesson}
          </Link>
        </div>
      </div>
    );
  }

  /* ========================================
     SONUÇ EKRANI
     ======================================== */
  if (phase === "result") {
    const pct = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;
    const passed = pct >= 80;

    return (
      <div className="page-container">
        <div className="practice-result">
          <h2 className="practice-result-title">{t.testResult}</h2>
          <p className="practice-result-score">
            {t.yourScore}: {score} / {questions.length} ({pct}%)
          </p>
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

  /* ========================================
     GİRİŞ EKRANI
     ======================================== */
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
          <h1 className="page-title">{getUnitTitle(unit, uiLang)} — {t.unitTest}</h1>
          <p className="page-subtitle">{unit.items.length} {t.items}</p>
        </div>

        <div className="practice-start-area">
          <button className="practice-btn practice-btn-primary" onClick={startTest} disabled={items.length < 2}>
            {t.startTest}
          </button>
        </div>
      </div>
    );
  }

  /* ========================================
     AKTİF SORU (SADECE ÇOKTAN SEÇMELİ)
     ======================================== */
  const q = questions[index];
  const feedbackMeaning = `${q.item.ru} ${t.meaningEquals} ${getMeaning(q.item)}`;
  const ruQuestion = q.direction !== "target-to-ru";

  const handleSelect = async (idx: number) => {
    if (revealed) return;
    setMcSelected(idx);
    await checkAnswer(idx);
  };

  return (
    <div className="page-container">
      <div className="practice-progress-row">
        <span className="review-progress">{index + 1} / {questions.length}</span>
        <span className="practice-type-badge">{t.unitTest}</span>
      </div>
      <div className="review-progress-bar">
        <div className="review-progress-fill" style={{ width: `${(index / questions.length) * 100}%` }} />
      </div>

      <div className="flashcard">
        <div className={ruQuestion ? "flashcard-ru" : "flashcard-ru flashcard-target"} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
          <span>{q.question}</span>
          {ruQuestion && q.question && <SpeakButton text={q.question} size="sm" />}
        </div>
        {ruQuestion && shouldShowPronunciation(revealed) && <PronunciationText item={q.item} />}
        <p className="practice-instruction">{ruQuestion ? t.chooseAnswer : t.chooseRussian}</p>
      </div>

      <div className="mc-options">
        {q.options.map((opt, idx) => {
          let cls = "mc-option";
          if (revealed) {
            if (idx === q.correctIndex) cls += " mc-option-correct";
            else if (idx === mcSelected) cls += " mc-option-wrong";
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
            <span className={isCorrect ? "feedback-correct" : "feedback-wrong"}>
              {isCorrect ? t.correct : t.wrong}
            </span>
            <span className="feedback-meaning"> — {feedbackMeaning}</span>
            {shouldShowPronunciation(revealed) && (
              <PronunciationText item={q.item} className="pronunciation-inline" />
            )}
          </div>
          <button className="practice-btn practice-btn-primary" onClick={nextQuestion}>
            {t.next}
          </button>
        </div>
      )}
    </div>
  );
}
