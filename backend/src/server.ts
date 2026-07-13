import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { config } from './config';
import { prisma } from './prisma';

const app = express();

app.use(cors({ origin: config.frontendUrl, credentials: true }));
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.get('/auth/github/start', (_req, res) => {
  if (!config.githubClientId) {
    res.status(500).json({ error: 'GitHub client id is not configured' });
    return;
  }

  const state = crypto.randomBytes(16).toString('hex');
  const params = new URLSearchParams({
    client_id: config.githubClientId,
    redirect_uri: config.githubCallbackUrl,
    scope: 'read:user user:email',
    state
  });

  res.json({
    authorizationUrl: `https://github.com/login/oauth/authorize?${params.toString()}`,
    state
  });
});

app.get('/auth/github/callback', async (req, res) => {
  const code = String(req.query.code ?? '');
  const state = String(req.query.state ?? '');

  if (!code) {
    res.status(400).json({ error: 'Missing code' });
    return;
  }

  if (!config.githubClientId || !config.githubClientSecret) {
    res.status(500).json({ error: 'GitHub OAuth is not configured' });
    return;
  }

  const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      client_id: config.githubClientId,
      client_secret: config.githubClientSecret,
      code,
      redirect_uri: config.githubCallbackUrl,
      state
    })
  });

  const tokenData = await tokenResponse.json() as {
    access_token?: string;
    scope?: string;
    token_type?: string;
    error?: string;
  };

  if (!tokenResponse.ok || !tokenData.access_token) {
    res.status(400).json({ error: tokenData.error ?? 'Failed to exchange code' });
    return;
  }

  const profileResponse = await fetch('https://api.github.com/user', {
    headers: {
      Authorization: `Bearer ${tokenData.access_token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28'
    }
  });

  if (!profileResponse.ok) {
    res.status(400).json({ error: 'Failed to fetch GitHub profile' });
    return;
  }

  const profile = await profileResponse.json() as {
    id: number;
    login: string;
    name?: string | null;
    avatar_url?: string | null;
    email?: string | null;
  };

  const user = await prisma.user.upsert({
    where: { githubId: String(profile.id) },
    create: {
      githubId: String(profile.id),
      githubLogin: profile.login,
      name: profile.name ?? null,
      avatarUrl: profile.avatar_url ?? null,
      email: profile.email ?? null,
      githubAccount: {
        create: {
          accessToken: tokenData.access_token,
          scope: tokenData.scope ?? null,
          tokenType: tokenData.token_type ?? null
        }
      }
    },
    update: {
      githubLogin: profile.login,
      name: profile.name ?? null,
      avatarUrl: profile.avatar_url ?? null,
      email: profile.email ?? null,
      githubAccount: {
        upsert: {
          create: {
            accessToken: tokenData.access_token,
            scope: tokenData.scope ?? null,
            tokenType: tokenData.token_type ?? null
          },
          update: {
            accessToken: tokenData.access_token,
            scope: tokenData.scope ?? null,
            tokenType: tokenData.token_type ?? null
          }
        }
      }
    },
    include: {
      githubAccount: true
    }
  });

  const sessionToken = jwt.sign(
    { sub: user.id, githubId: user.githubId, login: user.githubLogin },
    config.jwtSecret,
    { expiresIn: '7d' }
  );

  res.json({
    user,
    sessionToken,
    redirectUrl: `${config.frontendUrl}/?token=${encodeURIComponent(sessionToken)}`
  });
});

app.get('/me', async (req, res) => {
  const authHeader = req.headers.authorization ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';

  if (!token) {
    res.status(401).json({ error: 'Missing token' });
    return;
  }

  try {
    const payload = jwt.verify(token, config.jwtSecret) as { sub: string };
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      include: { githubAccount: true }
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({ user });
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
});

app.listen(config.port, () => {
  console.log(`Backend listening on http://localhost:${config.port}`);
});
