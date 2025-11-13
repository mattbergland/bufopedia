# Bufopedia

Bufopedia is a React + Vite single-page app that lets you browse every bufo emoji from the community-maintained [all-the-bufo](https://github.com/knobiknows/all-the-bufo) repository. It mimics the Emojipedia UX so you can search, filter, preview, copy, and download any bufo with just a couple clicks.

## Features

- **Search everything** – instant fuzzy matching across display names and filenames.
- **Type filters & sorting** – jump between static PNG/JPG and animated GIF bufos, and sort the grid in multiple ways.
- **Clipboard-friendly** – copy the actual image (or the source URL as a fallback) straight to your clipboard for pasting into chats.
- **Quick downloads** – grab any bufo locally without leaving the page.
- **Responsive neon UI** – playful, froggy-themed design inspired by Emojipedia.

## Getting started

```bash
npm install
npm run dev
```

Then open the printed localhost URL (default `http://localhost:5173`).

## Building for production

```bash
npm run build
npm run preview # optional: serve the production build locally
```

## Data source

All bufos are sourced from the open `all-the-bufo` repository. The dataset lives in `src/data/bufos.json` and was generated directly from their `index.md`. If the upstream repo updates, re-run the ingestion script (see `scripts/` in the original repo or roll your own) and replace the JSON file.

## License

This project simply re-hosts assets that remain the property of their original creators. Please respect the usage guidelines from the upstream repository.
