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

> <img width="700" height="318" alt="Screenshot 2026-04-08 094403" src="https://github.com/user-attachments/assets/8b16386a-6a20-4424-a3ed-33d45cf5c629" />
<img width="700" height="318" alt="Screenshot 2026-04-08 094414" src="https://github.com/user-attachments/assets/10c9d2e4-5366-4216-a7c7-77ded9ecefc7" />
<img width="700" height="318" alt="Screenshot 2026-04-08 094428" src="https://github.com/user-attachments/assets/c479a3c8-6dcd-4418-a117-8e28f0c887c7" />
<img width="700" height="318" alt="Screenshot 2026-04-08 094436" src="https://github.com/user-attachments/assets/d60a4104-c18c-4b4c-a862-aaeb92f75ada" />
<img width="700" height="318" alt="Screenshot 2026-04-08 094448" src="https://github.com/user-attachments/assets/5ddf0276-10c4-41c0-9165-e85b3ae522d5" />
<img width="700" height="318" alt="Screenshot 2026-04-08 094519" src="https://github.com/user-attachments/assets/f89f8364-4826-4530-b349-8b8040e930be" />
<img width="700" height="318" alt="Screenshot 2026-04-08 094536" src="https://github.com/user-attachments/assets/a2cf1ece-3f5e-4364-88ab-0a08bb5c1562" />
<img width="700" height="318" alt="Screenshot 2026-04-08 094541" src="https://github.com/user-attachments/assets/8e5cb00e-b5f5-431f-a333-1157a7eca077" />

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
