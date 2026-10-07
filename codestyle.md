# Frontend Code Style Guide

Vanilla HTML + CSS + JavaScript. No build tools, no transpilers — **what you write is what runs**.

## General Principles

- **Readability first** — code is read far more often than written
- **Keep files small** — split when responsibility changes
- **No magic** — if it's not obvious, add a comment

---

## HTML

### Naming

| Item | Rule | Example |
|------|------|---------|
| Tags | lowercase | `<div>`, `<button>` |
| Attributes | lowercase, double quotes | `<input type="text">` |
| IDs | kebab-case | `history-list`, `result-display` |
| Classes | kebab-case | `btn-op`, `display-area` |

### Semantic First

Prefer semantic tags; use `<div>` / `<span>` only when nothing else fits:

✅ Good:
```html
<button class="btn-eq">=</button>
<main class="calculator">...</main>
<header class="history-header">...</header>
```

❌ Bad:
```html
<div class="btn-eq">=</div>   <!-- not clickable by default, no accessibility -->
```

### Accessibility (Minimum)

- Every `<button>` must contain visible text (no empty `<button class="icon">`)
- Prefer native `<button>` for clickable elements — don't re-invent `<div>` click handlers unless you have to
- Use `aria-label` when an element's purpose isn't obvious from its content

---

## CSS

### Naming & Organization

- **Classes:** kebab-case: `.display-area`, `.btn-number`, `.history-item`
- **IDs:** kebab-case, reserved for JS hooks: `#result-display`, `#history-list`
- **One concern per selector** — avoid generic `.container` when you mean `.calculator-container`
- **Group by logical module**: `/* Display */`, `/* Buttons */`, `/* History */`, etc.

### Formatting

```css
/* ✅ Good */
.btn-eq {
  background-color: #ff9500;
  color: #fff;
  border-radius: 12px;
}

/* ❌ Bad — one-liners */
.btn-eq { background-color: #ff9500; color: #fff; border-radius: 12px; }

/* ❌ Bad — camelCase classes */
.btnEq { ... }
```

### Key Rules

- **Use relative units where possible** (`rem`, `em`, `%`, `vh`, `vw`) instead of hard `px` for sizing
- **Reserve `px` for borders, shadows, and font sizes** where pixel-perfect alignment matters
- **Consistent spacing in shorthands**: don't mix `padding: 8px 12px` and `padding:8px 12px`
- **No browser prefixes** unless you've verified the target browser needs them — CSS postfix fallbacks are fine
- **Avoid `!important`** — fix specificity instead
- **Animation durations ≤ 300ms** for UI micro-interactions

---

## JavaScript

### Language Version

- ES2020+ — no Internet Explorer target
- **Always use `'use strict'`** at the top of every `.js` file
- Use modern APIs (`fetch`, `Promise`, `async/await`, optional chaining `?.`, nullish coalescing `??`)

### Variable Naming

| Item | Rule | Example |
|------|------|---------|
| `const` / `let` | camelCase | `apiBase`, `calcResult` |
| Constants | UPPER_SNAKE_CASE | `MAX_DIGITS`, `API_BASE` |
| Functions | camelCase, verb-first | `calculate()`, `refreshHistory()`, `formatDisplay()` |
| Constructor-like | PascalCase | — (no classes planned) |

### Core Disciplines

- **Prefer `const`** over `let` — use `let` only when reassignment is required
- **Never use `var`**
- **No `eval()` / `new Function()`** — **ever**. This project's frontend MUST NOT compute expressions
- **Use template literals** over string concatenation
  ```javascript
  // ✅ Good
  const url = `${API_BASE}/api/history/${id}`;
  // ❌ Bad
  const url = API_BASE + '/api/history/' + id;
  ```
- **Async functions use `async/await` + `try/catch`**, not `.then()` chains, unless there's a specific reason
  ```javascript
  // ✅ Good
  async function loadHistory() {
    try {
      const res = await fetch(`${API_BASE}/api/history`);
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      renderHistory(data.data);
    } catch (err) {
      showError(err.message);
    }
  }
  ```
- **Function length ≤ 30 lines** — if it's longer, split it; if you need a comment to explain what a block does, that block wants to be its own function

### String Handling

- Single quotes `'hello'` by default
- Switch to double quotes `"hello"` only when the string itself contains a single quote that isn't worth escaping
- **No raw user input into `innerHTML`** — always sanitize with `textContent` or escape HTML

### Error Handling

Every `fetch()` call **must** handle:

1. Network failure (`catch` block)
2. Non-200 HTTP status
3. JSON parse failure
4. Backend `{"success": false}` response

```javascript
async function postCalculate(expr) {
  const res = await fetch(`${API_BASE}/api/calculate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ expression: expr }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data.data;
}
```

### Comments

```javascript
/**
 * Calculate expression via backend and refresh history
 * @param {string} expr math expression, e.g. "1 + 2 * (3 - 4)"
 */
async function handleCalculate(expr) { ... }

// Temporary workaround: Safari keypad sends "Enter" instead of "="
const ENTER_FIX = true;
```

---

## File Layout (Recommended)

For the current project (`frontend/main.js`):

```
┌─────────────────────────────┐
│ 'use strict'                 │
│ imports / consts             │
│ (API_BASE, button selectors) │
├─────────────────────────────┤
│ pure helper functions        │
│ (formatDisplay, sanitize)    │
├─────────────────────────────┤
│ API wrappers                 │
│ (postCalculate, getHistory)  │
├─────────────────────────────┤
│ UI update functions          │
│ (renderDisplay, renderHist)  │
├─────────────────────────────┤
│ event listeners              │
│ (button clicks, keyboard)    │
├─────────────────────────────┤
│ init() — bootstrapping       │
└─────────────────────────────┘
```

---

## Performance (For This Project)

Pure static site on a single page — keep it simple:

- **No DOM query inside a tight loop** — cache selectors at file scope
- **No jQuery** — native DOM APIs are sufficient
- **Bundle size is not a concern** — but avoid adding dependencies when a 5-line helper will do
- **Debounce expensive operations** (e.g. live re-evaluation while typing) — not needed yet, good to remember

---

## Testing (Manual Checklist)

| # | Case | Expected |
|---|------|----------|
| 1 | Open page with backend up | History loads automatically |
| 2 | Type `1+2*3=` | Shows `7` |
| 3 | Type `(1+2)*3=` | Shows `9` |
| 4 | Type `1/0=` | Friendly error message |
| 5 | Type `(1+2=` | Friendly error message |
| 6 | Click a history record | Expression restores to input |
| 7 | Backend offline → press `=` | Shows network error (NOT a computed value) |
| 8 | Search source for `eval` / `new Function` | **Zero matches** |

---

## Quick Reference Cheatsheet

| Item | Do | Don't |
|------|----|-------|
| Quotes | `'string'` | `"string"` for no reason |
| Variables | `const` > `let` | `var` |
| Async | `async/await` + `try/catch` | Nested `.then().then()` |
| DOM injection | `textContent` / sanitized HTML | `innerHTML` with raw user input |
| CSS classes | `.btn-eq` | `.btnEq` / `.btn_eq` |
| IDs | kebab-case, JS hooks only | Same as classes |
| Length | function ≤ 30 lines | Long unbroken blocks |

---

## Recommended Dev Tools

| Tool | Purpose |
|------|---------|
| **VSCode** | Editor with Live Server extension |
| **ESLint** (vanilla JS config) | Catch common mistakes |
| **Prettier** | Auto-format HTML/CSS/JS |
| **Chrome DevTools Network tab** | Verify frontend never sends malformed requests |
| **Chrome DevTools Sources → XHR/fetch breakpoints** | Trace every backend call |
| **`grep -r "eval(" .`** | Ensure no `eval()` has been introduced |

---

## Philosophy

> This frontend is a **dumb terminal**.  
> Its job is to: **collect input → send to backend → display response**.  
> Any attempt to make it smarter defeats the purpose of a backend-frontend split.

If you ever catch yourself writing code that evaluates math on the frontend — **stop, revert, and call the backend instead**.