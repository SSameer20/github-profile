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

## Client-Side Issues

- Removed the broken share action from the connected toolbar and replaced it with a commit action.
- Reworked the preview layout toward the `media/profile-card.png` reference with a left ASCII panel and right-side dotted metadata rows.
- Added a backend `/publish/readme` route and wired the frontend commit button to publish the rendered README content for the connected GitHub user.

## Prompt Workflow

- Replaced the stale prompt rules with a spec map that includes `spec-4-profile-commit.md`.
- Removed the dead `spec-4-profile-commit.md` reference gap by aligning the prompt with the current feature files in `agent/features/`.

## Profile Commit

- Added a commit-message modal to the connected frontend so the user can enter an optional message or fall back to `Update README`.
- Kept the publish flow pointed at `POST /publish/readme` and taught the backend to use the supplied message when writing the README commit.
- Verified both frontend and backend production builds after the change.
- Fixed the GitHub-side `Not Found` failure by making the backend create the `{username}/{username}` repository when it does not exist before writing `README.md`.
- Added backend logs for repository lookup, repository creation, README lookup, and commit success/failure, plus frontend session-log traces for commit requests.
- Added an explicit repo-scope check so stale OAuth tokens fail with a reconnect message instead of a generic GitHub 404.
- Added a reconnect action in the connected UI so users can reauthorize with the new scope when the server logs show `read:user,user:email` only.
