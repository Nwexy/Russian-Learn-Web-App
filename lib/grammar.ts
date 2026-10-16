/**
 * Gramer içerik yönetimi modülü — lib/grammar.ts
 * content/grammar/ altındaki JSON dosyalarını statik içe aktarma ile yükler.
 * İstemci ve sunucu taraflarında sorunsuz çalışır.
 */

import type { GrammarNote } from "@/types";

import grammar01Gender from "@/content/grammar/grammar-01-gender.json";
import grammar02Pronouns from "@/content/grammar/grammar-02-pronouns.json";
import grammar03ToBe from "@/content/grammar/grammar-03-to-be.json";
import grammar04PresentTense from "@/content/grammar/grammar-04-present-tense.json";

/** Tüm gramer notları listesi */
const GRAMMAR_NOTES: GrammarNote[] = [
  grammar01Gender as GrammarNote,
  grammar02Pronouns as GrammarNote,
  grammar03ToBe as GrammarNote,
  grammar04PresentTense as GrammarNote,
];

/**
 * content/grammar/ içindeki tüm gramer notlarını döner.
 */
export function loadGrammarNotes(): GrammarNote[] {
  return GRAMMAR_NOTES;
}

/**
 * Belirtilen id'ye sahip tek bir gramer notunu döner.
 */
export function getGrammarNote(id: string): GrammarNote | undefined {
  return GRAMMAR_NOTES.find((note) => note.id === id);
}

/**
 * relatedUnits dizisi içinde unitId bulunan tüm gramer notlarını döner.
 */
export function getGrammarByUnit(unitId: string): GrammarNote[] {
  return GRAMMAR_NOTES.filter((note) =>
    note.relatedUnits && note.relatedUnits.includes(unitId)
  );
}
