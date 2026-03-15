// ── iOS keyboard: visualViewport keeps composer above keyboard ─
// When the soft keyboard opens on iOS/Android, visualViewport shrinks.
// We pin .chat-app to exactly the visible area so the composer doesn't hide.
if (window.visualViewport) {
  const applyViewport = () => {
    const vv = window.visualViewport;
    const app = document.querySelector('.chat-app');
    if (!app) return;
    app.style.position = 'fixed';
    app.style.top      = vv.offsetTop + 'px';
    app.style.left     = vv.offsetLeft + 'px';
    app.style.width    = vv.width + 'px';
    app.style.height   = vv.height + 'px';
  };
  window.visualViewport.addEventListener('resize', applyViewport);
  window.visualViewport.addEventListener('scroll', applyViewport);
}

// ── Init ──────────────────────────────────────────────────────
const name = localStorage.getItem('name');

// Redirect if no name set
if (!name) {
  window.location.href = 'index.html';
}

const socket = io();

// ── DOM refs ──────────────────────────────────────────────────
const messagesEl   = document.getElementById('messages');
const messagesPane = document.getElementById('messagesPane');
const userCountEl  = document.getElementById('userCount');
const chatNameEl   = document.getElementById('chatName');
const msgInput     = document.getElementById('msg');
const timerEl      = document.getElementById('timer');

chatNameEl.textContent = name;

// ── Join ──────────────────────────────────────────────────────
socket.emit('join', name);

// ── Load history ──────────────────────────────────────────────
socket.on('load_messages', (msgs) => {
  messagesEl.innerHTML = '';
  if (msgs.length === 0) {
    showEmptyState();
  } else {
    msgs.forEach(renderMessage);
    scrollToBottom(false);
  }
});

// ── New message ───────────────────────────────────────────────
socket.on('chat_message', (msg) => {
  removeEmptyState();
  renderMessage(msg);
  scrollToBottom(true);
});

// ── Refresh after purge ───────────────────────────────────────
socket.on('refresh_messages', (msgs) => {
  messagesEl.innerHTML = '';
  if (msgs.length === 0) {
    showEmptyState();
  } else {
    msgs.forEach(renderMessage);
    scrollToBottom(false);
  }
});

// ── User list ─────────────────────────────────────────────────
socket.on('user_list', (list) => {
  userCountEl.textContent = `${list.length} online`;
});

// ── Render a message ──────────────────────────────────────────
function renderMessage(msg) {
  const isSelf = msg.name === name;

  const group = document.createElement('div');
  group.className = 'msg-group ' + (isSelf ? 'self' : 'other');

  if (!isSelf) {
    const nameEl = document.createElement('div');
    nameEl.className = 'msg-name';
    nameEl.textContent = msg.name;
    group.appendChild(nameEl);
  }

  const bubble = document.createElement('div');
  bubble.className = 'message ' + (isSelf ? 'self' : 'other');
  bubble.textContent = msg.text;
  group.appendChild(bubble);

  const timeEl = document.createElement('div');
  timeEl.className = 'msg-time';
  timeEl.textContent = formatTime(msg.time);
  group.appendChild(timeEl);

  messagesEl.appendChild(group);
}

// ── Empty state ───────────────────────────────────────────────
function showEmptyState() {
  if (document.querySelector('.empty-state')) return;
  const el = document.createElement('div');
  el.className = 'empty-state';
  el.innerHTML = '<div class="big">💬</div><div>No messages yet.</div><div>Say something to start the conversation.</div>';
  messagesEl.appendChild(el);
}

function removeEmptyState() {
  const el = document.querySelector('.empty-state');
  if (el) el.remove();
}

// ── Send ──────────────────────────────────────────────────────
function send() {
  const text = msgInput.value.trim();
  if (!text) return;

  socket.emit('chat_message', { name, text });

  msgInput.value = '';
  // Reset height after clearing
  msgInput.style.height = 'auto';
  msgInput.focus();
}

// ── Leave ─────────────────────────────────────────────────────
function leave() {
  localStorage.removeItem('name');
  window.location.href = 'index.html';
}

// ── Scroll ────────────────────────────────────────────────────
function scrollToBottom(smooth) {
  messagesPane.scrollTo({
    top: messagesPane.scrollHeight,
    behavior: smooth ? 'smooth' : 'instant'
  });
}

// ── Time format ───────────────────────────────────────────────
function formatTime(ts) {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// ── Keyboard: Enter sends, Shift+Enter newline ────────────────
msgInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    send();
  }
});

// ── Auto-resize textarea ──────────────────────────────────────
msgInput.addEventListener('input', () => {
  msgInput.style.height = 'auto';
  msgInput.style.height = Math.min(msgInput.scrollHeight, 110) + 'px';
});

// ── Expire timer ──────────────────────────────────────────────
function updateTimer() {
  const THIRTY_MIN = 30 * 60 * 1000;
  const remaining  = THIRTY_MIN - (Date.now() % THIRTY_MIN);
  const m = Math.floor(remaining / 60000);
  const s = Math.floor((remaining % 60000) / 1000);
  timerEl.textContent = `⏱ ${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

updateTimer();
setInterval(updateTimer, 1000);
