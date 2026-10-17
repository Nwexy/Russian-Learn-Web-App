/**
 * Alıştırma sayfası — /practice
 * 4 alıştırma tipi: Çoktan Seçmeli, Boşluk Doldurma, Eşleştirme, Dinleme.
 * Üstte ünite seçici: "Tüm üniteler" veya belirli bir ünite.
 * Çoktan seçmeli sorular çift yönlü (%70 RU->EN/TR, %30 EN/TR->RU).
 * Telaffuz gösterimi: Rusça soruda ve cevap açıklamasında.
 */

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { db } from "@/lib/db";
import { useLang } from "@/lib/lang-context";
import { getMessages } from "@/lib/i18n";
import { getAllUnits, getUnitById, getUnitTitle } from "@/lib/content";
import {
  generateMultipleChoice,
  generateFillBlank,
  generateMatching,
  generateListening,
} from "@/lib/exercises";
import type {
  MultipleChoiceQuestion,
  FillBlankQuestion,
  MatchingQuestion,
  ListeningQuestion,
} from "@/lib/exercises";
import { speak, isTTSSupported } from "@/lib/tts";
import { recordMistake, removeMistakeByKey, getMistakeCount } from "@/lib/mistakes";
import { PronunciationText } from "@/components/pronunciation-text";
import { shouldShowPronunciation, renderHighlightedText } from "@/lib/exercises-ui";
import { SpeakButton } from "@/components/SpeakButton";
import { addXp, updateStreak } from "@/lib/gamification";
import type { Item, ExerciseType } from "@/types";

/** Alıştırma durumları */
type Phase = "select" | "active" | "result";

/** Item'ın çeviri dilindeki anlamını döndürür */
function getMeaning(item: Item, translationLang: string): string {
  const tr = translationLang === "tr" ? item.tr : item.en;
  return tr || item.tr || item.en || "";
}

export default function PracticePage() {
  const { uiLang, translationLang, showPronunciation } = useLang();
  const t = getMessages(uiLang);
  const units = getAllUnits();

  const [selectedUnitId, setSelectedUnitId] = useState<string>("all");
  const [completedUnitIds, setCompletedUnitIds] = useState<Set<string>>(new Set());
  const [items, setItems] = useState<Item[]>([]);
  const [exerciseType, setExerciseType] = useState<ExerciseType>("multipleChoice");
  const [phase, setPhase] = useState<Phase>("select");
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [mistakeCount, setMistakeCount] = useState(0);

  // Çoktan seçmeli state
  const [mcQuestions, setMcQuestions] = useState<MultipleChoiceQuestion[]>([]);
  const [mcIndex, setMcIndex] = useState(0);
  const [mcSelected, setMcSelected] = useState<number | null>(null);
  const [mcRevealed, setMcRevealed] = useState(false);

  // Boşluk doldurma state
  const [fbQuestions, setFbQuestions] = useState<FillBlankQuestion[]>([]);
  const [fbIndex, setFbIndex] = useState(0);
  const [fbAnswer, setFbAnswer] = useState("");
  const [fbRevealed, setFbRevealed] = useState(false);
  const [fbCorrect, setFbCorrect] = useState<boolean | null>(null);

  // Eşleştirme state
  const [matchData, setMatchData] = useState<MatchingQuestion | null>(null);
  const [matchSelectedLeft, setMatchSelectedLeft] = useState<string | null>(null);
  const [matchSelectedRight, setMatchSelectedRight] = useState<string | null>(null);
  const [matchedIds, setMatchedIds] = useState<Set<string>>(new Set());
  const [matchWrong, setMatchWrong] = useState(false);
  const [matchShuffledRight, setMatchShuffledRight] = useState<{ id: string; translation: string }[]>([]);
  const [matchAttempts, setMatchAttempts] = useState(0);
  const [matchCorrectCount, setMatchCorrectCount] = useState(0);

  // Dinleme state
  const [listenQuestions, setListenQuestions] = useState<ListeningQuestion[]>([]);
  const [listenIndex, setListenIndex] = useState(0);
  const [listenAnswer, setListenAnswer] = useState("");
  const [listenRevealed, setListenRevealed] = useState(false);
  const [listenCorrect, setListenCorrect] = useState<boolean | null>(null);
  const [ttsSupported, setTtsSupported] = useState(true);

  const inputRef = useRef<HTMLInputElement>(null);

  /** Belirli bir havuzla alıştırma oturumunu başlatır */
  const initExerciseWith = useCallback((pool: Item[], type: ExerciseType) => {
    setScore(0);
    setPhase("active");

    switch (type) {
      case "multipleChoice": {
        const q = generateMultipleChoice(pool, translationLang, 10);
        setMcQuestions(q);
        setMcIndex(0);
        setMcSelected(null);
        setMcRevealed(false);
        break;
      }
      case "fillBlank": {
        const q = generateFillBlank(pool, translationLang, 10);
        setFbQuestions(q);
        setFbIndex(0);
        setFbAnswer("");
        setFbRevealed(false);
        setFbCorrect(null);
        break;
      }
      case "matching": {
        const q = generateMatching(pool, translationLang, 6);
        setMatchData(q);
        setMatchSelectedLeft(null);
        setMatchSelectedRight(null);
        setMatchedIds(new Set());
        setMatchWrong(false);
        setMatchAttempts(0);
        setMatchCorrectCount(0);
        const shuffled = [...q.pairs.map((p) => ({ id: p.id, translation: p.translation }))];
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        setMatchShuffledRight(shuffled);
        break;
      }
      case "listening": {
        const q = generateListening(pool, 10);
        setListenQuestions(q);
        setListenIndex(0);
        setListenAnswer("");
        setListenRevealed(false);
        setListenCorrect(null);
        break;
      }
    }
  }, [translationLang]);

  /** İlk veri yükleme */
  useEffect(() => {
    async function load() {
      let allItems = await db.items.where("type").equals("word").toArray();
      if (allItems.length === 0) {
        allItems = getAllUnits().flatMap((u) => {
          const unitData = getUnitById(u.id);
          return (unitData?.items || [])
            .filter((i) => i.type === "word")
            .map((raw) => ({
              id: raw.id,
              unitId: u.id,
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
        });
      }
      setItems(allItems);
      setTtsSupported(isTTSSupported());
      const mc = await getMistakeCount();
      setMistakeCount(mc);

      const allProgress = await db.progress.toArray();
      const compIds = new Set(
        allProgress.filter((p) => Boolean(p.lessonDone)).map((p) => p.unitId)
      );
      setCompletedUnitIds(compIds);

      setLoading(false);
    }
    load();
  }, []);

  /** Ünite seçici değiştiğinde: mevcut oturum sıfırlanıp yeni sorular üretilir */
  const handleUnitChange = async (unitId: string) => {
    if (unitId !== "all" && !completedUnitIds.has(unitId)) return;
    setSelectedUnitId(unitId);
    let loaded: Item[];
    if (unitId === "all") {
      loaded = await db.items.where("type").equals("word").toArray();
      if (loaded.length === 0) {
        loaded = getAllUnits().flatMap((u) => {
          const unitData = getUnitById(u.id);
          return (unitData?.items || [])
            .filter((i) => i.type === "word")
            .map((raw) => ({
              id: raw.id,
              unitId: u.id,
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
        });
      }
    } else {
      loaded = await db.items
        .where("unitId").equals(unitId)
        .and((i) => i.type === "word")
        .toArray();
      if (loaded.length === 0) {
        const unitData = getUnitById(unitId);
        if (unitData) {
          loaded = unitData.items
            .filter((i) => i.type === "word")
            .map((raw) => ({
              id: raw.id,
              unitId: unitData.id,
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
      }
    }
    setItems(loaded);

    if (loaded.length === 0) {
      setPhase("select");
      setScore(0);
      return;
    }

    if (phase === "active") {
      initExerciseWith(loaded, exerciseType);
    } else if (phase === "result") {
      setPhase("select");
      setScore(0);
    }
  };

  /** Butonla başlat */
  const startExercise = useCallback(() => {
    if (items.length === 0) return;
    initExerciseWith(items, exerciseType);
  }, [items, exerciseType, initExerciseWith]);

  /* ========================================
     ÇOKTAN SEÇMELİ
     ======================================== */
  const handleMcSelect = async (idx: number) => {
    if (mcRevealed) return;
    const q = mcQuestions[mcIndex];
    setMcSelected(idx);
    setMcRevealed(true);
    if (idx === q.correctIndex) {
      setScore((s) => s + 1);
      await removeMistakeByKey("multipleChoice", q.item.id);
    } else {
      await recordMistake({
        exerciseType: "multipleChoice",
        itemId: q.item.id,
        questionData: { question: q.question, options: q.options, correctIndex: q.correctIndex, direction: q.direction },
        userAnswer: q.options[idx],
        correctAnswer: q.options[q.correctIndex],
      });
    }
  };

  const finishExercise = async (finalScore: number) => {
    if (finalScore > 0) {
      await addXp(finalScore * 1);
    }
    await updateStreak();
    setPhase("result");
  };

  const handleMcNext = async () => {
    if (mcIndex + 1 >= mcQuestions.length) {
      await finishExercise(score);
    } else {
      setMcIndex((i) => i + 1);
      setMcSelected(null);
      setMcRevealed(false);
    }
  };

  /* ========================================
     BOŞLUK DOLDURMA
     ======================================== */
  const handleFbCheck = async () => {
    if (fbRevealed) return;
    const q = fbQuestions[fbIndex];
    const isCorrect = fbAnswer.trim().toLowerCase() === q.correctWord.toLowerCase();
    setFbCorrect(isCorrect);
    setFbRevealed(true);
    if (isCorrect) {
      setScore((s) => s + 1);
      await removeMistakeByKey("fillBlank", q.item.id);
    } else {
      await recordMistake({
        exerciseType: "fillBlank",
        itemId: q.item.id,
        questionData: { sentenceWithBlank: q.sentenceWithBlank, correctWord: q.correctWord, hint: q.hint },
        userAnswer: fbAnswer.trim(),
        correctAnswer: q.correctWord,
      });
    }
  };

  const handleFbNext = async () => {
    if (fbIndex + 1 >= fbQuestions.length) {
      await finishExercise(score);
    } else {
      setFbIndex((i) => i + 1);
      setFbAnswer("");
      setFbRevealed(false);
      setFbCorrect(null);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  /* ========================================
     EŞLEŞTİRME
     ======================================== */
  const handleMatchLeft = (id: string) => {
    if (matchedIds.has(id)) return;
    setMatchSelectedLeft(id);
    setMatchWrong(false);

    // Eşleştirmede sol sütundaki Rusça kelimeye tıklanınca otomatik speak(ruText, "ru-RU")
    // Seslendirme ayarı (showPronunciation) kapalıysa ses çalmaz
    if (Boolean(showPronunciation) && isTTSSupported()) {
      const pair = matchData?.pairs.find((p) => p.id === id);
      if (pair?.ru) {
        speak(pair.ru, "ru-RU");
      }
    }

    if (matchSelectedRight !== null) {
      checkMatch(id, matchSelectedRight);
    }
  };

  const handleMatchRight = (id: string) => {
    if (matchedIds.has(id)) return;
    setMatchSelectedRight(id);
    setMatchWrong(false);
    if (matchSelectedLeft !== null) {
      checkMatch(matchSelectedLeft, id);
    }
  };

  const checkMatch = async (leftId: string, rightId: string) => {
    setMatchAttempts((a) => a + 1);
    if (leftId === rightId) {
      const newMatched = new Set(matchedIds);
      newMatched.add(leftId);
      setMatchedIds(newMatched);
      setMatchCorrectCount((c) => c + 1);
      setMatchSelectedLeft(null);
      setMatchSelectedRight(null);
      await removeMistakeByKey("matching", leftId);

      if (matchData && newMatched.size >= matchData.pairs.length) {
        setTimeout(async () => {
          const finalScore = matchData!.pairs.length;
          setScore(finalScore);
          await finishExercise(finalScore);
        }, 400);
      }
    } else {
      setMatchWrong(true);
      const leftPair = matchData?.pairs.find((p) => p.id === leftId);
      const rightPair = matchData?.pairs.find((p) => p.id === rightId);
      if (leftPair) {
        await recordMistake({
          exerciseType: "matching",
          itemId: leftPair.id,
          questionData: { ru: leftPair.ru, translation: leftPair.translation },
          userAnswer: rightPair?.translation || "",
          correctAnswer: leftPair.translation,
        });
      }
      setTimeout(() => {
        setMatchSelectedLeft(null);
        setMatchSelectedRight(null);
        setMatchWrong(false);
      }, 600);
    }
  };

  /* ========================================
     DİNLEME
     ======================================== */
  const handleListenPlay = () => {
    const q = listenQuestions[listenIndex];
    speak(q.correctWord);
  };

  const handleListenCheck = async () => {
    if (listenRevealed) return;
    const q = listenQuestions[listenIndex];
    const isCorrect = listenAnswer.trim().toLowerCase() === q.correctWord.toLowerCase();
    setListenCorrect(isCorrect);
    setListenRevealed(true);
    if (isCorrect) {
      setScore((s) => s + 1);
      await removeMistakeByKey("listening", q.item.id);
    } else {
      await recordMistake({
        exerciseType: "listening",
        itemId: q.item.id,
        questionData: { correctWord: q.correctWord },
        userAnswer: listenAnswer.trim(),
        correctAnswer: q.correctWord,
      });
    }
  };

  const handleListenNext = async () => {
    if (listenIndex + 1 >= listenQuestions.length) {
      await finishExercise(score);
    } else {
      setListenIndex((i) => i + 1);
      setListenAnswer("");
      setListenRevealed(false);
      setListenCorrect(null);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  /** Üst ünite seçici bileşeni — oturum aktifken (phase === "active") gizlenip bilgi metni gösterilir */
  const isSessionActive = phase === "active";
  const selectedUnit = units.find((u) => u.id === selectedUnitId);
  const activeUnitTitle =
    selectedUnitId === "all"
      ? t.practicingAllUnits
      : selectedUnit
        ? `${t.unit}: ${getUnitTitle(selectedUnit, uiLang)}`
        : t.practicingAllUnits;

  const unitFilterSelector = (
    <div className="practice-unit-filter">
      {isSessionActive ? (
        <span className="practice-unit-active-badge">{activeUnitTitle}</span>
      ) : (
        <>
          <label htmlFor="unit-filter-select" className="practice-unit-filter-label">
            {t.selectUnit}:
          </label>
          <select
            id="unit-filter-select"
            className="practice-unit-select"
            value={selectedUnitId}
            onChange={(e) => handleUnitChange(e.target.value)}
          >
            <option value="all">{t.allUnits}</option>
            {units.map((u) => {
              const isCompleted = completedUnitIds.has(u.id);
              return (
                <option key={u.id} value={u.id} disabled={!isCompleted}>
                  {getUnitTitle(u, uiLang)} ({u.level}){!isCompleted ? ` — ${t.locked}` : ""}
                </option>
              );
            })}
          </select>
        </>
      )}
    </div>
  );

  /* ========================================
     RENDER — Yükleniyor
     ======================================== */
  if (loading) {
    return (
      <div className="page-container">
        <div className="review-loading">...</div>
      </div>
    );
  }

  /* ========================================
     RENDER — Sonuç ekranı
     ======================================== */
  if (phase === "result") {
    const total =
      exerciseType === "multipleChoice"
        ? mcQuestions.length
        : exerciseType === "fillBlank"
          ? fbQuestions.length
          : exerciseType === "matching"
            ? (matchData?.pairs.length ?? 0)
            : listenQuestions.length;
    const pct = total > 0 ? Math.round((score / total) * 100) : 0;

    return (
      <div className="page-container">
        {unitFilterSelector}
        <div className="practice-result">
          <div className="practice-result-icon">
            {pct >= 80 ? "🎉" : pct >= 50 ? "👍" : "📖"}
          </div>
          <h2 className="practice-result-title">{t.exerciseComplete}</h2>
          <p className="practice-result-score">
            {t.yourScore}: {score} / {total} ({pct}%)
          </p>
          <div className="practice-result-actions">
            <button
              className="practice-btn practice-btn-primary"
              onClick={() => {
                setPhase("select");
                setScore(0);
              }}
            >
              {t.tryAgain}
            </button>
            <Link href="/" className="practice-btn practice-btn-secondary">
              {t.backToHome}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  /* ========================================
     RENDER — Tür seçimi
     ======================================== */
  if (phase === "select") {
    const types: { key: ExerciseType; label: string; icon: string; desc: string }[] = [
      { key: "multipleChoice", label: t.multipleChoice, icon: "🔤", desc: t.chooseAnswer },
      { key: "fillBlank", label: t.fillBlank, icon: "✏️", desc: t.typeYourAnswer },
      { key: "matching", label: t.matching, icon: "🔗", desc: t.matchPairs },
      { key: "listening", label: t.listening, icon: "🎧", desc: t.listenAndType },
    ];

    const hasEnoughItems = items.length >= 2;

    return (
      <div className="page-container">
        <Link href="/" className="back-link">
          <svg className="back-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          {t.backToHome}
        </Link>

        {unitFilterSelector}

        <div className="page-header">
          <h1 className="page-title">{t.practiceTitle}</h1>
          <p className="page-subtitle">{t.practiceDesc}</p>
        </div>

        {items.length === 0 ? (
          <div className="empty-state">
            <p className="empty-state-text">{t.noExercisesForUnit}</p>
          </div>
        ) : (
          <>
            <div className="practice-type-grid">
              {types.map((tp) => (
                <button
                  key={tp.key}
                  className={`practice-type-card ${exerciseType === tp.key ? "practice-type-active" : ""}`}
                  onClick={() => setExerciseType(tp.key)}
                  disabled={tp.key === "listening" && !ttsSupported}
                >
                  <span className="practice-type-icon">{tp.icon}</span>
                  <span className="practice-type-label">{tp.label}</span>
                  <span className="practice-type-desc">{tp.desc}</span>
                  {tp.key === "listening" && !ttsSupported && (
                    <span className="practice-type-warning">{t.ttsNotSupported}</span>
                  )}
                </button>
              ))}
            </div>

            <div className="practice-start-area">
              <button
                className="practice-btn practice-btn-primary"
                onClick={startExercise}
                disabled={!hasEnoughItems}
              >
                {t.start}
              </button>
            </div>
          </>
        )}

        {/* Yanlışlarım butonu */}
        <div className="mistakes-banner">
          <Link
            href="/practice/mistakes"
            className={`mistakes-banner-link ${mistakeCount === 0 ? "mistakes-banner-disabled" : ""}`}
            onClick={(e) => { if (mistakeCount === 0) e.preventDefault(); }}
          >
            <span className="mistakes-banner-icon">📝</span>
            <span className="mistakes-banner-text">
              {mistakeCount > 0
                ? `${t.myMistakes} (${mistakeCount})`
                : t.noMistakes}
            </span>
          </Link>
        </div>
      </div>
    );
  }

  /* ========================================
     RENDER — Çoktan Seçmeli
     ======================================== */
  if (exerciseType === "multipleChoice" && mcQuestions.length > 0) {
    const q = mcQuestions[mcIndex];
    const ruQuestion = q.direction !== "target-to-ru";

    return (
      <div className="page-container">
        {unitFilterSelector}
        <div className="practice-progress-row">
          <span className="review-progress">{mcIndex + 1} / {mcQuestions.length}</span>
          <span className="practice-type-badge">{t.multipleChoice}</span>
        </div>
        <div className="review-progress-bar">
          <div className="review-progress-fill" style={{ width: `${(mcIndex / mcQuestions.length) * 100}%` }} />
        </div>

        <div className="flashcard">
          {(q.item.hexCode || getUnitById(q.item.unitId)?.items.find((i) => i.id === q.item.id)?.hexCode) && (
            <div style={{ position: "absolute", top: "1rem", right: "1rem", zIndex: 10 }}>
              <div 
                className="w-8 h-8 rounded-md border border-gray-400 dark:border-gray-600 shadow-sm" 
                style={{
                  backgroundColor: q.item.hexCode || getUnitById(q.item.unitId)?.items.find((i) => i.id === q.item.id)?.hexCode,
                  width: "2rem",
                  height: "2rem",
                  minWidth: "2rem",
                  minHeight: "2rem",
                  borderRadius: "0.375rem",
                  border: "1px solid #9ca3af",
                }} 
                title={q.item.en || q.item.ru}
              />
            </div>
          )}
          <div className={ruQuestion ? "flashcard-ru" : "flashcard-ru flashcard-target"} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
            <span>{q.question}</span>
            {ruQuestion && <SpeakButton text={q.question} size="sm" />}
          </div>
          {ruQuestion && shouldShowPronunciation(mcRevealed) && <PronunciationText item={q.item} />}
          <p className="practice-instruction">{ruQuestion ? t.chooseAnswer : t.chooseRussian}</p>
        </div>

        <div className="mc-options">
          {q.options.map((opt, idx) => {
            let cls = "mc-option";
            if (mcRevealed) {
              if (idx === q.correctIndex) cls += " mc-option-correct";
              else if (idx === mcSelected) cls += " mc-option-wrong";
            } else if (idx === mcSelected) {
              cls += " mc-option-selected";
            }
            return (
              <button key={idx} className={cls} onClick={() => handleMcSelect(idx)} disabled={mcRevealed}>
                {opt}
              </button>
            );
          })}
        </div>

        {mcRevealed && (
          <div className="practice-feedback">
            <div>
              <span className={mcSelected === q.correctIndex ? "feedback-correct" : "feedback-wrong"}>
                {mcSelected === q.correctIndex ? t.correct : t.wrong}
              </span>
              <span className="feedback-meaning">
                {" "} — {q.item.ru} {t.meaningEquals} {getMeaning(q.item, translationLang)}
              </span>
              {shouldShowPronunciation(mcRevealed) && (
                <PronunciationText item={q.item} className="pronunciation-inline" />
              )}
            </div>
            <button className="practice-btn practice-btn-primary" onClick={handleMcNext}>
              {t.next}
            </button>
          </div>
        )}
      </div>
    );
  }

  /* ========================================
     RENDER — Boşluk Doldurma
     ======================================== */
  if (exerciseType === "fillBlank" && fbQuestions.length > 0) {
    const q = fbQuestions[fbIndex];
    return (
      <div className="page-container">
        {unitFilterSelector}
        <div className="practice-progress-row">
          <span className="review-progress">{fbIndex + 1} / {fbQuestions.length}</span>
          <span className="practice-type-badge">{t.fillBlank}</span>
        </div>
        <div className="review-progress-bar">
          <div className="review-progress-fill" style={{ width: `${(fbIndex / fbQuestions.length) * 100}%` }} />
        </div>

        <div className="flashcard">
          {(q.item.hexCode || getUnitById(q.item.unitId)?.items.find((i) => i.id === q.item.id)?.hexCode) && (
            <div style={{ position: "absolute", top: "1rem", right: "1rem", zIndex: 10 }}>
              <div 
                className="w-8 h-8 rounded-md border border-gray-400 dark:border-gray-600 shadow-sm" 
                style={{
                  backgroundColor: q.item.hexCode || getUnitById(q.item.unitId)?.items.find((i) => i.id === q.item.id)?.hexCode,
                  width: "2rem",
                  height: "2rem",
                  minWidth: "2rem",
                  minHeight: "2rem",
                  borderRadius: "0.375rem",
                  border: "1px solid #9ca3af",
                }} 
                title={q.item.en || q.item.ru}
              />
            </div>
          )}
          <div className="flashcard-ru" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
            <span>{q.sentenceWithBlank}</span>
            <SpeakButton text={q.sentenceWithBlank} size="sm" />
          </div>
          {shouldShowPronunciation(fbRevealed) && <PronunciationText item={q.item} />}
          {(q.fullTranslation || q.hintSentence) && (
            <p className="practice-hint">
              {renderHighlightedText(q.fullTranslation || q.hintSentence, fbRevealed)}
            </p>
          )}
        </div>

        <div className="practice-input-row">
          <input
            ref={inputRef}
            type="text"
            className="practice-input"
            value={fbAnswer}
            onChange={(e) => setFbAnswer(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !fbRevealed) handleFbCheck(); }}
            placeholder={t.typeYourAnswer}
            disabled={fbRevealed}
            autoFocus
          />
          {!fbRevealed && (
            <button className="practice-btn practice-btn-primary" onClick={handleFbCheck}>
              {t.check}
            </button>
          )}
        </div>

        {fbRevealed && (
          <div className="practice-feedback">
            <div>
              <span className={fbCorrect ? "feedback-correct" : "feedback-wrong"}>
                {fbCorrect ? t.correct : `${t.wrong} — ${t.showCorrect}: ${q.correctWord}`}
              </span>
              {shouldShowPronunciation(fbRevealed) && (
                <PronunciationText item={q.item} className="pronunciation-inline" />
              )}
            </div>
            <button className="practice-btn practice-btn-primary" onClick={handleFbNext}>
              {t.next}
            </button>
          </div>
        )}
      </div>
    );
  }

  /* ========================================
     RENDER — Eşleştirme
     ======================================== */
  if (exerciseType === "matching" && matchData) {
    return (
      <div className="page-container">
        {unitFilterSelector}
        <div className="practice-progress-row">
          <span className="review-progress">
            {matchedIds.size} / {matchData.pairs.length}
          </span>
          <span className="practice-type-badge">{t.matching}</span>
        </div>
        <div className="review-progress-bar">
          <div className="review-progress-fill" style={{ width: `${(matchedIds.size / matchData.pairs.length) * 100}%` }} />
        </div>

        <p className="practice-instruction" style={{ textAlign: "center", marginBottom: "1.5rem" }}>{t.matchPairs}</p>

        <div className="match-grid">
          {/* Sol sütun — Rusça */}
          <div className="match-column">
            {matchData.pairs.map((pair) => {
              const matched = matchedIds.has(pair.id);
              let cls = "match-item";
              if (matched) cls += " match-item-matched";
              else if (matchSelectedLeft === pair.id) cls += matchWrong ? " match-item-wrong" : " match-item-selected";
              return (
                <button key={pair.id} className={cls} onClick={() => handleMatchLeft(pair.id)} disabled={matched}>
                  {pair.ru}
                </button>
              );
            })}
          </div>

          {/* Sağ sütun — Çeviri (karışık) */}
          <div className="match-column">
            {matchShuffledRight.map((item) => {
              const matched = matchedIds.has(item.id);
              let cls = "match-item";
              if (matched) cls += " match-item-matched";
              else if (matchSelectedRight === item.id) cls += matchWrong ? " match-item-wrong" : " match-item-selected";
              return (
                <button key={`r-${item.id}`} className={cls} onClick={() => handleMatchRight(item.id)} disabled={matched}>
                  {item.translation}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  /* ========================================
     RENDER — Dinleme
     ======================================== */
  if (exerciseType === "listening" && listenQuestions.length > 0) {
    return (
      <div className="page-container">
        {unitFilterSelector}
        <div className="practice-progress-row">
          <span className="review-progress">{listenIndex + 1} / {listenQuestions.length}</span>
          <span className="practice-type-badge">{t.listening}</span>
        </div>
        <div className="review-progress-bar">
          <div className="review-progress-fill" style={{ width: `${(listenIndex / listenQuestions.length) * 100}%` }} />
        </div>

        <div className="flashcard">
          {(() => {
            const curItem = listenQuestions[listenIndex].item;
            const hexColor = curItem.hexCode || getUnitById(curItem.unitId)?.items.find((i) => i.id === curItem.id)?.hexCode;
            return hexColor ? (
              <div style={{ position: "absolute", top: "1rem", right: "1rem", zIndex: 10 }}>
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
                  title={curItem.en || curItem.ru}
                />
              </div>
            ) : null;
          })()}
          <div className="listen-btns">
            <button className="listen-play-btn" onClick={handleListenPlay}>
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} width={28} height={28}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072M17.95 6.05a8 8 0 010 11.9M6.5 8.5l5-4v15l-5-4H4a1 1 0 01-1-1v-5a1 1 0 011-1h2.5z" />
              </svg>
              {t.play}
            </button>
            <button className="listen-replay-btn" onClick={handleListenPlay}>
              {t.replay}
            </button>
          </div>
          <p className="practice-instruction">{t.listenAndType}</p>
        </div>

        <div className="practice-input-row">
          <input
            ref={inputRef}
            type="text"
            className="practice-input"
            value={listenAnswer}
            onChange={(e) => setListenAnswer(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !listenRevealed) handleListenCheck(); }}
            placeholder={t.typeYourAnswer}
            disabled={listenRevealed}
            autoFocus
          />
          {!listenRevealed && (
            <button className="practice-btn practice-btn-primary" onClick={handleListenCheck}>
              {t.check}
            </button>
          )}
        </div>

        {listenRevealed && (
          <div className="practice-feedback">
            <div>
              <span className={listenCorrect ? "feedback-correct" : "feedback-wrong"}>
                {listenCorrect
                  ? t.correct
                  : `${t.wrong} — ${t.showCorrect}: ${listenQuestions[listenIndex].correctWord}`}
              </span>
              <span className="feedback-meaning">
                {" "} — {listenQuestions[listenIndex].item.ru} {t.meaningEquals} {getMeaning(listenQuestions[listenIndex].item, translationLang)}
              </span>
              {shouldShowPronunciation(listenRevealed) && (
                <PronunciationText item={listenQuestions[listenIndex].item} className="pronunciation-inline" />
              )}
            </div>
            <button className="practice-btn practice-btn-primary" onClick={handleListenNext}>
              {t.next}
            </button>
          </div>
        )}
      </div>
    );
  }

  return null;
}
