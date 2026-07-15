import express from "express";
import cors from "cors";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import sharp from "sharp";
import { config } from "./config";
import { prisma } from "./prisma";

const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://github-profile-gamma-orpin.vercel.app",
  "https://github-profile.vercel.app",
];

app.use(
  cors({
    origin(origin, callback) {
      // Allow requests without an Origin header (e.g. Postman, curl)
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.warn("[cors] blocked origin:", origin);
      return callback(null, false);
    },
    credentials: true,
  }),
);
app.use(express.json({ limit: "10mb" }));

app.get("/", (_req, res) => {
  res.json({ ok: true, message: "server running" });
});

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.post("/ascii", async (req, res) => {
  const imageDataUrl = String(req.body?.imageDataUrl ?? "");

  if (!imageDataUrl.startsWith("data:image/")) {
    res.status(400).json({ error: "Missing imageDataUrl" });
    return;
  }

  const base64 = imageDataUrl.split(",")[1];

  if (!base64) {
    res.status(400).json({ error: "Invalid image data" });
    return;
  }

  const buffer = Buffer.from(base64, "base64");
  const targetColumns = 52;
  const targetRows = 25;
  const compensationRows = targetRows * 2;
  const ramp = "   ..::--==++**##@@";

  const { data, info } = await sharp(buffer)
    .resize({
      width: targetColumns,
      height: compensationRows,
      fit: "contain",
      position: "centre",
      background: { r: 0, g: 0, b: 0, alpha: 1 },
      withoutEnlargement: false,
    })
    .median(1)
    .blur(0.7)
    .grayscale()
    .normalize()
    .linear(0.82, -8)
    .raw()
    .toBuffer({ resolveWithObject: true });

  const lines: string[] = [];

  for (let y = 0; y < targetRows; y++) {
    let row = "";
    for (let x = 0; x < targetColumns; x++) {
      const samples = [
        data[(y * 2) * info.width + x] ?? 0,
        data[(y * 2 + 1) * info.width + x] ?? 0,
      ];
      const left = x > 0 ? data[(y * 2) * info.width + x - 1] ?? samples[0] : samples[0];
      const right = x + 1 < info.width ? data[(y * 2) * info.width + x + 1] ?? samples[0] : samples[0];
      const value = Math.round((samples[0] + samples[1] + left + right) / 4);
      const quantized = Math.round((value / 255) * (ramp.length - 1));
      const char =
        ramp[
          Math.min(
            ramp.length - 1,
            Math.max(0, quantized),
          )
        ];
      row += char;
    }
    lines.push(row);
  }

  res.json({ ascii: lines.join("\n"), width: targetColumns, height: targetRows });
});

app.get("/auth/github/start", (_req, res) => {
  if (!config.githubClientId) {
    res.status(500).json({ error: "GitHub client id is not configured" });
    return;
  }

  const state = crypto.randomBytes(16).toString("hex");
  const params = new URLSearchParams({
    client_id: config.githubClientId,
    redirect_uri: config.githubCallbackUrl,
    scope: "read:user user:email repo",
    state,
    prompt: "select_account",
  });

  res.json({
    authorizationUrl: `https://github.com/login/oauth/authorize?${params.toString()}`,
    state,
  });
});

app.get("/auth/github/callback", async (req, res) => {
  const code = String(req.query.code ?? "");
  const state = String(req.query.state ?? "");

  if (!code) {
    res.status(400).json({ error: "Missing code" });
    return;
  }

  if (!config.githubClientId || !config.githubClientSecret) {
    res.status(500).json({ error: "GitHub OAuth is not configured" });
    return;
  }

  const tokenResponse = await fetch(
    "https://github.com/login/oauth/access_token",
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client_id: config.githubClientId,
        client_secret: config.githubClientSecret,
        code,
        redirect_uri: config.githubCallbackUrl,
        state,
      }),
    },
  );

  const tokenData = (await tokenResponse.json()) as {
    access_token?: string;
    scope?: string;
    token_type?: string;
    error?: string;
  };

  if (!tokenResponse.ok || !tokenData.access_token) {
    res
      .status(400)
      .json({ error: tokenData.error ?? "Failed to exchange code" });
    return;
  }

  const profileResponse = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${tokenData.access_token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });

  if (!profileResponse.ok) {
    res.status(400).json({ error: "Failed to fetch GitHub profile" });
    return;
  }

  const profile = (await profileResponse.json()) as {
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
          tokenType: tokenData.token_type ?? null,
        },
      },
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
            tokenType: tokenData.token_type ?? null,
          },
          update: {
            accessToken: tokenData.access_token,
            scope: tokenData.scope ?? null,
            tokenType: tokenData.token_type ?? null,
          },
        },
      },
    },
    include: {
      githubAccount: true,
    },
  });

  const sessionToken = jwt.sign(
    { sub: user.id, githubId: user.githubId, login: user.githubLogin },
    config.jwtSecret,
    { expiresIn: "7d" },
  );

  const redirectUrl = `${config.frontendUrl}/?token=${encodeURIComponent(sessionToken)}`;
  res.redirect(302, redirectUrl);
});

app.get("/me", async (req, res) => {
  const authHeader = req.headers.authorization ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";

  if (!token) {
    res.status(401).json({ error: "Missing token" });
    return;
  }

  try {
    const payload = jwt.verify(token, config.jwtSecret) as { sub: string };
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      include: { githubAccount: true },
    });

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const account = user.githubAccount;
    const accessToken = account?.accessToken;

    let github: Record<string, unknown> = {};

    if (accessToken) {
      const [profileResponse, reposResponse] = await Promise.all([
        fetch("https://api.github.com/user", {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
          },
        }),
        fetch("https://api.github.com/user/repos?per_page=100&sort=updated", {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
          },
        }),
      ]);

      if (profileResponse.ok) {
        const githubProfile = (await profileResponse.json()) as {
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
          repos = (await reposResponse.json()) as Array<{
            language?: string | null;
          }>;
        }

        const languages = Array.from(
          new Set(
            repos
              .map((repo) => repo.language)
              .filter((language): language is string => Boolean(language)),
          ),
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
          languages,
        };
      }
    }

    res.json({ user, github });
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
});

app.post("/publish/readme", async (req, res) => {
  const authHeader = req.headers.authorization ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";

  if (!token) {
    res.status(401).json({ error: "Missing token" });
    return;
  }

  try {
    const payload = jwt.verify(token, config.jwtSecret) as { sub: string };
    console.log("[publish/readme] request received", { sub: payload.sub });
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      include: { githubAccount: true },
    });

    const accessToken = user?.githubAccount?.accessToken;
    if (!user || !accessToken) {
      console.warn("[publish/readme] missing user or access token", {
        sub: payload.sub,
      });
      res.status(404).json({ error: "GitHub account not found" });
      return;
    }

    console.log("[publish/readme] github account scope", {
      login: user.githubLogin,
      scope: user.githubAccount?.scope ?? null,
      tokenType: user.githubAccount?.tokenType ?? null,
    });

    const tokenScope = user.githubAccount?.scope ?? "";
    const hasRepoScope = tokenScope.split(/[,\s]+/).includes("repo");

    if (!hasRepoScope) {
      console.warn("[publish/readme] missing repo scope, reconnect required", {
        login: user.githubLogin,
        scope: tokenScope,
      });
      res.status(403).json({
        error:
          "GitHub token is missing repo access. Disconnect and reconnect GitHub to publish README.md.",
      });
      return;
    }

    const content = String(req.body?.content ?? "");
    const message = String(req.body?.message ?? "").trim() || "Update README";
    if (!content.trim()) {
      console.warn("[publish/readme] missing README content", {
        login: user.githubLogin,
      });
      res.status(400).json({ error: "Missing README content" });
      return;
    }

    const owner = user.githubLogin;
    const repo = user.githubLogin;
    const path = "README.md";
    const commitPath = `${owner}/${path}`;
    console.log("[publish/readme] target repository", {
      owner,
      repo,
      commitPath,
      message,
    });
    const repoResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
      },
    );

    let branch = "main";

    if (repoResponse.ok) {
      const repoData = (await repoResponse.json()) as {
        default_branch?: string | null;
      };
      branch = repoData.default_branch ?? branch;
      console.log("[publish/readme] repository exists", {
        owner,
        repo,
        branch,
      });
    } else if (repoResponse.status === 404) {
      console.log("[publish/readme] repository missing, creating", {
        owner,
        repo,
      });
      const createRepoResponse = await fetch(
        "https://api.github.com/user/repos",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: "application/vnd.github+json",
            "Content-Type": "application/json",
            "X-GitHub-Api-Version": "2022-11-28",
          },
          body: JSON.stringify({
            name: repo,
            description: "GitHub profile card README",
            private: false,
            auto_init: true,
          }),
        },
      );

      if (!createRepoResponse.ok) {
        const createRepoData = (await createRepoResponse.json()) as {
          message?: string;
        };
        console.error("[publish/readme] repository creation failed", {
          owner,
          repo,
          status: createRepoResponse.status,
          message: createRepoData.message,
        });
        res.status(createRepoResponse.status).json({
          error: createRepoData.message ?? "Failed to create GitHub repository",
        });
        return;
      }

      const createRepoData = (await createRepoResponse.json()) as {
        default_branch?: string | null;
      };
      branch = createRepoData.default_branch ?? branch;
      console.log("[publish/readme] repository created", {
        owner,
        repo,
        branch,
      });
    } else {
      const repoData = (await repoResponse.json()) as { message?: string };
      console.error("[publish/readme] repository lookup failed", {
        owner,
        repo,
        status: repoResponse.status,
        message: repoData.message,
      });
      res.status(repoResponse.status).json({
        error: repoData.message ?? "Failed to read GitHub repository",
      });
      return;
    }

    const existingResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${encodeURIComponent(branch)}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
      },
    );

    const existingData = existingResponse.ok
      ? ((await existingResponse.json()) as { sha?: string })
      : null;
    console.log("[publish/readme] existing README lookup", {
      owner,
      repo,
      branch,
      found: existingResponse.ok,
      status: existingResponse.status,
    });

    const commitResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/vnd.github+json",
          "Content-Type": "application/json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
        body: JSON.stringify({
          message,
          content: Buffer.from(content, "utf8").toString("base64"),
          branch,
          sha: existingData?.sha,
        }),
      },
    );

    const commitData = (await commitResponse.json()) as {
      commit?: { sha?: string };
      content?: { path?: string };
      message?: string;
    };

    if (!commitResponse.ok) {
      console.error("[publish/readme] commit failed", {
        owner,
        repo,
        branch,
        status: commitResponse.status,
        message: commitData.message,
      });
      res.status(commitResponse.status).json({
        error: commitData.message ?? "Failed to publish README",
      });
      return;
    }

    console.log("[publish/readme] commit succeeded", {
      owner,
      repo,
      branch,
      path: commitData.content?.path ?? commitPath,
      sha: commitData.commit?.sha ?? null,
    });
    res.json({
      ok: true,
      path: commitData.content?.path ?? commitPath,
      commitSha: commitData.commit?.sha ?? null,
    });
  } catch {
    console.error("[publish/readme] invalid or expired session token");
    res.status(401).json({ error: "Invalid token" });
  }
});

app.listen(config.port, () => {
  console.log(`Backend listening on http://localhost:${config.port}`);
});
