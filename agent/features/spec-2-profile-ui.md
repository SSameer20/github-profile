uh create an application uh using uh this current repo with the name of content and I want you to follow this below below uh sections.

- Clean NExtJS Application
- Simple single page
- on opening just simple Connect to Github button
- Once authorise or connect
- show them teh ui as below

## Overview

A two-panel interface with a metadata editor on the left and a real-time terminal-style profile preview on the right.

---

## Left Panel – Metadata Editor

### Image Upload

- Drag & drop or browse image
- Supports JPG, PNG, WEBP
- Converts uploaded image into ASCII art

### Form Fields

- **Identifier** → Display name
- **Classification** → Role/Title
- **Git Pointer** → GitHub username
- **Core Kernel** → Primary technologies
- **Profile Abstract** → Short bio

### Action

- **Generate Profile Card** button
- Validates input and regenerates the preview

---

## Right Panel – Real-Time Preview

### Terminal Profile Card

Displays:

- ASCII avatar
- Username
- OS
- Role
- Tech stack
- Uptime
- Bio

### Session Log

Shows generation progress such as:

- Assets loaded
- GitHub syncing
- ASCII generation
- Rendering preview

### Toolbar

- Export
- Share

---

# Data Flow

User Input
→ Update Profile Metadata
→ Convert Image to ASCII
→ Fetch GitHub Data
→ Merge Data
→ Render Terminal Card
→ Live Preview
→ Export / Publish

---

# Components

App

- Metadata Editor
  - Image Upload
  - Input Fields
  - Generate Button
- Preview Panel
  - Terminal Card
  - Session Log
- Toolbar
  - Export
  - Share

---

# Notes

- Metadata editor is the single source of truth.
- Preview updates automatically whenever data changes.
- ASCII generation should be asynchronous.
- GitHub data should be fetched after username is provided.
- Export and Publish should use the same rendered output as the preview.
