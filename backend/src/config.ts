import dotenv from 'dotenv';

dotenv.config();

function parseFrontendOrigins() {
  const raw = process.env.FRONTEND_URLS ?? process.env.FRONTEND_URL ?? 'http://localhost:3000,https://github-profile-gukw.onrender.com,https://github-profile-gamma-orpin.vercel.app';
  return raw
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export const config = {
  port: Number(process.env.PORT ?? 3001),
  githubClientId: process.env.GITHUB_CLIENT_ID ?? '',
  githubClientSecret: process.env.GITHUB_CLIENT_SECRET ?? '',
  githubCallbackUrl: process.env.GITHUB_CALLBACK_URL ?? 'http://localhost:3001/auth/github/callback',
  frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:3000',
  frontendOrigins: parseFrontendOrigins(),
  jwtSecret: process.env.JWT_SECRET ?? 'dev-secret',
  databaseUrl: process.env.DATABASE_URL ?? ''
};
