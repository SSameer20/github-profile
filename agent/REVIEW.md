# Review

## GitHub Login

- Implemented the GitHub OAuth backend in `backend/src/server.ts`.
- Added Prisma models for `User` and `GitHubAccount`.
- Documented the live backend routes in `agent/docs/API.md`.
- Verified the backend builds successfully and the `/health` endpoint responds with `{"ok":true}`.

## Profile UI

- Added a Next.js frontend in `frontend/` with a connect-to-GitHub landing state.
- Built the two-panel metadata editor and live terminal-style preview requested by `spec-2-profile-ui.md`.
- Wired the connected session to the backend `/me` endpoint so the editor seeds itself from authenticated GitHub data.
- Verified the frontend production build completes successfully on Next.js 15 / React 18.

## Agent Prompt

- Updated `agent/PROMPT.md` so the workflow explicitly routes frontend/post-login work to `spec-3-client-side-issues.md`.
- Clarified which spec to use for OAuth backend work and split-pane profile UI work.
