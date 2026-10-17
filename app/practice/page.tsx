/**
 * Alıştırma sayfası — /practice
 * Faz 7.5: Çoklu Ünite Seçimi (Multi-select) ve Karışık Mod (Mixed Mode).
 * 
 * 1. Ünite Seçimi:
 *    - Çoklu seçim desteği (checkbox listesi).
 *    - "Tüm Üniteler" seçildiğinde tüm tamamlanmış üniteler seçilir ve kilitlenir.
 *    - Kullanıcı "Tüm Üniteler"i kaldırıp belirli üniteleri seçebilir.
 *    - Sadece dersi tamamlanmış üniteler listelenir (Faz 6.6 kuralı).
 * 
 * 2. Karışık Mod (Mixed Mode):
 *    - 4 soru tipini (Çoktan seçmeli, Boşluk doldurma, Eşleştirme, Dinleme) rastgele harmanlayan 10 soruluk alıştırma.
 *    - İstenirse tekil modlar da seçilebilir.
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
  generateMixedPractice,
} from "@/lib/exercises";
import type {
  MultipleChoiceQuestion,
  FillBlankQuestion,
  MatchingQuestion,
  ListeningQuestion,
  MixedQuestion,
} from "@/lib/exercises";
import { speak, isTTSSupported } from "@/lib/tts";
import { recordMistake, removeMistakeByKey, getMistakeCount } from "@/lib/mistakes";
import { PronunciationText } from "@/components/pronunciation-text";
import { shouldShowPronunciation, renderHighlightedText } from "@/lib/exercises-ui";
import { SpeakButton } from "@/components/SpeakButton";
import type { Item, ExerciseType } from "@/types";

/** Alıştırma modu: 4 tekil tür veya Karışık Mod */
export type PracticeMode = "mixed" | ExerciseType;

/** Alıştırma durumları */
type Phase = "select" | "active" | "result";

/** Fisher-Yates ile kopya karıştırma (eşleştirme sağ sütunu için) */
function shuffledPairs<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Item'ın çeviri dilindeki anlamını döndürür */
function getMeaning(item: Item, translationLang: string): string {
  const tr = translationLang === "tr" ? item.tr : item.en;
  return tr || item.tr || item.en || "";
}

export default function PracticePage() {
  const { uiLang, translationLang, showPronunciation } = useLang();
  const t = getMessages(uiLang);
  const units = getAllUnits();

  // Çoklu ünite seçimi durumu
  const [completedUnitIds, setCompletedUnitIds] = useState<Set<string>>(new Set());
  const [isAllUnits, setIsAllUnits] = useState(true);
  const [selectedUnits, setSelectedUnits] = useState<string[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [items, setItems] = useState<Item[]>([]);
  const [exerciseType, setExerciseType] = useState<PracticeMode>("mixed");
  const [phase, setPhase] = useState<Phase>("select");
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [mistakeCount, setMistakeCount] = useState(0);
  const [ttsSupported, setTtsSupported] = useState(true);

  // Karışık mod (Mixed) state
  const [mixedQuestions, setMixedQuestions] = useState<MixedQuestion[]>([]);
  const [mixedIndex, setMixedIndex] = useState(0);
  const [mixedRevealed, setMixedRevealed] = useState(false);
  const [mixedIsCorrect, setMixedIsCorrect] = useState<boolean | null>(null);
  const [mixedAnswer, setMixedAnswer] = useState("");
  const [mixedMcSelected, setMixedMcSelected] = useState<number | null>(null);
  const [mixedMatchLeft, setMixedMatchLeft] = useState<string | null>(null);
  const [mixedMatchRight, setMixedMatchRight] = useState<string | null>(null);
  const [mixedMatchedIds, setMixedMatchedIds] = useState<Set<string>>(new Set());
  const [mixedMatchWrong, setMixedMatchWrong] = useState(false);
  const [mixedMatchHadError, setMixedMatchHadError] = useState(false);
  const [mixedMatchRightOrder, setMixedMatchRightOrder] = useState<{ id: string; translation: string }[]>([]);

  // Çoktan seçmeli state (Tekil mod)
  const [mcQuestions, setMcQuestions] = useState<MultipleChoiceQuestion[]>([]);
  const [mcIndex, setMcIndex] = useState(0);
  const [mcSelected, setMcSelected] = useState<number | null>(null);
  const [mcRevealed, setMcRevealed] = useState(false);

  // Boşluk doldurma state (Tekil mod)
  const [fbQuestions, setFbQuestions] = useState<FillBlankQuestion[]>([]);
  const [fbIndex, setFbIndex] = useState(0);
  const [fbAnswer, setFbAnswer] = useState("");
  const [fbRevealed, setFbRevealed] = useState(false);
  const [fbCorrect, setFbCorrect] = useState<boolean | null>(null);

  // Eşleştirme state (Tekil mod)
  const [matchData, setMatchData] = useState<MatchingQuestion | null>(null);
  const [matchSelectedLeft, setMatchSelectedLeft] = useState<string | null>(null);
  const [matchSelectedRight, setMatchSelectedRight] = useState<string | null>(null);
  const [matchedIds, setMatchedIds] = useState<Set<string>>(new Set());
  const [matchWrong, setMatchWrong] = useState(false);
  const [matchShuffledRight, setMatchShuffledRight] = useState<{ id: string; translation: string }[]>([]);
  const [matchAttempts, setMatchAttempts] = useState(0);
  const [matchCorrectCount, setMatchCorrectCount] = useState(0);

  // Dinleme state (Tekil mod)
  const [listenQuestions, setListenQuestions] = useState<ListeningQuestion[]>([]);
  const [listenIndex, setListenIndex] = useState(0);
  const [listenAnswer, setListenAnswer] = useState("");
  const [listenRevealed, setListenRevealed] = useState(false);
  const [listenCorrect, setListenCorrect] = useState<boolean | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  /** Dersi tamamlanmış ve alıştırması olan üniteler */
  const availableUnits = units.filter((u) => u.hasExercises && completedUnitIds.has(u.id));

  // Dropdown dışına tıklandığında kapat
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownOpen]);

  /** Karışık mod sorusunu hazırla */
  const prepareMixedQuestion = useCallback((q: MixedQuestion) => {
    setMixedRevealed(false);
    setMixedIsCorrect(null);
    setMixedAnswer("");
    setMixedMcSelected(null);
    setMixedMatchLeft(null);
    setMixedMatchRight(null);
    setMixedMatchedIds(new Set());
    setMixedMatchWrong(false);
    setMixedMatchHadError(false);

    if (q.kind === "matching") {
      setMixedMatchRightOrder(shuffledPairs(q.data.pairs.map((p) => ({ id: p.id, translation: p.translation }))));
    }
    if (q.kind === "listening" && isTTSSupported()) {
      speak(q.data.correctWord);
    }
  }, []);

  /** Seçilen filtrelere göre kelimeleri yükler */
  const loadFilteredItems = useCallback(
    async (all: boolean, selected: string[], compIds: Set<string>): Promise<Item[]> => {
      let allWordItems = await db.items.where("type").equals("word").toArray();
      if (allWordItems.length === 0) {
        allWordItems = getAllUnits().flatMap((u) => {
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

      const activeUnitSet = all ? compIds : new Set(selected);
      return allWordItems.filter((item) => activeUnitSet.has(item.unitId));
    },
    []
  );

  /** Alıştırma oturumunu başlatır */
  const initExerciseWith = useCallback(
    (pool: Item[], type: PracticeMode) => {
      setScore(0);
      setPhase("active");

      switch (type) {
        case "mixed": {
          const qs = generateMixedPractice(pool, translationLang, 10, ttsSupported);
          setMixedQuestions(qs);
          setMixedIndex(0);
          if (qs.length > 0) prepareMixedQuestion(qs[0]);
          break;
        }
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
          const shuffled = shuffledPairs(q.pairs.map((p) => ({ id: p.id, translation: p.translation })));
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
    },
    [translationLang, ttsSupported, prepareMixedQuestion]
  );

  /** İlk veri yükleme */
  useEffect(() => {
    async function load() {
      const allProgress = await db.progress.toArray();
      const compIds = new Set(
        allProgress.filter((p) => Boolean(p.lessonDone)).map((p) => p.unitId)
      );
      setCompletedUnitIds(compIds);

      // Başlangıçta tüm tamamlanmış üniteleri seç
      const validCompletedIds = units
        .filter((u) => u.hasExercises && compIds.has(u.id))
        .map((u) => u.id);
      setSelectedUnits(validCompletedIds);

      const loaded = await loadFilteredItems(true, validCompletedIds, compIds);
      setItems(loaded);
      setTtsSupported(isTTSSupported());
      const mc = await getMistakeCount();
      setMistakeCount(mc);
      setLoading(false);
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** "Tüm Üniteler" seçeneğini değiştir */
  const handleToggleAllUnits = async (checked: boolean) => {
    setIsAllUnits(checked);
    const validIds = availableUnits.map((u) => u.id);
    const nextSelected = checked ? validIds : [];
    setSelectedUnits(nextSelected);

    const loaded = await loadFilteredItems(checked, nextSelected, completedUnitIds);
    setItems(loaded);
  };

  /** Tekil ünite seçimini değiştir */
  const handleToggleUnit = async (unitId: string) => {
    if (isAllUnits) return; // Tüm üniteler aktifken kilitli
    let next: string[];
    if (selectedUnits.includes(unitId)) {
      next = selectedUnits.filter((id) => id !== unitId);
    } else {
      next = [...selectedUnits, unitId];
    }

    // Eğer tamamlanmış tüm üniteler tek tek seçildiyse "Tüm Üniteler"e dön
    const allAvailableSelected =
      availableUnits.length > 0 &&
      availableUnits.every((u) => next.includes(u.id));

    if (allAvailableSelected) {
      setIsAllUnits(true);
      setSelectedUnits(availableUnits.map((u) => u.id));
      const loaded = await loadFilteredItems(true, availableUnits.map((u) => u.id), completedUnitIds);
      setItems(loaded);
    } else {
      setSelectedUnits(next);
      const loaded = await loadFilteredItems(false, next, completedUnitIds);
      setItems(loaded);
    }
  };

  /** Butonla başlat */
  const startExercise = useCallback(() => {
    if (items.length === 0) return;
    initExerciseWith(items, exerciseType);
  }, [items, exerciseType, initExerciseWith]);

  /* ========================================
     KARIŞIK MOD (MIXED) HANDLERLARI
     ======================================== */
  const settleMixed = async (
    correct: boolean,
    type: "multipleChoice" | "fillBlank" | "listening",
    itemId: string,
    questionData: Record<string, unknown>,
    userAnswer: string,
    correctAnswer: string
  ) => {
    setMixedIsCorrect(correct);
    setMixedRevealed(true);
    if (correct) {
      setScore((s) => s + 1);
      await removeMistakeByKey(type, itemId);
    } else {
      await recordMistake({ exerciseType: type, itemId, questionData, userAnswer, correctAnswer });
    }
  };

  const handleMixedNext = () => {
    if (mixedIndex + 1 >= mixedQuestions.length) {
      setPhase("result");
    } else {
      const nextIdx = mixedIndex + 1;
      setMixedIndex(nextIdx);
      prepareMixedQuestion(mixedQuestions[nextIdx]);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  /* ========================================
     TEKİL ÇOKTAN SEÇMELİ HANDLERLARI
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

  const handleMcNext = () => {
    if (mcIndex + 1 >= mcQuestions.length) {
      setPhase("result");
    } else {
      setMcIndex((i) => i + 1);
      setMcSelected(null);
      setMcRevealed(false);
    }
  };

  /* ========================================
     TEKİL BOŞLUK DOLDURMA HANDLERLARI
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

  const handleFbNext = () => {
    if (fbIndex + 1 >= fbQuestions.length) {
      setPhase("result");
    } else {
      setFbIndex((i) => i + 1);
      setFbAnswer("");
      setFbRevealed(false);
      setFbCorrect(null);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  /* ========================================
     TEKİL EŞLEŞTİRME HANDLERLARI
     ======================================== */
  const handleMatchLeft = (id: string) => {
    if (matchedIds.has(id)) return;
    setMatchSelectedLeft(id);
    setMatchWrong(false);

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
        setTimeout(() => {
          setScore(matchData!.pairs.length);
          setPhase("result");
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
     TEKİL DİNLEME HANDLERLARI
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

  const handleListenNext = () => {
    if (listenIndex + 1 >= listenQuestions.length) {
      setPhase("result");
    } else {
      setListenIndex((i) => i + 1);
      setListenAnswer("");
      setListenRevealed(false);
      setListenCorrect(null);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  /** Çoklu ünite tetikleyici başlık metni */
  let triggerTitle = t.allUnitsSelected;
  if (isAllUnits) {
    triggerTitle = `${t.allUnitsSelected} (${availableUnits.length} ${t.unit})`;
  } else if (selectedUnits.length === 1) {
    const u = availableUnits.find((unit) => unit.id === selectedUnits[0]);
    triggerTitle = u ? `${getUnitTitle(u, uiLang)} (${u.level})` : t.selectUnits;
  } else if (selectedUnits.length > 1) {
    triggerTitle = `${selectedUnits.length} ${t.unit} ${t.multipleUnitsSelected}`;
  } else {
    triggerTitle = `${t.selectUnits} (0)`;
  }

  const isSessionActive = phase === "active";

  /** Çoklu Ünite Seçici Bileşeni */
  const unitFilterSelector = (
    <div className="practice-unit-filter">
      {isSessionActive ? (
        <span className="practice-unit-active-badge">
          {isAllUnits
            ? t.practicingAllUnits
            : `${selectedUnits.length} ${t.unit} (${t.practicingUnit})`}
        </span>
      ) : (
        <>
          <span className="practice-unit-filter-label">{t.selectUnits}:</span>
          <div className="practice-multi-container" ref={dropdownRef}>
            <button
              type="button"
              className="practice-multi-trigger"
              onClick={() => setDropdownOpen((prev) => !prev)}
            >
              <span className="practice-multi-trigger-text">{triggerTitle}</span>
              <svg
                className={`practice-multi-chevron ${dropdownOpen ? "practice-multi-chevron-open" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {dropdownOpen && (
              <div className="practice-multi-dropdown">
                {/* Tüm Üniteler seçeneği */}
                <label className="practice-multi-item practice-multi-item-all">
                  <input
                    type="checkbox"
                    className="practice-multi-checkbox"
                    checked={isAllUnits}
                    onChange={(e) => handleToggleAllUnits(e.target.checked)}
                  />
                  <span className="practice-multi-label">{t.allUnitsSelected}</span>
                  <span className="practice-multi-badge">{availableUnits.length} {t.unit}</span>
                </label>

                <div className="practice-multi-divider" />

                {/* Ünite listesi */}
                <div className="practice-multi-list">
                  {availableUnits.length === 0 ? (
                    <div style={{ padding: "0.5rem", fontSize: "0.85rem", color: "var(--text-muted)" }}>
                      {t.mustCompleteLessonFirst}
                    </div>
                  ) : (
                    availableUnits.map((u) => {
                      const checked = isAllUnits || selectedUnits.includes(u.id);
                      return (
                        <label
                          key={u.id}
                          className={`practice-multi-item ${isAllUnits ? "practice-multi-item-locked" : ""}`}
                        >
                          <input
                            type="checkbox"
                            className="practice-multi-checkbox"
                            checked={checked}
                            disabled={isAllUnits}
                            onChange={() => handleToggleUnit(u.id)}
                          />
                          <span className="practice-multi-label">{getUnitTitle(u, uiLang)}</span>
                          <span className="practice-multi-badge">{u.level}</span>
                        </label>
                      );
                    })
                  )}
                </div>

                <div className="practice-multi-footer">
                  <button
                    type="button"
                    className="practice-multi-done-btn"
                    onClick={() => setDropdownOpen(false)}
                  >
                    {t.save}
                  </button>
                </div>
              </div>
            )}
          </div>
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
      exerciseType === "mixed"
        ? mixedQuestions.length
        : exerciseType === "multipleChoice"
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
            {/* Büyükçe Mixed Mode (Karışık Mod) Kartı */}
            <div className="practice-mixed-container">
              <button
                type="button"
                className={`practice-mixed-card ${exerciseType === "mixed" ? "practice-mixed-active" : ""}`}
                onClick={() => setExerciseType("mixed")}
              >
                <div className="practice-mixed-left">
                  <span className="practice-mixed-icon">🎲</span>
                  <div className="practice-mixed-text">
                    <div className="practice-mixed-title-row">
                      <span className="practice-mixed-title">{t.mixedMode}</span>
                      <span className="practice-mixed-badge">10 {uiLang === "tr" ? "Soru" : "Questions"}</span>
                    </div>
                    <span className="practice-mixed-desc">
                      {uiLang === "tr"
                        ? "Çoktan seçmeli, boşluk doldurma, eşleştirme ve dinleme sorularını rastgele harmanlar."
                        : "Randomly blends multiple choice, fill in the blank, matching, and listening."}
                    </span>
                  </div>
                </div>
                <div className="practice-mixed-radio">
                  <span className={`practice-radio-dot ${exerciseType === "mixed" ? "practice-radio-dot-active" : ""}`} />
                </div>
              </button>
            </div>

            {/* Tekil Modlar Izgarası */}
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
            onClick={(e) => {
              if (mistakeCount === 0) e.preventDefault();
            }}
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
     RENDER — KARIŞIK MOD (MIXED)
     ======================================== */
  if (exerciseType === "mixed" && mixedQuestions.length > 0) {
    const q = mixedQuestions[mixedIndex];

    const typeLabel =
      q.kind === "multipleChoice"
        ? t.multipleChoice
        : q.kind === "fillBlank"
          ? t.fillBlank
          : q.kind === "matching"
            ? t.matching
            : t.listening;

    const mixedHeader = (
      <>
        {unitFilterSelector}
        <div className="practice-progress-row">
          <span className="review-progress">{mixedIndex + 1} / {mixedQuestions.length}</span>
          <span className="practice-type-badge">{t.mixedMode} — {typeLabel}</span>
        </div>
        <div className="review-progress-bar">
          <div className="review-progress-fill" style={{ width: `${(mixedIndex / mixedQuestions.length) * 100}%` }} />
        </div>
      </>
    );

    const mixedFeedback = (item: Item | null, wrongText?: string) => (
      <div className="practice-feedback">
        <div>
          <span className={mixedIsCorrect ? "feedback-correct" : "feedback-wrong"}>
            {mixedIsCorrect ? t.correct : wrongText ? `${t.wrong} — ${t.showCorrect}: ${wrongText}` : t.wrong}
          </span>
          {item && (
            <span className="feedback-meaning">
              {" "} — {item.ru} {t.meaningEquals} {getMeaning(item, translationLang)}
            </span>
          )}
          {item && shouldShowPronunciation(mixedRevealed) && (
            <PronunciationText item={item} className="pronunciation-inline" />
          )}
        </div>
        <button className="practice-btn practice-btn-primary" onClick={handleMixedNext}>
          {t.next}
        </button>
      </div>
    );

    // Mixed — Çoktan Seçmeli
    if (q.kind === "multipleChoice") {
      const mc = q.data;
      const ruQuestion = mc.direction !== "target-to-ru";

      const handleSelect = async (idx: number) => {
        if (mixedRevealed) return;
        setMixedMcSelected(idx);
        await settleMixed(
          idx === mc.correctIndex,
          "multipleChoice",
          mc.item.id,
          { question: mc.question, options: mc.options, correctIndex: mc.correctIndex, direction: mc.direction },
          mc.options[idx],
          mc.options[mc.correctIndex]
        );
      };

      return (
        <div className="page-container">
          {mixedHeader}
          <div className="flashcard">
            {(mc.item.hexCode || getUnitById(mc.item.unitId)?.items.find((i) => i.id === mc.item.id)?.hexCode) && (
              <div style={{ position: "absolute", top: "1rem", right: "1rem", zIndex: 10 }}>
                <div 
                  className="w-8 h-8 rounded-md border border-gray-400 dark:border-gray-600 shadow-sm" 
                  style={{
                    backgroundColor: mc.item.hexCode || getUnitById(mc.item.unitId)?.items.find((i) => i.id === mc.item.id)?.hexCode,
                    width: "2rem",
                    height: "2rem",
                    minWidth: "2rem",
                    minHeight: "2rem",
                    borderRadius: "0.375rem",
                    border: "1px solid #9ca3af",
                  }} 
                  title={mc.item.en || mc.item.ru}
                />
              </div>
            )}
            <div className={ruQuestion ? "flashcard-ru" : "flashcard-ru flashcard-target"} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
              <span>{mc.question}</span>
              {ruQuestion && <SpeakButton text={mc.question} size="sm" />}
            </div>
            {ruQuestion && shouldShowPronunciation(mixedRevealed) && <PronunciationText item={mc.item} />}
            <p className="practice-instruction">{ruQuestion ? t.chooseAnswer : t.chooseRussian}</p>
          </div>
          <div className="mc-options">
            {mc.options.map((opt, idx) => {
              let cls = "mc-option";
              if (mixedRevealed) {
                if (idx === mc.correctIndex) cls += " mc-option-correct";
                else if (idx === mixedMcSelected) cls += " mc-option-wrong";
              } else if (idx === mixedMcSelected) {
                cls += " mc-option-selected";
              }
              return (
                <button key={idx} className={cls} onClick={() => handleSelect(idx)} disabled={mixedRevealed}>
                  {opt}
                </button>
              );
            })}
          </div>
          {mixedRevealed && mixedFeedback(mc.item)}
        </div>
      );
    }

    // Mixed — Boşluk Doldurma
    if (q.kind === "fillBlank") {
      const fb = q.data;
      const handleCheck = async () => {
        if (mixedRevealed) return;
        const correct = mixedAnswer.trim().toLowerCase() === fb.correctWord.toLowerCase();
        await settleMixed(
          correct,
          "fillBlank",
          fb.item.id,
          { sentenceWithBlank: fb.sentenceWithBlank, correctWord: fb.correctWord, hint: fb.hint, fullTranslation: fb.fullTranslation },
          mixedAnswer.trim(),
          fb.correctWord
        );
      };

      return (
        <div className="page-container">
          {mixedHeader}
          <div className="flashcard">
            {(fb.item.hexCode || getUnitById(fb.item.unitId)?.items.find((i) => i.id === fb.item.id)?.hexCode) && (
              <div style={{ position: "absolute", top: "1rem", right: "1rem", zIndex: 10 }}>
                <div 
                  className="w-8 h-8 rounded-md border border-gray-400 dark:border-gray-600 shadow-sm" 
                  style={{
                    backgroundColor: fb.item.hexCode || getUnitById(fb.item.unitId)?.items.find((i) => i.id === fb.item.id)?.hexCode,
                    width: "2rem",
                    height: "2rem",
                    minWidth: "2rem",
                    minHeight: "2rem",
                    borderRadius: "0.375rem",
                    border: "1px solid #9ca3af",
                  }} 
                  title={fb.item.en || fb.item.ru}
                />
              </div>
            )}
            <div className="flashcard-ru" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
              <span>{fb.sentenceWithBlank}</span>
              <SpeakButton text={fb.sentenceWithBlank} size="sm" />
            </div>
            {shouldShowPronunciation(mixedRevealed) && <PronunciationText item={fb.item} />}
            {(fb.fullTranslation || fb.hintSentence) && (
              <p className="practice-hint">
                {renderHighlightedText(fb.fullTranslation || fb.hintSentence, mixedRevealed)}
              </p>
            )}
          </div>
          <div className="practice-input-row">
            <input
              ref={inputRef}
              type="text"
              className="practice-input"
              value={mixedAnswer}
              onChange={(e) => setMixedAnswer(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !mixedRevealed) handleCheck(); }}
              placeholder={t.typeYourAnswer}
              disabled={mixedRevealed}
              autoFocus
            />
            {!mixedRevealed && (
              <button className="practice-btn practice-btn-primary" onClick={handleCheck}>{t.check}</button>
            )}
          </div>
          {mixedRevealed && mixedFeedback(fb.item, fb.correctWord)}
        </div>
      );
    }

    // Mixed — Eşleştirme
    if (q.kind === "matching") {
      const pairs = q.data.pairs;

      const tryMatch = async (leftId: string, rightId: string) => {
        if (leftId === rightId) {
          const updated = new Set(mixedMatchedIds);
          updated.add(leftId);
          setMixedMatchedIds(updated);
          setMixedMatchLeft(null);
          setMixedMatchRight(null);
          await removeMistakeByKey("matching", leftId);

          if (updated.size >= pairs.length) {
            const correct = !mixedMatchHadError;
            setMixedIsCorrect(correct);
            setMixedRevealed(true);
            if (correct) setScore((s) => s + 1);
          }
        } else {
          setMixedMatchWrong(true);
          setMixedMatchHadError(true);
          const leftPair = pairs.find((p) => p.id === leftId);
          const rightPair = pairs.find((p) => p.id === rightId);
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
            setMixedMatchLeft(null);
            setMixedMatchRight(null);
            setMixedMatchWrong(false);
          }, 600);
        }
      };

      const handleLeft = (id: string) => {
        if (mixedMatchedIds.has(id)) return;
        setMixedMatchLeft(id);
        setMixedMatchWrong(false);
        if (Boolean(showPronunciation) && isTTSSupported()) {
          const pair = pairs.find((p) => p.id === id);
          if (pair?.ru) speak(pair.ru, "ru-RU");
        }
        if (mixedMatchRight !== null) tryMatch(id, mixedMatchRight);
      };

      const handleRight = (id: string) => {
        if (mixedMatchedIds.has(id)) return;
        setMixedMatchRight(id);
        setMixedMatchWrong(false);
        if (mixedMatchLeft !== null) tryMatch(mixedMatchLeft, id);
      };

      return (
        <div className="page-container">
          {mixedHeader}
          <p className="practice-instruction" style={{ textAlign: "center", marginBottom: "1.5rem" }}>{t.matchPairs}</p>
          <div className="match-grid">
            <div className="match-column">
              {pairs.map((p) => {
                const done = mixedMatchedIds.has(p.id);
                let cls = "match-item";
                if (done) cls += " match-item-matched";
                else if (mixedMatchLeft === p.id) cls += mixedMatchWrong ? " match-item-wrong" : " match-item-selected";
                return (
                  <button key={p.id} className={cls} onClick={() => handleLeft(p.id)} disabled={done}>
                    {p.ru}
                  </button>
                );
              })}
            </div>
            <div className="match-column">
              {mixedMatchRightOrder.map((it) => {
                const done = mixedMatchedIds.has(it.id);
                let cls = "match-item";
                if (done) cls += " match-item-matched";
                else if (mixedMatchRight === it.id) cls += mixedMatchWrong ? " match-item-wrong" : " match-item-selected";
                return (
                  <button key={`r-${it.id}`} className={cls} onClick={() => handleRight(it.id)} disabled={done}>
                    {it.translation}
                  </button>
                );
              })}
            </div>
          </div>
          {mixedRevealed && (
            <div className="practice-feedback" style={{ marginTop: "1.5rem" }}>
              <span className={mixedIsCorrect ? "feedback-correct" : "feedback-wrong"}>
                {mixedIsCorrect ? t.correct : t.wrong}
              </span>
              <button className="practice-btn practice-btn-primary" onClick={handleMixedNext}>
                {t.next}
              </button>
            </div>
          )}
        </div>
      );
    }

    // Mixed — Dinleme
    if (q.kind === "listening") {
      const lis = q.data;
      const handlePlay = () => speak(lis.correctWord);
      const handleCheck = async () => {
        if (mixedRevealed) return;
        const correct = mixedAnswer.trim().toLowerCase() === lis.correctWord.toLowerCase();
        await settleMixed(
          correct,
          "listening",
          lis.item.id,
          { correctWord: lis.correctWord },
          mixedAnswer.trim(),
          lis.correctWord
        );
      };

      return (
        <div className="page-container">
          {mixedHeader}
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
              value={mixedAnswer}
              onChange={(e) => setMixedAnswer(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !mixedRevealed) handleCheck(); }}
              placeholder={t.typeYourAnswer}
              disabled={mixedRevealed}
              autoFocus
            />
            {!mixedRevealed && (
              <button className="practice-btn practice-btn-primary" onClick={handleCheck}>{t.check}</button>
            )}
          </div>
          {mixedRevealed && mixedFeedback(lis.item, lis.correctWord)}
        </div>
      );
    }
  }

  /* ========================================
     RENDER — Tekil Çoktan Seçmeli
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
     RENDER — Tekil Boşluk Doldurma
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
     RENDER — Tekil Eşleştirme
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
     RENDER — Tekil Dinleme
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
