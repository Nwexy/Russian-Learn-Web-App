"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Filler,
  Tooltip,
} from "chart.js";
import { languageData, type LanguageItem } from "@/lib/speedtype-words";
import "./speedtype.css";

import type { Item, Lang } from "@/types";

// Register Chart.js components
Chart.register(
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Filler,
  Tooltip
);

export interface SpeedTypeTestProps {
  onExit?: () => void;
  initialLanguage?: string;
  items?: Item[];
  uiLang?: Lang;
}

type Mode = "time" | "words";
type TimeOption = 15 | 30 | 60 | 120;
type WordsOption = 10 | 25 | 50 | 100;
type ActiveView = "solo" | "race";
type RaceScreenState = "username" | "waiting" | "race" | "results";

export function SpeedTypeTest({
  onExit,
  initialLanguage = "russian_1k",
  items,
  uiLang,
}: SpeedTypeTestProps) {
  // Config
  const [mode, setMode] = useState<Mode>("time");
  const [timeSetting, setTimeSetting] = useState<TimeOption>(30);
  const [wordsSetting, setWordsSetting] = useState<WordsOption>(25);
  const [punctuation, setPunctuation] = useState<boolean>(false);
  const [numbers, setNumbers] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [selectedLanguage, setSelectedLanguage] = useState<string>(
    languageData.some((l) => l.id === initialLanguage) ? initialLanguage : "russian_1k"
  );

  // View state
  const [activeView, setActiveView] = useState<ActiveView>("solo");

  // Language modal
  const [isLangModalOpen, setIsLangModalOpen] = useState<boolean>(false);
  const [langSearch, setLangSearch] = useState<string>("");

  // Game state
  const [gameWords, setGameWords] = useState<string[]>([]);
  const [timerDisplay, setTimerDisplay] = useState<string>("30");
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isFocused, setIsFocused] = useState<boolean>(false);
  const [showResult, setShowResult] = useState<boolean>(false);

  // Result stats
  const [finalWpm, setFinalWpm] = useState<number>(0);
  const [finalAcc, setFinalAcc] = useState<number>(0);
  const [finalRaw, setFinalRaw] = useState<number>(0);
  const [finalChars, setFinalChars] = useState<string>("0/0/0/0");
  const [finalType, setFinalType] = useState<string>("time 30");
  const [finalConsistency, setFinalConsistency] = useState<number>(0);

  // DOM refs
  const typingAreaRef = useRef<HTMLDivElement>(null);
  const wordsElRef = useRef<HTMLDivElement>(null);
  const inputElRef = useRef<HTMLInputElement>(null);
  const caretElRef = useRef<HTMLDivElement>(null);
  const chartCanvasRef = useRef<HTMLCanvasElement>(null);
  const chartInstanceRef = useRef<Chart | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Composition flag for IME / mnemonic keyboards
  const isComposingRef = useRef<boolean>(false);

  // Mutable typing game progress refs
  const typingStateRef = useRef({
    wordIdx: 0,
    charIdx: 0,
    correct: 0,
    incorrect: 0,
    extra: 0,
    missed: 0,
    total: 0,
    startTime: 0,
    wpmHistory: [] as number[],
    timer: 30,
    intervalId: null as NodeJS.Timeout | null,
    running: false,
  });

  /* ==========================================================================
     AUDIO FEEDBACK (Web Audio API)
     ========================================================================== */
  const playSound = useCallback((freq: number, dur: number) => {
    if (!soundEnabled) return;
    try {
      if (!audioCtxRef.current) {
        const AudioContextClass =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        audioCtxRef.current = new AudioContextClass();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") {
        ctx.resume();
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + dur);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + dur);
    } catch {
      // Audio autoplay policy fallback
    }
  }, [soundEnabled]);

  /* ==========================================================================
     LINE HEIGHT & CARET CALCULATION (Precise bounding box alignment)
     ========================================================================== */
  const getLineHeight = useCallback(() => {
    const wordsEl = wordsElRef.current;
    if (!wordsEl || wordsEl.children.length < 2) return 48;
    const first = wordsEl.children[0] as HTMLElement;
    for (let i = 1; i < wordsEl.children.length; i++) {
      const el = wordsEl.children[i] as HTMLElement;
      if (el.offsetTop > first.offsetTop) {
        return el.offsetTop - first.offsetTop;
      }
    }
    return 48;
  }, []);

  const updateCaret = useCallback(() => {
    const areaEl = typingAreaRef.current;
    const wordsEl = wordsElRef.current;
    const caretEl = caretElRef.current;
    if (!areaEl || !wordsEl || !caretEl) return;

    const { wordIdx, charIdx } = typingStateRef.current;
    const wordEl = wordsEl.children[wordIdx] as HTMLElement;
    if (!wordEl) return;

    requestAnimationFrame(() => {
      const lineHeight = getLineHeight();
      const currentWordTop = wordEl.offsetTop;
      const currentLine = Math.round(currentWordTop / lineHeight);
      const targetScrollLine = Math.max(0, currentLine - 1);
      const targetOffset = targetScrollLine * lineHeight;
      wordsEl.style.transform = `translateY(-${targetOffset}px)`;

      const areaRect = areaEl.getBoundingClientRect();
      const letterEl = wordEl.children[charIdx] as HTMLElement;
      const caretHeight = caretEl.offsetHeight || 28;
      let top = 0;
      let left = 0;

      if (letterEl) {
        const letterRect = letterEl.getBoundingClientRect();
        left = letterRect.left - areaRect.left;
        top = letterRect.top - areaRect.top + (letterRect.height - caretHeight) / 2;
      } else {
        const last = wordEl.lastElementChild as HTMLElement;
        if (last) {
          const lastRect = last.getBoundingClientRect();
          left = lastRect.right - areaRect.left;
          top = lastRect.top - areaRect.top + (lastRect.height - caretHeight) / 2;
        } else {
          const wordRect = wordEl.getBoundingClientRect();
          left = wordRect.left - areaRect.left;
          top = wordRect.top - areaRect.top + (wordRect.height - caretHeight) / 2;
        }
      }

      caretEl.style.transform = "none";
      caretEl.style.left = `${left}px`;
      caretEl.style.top = `${top}px`;
    });
  }, [getLineHeight]);

  /* ==========================================================================
     WORD GENERATION & RENDERING
     ========================================================================== */
  const generateWords = useCallback(
    (lang: string, m: Mode, punc: boolean, num: boolean, wCount: number) => {
      const dict = languageData.find((l) => l.id === lang) || languageData[0];
      const source = dict.words;
      const count = m === "words" ? wCount : 100;
      const generated: string[] = [];

      for (let i = 0; i < count; i++) {
        let w = source[Math.floor(Math.random() * source.length)];
        if (punc && Math.random() < 0.2) {
          const p = ".,:;?!-"[Math.floor(Math.random() * 7)];
          w = Math.random() < 0.5 ? w + p : p + w;
        }
        if (num && Math.random() < 0.1) {
          w = String(Math.floor(Math.random() * 1000));
        }
        generated.push(w);
      }
      return generated;
    },
    []
  );

  const addWords = useCallback(() => {
    const dict = languageData.find((l) => l.id === selectedLanguage) || languageData[0];
    const source = dict.words;
    const wordsEl = wordsElRef.current;
    if (!wordsEl) return;

    const newWords: string[] = [];
    for (let i = 0; i < 20; i++) {
      let w = source[Math.floor(Math.random() * source.length)];
      if (punctuation && Math.random() < 0.2) {
        const p = ".,:;?!-"[Math.floor(Math.random() * 7)];
        w = Math.random() < 0.5 ? w + p : p + w;
      }
      if (numbers && Math.random() < 0.1) {
        w = String(Math.floor(Math.random() * 1000));
      }
      newWords.push(w);

      const div = document.createElement("div");
      div.className = "word";
      w.split("").forEach((c) => {
        const span = document.createElement("span");
        span.className = "letter";
        span.textContent = c;
        div.appendChild(span);
      });
      wordsEl.appendChild(div);
    }

    setGameWords((prev) => [...prev, ...newWords]);
  }, [selectedLanguage, punctuation, numbers]);

  /* ==========================================================================
     START & END GAME LOGIC (SOLO MODE)
     ========================================================================== */
  const endGame = useCallback(() => {
    const state = typingStateRef.current;
    if (state.intervalId) {
      clearInterval(state.intervalId);
      state.intervalId = null;
    }
    state.running = false;
    setIsRunning(false);

    const sec = (Date.now() - state.startTime) / 1000;
    const min = sec / 60;
    const safeMin = Math.max(min, 0.1);

    const wpm = Math.round((state.correct + state.wordIdx) / 4.8 / safeMin) || 0;
    const rawWpm = Math.round((state.total + state.wordIdx) / 4.8 / safeMin) || 0;
    const acc = state.total > 0 ? Math.round((state.correct / state.total) * 100) : 0;

    let cons = 0;
    if (state.wpmHistory.length > 1) {
      const mean = state.wpmHistory.reduce((a, b) => a + b, 0) / state.wpmHistory.length;
      const std = Math.sqrt(
        state.wpmHistory.reduce((a, b) => a + (b - mean) ** 2, 0) / state.wpmHistory.length
      );
      cons = Math.max(0, Math.round(100 - (std / mean) * 100));
    }

    setFinalWpm(wpm);
    setFinalAcc(acc);
    setFinalRaw(rawWpm);
    setFinalChars(`${state.correct}/${state.incorrect}/${state.extra}/${state.missed}`);
    setFinalType(`${mode} ${mode === "time" ? timeSetting : wordsSetting}`);
    setFinalConsistency(cons);
    setShowResult(true);

    // Render chart
    setTimeout(() => {
      if (chartCanvasRef.current) {
        if (chartInstanceRef.current) {
          chartInstanceRef.current.destroy();
        }
        const ctx = chartCanvasRef.current.getContext("2d");
        if (ctx) {
          chartInstanceRef.current = new Chart(ctx, {
            type: "line",
            data: {
              labels: state.wpmHistory.map((_, i) => i + 1),
              datasets: [
                {
                  label: "WPM",
                  data: state.wpmHistory,
                  borderColor: "#8c9eff",
                  backgroundColor: "rgba(140,158,255,0.12)",
                  tension: 0.4,
                  fill: true,
                  borderWidth: 3,
                  pointRadius: 2,
                  pointHoverRadius: 5,
                },
              ],
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              scales: {
                y: {
                  beginAtZero: true,
                  grid: { color: "rgba(255, 255, 255, 0.05)" },
                  ticks: { color: "#8a8b8c" },
                },
                x: {
                  display: false,
                },
              },
              plugins: {
                legend: { display: false },
                tooltip: {
                  backgroundColor: "#2c2c2f",
                  titleColor: "#e2e2e6",
                  bodyColor: "#8c9eff",
                  borderColor: "rgba(255,255,255,0.1)",
                  borderWidth: 1,
                },
              },
            },
          });
        }
      }
    }, 120);
  }, [mode, timeSetting, wordsSetting]);

  const updateWpm = useCallback(() => {
    const state = typingStateRef.current;
    const sec = (Date.now() - state.startTime) / 1000;
    if (sec < 1) return;
    const currentWpm = Math.round((state.correct + state.wordIdx) / 4.8 / (sec / 60));
    state.wpmHistory.push(currentWpm);
  }, []);

  const startGame = useCallback(() => {
    const state = typingStateRef.current;
    if (state.running) return;
    state.running = true;
    state.startTime = Date.now();
    state.timer = timeSetting;
    setIsRunning(true);

    state.intervalId = setInterval(() => {
      if (mode === "time") {
        state.timer--;
        setTimerDisplay(String(state.timer));
        if (state.timer <= 0) {
          endGame();
        }
      } else {
        setTimerDisplay(`${state.wordIdx}/${wordsSetting}`);
      }
      updateWpm();
    }, 1000);
  }, [mode, timeSetting, wordsSetting, endGame, updateWpm]);

  /* ==========================================================================
     INIT / RESET
     ========================================================================== */
  const init = useCallback(() => {
    const state = typingStateRef.current;
    if (state.intervalId) {
      clearInterval(state.intervalId);
      state.intervalId = null;
    }
    state.running = false;
    state.wordIdx = 0;
    state.charIdx = 0;
    state.correct = 0;
    state.incorrect = 0;
    state.extra = 0;
    state.missed = 0;
    state.total = 0;
    state.wpmHistory = [];

    const newWords = generateWords(selectedLanguage, mode, punctuation, numbers, wordsSetting);
    setGameWords(newWords);
    setIsRunning(false);
    setShowResult(false);
    setIsFocused(false);

    setTimerDisplay(mode === "time" ? String(timeSetting) : `0/${wordsSetting}`);

    if (inputElRef.current) {
      inputElRef.current.value = "";
      inputElRef.current.blur();
    }

    if (wordsElRef.current) {
      wordsElRef.current.style.transform = "translateY(0px)";
    }
    if (caretElRef.current) {
      caretElRef.current.style.transform = "none";
    }

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        updateCaret();
      });
    });
  }, [selectedLanguage, mode, punctuation, numbers, wordsSetting, timeSetting, generateWords, updateCaret]);

  // Initial mount & settings change reset
  useEffect(() => {
    if (activeView === "solo") {
      init();
    }
  }, [activeView, init]);

  /* ==========================================================================
     KEY & COMPOSITION HANDLING (SOLO MODE)
     ========================================================================== */
  const handleSoloBackspace = useCallback(
    (isCtrl: boolean) => {
      const state = typingStateRef.current;
      const wordsEl = wordsElRef.current;
      if (!wordsEl) return;

      const currentWordStr = gameWords[state.wordIdx];
      const wordEl = wordsEl.children[state.wordIdx] as HTMLElement;
      if (!wordEl || !currentWordStr) return;

      if (state.charIdx > 0) {
        if (isCtrl) {
          while (state.charIdx > 0) {
            state.charIdx--;
            const el = wordEl.children[state.charIdx] as HTMLElement;
            if (el) {
              if (el.classList.contains("correct")) state.correct--;
              if (el.classList.contains("incorrect")) state.incorrect--;
              if (el.classList.contains("extra")) {
                el.remove();
                state.extra--;
              } else {
                el.className = "letter";
              }
            }
          }
        } else {
          state.charIdx--;
          const el = wordEl.children[state.charIdx] as HTMLElement;
          if (el) {
            if (el.classList.contains("correct")) state.correct--;
            if (el.classList.contains("incorrect")) state.incorrect--;
            if (el.classList.contains("extra")) {
              el.remove();
              state.extra--;
            } else {
              el.className = "letter";
            }
          }
        }
        playSound(600, 0.05);
      } else if (state.wordIdx > 0) {
        const prevWordEl = wordsEl.children[state.wordIdx - 1] as HTMLElement;
        if (prevWordEl && prevWordEl.classList.contains("error")) {
          state.wordIdx--;
          prevWordEl.classList.remove("error");
          state.charIdx = prevWordEl.children.length;
        }
      }
      updateCaret();
    },
    [gameWords, playSound, updateCaret]
  );

  const handleSoloSpace = useCallback(() => {
    const state = typingStateRef.current;
    if (!state.running) {
      startGame();
    }
    const wordsEl = wordsElRef.current;
    if (!wordsEl) return;

    const currentWordStr = gameWords[state.wordIdx];
    const wordEl = wordsEl.children[state.wordIdx] as HTMLElement;
    if (!wordEl || !currentWordStr) return;

    if (state.charIdx === 0) return;

    const hasErrors = Array.from(wordEl.children).some(
      (c) => c.classList.contains("incorrect") || c.classList.contains("extra")
    );

    for (let i = state.charIdx; i < currentWordStr.length; i++) {
      const letterEl = wordEl.children[i] as HTMLElement;
      if (letterEl) {
        letterEl.classList.add("incorrect");
        state.missed++;
      }
    }

    if (hasErrors || state.charIdx < currentWordStr.length) {
      wordEl.classList.add("error");
    }

    state.wordIdx++;
    state.charIdx = 0;
    playSound(600, 0.05);

    if (mode === "words" && state.wordIdx >= wordsSetting) {
      endGame();
      return;
    }

    if (mode === "time" && state.wordIdx > gameWords.length - 20) {
      addWords();
    }
    updateCaret();
  }, [gameWords, mode, wordsSetting, startGame, playSound, endGame, addWords, updateCaret]);

  const handleSoloChar = useCallback(
    (char: string) => {
      const state = typingStateRef.current;
      if (!state.running) {
        startGame();
      }
      const wordsEl = wordsElRef.current;
      if (!wordsEl) return;

      const currentWordStr = gameWords[state.wordIdx];
      const wordEl = wordsEl.children[state.wordIdx] as HTMLElement;
      if (!wordEl || !currentWordStr) return;

      const target = currentWordStr[state.charIdx];
      const el = wordEl.children[state.charIdx] as HTMLElement;

      if (el) {
        if (char === target) {
          el.classList.add("correct");
          state.correct++;
          playSound(600, 0.05);
        } else {
          el.classList.add("incorrect");
          state.incorrect++;
          playSound(200, 0.1);
        }
        state.total++;
        state.charIdx++;

        if (
          mode === "words" &&
          state.wordIdx === wordsSetting - 1 &&
          state.charIdx === currentWordStr.length
        ) {
          endGame();
          return;
        }
      } else {
        const currentExtras = wordEl.querySelectorAll(".extra").length;
        if (currentExtras < 10) {
          const span = document.createElement("span");
          span.className = "letter extra incorrect";
          span.textContent = char;
          wordEl.appendChild(span);
          state.charIdx++;
          state.extra++;
          state.incorrect++;
          playSound(200, 0.1);
        }
      }
      updateCaret();
    },
    [gameWords, mode, wordsSetting, startGame, playSound, endGame, updateCaret]
  );

  const handleSoloKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (isComposingRef.current || e.nativeEvent.isComposing) {
        return;
      }

      if (e.key === "Backspace") {
        e.preventDefault();
        handleSoloBackspace(e.ctrlKey);
      } else if (e.key === " ") {
        e.preventDefault();
        handleSoloSpace();
        if (inputElRef.current) inputElRef.current.value = "";
      } else if (e.key === "Tab") {
        e.preventDefault();
        init();
      }
    },
    [handleSoloBackspace, handleSoloSpace, init]
  );

  const handleSoloInput = useCallback(
    (e: React.FormEvent<HTMLInputElement>) => {
      if (isComposingRef.current || (e.nativeEvent as InputEvent).isComposing) {
        return;
      }
      const val = e.currentTarget.value;
      if (!val) return;
      for (const ch of val) {
        if (ch === " ") {
          handleSoloSpace();
        } else {
          handleSoloChar(ch);
        }
      }
      e.currentTarget.value = "";
    },
    [handleSoloSpace, handleSoloChar]
  );

  const handleSoloCompositionStart = useCallback(() => {
    isComposingRef.current = true;
  }, []);

  const handleSoloCompositionEnd = useCallback(
    (e: React.CompositionEvent<HTMLInputElement>) => {
      isComposingRef.current = false;
      const text = e.data || e.currentTarget.value;
      if (text) {
        for (const ch of text) {
          if (ch === " ") {
            handleSoloSpace();
          } else {
            handleSoloChar(ch);
          }
        }
      }
      e.currentTarget.value = "";
    },
    [handleSoloSpace, handleSoloChar]
  );

  // Global keyboard shortcuts (Shift+Enter or Escape to restart)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (isLangModalOpen) {
        if (e.key === "Escape") setIsLangModalOpen(false);
        return;
      }

      if (e.key === "Escape") {
        e.preventDefault();
        init();
        return;
      }

      if (e.shiftKey && e.key === "Enter") {
        e.preventDefault();
        init();
        return;
      }

      if (isFocused && inputElRef.current) {
        inputElRef.current.focus();
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [isLangModalOpen, isFocused, init]);

  // Focus click handler
  const handleGameContainerClick = () => {
    setIsFocused(true);
    if (inputElRef.current) {
      inputElRef.current.focus();
    }
  };

  /* ==========================================================================
     RACE MODE LOGIC (REAL MULTIPLAYER 1V1 OVER SERVER-SENT EVENTS)
     ========================================================================== */
  const playerIdRef = useRef<string>("");
  const raceIdRef = useRef<string>("");
  const eventSourceRef = useRef<EventSource | null>(null);

  const [raceScreen, setRaceScreen] = useState<RaceScreenState>("username");
  const [raceUsername, setRaceUsername] = useState<string>("Player");
  const [raceLanguage, setRaceLanguage] = useState<string>(
    languageData.some((l) => l.id === selectedLanguage) ? selectedLanguage : "russian_1k"
  );
  const [raceOpponent, setRaceOpponent] = useState<string>("Opponent");
  const [raceWords, setRaceWords] = useState<string[]>([]);
  const [countdown, setCountdown] = useState<number | string>(3);
  const [isCountdownActive, setIsCountdownActive] = useState<boolean>(false);
  const [raceTimer, setRaceTimer] = useState<number>(60);
  const [racePlayerWpm, setRacePlayerWpm] = useState<number>(0);
  const [raceOpponentWpm, setRaceOpponentWpm] = useState<number>(0);
  const [raceOpponentProgress, setRaceOpponentProgress] = useState<number>(0);
  const [isWaitingForOpponent, setIsWaitingForOpponent] = useState<boolean>(false);

  const [racePlayerResult, setRacePlayerResult] = useState({
    wpm: 0,
    acc: 0,
    raw: 0,
    isWinner: false,
    isTie: false,
  });
  const [raceOpponentResult, setRaceOpponentResult] = useState({
    wpm: 0,
    acc: 0,
    raw: 0,
  });

  const raceStateRef = useRef({
    wordIdx: 0,
    charIdx: 0,
    correct: 0,
    incorrect: 0,
    total: 0,
    startTime: 0,
    timer: 60,
    intervalId: null as NodeJS.Timeout | null,
    running: false,
    playerDone: false,
  });

  const raceAreaRef = useRef<HTMLDivElement>(null);
  const raceWordsElRef = useRef<HTMLDivElement>(null);
  const raceCaretElRef = useRef<HTMLDivElement>(null);
  const raceInputRef = useRef<HTMLInputElement>(null);
  const isRaceComposingRef = useRef<boolean>(false);

  // Initialize unique player ID
  useEffect(() => {
    if (!playerIdRef.current) {
      playerIdRef.current = "p_" + Math.random().toString(36).slice(2, 9);
    }
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, []);

  const updateRaceCaret = useCallback(() => {
    const areaEl = raceAreaRef.current;
    const wordsEl = raceWordsElRef.current;
    const caretEl = raceCaretElRef.current;
    if (!areaEl || !wordsEl || !caretEl) return;

    const { wordIdx, charIdx } = raceStateRef.current;
    const wordEl = wordsEl.children[wordIdx] as HTMLElement;
    if (!wordEl) return;

    requestAnimationFrame(() => {
      const areaRect = areaEl.getBoundingClientRect();
      const letterEl = wordEl.children[charIdx] as HTMLElement;
      const caretHeight = caretEl.offsetHeight || 28;
      let top = 0;
      let left = 0;

      if (letterEl) {
        const letterRect = letterEl.getBoundingClientRect();
        left = letterRect.left - areaRect.left;
        top = letterRect.top - areaRect.top + (letterRect.height - caretHeight) / 2;
      } else {
        const last = wordEl.lastElementChild as HTMLElement;
        if (last) {
          const lastRect = last.getBoundingClientRect();
          left = lastRect.right - areaRect.left;
          top = lastRect.top - areaRect.top + (lastRect.height - caretHeight) / 2;
        } else {
          const wordRect = wordEl.getBoundingClientRect();
          left = wordRect.left - areaRect.left;
          top = wordRect.top - areaRect.top + (wordRect.height - caretHeight) / 2;
        }
      }

      caretEl.style.transform = "none";
      caretEl.style.left = `${left}px`;
      caretEl.style.top = `${top}px`;
    });
  }, []);

  // Send live progress over HTTP POST to backend
  const sendLiveProgress = useCallback(
    (wpm: number, progress: number, charIndex: number) => {
      if (!raceIdRef.current || !playerIdRef.current) return;
      fetch("/api/race", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "progress",
          playerId: playerIdRef.current,
          raceId: raceIdRef.current,
          wpm,
          progress,
          charIndex,
        }),
      }).catch(() => {});
    },
    []
  );

  const endRace = useCallback(() => {
    const state = raceStateRef.current;
    if (state.intervalId) {
      clearInterval(state.intervalId);
      state.intervalId = null;
    }
    state.running = false;

    const sec = Math.max((Date.now() - state.startTime) / 1000, 1);
    const min = sec / 60;
    const pWpm = Math.round((state.correct + state.wordIdx) / 4.8 / min) || 0;
    const pRaw = Math.round((state.total + state.wordIdx) / 4.8 / min) || 0;
    const pAcc = state.total > 0 ? Math.round((state.correct / state.total) * 100) : 0;

    const res = { wpm: pWpm, acc: pAcc, raw: pRaw };
    setRacePlayerResult((prev) => ({ ...prev, ...res }));
    setIsWaitingForOpponent(true);

    if (raceIdRef.current && playerIdRef.current) {
      fetch("/api/race", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "finish",
          playerId: playerIdRef.current,
          raceId: raceIdRef.current,
          result: res,
        }),
      }).catch(() => {});
    }
  }, []);

  const startRace = useCallback(() => {
    const state = raceStateRef.current;
    state.running = true;
    state.startTime = Date.now();
    state.timer = 60;
    state.wordIdx = 0;
    state.charIdx = 0;
    state.correct = 0;
    state.incorrect = 0;
    state.total = 0;
    state.playerDone = false;
    setRaceTimer(60);
    setRacePlayerWpm(0);

    if (raceInputRef.current) {
      raceInputRef.current.disabled = false;
      raceInputRef.current.focus();
    }

    state.intervalId = setInterval(() => {
      state.timer--;
      setRaceTimer(state.timer);
      const sec = (Date.now() - state.startTime) / 1000;
      if (sec >= 1) {
        const curWpm = Math.round((state.correct + state.wordIdx) / 4.8 / (sec / 60));
        setRacePlayerWpm(curWpm);
        const curProg = Math.min(
          Math.round((state.wordIdx / Math.max(raceWords.length, 1)) * 100),
          100
        );
        sendLiveProgress(curWpm, curProg, state.charIdx);
      }
      if (state.timer <= 0) {
        endRace();
      }
    }, 1000);

    requestAnimationFrame(() => {
      updateRaceCaret();
    });
  }, [raceWords.length, endRace, sendLiveProgress, updateRaceCaret]);

  const startRaceCountdown = useCallback(() => {
    setRaceScreen("race");
    setIsCountdownActive(true);
    let count = 3;
    setCountdown(count);

    const countInterval = setInterval(() => {
      count--;
      if (count > 0) {
        setCountdown(count);
      } else if (count === 0) {
        setCountdown("GO!");
      } else {
        clearInterval(countInterval);
        setIsCountdownActive(false);
        startRace();
      }
    }, 900);
  }, [startRace]);

  // Connect Server-Sent Events to the real-time matchmaking hub
  const connectRaceSse = useCallback(
    (onConnected?: () => void) => {
      if (eventSourceRef.current) {
        if (eventSourceRef.current.readyState === EventSource.OPEN) {
          onConnected?.();
          return;
        }
        eventSourceRef.current.close();
      }

      const es = new EventSource(`/api/race?playerId=${playerIdRef.current}`);
      eventSourceRef.current = es;

      es.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "Connected") {
            onConnected?.();
          } else if (data.type === "Waiting") {
            setRaceScreen("waiting");
          } else if (data.type === "MatchFound") {
            raceIdRef.current = data.raceId;
            setRaceOpponent(data.opponentName);
            setRaceWords(data.words);
            setRaceOpponentProgress(0);
            setRaceOpponentWpm(0);
            startRaceCountdown();
          } else if (data.type === "OpponentProgress") {
            setRaceOpponentWpm(data.wpm);
            setRaceOpponentProgress(data.progress);
          } else if (data.type === "BothFinished") {
            setIsWaitingForOpponent(false);
            setRacePlayerResult({
              ...data.yourResult,
              isWinner: data.isWinner,
              isTie: data.isTie,
            });
            setRaceOpponentResult(data.oppResult);
            setRaceScreen("results");
          } else if (data.type === "OpponentDisconnected") {
            setIsWaitingForOpponent(false);
            alert("Opponent disconnected!");
            setRaceScreen("username");
          }
        } catch {
          // ignore keepalive pings
        }
      };

      es.onerror = () => {
        // SSE automatic reconnect
      };
    },
    [startRaceCountdown]
  );

  const handleStartRacing = useCallback(() => {
    setRaceScreen("waiting");
    connectRaceSse(() => {
      fetch("/api/race", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "join",
          playerId: playerIdRef.current,
          username: raceUsername || "Player",
          language: raceLanguage,
        }),
      }).catch(() => {});
    });
  }, [connectRaceSse, raceUsername, raceLanguage]);

  const handleRaceBackspace = useCallback(() => {
    const state = raceStateRef.current;
    if (!state.running) return;
    const wordsEl = raceWordsElRef.current;
    if (!wordsEl) return;

    const currentWordStr = raceWords[state.wordIdx];
    const wordEl = wordsEl.children[state.wordIdx] as HTMLElement;
    if (!wordEl || !currentWordStr) return;

    if (state.charIdx > 0) {
      state.charIdx--;
      const el = wordEl.children[state.charIdx] as HTMLElement;
      if (el) {
        if (el.classList.contains("correct")) state.correct--;
        if (el.classList.contains("incorrect")) state.incorrect--;
        el.className = "letter";
      }
      playSound(600, 0.05);
    }
    updateRaceCaret();
  }, [raceWords, playSound, updateRaceCaret]);

  const handleRaceSpace = useCallback(() => {
    const state = raceStateRef.current;
    if (!state.running) return;
    const wordsEl = raceWordsElRef.current;
    if (!wordsEl) return;

    const currentWordStr = raceWords[state.wordIdx];
    const wordEl = wordsEl.children[state.wordIdx] as HTMLElement;
    if (!wordEl || !currentWordStr) return;

    if (state.charIdx === 0) return;

    for (let i = state.charIdx; i < currentWordStr.length; i++) {
      const letterEl = wordEl.children[i] as HTMLElement;
      if (letterEl) letterEl.classList.add("incorrect");
    }
    state.wordIdx++;
    state.charIdx = 0;
    playSound(600, 0.05);

    const sec = Math.max((Date.now() - state.startTime) / 1000, 1);
    const curWpm = Math.round((state.correct + state.wordIdx) / 4.8 / (sec / 60));
    const curProg = Math.min(
      Math.round((state.wordIdx / Math.max(raceWords.length, 1)) * 100),
      100
    );
    sendLiveProgress(curWpm, curProg, state.charIdx);

    if (state.wordIdx >= raceWords.length) {
      state.playerDone = true;
      endRace();
      return;
    }
    updateRaceCaret();
  }, [raceWords, playSound, endRace, updateRaceCaret, sendLiveProgress]);

  const handleRaceChar = useCallback(
    (char: string) => {
      const state = raceStateRef.current;
      if (!state.running) return;
      const wordsEl = raceWordsElRef.current;
      if (!wordsEl) return;

      const currentWordStr = raceWords[state.wordIdx];
      const wordEl = wordsEl.children[state.wordIdx] as HTMLElement;
      if (!wordEl || !currentWordStr) return;

      const target = currentWordStr[state.charIdx];
      const el = wordEl.children[state.charIdx] as HTMLElement;
      if (el) {
        if (char === target) {
          el.classList.add("correct");
          state.correct++;
          playSound(600, 0.05);
        } else {
          el.classList.add("incorrect");
          state.incorrect++;
          playSound(200, 0.1);
        }
        state.total++;
        state.charIdx++;

        if (state.wordIdx === raceWords.length - 1 && state.charIdx === currentWordStr.length) {
          state.playerDone = true;
          endRace();
          return;
        }
      }
      updateRaceCaret();
    },
    [raceWords, playSound, endRace, updateRaceCaret]
  );

  const handleRaceKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (isRaceComposingRef.current || e.nativeEvent.isComposing) return;

      if (e.key === "Backspace") {
        e.preventDefault();
        handleRaceBackspace();
      } else if (e.key === " ") {
        e.preventDefault();
        handleRaceSpace();
        if (raceInputRef.current) raceInputRef.current.value = "";
      }
    },
    [handleRaceBackspace, handleRaceSpace]
  );

  const handleRaceInput = useCallback(
    (e: React.FormEvent<HTMLInputElement>) => {
      if (isRaceComposingRef.current || (e.nativeEvent as InputEvent).isComposing) return;
      const val = e.currentTarget.value;
      if (!val) return;
      for (const ch of val) {
        if (ch === " ") {
          handleRaceSpace();
        } else {
          handleRaceChar(ch);
        }
      }
      e.currentTarget.value = "";
    },
    [handleRaceSpace, handleRaceChar]
  );

  const handleRaceCompositionStart = useCallback(() => {
    isRaceComposingRef.current = true;
  }, []);

  const handleRaceCompositionEnd = useCallback(
    (e: React.CompositionEvent<HTMLInputElement>) => {
      isRaceComposingRef.current = false;
      const text = e.data || e.currentTarget.value;
      if (text) {
        for (const ch of text) {
          if (ch === " ") {
            handleRaceSpace();
          } else {
            handleRaceChar(ch);
          }
        }
      }
      e.currentTarget.value = "";
    },
    [handleRaceSpace, handleRaceChar]
  );

  const currentLangObj =
    languageData.find((l) => l.id === selectedLanguage) || languageData[0];

  return (
    <div className="w-full relative flex flex-col items-center">
      {/* Top Exit Button */}
      {onExit && (
        <div className="w-full max-w-[1200px] flex justify-start px-6 pt-4">
          <button
            type="button"
            onClick={onExit}
            className="flex items-center gap-2 text-sm font-semibold text-[#8a8b8c] hover:text-[#e2e2e6] transition-colors cursor-pointer bg-white/5 hover:bg-white/10 px-4 py-2 rounded-lg border border-white/10"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            <span>Back</span>
          </button>
        </div>
      )}

      {/* ====================================================================
          VIEW 1: SOLO SPEEDTYPE (MONKEYTYPE STYLE)
          ==================================================================== */}
      {activeView === "solo" && (
        <div id="game-wrapper">
          {/* Config Bar */}
          <div
            className="config-bar"
            id="config-bar"
            style={{
              opacity: isRunning ? 0.3 : 1,
              pointerEvents: isRunning ? "none" : "auto",
              display: showResult ? "none" : "flex",
            }}
          >
            <div className="config-group">
              <button
                type="button"
                className={`config-btn ${mode === "time" ? "active" : ""}`}
                onClick={() => {
                  setMode("time");
                  init();
                }}
              >
                time
              </button>
              <button
                type="button"
                className={`config-btn ${mode === "words" ? "active" : ""}`}
                onClick={() => {
                  setMode("words");
                  init();
                }}
              >
                words
              </button>
            </div>

            <div className="config-divider" />

            {mode === "time" ? (
              <div className="config-group">
                {([15, 30, 60, 120] as TimeOption[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    className={`config-btn ${timeSetting === t ? "active" : ""}`}
                    onClick={() => {
                      setTimeSetting(t);
                      init();
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>
            ) : (
              <div className="config-group">
                {([10, 25, 50, 100] as WordsOption[]).map((w) => (
                  <button
                    key={w}
                    type="button"
                    className={`config-btn ${wordsSetting === w ? "active" : ""}`}
                    onClick={() => {
                      setWordsSetting(w);
                      init();
                    }}
                  >
                    {w}
                  </button>
                ))}
              </div>
            )}

            <div className="config-divider" />

            <div className="config-group">
              <button
                type="button"
                className={`config-btn ${punctuation ? "active" : ""}`}
                onClick={() => {
                  setPunctuation(!punctuation);
                  init();
                }}
              >
                punct
              </button>
              <button
                type="button"
                className={`config-btn ${numbers ? "active" : ""}`}
                onClick={() => {
                  setNumbers(!numbers);
                  init();
                }}
              >
                numbers
              </button>
            </div>

            <div className="config-divider" />

            <div className="config-group">
              <button
                type="button"
                className={`icon-btn ${soundEnabled ? "active" : ""}`}
                onClick={() => setSoundEnabled(!soundEnabled)}
                aria-label="Toggle Sound"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  {soundEnabled ? (
                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
                  ) : (
                    <line x1="23" y1="9" x2="17" y2="15" />
                  )}
                </svg>
              </button>
            </div>

            <div className="config-divider" />

            <div className="config-group">
              <button
                type="button"
                className="race-link cursor-pointer"
                onClick={() => {
                  setActiveView("race");
                  setRaceScreen("username");
                }}
              >
                Race
              </button>
            </div>
          </div>

          {/* Game Area */}
          {!showResult && (
            <div id="game-container" onClick={handleGameContainerClick}>
              {/* Language Label (Globe icon above words) */}
              <div
                className="language-label"
                id="language-label"
                onClick={() => setIsLangModalOpen(true)}
                style={{
                  opacity: isRunning ? 0.3 : 1,
                  pointerEvents: isRunning ? "none" : "auto",
                }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="2" y1="12" x2="22" y2="12" />
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                </svg>
                <span id="langDisplay">{currentLangObj.name.toLowerCase()}</span>
              </div>

              {/* Stats / Timer */}
              <div className={`stats-container ${isRunning ? "visible" : ""}`} id="live-stats">
                <span id="timer">{timerDisplay}</span>
              </div>

              {/* Words Container */}
              <div id="typing-area" ref={typingAreaRef}>
                <div ref={caretElRef} id="caret" className="caret" />
                <div ref={wordsElRef} id="words">
                  {gameWords.map((word, wIdx) => (
                    <div key={wIdx} className="word">
                      {word.split("").map((c, cIdx) => (
                        <span key={cIdx} className="letter">
                          {c}
                        </span>
                      ))}
                    </div>
                  ))}
                </div>

                {/* Focus Overlay */}
                <div className={`focus-overlay ${isFocused ? "hidden" : ""}`}>
                  <div className="focus-message">Click here to focus</div>
                </div>
              </div>

              {/* Hidden Input to capture keystrokes cleanly (composition-safe) */}
              <input
                ref={inputElRef}
                type="text"
                id="hidden-input"
                autoComplete="off"
                autoCapitalize="off"
                spellCheck="false"
                onKeyDown={handleSoloKeyDown}
                onInput={handleSoloInput}
                onCompositionStart={handleSoloCompositionStart}
                onCompositionEnd={handleSoloCompositionEnd}
              />

              {/* Restart Button Below Typing Area */}
              <div className="game-restart-section">
                <button
                  type="button"
                  id="game-restart-btn"
                  className="icon-restart-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    init();
                  }}
                  aria-label="Restart"
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 2v6h-6" />
                    <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
                    <path d="M3 22v-6h6" />
                    <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* Result Screen */}
          {showResult && (
            <div id="result-screen" className="visible">
              <div className="result-top">
                <div className="result-main-stats">
                  <div className="big-stat">
                    <div className="title">wpm</div>
                    <div className="value">{finalWpm}</div>
                  </div>
                  <div className="big-stat">
                    <div className="title">acc</div>
                    <div className="value">{finalAcc}%</div>
                  </div>
                </div>
                <div id="chart-container">
                  <canvas ref={chartCanvasRef} id="wpmChart" />
                </div>
              </div>

              <div className="result-details">
                <div className="detail-stat">
                  <div className="title">test type</div>
                  <div className="value">{finalType}</div>
                </div>
                <div className="detail-stat">
                  <div className="title">raw</div>
                  <div className="value">{finalRaw}</div>
                </div>
                <div className="detail-stat">
                  <div className="title">characters</div>
                  <div className="value">{finalChars}</div>
                </div>
                <div className="detail-stat">
                  <div className="title">consistency</div>
                  <div className="value">{finalConsistency}%</div>
                </div>
              </div>

              <div className="result-actions">
                <button
                  type="button"
                  className="restart-btn"
                  onClick={init}
                  aria-label="Restart Test"
                >
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M23 4v6h-6" />
                    <path d="M1 20v-6h6" />
                    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                  </svg>
                </button>
                <div className="key-hint">
                  <kbd>Shift</kbd> + <kbd>Enter</kbd> to restart
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ====================================================================
          VIEW 2: RACE MODE (REAL 1V1 MULTIPLAYER MATCHMAKING)
          ==================================================================== */}
      {activeView === "race" && (
        <div id="race-wrapper">
          {/* Screen 1: Username & Language Screen */}
          {raceScreen === "username" && (
            <div className="race-screen active">
              <div className="username-container">
                <h1 className="race-title">Online 1v1 Race</h1>
                <p className="race-subtitle">Enter your username to race against another player live</p>

                <input
                  type="text"
                  className="username-input"
                  value={raceUsername}
                  onChange={(e) => setRaceUsername(e.target.value)}
                  placeholder="Your username"
                  maxLength={20}
                  autoComplete="off"
                />

                <div className="language-selection">
                  <div className="custom-select-wrapper">
                    <div className="custom-select">
                      <select
                        value={raceLanguage}
                        onChange={(e) => setRaceLanguage(e.target.value)}
                        className="custom-select-trigger w-full cursor-pointer bg-[#2a2d3a] border-2 border-[#3a3d4a] rounded-xl text-white outline-none"
                      >
                        {languageData.map((l) => (
                          <option key={l.id} value={l.id}>
                            {l.id.startsWith("russian") ? "RU " : "EN "}
                            {l.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <button type="button" className="race-btn" onClick={handleStartRacing}>
                  Start Racing
                </button>

                <div className="mt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveView("solo");
                      init();
                    }}
                    className="text-sm text-[#8a8b8c] hover:text-[#e2e2e6] transition-colors"
                  >
                    Back to Solo Practice
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Screen 2: Waiting / Matchmaking Screen */}
          {raceScreen === "waiting" && (
            <div className="race-screen active">
              <div className="waiting-container">
                <div className="loading-spinner" />
                <h2 className="text-2xl font-bold mb-2">Finding opponent...</h2>
                <p className="text-[#8a8b8c]">Please wait while we match you with another player</p>
                <div className="mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      fetch("/api/race", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          action: "leave",
                          playerId: playerIdRef.current,
                        }),
                      }).catch(() => {});
                      setRaceScreen("username");
                    }}
                    className="text-sm text-[#8a8b8c] hover:text-[#e2e2e6] transition-colors"
                  >
                    Cancel Matchmaking
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Screen 3: Active Race (1v1 Live) */}
          {raceScreen === "race" && (
            <div id="race-screen" className="race-screen active">
              {/* Countdown Overlay */}
              {isCountdownActive && (
                <div className="countdown-overlay">
                  <div className="countdown-number">{countdown}</div>
                </div>
              )}

              {/* Player Panel */}
              <div className={`player-panel ${isCountdownActive ? "blur-content" : ""}`}>
                <div className="race-header">
                  <div className="race-info">
                    <span className="text-white font-bold text-lg">
                      {raceUsername || "Player"}
                    </span>
                    <span className="vs-text">VS</span>
                    <span className="text-[#8a8b8c] font-bold text-lg">
                      {raceOpponent || "Opponent"}
                    </span>
                  </div>
                  <div className="race-stats">
                    <span className="race-timer-stat">{raceTimer}s</span>
                    <span className="race-wpm-stat">{racePlayerWpm} WPM</span>
                  </div>
                </div>

                <div
                  id="race-game-container"
                  ref={raceAreaRef}
                  onClick={() => {
                    if (raceInputRef.current) raceInputRef.current.focus();
                  }}
                >
                  <div ref={raceCaretElRef} id="race-caret" className="caret" />
                  <div ref={raceWordsElRef} id="race-words">
                    {raceWords.map((word, wIdx) => (
                      <div key={wIdx} className="word">
                        {word.split("").map((c, cIdx) => (
                          <span key={cIdx} className="letter">
                            {c}
                          </span>
                        ))}
                      </div>
                    ))}
                  </div>
                  <input
                    ref={raceInputRef}
                    type="text"
                    id="race-input"
                    autoComplete="off"
                    autoCapitalize="off"
                    spellCheck="false"
                    onKeyDown={handleRaceKeyDown}
                    onInput={handleRaceInput}
                    onCompositionStart={handleRaceCompositionStart}
                    onCompositionEnd={handleRaceCompositionEnd}
                  />
                </div>

                {/* Opponent Live Progress Panel */}
                <div className="opponent-panel mt-6">
                  <div className="opponent-header">
                    <span>{raceOpponent}</span>
                    <span>{raceOpponentWpm} WPM</span>
                  </div>
                  <div className="opponent-progress">
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{ width: `${raceOpponentProgress}%` }}
                      />
                    </div>
                    <span id="opp-progress-text">{raceOpponentProgress}%</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Screen 4: Race Results (1v1 Head-to-Head Comparison) */}
          {raceScreen === "results" && (
            <div className="race-screen active">
              <h1 className="results-title">Race Results</h1>

              {isWaitingForOpponent ? (
                <div className="waiting-container">
                  <div className="loading-spinner" />
                  <h2 className="text-2xl font-bold mb-2">Waiting for opponent to finish...</h2>
                  <p className="text-[#8a8b8c]">
                    Your WPM: {racePlayerResult.wpm} | Accuracy: {racePlayerResult.acc}%
                  </p>
                </div>
              ) : (
                <div className="results-container">
                  {/* Your Results */}
                  <div className="result-panel your-result">
                    <div className="result-header">
                      <h2>{raceUsername || "You"}</h2>
                      <div
                        className={`result-badge ${
                          racePlayerResult.isWinner
                            ? "winner"
                            : racePlayerResult.isTie
                            ? "tie"
                            : "loser"
                        }`}
                      >
                        {racePlayerResult.isWinner
                          ? "WINNER"
                          : racePlayerResult.isTie
                          ? "TIE"
                          : "LOSER"}
                      </div>
                    </div>
                    <div className="result-stats">
                      <div className="stat">
                        <span className="stat-label">WPM</span>
                        <span className="stat-value">{racePlayerResult.wpm}</span>
                      </div>
                      <div className="stat">
                        <span className="stat-label">Accuracy</span>
                        <span className="stat-value">{racePlayerResult.acc}%</span>
                      </div>
                      <div className="stat">
                        <span className="stat-label">Raw</span>
                        <span className="stat-value">{racePlayerResult.raw}</span>
                      </div>
                    </div>
                  </div>

                  {/* Opponent Results */}
                  <div className="result-panel opponent-result">
                    <div className="result-header">
                      <h2>{raceOpponent || "Opponent"}</h2>
                      <div
                        className={`result-badge ${
                          !racePlayerResult.isWinner && !racePlayerResult.isTie
                            ? "winner"
                            : racePlayerResult.isTie
                            ? "tie"
                            : "loser"
                        }`}
                      >
                        {!racePlayerResult.isWinner && !racePlayerResult.isTie
                          ? "WINNER"
                          : racePlayerResult.isTie
                          ? "TIE"
                          : "LOSER"}
                      </div>
                    </div>
                    <div className="result-stats">
                      <div className="stat">
                        <span className="stat-label">WPM</span>
                        <span className="stat-value">{raceOpponentResult.wpm}</span>
                      </div>
                      <div className="stat">
                        <span className="stat-label">Accuracy</span>
                        <span className="stat-value">{raceOpponentResult.acc}%</span>
                      </div>
                      <div className="stat">
                        <span className="stat-label">Raw</span>
                        <span className="stat-value">{raceOpponentResult.raw}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex flex-col items-center gap-3 mt-6">
                <button
                  type="button"
                  className="race-btn px-8 max-w-xs"
                  onClick={handleStartRacing}
                >
                  Race Again
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveView("solo");
                    init();
                  }}
                  className="text-sm text-[#8a8b8c] hover:text-[#e2e2e6] transition-colors mt-2"
                >
                  Back to Solo Practice
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ====================================================================
          LANGUAGE MODAL (Pop-up from Globe Click)
          ==================================================================== */}
      <div
        className={`modal-overlay ${isLangModalOpen ? "active" : ""}`}
        onClick={(e) => {
          if (e.target === e.currentTarget) setIsLangModalOpen(false);
        }}
      >
        <div className="lang-modal">
          <div className="modal-search">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Type to search..."
              value={langSearch}
              onChange={(e) => setLangSearch(e.target.value)}
              autoFocus
            />
          </div>
          <div className="lang-list">
            {languageData
              .filter((l) => l.name.toLowerCase().includes(langSearch.toLowerCase()))
              .map((l) => (
                <div
                  key={l.id}
                  className={`lang-item ${l.id === selectedLanguage ? "selected" : ""}`}
                  onClick={() => {
                    setSelectedLanguage(l.id);
                    setIsLangModalOpen(false);
                    init();
                  }}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>{l.name}</span>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
