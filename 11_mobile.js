// Mobile accessible controls (TalkBack / VoiceOver เหมือน NVDA)
// ============================================================
let dirHold = null; // { dr, dc }
let dirInterval = null;

function isTouchDevice() {
  return ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
}

function showMobileControls() {
  const el = document.getElementById('mobileControls');
  if (!el) return;
  // แสดงบนมือถือเสมอ และบนจอแคบ — เพื่อให้ TalkBack ใช้ปุ่มได้
  if (isTouchDevice() || window.innerWidth < 900) {
    el.style.display = 'block';
    el.classList.add('visible');
    const help = document.getElementById('helpText');
    if (help) {
      help.textContent = 'ปุ่มขึ้นลงซ้ายขวา = เดิน (กดค้างได้) · ยืนยัน/กลับ/ค้นหามอน/คลัง';
    }
  }
}

let gameStarted = false;

function startGame() {
  if (gameStarted) {
    focusGame();
    return;
  }
  gameStarted = true;
  const screen = document.getElementById('startScreen');
  if (screen) screen.classList.add('hidden');
  showMobileControls();
  startBGM();
  const body = document.getElementById('gameBody');
  if (body) {
    body.setAttribute('tabindex', '0');
    body.focus({ preventScroll: true });
  }
  playSfx('confirm');
  announce("เกมเริ่มแล้ว!");
  focusGame();
  setTimeout(focusGame, 50);
  setTimeout(focusGame, 150);
  setTimeout(focusGame, 400);
}

// ดึงโฟกัสกลับเกมทุกครั้งที่มี interaction (ยกเว้นพิมพ์แชท)
function lockFocusOnInteraction(e) {
  const t = e.target;
  if (t && (t.id === 'chatInput' || t.id === 'chatCloseBtn' || t.id === 'startBtn')) return;
  if (t && t.closest && t.closest('#chatPanel') && t.tagName === 'INPUT') return;
  if (!gameStarted) {
    startGame();
    return;
  }
  focusGame();
}

function dirFromName(name) {
  if (name === 'up') return { dr: -1, dc: 0 };
  if (name === 'down') return { dr: 1, dc: 0 };
  if (name === 'left') return { dr: 0, dc: -1 };
  if (name === 'right') return { dr: 0, dc: 1 };
  return { dr: 0, dc: 0 };
}

function applyDirection(dr, dc) {
  if (mode === 'explore') {
    move(dr, dc);
  } else if (mode === 'shop' || mode === 'catch_select' || mode === 'arena_select' || mode === 'battle' || mode === 'inventory' || mode === 'inventory_action' || mode === 'inventory_feed_select' || mode === 'inventory_evo_select') {
    if (dr === -1) menuMove(-1);
    else if (dr === 1) menuMove(1);
  }
}

function startDirHold(dr, dc) {
  dirHold = { dr: dr, dc: dc };
  applyDirection(dr, dc); // กดครั้งแรกทำทันที
  if (dirInterval) clearInterval(dirInterval);
  dirInterval = setInterval(function() {
    if (!dirHold) return;
    applyDirection(dirHold.dr, dirHold.dc);
  }, MOVE_COOLDOWN);
}

function stopDirHold() {
  dirHold = null;
  if (dirInterval) {
    clearInterval(dirInterval);
    dirInterval = null;
  }
}

// ปุ่มทิศทาง 4 ทิศ — กดครั้งเดียวหรือกดค้าง (รองรับ TalkBack)
function setupJoystick() {
  document.querySelectorAll('.mc-dir[data-dir]').forEach(function(btn) {
    const dir = dirFromName(btn.getAttribute('data-dir'));

    function onDown(e) {
      // ไม่ preventDefault ทุกกรณี — ให้ TalkBack เปิดใช้งานปุ่มได้
      if (e.type === 'touchstart') e.preventDefault();
      startBGM();
      btn.classList.add('pressed');
      startDirHold(dir.dr, dir.dc);
    }
    function onUp(e) {
      btn.classList.remove('pressed');
      stopDirHold();
    }
    function onClick(e) {
      // TalkBack มักส่ง click แทน touch — เดินทีละก้าว
      e.preventDefault();
      startBGM();
      applyDirection(dir.dr, dir.dc);
    }

    btn.addEventListener('touchstart', onDown, { passive: false });
    btn.addEventListener('touchend', onUp);
    btn.addEventListener('touchcancel', onUp);
    btn.addEventListener('mousedown', onDown);
    btn.addEventListener('mouseup', onUp);
    btn.addEventListener('mouseleave', onUp);
    btn.addEventListener('click', onClick);
  });
}

function setupActionButtons() {
  document.querySelectorAll('.mc-btn[data-action]').forEach(function(btn) {
    const action = btn.getAttribute('data-action');
    function fire(e) {
      e.preventDefault();
      e.stopPropagation();
      startBGM();
      btn.classList.add('pressed');
      setTimeout(function() { btn.classList.remove('pressed'); }, 120);

      if (action === 'enter') {
        if (mode === 'explore') tryInteract();
        else handleConfirm();
      } else if (action === 'esc') {
        handleEsc();
      } else if (action === 'c') {
        if (mode === 'explore') startSearch();
      } else if (action === 'i') {
        if (mode === 'explore') showInventory();
        else if (mode === 'inventory' || mode === 'inventory_action' || mode === 'inventory_feed_select' || mode === 'inventory_evo_select') handleEsc();
      } else if (action === 'b') {
        if (mode === 'explore') checkCurrentPosition();
      } else if (action === 'm') {
        if (mode === 'explore') {
          announce(
            "=== เมนูช่วยเหลือ ===\n\n" +
            "มือถือ + โปรแกรมอ่านจอ:\n" +
            "ปุ่ม ขึ้น ลง ซ้าย ขวา = เดิน (กดค้างได้)\n" +
            "ในเมนู: ขึ้น/ลง = เลือกรายการ\n\n" +
            "ยืนยัน = เปิดร้าน / เลือกเมนู\n" +
            "กลับ = ยกเลิก / หนี\n" +
            "ค้นหามอน = หาสัตว์ป่า (นอกเมือง)\n" +
            "คลัง = ดูสัตว์เลี้ยง\n" +
            "พิกัด = ดูตำแหน่งปัจจุบัน\n\n" +
            "ในเมือง (เดินไปยืนแล้วกดยืนยัน):\n" +
            "แถว 49 หลัก 51 = ร้านลูกบอล\n" +
            "แถว 51 หลัก 49 = ร้านอาหาร\n" +
            "แถว 53 หลัก 51 = ร้านหิน\n" +
            "แถว 51 หลัก 51 = ลานประลอง\n" +
            "แถว 51 หลัก 53 = ศูนย์ข้อมูล"
          );
        }
      }
      // หลังใช้คำสั่ง ให้โฟกัสกลับพื้นที่เกม (role=application)
      setTimeout(focusGame, 30);
    }
    btn.addEventListener('click', fire);
    btn.addEventListener('touchend', function(e) {
      // กัน double-fire กับ click บนบางเครื่อง
      if (e.cancelable) e.preventDefault();
      fire(e);
    }, { passive: false });
  });
}
