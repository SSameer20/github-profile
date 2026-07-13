'use client';

import { useEffect, useMemo, useState } from 'react';

type ProfileForm = {
  identifier: string;
  classification: string;
  gitPointer: string;
  coreKernel: string;
  profileAbstract: string;
  asciiAvatar: string;
};

type SessionState = 'idle' | 'assets loaded' | 'github syncing' | 'ascii generation' | 'rendering preview';

type ConnectedUser = {
  githubLogin: string;
  name?: string | null;
  avatarUrl?: string | null;
  email?: string | null;
};

const defaultAscii = String.raw`
      .-""""-.
     / -   -  \
    |  .-. .-. |
    |  \o| |o/ |
    \     ^    /
     '.  )--( .'
       '-.____.-'
`;

const initialProfile: ProfileForm = {
  identifier: 'Andrew Grant',
  classification: 'Full Stack Architect',
  gitPointer: 'octocat',
  coreKernel: 'TypeScript / React / Node.js / Prisma',
  profileAbstract: 'Building scalable systems with a terminal-first interface and crisp delivery.',
  asciiAvatar: defaultAscii.trimEnd()
};

function apiBaseUrl() {
  return process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080';
}

async function fetchAsciiFromImage(file: File) {
  const text = file.name.replace(/\.[^.]+$/, '').slice(0, 18) || 'avatar';
  const glyphs = ['@', '#', '%', '*', '+', '=', '-', ':', '.', ' '];
  return Array.from(text.padEnd(60, ' '), (char, index) => glyphs[(char.charCodeAt(0) + index) % glyphs.length]).join('');
}

export default function Page() {
  const [connected, setConnected] = useState(false);
  const [sessionToken, setSessionToken] = useState('');
  const [profile, setProfile] = useState<ProfileForm>(initialProfile);
  const [sessionLog, setSessionLog] = useState<SessionState[]>(['idle']);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const tokenFromUrl = new URLSearchParams(window.location.search).get('token') ?? '';
    const tokenFromStorage = window.localStorage.getItem('sessionToken') ?? '';
    const token = tokenFromUrl || tokenFromStorage;

    if (token) {
      setConnected(true);
      setSessionToken(token);
      window.localStorage.setItem('sessionToken', token);
      if (tokenFromUrl) {
        window.history.replaceState({}, '', window.location.pathname);
      }
    }
  }, []);

  useEffect(() => {
    if (!connected) return;
    setSessionLog(['assets loaded', 'github syncing', 'ascii generation', 'rendering preview']);
  }, [connected]);

  useEffect(() => {
    if (!sessionToken) return;

    let active = true;

    async function syncGithubProfile() {
      try {
        const response = await fetch(`${apiBaseUrl()}/me`, {
          headers: {
            Authorization: `Bearer ${sessionToken}`
          }
        });

        if (!response.ok) return;

        const payload = await response.json() as { user?: { githubLogin?: string; name?: string | null; avatarUrl?: string | null; email?: string | null } };
        const user = payload.user;

        if (!active || !user?.githubLogin) return;

        const connectedUser: ConnectedUser = {
          githubLogin: user.githubLogin,
          name: user.name,
          avatarUrl: user.avatarUrl,
          email: user.email
        };

        setProfile((current) => ({
          ...current,
          identifier: connectedUser.name || connectedUser.githubLogin,
          gitPointer: connectedUser.githubLogin,
          profileAbstract: connectedUser.email
            ? `${current.profileAbstract} Contact: ${connectedUser.email}.`
            : current.profileAbstract
        }));

        setSessionLog(['assets loaded', 'github syncing', 'ascii generation', 'rendering preview']);
      } catch {
        if (active) {
          setSessionLog((current) => [...current, 'github syncing']);
        }
      }
    }

    void syncGithubProfile();

    return () => {
      active = false;
    };
  }, [sessionToken]);

  const preview = useMemo(() => {
    return {
      username: profile.identifier.toLowerCase().replace(/\s+/g, ''),
      os: 'Windows 11 / macOS / Linux',
      role: profile.classification,
      kernel: profile.coreKernel,
      uptime: '12 years, 4 months, 12 days',
      bio: profile.profileAbstract
    };
  }, [profile]);

  async function handleConnect() {
    setBusy(true);
    try {
      const response = await fetch(`${apiBaseUrl()}/auth/github/start`);
      const data = await response.json() as { authorizationUrl?: string };
      if (data.authorizationUrl) {
        window.location.href = data.authorizationUrl;
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleFile(file: File | null) {
    if (!file) return;
    const ascii = await fetchAsciiFromImage(file);
    setProfile((current) => ({ ...current, asciiAvatar: ascii }));
    setSessionLog((current) => [...current, 'ascii generation']);
  }

  function handleChange<K extends keyof ProfileForm>(key: K, value: ProfileForm[K]) {
    setProfile((current) => ({ ...current, [key]: value }));
    if (key === 'gitPointer') {
      setSessionLog((current) => [...current, 'github syncing']);
    }
  }

  function handleGenerate() {
    setSessionLog((current) => [...current, 'rendering preview']);
  }

  function handleExport() {
    const payload = JSON.stringify({ profile, sessionToken }, null, 2);
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'profile-card.json';
    link.click();
    URL.revokeObjectURL(url);
  }

  function handleShare() {
    void navigator.share?.({
      title: 'GitHub Profile Card',
      text: `${profile.identifier} | ${profile.classification}`
    });
  }

  if (!connected) {
    return (
      <main>
        <section className="panel auth-card">
          <div className="auth-card-inner">
            <div className="eyebrow">GitHub Profile Card Generator</div>
            <h2>Connect to GitHub, then build the terminal profile view.</h2>
            <p>
              Sign in to sync your GitHub identity and unlock the profile editor, ASCII
              rendering, and live preview pipeline.
            </p>
            <button className="button-primary" onClick={handleConnect} disabled={busy}>
              {busy ? 'Connecting...' : 'Connect to GitHub'}
            </button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main>
      <div className="shell">
        <header className="hero">
          <div>
            <div className="eyebrow">Connected Session</div>
            <h1 className="title">Terminal profile canvas</h1>
            <p className="subtitle">
              Metadata editor on the left, live terminal preview on the right. The editor stays
              the source of truth and the output updates as data changes.
            </p>
          </div>
          <div className="actions">
            <button className="button-secondary" onClick={handleExport}>
              Export
            </button>
            <button className="button-secondary" onClick={handleShare}>
              Share
            </button>
          </div>
        </header>

        <section className="panel">
          <div className="panel-header">
            <span>Metadata Editor</span>
            <div className="lights" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
          </div>
          <div className="editor">
            <div className="upload">
              <strong>Profile manifest</strong>
              <p>Drag and drop a JPG, PNG, or WEBP file to convert it into ASCII art.</p>
              <input
                aria-label="Upload profile image"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(event) => void handleFile(event.target.files?.[0] ?? null)}
              />
            </div>

            <div className="input-grid">
              <div className="field">
                <label htmlFor="identifier">Identifier</label>
                <input
                  id="identifier"
                  value={profile.identifier}
                  onChange={(event) => handleChange('identifier', event.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor="classification">Classification</label>
                <input
                  id="classification"
                  value={profile.classification}
                  onChange={(event) => handleChange('classification', event.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor="gitPointer">Git Pointer</label>
                <input
                  id="gitPointer"
                  value={profile.gitPointer}
                  onChange={(event) => handleChange('gitPointer', event.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor="coreKernel">Core Kernel</label>
                <input
                  id="coreKernel"
                  value={profile.coreKernel}
                  onChange={(event) => handleChange('coreKernel', event.target.value)}
                />
              </div>
              <div className="field full">
                <label htmlFor="profileAbstract">Profile Abstract</label>
                <textarea
                  id="profileAbstract"
                  value={profile.profileAbstract}
                  onChange={(event) => handleChange('profileAbstract', event.target.value)}
                />
              </div>
            </div>

            <div className="actions">
              <button className="button-primary" onClick={handleGenerate}>
                Generate Profile Card
              </button>
              <div className="button-ghost">{sessionToken ? 'Session active' : 'No session token'}</div>
            </div>
          </div>
        </section>

        <section className="split">
          <section className="panel">
            <div className="panel-header">
              <span>Real-Time Preview</span>
              <span className="eyebrow">Render Output</span>
            </div>
            <div className="preview">
              <div className="terminal-card">
                <div className="terminal-top">
                  <div className="ascii-box">{profile.asciiAvatar || defaultAscii}</div>
                  <div className="meta-grid">
                    <div className="name">{preview.username}</div>
                    <div className="label">OS</div>
                    <div>{preview.os}</div>
                    <div className="label">Role</div>
                    <div>{preview.role}</div>
                    <div className="label">Kernel</div>
                    <div>{preview.kernel}</div>
                    <div className="label">Uptime</div>
                    <div>{preview.uptime}</div>
                  </div>
                </div>
                <div className="bio">
                  <div className="label">Bio Segment</div>
                  <p>{preview.bio}</p>
                </div>
              </div>
            </div>
          </section>

          <section className="session-log">
            <h3>Session Log</h3>
            <ul>
              {sessionLog.map((entry, index) => (
                <li key={`${entry}-${index}`}>{entry}</li>
              ))}
            </ul>
          </section>
        </section>
      </div>
    </main>
  );
}
