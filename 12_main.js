// แตะที่พื้นที่เกมเพื่อโฟกัส — เก็บโฟกัสไว้ตลอด
function setupFocusOnTap() {
  const body = document.getElementById('gameBody');
  if (!body) return;
  body.addEventListener('click', function(e) {
    if (e.target && (e.target.id === 'chatInput' || e.target.id === 'chatCloseBtn')) return;
    if (e.target && e.target.closest && e.target.closest('#chatPanel') && e.target.tagName === 'INPUT') return;
    focusGame();
    startBGM();
  });
  // ถ้าโฟกัสหลุด (ยกเว้นตอนพิมพ์แชท) ให้ดึงกลับ
  body.addEventListener('blur', function() {
    setTimeout(function() {
      const ae = document.activeElement;
      if (ae && (ae.id === 'chatInput' || ae.id === 'chatCloseBtn')) return;
      if (ae && ae.classList && (ae.classList.contains('mc-btn') || ae.classList.contains('a11y-option'))) return;
      if (ae && ae.closest && ae.closest('#a11yListPanel')) return;
      focusGame();
    }, 0);
  });
  const closeBtn = document.getElementById('chatCloseBtn');
  if (closeBtn) {
    closeBtn.addEventListener('click', function(e) {
      e.preventDefault();
      hideChatPanel();
    });
  }
  focusGame();
  setTimeout(focusGame, 50);
  setTimeout(focusGame, 200);
  setTimeout(focusGame, 500);
}

window.onload = function() {
  loadGame();
  loadChat();
  if (chatMessages.length) chatReadIndex = chatMessages.length - 1;
  setupJoystick();
  setupActionButtons();
  if (typeof setupSheetBack === 'function') setupSheetBack();
  if (typeof setupVolumePanel === 'function') setupVolumePanel();
  setupFocusOnTap();

  // ปุ่มเริ่มเกม (ถ้ายังแสดงอยู่)
  const startBtn = document.getElementById('startBtn');
  if (startBtn) {
    startBtn.addEventListener('click', function(e) {
      e.preventDefault();
      startGame();
    });
    startBtn.addEventListener('touchend', function(e) {
      e.preventDefault();
      startGame();
    }, { passive: false });
  }

  // interaction ใดๆ = เริ่มเกม + ล็อกโฟกัส
  document.addEventListener('pointerdown', lockFocusOnInteraction, true);
  document.addEventListener('keydown', function(e) {
    if (!gameStarted) {
      startGame();
    } else {
      const inp = document.getElementById('chatInput');
      if (inp && document.activeElement === inp) return;
      const ae = document.activeElement;
      // อย่าแย่งโฟกัสจากปุ่มมือถือ / chat
      if (ae && ae.classList && ae.classList.contains('mc-btn')) return;
      if (ae && ae.closest && ae.closest('#mobileControls')) return;
      // คงโฟกัสที่เกมไว้ตลอดตอนเล่น (เดสก์ท็อป)
      const body = document.getElementById('gameBody');
      if (body && document.activeElement !== body && document.activeElement !== inp) {
        body.focus({ preventScroll: true });
      }
    }
  }, true);

  // ===== เข้าโหมดโฟกัสอัตโนมัติตอนเปิดเกม =====
  // เรียก startGame ทันที (ไม่ต้องรอคลิก)
  startGame();

  // โฟกัสซ้ำหลายรอบ — บางเบราว์เซอร์รับหลัง paint
  requestAnimationFrame(function() {
    if (!(('ontouchstart' in window) || (navigator.maxTouchPoints > 0))) {
      focusGame();
      setTimeout(focusGame, 100);
    }
  });

  // ถ้ากลับมาแท็บนี้ ให้โฟกัสใหม่
  document.addEventListener('visibilitychange', function() {
    if (!document.hidden && gameStarted) focusGame();
  });
  window.addEventListener('focus', function() {
    if (gameStarted) focusGame();
  });
};
