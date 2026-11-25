"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { RotateCcw, ArrowLeft, Clock, Zap, Target } from "lucide-react";
import type { Item, Lang } from "@/types";
import { getMessages } from "@/lib/i18n";

const RUSSIAN_VOCABULARY_POOL = [
  "дом", "стол", "книга", "мама", "папа", "окно", "собака", "кот", "работа", "школа",
  "время", "человек", "день", "ночь", "город", "вода", "чай", "кофе", "хлеб", "сыр",
  "друг", "сестра", "брат", "язык", "слово", "мир", "жизнь", "рука", "голова", "глаз",
  "место", "часть", "неделя", "месяц", "год", "дело", "вопрос", "ответ", "улица", "машина",
  "поезд", "дорога", "парк", "кино", "театр", "музыка", "песня", "фильм", "письмо", "телефон",
  "компьютер", "утро", "вечер", "сегодня", "завтра", "вчера", "здесь", "там", "хорошо", "плохо",
  "быстро", "медленно", "много", "мало", "новый", "старый", "большой", "маленький", "красивый", "добрый",
  "умный", "белый", "черный", "красный", "синий", "зеленый", "желтый", "первый", "второй", "третий",
  "читать", "писать", "говорить", "смотреть", "слушать", "знать", "думать", "жить", "работать", "учить",
  "любить", "видеть", "делать", "идти", "ехать", "пить", "есть", "спать", "купить", "открыть",
  "закрыть", "ждать", "помнить", "спросить", "ответить", "играть", "гулять", "понимать", "помогать", "солнце",
  "небо", "море", "река", "лес", "зима", "весна", "лето", "осень", "погода", "дождь",
  "снег", "ветер", "тепло", "холодно", "правда", "друг", "правда", "песня", "урок", "ручка"
];

interface SpeedTypeTestProps {
  items?: Item[];
  uiLang: Lang;
  onExit: () => void;
}

export function SpeedTypeTest({ items = [], uiLang, onExit }: SpeedTypeTestProps) {
  const t = getMessages(uiLang);

  const [duration, setDuration] = useState<15 | 30 | 60>(30);
  const [timeLeft, setTimeLeft] = useState<number>(30);
  const [isActive, setIsActive] = useState<boolean>(false);
  const [isFinished, setIsFinished] = useState<boolean>(false);

  const [words, setWords] = useState<string[]>([]);
  const [currentWordIdx, setCurrentWordIdx] = useState<number>(0);
  const [currentInput, setCurrentInput] = useState<string>("");
  const [wordHistories, setWordHistories] = useState<Array<{ input: string; isCorrect: boolean }>>([]);

  const [totalKeyStrokes, setTotalKeyStrokes] = useState<number>(0);
  const [correctKeyStrokes, setCorrectKeyStrokes] = useState<number>(0);
  const [startTime, setStartTime] = useState<number | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const wordContainerRef = useRef<HTMLDivElement>(null);
  const activeWordRef = useRef<HTMLSpanElement>(null);

  // Kelime listesi üret
  const generateWordsList = useCallback(() => {
    const itemWords = items
      .filter((i) => i.ru && typeof i.ru === "string")
      .map((i) => i.ru.trim().toLowerCase())
      .filter((w) => /^[а-яё]+$/i.test(w) && w.length >= 2 && w.length <= 12);

    const sourcePool = itemWords.length >= 20 ? itemWords : RUSSIAN_VOCABULARY_POOL;
    const shuffled: string[] = [];
    while (shuffled.length < 120) {
      const copy = [...sourcePool].sort(() => 0.5 - Math.random());
      shuffled.push(...copy);
    }
    return shuffled.slice(0, 120);
  }, [items]);

  // Testi sıfırla
  const resetTest = useCallback(
    (newDuration?: 15 | 30 | 60) => {
      const dur = newDuration ?? duration;
      setDuration(dur);
      setTimeLeft(dur);
      setIsActive(false);
      setIsFinished(false);
      setCurrentWordIdx(0);
      setCurrentInput("");
      setWordHistories([]);
      setTotalKeyStrokes(0);
      setCorrectKeyStrokes(0);
      setStartTime(null);
      setWords(generateWordsList());

      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    },
    [duration, generateWordsList]
  );

  // İlk yüklemede kelimeleri oluştur
  useEffect(() => {
    resetTest();
  }, [resetTest]);

  // Sayacı yönet
  useEffect(() => {
    if (!isActive || isFinished) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsActive(false);
          setIsFinished(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isActive, isFinished]);

  // Aktif kelime değiştikçe görünür alanda tut (auto-scroll)
  useEffect(() => {
    if (activeWordRef.current && wordContainerRef.current) {
      const container = wordContainerRef.current;
      const activeEl = activeWordRef.current;
      const containerTop = container.offsetTop;
      const elementTop = activeEl.offsetTop;
      const relativeTop = elementTop - containerTop;

      if (relativeTop > 70) {
        container.scrollTo({
          top: relativeTop - 35,
          behavior: "smooth",
        });
      } else if (container.scrollTop > 0 && relativeTop <= 35) {
        container.scrollTo({
          top: 0,
          behavior: "smooth",
        });
      }
    }
  }, [currentWordIdx]);

  // Tuş dinleyicisi
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (isFinished) return;

    // Yazmaya başlandığı an süre başlasın
    if (!isActive && !isFinished && e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      setIsActive(true);
      setStartTime(Date.now());
    }

    const currentTargetWord = words[currentWordIdx] || "";

    // 1. Boşluk (Space) ile bir sonraki kelimeye geçiş
    if (e.key === " ") {
      e.preventDefault();
      if (currentInput.trim().length === 0) return;

      const isWordCorrect = currentInput.trim() === currentTargetWord;
      setWordHistories((prev) => [
        ...prev,
        { input: currentInput.trim(), isCorrect: isWordCorrect },
      ]);

      // Boşluk basımı da toplam tuş vuruşuna dahil
      setTotalKeyStrokes((prev) => prev + 1);
      if (isWordCorrect) {
        setCorrectKeyStrokes((prev) => prev + 1); // bonus doğru space
      }

      setCurrentWordIdx((prev) => prev + 1);
      setCurrentInput("");
      return;
    }

    // 2. Backspace ile harf silme
    if (e.key === "Backspace") {
      if (currentInput.length > 0) {
        setCurrentInput((prev) => prev.slice(0, -1));
      }
      return;
    }

    // 3. Normal karakter girişi
    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      const nextChar = e.key.toLowerCase();
      const charIndex = currentInput.length;

      setTotalKeyStrokes((prev) => prev + 1);

      if (charIndex < currentTargetWord.length) {
        if (nextChar === currentTargetWord[charIndex].toLowerCase()) {
          setCorrectKeyStrokes((prev) => prev + 1);
        }
      }

      setCurrentInput((prev) => prev + nextChar);
    }
  };

  // İstatistik hesaplamaları
  const elapsedSec = duration - timeLeft;
  const elapsedMin = Math.max(elapsedSec / 60, 0.05);
  const currentWpm = Math.max(0, Math.round(correctKeyStrokes / 5 / elapsedMin));
  const currentAccuracy =
    totalKeyStrokes > 0 ? Math.min(100, Math.round((correctKeyStrokes / totalKeyStrokes) * 100)) : 100;

  return (
    <div className="w-full max-w-4xl mx-auto py-6 px-4 flex flex-col items-center select-none font-mono">
      {/* Üst Navigasyon ve Kontroller */}
      <div className="w-full flex items-center justify-between mb-8 pb-4 border-b border-border/50">
        <button
          type="button"
          onClick={onExit}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          <ArrowLeft size={16} />
          <span>{t.backToHome}</span>
        </button>

        {/* Süre Seçenekleri */}
        {!isFinished && (
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-card border border-border">
            <Clock size={15} className="text-muted-foreground ml-2 mr-1" />
            {([15, 30, 60] as const).map((sec) => (
              <button
                key={sec}
                type="button"
                onClick={() => resetTest(sec)}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  duration === sec
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                {sec}s
              </button>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={() => resetTest()}
          title={t.restartTest}
          className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary border border-border/40 transition-colors cursor-pointer"
        >
          <RotateCcw size={16} />
        </button>
      </div>

      {/* SONUÇ EKRANI (Test bittiğinde) */}
      {isFinished ? (
        <div className="w-full max-w-2xl bg-card border border-border rounded-3xl p-8 sm:p-10 shadow-2xl text-center space-y-8 animate-in fade-in zoom-in-95 duration-200">
          <div className="space-y-2">
            <span className="text-xs font-extrabold uppercase tracking-widest text-primary">
              MonkeyType Speed Test
            </span>
            <h2 className="text-3xl font-black text-foreground tracking-tight">
              {uiLang === "tr" ? "Test Tamamlandı" : "Test Completed"}
            </h2>
          </div>

          {/* Büyük İstatistik Kartları */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-secondary/50 border border-border flex flex-col items-center justify-center">
              <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-1.5 mb-1">
                <Zap size={14} className="text-primary" />
                {t.wpm}
              </span>
              <span className="text-4xl sm:text-5xl font-black text-primary">
                {currentWpm}
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-secondary/50 border border-border flex flex-col items-center justify-center">
              <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-1.5 mb-1">
                <Target size={14} className="text-emerald-500" />
                {t.accuracy}
              </span>
              <span className="text-4xl sm:text-5xl font-black text-emerald-500">
                %{currentAccuracy}
              </span>
            </div>

            <div className="col-span-2 sm:col-span-1 p-5 rounded-2xl bg-secondary/50 border border-border flex flex-col items-center justify-center">
              <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-1.5 mb-1">
                <Clock size={14} className="text-amber-500" />
                {uiLang === "tr" ? "Süre" : "Time"}
              </span>
              <span className="text-4xl sm:text-5xl font-black text-foreground">
                {duration}s
              </span>
            </div>
          </div>

          {/* Detay Bilgileri */}
          <div className="flex items-center justify-around py-3 px-6 rounded-xl bg-background/50 border border-border/60 text-xs text-muted-foreground">
            <div>
              <span className="font-semibold text-foreground mr-1.5">
                {correctKeyStrokes}
              </span>
              doğru harf
            </div>
            <div>•</div>
            <div>
              <span className="font-semibold text-foreground mr-1.5">
                {Math.max(0, totalKeyStrokes - correctKeyStrokes)}
              </span>
              yanlış harf
            </div>
            <div>•</div>
            <div>
              <span className="font-semibold text-foreground mr-1.5">
                {wordHistories.filter((w) => w.isCorrect).length}/{wordHistories.length}
              </span>
              tam kelime
            </div>
          </div>

          {/* Butonlar */}
          <div className="flex items-center justify-center gap-4 pt-2">
            <button
              type="button"
              onClick={() => resetTest()}
              className="px-8 py-3.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-base shadow-lg transition-all cursor-pointer flex items-center gap-2"
            >
              <RotateCcw size={18} />
              <span>{t.restartTest}</span>
            </button>
            <button
              type="button"
              onClick={onExit}
              className="px-6 py-3.5 rounded-xl border border-border text-foreground hover:bg-secondary font-semibold text-base transition-colors cursor-pointer"
            >
              <span>{t.backToHome}</span>
            </button>
          </div>
        </div>
      ) : (
        /* AKTİF YAZMA ALANI */
        <div
          onClick={() => inputRef.current?.focus()}
          className="w-full flex flex-col items-center cursor-text"
        >
          {/* Canlı Sayaç ve İstatistik Şeridi */}
          <div className="w-full flex items-center justify-between mb-6 px-2 text-xl font-bold">
            <div className="flex items-center gap-2 text-primary font-black text-3xl">
              <span>{timeLeft}</span>
              <span className="text-xs uppercase text-muted-foreground font-semibold">
                {t.timeLeft}
              </span>
            </div>

            <div className="flex items-center gap-6 text-sm text-muted-foreground font-semibold">
              <div>
                WPM: <span className="text-foreground font-bold text-base">{currentWpm}</span>
              </div>
              <div>
                ACC: <span className="text-foreground font-bold text-base">%{currentAccuracy}</span>
              </div>
            </div>
          </div>

          {/* Gizli Odaklanma Inputu */}
          <input
            ref={inputRef}
            type="text"
            value={currentInput}
            onChange={() => {}}
            onKeyDown={handleKeyDown}
            autoFocus
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
            className="absolute opacity-0 pointer-events-none w-0 h-0"
            aria-label="SpeedType input"
          />

          {/* Kelimeler Izgarası / Akış Kutusu */}
          <div
            ref={wordContainerRef}
            className="w-full min-h-[160px] max-h-[190px] overflow-hidden rounded-2xl p-6 bg-card/60 border border-border/70 backdrop-blur-sm shadow-inner flex flex-wrap gap-x-3.5 gap-y-3 text-2xl sm:text-3xl leading-relaxed tracking-wider transition-all"
          >
            {words.map((word, wIdx) => {
              const isPast = wIdx < currentWordIdx;
              const isCurrent = wIdx === currentWordIdx;
              const history = wordHistories[wIdx];

              if (isPast) {
                return (
                  <span
                    key={wIdx}
                    className={`transition-colors ${
                      history?.isCorrect
                        ? "text-muted-foreground/60"
                        : "text-rose-500 underline decoration-rose-500/60 decoration-2"
                    }`}
                  >
                    {word}
                  </span>
                );
              }

              if (isCurrent) {
                const targetLetters = word.split("");
                const typedLetters = currentInput.split("");

                return (
                  <span
                    key={wIdx}
                    ref={activeWordRef}
                    className="relative font-bold text-foreground inline-flex items-center"
                  >
                    {targetLetters.map((char, cIdx) => {
                      let colorClass = "text-muted-foreground/40";
                      if (cIdx < typedLetters.length) {
                        colorClass =
                          typedLetters[cIdx] === char
                            ? "text-primary dark:text-emerald-400 font-extrabold"
                            : "text-rose-500 bg-rose-500/15 rounded-sm";
                      }

                      return (
                        <span key={cIdx} className={`relative ${colorClass}`}>
                          {cIdx === typedLetters.length && (
                            <span className="absolute left-0 -top-1 bottom-0 w-[2.5px] bg-primary animate-pulse" />
                          )}
                          {char}
                        </span>
                      );
                    })}

                    {/* Hedef kelimeden fazla yazılan harfler */}
                    {typedLetters.length > targetLetters.length &&
                      typedLetters.slice(targetLetters.length).map((extraChar, eIdx) => (
                        <span
                          key={targetLetters.length + eIdx}
                          className="text-rose-400 bg-rose-500/20 rounded-sm"
                        >
                          {extraChar}
                        </span>
                      ))}

                    {typedLetters.length >= targetLetters.length && (
                      <span className="inline-block w-[2.5px] h-6 bg-primary animate-pulse ml-0.5" />
                    )}
                  </span>
                );
              }

              // Gelecek kelimeler
              return (
                <span key={wIdx} className="text-muted-foreground/35">
                  {word}
                </span>
              );
            })}
          </div>

          {/* Alt İpucu */}
          <div className="w-full flex items-center justify-between text-xs text-muted-foreground/70 mt-4 px-2">
            <span>{t.typingTestInstruction}</span>
            <span>Space: sonraki kelime • Backspace: sil</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default SpeedTypeTest;
