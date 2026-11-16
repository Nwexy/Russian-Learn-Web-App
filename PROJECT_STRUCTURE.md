# Project Structure

This document provides a concise overview of the directory structure and core architectural components of the **Learn Russian Web App**.

---

## Directory Overview

```
Russian-Learn/Web App/
├── app/                  # Next.js App Router pages and layouts
├── components/           # UI components, layout elements, and icons
├── content/              # Static curriculum data (Units and Grammar JSONs)
├── lib/                  # Business logic, local database, SRS engine, and utilities
├── types/                # Central TypeScript interfaces and data models
└── public/               # Static assets, web manifest, and PWA icons
```

---

## 1. app/ (Routes & Pages)

Next.js App Router directory defining all application screens:

- `app/layout.tsx`: Root HTML layout with providers (theme, language context, PWA registration).
- `app/page.tsx`: Home dashboard displaying unit progression, today's SRS due card counter, and onboarding guide.
- `app/unit/[id]/`: Unit learning views:
  - `page.tsx`: Vocabulary cards and lesson introduction.
  - `practice/page.tsx`: Interactive unit-specific exercises.
  - `test/page.tsx`: Unit final assessment to unlock subsequent units.
- `app/review/page.tsx`: Spaced Repetition System (SRS) flashcard review interface.
- `app/practice/`: Free practice hub:
  - `page.tsx`: Multiple exercise modes (multiple choice, listening, speaking, sentence builder, mixed mode).
  - `mistakes/page.tsx`: Dedicated practice session for reviewing recorded mistakes.
- `app/grammar/`:
  - `page.tsx`: Index of all 14 grammar lessons and progress.
  - `[id]/page.tsx`: Detailed grammar lesson view with tables, rules, and mini-quizzes.
- `app/settings/page.tsx`: Theme toggles, language preferences, and database JSON backup/restore.
- `app/faq/page.tsx`: Collapsible accordion covering frequently asked questions.

---

## 2. content/ (Curriculum Data)

Static curriculum files formatted as structured JSON:

- `unit-01.json` - `unit-15.json`: Vocabulary lists, Cyrillic letters, numbers, translations, phrases, and audio-ready sentences.
- `content/grammar/`: 14 distinct grammar topics (`grammar-01.json` to `grammar-14.json`) containing bilingual explanations (`noteTr`, `noteEn`), examples, and interactive mini-quizzes.

---

## 3. lib/ (Core Logic & Storage)

Core business rules, client-side database management, and service integrations:

- `lib/db.ts`: Dexie.js (IndexedDB) database initialization and schema definitions (`items`, `reviews`, `progress`, `mistakes`, `grammarProgress`).
- `lib/srs.ts`: Spaced Repetition algorithm (SM-2 variant) determining card intervals, ease factors, and due dates.
- `lib/i18n.ts`: Central translation dictionary supporting English and Turkish UI strings.
- `lib/lang-context.tsx`: React context for real-time switching of UI language and translation language.
- `lib/exercises.ts`: Question generators and evaluation engines for all exercise modes.
- `lib/progress.ts`: Unit progression logic, unlock rules, mastery thresholds, and force-unlock overrides.
- `lib/mistakes.ts`: Error tracking service recording incorrect answers until successfully cleared.
- `lib/tts.ts`: Russian text-to-speech engine utilizing the Web Speech API.
- `lib/speech.ts`: Russian voice recognition handler for pronunciation practice.
- `lib/backup.ts`: Utilities for full database export and import via JSON.

---

## 4. components/ (UI & Widgets)

Reusable React components and layout elements:

- `components/navbar.tsx`: Top navigation bar with quick links, language switcher, and theme toggle.
- `components/footer.tsx`: Bottom layout footer with copyright and version info.
- `components/HomeGuide.tsx`: Swiper carousel onboarding guide for new learners.
- `components/SpeakButton.tsx`: Audio pronunciation button for words and sample sentences.
- `components/faq-onboarding.tsx`: Tooltip and banner directing first-time visitors to the FAQ.
- `components/ui/`: Primitive UI components built with Radix UI / shadcn patterns (Dialog, Accordion, AlertDialog).

---

## 5. types/ (TypeScript Definitions)

- `types/index.ts`: Unified type definitions for the entire application, including `Item`, `Unit`, `Review`, `Progress`, `GrammarNote`, `ExerciseMode`, and database models.

---

## 6. public/ (Static Assets)

- Web App Manifest (`manifest.json`) and service worker configuration for PWA installation.
- App icons, flags, and static graphical assets.

