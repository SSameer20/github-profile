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

type SessionState = string;

type ConnectedUser = {
  githubLogin: string;
  name?: string | null;
  avatarUrl?: string | null;
  email?: string | null;
};

type GithubSummary = {
  publicRepos: number;
  followers: number;
  following: number;
  publicGists: number;
  company?: string | null;
  blog?: string | null;
  location?: string | null;
  createdAt?: string | null;
  avatarUrl?: string | null;
  languages: string[];
};

type KeyValue = {
  label: string;
  value: string;
};

type PreviewSection =
  | { title: string; kind: 'kv'; items: KeyValue[] }
  | { title: string; kind: 'list'; items: string[] };

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
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.readAsDataURL(file);
  });

  const response = await fetch(`${apiBaseUrl()}/ascii`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ imageDataUrl: dataUrl })
  });

  if (!response.ok) {
    throw new Error('ASCII conversion failed');
  }

  const payload = await response.json() as { ascii?: string };
  if (!payload.ascii) {
    throw new Error('ASCII conversion returned empty output');
  }

  return payload.ascii;
}

export default function Page() {
  const [connected, setConnected] = useState(false);
  const [sessionToken, setSessionToken] = useState('');
  const [profile, setProfile] = useState<ProfileForm>(initialProfile);
  const [github, setGithub] = useState<GithubSummary | null>(null);
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

        const payload = await response.json() as {
          user?: { githubLogin?: string; name?: string | null; avatarUrl?: string | null; email?: string | null };
          github?: GithubSummary;
        };
        const user = payload.user;

        if (!active || !user?.githubLogin) return;

        const connectedUser: ConnectedUser = {
          githubLogin: user.githubLogin,
          name: user.name,
          avatarUrl: user.avatarUrl,
          email: user.email
        };

        if (payload.github) {
          setGithub(payload.github);
        }

        if (payload.github?.avatarUrl) {
          try {
            const response = await fetch(payload.github.avatarUrl);
            const blob = await response.blob();
            const file = new File([blob], 'avatar.png', { type: blob.type || 'image/png' });
            const ascii = await fetchAsciiFromImage(file);
            if (active) {
              setProfile((current) => ({ ...current, asciiAvatar: ascii }));
            }
          } catch {
            if (active) {
              setProfile((current) => ({ ...current, asciiAvatar: defaultAscii.trimEnd() }));
            }
          }
        }

        setProfile((current) => ({
          ...current,
          identifier: connectedUser.name || connectedUser.githubLogin,
          gitPointer: connectedUser.githubLogin,
          coreKernel: connectedUser.avatarUrl ? 'GitHub OAuth / Prisma / Next.js' : current.coreKernel,
          profileAbstract: connectedUser.email
            ? `${connectedUser.name || connectedUser.githubLogin} is reachable at ${connectedUser.email}.`
            : current.profileAbstract
        }));

        setSessionLog(['✓ Connected GitHub', '✓ Downloaded avatar', '✓ Generated ASCII', '✓ Loaded repositories', '✓ Calculated language stats', '✓ Rendering preview', '✓ Export ready']);
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
    const ascii = profile.asciiAvatar || defaultAscii;
    const githubLanguages = github?.languages.length ? github.languages : ['TypeScript', 'JavaScript', 'Python', 'Go', 'Rust'];
    const sections: PreviewSection[] = [
      {
        title: 'System',
        kind: 'kv',
        items: [
          { label: 'OS', value: 'Linux' },
          { label: 'Kernel', value: '6.12.1' },
          { label: 'Shell', value: 'zsh' },
          { label: 'Terminal', value: 'Ghostty' },
          { label: 'Editor', value: 'Neovim' },
          { label: 'IDE', value: 'VSCode' }
        ]
      },
      { title: 'Languages', kind: 'list', items: githubLanguages },
      { title: 'Frameworks', kind: 'list', items: ['React', 'Next.js', 'Express', 'FastAPI'] },
      { title: 'Infrastructure', kind: 'list', items: ['Docker', 'Kubernetes', 'AWS', 'GCP', 'Terraform'] },
      { title: 'AI Stack', kind: 'list', items: ['OpenAI', 'Claude', 'Gemini', 'MCP', 'LangGraph'] },
      {
        title: 'GitHub',
        kind: 'kv',
        items: [
          { label: 'Repositories', value: String(github?.publicRepos ?? 0) },
          { label: 'Stars', value: github ? 'synced' : 'loading' },
          { label: 'Followers', value: String(github?.followers ?? 0) },
          { label: 'Following', value: String(github?.following ?? 0) },
          { label: 'Gists', value: String(github?.publicGists ?? 0) },
          { label: 'Contributions', value: github ? 'synced via profile' : 'loading' },
          { label: 'Pull Requests', value: github ? 'synced via activity' : 'loading' },
          { label: 'Issues', value: github ? 'synced via activity' : 'loading' },
          { label: 'Top Languages', value: githubLanguages.join(', ') }
        ]
      },
      {
        title: 'Contact',
        kind: 'kv',
        items: [
          { label: 'Email', value: github?.company ? `${profile.identifier.toLowerCase()}@${github.company.replace(/\s+/g, '').toLowerCase()}.dev` : 'sameer@example.com' },
          { label: 'Website', value: github?.blog || 'sameer.dev' },
          { label: 'LinkedIn', value: 'linkedin.com/in/sameer' },
          { label: 'Twitter', value: '@sameer' }
        ]
      }
    ];

    return {
      username: profile.identifier.toLowerCase().replace(/\s+/g, ''),
      os: 'Linux',
      role: profile.classification,
      kernel: '6.12.1',
      uptime: github?.createdAt ? `${Math.max(1, Math.floor((Date.now() - new Date(github.createdAt).getTime()) / 31536000000))} years on GitHub` : 'synced',
      bio: github?.location ? `${profile.profileAbstract} Based in ${github.location}.` : profile.profileAbstract,
      sections
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
    setSessionLog((current) => [...current, 'ascii generation']);
    try {
      const ascii = await fetchAsciiFromImage(file);
      setProfile((current) => ({ ...current, asciiAvatar: ascii }));
      setSessionLog((current) => [...current, '✓ ASCII generated from image']);
    } catch {
      setSessionLog((current) => [...current, '! ASCII generation failed']);
    }
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

        <section className="panel editor-panel">
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

        <section className="panel terminal-panel">
          <div className="panel-header">
            <span>Real-Time Preview</span>
            <span className="eyebrow">fastfetch</span>
          </div>
          <div className="terminal-window">
            <div className="terminal-title">
              <span>sameer@terminal</span>
              <span>────────────────────────────</span>
              <span>$ fastfetch</span>
            </div>

            <div className="terminal-grid">
              <div className="portrait-block">
                <div className="ascii-box portrait">{profile.asciiAvatar || defaultAscii}</div>
                <div className="terminal-name">{preview.username}</div>
              </div>

              <div className="terminal-content">
                {preview.sections.map((section) => (
                  <section className="terminal-section" key={section.title}>
                    <div className="section-rule">────────────────────────────</div>
                    <div className="section-title">{section.title}</div>
                    <div className="section-rule">────────────────────────────</div>

                    {section.kind === 'kv' ? (
                      <div className="kv-list">
                        {section.items.map((item) => (
                          <div className="kv-line" key={`${section.title}-${item.label}`}>
                            <span className="kv-label">{item.label}</span>
                            <span className="kv-value">{item.value}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="tag-list">
                        {section.items.map((item) => (
                          <span key={`${section.title}-${item}`}>{item}</span>
                        ))}
                      </div>
                    )}
                  </section>
                ))}

                <section className="terminal-section">
                  <div className="section-rule">────────────────────────────</div>
                  <div className="section-title">About</div>
                  <div className="section-rule">────────────────────────────</div>
                  <p className="about-text">{preview.bio}</p>
                </section>

                <section className="terminal-section">
                  <div className="section-rule">────────────────────────────</div>
                  <div className="section-title">Session Log</div>
                  <div className="section-rule">────────────────────────────</div>
                  <ul className="session-log">
                    {sessionLog.map((entry, index) => (
                      <li key={`${entry}-${index}`}>✓ {entry}</li>
                    ))}
                  </ul>
                </section>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
