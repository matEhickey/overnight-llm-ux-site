# Overnight LLM UX Site

Docusaurus site for in-browser LLM UX explorations. Built one feature at a time.

## Structure

```
docs/ux/          — docs articles for each build
docs/ux/builds/   — auto-generated doc sidebar from here
blog/             — blog posts announcing each build
static/ux/{slug}/ — built demo (vite build output copied here)
src/pages/        — home page + /demo page
```

## Development

```bash
npm install
npm start          # dev server on localhost:3000
npm run build      # static production build
```

## Deployment

Pushed to `github.com/matEhickey/overnight-llm-ux-site`. Vercel auto-deploys on push.
