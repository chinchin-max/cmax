// ============================================================
// 9. ระบบแชทและสนทนา (Tri-Monster Chat & Dialogue System)
// ============================================================
const CHAT_KEY = 'tri_monster_chat_v2';
let chatMessages = [];
let chatReadIndex = -1;
let chatReplyTo = null;
let chatSpeakerTarget = 'ทั่วไป'; // 'ทั่วไป' | 'นักเดินทาง' | 'พ่อค้า' | 'นักรบ'

const QUICK_DIALOGUES = [
  'สวัสดีชาวไตรภูมิ',
  'มีใครอยู่แถวนี้ไหม',
  'กำลังหาสัตว์ป่าไปฝึก',
  'ขอคำแนะนำเรื่องการประลองหน่อย'
];

function loadChat() {
  try {
    chatMessages = JSON.parse(localStorage.getItem(CHAT_KEY) || '[]');
  } catch (e) {
    chatMessages = [];
  }
  if (!Array.isArray(chatMessages) || !chatMessages.length) {
    chatMessages = [
      {
        from: 'ระบบ',
        text: 'ยินดีต้อนรับสู่ระบบสนทนาโลกไตรภูมิ กด / เพื่อพิมพ์ [ และ ] เพื่อไล่อ่านข้อความ',
        time: getNowTimeStr()
      }
    ];
    saveChat();
  }
}

function saveChat() {
  try {
    if (chatMessages.length > 100) {
      chatMessages = chatMessages.slice(-100);
    }
    localStorage.setItem(CHAT_KEY, JSON.stringify(chatMessages));
  } catch (e) {}
}

function getNowTimeStr() {
  try {
    const d = new Date();
    return d.toTimeString().slice(0, 5);
  } catch (e) {
    return '';
  }
}

function renderChatLog() {
  const log = document.getElementById('chatLog');
  if (!log) return;
  let t = '';
  chatMessages.forEach(function(m, i) {
    const cursor = (i === chatReadIndex) ? '▶ ' : '  ';
    const timePart = m.time ? ' (' + m.time + ')' : '';
    const replyPart = m.replyTo ? ' [ตอบ: ' + m.replyTo + ']' : '';
    t += cursor + '[' + m.from + ']' + timePart + replyPart + ': ' + m.text + '\n';
  });
  log.textContent = t || '(ยังไม่มีข้อความ)';
  log.scrollTop = log.scrollHeight;
}

function focusGame() {
  const inp = document.getElementById('chatInput');
  if (inp && document.activeElement === inp) return;

  const ae = document.activeElement;
  if (ae && ae.classList && ae.classList.contains('a11y-option')) return;
  if (ae && ae.closest && ae.closest('#a11yListPanel')) return;

  const panel = document.getElementById('a11yListPanel');
  const touch = (typeof isTouchDevice === 'function')
    ? isTouchDevice()
    : (('ontouchstart' in window) || (navigator.maxTouchPoints > 0));
  if (panel && panel.classList.contains('visible') && touch) return;

  if (inp) inp.blur();

  const body = document.getElementById('gameBody');
  if (body) {
    body.setAttribute('tabindex', '0');
    if (touch) body.removeAttribute('role');
    else body.setAttribute('role', 'application');
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

function readChatAt(index, prefixLabel) {
  if (!chatMessages.length) {
    announce('ยังไม่มีข้อความในแชท');
    return;
  }
  chatReadIndex = Math.max(0, Math.min(chatMessages.length - 1, index));
  showChatPanel();
  const m = chatMessages[chatReadIndex];
  const replyTxt = m.replyTo ? ' ตอบกลับ ' + m.replyTo : '';
  announce(
    (prefixLabel || 'อ่านข้อความ') + ' (' + (chatReadIndex + 1) + '/' + chatMessages.length + ')' +
    replyTxt + '\n[' + m.from + ']: ' + m.text
  );
}

function chatReadPrev() {
  if (!chatMessages.length) return;
  const nextIdx = (chatReadIndex < 0) ? (chatMessages.length - 1) : Math.max(0, chatReadIndex - 1);
  readChatAt(nextIdx, 'ข้อความก่อนหน้า');
}

function chatReadNext() {
  if (!chatMessages.length) return;
  const nextIdx = (chatReadIndex < 0) ? 0 : Math.min(chatMessages.length - 1, chatReadIndex + 1);
  readChatAt(nextIdx, 'ข้อความถัดไป');
}

function chatReadLatest() {
  if (!chatMessages.length) return;
  readChatAt(chatMessages.length - 1, 'ข้อความล่าสุด');
}

function cycleChatTarget() {
  const targets = ['ทั่วไป', 'นักเดินทาง', 'พ่อค้า', 'นักรบ'];
  const idx = targets.indexOf(chatSpeakerTarget);
  chatSpeakerTarget = targets[(idx + 1) % targets.length];
  playSfx('menu');
  announce('เปลี่ยนคู่สนทนาเป็น: ' + chatSpeakerTarget);
}

function startChatType(prefillText) {
  const inp = document.getElementById('chatInput');
  if (!inp) return;
  showChatPanel();

  if (typeof prefillText === 'string' && prefillText.length > 0) {
    inp.value = prefillText;
  }

  if (chatReadIndex >= 0 && chatMessages[chatReadIndex]) {
    const m = chatMessages[chatReadIndex];
    chatReplyTo = m.from + ': ' + m.text.slice(0, 30);
    inp.placeholder = 'ตอบ [' + m.from + '] (ช่องทาง: ' + chatSpeakerTarget + ')...';
    announce('กำลังตอบ [' + m.from + '] ถึง ' + chatSpeakerTarget + ' — พิมพ์แล้วกด Enter, Esc ยกเลิก');
  } else {
    chatReplyTo = null;
    inp.placeholder = 'พิมพ์ข้อความถึง [' + chatSpeakerTarget + '] แล้วกด Enter...';
    announce('เริ่มพิมพ์แชทถึง ' + chatSpeakerTarget + ' — กด Enter เพื่อส่ง, Esc ยกเลิก');
  }

  setTimeout(function() {
    inp.focus();
  }, 40);
}

function buildSmartNpcReply(userMsg, zoneName) {
  const txt = userMsg.toLowerCase();
  const inCity = zoneName && zoneName.includes('เมืองหลวง');

  if (txt.includes('สวัสดี') || txt.includes('หวัดดี') || txt.includes('ทัก')) {
    return ['นักเดินทาง', 'สวัสดีครับ ขอให้การเดินทางใน' + (zoneName || 'โลกไตรภูมิ') + 'ราบรื่นนะ'];
  }
  if (txt.includes('บอล') || txt.includes('อาหาร') || txt.includes('หิน') || txt.includes('ซื้อ') || txt.includes('เงิน')) {
    return ['พ่อค้า', inCity
      ? 'อยู่ในเมืองหลวงพอดี แวะร้านลูกบอล ร้านอาหารสัตว์ หรือร้านหินวิวัฒนาการได้เลยครับ'
      : 'ถ้าอยากซื้อของเติมเสบียง กลับเข้าเมืองหลวงไตรภูมิได้เลยครับ'];
  }
  if (txt.includes('ประลอง') || txt.includes('สู้') || txt.includes('เก่ง') || txt.includes('ธาตุ')) {
    return ['นักรบ', 'เลือกสกิลธาตุให้ชนะทางศัตรู และอย่าลืมปั้นเลเวลสัตว์เลี้ยงให้ถึง 12 เพื่อวิวัฒนาการด้วยล่ะ'];
  }
  if (txt.includes('จับ') || txt.includes('มอน') || txt.includes('ป่า') || txt.includes('เขา') || txt.includes('ทะเล')) {
    return ['นักเดินทาง', inCity
      ? 'เมืองหลวงเป็นเขตปลอดภัย เดินออกนอกเมืองหรือกด C เพื่อค้นหาสัตว์ป่าได้เลย'
      : 'ระวังตัวด้วยนะ ตอนนี้คุณอยู่โซน ' + zoneName + ' เจอตัวที่ถูกใจก็โยนบอลจับได้เลย'];
  }

  const fallbackPool = [
    ['นักเดินทาง', 'เดินทางปลอดภัยนะ อย่าลืมเช็คเลือดสัตว์เลี้ยงก่อนลุยต่อ'],
    ['พ่อค้า', 'มีของดีพร้อมขายในเมืองหลวงเสมอ แวะมาดูได้ครับ'],
    ['นักรบ', 'ลานประลองกลางเมืองพร้อมรับคำท้าเสมอ'],
    ['ระบบ', 'ข้อความของคุณถูกส่งไปยังชุมชนโลกไตรภูมิแล้ว']
  ];
  return fallbackPool[Math.floor(Math.random() * fallbackPool.length)];
}

function sendChat(customText) {
  const inp = document.getElementById('chatInput');
  const raw = (typeof customText === 'string') ? customText : (inp ? inp.value : '');
  const msg = (raw || '').trim();

  if (!msg) {
    hideChatPanel();
    return;
  }

  chatMessages.push({
    from: 'คุณ → ' + chatSpeakerTarget,
    text: msg,
    replyTo: chatReplyTo || null,
    time: getNowTimeStr()
  });
  saveChat();

  chatReadIndex = chatMessages.length - 1;
  chatReplyTo = null;
  if (inp) {
    inp.value = '';
    inp.placeholder = 'พิมพ์ข้อความถึง [' + chatSpeakerTarget + '] แล้วกด Enter...';
  }

  renderChatLog();
  playSfx('chat');
  announce('ส่งข้อความแล้ว: ' + msg);
  hideChatPanel();

  // ตอบกลับอัตโนมัติแบบมีบริบทโซนและคีย์เวิร์ด
  setTimeout(function() {
    const currentZone = (typeof getZoneName === 'function' && typeof r === 'number' && typeof c === 'number')
      ? getZoneName(r, c)
      : 'เมืองหลวงไตรภูมิ';
    const reply = buildSmartNpcReply(msg, currentZone);
    chatMessages.push({
      from: reply[0],
      text: reply[1],
      time: getNowTimeStr()
    });
    saveChat();
    renderChatLog();
    playSfx('chat');
    speakOnly(reply[0] + ' ตอบว่า: ' + reply[1]);
  }, 850);
}

function sendQuickDialogue(index) {
  const line = QUICK_DIALOGUES[index];
  if (!line) return;
  sendChat(line);
}

function cancelChat() {
  const inp = document.getElementById('chatInput');
  chatReplyTo = null;
  if (inp) {
    inp.value = '';
    inp.placeholder = 'พิมพ์ข้อความถึง [' + chatSpeakerTarget + '] แล้วกด Enter...';
  }
  hideChatPanel();
  announce('ยกเลิกการพิมพ์แชท');
}

function clearChatHistory() {
  chatMessages = [
    { from: 'ระบบ', text: 'ล้างประวัติแชทเรียบร้อยแล้ว', time: getNowTimeStr() }
  ];
  chatReadIndex = 0;
  chatReplyTo = null;
  saveChat();
  renderChatLog();
  announce('ล้างประวัติแชทแล้ว');
}