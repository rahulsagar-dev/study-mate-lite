# 📚 StudyMate Lite

> Your AI-powered study companion — summarize, memorize, schedule, and focus.

---

## About

**StudyMate Lite** is a modern, full-stack study productivity app built with React and TypeScript. It combines AI-powered tools with proven study techniques to help students learn smarter — from auto-generating summaries and flashcards to building personalized schedules and staying focused with a built-in Pomodoro timer.

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| **🧠 Smart Summarizer** | Paste or upload text and get AI-generated summaries (brief, detailed, or bullet points) |
| **🃏 Interactive Flashcards** | Generate flashcard sets from any topic using AI, then review with a flip-card interface |
| **📅 Smart Scheduler** | Input your subjects, available hours, and difficulty — get a personalized weekly timetable |
| **⏱️ Pomodoro Timer** | Global 25/5/15 focus timer with skip controls, session tracking, and customizable durations |
| **✅ To-Do List** | Drag-and-drop task manager with priorities, due dates, and subject tags |
| **🔐 Authentication** | Email-based signup/login with protected routes |
| **👤 Profile & Stats** | Track study hours, focus sessions, and streaks |
| **🌗 Dark / Light Theme** | Toggle between themes with persistent preference |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18, TypeScript, Vite 5 |
| **Styling** | Tailwind CSS v3, shadcn/ui, Framer Motion |
| **State & Routing** | React Query, React Router v6 |
| **Backend** | Lovable Cloud (database, auth, edge functions, storage) |
| **AI** | Lovable AI Gateway (Gemini / GPT models) |

---

## 📸 Screenshots

> _Coming soon — add screenshots of the Summarizer, Flashcards, Scheduler, and Pomodoro pages here._

---

## 🚀 Getting Started

```bash
# 1. Clone the repository
git clone <YOUR_GIT_URL>

# 2. Navigate to the project
cd studymate-lite

# 3. Install dependencies
npm install

# 4. Start the dev server
npm run dev
```

The app will be available at `http://localhost:5173`.

---

## 📁 Project Structure

```
src/
├── pages/           # Route pages (Home, Summarizer, Flashcards, Scheduler, Profile, Auth)
├── components/      # UI components (TodoList, PomodoroWidget, Layout, shadcn/ui)
├── contexts/        # React contexts (Auth, Theme, Pomodoro)
├── hooks/           # Custom hooks (useTodos, useFlashcards, useSummaries, usePomodoro)
├── integrations/    # Backend client & types
├── index.css        # Design tokens & global styles

supabase/
├── functions/       # Edge functions (generate-summary, generate-flashcards, parse-document)
├── config.toml      # Backend configuration
```

---

## 📄 License

MIT — feel free to use, modify, and distribute.
