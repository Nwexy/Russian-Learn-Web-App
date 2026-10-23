/**
 * Yanlışlarım sayfası — /practice/mistakes
 * Yanlış yapılan soruları sırayla tekrar sorar.
 * Doğru cevap → kayıt silinir. Yanlış → kayıt güncellenir.
 */

"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, LayoutGroup } from "framer-motion";
import { db } from "@/lib/db";
import { useLang } from "@/lib/lang-context";
import { getMessages } from "@/lib/i18n";
import { getAllMistakes, removeMistake, recordMistake } from "@/lib/mistakes";
import { getHighlightedTranslation } from "@/lib/exercises";
import { getAllUnits, getUnitById } from "@/lib/content";
import { speak, isTTSSupported, initVoices } from "@/lib/tts";
import { PronunciationText } from "@/components/pronunciation-text";
import { shouldShowPronunciation, renderHighlightedText } from "@/lib/exercises-ui";
import { SpeakButton } from "@/components/SpeakButton";
import { Mic, Volume2 } from "lucide-react";
import {
  isSpeechRecognitionSupported,
  recognizeSpeech,
  stopSpeechRecognition,
  compareRussianSpeech,
} from "@/lib/speech";
import type { Mistake, Item } from "@/types";

type Phase = "active" | "result" | "empty";

interface WordToken {
  id: string;
  word: string;
}

const wbSpring = {
  type: "spring",
  stiffness: 300,
  damping: 30,
} as const;

export default function MistakesPage() {
  const { uiLang, translationLang, showPronunciation } = useLang();
  const t = getMessages(uiLang);

  const [mistakes, setMistakes] = useState<Mistake[]>([]);
  const [initialMistakes, setInitialMistakes] = useState<Mistake[]>([]);
  const [itemsMap, setItemsMap] = useState<Map<string, Item>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [phase, setPhase] = useState<Phase>("empty");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [totalAsked, setTotalAsked] = useState(0);
  const [ttsSupported, setTtsSupported] = useState(true);

  // Ortak input state
  const [answer, setAnswer] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState("");

  // MC state
  const [mcSelected, setMcSelected] = useState<number | null>(null);

  // Speaking state
  const [speechSupported, setSpeechSupported] = useState(false);
  const [speakingListening, setSpeakingListening] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);

  // Word Bank state
  const [wbBankTokens, setWbBankTokens] = useState<WordToken[]>([]);
  const [wbSelectedTokens, setWbSelectedTokens] = useState<WordToken[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);

  /** Soruyu hazırla */
  const initQuestion = (idx: number, list: Mistake[]) => {
    stopSpeechRecognition();
    setSpeakingListening(false);
    setSpeechError(null);
    setAnswer("");
    setRevealed(false);
    setIsCorrect(null);
    setFeedbackMsg("");
    setMcSelected(null);

    const m = list[idx];
    if (m && m.exerciseType === "wordBank") {
      const qd = m.questionData || {};
      const words =
        Array.isArray(qd.shuffledWords) && qd.shuffledWords.length > 0
          ? (qd.shuffledWords as string[])
          : Array.isArray(qd.targetWords) && qd.targetWords.length > 0
          ? (qd.targetWords as string[])
          : m.correctAnswer
          ? m.correctAnswer.split(/\s+/).filter(Boolean)
          : [];
      setWbBankTokens(words.map((w, i) => ({ id: `m-wb-${idx}-${i}-${w}`, word: w })));
      setWbSelectedTokens([]);
    } else {
      setWbBankTokens([]);
      setWbSelectedTokens([]);
    }
  };

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const all = await getAllMistakes();
        setMistakes(all);
        setInitialMistakes(all);
        setTotalAsked(all.length);

        // Güvenli öğe haritası oluştur
        let allItems = await db.items.toArray();
        if (allItems.length === 0) {
          allItems = getAllUnits().flatMap((u) => {
            const unitData = getUnitById(u.id);
            return (unitData?.items || []).map((raw) => ({
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
        const map = new Map<string, Item>();
        allItems.forEach((i) => map.set(i.id, i));
        setItemsMap(map);

        setTtsSupported(isTTSSupported());
        initVoices();
        setSpeechSupported(isSpeechRecognitionSupported());

        if (all.length > 0) {
          setPhase("active");
          setCurrentIndex(0);
          initQuestion(0, all);
        } else {
          setPhase("empty");
        }
      } catch (err) {
        console.error("MistakesPage load error:", err);
        setPhase("empty");
      } finally {
        setIsLoading(false);
      }
    }
    load();
    return () => {
      stopSpeechRecognition();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Sonraki soruya geç */
  const nextQuestion = async () => {
    stopSpeechRecognition();
    const nextIdx = currentIndex + 1;
    if (nextIdx >= initialMistakes.length) {
      try {
        const fresh = await getAllMistakes();
        setMistakes(fresh);
      } catch {}
      setPhase("result");
    } else {
      setCurrentIndex(nextIdx);
      initQuestion(nextIdx, initialMistakes);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  /** Cevabı kontrol et */
  const checkAnswer = async (userAns: string, correctAns: string, mistake: Mistake) => {
    const correct = userAns.trim().toLowerCase() === correctAns.trim().toLowerCase();
    setIsCorrect(correct);
    setRevealed(true);

    if (correct) {
      setScore((s) => s + 1);
      setFeedbackMsg(t.mistakeFixed);
      if (mistake.id) {
        try {
          await removeMistake(mistake.id);
        } catch (err) {
          console.error("removeMistake error:", err);
        }
      }
    } else {
      setFeedbackMsg(`${t.mistakeStillWrong} — ${t.showCorrect}: ${correctAns}`);
      try {
        await recordMistake({
          exerciseType: mistake.exerciseType,
          itemId: mistake.itemId,
          questionData: mistake.questionData || {},
          userAnswer: userAns.trim(),
          correctAnswer: correctAns,
        });
      } catch (err) {
        console.error("recordMistake error:", err);
      }
    }
  };

  /** Word Bank kontrol */
  const handleWbPickWord = (token: WordToken) => {
    if (revealed) return;
    setWbBankTokens((prev) => prev.filter((t) => t.id !== token.id));
    setWbSelectedTokens((prev) => [...prev, token]);
  };

  const handleWbUnpickWord = (token: WordToken) => {
    if (revealed) return;
    setWbSelectedTokens((prev) => prev.filter((t) => t.id !== token.id));
    setWbBankTokens((prev) => [...prev, token]);
  };

  const handleWbCheck = async () => {
    if (revealed) return;
    const m = initialMistakes[currentIndex];
    if (!m) return;
    const qd = m.questionData || {};
    const targetWords: string[] =
      Array.isArray(qd.targetWords) && qd.targetWords.length > 0
        ? (qd.targetWords as string[])
        : m.correctAnswer
        ? m.correctAnswer.split(/\s+/).filter(Boolean)
        : [];
    const selectedWords = wbSelectedTokens.map((t) => t.word);
    const correct =
      selectedWords.length === targetWords.length &&
      selectedWords.every((w, i) => w.toLowerCase() === targetWords[i]?.toLowerCase());

    setIsCorrect(correct);
    setRevealed(true);

    const userAns = selectedWords.join(" ");
    const correctAns = (qd.targetSentence as string) || m.correctAnswer || targetWords.join(" ");

    if (correct) {
      setScore((s) => s + 1);
      setFeedbackMsg(t.mistakeFixed);
      if (m.id) {
        try {
          await removeMistake(m.id);
        } catch (err) {
          console.error("removeMistake error:", err);
        }
      }
    } else {
      setFeedbackMsg(`${t.mistakeStillWrong} — ${t.showCorrect}: ${correctAns}`);
      try {
        await recordMistake({
          exerciseType: m.exerciseType,
          itemId: m.itemId,
          questionData: m.questionData || {},
          userAnswer: userAns,
          correctAnswer: correctAns,
        });
      } catch (err) {
        console.error("recordMistake error:", err);
      }
    }
  };

  /* ========================================
     RENDER — Yükleniyor (Spinner)
     ======================================== */
  if (isLoading) {
    return (
      <div className="page-container flex flex-col items-center justify-center min-h-[50vh]">
        <div className="w-10 h-10 border-4 border-accent/20 border-t-accent rounded-full animate-spin mb-4" />
        <p className="text-sm text-muted-foreground font-medium">
          {uiLang === "tr" ? "Yükleniyor..." : "Loading..."}
        </p>
      </div>
    );
  }

  /* ========================================
     RENDER — Yanlış Yok / Boş Durum
     ======================================== */
  if (phase === "empty" || (initialMistakes.length === 0 && !isLoading)) {
    return (
      <div className="page-container">
        <Link href="/" className="back-link">
          <svg className="back-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          {uiLang === "tr" ? "Ana Sayfaya Dön" : "Back to Home"}
        </Link>

        <div className="empty-state">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">
            {uiLang === "tr" ? "Yanlışın yok, harika!" : "No mistakes, great!"}
          </h2>
          <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
            {uiLang === "tr"
              ? "Tüm soruları doğru çözdün veya henüz kayıtlı yanlışın bulunmuyor."
              : "You have answered all questions correctly or have no recorded mistakes."}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/" className="practice-btn practice-btn-primary">
              {uiLang === "tr" ? "Ana Sayfaya Dön" : "Back to Home"}
            </Link>
            <Link href="/practice" className="practice-btn practice-btn-secondary">
              {t.practice}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  /* ========================================
     RENDER — Sonuç ekranı
     ======================================== */
  if (phase === "result") {
    const remaining = mistakes.length;
    const pct = totalAsked > 0 ? Math.round((score / totalAsked) * 100) : 0;

    return (
      <div className="page-container">
        <div className="practice-result">
          <h2 className="practice-result-title">{t.exerciseComplete}</h2>
          <p className="practice-result-score">
            {t.yourScore}: {score} / {totalAsked} ({pct}%)
          </p>
          {remaining > 0 ? (
            <p className="practice-result-score">
              {remaining} {t.mistakesRemaining}
            </p>
          ) : (
            <p className="practice-result-score text-emerald-500 font-semibold">
              {uiLang === "tr" ? "Tüm yanlışlarını düzelttin, tebrikler!" : "All mistakes fixed, congratulations!"}
            </p>
          )}
          <div className="practice-result-actions">
            {remaining > 0 && (
              <button
                className="practice-btn practice-btn-primary"
                onClick={async () => {
                  setIsLoading(true);
                  try {
                    const fresh = await getAllMistakes();
                    setMistakes(fresh);
                    setInitialMistakes(fresh);
                    setTotalAsked(fresh.length);
                    setScore(0);
                    setCurrentIndex(0);
                    if (fresh.length > 0) {
                      setPhase("active");
                      initQuestion(0, fresh);
                    } else {
                      setPhase("empty");
                    }
                  } catch (err) {
                    console.error("Retry mistakes error:", err);
                    setPhase("empty");
                  } finally {
                    setIsLoading(false);
                  }
                }}
              >
                {t.tryAgain}
              </button>
            )}
            <Link href="/" className="practice-btn practice-btn-primary">
              {uiLang === "tr" ? "Ana Sayfaya Dön" : "Back to Home"}
            </Link>
            <Link href="/practice" className="practice-btn practice-btn-secondary">
              {t.practice}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  /* ========================================
     RENDER — Aktif soru
     ======================================== */
  if (currentIndex >= initialMistakes.length) {
    setPhase("result");
    return null;
  }

  const mistake = initialMistakes[currentIndex];
  if (!mistake) return null;

  const qd = mistake.questionData || {};
  const currentItem = itemsMap.get(mistake.itemId);

  const questionHeader = (typeLabel: string) => (
    <>
      <div className="practice-progress-row">
        <span className="review-progress">{currentIndex + 1} / {totalAsked}</span>
        <span className="practice-type-badge">{t.myMistakes} — {typeLabel}</span>
      </div>
      <div className="review-progress-bar">
        <div className="review-progress-fill" style={{ width: `${(currentIndex / totalAsked) * 100}%` }} />
      </div>
    </>
  );

  /* --- Çoktan Seçmeli --- */
  if (mistake.exerciseType === "multipleChoice") {
    const options = Array.isArray(qd.options) ? (qd.options as string[]) : [mistake.correctAnswer];
    const correctIdx = typeof qd.correctIndex === "number" ? qd.correctIndex : 0;
    const question = (qd.question as string) || currentItem?.ru || mistake.correctAnswer;
    const ruQuestion = qd.direction !== "target-to-ru";

    const handleSelect = async (idx: number) => {
      if (revealed) return;
      setMcSelected(idx);
      await checkAnswer(options[idx] || "", options[correctIdx] || mistake.correctAnswer, mistake);
    };

    return (
      <div className="page-container">
        <Link href="/practice" className="back-link">
          <svg className="back-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          {t.practice}
        </Link>

        {questionHeader(t.multipleChoice)}

        <div className="flashcard">
          <div className={ruQuestion ? "flashcard-ru" : "flashcard-ru flashcard-target"} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
            <span>{question}</span>
            {ruQuestion && <SpeakButton text={question} size="sm" />}
          </div>
          {ruQuestion && currentItem && shouldShowPronunciation(revealed) && (
            <PronunciationText item={currentItem} />
          )}
          <p className="practice-instruction">{ruQuestion ? t.chooseAnswer : t.chooseRussian}</p>
        </div>

        <div className="mc-options">
          {options.map((opt, idx) => {
            let cls = "mc-option";
            if (revealed) {
              if (idx === correctIdx) cls += " mc-option-correct";
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
                {feedbackMsg}
              </span>
              {currentItem && shouldShowPronunciation(revealed) && (
                <PronunciationText item={currentItem} className="pronunciation-inline" />
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

  /* --- Boşluk Doldurma --- */
  if (mistake.exerciseType === "fillBlank") {
    const sentence = (qd.sentenceWithBlank as string) || mistake.correctAnswer;
    const correctWord = (qd.correctWord as string) || mistake.correctAnswer;
    const fullTranslation =
      (qd.fullTranslation as string) ||
      (currentItem ? getHighlightedTranslation(currentItem, translationLang) : (qd.hint as string ? `{${qd.hint}}` : ""));

    const handleCheck = async () => {
      if (revealed) return;
      await checkAnswer(answer, correctWord, mistake);
    };

    return (
      <div className="page-container">
        <Link href="/practice" className="back-link">
          <svg className="back-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          {t.practice}
        </Link>

        {questionHeader(t.fillBlank)}

        <div className="flashcard">
          <div className="flashcard-ru" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
            <span>{sentence}</span>
            <SpeakButton text={sentence} size="sm" />
          </div>
          {currentItem && shouldShowPronunciation(revealed) && <PronunciationText item={currentItem} />}
          {fullTranslation && (
            <p className="practice-hint">
              {renderHighlightedText(fullTranslation, revealed)}
            </p>
          )}
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
                {feedbackMsg}
              </span>
              {currentItem && shouldShowPronunciation(revealed) && (
                <PronunciationText item={currentItem} className="pronunciation-inline" />
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

  /* --- Eşleştirme (tek çift) --- */
  if (mistake.exerciseType === "matching") {
    const ru = (qd.ru as string) || currentItem?.ru || "";
    const correctTranslation = (qd.translation as string) || mistake.correctAnswer;

    const handleCheck = async () => {
      if (revealed) return;
      await checkAnswer(answer, correctTranslation, mistake);
    };

    return (
      <div className="page-container">
        <Link href="/practice" className="back-link">
          <svg className="back-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          {t.practice}
        </Link>

        {questionHeader(t.matching)}

        <div className="flashcard">
          <div
            className="flashcard-ru"
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", cursor: "pointer" }}
            onClick={() => {
              if (Boolean(showPronunciation) && isTTSSupported()) {
                speak(ru, "ru-RU");
              }
            }}
            title="Dinle"
          >
            <span>{ru}</span>
            <SpeakButton text={ru} size="sm" />
          </div>
          {currentItem && shouldShowPronunciation(revealed) && <PronunciationText item={currentItem} />}
          <p className="practice-instruction">{t.matchPairs}</p>
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
                {feedbackMsg}
              </span>
              {currentItem && shouldShowPronunciation(revealed) && (
                <PronunciationText item={currentItem} className="pronunciation-inline" />
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

  /* --- Dinleme --- */
  if (mistake.exerciseType === "listening") {
    const correctWord = (qd.correctWord as string) || mistake.correctAnswer;

    const handlePlay = () => speak(correctWord);
    const handleCheck = async () => {
      if (revealed) return;
      await checkAnswer(answer, correctWord, mistake);
    };

    return (
      <div className="page-container">
        <Link href="/practice" className="back-link">
          <svg className="back-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          {t.practice}
        </Link>

        {questionHeader(t.listening)}

        <div className="flashcard">
          {ttsSupported ? (
            <div className="listen-btns">
              <button className="listen-play-btn" onClick={handlePlay}>
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} width={28} height={28}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072M17.95 6.05a8 8 0 010 11.9M6.5 8.5l5-4v15l-5-4H4a1 1 0 01-1-1v-5a1 1 0 011-1h2.5z" />
                </svg>
                {t.play}
              </button>
              <button className="listen-replay-btn" onClick={handlePlay}>
                {t.replay}
              </button>
            </div>
          ) : (
            <p className="practice-type-warning">{t.ttsNotSupported}</p>
          )}
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
                {feedbackMsg}
              </span>
              {currentItem && shouldShowPronunciation(revealed) && (
                <PronunciationText item={currentItem} className="pronunciation-inline" />
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

  /* --- Konuşma (Speaking) --- */
  if (mistake.exerciseType === "speaking") {
    const targetText = (qd.targetText as string) || currentItem?.ru || mistake.correctAnswer;
    const translation =
      (qd.translation as string) ||
      (currentItem ? (translationLang === "tr" ? currentItem.tr : currentItem.en) : "") ||
      "";

    const handleSpeakingMic = async () => {
      if (revealed) return;
      if (speakingListening) {
        stopSpeechRecognition();
        setSpeakingListening(false);
        return;
      }
      setSpeakingListening(true);
      setSpeechError(null);
      try {
        const transcript = await recognizeSpeech("ru-RU");
        setSpeakingListening(false);
        const match = compareRussianSpeech(transcript, targetText, currentItem?.numberValue);
        await checkAnswer(match ? targetText : transcript, targetText, mistake);
      } catch (err: unknown) {
        setSpeakingListening(false);
        const errMsg = err instanceof Error ? err.message : String(err);
        if (errMsg === "not-allowed" || errMsg.includes("permission")) {
          setSpeechError(t.micNotSupported);
        } else if (errMsg === "no-speech") {
          setSpeechError(uiLang === "tr" ? "Ses algılanamadı. Tekrar deneyin." : "No speech detected. Try again.");
        } else {
          setSpeechError(uiLang === "tr" ? "Konuşma tanıma hatası. Tekrar deneyin." : "Speech recognition error. Try again.");
        }
      }
    };

    const isNumber = currentItem?.numberValue !== undefined && currentItem?.numberValue !== null;
    const targetDisplay = isNumber ? `${currentItem.numberValue} (${targetText})` : targetText;

    return (
      <div className="page-container">
        <Link href="/practice" className="back-link">
          <svg className="back-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          {t.practice}
        </Link>

        {questionHeader(t.speaking)}

        <div className="flashcard">
          <div className="flashcard-ru" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
            <span>{targetDisplay}</span>
            <SpeakButton text={targetText} size="sm" />
          </div>
          {translation && <p className="practice-hint">{translation}</p>}
          {currentItem && shouldShowPronunciation(revealed) && <PronunciationText item={currentItem} />}
        </div>

        <div className="flex flex-col items-center justify-center gap-4 my-6">
          <button
            type="button"
            onClick={handleSpeakingMic}
            disabled={revealed && isCorrect === true}
            className={`px-6 py-3.5 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all cursor-pointer shadow-md ${
              speakingListening
                ? "bg-rose-600 text-white animate-pulse ring-4 ring-rose-500/30 hover:bg-rose-700"
                : revealed && isCorrect === true
                ? "bg-emerald-600 text-white cursor-default"
                : "bg-accent text-white hover:opacity-95 ring-2 ring-accent/30"
            }`}
          >
            <Mic className={`w-5 h-5 ${speakingListening ? "animate-bounce" : ""}`} />
            <span>
              {speakingListening
                ? t.listeningState
                : isCorrect === false
                ? t.tryAgain
                : t.startSpeaking}
            </span>
          </button>

          <button
            type="button"
            onClick={() => speak(targetText)}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-secondary text-foreground hover:bg-secondary/80 transition-colors cursor-pointer border border-border"
          >
            <Volume2 className="w-4 h-4 text-accent" />
            <span>{t.play}</span>
          </button>

          {speechError && (
            <div className="text-xs text-rose-500 bg-rose-500/10 border border-rose-500/30 px-3.5 py-2 rounded-xl text-center max-w-md">
              {speechError}
            </div>
          )}

          {revealed && (
            <div className="practice-feedback w-full max-w-md">
              <div>
                <span className={isCorrect ? "feedback-correct" : "feedback-wrong"}>
                  {feedbackMsg}
                </span>
              </div>
              <button className="practice-btn practice-btn-primary" onClick={nextQuestion}>
                {t.next}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  /* --- Kelime Bankası / Cümle Kurucu (Word Bank) --- */
  if (mistake.exerciseType === "wordBank") {
    const hint =
      (qd.hint as string) ||
      (currentItem ? (translationLang === "tr" ? currentItem.exampleTr : currentItem.exampleEn || currentItem.exampleTr) : "") ||
      mistake.correctAnswer;
    const targetSentence = (qd.targetSentence as string) || mistake.correctAnswer;

    return (
      <div className="page-container">
        <Link href="/practice" className="back-link">
          <svg className="back-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          {t.practice}
        </Link>

        {questionHeader(t.sentenceBuilder)}

        <div className="flashcard">
          <span className="practice-type-badge mb-2">{t.translateToRussian}</span>
          <div className="flashcard-ru flashcard-target text-xl sm:text-2xl font-bold my-2">
            {hint}
          </div>
          <p className="practice-instruction">{t.tapWordsInOrder}</p>
        </div>

        <LayoutGroup id={`mistake-wb-${currentIndex}`}>
          <div className="wb-container">
            {/* Seçim Alanı (Drop Zone) */}
            <motion.div layout transition={wbSpring} className="wb-drop-zone">
              {wbSelectedTokens.length === 0 ? (
                <span className="text-sm text-muted-foreground select-none italic py-1 px-2">
                  {t.tapWordsInOrder}
                </span>
              ) : (
                wbSelectedTokens.map((tok) => (
                  <motion.button
                    key={tok.id}
                    layoutId={`mistake-tok-${tok.id}`}
                    layout
                    transition={wbSpring}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    className="wb-word-pill wb-word-pill-selected"
                    onClick={() => handleWbUnpickWord(tok)}
                    disabled={revealed}
                  >
                    {tok.word}
                  </motion.button>
                ))
              )}
            </motion.div>

            {/* Kelime Bankası Havuzu */}
            <motion.div layout transition={wbSpring} className="wb-pool-zone">
              {wbBankTokens.map((tok) => (
                <motion.button
                  key={tok.id}
                  layoutId={`mistake-tok-${tok.id}`}
                  layout
                  transition={wbSpring}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  className="wb-word-pill wb-word-pill-available"
                  onClick={() => handleWbPickWord(tok)}
                  disabled={revealed}
                >
                  {tok.word}
                </motion.button>
              ))}
            </motion.div>

            {!revealed && (
              <div className="flex justify-center mb-6">
                <button
                  type="button"
                  className="practice-btn practice-btn-primary min-w-[180px]"
                  onClick={handleWbCheck}
                  disabled={wbSelectedTokens.length === 0}
                >
                  {t.checkAnswer}
                </button>
              </div>
            )}

            {revealed && (
              <div className="practice-feedback">
                <div>
                  <span className={isCorrect ? "feedback-correct" : "feedback-wrong"}>
                    {feedbackMsg}
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="feedback-meaning">{targetSentence}</span>
                    <SpeakButton text={targetSentence} size="sm" />
                  </div>
                </div>
                <button className="practice-btn practice-btn-primary" onClick={nextQuestion}>
                  {t.next}
                </button>
              </div>
            )}
          </div>
        </LayoutGroup>
      </div>
    );
  }

  /* --- Fallback: Bilinmeyen tip durumunda genel kart --- */
  const fallbackHint = (qd.hint as string) || (currentItem ? (translationLang === "tr" ? currentItem.tr : currentItem.en) : "") || mistake.correctAnswer;
  return (
    <div className="page-container">
      <Link href="/practice" className="back-link">
        <svg className="back-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        {t.practice}
      </Link>

      {questionHeader(t.myMistakes)}

      <div className="flashcard">
        <div className="flashcard-ru">
          <span>{fallbackHint}</span>
        </div>
        <p className="practice-instruction">{t.typeYourAnswer}</p>
      </div>

      <div className="practice-input-row">
        <input
          ref={inputRef}
          type="text"
          className="practice-input"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !revealed) checkAnswer(answer, mistake.correctAnswer, mistake); }}
          placeholder={t.typeYourAnswer}
          disabled={revealed}
          autoFocus
        />
        {!revealed && (
          <button className="practice-btn practice-btn-primary" onClick={() => checkAnswer(answer, mistake.correctAnswer, mistake)}>
            {t.check}
          </button>
        )}
      </div>

      {revealed && (
        <div className="practice-feedback">
          <div>
            <span className={isCorrect ? "feedback-correct" : "feedback-wrong"}>
              {feedbackMsg}
            </span>
          </div>
          <button className="practice-btn practice-btn-primary" onClick={nextQuestion}>
            {t.next}
          </button>
        </div>
      )}
    </div>
  );
}
