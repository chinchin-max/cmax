// ===== แชท =====
const CHAT_KEY = 'tri_monster_chat_v2';
let chatMessages = [];
let chatReadIndex = -1;
let chatReplyTo = null;

function loadChat() {
  try {
    chatMessages = JSON.parse(localStorage.getItem(CHAT_KEY) || '[]');
  } catch (e) { chatMessages = []; }
  if (!chatMessages.length) {
    chatMessages.push({ from: 'ระบบ', text: 'ยินดีต้อนรับสู่แชทโลกไตรภูมิ' });
    saveChat();
  }
}
function saveChat() {
  try {
    if (chatMessages.length > 80) chatMessages = chatMessages.slice(-80);
    localStorage.setItem(CHAT_KEY, JSON.stringify(chatMessages));
  } catch (e) {}
}
function renderChatLog() {
  const log = document.getElementById('chatLog');
  if (!log) return;
  let t = '';
  chatMessages.forEach(function(m, i) {
    t += (i === chatReadIndex ? '▶ ' : '') + '[' + m.from + ']' +
      (m.replyTo ? ' (ตอบ: ' + m.replyTo + ')' : '') + ' ' + m.text + '\n';
  });
  log.textContent = t || '(ยังไม่มีข้อความ)';
  log.scrollTop = log.scrollHeight;
}
function focusGame() {
  const inp = document.getElementById('chatInput');
  if (inp && document.activeElement === inp) return; // กำลังพิมพ์แชท — ไม่แย่งโฟกัส
  // ถ้าโฟกัสอยู่ที่รายการกระเป๋า/เมนู — อย่าแย่ง (TalkBack ต้องปัดรายการต่อได้)
  var ae = document.activeElement;
  if (ae && ae.classList && ae.classList.contains('a11y-option')) return;
  if (ae && ae.closest && ae.closest('#a11yListPanel')) return;
  var panel = document.getElementById('a11yListPanel');
  if (panel && panel.classList.contains('visible') && (('ontouchstart' in window) || (navigator.maxTouchPoints > 0))) {
    return;
  }
  if (inp) inp.blur();
  const body = document.getElementById('gameBody');
  if (body) {
    body.setAttribute('tabindex', '0');
    // เดสก์ท็อป + NVDA: ใช้ role=application
    // มือถือ + TalkBack/VoiceOver: อย่าใช้ application จะวนโฟกัสในปุ่มไม่ได้
    var touch = (typeof isTouchDevice === 'function') ? isTouchDevice() : (('ontouchstart' in window) || (navigator.maxTouchPoints > 0));
    if (touch) {
      body.removeAttribute('role');
    } else {
      body.setAttribute('role', 'application');
    }
    try {
      body.focus({ preventScroll: true });
    } catch (e) {
      body.focus();
    }
  }
}

function showChatPanel() {
  const panel = document.getElementById('chatPanel');
  if (panel) panel.style.display = 'block';
  renderChatLog();
}

function hideChatPanel() {
  const panel = document.getElementById('chatPanel');
  if (panel) panel.style.display = 'none';
  focusGame();
}
function chatReadPrev() {
  if (!chatMessages.length) return;
  showChatPanel();
  if (chatReadIndex < 0) chatReadIndex = chatMessages.length - 1;
  else chatReadIndex = Math.max(0, chatReadIndex - 1);
  renderChatLog();
  const m = chatMessages[chatReadIndex];
  announce('อ่าน (' + (chatReadIndex+1) + '/' + chatMessages.length + ')\n[' + m.from + '] ' + m.text);
}
function chatReadNext() {
  if (!chatMessages.length) return;
  showChatPanel();
  if (chatReadIndex < 0) chatReadIndex = 0;
  else chatReadIndex = Math.min(chatMessages.length - 1, chatReadIndex + 1);
  renderChatLog();
  const m = chatMessages[chatReadIndex];
  announce('อ่าน (' + (chatReadIndex+1) + '/' + chatMessages.length + ')\n[' + m.from + '] ' + m.text);
}
function startChatType() {
  const inp = document.getElementById('chatInput');
  if (!inp) return;
  showChatPanel();
  if (chatReadIndex >= 0 && chatMessages[chatReadIndex]) {
    const m = chatMessages[chatReadIndex];
    chatReplyTo = m.from + ': ' + m.text.slice(0, 28);
    inp.placeholder = 'ตอบ [' + m.from + '] ...';
    announce('ตอบ [' + m.from + '] — พิมพ์แล้วกด Enter\n(Esc ยกเลิก)');
  } else {
    chatReplyTo = null;
    inp.placeholder = 'พิมพ์ข้อความแล้วกด Enter...';
    announce('พิมพ์แชท — พิมพ์แล้วกด Enter เพื่อส่ง\n(Esc ยกเลิก)');
  }
  setTimeout(function() { inp.focus(); }, 50);
}
function sendChat() {
  const inp = document.getElementById('chatInput');
  if (!inp) return;
  const msg = (inp.value || '').trim();
  if (!msg) {
    hideChatPanel();
    return;
  }
  chatMessages.push({
    from: 'คุณ',
    text: msg,
    replyTo: chatReplyTo || null
  });
  saveChat();
  chatReadIndex = chatMessages.length - 1;
  chatReplyTo = null;
  inp.value = '';
  inp.placeholder = 'พิมพ์แชทแล้วกด Enter...';
  renderChatLog();
  playSfx('chat');
  announce('ส่งแล้ว: ' + msg);
  hideChatPanel();
  if (Math.random() < 0.4) {
    setTimeout(function() {
      const npcs = [
        ['นักเดินทาง', 'เดินทางปลอดภัยนะ'],
        ['พ่อค้า', 'แวะร้านในเมืองได้เสมอ'],
        ['นักรบ', 'ลานประลองรอท้าทายอยู่'],
        ['ระบบ', 'ข้อความถูกส่งสู่โลกไตรภูมิ']
      ];
      const n = npcs[Math.floor(Math.random()*npcs.length)];
      chatMessages.push({ from: n[0], text: n[1] });
      saveChat();
    }, 900);
  }
}
function cancelChat() {
  const inp = document.getElementById('chatInput');
  chatReplyTo = null;
  if (inp) {
    inp.value = '';
    inp.placeholder = 'พิมพ์แชทแล้วกด Enter...';
  }
  hideChatPanel();
  announce('ยกเลิกแชท');
}
