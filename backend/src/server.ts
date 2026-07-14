import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import sharp from 'sharp';
import { config } from './config';
import { prisma } from './prisma';

const app = express();

app.use(cors({ origin: config.frontendUrl, credentials: true }));
app.use(express.json({ limit: '10mb' }));

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.post('/ascii', async (req, res) => {
  const imageDataUrl = String(req.body?.imageDataUrl ?? '');

  if (!imageDataUrl.startsWith('data:image/')) {
    res.status(400).json({ error: 'Missing imageDataUrl' });
    return;
  }

  const base64 = imageDataUrl.split(',')[1];

  if (!base64) {
    res.status(400).json({ error: 'Invalid image data' });
    return;
  }

  const buffer = Buffer.from(base64, 'base64');
  const width = 84;
  const ramp = ' .,:;irsXA253hMHGS#9B&@';

  const { data, info } = await sharp(buffer)
    .resize({ width, withoutEnlargement: true })
    .grayscale()
    .normalize()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const height = info.height;
  const lines: string[] = [];

  for (let y = 0; y < height; y++) {
    let row = '';
    for (let x = 0; x < info.width; x++) {
      const value = data[y * info.width + x];
      const char = ramp[Math.min(ramp.length - 1, Math.floor((value / 255) * (ramp.length - 1)))];
      row += char;
    }
    lines.push(row);
  }

  res.json({ ascii: lines.join('\n') });
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
    state,
    prompt: 'select_account'
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

  const redirectUrl = `${config.frontendUrl}/?token=${encodeURIComponent(sessionToken)}`;
  res.redirect(302, redirectUrl);
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

    const account = user.githubAccount;
    const accessToken = account?.accessToken;

    let github: Record<string, unknown> = {};

    if (accessToken) {
      const [profileResponse, reposResponse] = await Promise.all([
        fetch('https://api.github.com/user', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28'
          }
        }),
        fetch('https://api.github.com/user/repos?per_page=100&sort=updated', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28'
          }
        })
      ]);

      if (profileResponse.ok) {
        const githubProfile = await profileResponse.json() as {
          public_repos?: number;
          followers?: number;
          following?: number;
          public_gists?: number;
          company?: string | null;
          blog?: string | null;
          location?: string | null;
          created_at?: string;
          avatar_url?: string | null;
        };

        let repos: Array<{ language?: string | null }> = [];
        if (reposResponse.ok) {
          repos = await reposResponse.json() as Array<{ language?: string | null }>;
        }

        const languages = Array.from(
          new Set(repos.map((repo) => repo.language).filter((language): language is string => Boolean(language)))
        ).slice(0, 5);

        github = {
          publicRepos: githubProfile.public_repos ?? 0,
          followers: githubProfile.followers ?? 0,
          following: githubProfile.following ?? 0,
          publicGists: githubProfile.public_gists ?? 0,
          company: githubProfile.company ?? null,
          blog: githubProfile.blog ?? null,
          location: githubProfile.location ?? null,
          createdAt: githubProfile.created_at ?? null,
          avatarUrl: githubProfile.avatar_url ?? user.avatarUrl ?? null,
          languages
        };
      }
    }

    res.json({ user, github });
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
});

app.listen(config.port, () => {
  console.log(`Backend listening on http://localhost:${config.port}`);
});
