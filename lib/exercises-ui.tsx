/**
 * Alıştırma ve test ekranları için UI yardımcı fonksiyonları.
 *
 * Faz 4.6: Telaffuz sızıntısını engelleme mantığı.
 * - Soru henüz cevaplanmadıysa telaffuz GÖSTERİLMEZ.
 * - Kullanıcı cevap verdikten sonra (doğru veya yanlış fark etmez) telaffuz gösterilir.
 */

/** Alıştırma durumunu temsil eden arayüz */
export interface ExerciseUiState {
  revealed?: boolean;
  isAnswered?: boolean;
  answered?: boolean;
}

/**
 * Alıştırma veya test sırasında telaffuzun gösterilip gösterilmeyeceğini belirler.
 *
 * @param state - boolean veya { revealed?: boolean, isAnswered?: boolean, answered?: boolean }
 * @returns Cevap verilmişse true, henüz cevaplanmadıysa false
 */
export function shouldShowPronunciation(
  state: ExerciseUiState | boolean | undefined | null
): boolean {
  if (state === null || state === undefined) return false;
  if (typeof state === "boolean") return state;
  if (state.revealed !== undefined) return Boolean(state.revealed);
  if (state.isAnswered !== undefined) return Boolean(state.isAnswered);
  if (state.answered !== undefined) return Boolean(state.answered);
  return false;
}

import React from "react";

export type HighlightStatus = boolean | "correct" | "wrong" | "neutral";

/**
 * "{kelime}" kalıplarını duruma göre renklendirir:
 * - neutral / false: Normal metin rengi (text-muted-foreground / cümlenin kalanıyla uyumlu)
 * - correct / true: Yeşil renk (text-emerald-500 font-bold underline)
 * - wrong: Kırmızı renk (text-rose-500 font-bold underline)
 *
 * Örn: "store opens at {nine}"
 */
export function renderHighlightedText(
  text?: string | null,
  status: HighlightStatus = true
): React.ReactNode {
  if (!text) return null;
  const parts = text.split(/(\{.*?\})/g);
  return parts.map((part, i) => {
    if (part.startsWith("{") && part.endsWith("}")) {
      if (status === "wrong") {
        return (
          <span
            key={i}
            className="text-rose-500 dark:text-rose-400 font-bold underline decoration-2 underline-offset-4"
          >
            {part}
          </span>
        );
      }
      if (status === true || status === "correct") {
        return (
          <span
            key={i}
            className="text-emerald-500 dark:text-emerald-400 font-bold underline decoration-2 underline-offset-4"
          >
            {part}
          </span>
        );
      }
      // Nötr durum (cevap verilmeden önce): gri/muted metin rengi
      return (
        <span key={i} className="text-muted-foreground font-semibold">
          {part}
        </span>
      );
    }
    return <React.Fragment key={i}>{part}</React.Fragment>;
  });
}

/**
 * Faz 12.5: Çoktan seçmeli (sentenceBlank) ipucunu kullanıcı cevap durumuna göre render eder:
 * - Henüz cevap verilmediyse (!isAnswered): nötr (gri/muted)
 * - Cevap verildi ve doğruysa (isAnswered && isCorrect): yeşil
 * - Cevap verildi ve yanlışsa (isAnswered && !isCorrect): kırmızı
 */
export function renderMcHint(
  hint?: string | null,
  isAnswered: boolean = false,
  isCorrect?: boolean | null
): React.ReactNode {
  if (!hint) return null;
  if (!isAnswered) {
    return renderHighlightedText(hint, "neutral");
  }
  return renderHighlightedText(hint, isCorrect ? "correct" : "wrong");
}

/**
 * Faz 12.1: Boşluk doldurma cümlesindeki (sentenceWithBlank) "___" alanını:
 * - Henüz cevap verilmemişse (isSubmitted === false): "___" olarak bırakır.
 * - Cevap verilmişse ve DOĞRU ise: doğru kelimeyi yeşil renkte (text-emerald-500 font-bold underline) gösterir.
 * - Cevap verilmişse ve YANLIŞ ise: kullanıcının yanlış cevabını kırmızı üstü çizili (text-rose-500 line-through),
 *   hemen ardından doğru kelimeyi yeşil renkte (text-emerald-500 font-bold underline) gösterir.
 */
export function renderSentenceWithBlank(
  sentence: string,
  isSubmitted: boolean,
  isCorrect: boolean | null,
  correctWord: string,
  userAnswer?: string
): React.ReactNode {
  if (!sentence) return null;

  // Boşluk karakterlerini bul (___ veya daha fazla alt çizgi)
  const regex = /_{2,}/;
  const match = regex.exec(sentence);

  if (!match) {
    return sentence;
  }

  const before = sentence.slice(0, match.index);
  const after = sentence.slice(match.index + match[0].length);

  if (!isSubmitted) {
    return (
      <>
        {before}
        <span className="font-semibold underline underline-offset-4 decoration-muted-foreground/60">
          ___
        </span>
        {after}
      </>
    );
  }

  // Submitted: Doğru cevap
  if (isCorrect) {
    return (
      <>
        {before}
        <span className="text-emerald-500 font-bold underline decoration-2 underline-offset-4">
          {correctWord}
        </span>
        {after}
      </>
    );
  }

  // Submitted: Yanlış cevap
  const trimmedUser = (userAnswer || "").trim();

  return (
    <>
      {before}
      <span className="inline-flex items-baseline gap-1.5">
        {trimmedUser && (
          <span className="text-rose-500 line-through font-semibold decoration-2">
            {trimmedUser}
          </span>
        )}
        <span className="text-emerald-500 font-bold underline decoration-2 underline-offset-4">
          {correctWord}
        </span>
      </span>
      {after}
    </>
  );
}


