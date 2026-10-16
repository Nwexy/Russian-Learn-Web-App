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
