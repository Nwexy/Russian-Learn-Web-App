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
import grammar05Plural from "@/content/grammar/grammar-05-plural.json";
import grammar06Adjectives from "@/content/grammar/grammar-06-adjectives.json";
import grammar07Accusative from "@/content/grammar/grammar-07-accusative.json";
import grammar08Past from "@/content/grammar/grammar-08-past.json";
import grammar09Prepositional from "@/content/grammar/grammar-09-prepositional.json";
import grammar10Future from "@/content/grammar/grammar-10-future.json";

/** Tüm gramer notları listesi */
const GRAMMAR_NOTES: GrammarNote[] = [
  grammar01Gender as GrammarNote,
  grammar02Pronouns as GrammarNote,
  grammar03ToBe as GrammarNote,
  grammar04PresentTense as GrammarNote,
  grammar05Plural as GrammarNote,
  grammar06Adjectives as GrammarNote,
  grammar07Accusative as GrammarNote,
  grammar08Past as GrammarNote,
  grammar09Prepositional as GrammarNote,
  grammar10Future as GrammarNote,
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
 * Hem "unit-03" hem de "unit-03-colors" gibi formatları eşleştirir.
 */
export function getGrammarByUnit(unitId: string): GrammarNote[] {
  return GRAMMAR_NOTES.filter((note) =>
    note.relatedUnits &&
    note.relatedUnits.some(
      (u) => u === unitId || unitId.startsWith(u) || u.startsWith(unitId)
    )
  );
}
