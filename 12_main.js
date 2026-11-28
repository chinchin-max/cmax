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
  // ถ้าโฟกัสหลุด (ยกเว้นตอนพิมพ์แชท / เปิดเมนูหรือแผงเสียง) ให้ดึงกลับ
  body.addEventListener('blur', function() {
    setTimeout(function() {
      if (typeof mode !== 'undefined' && mode === 'settings') return;
      const ae = document.activeElement;
      if (ae && (ae.id === 'chatInput' || ae.id === 'chatCloseBtn' || ae.id === 'volCloseBtn' || ae.id === 'volTestBtn')) return;
      if (ae && ae.classList && (ae.classList.contains('mc-btn') || ae.classList.contains('a11y-option') || ae.classList.contains('vol-btn'))) return;
      if (ae && ae.closest && (ae.closest('#a11yListPanel') || ae.closest('#volumePanel') || ae.closest('#mobileControls'))) return;
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
      if (typeof mode !== 'undefined' && mode === 'settings') return;
      const ae = document.activeElement;
      // อย่าแย่งโฟกัสจากปุ่มมือถือ / แผงเสียง / แผงรายการ / chat
      if (ae && ae.classList && (ae.classList.contains('mc-btn') || ae.classList.contains('vol-btn') || ae.classList.contains('a11y-option'))) return;
      if (ae && ae.closest && (ae.closest('#mobileControls') || ae.closest('#volumePanel') || ae.closest('#a11yListPanel'))) return;
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
```[cite: 44, 45]

ครบทั้ง 2 ไฟล์ที่ต้องปรับให้ตรงกันแล้วครับ สามารถนำไปเซฟทับได้เลยครับ หากลองเล่นบนมือถือหรือคอมแล้วติดตรงไหนอีก แจ้งมาได้เลยครับ
คำตอบดี
คำตอบแย่
ทำซ้ำ
แชร์และส่งออก
คัดลอก
แสดงตัวเลือกเพิ่มเติม
Gemini เป็น AI และอาจทำผิดพลาดได้
เลื่อนไปที่ด้านล่าง
โปรดทราบ
Gemini เป็น AI และอาจทำผิดพลาดได้ แชทจะได้รับการตรวจสอบและนำไปใช้เพื่อฝึกโมเดล Generative AI ดูข้อมูลเกี่ยวกับตัวเลือกของคุณ ระบบจะบันทึกข้อมูลเกี่ยวกับตำแหน่งของคุณไว้ในประวัติการใช้ Gemini ด้วย การใช้งานต้องเป็นไปตามข้อกำหนดและประกาศเกี่ยวกับนโยบายความเป็นส่วนตัวของเรา
ปิด
อัปโหลดและเครื่องมือ
ถาม Gemini

พิมพ์ตามคำบอก (^⇧D)
แชทใหม่
เปิดเมนูสําหรับการดําเนินการที่เกี่ยวกับการสนทนา
 