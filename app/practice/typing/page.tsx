"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, RotateCcw, Volume2, VolumeX, Keyboard, Clock, FileText } from "lucide-react";
import { useLang } from "@/lib/lang-context";
import { getMessages } from "@/lib/i18n";
import { Card } from "@/components/ui/card";
import { RUSSIAN_WORDS } from "@/lib/russian-words";

type Mode = "time" | "words";

interface CharState {
  char: string;
  state: "untyped" | "correct" | "incorrect" | "extra";
}

interface WordState {
  original: string;
  letters: CharState[];
  hasError: boolean;
}

export default function TypingSpeedPage() {
  const { uiLang } = useLang();
  const t = getMessages(uiLang);

  // Config State
  const [mode, setMode] = useState<Mode>("time");
  const [timeLimit, setTimeLimit] = useState<number>(30);
  const [wordLimit, setWordLimit] = useState<number>(25);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Game Engine State
  const [words, setWords] = useState<WordState[]>([]);
  const [currentWordIdx, setCurrentWordIdx] = useState<number>(0);
  const [currentCharIdx, setCurrentCharIdx] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isFinished, setIsFinished] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(30);

  // Stats Counters
  const [correctChars, setCorrectChars] = useState<number>(0);
  const [incorrectChars, setIncorrectChars] = useState<number>(0);
  const [extraChars, setExtraChars] = useState<number>(0);
  const [missedChars, setMissedChars] = useState<number>(0);
  const [totalKeystrokes, setTotalKeystrokes] = useState<number>(0);
  const [liveWpm, setLiveWpm] = useState<number>(0);
  const [wpmHistory, setWpmHistory] = useState<number[]>([]);

  // Focus & Caret
  const [isFocused, setIsFocused] = useState<boolean>(false);
  const [caretPos, setCaretPos] = useState<{ top: number; left: number; scrollOffset: number }>({
    top: 6,
    left: 0,
    scrollOffset: 0,
  });

  const hiddenInputRef = useRef<HTMLInputElement>(null);
  const wordsContainerRef = useRef<HTMLDivElement>(null);
  const startTimeRef = useRef<number>(0);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Sound generator
  const playSound = useCallback((type: "key" | "error") => {
    if (!soundEnabled || typeof window === "undefined") return;
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      if (ctx.state === "suspended") ctx.resume();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const freq = type === "key" ? 580 : 220;
      const dur = type === "key" ? 0.04 : 0.08;
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + dur);
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + dur);
    } catch {
      // Audio context fail-safe
    }
  }, [soundEnabled]);

  // Generate words array
  const generateWords = useCallback((count: number): WordState[] => {
    const pool = RUSSIAN_WORDS.length > 0 ? RUSSIAN_WORDS : ["привет", "город", "книга", "работа"];
    const generated: WordState[] = [];
    for (let i = 0; i < count; i++) {
      const w = pool[Math.floor(Math.random() * pool.length)];
      generated.push({
        original: w,
        letters: w.split("").map((c) => ({ char: c, state: "untyped" })),
        hasError: false,
      });
    }
    return generated;
  }, []);

  // Initialize or reset game
  const resetGame = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    const count = mode === "words" ? wordLimit : 120;
    const initialWords = generateWords(count);

    setWords(initialWords);
    setCurrentWordIdx(0);
    setCurrentCharIdx(0);
    setIsRunning(false);
    setIsFinished(false);
    setTimeLeft(mode === "time" ? timeLimit : 0);
    setCorrectChars(0);
    setIncorrectChars(0);
    setExtraChars(0);
    setMissedChars(0);
    setTotalKeystrokes(0);
    setLiveWpm(0);
    setWpmHistory([]);
    setCaretPos({ top: 6, left: 0, scrollOffset: 0 });

    if (hiddenInputRef.current) {
      hiddenInputRef.current.value = "";
      hiddenInputRef.current.focus();
    }
    setIsFocused(true);
  }, [mode, timeLimit, wordLimit, generateWords]);

  useEffect(() => {
    resetGame();
  }, [resetGame]);

  // End game calculation
  const finishGame = useCallback(() => {
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
      const elapsedSec = (Date.now() - startTimeRef.current) / 1000;
      if (elapsedSec >= 1) {
        const curWpm = Math.round(((correctChars + currentWordIdx) / 5) / (elapsedSec / 60));
        setLiveWpm(curWpm);
        setWpmHistory((prev) => [...prev, curWpm]);
      }

      if (mode === "time") {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            finishGame();
            return 0;
          }
          return prev - 1;
        });
      }
    }, 1000);

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [isRunning, mode, correctChars, currentWordIdx, finishGame]);

  // Update Caret position and 3-line scroll
  const updateCaretPosition = useCallback(() => {
    const container = wordsContainerRef.current;
    if (!container) return;

    const wordEl = container.children[currentWordIdx] as HTMLElement;
    if (!wordEl) return;

    requestAnimationFrame(() => {
      // Calculate line height
      let lineHeight = 48;
      if (container.children.length >= 2) {
        const first = container.children[0] as HTMLElement;
        for (let i = 1; i < container.children.length; i++) {
          const child = container.children[i] as HTMLElement;
          if (child.offsetTop > first.offsetTop) {
            lineHeight = child.offsetTop - first.offsetTop;
            break;
          }
        }
      }

      const currentWordTop = wordEl.offsetTop;
      const currentLine = Math.round(currentWordTop / lineHeight);
      const targetScrollLine = Math.max(0, currentLine - 1);
      const targetOffset = targetScrollLine * lineHeight;

      const letterEl = wordEl.children[currentCharIdx] as HTMLElement;
      let top = 0;
      let left = 0;

      if (letterEl) {
        top = wordEl.offsetTop + letterEl.offsetTop + (letterEl.offsetHeight - 30) / 2;
        left = wordEl.offsetLeft + letterEl.offsetLeft;
      } else {
        const last = wordEl.lastElementChild as HTMLElement;
        if (last) {
          top = wordEl.offsetTop + last.offsetTop + (last.offsetHeight - 30) / 2;
          left = wordEl.offsetLeft + last.offsetLeft + last.offsetWidth;
        } else {
          top = wordEl.offsetTop;
          left = wordEl.offsetLeft;
        }
      }

      setCaretPos({
        top: top || 6,
        left: left || 0,
        scrollOffset: targetOffset,
      });
    });
  }, [currentWordIdx, currentCharIdx]);

  useEffect(() => {
    updateCaretPosition();
  }, [updateCaretPosition]);

  // Keydown Event Handler
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Restart shortcut: Shift + Enter
    if (e.key === "Enter" && e.shiftKey) {
      e.preventDefault();
      resetGame();
      return;
    }

    if (isFinished) return;

    // Start timer on first keystroke
    if (!isRunning && e.key.length === 1) {
      setIsRunning(true);
      startTimeRef.current = Date.now();
    }

    const currentWord = words[currentWordIdx];
    if (!currentWord) return;

    // BACKSPACE
    if (e.key === "Backspace") {
      e.preventDefault();
      playSound("key");

      if (currentCharIdx > 0) {
        const isCtrl = e.ctrlKey;
        setWords((prev) => {
          const next = [...prev];
          const w = { ...next[currentWordIdx] };
          const letters = [...w.letters];

          if (isCtrl) {
            // Delete whole word input
            for (let i = 0; i < currentCharIdx; i++) {
              if (letters[i].state === "correct") setCorrectChars((c) => Math.max(0, c - 1));
              if (letters[i].state === "incorrect") setIncorrectChars((c) => Math.max(0, c - 1));
              if (letters[i].state === "extra") setExtraChars((c) => Math.max(0, c - 1));
            }
            w.letters = letters
              .filter((l) => l.state !== "extra")
              .map((l) => ({ ...l, state: "untyped" as const }));
            setCurrentCharIdx(0);
          } else {
            // Single char backspace
            const targetIdx = currentCharIdx - 1;
            const targetLetter = letters[targetIdx];
            if (targetLetter.state === "correct") setCorrectChars((c) => Math.max(0, c - 1));
            if (targetLetter.state === "incorrect") setIncorrectChars((c) => Math.max(0, c - 1));
            if (targetLetter.state === "extra") {
              setExtraChars((c) => Math.max(0, c - 1));
              letters.splice(targetIdx, 1);
            } else {
              letters[targetIdx] = { ...targetLetter, state: "untyped" };
            }
            w.letters = letters;
            setCurrentCharIdx(targetIdx);
          }
          next[currentWordIdx] = w;
          return next;
        });
      } else if (currentWordIdx > 0) {
        // Backspace into previous word if it has errors
        const prevWord = words[currentWordIdx - 1];
        if (prevWord && prevWord.hasError) {
          setCurrentWordIdx((prev) => prev - 1);
          setCurrentCharIdx(prevWord.letters.length);
          setWords((prev) => {
            const next = [...prev];
            next[currentWordIdx - 1] = {
              ...next[currentWordIdx - 1],
              hasError: false,
            };
            return next;
          });
        }
      }
      return;
    }

    // SPACEBAR: Finish current word
    if (e.key === " " || e.key === "Spacebar") {
      e.preventDefault();
      playSound("key");

      const hasErrors = currentWord.letters.some(
        (l) => l.state === "incorrect" || l.state === "extra"
      );
      const isShort = currentCharIdx < currentWord.original.length;

      // Mark untyped letters as missed / incorrect
      if (isShort) {
        setWords((prev) => {
          const next = [...prev];
          const w = { ...next[currentWordIdx] };
          const letters = [...w.letters];
          for (let i = currentCharIdx; i < letters.length; i++) {
            if (letters[i].state === "untyped") {
              letters[i] = { ...letters[i], state: "incorrect" };
              setMissedChars((m) => m + 1);
              setIncorrectChars((inc) => inc + 1);
            }
          }
          w.letters = letters;
          w.hasError = true;
          next[currentWordIdx] = w;
          return next;
        });
      } else if (hasErrors) {
        setWords((prev) => {
          const next = [...prev];
          next[currentWordIdx] = { ...next[currentWordIdx], hasError: true };
          return next;
        });
      }

      // Check if words limit reached in words mode
      if (mode === "words" && currentWordIdx + 1 >= wordLimit) {
        finishGame();
        return;
      }

      // Append more words in time mode if nearing end
      if (mode === "time" && currentWordIdx >= words.length - 15) {
        setWords((prev) => [...prev, ...generateWords(30)]);
      }

      setCurrentWordIdx((prev) => prev + 1);
      setCurrentCharIdx(0);
      return;
    }

    // NORMAL CHARACTER INPUT
    if (e.key.length === 1) {
      const typedChar = e.key;
      setTotalKeystrokes((t) => t + 1);

      if (currentCharIdx < currentWord.letters.length) {
        const targetChar = currentWord.letters[currentCharIdx].char;
        const isMatch = typedChar === targetChar;

        if (isMatch) {
          setCorrectChars((c) => c + 1);
          playSound("key");
        } else {
          setIncorrectChars((inc) => inc + 1);
          playSound("error");
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

        // Auto end on last word completion in words mode
        if (
          mode === "words" &&
          currentWordIdx === wordLimit - 1 &&
          nextCharIdx === currentWord.original.length
        ) {
          finishGame();
        }
      } else {
        // Extra letters beyond word length (max 4 extra)
        const currentExtras = currentWord.letters.filter((l) => l.state === "extra").length;
        if (currentExtras < 4) {
          setExtraChars((ex) => ex + 1);
          setIncorrectChars((inc) => inc + 1);
          playSound("error");

          setWords((prev) => {
            const next = [...prev];
            const w = { ...next[currentWordIdx] };
            w.letters = [
              ...w.letters,
              { char: typedChar, state: "extra" },
            ];
            next[currentWordIdx] = w;
            return next;
          });
          setCurrentCharIdx((prev) => prev + 1);
        }
      }
    }
  };

  // Final Stats Calculation
  const finalSec = Math.max((Date.now() - startTimeRef.current) / 1000, 1);
  const finalMin = Math.max(finalSec / 60, 0.05);
  const finalWpm = Math.round(((correctChars + currentWordIdx) / 5) / finalMin) || 0;
  const finalRawWpm = Math.round(((totalKeystrokes + currentWordIdx) / 5) / finalMin) || 0;
  const finalAcc = totalKeystrokes > 0 ? Math.round((correctChars / totalKeystrokes) * 100) : 100;

  // Consistency calculation
  let finalConsistency = 100;
  if (wpmHistory.length > 2) {
    const mean = wpmHistory.reduce((a, b) => a + b, 0) / wpmHistory.length;
    if (mean > 0) {
      const std = Math.sqrt(
        wpmHistory.reduce((a, b) => a + (b - mean) ** 2, 0) / wpmHistory.length
      );
      finalConsistency = Math.max(0, Math.round(100 - (std / mean) * 100));
    }
  }

  return (
    <div className="page-container max-w-5xl mx-auto px-4 py-8">
      {/* Geri Dön Butonu */}
      <Link
        href="/practice"
        className="back-link mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft size={16} />
        {uiLang === "tr" ? "Alıştırmalara Dön" : "Back to Practice"}
      </Link>

      {/* Sayfa Başlığı */}
      <div className="page-header mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center text-primary">
            <Keyboard size={22} />
          </div>
          <h1 className="page-title text-2xl sm:text-3xl font-extrabold tracking-tight">
            {t.typingSpeedTest}
          </h1>
          <span className="new-modes-badge">New Modes!</span>
        </div>
        <p className="page-subtitle text-muted-foreground text-sm sm:text-base max-w-2xl">
          {t.typingSpeedDesc}
        </p>
      </div>

      {/* CONFIG BAR */}
      <div
        className={`flex flex-wrap items-center justify-center gap-2 sm:gap-4 p-2 sm:p-3 rounded-2xl bg-card/70 border border-border/70 backdrop-blur-md mb-8 transition-opacity duration-300 ${
          isRunning ? "opacity-30 pointer-events-none" : "opacity-100"
        }`}
      >
        {/* Mode Selector */}
        <div className="flex items-center gap-1 bg-secondary/80 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => {
              setMode("time");
              resetGame();
            }}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
              mode === "time" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Clock size={13} />
            {t.typingTime}
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("words");
              resetGame();
            }}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
              mode === "words" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <FileText size={13} />
            {t.typingWords}
          </button>
        </div>

        <div className="w-px h-5 bg-border/80 hidden sm:block" />

        {/* Time / Words limits */}
        {mode === "time" ? (
          <div className="flex items-center gap-1">
            {[15, 30, 60].map((sec) => (
              <button
                key={sec}
                type="button"
                onClick={() => {
                  setTimeLimit(sec);
                  resetGame();
                }}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  timeLimit === sec
                    ? "bg-secondary text-foreground ring-1 ring-primary/40 font-bold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {sec}s
              </button>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-1">
            {[10, 25, 50, 100].map((w) => (
              <button
                key={w}
                type="button"
                onClick={() => {
                  setWordLimit(w);
                  resetGame();
                }}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  wordLimit === w
                    ? "bg-secondary text-foreground ring-1 ring-primary/40 font-bold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {w}
              </button>
            ))}
          </div>
        )}

        <div className="w-px h-5 bg-border/80 hidden sm:block" />

        {/* Sound Toggle */}
        <button
          type="button"
          onClick={() => setSoundEnabled((prev) => !prev)}
          className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
            soundEnabled
              ? "bg-primary/10 border-primary/30 text-primary"
              : "border-border/60 text-muted-foreground hover:text-foreground"
          }`}
          title={soundEnabled ? "Mute" : "Unmute"}
        >
          {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
        </button>

        {/* Restart Button */}
        <button
          type="button"
          onClick={resetGame}
          className="p-1.5 rounded-lg border border-border/60 text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors cursor-pointer"
          title={t.restartTest}
        >
          <RotateCcw size={16} />
        </button>
      </div>

      {/* GAME RUNNING AREA */}
      {!isFinished ? (
        <div className="relative w-full">
          {/* Live Indicator (Time or Words counter) */}
          <div className="flex items-center justify-between px-2 mb-3 h-8">
            <span className="text-2xl font-black text-primary font-mono tracking-tight">
              {mode === "time" ? timeLeft : `${currentWordIdx}/${wordLimit}`}
            </span>
            {isRunning && (
              <span className="text-sm font-semibold text-muted-foreground font-mono">
                {liveWpm} {t.typingWpm}
              </span>
            )}
          </div>

          {/* Typing Area (3 lines height, smooth scrolling) */}
          <Card
            onClick={() => {
              hiddenInputRef.current?.focus();
              setIsFocused(true);
            }}
            className="relative p-6 sm:p-8 bg-card/60 border border-border/80 rounded-3xl shadow-xl overflow-hidden cursor-text min-h-[160px]"
          >
            {/* Blinking / Smooth Caret */}
            {isFocused && (
              <div
                className="monkey-caret"
                style={{
                  top: `${caretPos.top}px`,
                  left: `${caretPos.left}px`,
                  transform: `translateY(-${caretPos.scrollOffset}px)`,
                }}
              />
            )}

            {/* Words Container */}
            <div
              ref={wordsContainerRef}
              style={{
                transform: `translateY(-${caretPos.scrollOffset}px)`,
                transition: "transform 0.18s ease-in-out",
              }}
              className="flex flex-wrap gap-x-3.5 gap-y-3 text-xl sm:text-2xl font-mono leading-relaxed select-none"
            >
              {words.map((w, wIdx) => {
                const isCurrent = wIdx === currentWordIdx;
                return (
                  <div
                    key={wIdx}
                    className={`inline-flex relative pb-0.5 transition-colors ${
                      w.hasError ? "border-b-2 border-rose-500/80" : ""
                    }`}
                  >
                    {w.letters.map((l, lIdx) => {
                      let colorClass = "text-muted-foreground/40";
                      if (l.state === "correct") {
                        colorClass = "text-emerald-500 dark:text-emerald-400 font-semibold";
                      } else if (l.state === "incorrect") {
                        colorClass = "text-rose-500 font-bold bg-rose-500/15 rounded-sm";
                      } else if (l.state === "extra") {
                        colorClass = "text-rose-400 font-bold bg-rose-500/25 rounded-sm";
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

            {/* Hidden Input for Capturing Keystrokes */}
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

            {/* Focus Overlay if blurred */}
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

          {/* Quick Restart Hint */}
          <div className="mt-4 text-center text-xs text-muted-foreground font-mono">
            <kbd className="px-1.5 py-0.5 rounded bg-secondary border border-border/80 text-[11px]">Shift</kbd> + <kbd className="px-1.5 py-0.5 rounded bg-secondary border border-border/80 text-[11px]">Enter</kbd> {t.shiftEnterRestart}
          </div>
        </div>
      ) : (
        /* RESULTS SCREEN (Monkeytype style) */
        <Card className="p-8 sm:p-10 bg-card/80 border border-border/80 rounded-3xl shadow-2xl max-w-2xl mx-auto text-center space-y-8 animate-in fade-in zoom-in-95 duration-200">
          <div className="grid grid-cols-2 gap-6 pb-6 border-b border-border/60">
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground font-bold mb-1">
                {t.typingWpm}
              </p>
              <p className="text-5xl sm:text-6xl font-black text-primary font-mono">
                {finalWpm}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground font-bold mb-1">
                {t.typingAccuracy}
              </p>
              <p className="text-5xl sm:text-6xl font-black text-emerald-500 font-mono">
                {finalAcc}%
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-left">
            <div className="p-3 rounded-xl bg-secondary/50 border border-border/50">
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground block font-bold">
                {uiLang === "tr" ? "Test Türü" : "Test Type"}
              </span>
              <span className="text-base font-bold text-foreground font-mono mt-0.5 block">
                {mode} {mode === "time" ? `${timeLimit}s` : wordLimit}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-secondary/50 border border-border/50">
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground block font-bold">
                {t.typingRaw}
              </span>
              <span className="text-base font-bold text-foreground font-mono mt-0.5 block">
                {finalRawWpm}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-secondary/50 border border-border/50">
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground block font-bold">
                {t.typingCharacters}
              </span>
              <span className="text-base font-bold text-foreground font-mono mt-0.5 block" title="correct / incorrect / extra / missed">
                {correctChars}/{incorrectChars}/{extraChars}/{missedChars}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-secondary/50 border border-border/50">
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground block font-bold">
                {t.typingConsistency}
              </span>
              <span className="text-base font-bold text-foreground font-mono mt-0.5 block">
                {finalConsistency}%
              </span>
            </div>
          </div>

          <div className="pt-2 flex flex-col items-center gap-3">
            <button
              type="button"
              onClick={resetGame}
              className="px-8 py-3 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-base shadow-lg shadow-primary/25 transition-all flex items-center gap-2 cursor-pointer active:scale-98"
            >
              <RotateCcw size={18} />
              <span>{t.restartTest}</span>
            </button>
            <span className="text-xs text-muted-foreground font-mono">
              <kbd className="px-1.5 py-0.5 rounded bg-secondary border border-border/80 text-[11px]">Shift</kbd> + <kbd className="px-1.5 py-0.5 rounded bg-secondary border border-border/80 text-[11px]">Enter</kbd>
            </span>
          </div>
        </Card>
      )}
    </div>
  );
}
