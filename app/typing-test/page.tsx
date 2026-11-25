"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, RotateCcw, Keyboard, Shuffle } from "lucide-react";
import { useLang } from "@/lib/lang-context";
import { getMessages } from "@/lib/i18n";
import { Card } from "@/components/ui/card";
import { RUSSIAN_TEXTS } from "@/lib/typing-texts";

interface CharState {
  char: string;
  state: "untyped" | "correct" | "incorrect";
}

interface WordState {
  original: string;
  letters: CharState[];
}

export default function TypingTestPage() {
  const { uiLang } = useLang();
  const t = getMessages(uiLang);

  // Text selection
  const [textIndex, setTextIndex] = useState<number>(0);
  const [words, setWords] = useState<WordState[]>([]);

  // Typing state
  const [currentWordIdx, setCurrentWordIdx] = useState<number>(0);
  const [currentCharIdx, setCurrentCharIdx] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isFinished, setIsFinished] = useState<boolean>(false);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  // Stats Counters
  const [correctChars, setCorrectChars] = useState<number>(0);
  const [incorrectChars, setIncorrectChars] = useState<number>(0);
  const [totalKeystrokes, setTotalKeystrokes] = useState<number>(0);

  // Focus and Caret
  const [isFocused, setIsFocused] = useState<boolean>(false);
  const [caretPos, setCaretPos] = useState<{ top: number; left: number }>({
    top: 6,
    left: 0,
  });

  const hiddenInputRef = useRef<HTMLInputElement>(null);
  const wordsContainerRef = useRef<HTMLDivElement>(null);
  const startTimeRef = useRef<number>(0);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize words from text
  const loadText = useCallback((idx: number) => {
    const rawText = RUSSIAN_TEXTS[idx % RUSSIAN_TEXTS.length] || RUSSIAN_TEXTS[0];
    const rawWords = rawText.trim().split(/\s+/);

    const parsed: WordState[] = rawWords.map((w) => ({
      original: w,
      letters: w.split("").map((c) => ({ char: c, state: "untyped" })),
    }));

    setWords(parsed);
    setCurrentWordIdx(0);
    setCurrentCharIdx(0);
    setIsRunning(false);
    setIsFinished(false);
    setElapsedSeconds(0);
    setCorrectChars(0);
    setIncorrectChars(0);
    setTotalKeystrokes(0);
    setCaretPos({ top: 6, left: 0 });

    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    if (hiddenInputRef.current) {
      hiddenInputRef.current.value = "";
      hiddenInputRef.current.focus();
    }
    setIsFocused(true);
  }, []);

  useEffect(() => {
    loadText(textIndex);
  }, [textIndex, loadText]);

  // Restart current test
  const restartTest = useCallback(() => {
    loadText(textIndex);
  }, [textIndex, loadText]);

  // Next text
  const nextText = useCallback(() => {
    setTextIndex((prev) => (prev + 1) % RUSSIAN_TEXTS.length);
  }, []);

  // Finish test
  const finishTest = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    setIsRunning(false);
    setIsFinished(true);
  }, []);

  // Timer Tick
  useEffect(() => {
    if (!isRunning) return;

    timerIntervalRef.current = setInterval(() => {
      const elapsed = Math.max(1, Math.floor((Date.now() - startTimeRef.current) / 1000));
      setElapsedSeconds(elapsed);
    }, 1000);

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [isRunning]);

  // Update Caret Position
  const updateCaret = useCallback(() => {
    const container = wordsContainerRef.current;
    if (!container) return;

    const wordEl = container.children[currentWordIdx] as HTMLElement;
    if (!wordEl) return;

    requestAnimationFrame(() => {
      const letterEl = wordEl.children[currentCharIdx] as HTMLElement;
      let top = 0;
      let left = 0;

      if (letterEl) {
        top = wordEl.offsetTop + letterEl.offsetTop + (letterEl.offsetHeight - 28) / 2;
        left = wordEl.offsetLeft + letterEl.offsetLeft;
      } else {
        const last = wordEl.lastElementChild as HTMLElement;
        if (last) {
          top = wordEl.offsetTop + last.offsetTop + (last.offsetHeight - 28) / 2;
          left = wordEl.offsetLeft + last.offsetLeft + last.offsetWidth;
        } else {
          top = wordEl.offsetTop;
          left = wordEl.offsetLeft;
        }
      }

      setCaretPos({
        top: top || 6,
        left: left || 0,
      });
    });
  }, [currentWordIdx, currentCharIdx]);

  useEffect(() => {
    updateCaret();
  }, [updateCaret]);

  // Keyboard Event Handler
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // TAB tuşu ile anında yeniden başlat
    if (e.key === "Tab") {
      e.preventDefault();
      restartTest();
      return;
    }

    if (isFinished) return;

    // İlk karakter basıldığında süreyi başlat
    if (!isRunning && e.key.length === 1) {
      setIsRunning(true);
      startTimeRef.current = Date.now();
    }

    const currentWord = words[currentWordIdx];
    if (!currentWord) return;

    // BACKSPACE
    if (e.key === "Backspace") {
      e.preventDefault();

      if (currentCharIdx > 0) {
        const targetIdx = currentCharIdx - 1;
        const targetLetter = currentWord.letters[targetIdx];

        if (targetLetter.state === "correct") setCorrectChars((c) => Math.max(0, c - 1));
        if (targetLetter.state === "incorrect") setIncorrectChars((i) => Math.max(0, i - 1));

        setWords((prev) => {
          const next = [...prev];
          const w = { ...next[currentWordIdx] };
          const letters = [...w.letters];
          letters[targetIdx] = { ...targetLetter, state: "untyped" };
          w.letters = letters;
          next[currentWordIdx] = w;
          return next;
        });

        setCurrentCharIdx(targetIdx);
      } else if (currentWordIdx > 0) {
        // Önceki kelimeye geri dön
        const prevWord = words[currentWordIdx - 1];
        if (prevWord) {
          setCurrentWordIdx((prev) => prev - 1);
          setCurrentCharIdx(prevWord.letters.length);
        }
      }
      return;
    }

    // SPACEBAR: Kelimeyi tamamla ve sonrakine geç
    if (e.key === " " || e.key === "Spacebar") {
      e.preventDefault();

      // Kelimede henüz yazılmamış harf kaldıysa onları yanlış olarak işaretle
      if (currentCharIdx < currentWord.letters.length) {
        setWords((prev) => {
          const next = [...prev];
          const w = { ...next[currentWordIdx] };
          const letters = [...w.letters];
          for (let i = currentCharIdx; i < letters.length; i++) {
            if (letters[i].state === "untyped") {
              letters[i] = { ...letters[i], state: "incorrect" };
              setIncorrectChars((inc) => inc + 1);
            }
          }
          w.letters = letters;
          next[currentWordIdx] = w;
          return next;
        });
      }

      // Son kelime ise testi bitir
      if (currentWordIdx + 1 >= words.length) {
        finishTest();
        return;
      }

      setCurrentWordIdx((prev) => prev + 1);
      setCurrentCharIdx(0);
      return;
    }

    // NORMAL KARAKTER GİRİŞİ
    if (e.key.length === 1) {
      const typedChar = e.key;
      setTotalKeystrokes((t) => t + 1);

      if (currentCharIdx < currentWord.letters.length) {
        const targetChar = currentWord.letters[currentCharIdx].char;
        const isMatch = typedChar === targetChar;

        if (isMatch) {
          setCorrectChars((c) => c + 1);
        } else {
          setIncorrectChars((i) => i + 1);
        }

        setWords((prev) => {
          const next = [...prev];
          const w = { ...next[currentWordIdx] };
          const letters = [...w.letters];
          letters[currentCharIdx] = {
            ...letters[currentCharIdx],
            state: isMatch ? "correct" : "incorrect",
          };
          w.letters = letters;
          next[currentWordIdx] = w;
          return next;
        });

        const nextCharIdx = currentCharIdx + 1;
        setCurrentCharIdx(nextCharIdx);

        // Son kelimenin son harfi tamamlandıysa testi bitir
        if (currentWordIdx === words.length - 1 && nextCharIdx === currentWord.letters.length) {
          finishTest();
        }
      }
    }
  };

  // İstatistik hesaplamaları (Formüller kurala birebir uygundur)
  const calcElapsedSec = Math.max(1, elapsedSeconds || 1);
  const liveWpm = Math.max(0, Math.round((correctChars / 5) / (calcElapsedSec / 60)));
  const liveAccuracy = totalKeystrokes > 0 ? Math.round((correctChars / totalKeystrokes) * 100) : 100;

  return (
    <div className="page-container max-w-4xl mx-auto px-4 py-8">
      {/* Geri Dön Butonu */}
      <Link
        href="/practice"
        className="back-link mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft size={16} />
        {uiLang === "tr" ? "Alıştırmalara Dön" : "Back to Practice"}
      </Link>

      {/* Sayfa Başlığı */}
      <div className="page-header mb-8 text-center sm:text-left">
        <div className="flex items-center justify-center sm:justify-start gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center text-primary">
            <Keyboard size={22} />
          </div>
          <h1 className="page-title text-2xl sm:text-3xl font-extrabold tracking-tight">
            {t.speedType}
          </h1>
        </div>
        <p className="page-subtitle text-muted-foreground text-sm sm:text-base">
          {t.typeThisText}
        </p>
      </div>

      {/* BÖLÜM B: ÜST KISIM TEST İSTATİSTİKLERİ */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4 max-w-md mx-auto mb-8 text-center font-mono select-none">
        <div className="p-3.5 sm:p-4 rounded-2xl bg-card/75 dark:bg-card/50 border border-border/70 backdrop-blur-md shadow-sm">
          <p className="text-[11px] sm:text-xs uppercase tracking-wider text-muted-foreground font-bold mb-1">
            {t.wpm}
          </p>
          <p className="text-2xl sm:text-4xl font-black text-primary">
            {liveWpm}
          </p>
        </div>
        <div className="p-3.5 sm:p-4 rounded-2xl bg-card/75 dark:bg-card/50 border border-border/70 backdrop-blur-md shadow-sm">
          <p className="text-[11px] sm:text-xs uppercase tracking-wider text-muted-foreground font-bold mb-1">
            {t.accuracy}
          </p>
          <p className="text-2xl sm:text-4xl font-black text-emerald-500">
            {liveAccuracy}%
          </p>
        </div>
        <div className="p-3.5 sm:p-4 rounded-2xl bg-card/75 dark:bg-card/50 border border-border/70 backdrop-blur-md shadow-sm">
          <p className="text-[11px] sm:text-xs uppercase tracking-wider text-muted-foreground font-bold mb-1">
            {t.time}
          </p>
          <p className="text-2xl sm:text-4xl font-black text-amber-500">
            {elapsedSeconds}s
          </p>
        </div>
      </div>

      {/* BÖLÜM B & C: ORTA KISIM METİN YAZMA ALANI */}
      {!isFinished ? (
        <div className="relative w-full">
          <Card
            onClick={() => {
              hiddenInputRef.current?.focus();
              setIsFocused(true);
            }}
            className="relative p-6 sm:p-10 bg-card/70 dark:bg-card/40 border border-border/80 rounded-3xl shadow-2xl overflow-hidden cursor-text min-h-[200px]"
          >
            {/* Yanıp Sönen İmleç (Caret) */}
            {isFocused && (
              <div
                className="monkey-caret"
                style={{
                  top: `${caretPos.top}px`,
                  left: `${caretPos.left}px`,
                }}
              />
            )}

            {/* Kelime ve Karakter Alanı */}
            <div
              ref={wordsContainerRef}
              className="flex flex-wrap gap-x-3 gap-y-3.5 text-lg sm:text-2xl font-mono leading-relaxed select-none"
            >
              {words.map((w, wIdx) => {
                return (
                  <div key={wIdx} className="inline-flex relative">
                    {w.letters.map((l, lIdx) => {
                      let colorClass = "text-muted-foreground/40 dark:text-muted-foreground/30";
                      if (l.state === "correct") {
                        colorClass = "text-emerald-500 dark:text-emerald-400 font-semibold";
                      } else if (l.state === "incorrect") {
                        colorClass =
                          "text-rose-500 font-bold underline decoration-rose-500 underline-offset-4 bg-rose-500/10 rounded-sm";
                      }

                      return (
                        <span key={lIdx} className={`${colorClass} transition-colors`}>
                          {l.char}
                        </span>
                      );
                    })}
                  </div>
                );
              })}
            </div>

            {/* Gizli Input (Kullanıcı harfleri burada görünmez, ekrandaki metin renklenir) */}
            <input
              ref={hiddenInputRef}
              type="text"
              autoComplete="off"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck="false"
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              onKeyDown={handleKeyDown}
              className="absolute -top-[9999px] -left-[9999px] opacity-0 pointer-events-none"
            />

            {/* Odak Kaybı Katmanı */}
            {!isFocused && (
              <div
                onClick={() => {
                  hiddenInputRef.current?.focus();
                  setIsFocused(true);
                }}
                className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center cursor-pointer rounded-3xl"
              >
                <p className="text-sm sm:text-base font-semibold text-foreground/80 flex items-center gap-2">
                  <Keyboard size={18} className="text-primary animate-bounce" />
                  {t.clickToFocus}
                </p>
              </div>
            )}
          </Card>

          {/* Alt Kısım Kontrolleri */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={restartTest}
              className="px-5 py-2.5 rounded-xl border border-border/80 bg-secondary/60 hover:bg-secondary text-foreground text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <RotateCcw size={15} />
              <span>{t.restart}</span>
              <kbd className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-background border border-border/80 text-[10px] text-muted-foreground font-mono">
                Tab
              </kbd>
            </button>

            <button
              type="button"
              onClick={nextText}
              className="px-4 py-2.5 rounded-xl border border-border/60 hover:border-border text-muted-foreground hover:text-foreground text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer active:scale-95"
              title={uiLang === "tr" ? "Farklı Bir Metne Geç" : "Switch to Another Text"}
            >
              <Shuffle size={14} />
              <span>{uiLang === "tr" ? "Farklı Metin" : "Next Text"}</span>
            </button>
          </div>
        </div>
      ) : (
        /* BÖLÜM C: TEST TAMAMLANDI SONUÇ EKRANI */
        <Card className="p-8 sm:p-10 bg-card/80 border border-border/80 rounded-3xl shadow-2xl max-w-xl mx-auto text-center space-y-6 animate-in fade-in zoom-in-95 duration-200">
          <div className="pb-2 border-b border-border/60">
            <h2 className="text-2xl font-black text-foreground">
              {t.testCompleted}
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              {uiLang === "tr" ? "Rusça metin başarıyla tamamlandı!" : "Russian text completed successfully!"}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 pb-4">
            <div className="p-4 rounded-2xl bg-secondary/50 border border-border/50">
              <p className="text-xs uppercase tracking-wider text-muted-foreground font-bold mb-1">
                {t.wpm}
              </p>
              <p className="text-4xl sm:text-5xl font-black text-primary font-mono">
                {liveWpm}
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-secondary/50 border border-border/50">
              <p className="text-xs uppercase tracking-wider text-muted-foreground font-bold mb-1">
                {t.accuracy}
              </p>
              <p className="text-4xl sm:text-5xl font-black text-emerald-500 font-mono">
                {liveAccuracy}%
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 text-left">
            <div className="p-3 rounded-xl bg-secondary/40 border border-border/40">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground block font-bold">
                {t.time}
              </span>
              <span className="text-sm font-bold text-foreground font-mono mt-0.5 block">
                {elapsedSeconds}s
              </span>
            </div>
            <div className="p-3 rounded-xl bg-secondary/40 border border-border/40">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground block font-bold">
                {uiLang === "tr" ? "Doğru Harf" : "Correct"}
              </span>
              <span className="text-sm font-bold text-emerald-500 font-mono mt-0.5 block">
                {correctChars}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-secondary/40 border border-border/40">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground block font-bold">
                {uiLang === "tr" ? "Hatalı Harf" : "Errors"}
              </span>
              <span className="text-sm font-bold text-rose-500 font-mono mt-0.5 block">
                {incorrectChars}
              </span>
            </div>
          </div>

          <div className="pt-3 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={restartTest}
              className="px-6 py-3 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm shadow-lg shadow-primary/25 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <RotateCcw size={16} />
              <span>{uiLang === "tr" ? "Tekrar Dene" : "Try Again"}</span>
            </button>
            <button
              type="button"
              onClick={nextText}
              className="px-5 py-3 rounded-2xl border border-border/70 hover:bg-secondary text-foreground font-semibold text-sm transition-all flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <Shuffle size={15} />
              <span>{uiLang === "tr" ? "Sonraki Metin" : "Next Text"}</span>
            </button>
          </div>
        </Card>
      )}
    </div>
  );
}
