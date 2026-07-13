# Memory

Current project:
GitHub Profile Card Generator

Completed

- Server Setup
- Github oAUth Setup
- Database setup

Important

- Always use Prisma
- Never use raw SQL
- Use zod validation
- Prefer GraphQL over REST when possible
- singleton patterns

GitHub login backend is implemented in `backend/` with Express, Prisma 7, GitHub OAuth callback handling, and JWT session issuance.

Frontend profile UI is implemented in `frontend/` as a Next.js 15 app with a connect gate, metadata editor, live preview, session log, and authenticated profile sync from the backend.
