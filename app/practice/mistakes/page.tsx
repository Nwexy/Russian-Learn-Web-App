/**
 * Yanlışlarım sayfası — /practice/mistakes
 * Yanlış yapılan soruları sırayla tekrar sorar.
 * Doğru cevap → kayıt silinir. Yanlış → kayıt güncellenir.
 */

"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { db } from "@/lib/db";
import { useLang } from "@/lib/lang-context";
import { getMessages } from "@/lib/i18n";
import { getAllMistakes, removeMistake, recordMistake } from "@/lib/mistakes";
import { getHighlightedTranslation } from "@/lib/exercises";
import { getUnitById } from "@/lib/content";
import { speak, isTTSSupported } from "@/lib/tts";
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

type Phase = "list" | "active" | "result";

export default function MistakesPage() {
  const { uiLang, translationLang, showPronunciation } = useLang();
  const t = getMessages(uiLang);

  const [mistakes, setMistakes] = useState<Mistake[]>([]);
  const [initialMistakes, setInitialMistakes] = useState<Mistake[]>([]);
  const [itemsMap, setItemsMap] = useState<Map<string, Item>>(new Map());
  const [loading, setLoading] = useState(true);
  const [phase, setPhase] = useState<Phase>("list");
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

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function load() {
      const all = await getAllMistakes();
      setMistakes(all);
      setInitialMistakes(all);
      const allItems = await db.items.toArray();
      const map = new Map<string, Item>();
      allItems.forEach((i) => map.set(i.id, i));
      setItemsMap(map);
      setTtsSupported(isTTSSupported());
      setSpeechSupported(isSpeechRecognitionSupported());
      setLoading(false);
    }
    load();
    return () => {
      stopSpeechRecognition();
    };
  }, []);

  /** Tekrarı başlat */
  const startReview = () => {
    if (initialMistakes.length === 0) return;
    setCurrentIndex(0);
    setScore(0);
    setTotalAsked(initialMistakes.length);
    setPhase("active");
    resetQuestion();
  };

  const resetQuestion = () => {
    stopSpeechRecognition();
    setSpeakingListening(false);
    setSpeechError(null);
    setAnswer("");
    setRevealed(false);
    setIsCorrect(null);
    setFeedbackMsg("");
    setMcSelected(null);
  };

  /** Sonraki soruya geç */
  const nextQuestion = async () => {
    // Veritabanındaki güncel kalan yanlışları al (sonuç ekranında kalan yanlış sayısını göstermek için)
    const fresh = await getAllMistakes();
    setMistakes(fresh);

    if (currentIndex + 1 >= initialMistakes.length) {
      setPhase("result");
    } else {
      setCurrentIndex((i) => i + 1);
      resetQuestion();
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
      // Doğru: listeden sil
      if (mistake.id) await removeMistake(mistake.id);
    } else {
      setFeedbackMsg(`${t.mistakeStillWrong} — ${t.showCorrect}: ${correctAns}`);
      // Yanlış: güncelle
      await recordMistake({
        exerciseType: mistake.exerciseType,
        itemId: mistake.itemId,
        questionData: mistake.questionData,
        userAnswer: userAns.trim(),
        correctAnswer: correctAns,
      });
    }
  };

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
    const remaining = mistakes.length;
    const pct = totalAsked > 0 ? Math.round((score / totalAsked) * 100) : 0;

    return (
      <div className="page-container">
        <div className="practice-result">
          <h2 className="practice-result-title">{t.exerciseComplete}</h2>
          <p className="practice-result-score">
            {t.yourScore}: {score} / {totalAsked} ({pct}%)
          </p>
          {remaining > 0 && (
            <p className="practice-result-score">
              {remaining} {t.mistakesRemaining}
            </p>
          )}
          <div className="practice-result-actions">
            {remaining > 0 && (
              <button
                className="practice-btn practice-btn-primary"
                onClick={async () => {
                  const fresh = await getAllMistakes();
                  setMistakes(fresh);
                  setInitialMistakes(fresh);
                  setPhase("list");
                  setScore(0);
                  setCurrentIndex(0);
                }}
              >
                {t.tryAgain}
              </button>
            )}
            <Link href="/practice" className="practice-btn practice-btn-secondary">
              {t.backToHome}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  /* ========================================
     RENDER — Liste / Başlangıç
     ======================================== */
  if (phase === "list") {
    return (
      <div className="page-container">
        <Link href="/practice" className="back-link">
          <svg className="back-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          {t.practice}
        </Link>

        <div className="page-header">
          <h1 className="page-title">{t.myMistakes}</h1>
          <p className="page-subtitle">
            {mistakes.length > 0
              ? `${mistakes.length} ${t.mistakesCount}`
              : t.noMistakes}
          </p>
        </div>

        {mistakes.length > 0 ? (
          <div className="practice-start-area">
            <button className="practice-btn practice-btn-primary" onClick={startReview}>
              {t.startMistakesReview}
            </button>
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">--</div>
            <p className="empty-state-text">{t.noMistakes}</p>
            <Link href="/practice" className="practice-btn practice-btn-secondary" style={{ marginTop: "1rem" }}>
              {t.practice}
            </Link>
          </div>
        )}
      </div>
    );
  }

  /* ========================================
     RENDER — Aktif soru
     ======================================== */
  // Güvenlik: index aşımını kontrol et
  if (currentIndex >= initialMistakes.length) {
    setPhase("result");
    return null;
  }

  const mistake = initialMistakes[currentIndex];
  const qd = mistake.questionData;
  const currentItem = itemsMap.get(mistake.itemId);

  /* --- Çoktan Seçmeli --- */
  if (mistake.exerciseType === "multipleChoice") {
    const options = (qd.options as string[]) || [];
    const correctIdx = (qd.correctIndex as number) ?? 0;
    const question = (qd.question as string) || "";
    const ruQuestion = qd.direction !== "target-to-ru";

    const handleSelect = async (idx: number) => {
      if (revealed) return;
      setMcSelected(idx);
      await checkAnswer(options[idx], options[correctIdx], mistake);
    };

    return (
      <div className="page-container">
        <div className="practice-progress-row">
          <span className="review-progress">{currentIndex + 1} / {totalAsked}</span>
          <span className="practice-type-badge">{t.multipleChoice}</span>
        </div>
        <div className="review-progress-bar">
          <div className="review-progress-fill" style={{ width: `${(currentIndex / totalAsked) * 100}%` }} />
        </div>

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
    const sentence = (qd.sentenceWithBlank as string) || "";
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
        <div className="practice-progress-row">
          <span className="review-progress">{currentIndex + 1} / {totalAsked}</span>
          <span className="practice-type-badge">{t.fillBlank}</span>
        </div>
        <div className="review-progress-bar">
          <div className="review-progress-fill" style={{ width: `${(currentIndex / totalAsked) * 100}%` }} />
        </div>

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
    const ru = (qd.ru as string) || "";
    const correctTranslation = (qd.translation as string) || mistake.correctAnswer;

    const handleCheck = async () => {
      if (revealed) return;
      await checkAnswer(answer, correctTranslation, mistake);
    };

    return (
      <div className="page-container">
        <div className="practice-progress-row">
          <span className="review-progress">{currentIndex + 1} / {totalAsked}</span>
          <span className="practice-type-badge">{t.matching}</span>
        </div>
        <div className="review-progress-bar">
          <div className="review-progress-fill" style={{ width: `${(currentIndex / totalAsked) * 100}%` }} />
        </div>

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
        <div className="practice-progress-row">
          <span className="review-progress">{currentIndex + 1} / {totalAsked}</span>
          <span className="practice-type-badge">{t.listening}</span>
        </div>
        <div className="review-progress-bar">
          <div className="review-progress-fill" style={{ width: `${(currentIndex / totalAsked) * 100}%` }} />
        </div>

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
    const targetText = (qd.targetText as string) || mistake.correctAnswer;
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
        <div className="practice-progress-row">
          <span className="review-progress">{currentIndex + 1} / {totalAsked}</span>
          <span className="practice-type-badge">{t.speaking}</span>
        </div>
        <div className="review-progress-bar">
          <div className="review-progress-fill" style={{ width: `${(currentIndex / totalAsked) * 100}%` }} />
        </div>

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

  return null;
}
