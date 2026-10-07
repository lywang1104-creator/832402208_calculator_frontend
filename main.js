/**
 * main.js - Frontend interaction logic
 *
 * Key contract:
 *   - NEVER do math on the frontend (no eval, no Function constructor)
 *   - All calculations go via fetch POST to the backend /api/calculate
 *   - Frontend only: collect user input -> display backend result
 */

// ======================================================
// Config: backend API base URL
// For local dev use http://127.0.0.1:8000
// In production set to your real public URL, e.g. https://xxx.onrender.com
// ======================================================
const API_BASE = 'http://127.0.0.1:8000';

const API = {
    calculate: `${API_BASE}/api/calculate`,
    history:   `${API_BASE}/api/history`,
};

// ======================================================
// DOM references
// ======================================================
const expressionEl = document.getElementById('expression');
const resultEl     = document.getElementById('result');
const historyList  = document.getElementById('historyList');
const clearAllBtn  = document.getElementById('clearAllBtn');

// The expression string the user is currently typing
let currentExpr = '';

// ======================================================
// Display updates
// ======================================================
function renderExpression() {
    expressionEl.textContent = currentExpr || '0';
}

function renderResult(text, isError = false) {
    resultEl.textContent = text;
    resultEl.classList.toggle('error', !!isError);
}

function setLoading(isLoading) {
    const equalBtn = document.querySelector('[data-action="equal"]');
    if (equalBtn) {
        equalBtn.disabled = isLoading;
        equalBtn.classList.toggle('loading', isLoading);
    }
}

// ======================================================
// Button event binding
// ======================================================
document.querySelectorAll('.btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const value  = btn.dataset.value;
        const action = btn.dataset.action;

        if (value !== undefined) {
            // digits / operators / parens / decimal -> append to input
            appendValue(value);
        } else if (action === 'clear') {
            clearAll();
        } else if (action === 'backspace') {
            backspace();
        } else if (action === 'equal') {
            calculateExpr();
        }
    });
});

// Clear-all button
clearAllBtn.addEventListener('click', clearAllHistory);

// ======================================================
// Input helpers
// ======================================================
function appendValue(val) {
    // Prevent stale results from being mistaken as a new expression
    if (resultEl.textContent && !resultEl.classList.contains('error')) {
        renderResult('');
    }
    currentExpr += val;
    renderExpression();
}

function clearAll() {
    currentExpr = '';
    renderExpression();
    renderResult('Awaiting input…');
}

function backspace() {
    currentExpr = currentExpr.slice(0, -1);
    renderExpression();
    if (resultEl.classList.contains('error')) {
        renderResult('');
    }
}

// ======================================================
// Keyboard support
// ======================================================
document.addEventListener('keydown', (e) => {
    const key = e.key;

    // Intercept to avoid page scroll etc.
    if (/[0-9+\-*/().]/.test(key)) {
        e.preventDefault();
        appendValue(key);
        return;
    }

    switch (key) {
        case 'Enter':
        case '=':
            e.preventDefault();
            calculateExpr();
            break;
        case 'Escape':
            e.preventDefault();
            clearAll();
            break;
        case 'Backspace':
            // Could rely on browser default; we also handle it here explicitly
            if (currentExpr) {
                e.preventDefault();
                backspace();
            }
            break;
    }
});

// ======================================================
// Core: call backend to compute (frontend NEVER does eval)
// ======================================================
async function calculateExpr() {
    const expr = currentExpr.trim();
    if (!expr) {
        renderResult('Expression required', true);
        return;
    }

    setLoading(true);
    renderResult('Computing…');

    try {
        const resp = await fetch(API.calculate, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ expression: expr }),
        });

        // HTTP-level failure
        if (!resp.ok) {
            throw new Error(`HTTP ${resp.status}`);
        }

        const data = await resp.json();

        if (data.success) {
            // Backend returned success
            renderResult(data.data.result);
            currentExpr = data.data.expression; // normalise
            renderExpression();
            await loadHistory();  // refresh history
        } else {
            // Backend returned business error (div by zero, unbalanced parens, etc.)
            renderResult(data.message || 'Computation failed', true);
        }
    } catch (err) {
        // Network error (backend not running / CORS issue / ...)
        renderResult(
            `Network error: ${err.message} (please make sure the backend is running)`,
            true
        );
    } finally {
        setLoading(false);
    }
}

// ======================================================
// History handling
// ======================================================
async function loadHistory() {
    try {
        const resp = await fetch(API.history);
        const data = await resp.json();
        if (data.success) {
            renderHistoryList(data.data);
        }
    } catch (err) {
        console.error('Failed to load history:', err);
    }
}

function renderHistoryList(records) {
    historyList.innerHTML = '';

    if (!records || records.length === 0) {
        historyList.innerHTML = '<div class="history-empty">No history yet</div>';
        return;
    }

    records.forEach(rec => {
        const item = document.createElement('div');
        item.className = 'history-item';
        item.innerHTML = `
            <div class="history-info">
                <div class="history-expr">${escapeHtml(rec.expression)}</div>
                <div class="history-result">= ${escapeHtml(rec.result)}</div>
                <div class="history-time">${escapeHtml(rec.created_at || '')}</div>
            </div>
            <button class="history-del" title="Delete" data-id="${rec.id}">🗑</button>
        `;

        // Click result area to quickly re-insert the expression (convenience)
        item.querySelector('.history-info').addEventListener('click', () => {
            currentExpr = rec.expression;
            renderExpression();
            renderResult(rec.result);
        });

        // Delete button
        item.querySelector('.history-del').addEventListener('click', async (e) => {
            e.stopPropagation();
            await deleteHistory(rec.id);
        });

        historyList.appendChild(item);
    });
}

async function deleteHistory(recordId) {
    try {
        const resp = await fetch(`${API.history}/${recordId}`, {
            method: 'DELETE',
        });
        const data = await resp.json();
        if (data.success) {
            await loadHistory();
        } else {
            alert(data.message || 'Delete failed');
        }
    } catch (err) {
        alert(`Network error: ${err.message}`);
    }
}

async function clearAllHistory() {
    const records = historyList.querySelectorAll('.history-item');
    if (records.length === 0) {
        alert('No history yet');
        return;
    }
    if (!confirm('Clear all history?')) return;

    try {
        const resp = await fetch(API.history, { method: 'DELETE' });
        const data = await resp.json();
        if (data.success) {
            await loadHistory();
        }
    } catch (err) {
        alert(`Network error: ${err.message}`);
    }
}

// ======================================================
// HTML escaping (XSS prevention)
// ======================================================
function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// ======================================================
// Page loaded -> auto-fetch history
// ======================================================
document.addEventListener('DOMContentLoaded', () => {
    renderExpression();
    loadHistory();
});