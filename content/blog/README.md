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
- Org は `content/blog/<slug>/` に置き、`ja.org` / `en.org` を使う。
- Next.js が読むのは `.md` なので、ビルド前に Org → Markdown を行う。
- 変換は `npm run content:org` を使用（Emacs `ox-md` で `.org` を `.md` に出力）。

Org ファイルに書く内容（例）:

```
#+TITLE: Hello World
#+DATE: 2025-01-01
#+DESCRIPTION: Short summary shown in lists and meta tags.
#+TAGS: note, nextjs
#+CANONICAL: https://example.com/original
#+COVER: /images/blog/hello-world.jpg
#+DRAFT: true

はじめに軽い導入を書く（excerpt にも使われる）。

* セクション見出し
本文本文本文。

** 小見出し
- 箇条書き
- 箇条書き

#+begin_src ts
console.log("code block");
#+end_src
```

メタ情報のルール:
- 先頭のメタ情報は「最初の空行」までが対象。
- `#+TAGS` はカンマ区切り or 空白区切りで指定可能。
- `#+DRAFT` は `true/yes/1` で下書き扱い。
- `#+CANONICAL` と `#+COVER` は任意。
