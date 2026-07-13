## Backend API

Base URL: `http://localhost:8080`

All responses are JSON unless noted otherwise.

### `GET /health`

Health check for the backend.

Response:

```json
{ "ok": true }
```

### `GET /auth/github/start`

Creates the GitHub OAuth authorization URL the frontend should redirect to.

Response:

```json
{
  "authorizationUrl": "https://github.com/login/oauth/authorize?...",
  "state": "random-csrf-state"
}
```

Notes:

- Returns `500` if `GITHUB_CLIENT_ID` is missing.
- The URL includes the configured GitHub client id, callback URL, `read:user user:email` scope, and a generated `state`.

### `GET /auth/github/callback`

OAuth callback endpoint used by GitHub after the user authorizes the app.

Query params:

- `code` required
- `state` optional, echoed through to the GitHub token exchange

Success response:

```json
{
  "user": {
    "id": "user_id",
    "githubId": "123456",
    "githubLogin": "octocat",
    "name": "Octo Cat",
    "avatarUrl": "https://...",
    "email": "octo@example.com",
    "createdAt": "2026-07-13T00:00:00.000Z",
    "updatedAt": "2026-07-13T00:00:00.000Z",
    "githubAccount": {
      "id": "account_id",
      "userId": "user_id",
      "provider": "github",
      "accessToken": "github_access_token",
      "scope": "read:user user:email",
      "tokenType": "bearer",
      "expiresAt": null,
      "createdAt": "2026-07-13T00:00:00.000Z",
      "updatedAt": "2026-07-13T00:00:00.000Z"
    }
  },
  "sessionToken": "jwt_session_token",
  "redirectUrl": "http://localhost:3000/?token=jwt_session_token"
}
```

Error responses:

- `400` if `code` is missing
- `400` if the GitHub token exchange fails
- `400` if the GitHub profile fetch fails
- `500` if GitHub OAuth is not configured

### `GET /me`

Returns the authenticated user profile.

Headers:

- `Authorization: Bearer <sessionToken>`

Success response:

```json
{
  "user": {
    "id": "user_id",
    "githubId": "123456",
    "githubLogin": "octocat",
    "name": "Octo Cat",
    "avatarUrl": "https://...",
    "email": "octo@example.com",
    "createdAt": "2026-07-13T00:00:00.000Z",
    "updatedAt": "2026-07-13T00:00:00.000Z",
    "githubAccount": {
      "id": "account_id",
      "userId": "user_id",
      "provider": "github",
      "accessToken": "github_access_token",
      "scope": "read:user user:email",
      "tokenType": "bearer",
      "expiresAt": null,
      "createdAt": "2026-07-13T00:00:00.000Z",
      "updatedAt": "2026-07-13T00:00:00.000Z"
    }
  }
}
```

Error responses:

- `401` if the token is missing or invalid
- `404` if the user no longer exists

## Environment

Required backend env vars:

- `PORT`
- `DATABASE_URL`
- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`
- `GITHUB_CALLBACK_URL`
- `FRONTEND_URL`
- `JWT_SECRET`

Local defaults are documented in `backend/.env.example`.
