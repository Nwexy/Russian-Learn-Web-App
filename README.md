# 🇷🇺 Learn Russian App
### 🌍 [Live Demo](https://learnrussia.netlify.app)

A modern, offline-first web application designed for learning Russian from A1 to A2 level. All your learning data, vocabulary history, and progress stay directly in your browser without requiring an external server or internet connection.

---

## Overview

Learn Russian App provides a structured curriculum for English and Turkish speakers learning Russian. It combines modern web technologies with proven language acquisition principles, such as spaced repetition for retention and interactive grammar drills with instant feedback. Built with Next.js 15, Tailwind CSS, and IndexedDB (Dexie).

---

## Features

- **A1 Curriculum:** Step-by-step units covering the Cyrillic alphabet, numbers, greetings, house & furniture, city & directions, clothes, body parts, colors, family, basic verbs, and adjectives.
- **Grammar Notes with Mini Exercises:** 14 structured grammar lessons with explanations, tables, real-world examples, and dynamically randomized mini-quizzes (both questions and options are randomized on every attempt).
- **Spaced Repetition System (SRS):** SM-2 inspired memory algorithm that schedules cards for review based on difficulty ratings (Again, Hard, Good, Easy).
- **Text-to-Speech (TTS):** Native Web Speech API integration with Russian voice synthesis for accurate pronunciation listening.
- **Built-in Mistake Tracker:** Automatically records wrong answers during practice and offers a dedicated review session to master mistakes until cleared.
- **Linear Progression & Unit Lock:** Logical progression path where subsequent units unlock after mastering the prerequisites.
- **Bilingual UI:** Instant switching between English and Turkish interface and translation modes.
- **Data Backup & Restore:** Full JSON export and import capabilities to backup or transfer your progress across devices safely.
- **Dark & Light Mode:** Tailored modern themes with high-contrast readability.

---

## Tech Stack

- **Framework:** Next.js 15 (App Router with Turbopack)
- **Language:** TypeScript 5
- **Styling:** Vanilla CSS + Tailwind CSS (shadcn/ui design tokens)
- **Local Database:** Dexie.js 4 (IndexedDB wrapper)
- **Speech Synthesis:** Web Speech API
- **PWA:** Web App Manifest & Service Worker

---

## Getting Started (Local Development)

### Prerequisites

- Node.js 18.17 or higher
- npm (bundled with Node.js)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Nwexy/Russian-Learn-Web-App.git
cd Russian-Learn-Web-App
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

### One-Click Launch (Windows)

Double-click `start.bat` in the root directory. It automatically installs dependencies if missing, starts the development server, and launches your default browser.

### One-Click Launch (macOS / Linux)

```bash
chmod +x start.sh
./start.sh
```

---

## PWA Support

This app can be installed on your mobile device or desktop as a Progressive Web App (PWA).

- **Mobile (iOS / Android):** Open the web application in Safari or Chrome, tap the Share or Browser Menu button, and select **Add to Home Screen**.
- **Desktop (Chrome / Edge):** Click the install icon in the address bar to run the app in an independent, app-like standalone window.
- **Offline Capability:** Once installed, cached pages and local IndexedDB database allow full offline study without requiring an active internet connection.

---

## Project Structure

```text
app/                     # Next.js App Router pages and layouts
├── layout.tsx           # Root layout with PWA meta tags & theme provider
├── page.tsx             # Home dashboard with units and SRS status
├── grammar/             # Grammar directory & dynamic lesson detail pages
├── practice/            # Multi-mode practice exercises & mistake tracker
├── review/              # SRS flashcard review session
└── settings/            # App preferences, theme, i18n, and data backup
components/              # Reusable UI components and widgets
content/                 # Static JSON curriculum modules and grammar notes
lib/                     # Core logic (db.ts, srs.ts, backup.ts, i18n.ts)
public/                  # Static assets, PWA manifest.json, sw.js, and icons
types/                   # Shared TypeScript interface and type definitions
```

---

## License

This project was created by Nwexy. All rights reserved.