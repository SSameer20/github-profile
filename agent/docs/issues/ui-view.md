# Terminal Profile Canvas UI Review

## Goal

The generated profile card should feel like a real terminal output (similar to `fastfetch`/`neofetch`), not a dashboard card with terminal styling. The current implementation captures the color palette but misses the authenticity, density, hierarchy, and information richness of an actual terminal profile.

---

# Issues & Required Changes

## 1. Terminal Authenticity

### Current

- Looks like a modern dashboard.
- Rounded cards and large padding.
- Feels like a React UI.

### Expected

- Should resemble an actual terminal screenshot.
- Dense layout.
- Monospaced typography everywhere.
- Minimal spacing.
- Looks like output from `fastfetch`.

---

## 2. Information Density

### Current

Only displays:

- Username
- OS
- Role
- Uptime
- Bio

### Expected

Fill the preview with meaningful metadata.

Suggested sections:

### System

- OS
- Host
- Kernel
- Shell
- Terminal
- Editor
- IDE

### Languages

- JavaScript
- TypeScript
- Python
- Go
- Rust

### Frameworks

- React
- Next.js
- Express
- FastAPI

### Infrastructure

- Docker
- Kubernetes
- AWS
- GCP
- Terraform

### AI Stack

- OpenAI
- Claude
- Gemini
- MCP
- LangGraph

### GitHub

- Repositories
- Stars
- Followers
- Following
- Contributions
- Commits
- Pull Requests
- Issues
- Top Languages

### Contact

- Email
- Website
- LinkedIn
- Twitter

### About

Short wrapped bio.

---

## 3. Whitespace

### Current

Almost half of the preview is empty.

### Required

- Reduce padding.
- Reduce margins.
- Increase content density.
- Every area should display useful information.

---

## 4. ASCII Portrait

### Current

- Too small.
- Low detail.
- Doesn't attract attention.

### Required

- Occupy 35–40% of card width.
- Increase resolution.
- Preserve facial details.
- Better character mapping.
- Become the visual anchor of the layout.

---

## 5. Typography

### Current

Looks like dashboard text.

### Required

Use only monospaced fonts such as:

- JetBrains Mono
- IBM Plex Mono
- Fira Code

Everything should align like terminal output.

---

## 6. Alignment

Current:

```text
OS Windows
ROLE Full Stack
```

Expected:

```text
OS................. Linux
Kernel............. 6.12
Shell.............. zsh
IDE................ VSCode
```

Use dotted alignment for all key/value pairs.

---

## 7. Section Separation

Current:
Everything appears as one block.

Required:

```text
────────────────────────────
System
────────────────────────────

────────────────────────────
Languages
────────────────────────────

────────────────────────────
GitHub
────────────────────────────

────────────────────────────
Contact
────────────────────────────
```

---

## 8. Bio Formatting

Current:

```text
Bio Segment

Building scalable systems...
```

Required:

```text
About:
Building scalable systems with AI,
distributed systems,
backend engineering,
developer tooling.
```

Wrap naturally within terminal width.

---

## 9. Color Usage

Current:
Mostly white.

Required:
Apply subtle terminal syntax colors.

Suggested palette:

- Green → headings
- Cyan → labels
- Yellow → values
- White → content
- Gray → separators

Avoid excessive colors.

---

## 10. Terminal Details

Add subtle realism:

```text
sameer@terminal
────────────────────────────

$ fastfetch
```

or

```text
Last login:
```

Small details greatly improve authenticity.

---

## 11. Metadata Editor

Current fields:

- Name
- Role
- GitHub
- Bio

Missing:

- Company
- Experience
- Location
- Website
- Email
- LinkedIn
- Twitter
- Languages
- Frameworks
- Databases
- Cloud
- DevOps
- AI Stack
- Shell
- Terminal
- Editor
- IDE
- Custom Sections

Support dynamic metadata instead of fixed fields.

---

## 12. GitHub Integration

Current:
GitHub is barely utilized.

Automatically populate:

- Avatar
- Username
- Followers
- Following
- Repositories
- Stars
- Contributions
- Commits
- Organizations
- Top Languages
- Pinned Repositories

Reduce manual input.

---

## 13. Session Log

Current:

```text
assets loaded
render preview
ascii generation
```

Feels static.

Required:

```text
✓ Connected GitHub
✓ Downloaded avatar
✓ Generated ASCII
✓ Loaded repositories
✓ Calculated language stats
✓ Rendering preview
✓ Export ready
```

Prefer real progress updates.

---

## 14. Preview Scaling

Current:
Fixed height.

Required:

- Auto-expand with additional metadata.
- Prevent clipping.
- Maintain consistent spacing.

---

## 15. Export Options

Add support for:

- Terminal themes
- ASCII resolution
- Width
- Height
- Font size
- Background
- Border style
- Color palette

---

# Target Layout

```text
+---------------------------------------------------------------+

ASCII Portrait              sameershaik

                            ─────────────────────────────

                            System
                            OS................. Linux
                            Kernel............. 6.12
                            Shell.............. zsh
                            Terminal........... Ghostty
                            IDE................ VSCode

                            Languages
                            TypeScript
                            Python
                            Go
                            Rust

                            Frameworks
                            React
                            Next.js
                            Express

                            Infrastructure
                            Docker
                            Kubernetes
                            AWS
                            Terraform

                            AI
                            OpenAI
                            Claude
                            Gemini
                            MCP

                            GitHub
                            Repositories....... 72
                            Stars.............. 540
                            Followers.......... 230
                            Contributions...... 4,582

                            Contact
                            Website............ ...
                            LinkedIn........... ...
                            Twitter............ ...

                            About
                            Building scalable backend,
                            AI systems, developer tools
                            and cloud infrastructure.

+---------------------------------------------------------------+
```

---

# Design Principles

- Prioritize **terminal authenticity** over dashboard aesthetics.
- Maximize **information density** while maintaining readability.
- Make the **ASCII portrait** the primary visual element (35–40% width).
- Use **strict monospaced alignment** for all metadata.
- Organize information into clear terminal sections.
- Auto-populate GitHub statistics wherever possible.
- Minimize whitespace and ensure every area contains meaningful information.
- Apply subtle terminal colors instead of plain white text.
- The final output should feel indistinguishable from a real `fastfetch`/`neofetch` screenshot rather than a React card with terminal styling.
