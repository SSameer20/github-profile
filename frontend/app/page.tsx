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

function previewUptime(createdAt?: string | null) {
  if (!createdAt) return 'synced';
  const years = Math.max(1, Math.floor((Date.now() - new Date(createdAt).getTime()) / 31536000000));
  return `${years} years on GitHub`;
}

function buildReadmeContent(profile: ProfileForm, github: GithubSummary | null) {
  const languages = github?.languages.length ? github.languages : ['TypeScript', 'JavaScript', 'Python'];
  const metadata = [
    `layout: terminal-dashboard`,
    `columns: 2`,
    `ascii_position: left`,
    `left_width: 24`,
    `right_width: 30`,
    `section_order: profile > contact > github stats`,
    `spacing: compact`,
    `ascii_ratio: 2:3`,
    `ascii_width: 18`,
    `ascii_height: 12`
  ];

  const compactRow = (label: string, value: string, width = 30) => `${label.padEnd(12, '.')} ${value}`.slice(0, width);
  const asciiLines = compactAscii(profile.asciiAvatar);

  return [
    `# ${profile.identifier}`,
    '',
    '```terminal',
    'layout:',
    ...metadata.map((line) => `  ${line}`),
    '',
    '┌──────────────┬──────────────────────────────┐',
    '│ ASCII        │ Profile                      │',
    '├──────────────┼──────────────────────────────┤',
    ...asciiLines.map((line, index) => {
      const right = index === 0 ? compactRow('Profile', profile.identifier) :
        index === 1 ? compactRow('Role', profile.classification) :
        index === 2 ? compactRow('Host', github?.company || 'GitHub-connected machine') :
        index === 3 ? compactRow('Kernel', profile.coreKernel) :
        index === 4 ? compactRow('IDE', 'VSCode 1.96.0') :
        index === 5 ? '──────── Contact ────────'.padEnd(30, ' ') :
        index === 6 ? compactRow('Email', github?.company ? `${profile.identifier.toLowerCase().replace(/\s+/g, '.')}@${github.company.replace(/\s+/g, '').toLowerCase()}.com` : 'sameer@example.com') :
        index === 7 ? compactRow('Website', github?.blog || 'sameer.dev') :
        index === 8 ? compactRow('LinkedIn', 'linkedin.com/in/sameer') :
        index === 9 ? '──── GitHub Stats ────'.padEnd(30, ' ') :
        index === 10 ? compactRow('Repos', String(github?.publicRepos ?? 0)) :
        index === 11 ? compactRow('Followers', String(github?.followers ?? 0)) :
        compactRow('Following', String(github?.following ?? 0));
      return `│ ${line} │ ${right.padEnd(30, ' ')} │`;
    }),
    '└──────────────┴──────────────────────────────┘',
    '',
    `ASCII block: 18x12 | ${metadata.join(' | ')}`
  ].join('\n');
}

function asciiPreview(source: string) {
  return source || defaultAscii;
}

function compactAscii(source: string) {
  const lines = asciiPreview(source)
    .split('\n')
    .map((line) => line.replace(/\s+$/, '').slice(0, 18))
    .filter((line) => line.length > 0)
    .slice(0, 12);

  while (lines.length < 12) {
    lines.push('');
  }

  return lines.map((line) => line.padEnd(18, ' '));
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
  const [commitBusy, setCommitBusy] = useState(false);
  const [commitMessage, setCommitMessage] = useState('');
  const [commitDraft, setCommitDraft] = useState('');
  const [commitModalOpen, setCommitModalOpen] = useState(false);
  const [connectionError, setConnectionError] = useState('');

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
    const githubLanguages = github?.languages.length ? github.languages : ['TypeScript', 'JavaScript', 'Python', 'Go', 'Rust'];
    const sections: PreviewSection[] = [
      {
        title: 'System',
        kind: 'kv',
        items: [
          { label: 'OS', value: 'Linux' },
          { label: 'Uptime', value: previewUptime(github?.createdAt) },
          { label: 'Host', value: github?.company || 'GitHub-connected machine' },
          { label: 'Kernel', value: profile.coreKernel },
          { label: 'IDE', value: 'VSCode 1.96.0' }
        ]
      },
      {
        title: 'Languages',
        kind: 'kv',
        items: [
          { label: 'Programming', value: githubLanguages.join(', ') },
          { label: 'Computer', value: 'HTML, CSS, JSON, Markdown' },
          { label: 'Real', value: 'English, GitHub' }
        ]
      },
      {
        title: 'Contact',
        kind: 'kv',
        items: [
          { label: 'Email', value: github?.company ? `${profile.identifier.toLowerCase().replace(/\s+/g, '.')}@${github.company.replace(/\s+/g, '').toLowerCase()}.com` : 'sameer@example.com' },
          { label: 'Website', value: github?.blog || 'sameer.dev' },
          { label: 'LinkedIn', value: 'linkedin.com/in/sameer' }
        ]
      },
      {
        title: 'GitHub Stats',
        kind: 'kv',
        items: [
          { label: 'Repos', value: String(github?.publicRepos ?? 0) },
          { label: 'Followers', value: String(github?.followers ?? 0) },
          { label: 'Following', value: String(github?.following ?? 0) },
          { label: 'Gists', value: String(github?.publicGists ?? 0) },
          { label: 'Top Languages', value: githubLanguages.join(', ') }
        ]
      }
    ];

    return {
      username: profile.identifier.toLowerCase().replace(/\s+/g, ''),
      os: 'Linux',
      role: profile.classification,
      kernel: '6.12.1',
      uptime: previewUptime(github?.createdAt),
      bio: github?.location ? `${profile.profileAbstract} Based in ${github.location}.` : profile.profileAbstract,
      sections
    };
  }, [profile, github]);

  async function handleConnect() {
    setBusy(true);
    setConnectionError('');
    try {
      const response = await fetch(`${apiBaseUrl()}/auth/github/start`);
      const data = await response.json() as { authorizationUrl?: string };
      if (data.authorizationUrl) {
        window.location.href = data.authorizationUrl;
      }
      if (!data.authorizationUrl) {
        setConnectionError('GitHub connect did not return an authorization URL.');
      }
    } catch {
      setConnectionError(`Unable to reach the backend at ${apiBaseUrl()}.`);
    } finally {
      setBusy(false);
    }
  }

  function handleDisconnect() {
    window.localStorage.removeItem('sessionToken');
    setConnected(false);
    setSessionToken('');
    setGithub(null);
    setProfile(initialProfile);
    setSessionLog(['idle']);
    setConnectionError('');
  }

  async function handleReconnect() {
    handleDisconnect();
    await handleConnect();
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

  function openCommitModal() {
    setCommitDraft('');
    setCommitMessage('');
    setCommitModalOpen(true);
  }

  function closeCommitModal() {
    if (commitBusy) return;
    setCommitModalOpen(false);
  }

  async function submitCommit(commitText?: string) {
    setCommitBusy(true);
    try {
      const message = commitText?.trim() || 'Update README';
      setSessionLog((current) => [...current, `commit request: ${message}`]);
      const response = await fetch(`${apiBaseUrl()}/publish/readme`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${sessionToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: buildReadmeContent(profile, github),
          message
        })
      });

      const payload = await response.json() as { ok?: boolean; path?: string; commitSha?: string | null; error?: string };
      if (!response.ok) {
        setCommitMessage(payload.error ?? 'Commit failed');
        setSessionLog((current) => [...current, `commit failed: ${payload.error ?? response.statusText}`]);
        if (response.status === 403 && payload.error?.toLowerCase().includes('repo access')) {
          setConnectionError(payload.error);
        }
        return;
      }

      setCommitMessage(`Committed to ${payload.path ?? 'README.md'}`);
      setSessionLog((current) => [...current, '✓ Committed README']);
      setCommitModalOpen(false);
    } catch {
      setCommitMessage('Commit request failed');
      setSessionLog((current) => [...current, 'commit request failed']);
    } finally {
      setCommitBusy(false);
    }
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
            {connectionError ? <p className="auth-error">{connectionError}</p> : null}
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
            <button className="button-danger" onClick={handleDisconnect}>
              Disconnect
            </button>
            {connectionError ? (
              <button className="button-secondary" onClick={() => void handleReconnect()}>
                Reconnect GitHub
              </button>
            ) : null}
            <button className="button-secondary" onClick={handleExport}>
              Export
            </button>
            <button className="button-primary" onClick={openCommitModal} disabled={commitBusy}>
              {commitBusy ? 'Committing...' : 'Commit'}
            </button>
            {connectionError ? <p className="auth-error">{connectionError}</p> : null}
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
            <span className="eyebrow">profile-card</span>
          </div>
          <div className="terminal-window">
            <div className="card-head">
              <span className="card-username">{preview.username}</span>
              <span className="card-divider" aria-hidden="true" />
            </div>

            <div className="card-grid">
              <div className="portrait-block">
                <div className="ascii-box portrait">{asciiPreview(profile.asciiAvatar)}</div>
              </div>

              <div className="card-body">
                {preview.sections.map((section) => (
                  <section className="card-section" key={section.title}>
                    <div className="card-section-title">{section.title}</div>
                    {section.kind === 'kv' ? (
                      <div className="card-lines">
                        {section.items.map((item) => (
                          <div className="card-line" key={`${section.title}-${item.label}`}>
                            <span className="card-label">{item.label}</span>
                            <span className="card-dots" aria-hidden="true" />
                            <span className="card-value">{item.value}</span>
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

                <section className="card-section">
                  <div className="card-section-title">Bio</div>
                  <p className="about-text">{preview.bio}</p>
                </section>

                <section className="card-section">
                  <div className="card-section-title">Session Log</div>
                  <ul className="session-log">
                    {sessionLog.map((entry, index) => (
                      <li key={`${entry}-${index}`}>{entry}</li>
                    ))}
                  </ul>
                </section>
              </div>
            </div>
            {commitMessage ? <div className="commit-status">{commitMessage}</div> : null}
          </div>
        </section>

        {commitModalOpen ? (
          <div className="modal-backdrop" role="presentation" onClick={closeCommitModal}>
            <div
              className="modal-card"
              role="dialog"
              aria-modal="true"
              aria-labelledby="commit-title"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="modal-header">
                <div>
                  <div className="eyebrow">Commit README</div>
                  <h2 id="commit-title">Add an optional commit message</h2>
                </div>
                <button className="button-secondary" onClick={closeCommitModal} type="button">
                  Cancel
                </button>
              </div>
              <label className="field modal-field" htmlFor="commit-message">
                <span>Commit message</span>
                <input
                  id="commit-message"
                  value={commitDraft}
                  placeholder="Update README"
                  onChange={(event) => setCommitDraft(event.target.value)}
                />
              </label>
              <div className="modal-actions">
                <button
                  className="button-secondary"
                  onClick={() => void submitCommit('')}
                  disabled={commitBusy}
                  type="button"
                >
                  Use default
                </button>
                <button
                  className="button-primary"
                  onClick={() => void submitCommit(commitDraft)}
                  disabled={commitBusy}
                  type="button"
                >
                  {commitBusy ? 'Committing...' : 'Commit to GitHub'}
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </main>
  );
}
