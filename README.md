# MasteryFlow

MasteryFlow is a hackathon prototype for an Intelligent Educational Systems challenge. It is an adaptive learning platform that models student mastery and provides explainable, data-driven learning paths (inspired by Duolingo and ALEKS).

## Architecture

The application is built with a clear separation of concerns, avoiding monolithic components and decoupling the UI from the adaptive intelligence.

### Tech Stack
*   **Frontend**: React, TypeScript, Vite, Tailwind CSS
*   **Backend/Database/Auth**: Supabase (PostgreSQL)
*   **AI**: Gemini API (for content generation, *not* for adaptive decision making)

### Project Structure

```
/src
  /components    # Reusable UI components (buttons, cards, etc.)
  /pages         # Top-level route components
  /layouts       # Page layout structures
  /features      # Feature-based modules
    /adaptive    # The Core Adaptive Intelligence Engine
      /learnerModel       # Tracks student state and history
      /masteryEngine      # Deterministic updates to concept mastery
      /prerequisiteEngine # Evaluates dependencies for readiness
      /decisionEngine     # Selects the Next Best Action
      /explainability     # Translates decisions into human reasoning
      /spacedReview       # Manages memory retention scheduling
      /antiGaming         # Detects non-learning behaviors
  /hooks         # Shared React hooks
  /services      # External API integrations (Supabase, Gemini)
  /lib           # Utility libraries and configurations (e.g., Supabase client)
  /types         # Shared TypeScript interfaces and types
  /utils         # Helper functions
```

### The Adaptive Engine Principle
GenAI is used for content generation (explanations, hints), but the core intelligence (deciding what a student should learn next and updating their mastery score) is **deterministic** and **explainable**. It relies on the strongly-typed interfaces defined in `/src/types/adaptive.ts`.

## How to Run

1.  **Install Dependencies**: `npm install`
2.  **Environment Variables**: Copy `.env.example` to `.env` and fill in your Supabase and Gemini keys.
3.  **Start Development Server**: `npm run dev`
4.  **Build for Production**: `npm run build`

## Environment Variables Required

*   `VITE_SUPABASE_URL`: Your Supabase project URL.
*   `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous key.
*   `VITE_GEMINI_API_KEY`: Your Gemini API key for content generation.
