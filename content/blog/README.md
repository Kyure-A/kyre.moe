# Blog content

Each post lives in a folder under `content/blog/<slug>/` and is written in Markdown
with frontmatter. Use `ja.md` and/or `en.md` for language variants.

Example:

```
content/blog/hello-world/ja.md
content/blog/hello-world/en.md
```

Frontmatter fields:

```yaml
---
title: "Hello World"
description: "Short summary shown in lists and meta tags."
date: "2025-01-01"
tags:
  - note
  - nextjs
canonical: "https://example.com/original" # optional
cover: "/images/blog/hello-world.jpg" # optional
---
```

Notes:
- `canonical` can point to the original article if this is a re-published post.
- If `description` is omitted, a short excerpt is generated from the body.
- Drafts can be hidden by adding `draft: true` to frontmatter.

Org-mode workflow:
- Export Org to Markdown before build (e.g. with Emacs batch) and place the
  generated Markdown here.
- Keep Org files elsewhere or alongside, but only Markdown is parsed by Next.js.
- Optional helper: `npm run content:org` converts `.org` files in this folder
  into `.md` files using Emacs `ox-md`. Metadata is read from Org headers like:
  `#+TITLE`, `#+DATE`, `#+DESCRIPTION`, `#+TAGS`, `#+CANONICAL`, `#+COVER`, `#+DRAFT`.
