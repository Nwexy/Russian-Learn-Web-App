/**
 * Ünite test sayfası — /unit/[id]/test
 * O ünitenin item'larından 10 soruluk karışık test.
 * Soru tipleri: 4 çoktan seçmeli, 3 boşluk doldurma, 3 dinleme.
 * >= %80 geçti, progress'e test=true yazılır.
 */

"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { db } from "@/lib/db";
import { getUnitById, getUnitTitle } from "@/lib/content";
import { useLang } from "@/lib/lang-context";
import { getMessages } from "@/lib/i18n";
import { generateMultipleChoice, generateFillBlank, generateListening } from "@/lib/exercises";
import { setTestComplete } from "@/lib/progress";
import { recordMistake, removeMistakeByKey } from "@/lib/mistakes";
import { speak, isTTSSupported } from "@/lib/tts";
import type { Item } from "@/types";

interface TestQuestion {
  type: "mc" | "fill" | "listen";
  item: Item;
  // MC fields
  question?: string;
  options?: string[];
  correctIndex?: number;
  // Fill fields
  sentenceWithBlank?: string;
  correctWord?: string;
  hint?: string;
  // Listen fields (correctWord reused)
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
  const [ttsOk, setTtsOk] = useState(true);

  // Answer state
  const [answer, setAnswer] = useState("");
  const [mcSelected, setMcSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!unit) return;
    async function load() {
      const unitItems = await db.items
        .where("unitId").equals(unit!.id)
        .and((i) => i.type === "word")
        .toArray();
      setItems(unitItems);
      setTtsOk(isTTSSupported());
      setLoading(false);
    }
    load();
  }, [unit]);

  /** Test sorularını üret */
  const startTest = () => {
    if (items.length < 4) return;

    const mcQs = generateMultipleChoice(items, translationLang, 4);
    const fillQs = generateFillBlank(items, translationLang, 3);
    const listenQs = generateListening(items, ttsOk ? 3 : 0);

    const testQs: TestQuestion[] = [
      ...mcQs.map((q) => ({
        type: "mc" as const,
        item: q.item,
        question: q.question,
        options: q.options,
        correctIndex: q.correctIndex,
      })),
      ...fillQs.map((q) => ({
        type: "fill" as const,
        item: q.item,
        sentenceWithBlank: q.sentenceWithBlank,
        correctWord: q.correctWord,
        hint: q.hint,
      })),
      ...listenQs.map((q) => ({
        type: "listen" as const,
        item: q.item,
        correctWord: q.correctWord,
      })),
    ];

    setQuestions(testQs);
    setIndex(0);
    setScore(0);
    setPhase("active");
    resetQ();
  };

  const resetQ = () => {
    setAnswer("");
    setMcSelected(null);
    setRevealed(false);
    setIsCorrect(null);
  };

  /** Cevabı kontrol et */
  const checkAnswer = async (userAns: string, correctAns: string) => {
    const q = questions[index];
    const correct = userAns.trim().toLowerCase() === correctAns.trim().toLowerCase();
    setIsCorrect(correct);
    setRevealed(true);

    const exType = q.type === "mc" ? "multipleChoice" : q.type === "fill" ? "fillBlank" : "listening";

    if (correct) {
      setScore((s) => s + 1);
      await removeMistakeByKey(exType, q.item.id);
    } else {
      await recordMistake({
        exerciseType: exType,
        itemId: q.item.id,
        questionData: { correctWord: correctAns },
        userAnswer: userAns.trim(),
        correctAnswer: correctAns,
      });
    }
  };

  /** Sonraki soru veya sonuç */
  const nextQuestion = async () => {
    if (index + 1 >= questions.length) {
      // Test bitti — sonucu kaydet
      const pct = Math.round((score + (isCorrect ? 0 : 0)) / questions.length * 100);
      // score zaten güncellendi, pct tekrar hesapla
      const finalScore = Math.round((score / questions.length) * 100);
      await setTestComplete(unit!.id, finalScore);
      setPhase("result");
    } else {
      setIndex((i) => i + 1);
      resetQ();
      setTimeout(() => inputRef.current?.focus(), 50);
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
          <button className="practice-btn practice-btn-primary" onClick={startTest} disabled={items.length < 4}>
            {t.startTest}
          </button>
        </div>
      </div>
    );
  }

  /* ========================================
     AKTİF SORU
     ======================================== */
  const q = questions[index];
  const feedbackMeaning = `${q.item.ru} ${t.meaningEquals} ${getMeaning(q.item)}`;

  /* --- Çoktan Seçmeli --- */
  if (q.type === "mc" && q.options && q.correctIndex !== undefined) {
    const handleSelect = async (idx: number) => {
      if (revealed) return;
      setMcSelected(idx);
      await checkAnswer(q.options![idx], q.options![q.correctIndex!]);
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
          <div className="flashcard-ru">{q.question}</div>
          <p className="practice-instruction">{t.chooseAnswer}</p>
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
            </div>
            <button className="practice-btn practice-btn-primary" onClick={nextQuestion}>
              {t.next}
            </button>
          </div>
        )}
      </div>
    );
  }

  /* --- Boşluk Doldurma --- */
  if (q.type === "fill" && q.correctWord) {
    const handleCheck = async () => {
      if (revealed) return;
      await checkAnswer(answer, q.correctWord!);
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
          <div className="flashcard-ru">{q.sentenceWithBlank}</div>
          {q.hint && <p className="practice-hint">{q.hint}</p>}
        </div>

        <div className="practice-input-row">
          <input
            ref={inputRef}
            type="text"
            className="practice-input"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !revealed) handleCheck(); }}
            placeholder={t.typeYourAnswer}
            disabled={revealed}
            autoFocus
          />
          {!revealed && (
            <button className="practice-btn practice-btn-primary" onClick={handleCheck}>
              {t.check}
            </button>
          )}
        </div>

        {revealed && (
          <div className="practice-feedback">
            <div>
              <span className={isCorrect ? "feedback-correct" : "feedback-wrong"}>
                {isCorrect ? t.correct : `${t.wrong} — ${t.showCorrect}: ${q.correctWord}`}
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

  /* --- Dinleme --- */
  if (q.type === "listen" && q.correctWord) {
    const handlePlay = () => speak(q.correctWord!);
    const handleCheck = async () => {
      if (revealed) return;
      await checkAnswer(answer, q.correctWord!);
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
          <div className="listen-btns">
            <button className="listen-play-btn" onClick={handlePlay}>
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} width={28} height={28}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072M17.95 6.05a8 8 0 010 11.9M6.5 8.5l5-4v15l-5-4H4a1 1 0 01-1-1v-5a1 1 0 011-1h2.5z" />
              </svg>
              {t.play}
            </button>
            <button className="listen-replay-btn" onClick={handlePlay}>{t.replay}</button>
          </div>
          <p className="practice-instruction">{t.listenAndType}</p>
        </div>

        <div className="practice-input-row">
          <input
            ref={inputRef}
            type="text"
            className="practice-input"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !revealed) handleCheck(); }}
            placeholder={t.typeYourAnswer}
            disabled={revealed}
            autoFocus
          />
          {!revealed && (
            <button className="practice-btn practice-btn-primary" onClick={handleCheck}>
              {t.check}
            </button>
          )}
        </div>

        {revealed && (
          <div className="practice-feedback">
            <div>
              <span className={isCorrect ? "feedback-correct" : "feedback-wrong"}>
                {isCorrect ? t.correct : `${t.wrong} — ${t.showCorrect}: ${q.correctWord}`}
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

  return null;
}
