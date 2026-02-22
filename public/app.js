// ── Access gate ─────────────────────────────────────────────
const gateOverlay  = document.getElementById('gateOverlay');
const codeInput    = document.getElementById('codeInput');
const codeSubmit   = document.getElementById('codeSubmit');
const gateError    = document.getElementById('gateError');

const ACCESS_KEY    = 'profile_access_code'; // stores the actual code, not just a flag
const MAX_ATTEMPTS  = 3;
const LOCKOUT_SECS  = 60;

let failedAttempts  = 0;
let lockoutTimer    = null;
let countdownInterval = null;

function showGate()    { gateOverlay.classList.remove('hidden'); codeInput.focus(); }
function hideGate()    { gateOverlay.classList.add('hidden'); }
function isUnlocked()  { return !!sessionStorage.getItem(ACCESS_KEY); }
function getCode()     { return sessionStorage.getItem(ACCESS_KEY) || ''; }

function isLocked() { return lockoutTimer !== null; }

function startLockout() {
    let remaining = LOCKOUT_SECS;
    codeInput.disabled  = true;
    codeSubmit.disabled = true;

    function tick() {
        gateError.textContent = `// too many attempts — retry in ${remaining}s`;
        if (remaining <= 0) {
            clearInterval(countdownInterval);
            countdownInterval = null;
            lockoutTimer      = null;
            failedAttempts    = 0;
            codeInput.disabled  = false;
            codeSubmit.disabled = false;
            gateError.textContent = '';
            codeInput.value = '';
            codeInput.focus();
        }
        remaining--;
    }

    tick(); // show immediately
    countdownInterval = setInterval(tick, 1000);
    lockoutTimer = true; // flag only — interval handles timing
}

async function submitCode() {
    if (isLocked()) return;

    const code = codeInput.value.trim();
    if (!code) return;

    const fmt = /^[A-Za-z0-9]{3}-[A-Za-z0-9]{3}$/;
    if (!fmt.test(code)) {
        gateError.textContent = '// invalid format — expected XXX-XXX';
        codeInput.select();
        return;
    }

    codeSubmit.disabled = true;
    gateError.textContent = '// verifying…';

    try {
        const res  = await fetch('/api/validateCode', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code })
        });
        const data = await res.json();

        if (data.valid) {
            sessionStorage.setItem(ACCESS_KEY, code.trim().toUpperCase()); // store the real code
            hideGate();
            userInput.focus();
        } else {
            failedAttempts++;
            const left = MAX_ATTEMPTS - failedAttempts;
            if (failedAttempts >= MAX_ATTEMPTS) {
                startLockout();
            } else {
                gateError.textContent =
                    `// access denied — ${left} attempt${left === 1 ? '' : 's'} remaining`;
                codeInput.select();
                codeSubmit.disabled = false;
            }
        }
    } catch {
        gateError.textContent = '// network error — please try again';
        codeSubmit.disabled = false;
    }
}

codeSubmit.addEventListener('click', submitCode);
codeInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); submitCode(); }
});

// Auto-format: insert hyphen after 3rd char
codeInput.addEventListener('input', () => {
    let v = codeInput.value.replace(/-/g, '').toUpperCase().slice(0, 6);
    if (v.length > 3) v = v.slice(0, 3) + '-' + v.slice(3);
    codeInput.value = v;
    if (!isLocked()) gateError.textContent = '';
});

// ── DOM refs ─────────────────────────────────────────────
const termBody      = document.getElementById('chatMessages');
const userInput     = document.getElementById('userInput');
const sendButton    = document.getElementById('sendButton');
const suggestions   = document.getElementById('suggestions');

// ── Auto-resize textarea ──────────────────────────────────
userInput.addEventListener('input', function () {
    this.style.height = 'auto';
    this.style.height = this.scrollHeight + 'px';
});

// ── Key / button handlers ─────────────────────────────────
sendButton.addEventListener('click', sendMessage);

userInput.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

// ── Core send ─────────────────────────────────────────────
async function sendMessage() {
    const message = userInput.value.trim();
    if (!message) return;

    userInput.disabled = true;
    sendButton.disabled = true;

    appendUserLine(message);

    userInput.value = '';
    userInput.style.height = 'auto';

    const loadingId = appendLoading();

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-access-code': getCode()       // verified server-side on every request
            },
            body: JSON.stringify({ question: message })
        });

        if (response.status === 401) {
            sessionStorage.removeItem(ACCESS_KEY);
            removeLoading(loadingId);
            showGate();
            return;
        }

        const data = await response.json().catch(() => ({}));
        removeLoading(loadingId);

        if (!response.ok) {
            const detail = data?.details || data?.error || `HTTP ${response.status}`;
            appendAssistantBlock(`// error: ${detail}`);
            return;
        }

        appendAssistantBlock(data.answer);
        collapseHeader();

    } catch (err) {
        console.error(err);
        removeLoading(loadingId);
        const o       = siteConfig?.owner || {};
        const contact = o.linkedin
            ? `reach ${o.shortName || o.name} via LinkedIn: ${o.linkedin.replace('https://', '')}`
            : 'please try again';
        appendAssistantBlock(`Error contacting the API. ${contact}`);
    } finally {
        userInput.disabled = false;
        sendButton.disabled = false;
        userInput.focus();
    }
}

// ── Render helpers ────────────────────────────────────────

function appendUserLine(text) {
    const block = document.createElement('div');
    block.className = 'output-block user-output';

    const line = document.createElement('div');
    line.className = 'output-line';
    const promptEl   = document.getElementById('input-prompt');
    const promptText  = promptEl ? escapeHtml(promptEl.textContent) : 'user@visitor:~$';
    line.innerHTML =
        `<span class="prompt-user">${promptText}</span>` +
        `<span class="sep"> &gt; </span>` +
        escapeHtml(text);

    block.appendChild(line);
    termBody.appendChild(block);
    scrollBottom();
}

function appendAssistantBlock(text) {
    const block = document.createElement('div');
    block.className = 'output-block assistant-output';

    // prefix line
    const prefixLine = document.createElement('div');
    prefixLine.className = 'output-line';
    prefixLine.innerHTML = `<span class="prompt-sys">system</span><span class="sep"> &gt; </span>`;
    block.appendChild(prefixLine);

    // response body
    const body = document.createElement('div');
    body.className = 'output-line';
    body.style.paddingLeft = '1.5rem';
    body.innerHTML = formatTerminal(text);
    block.appendChild(body);

    termBody.appendChild(block);
    scrollBottom();
}

function appendLoading() {
    const id = 'load-' + Date.now();
    const block = document.createElement('div');
    block.className = 'output-block loading-block';
    block.id = id;

    const line = document.createElement('div');
    line.className = 'output-line';
    line.innerHTML =
        `<span class="prompt-sys">system</span>` +
        `<span class="sep"> &gt; </span>` +
        `processing<span class="spinner"></span>`;

    block.appendChild(line);
    termBody.appendChild(block);
    scrollBottom();
    return id;
}

function removeLoading(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
}

function scrollBottom() {
    termBody.scrollTop = termBody.scrollHeight;
}

// ── Text formatting ───────────────────────────────────────

function escapeHtml(t) {
    return t
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function formatTerminal(text) {
    // Escape first, then selectively re-add HTML
    let t = escapeHtml(text);

    // ### headings
    t = t.replace(/^###\s+(.+)$/gm, '<h3>$1</h3>');
    // ## headings
    t = t.replace(/^##\s+(.+)$/gm, '<h3>$1</h3>');

    // **bold**
    t = t.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // *italic*
    t = t.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    // `code`
    t = t.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Numbered list items: "1. text" → li
    t = t.replace(/^\d+\.\s+(.+)$/gm, '<li>$1</li>');
    // Bullet items "- text" or "* text"
    t = t.replace(/^[\-\*]\s+(.+)$/gm, '<li>$1</li>');

    // Wrap consecutive <li>…</li> blocks in <ul>
    t = t.replace(/(<li>[\s\S]*?<\/li>\n?)+/g, m => `<ul>${m}</ul>`);

    // Paragraphs: double newline → <p>…</p>
    const parts = t.split(/\n{2,}/);
    t = parts.map(p => {
        p = p.trim();
        if (!p) return '';
        if (/^<(ul|h3|li)/.test(p)) return p;
        // single newlines within a paragraph → <br>
        return `<p>${p.replace(/\n/g, '<br>')}</p>`;
    }).join('\n');

    return t;
}

// ── Collapsible header ───────────────────────────────────
const termHeader  = document.getElementById('termHeader');
const headerToggle = document.getElementById('headerToggle');
const toggleBtn   = document.getElementById('toggleBtn');

headerToggle.addEventListener('click', () => {
    const collapsed = termHeader.classList.toggle('collapsed');
    toggleBtn.textContent = collapsed ? '[+]' : '[−]';
});

function collapseHeader() {
    if (!termHeader.classList.contains('collapsed')) {
        termHeader.classList.add('collapsed');
        toggleBtn.textContent = '[+]';
    }
}

// ── Config ──────────────────────────────────────────────────────────────────
let siteConfig = null;

async function loadConfig() {
    try {
        const res = await fetch('/config.json');
        if (!res.ok) throw new Error(`config.json request failed (${res.status})`);
        siteConfig = await res.json();
    } catch (e) {
        console.warn('Could not load config.json, using defaults:', e.message);
        siteConfig = {
            owner: {
                name: 'Profile Owner', shortName: 'Profile Owner', username: 'user',
                title: 'Professional', experience: '', location: '', linkedin: '', github: ''
            },
            ui: {
                appVersion: '1.0.0',
                motd: '// interactive profile loaded. ask me anything.',
                audienceLabel: 'visitor',
                stackLabel: 'Interactive Profile · Serverless Functions · AI API'
            },
            asciiArt: '',
            questions: []
        };
    }
    return siteConfig;
}

function applyConfig(cfg) {
    const o  = cfg.owner || {};
    const ui = cfg.ui    || {};

    // Page title & title bar
    document.title = `${o.username || 'user'}@profile:~$`;
    const titleBar = document.getElementById('title-bar-text');
    if (titleBar) titleBar.textContent =
        `${o.username || 'user'}@profile — ${ui.appTitle || 'interactive resume'} v${ui.appVersion || '1.0.0'}`;

    // ASCII art
    const art = Array.isArray(cfg.asciiArt)
        ? cfg.asciiArt.join('\n')
        : (cfg.asciiArt || o.shortName || o.name || '');
    const gateAscii = document.getElementById('gate-ascii');
    const mainAscii = document.getElementById('ascii-banner');
    if (gateAscii) gateAscii.textContent = art;
    if (mainAscii) mainAscii.textContent = art;

    // Header summary
    const titleShort = (o.title || '').split('·')[0].trim();
    const headerSum  = document.getElementById('header-summary');
    if (headerSum) headerSum.textContent =
        `${o.shortName || o.name || ''}  ·  ${titleShort}  ·  ${o.experience || ''}`;

    // Sys-info
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val || ''; };
    set('sysinfo-name', o.name);
    set('sysinfo-role', o.title);
    set('sysinfo-exp',  o.experience);
    set('sysinfo-loc',  o.location);

    // MOTD
    const motdEl = document.getElementById('motd');
    if (motdEl) motdEl.textContent =
        (ui.motd || '// interactive profile loaded.').replace('{shortName}', o.shortName || o.name || '');

    // Input prompt
    const inputPromptEl = document.getElementById('input-prompt');
    if (inputPromptEl) inputPromptEl.textContent = `user@${ui.audienceLabel || 'visitor'}:~$`;

    // Footer
    set('footer-stack', ui.stackLabel);
    const linkedinEl = document.getElementById('footer-linkedin');
    const githubEl   = document.getElementById('footer-github');
    if (linkedinEl) {
        if (o.linkedin) { linkedinEl.href = o.linkedin; }
        else if (linkedinEl.parentElement) { linkedinEl.parentElement.style.display = 'none'; }
    }
    if (githubEl) {
        if (o.github) { githubEl.href = o.github; }
        else { githubEl.style.display = 'none'; }
    }
    set('footer-author', `${new Date().getFullYear()} · ${o.name || ''}`);

    // Suggested question buttons (generated dynamically from config)
    const cmdList = document.getElementById('cmd-list');
    if (cmdList) {
        cmdList.innerHTML = '';
        (cfg.questions || []).forEach((q, i) => {
            const question = (q.question || '').replace('{shortName}', o.shortName || o.name || '');
            const btn = document.createElement('button');
            btn.className = 'cmd-btn';
            btn.dataset.question = question;
            btn.innerHTML = `<span class="cmd-idx">[${i + 1}]</span> ./query ${q.label || 'query'}`;
            btn.addEventListener('click', () => {
                userInput.value = question;
                suggestions.style.display = 'none';
                sendMessage();
            });
            cmdList.appendChild(btn);
        });
    }
}

// ── Init ──────────────────────────────────────────────────────────────────────
loadConfig().then(cfg => {
    applyConfig(cfg);
    if (isUnlocked()) { hideGate(); userInput.focus(); } else { showGate(); }
});


