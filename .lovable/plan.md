# LocalBoost: plan

Your brief asks for code delivered one file at a time, to run with Gemini on Vercel. Here I can build and run the whole app for you directly. A few parts of the stack change. The goals stay the same: no login, no database, the API key stays secret, and all math happens in code.

## What you'll get

**1. The working app (one page, one polished flow)**
- Form: business type, products (name + cost per item + planned price), target customers, community, and output language (English / Arabic).
- **Pricing card:** margin %, profit per item, and break-even units, all calculated in code. Below it, an AI explanation and a suggested price range.
- **7-day content calendar:** day, platform, post idea, caption, hashtags.
- **Top 5 customer questions** with ready-to-use answers.
- **Copy all** and **Download (.txt / .md)** buttons.
- Arabic output shows right-to-left automatically.
- Sample buttons fill the form for a home bakery, a tutor or a small shop, so your demo is fast.
- Warm, community-market visual style (not generic AI purple).

**2. Hackathon pack** (downloadable files)
- 24-hour build plan with time estimates
- Folder structure and component list, with a one-line "why" for each design choice (for judges)
- JSON schema and the full AI system prompt
- How the API key stays safe, and how to publish
- Test plan with the 3 sample businesses
- Common errors and fixes
- Devpost write-up, 2–3 minute demo script, GitHub README, 5 screenshot captions, business model and go-to-market paragraph

## How it works

```text
Form -> calculate margin/break-even in code -> secure server function
     -> AI returns strict JSON (schema) -> results cards + copy/download
```

## Technical details
- Stack: React + TypeScript + Tailwind with TanStack Start, which is the stack Lovable uses. A server function plays the role of the Vercel serverless function, so the key never reaches the browser.
- AI: Lovable AI (built in, no Gemini key needed). It uses a strict JSON schema for structured output. If you need it, the pack includes how to swap in Gemini.
- Math lives in its own small module (`lib/pricing.ts`) and is fully commented. The AI receives the computed numbers and is told never to recalculate them.
- The system prompt forbids made-up statistics, guaranteed income claims and fake testimonials. It requires all output in the chosen language.
- Errors are shown clearly: running out of credits, rate limits, and bad input.
- No database, no login.
