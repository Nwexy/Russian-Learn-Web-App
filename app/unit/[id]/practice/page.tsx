/**
 * Ünite alıştırma sayfası — /unit/[id]/practice
 *
 * Tek tıkla 10 soruluk karışık alıştırma başlar (tür seçimi yok).
 * Soru tipleri rastgele karışır: çoktan seçmeli, boşluk doldurma, eşleştirme, dinleme.
 * Geçme eşiği yoktur; sonuç ekranı sadece skoru gösterir.
 * progress tablosuna practice=true YAZILMAZ (üniteyi tamamlayan aşama Test'tir).
 * Yanlışlar mistakes tablosuna kaydedilmeye devam eder.
 */

"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { db } from "@/lib/db";
import { getUnitById, getUnitTitle } from "@/lib/content";
import { useLang } from "@/lib/lang-context";
import { getMessages } from "@/lib/i18n";
import { generateMixedPractice } from "@/lib/exercises";
import type { MixedQuestion } from "@/lib/exercises";
import { recordMistake, removeMistakeByKey } from "@/lib/mistakes";
import { speak, isTTSSupported } from "@/lib/tts";
import { PronunciationText } from "@/components/pronunciation-text";
import { shouldShowPronunciation, renderHighlightedText } from "@/lib/exercises-ui";
import { SpeakButton } from "@/components/SpeakButton";
import type { Item } from "@/types";

/** Oturumdaki soru sayısı */
const SESSION_SIZE = 10;

/** Fisher-Yates ile kopya karıştırma (eşleştirme sağ sütunu için) */
function shuffled<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function UnitPracticePage() {
  const params = useParams<{ id: string }>();
  const unit = getUnitById(params.id);
  const { uiLang, translationLang, showPronunciation } = useLang();
  const t = getMessages(uiLang);

  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [ttsOk, setTtsOk] = useState(true);

  // Oturum durumu
  const [questions, setQuestions] = useState<MixedQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  // Soru başına durum
  const [revealed, setRevealed] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [mcSelected, setMcSelected] = useState<number | null>(null);
  const [answer, setAnswer] = useState("");

  // Eşleştirme durumu
  const [matchLeft, setMatchLeft] = useState<string | null>(null);
  const [matchRight, setMatchRight] = useState<string | null>(null);
  const [matchedIds, setMatchedIds] = useState<Set<string>>(new Set());
  const [matchWrong, setMatchWrong] = useState(false);
  const [matchHadError, setMatchHadError] = useState(false);
  const [matchRightOrder, setMatchRightOrder] = useState<{ id: string; translation: string }[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);

  /** Ünitenin kelimelerini yükle */
  useEffect(() => {
    if (!unit) return;
    async function load() {
      let unitItems = await db.items
        .where("unitId").equals(unit!.id)
        .and((i) => i.type === "word")
        .toArray();

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

      setItems(unitItems);
      setTtsOk(isTTSSupported());
      setLoading(false);
    }
    load();
  }, [unit]);

  /** Soru başına durumu sıfırla; eşleştirme sorusuysa sağ sütunu hazırla */
  const prepareQuestion = useCallback((q: MixedQuestion | undefined) => {
    setRevealed(false);
    setIsCorrect(null);
    setMcSelected(null);
    setAnswer("");
    setMatchLeft(null);
    setMatchRight(null);
    setMatchedIds(new Set());
    setMatchWrong(false);
    setMatchHadError(false);
    if (q?.kind === "matching") {
      setMatchRightOrder(shuffled(q.data.pairs.map((p) => ({ id: p.id, translation: p.translation }))));
    }
  }, []);

  /** Yeni oturum başlat (yükleme bitince otomatik çağrılır) */
  const startSession = useCallback(() => {
    const qs = generateMixedPractice(items, translationLang, SESSION_SIZE, ttsOk);
    setQuestions(qs);
    setIndex(0);
    setScore(0);
    setFinished(false);
    prepareQuestion(qs[0]);
  }, [items, translationLang, ttsOk, prepareQuestion]);

  useEffect(() => {
    if (!loading && items.length > 0) startSession();
    // Sadece ilk yüklemede otomatik başlat
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  /** Çeviri dilindeki anlam */
  const getMeaning = (item: Item): string => {
    const tr = translationLang === "tr" ? item.tr : item.en;
    return tr || item.tr || item.en || "";
  };

  /** Yazılı/seçmeli cevap sonucu: skor + mistakes tablosu */
  const settle = async (
    correct: boolean,
    exerciseType: "multipleChoice" | "fillBlank" | "listening",
    itemId: string,
    questionData: Record<string, unknown>,
    userAnswer: string,
    correctAnswer: string
  ) => {
    setIsCorrect(correct);
    setRevealed(true);
    if (correct) {
      setScore((s) => s + 1);
      await removeMistakeByKey(exerciseType, itemId);
    } else {
      await recordMistake({ exerciseType, itemId, questionData, userAnswer, correctAnswer });
    }
  };

  /** Sonraki soru veya sonuç ekranı */
  const next = () => {
    if (index + 1 >= questions.length) {
      setFinished(true);
    } else {
      const nextIdx = index + 1;
      setIndex(nextIdx);
      prepareQuestion(questions[nextIdx]);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  /* ---------- Yükleniyor / bulunamadı ---------- */
  if (!unit || loading) {
    return <div className="page-container"><div className="review-loading">...</div></div>;
  }

  const backLink = (
    <Link href={`/unit/${unit.id}`} className="back-link">
      <svg className="back-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
      </svg>
      {t.backToUnit}
    </Link>
  );

  /* ---------- Kelime yok ---------- */
  if (items.length === 0 || questions.length === 0) {
    return (
      <div className="page-container">
        {backLink}
        <div className="empty-state">
          <p className="empty-state-text">{t.buUnitHasNoExercises}</p>
        </div>
      </div>
    );
  }

  /* ---------- Sonuç (eşik yok, sadece skor) ---------- */
  if (finished) {
    const pct = Math.round((score / questions.length) * 100);
    return (
      <div className="page-container">
        <div className="practice-result">
          <h2 className="practice-result-title">{t.exerciseComplete}</h2>
          <p className="practice-result-score">{t.yourScore}: {score} / {questions.length} ({pct}%)</p>
          <div className="practice-result-actions">
            <button className="practice-btn practice-btn-primary" onClick={startSession}>
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

  const q = questions[index];

  /** Ortak üst bilgi: ilerleme + tür rozeti */
  const typeLabel =
    q.kind === "multipleChoice" ? t.multipleChoice
      : q.kind === "fillBlank" ? t.fillBlank
        : q.kind === "matching" ? t.matching
          : t.listening;

  const header = (
    <>
      <div className="practice-progress-row">
        <span className="review-progress">{index + 1} / {questions.length}</span>
        <span className="practice-type-badge">{getUnitTitle(unit, uiLang)} — {typeLabel}</span>
      </div>
      <div className="review-progress-bar">
        <div className="review-progress-fill" style={{ width: `${(index / questions.length) * 100}%` }} />
      </div>
    </>
  );

  /** Ortak geri bildirim: doğru/yanlış + anlam + okunuş + tam cümle çevirisi */
  const feedback = (item: Item | null, wrongText?: string, fullTranslation?: string) => (
    <div className="practice-feedback">
      <div>
        <span className={isCorrect ? "feedback-correct" : "feedback-wrong"}>
          {isCorrect ? t.correct : wrongText ? `${t.wrong} — ${t.showCorrect}: ${wrongText}` : t.wrong}
        </span>
        {fullTranslation ? (
          <div className="feedback-sentence-translation">
            {renderHighlightedText(fullTranslation)}
          </div>
        ) : item ? (
          <span className="feedback-meaning">
            {" "} — {item.ru} {t.meaningEquals} {getMeaning(item)}
          </span>
        ) : null}
        {item && shouldShowPronunciation(revealed) && (
          <PronunciationText item={item} className="pronunciation-inline" />
        )}
      </div>
      <button className="practice-btn practice-btn-primary" onClick={next}>
        {t.next}
      </button>
    </div>
  );

  /* ---------- Çoktan Seçmeli ---------- */
  if (q.kind === "multipleChoice") {
    const mc = q.data;
    const ruQuestion = mc.direction === "ru-to-target";
    const handleSelect = async (idx: number) => {
      if (revealed) return;
      setMcSelected(idx);
      await settle(
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
        {header}
        <div className="flashcard">
          <div className={ruQuestion ? "flashcard-ru" : "flashcard-ru flashcard-target"} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
            <span>{mc.question}</span>
            {ruQuestion && <SpeakButton text={mc.question} size="sm" />}
          </div>
          {ruQuestion && shouldShowPronunciation(revealed) && <PronunciationText item={mc.item} />}
          <p className="practice-instruction">{ruQuestion ? t.chooseAnswer : t.chooseRussian}</p>
        </div>
        <div className="mc-options">
          {mc.options.map((opt, idx) => {
            let cls = "mc-option";
            if (revealed) {
              if (idx === mc.correctIndex) cls += " mc-option-correct";
              else if (idx === mcSelected) cls += " mc-option-wrong";
            }
            return (
              <button key={idx} className={cls} onClick={() => handleSelect(idx)} disabled={revealed}>
                {opt}
              </button>
            );
          })}
        </div>
        {revealed && feedback(mc.item)}
      </div>
    );
  }

  /* ---------- Boşluk Doldurma ---------- */
  if (q.kind === "fillBlank") {
    const fb = q.data;
    const handleCheck = async () => {
      if (revealed) return;
      const correct = answer.trim().toLowerCase() === fb.correctWord.toLowerCase();
      await settle(
        correct,
        "fillBlank",
        fb.item.id,
        { sentenceWithBlank: fb.sentenceWithBlank, correctWord: fb.correctWord, hint: fb.hint, fullTranslation: fb.fullTranslation },
        answer.trim(),
        fb.correctWord
      );
    };

    return (
      <div className="page-container">
        {header}
        <div className="flashcard">
          <div className="flashcard-ru" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
            <span>{fb.sentenceWithBlank}</span>
            <SpeakButton text={fb.sentenceWithBlank} size="sm" />
          </div>
          {shouldShowPronunciation(revealed) && <PronunciationText item={fb.item} />}
          {(fb.fullTranslation || fb.hintSentence) && (
            <p className="practice-hint">
              {renderHighlightedText(fb.fullTranslation || fb.hintSentence, revealed)}
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
            <button className="practice-btn practice-btn-primary" onClick={handleCheck}>{t.check}</button>
          )}
        </div>
        {revealed && feedback(fb.item, fb.correctWord)}
      </div>
    );
  }

  /* ---------- Eşleştirme (tek soru sayılır; hatasız biterse doğru) ---------- */
  if (q.kind === "matching") {
    const pairs = q.data.pairs;

    const tryMatch = async (leftId: string, rightId: string) => {
      if (leftId === rightId) {
        const updated = new Set(matchedIds);
        updated.add(leftId);
        setMatchedIds(updated);
        setMatchLeft(null);
        setMatchRight(null);
        await removeMistakeByKey("matching", leftId);
        if (updated.size >= pairs.length) {
          const correct = !matchHadError;
          setIsCorrect(correct);
          setRevealed(true);
          if (correct) setScore((s) => s + 1);
        }
      } else {
        setMatchWrong(true);
        setMatchHadError(true);
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
          setMatchLeft(null);
          setMatchRight(null);
          setMatchWrong(false);
        }, 600);
      }
    };

    const onLeft = (id: string) => {
      if (matchedIds.has(id) || revealed) return;
      setMatchLeft(id);
      setMatchWrong(false);
      if (Boolean(showPronunciation) && isTTSSupported()) {
        const pair = pairs.find((p) => p.id === id);
        if (pair?.ru) speak(pair.ru, "ru-RU");
      }
      if (matchRight !== null) tryMatch(id, matchRight);
    };
    const onRight = (id: string) => {
      if (matchedIds.has(id) || revealed) return;
      setMatchRight(id);
      setMatchWrong(false);
      if (matchLeft !== null) tryMatch(matchLeft, id);
    };

    return (
      <div className="page-container">
        {header}
        <p className="practice-instruction" style={{ textAlign: "center", marginBottom: "1.5rem" }}>{t.matchPairs}</p>
        <div className="match-grid">
          <div className="match-column">
            {pairs.map((pair) => {
              const matched = matchedIds.has(pair.id);
              let cls = "match-item";
              if (matched) cls += " match-item-matched";
              else if (matchLeft === pair.id) cls += matchWrong ? " match-item-wrong" : " match-item-selected";
              return (
                <button key={pair.id} className={cls} onClick={() => onLeft(pair.id)} disabled={matched}>
                  {pair.ru}
                </button>
              );
            })}
          </div>
          <div className="match-column">
            {matchRightOrder.map((r) => {
              const matched = matchedIds.has(r.id);
              let cls = "match-item";
              if (matched) cls += " match-item-matched";
              else if (matchRight === r.id) cls += matchWrong ? " match-item-wrong" : " match-item-selected";
              return (
                <button key={`r-${r.id}`} className={cls} onClick={() => onRight(r.id)} disabled={matched}>
                  {r.translation}
                </button>
              );
            })}
          </div>
        </div>
        {revealed && feedback(null)}
      </div>
    );
  }

  /* ---------- Dinleme ---------- */
  const ls = q.data;
  const handlePlay = () => speak(ls.correctWord);
  const handleListenCheck = async () => {
    if (revealed) return;
    const correct = answer.trim().toLowerCase() === ls.correctWord.toLowerCase();
    await settle(correct, "listening", ls.item.id, { correctWord: ls.correctWord }, answer.trim(), ls.correctWord);
  };

  return (
    <div className="page-container">
      {header}
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
          onKeyDown={(e) => { if (e.key === "Enter" && !revealed) handleListenCheck(); }}
          placeholder={t.typeYourAnswer}
          disabled={revealed}
          autoFocus
        />
        {!revealed && (
          <button className="practice-btn practice-btn-primary" onClick={handleListenCheck}>{t.check}</button>
        )}
      </div>
      {revealed && feedback(ls.item, ls.correctWord)}
    </div>
  );
}
