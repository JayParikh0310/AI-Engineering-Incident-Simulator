# Tech Stack

# Frontend

I recommend:

```
React
+
TypeScript
+
Vite
```

### Why Not Next.js?

A lot of people automatically choose Next.js.

For this project:

```
Dashboard
Editor
Reports
Authentication
```

There is:

```
No SEO
No SSR requirement
```

So Next.js adds complexity with almost no benefit.

---

## Frontend Stack

```
React
TypeScript
Vite
React Router
Axios
```

---

## Editor

Absolutely:

[Monaco Editor](https://microsoft.github.io/monaco-editor/?utm_source=chatgpt.com)

Same editor VS Code uses.

This is non-negotiable for me.

---

## Styling

I'd choose:

[Tailwind CSS](https://tailwindcss.com/?utm_source=chatgpt.com)

Reason:

```
Fast
Modern
Good portfolio appearance
```

---

## Charts

For mastery dashboard:

[Recharts](https://recharts.org/?utm_source=chatgpt.com)

Simple.

---

# Backend

This part I'm more opinionated about.

---

## Framework

```
FastAPI
```

Obvious choice.

---

## ORM

I recommend:

[SQLAlchemy 2.0](https://www.sqlalchemy.org/?utm_source=chatgpt.com)

NOT SQLModel.

---

### Why?

SQLModel looks simpler.

But:

```
Smaller ecosystem

Less examples

Less mature
```

For a serious project:

```
SQLAlchemy
```

wins.

---

## Migrations

Use:

[Alembic](https://alembic.sqlalchemy.org/?utm_source=chatgpt.com)

Day 1.

Don't postpone it.

---

## Validation

```
Pydantic V2
```

Already part of FastAPI ecosystem.

---

# Database

```
PostgreSQL
```

Dockerized.

Already decided.

---

# Authentication

```
JWT Access Tokens
```

No refresh tokens in V1.

Keep it simple.

---

Libraries:

```
python-jose

passlib

bcrypt
```

---

# AI Layer

This is where I disagree with many tutorials.

---

## Do NOT Directly Couple To OpenAI

Bad:

```
OpenAI(...)
```

everywhere.

---

Create:

```
llm_provider.py
```

Example:

```
classLLMProvider:
asyncdefevaluate():
        ...
```

Then swap providers later.

---

# LLM Choice

For V1:

I would use:

[OpenRouter](https://openrouter.ai/?utm_source=chatgpt.com)

Why?

Single API.

Access to:

```
Gemini

DeepSeek

Qwen

OpenAI

Claude
```

through one interface.

Future-proof.

---

## My V1 Recommendation

Start with:

Google Gemini models through OpenRouter.

Primary:

Qwen3 32B

Fallback:

DeepSeek

Temperature:

0.1

---

# Local Models?

Not initially.

People underestimate the headache.

```
VRAM

Latency

Deployment complexity
```

Not worth it.

---

# Evaluation Output Validation

Very important.

Use:

```
Pydantic Schema
```

to validate LLM output.

Never trust raw JSON.

---

# Docker

Day 1:

```
Frontend Container

Backend Container

Postgres Container
```

using Docker Compose.

---

Future:

```
Sandbox Container
```

added separately.

---

# Testing

I strongly recommend:

```
Pytest
```

even in V1.

At least for:

```
Skill Updates

Incident Loading

Report Generation
```

---

# Deployment

For V1:

Frontend:

[Vercel](https://vercel.com/?utm_source=chatgpt.com)

Backend:

[Render](https://render.com/?utm_source=chatgpt.com)

Database:

[Neon Postgres](https://neon.tech/?utm_source=chatgpt.com)