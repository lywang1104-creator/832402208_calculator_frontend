# Student Calculator — Frontend

Pure **vanilla HTML + CSS + JavaScript** implementation — zero framework dependencies.

The frontend **does not compute anything**. All math is delegated to the backend REST API via `fetch`.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Structure | HTML5 (semantic tags) |
| Styles | Vanilla CSS3 (CSS Grid, Flexbox, gradients, animations) |
| Logic | Vanilla JavaScript (ES2020+, no frameworks) |
| HTTP | Browser-native `fetch` API |

## Project Layout

```
frontend/
├── index.html      # Page structure
├── style.css       # Stylesheet
├── main.js         # All JS logic (button events + API calls)
├── README.md       # This document
└── codestyle.md    # Code style guidelines
```

## Feature Checklist

### ✅ Must-have

- [x] Basic four arithmetic operations: `+` `-` `*` `/`
- [x] Compound expressions (parentheses, precedence, decimals, negatives)
- [x] Error display (division by zero, mismatched parentheses, illegal chars, syntax errors — all returned by backend)
- [x] History query (auto-loaded on page open, newest first)
- [x] Per-record delete (by ID)
- [x] Unified JSON API communication

### ⭐ Extras

- [x] **Wipe all history**
- [x] **Keyboard support** (digits, operators, Enter to compute, Esc to clear, Backspace to delete)
- [x] **History replay** — click a record to restore the expression

## Security Red Line

> 🔴 **The frontend MUST NEVER perform math.**

- ❌ No `eval()`
- ❌ No `new Function()`
- ❌ No third-party JS expression library

**How to verify**: stop the backend server, press `=` — you must see a network error, not a computed result.

## Quick Start

### Local run (pick one)

```bash
# Option A: Python simple server (recommended)
cd frontend
python -m http.server 5500
# open http://127.0.0.1:5500 in your browser

# Option B: double-click index.html directly (some browsers may block fetch to localhost due to CORS on file://)
```

> Prefer `python -m http.server` or VSCode Live Server to avoid `file://` restrictions.

### Pointing at the backend

Open `main.js` and edit `API_BASE` at the top:

```javascript
// local dev
const API_BASE = 'http://127.0.0.1:8000';

// production (example)
const API_BASE = 'https://your-backend.onrender.com';
```

## UI Reference

| Action | Behavior |
|--------|----------|
| Click digit / operator button | Append to input |
| Click `=` or press `Enter` | POST to backend, show result, refresh history |
| Click `AC` or press `Esc` | Clear current input |
| Click `⌫` or press `Backspace` | Delete last character |
| Click a history item | Restore the expression into the input |
| Click `🗑` on a record | Delete that record |
| Click top **Clear All** button | Confirm then wipe all history |

## API Endpoints (matches backend)

| Method | URL | Description |
|--------|-----|-------------|
| POST | `/api/calculate` | Evaluate expression |
| GET  | `/api/history`   | List all history |
| DELETE | `/api/history/{id}` | Delete one record |
| DELETE | `/api/history`      | Wipe all |

Unified response shape:
```json
// success
{"success": true, "data": {...}}
// failure
{"success": false, "message": "reason"}
```

## Deployment

The frontend is a pure static site — deploy to any static host:

| Platform | Notes |
|----------|-------|
| **GitHub Pages** | Free — push the repo and enable Pages |
| **Vercel** | One-click via `vercel` CLI |
| **Netlify** | Drag-and-drop folder |
| **Cloudflare Pages** | Free, unlimited bandwidth |

Remember to point `API_BASE` in `main.js` at your production backend.

## Test Checklist

- [x] Four arithmetic operations work
- [x] Parentheses/precedence `(1+2)*3 = 9`
- [x] Decimals `3.5 + 2.5 = 6`
- [x] Negative numbers `-3 + 5 = 2`
- [x] Friendly error on division by zero
- [x] Friendly error on mismatched parentheses
- [x] History persists across page reloads
- [x] Backend offline → frontend shows network error (**no frontend compute**)
- [x] No `eval` keyword anywhere (grep the source)

## License

MIT