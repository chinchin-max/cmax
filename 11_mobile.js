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
    el.classList.add('force-show'); // กัน media query ซ่อนบนจอบางเครื่อง
    const help = document.getElementById('helpText');
    if (help) {
      help.textContent = 'ปุ่มขึ้นลงซ้ายขวา = เดิน (กดค้างได้) · ยืนยัน/กลับ/ค้นหามอน/คลัง';
    }
  }
}


// ปรับป้ายปุ่มมือถือให้ตรงโหมด — TalkBack/VoiceOver อ่านแล้วรู้ว่ากดแล้วได้อะไร
function setActiveTab(tab) {
  document.querySelectorAll('.tab-btn').forEach(function(btn) {
    var on = btn.getAttribute('data-tab') === tab;
    btn.classList.toggle('active', on);
    btn.setAttribute('aria-selected', on ? 'true' : 'false');
  });
}

// ปรับ UI ตามโหมด — หน้าสำรวจมีปุ่มเดิน / หน้าเมนูมีลิสต์รายการ
function updateMobileControlsForMode() {
  var inMenu = (typeof isMenuMode === 'function') ? isMenuMode() : (
    mode === 'shop' || mode === 'catch_select' || mode === 'arena_select' ||
    mode === 'battle' || mode === 'inventory' || mode === 'inventory_action' ||
    mode === 'inventory_feed_select' || mode === 'inventory_evo_select'
  );

  if (inMenu) {
    document.body.classList.add('mode-menu');
    if (mode === 'inventory' || mode.indexOf('inventory') === 0) setActiveTab('bag');
    else if (mode === 'settings') setActiveTab('more');
    else setActiveTab('map');
  } else {
    document.body.classList.remove('mode-menu');
    setActiveTab('map');
    if (typeof hideA11yList === 'function') hideA11yList();
  }

  var hint = document.getElementById('mobileHint');
  if (hint) {
    if (inMenu) hint.textContent = 'แตะรายการด้านบนเพื่อเลือก · แท็บด้านล่างสลับหน้า';
    else hint.textContent = 'แท็บด้านล่าง: แผนที่ · คลัง · ค้นหา · เมนู';
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
  if (typeof updateMobileControlsForMode === 'function') updateMobileControlsForMode();
  if (!isTouchDevice()) {
    focusGame();
    setTimeout(focusGame, 100);
  }
}

// ดึงโฟกัสกลับเกมทุกครั้งที่มี interaction (ยกเว้นพิมพ์แชท)
function lockFocusOnInteraction(e) {
  const t = e.target;
  if (t && (t.id === 'chatInput' || t.id === 'chatCloseBtn' || t.id === 'startBtn')) return;
  if (t && t.closest && t.closest('#chatPanel') && t.tagName === 'INPUT') return;
  // อย่าแย่งโฟกัสจากปุ่มควบคุมมือถือ — สำคัญสำหรับ TalkBack/VoiceOver
  if (t && t.closest && t.closest('#mobileControls')) return;
  if (t && t.closest && t.closest('#a11yListPanel')) return;
  if (t && t.classList && (t.classList.contains('mc-btn') || t.classList.contains('a11y-option'))) return;
  if (!gameStarted) {
    startGame();
    return;
  }
  // บนมือถือไม่บังคับโฟกัสกลับทันที (กันปุ่มกดไม่ได้)
  if (isTouchDevice()) return;
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
  } else if (mode === 'shop' || mode === 'catch_select' || mode === 'arena_select' || mode === 'battle' || mode === 'inventory' || mode === 'inventory_action' || mode === 'inventory_feed_select' || mode === 'inventory_evo_select' || mode === 'settings') {
    // ขึ้น/ซ้าย = ก่อนหน้า, ลง/ขวา = ถัดไป (สะดวกกับ TalkBack)
    if (dr === -1 || dc === -1) menuMove(-1);
    else if (dr === 1 || dc === 1) menuMove(1);
  }
}

function startDirHold(dr, dc) {
  dirHold = { dr: dr, dc: dc };
  applyDirection(dr, dc); // กดครั้งแรกทำทันที
  if (dirInterval) clearInterval(dirInterval);
  // ในเมนู: ไม่เลื่อนค้าง — ให้อ่านทีละรายการชัด ๆ แบบ NVDA
  var inMenu = (mode === 'shop' || mode === 'catch_select' || mode === 'arena_select' ||
    mode === 'battle' || mode === 'inventory' || mode === 'inventory_action' ||
    mode === 'inventory_feed_select' || mode === 'inventory_evo_select' || mode === 'settings');
  if (inMenu) return;
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

function rereadCurrentMenuItem() {
  if (!menuOptions || !menuOptions.length) {
    speakOnly('ไม่มีรายการ');
    return;
  }
  var opt = menuOptions[menuCursor];
  if (!opt) {
    speakOnly('ไม่มีรายการ');
    return;
  }
  var line = opt.speak || opt.label || opt.nameLine || '';
  var total = menuOptions.filter(function(o) { return o.kind !== 'separator'; }).length;
  var pos = 0;
  for (var i = 0; i <= menuCursor && i < menuOptions.length; i++) {
    if (menuOptions[i].kind !== 'separator') pos++;
  }
  if (opt.kind === 'separator') {
    speakOnly(line || 'หมวด');
  } else {
    speakOnly(pos + ' จาก ' + total + '. ' + line);
  }
}


// ============================================================
// รายการเข้าถึงได้ (TalkBack / VoiceOver ปัดซ้ายขวาได้จริง)
// ============================================================
function isMenuMode() {
  return mode === 'shop' || mode === 'catch_select' || mode === 'arena_select' ||
    mode === 'battle' || mode === 'inventory' || mode === 'inventory_action' ||
    mode === 'inventory_feed_select' || mode === 'inventory_evo_select' ||
    mode === 'settings';
}


// เข้าโหมดปัดรายการ — ซ่อนการพึ่งปุ่มเดิน โฟกัสรายการแรกให้ TalkBack
function enterListNavigation(title) {
  if (typeof updateMobileControlsForMode === 'function') updateMobileControlsForMode();
  if (typeof syncA11yList === 'function') {
    syncA11yList(title || menuTitle || 'รายการ', true);
  }
  // โฟกัสซ้ำหลายรอบ กันถูกแย่งโฟกัสตอนเปิดแผง
  var tries = 0;
  function focusFirst() {
    tries++;
    var list = document.getElementById('a11yList');
    if (!list) return;
    var el = null;
    for (var i = 0; i < list.children.length; i++) {
      if (!list.children[i].disabled) { el = list.children[i]; break; }
    }
    if (!el && menuCursor >= 0 && list.children[menuCursor]) el = list.children[menuCursor];
    if (el) {
      try { el.focus({ preventScroll: true }); } catch (e) { try { el.focus(); } catch (e2) {} }
    } else if (tries < 6) {
      setTimeout(focusFirst, 50);
    }
  }
  setTimeout(focusFirst, 20);
  setTimeout(focusFirst, 100);
}

function hideA11yList() {
  var panel = document.getElementById('a11yListPanel');
  if (panel) {
    panel.style.display = 'none';
    panel.classList.remove('visible');
    panel.setAttribute('aria-hidden', 'true');
  }
  var list = document.getElementById('a11yList');
  if (list) list.innerHTML = '';
}

function syncA11yList(titleText, preferFocus) {
  var panel = document.getElementById('a11yListPanel');
  var list = document.getElementById('a11yList');
  var titleEl = document.getElementById('a11yListTitle');
  if (!panel || !list) return;

  if (!isMenuMode() || !menuOptions || !menuOptions.length) {
    hideA11yList();
    return;
  }

  panel.style.display = 'block';
  panel.classList.add('visible');
  panel.removeAttribute('aria-hidden');
  if (titleEl) titleEl.textContent = titleText || menuTitle || 'รายการ';

  // สร้างปุ่มรายการใหม่เฉพาะเมื่อจำนวน/เนื้อหาเปลี่ยน
  var needRebuild = list.children.length !== menuOptions.length;
  if (!needRebuild) {
    for (var i = 0; i < menuOptions.length; i++) {
      var opt = menuOptions[i];
      var btn = list.children[i];
      var label = opt.speak || opt.label || opt.nameLine || '';
      if (!btn || btn.getAttribute('data-label') !== label) {
        needRebuild = true;
        break;
      }
    }
  }

  if (needRebuild) {
    list.innerHTML = '';
    menuOptions.forEach(function(opt, i) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'a11y-option' + (opt.kind === 'separator' ? ' separator' : '');
      btn.id = 'a11y-opt-' + i;
      btn.setAttribute('role', 'option');
      if (opt.kind !== 'separator') btn.setAttribute('tabindex', '0');
      var label = opt.speak || opt.label || opt.nameLine || ('รายการ ' + (i + 1));
      btn.setAttribute('data-label', label);
      btn.setAttribute('data-index', String(i));
      if (opt.kind === 'separator') {
        btn.textContent = opt.nameLine || opt.label || '---';
        btn.disabled = true;
        btn.setAttribute('aria-disabled', 'true');
      } else {
        // เมื่อ TalkBack ปัดมาโฟกัสรายการนี้ — อัปเดต cursor + ไฮไลต์ ไม่ยืนยันทันที
        btn.addEventListener('focus', function() {
          var idx = parseInt(this.getAttribute('data-index'), 10);
          if (isNaN(idx) || idx === menuCursor) return;
          menuCursor = idx;
          // TalkBack อ่านป้ายปุ่มเองแล้ว — อย่า speakOnly ซ้ำ
          window._a11yQuiet = true;
          try {
            if (mode === 'inventory') renderInventoryMenu(false);
            else if (mode === 'shop') renderMenu(menuTitle || 'ร้านค้า', null, false);
            else if (mode === 'catch_select' || mode === 'arena_select') renderPetSelectMenu(menuTitle);
            else if (mode === 'battle') renderBattleMenu();
            else if (mode === 'inventory_action') renderInvActionMenu(false);
            else if (mode === 'inventory_feed_select') renderFeedSelectMenu(false);
            else if (mode === 'inventory_evo_select') renderEvoSelectMenu(false);
            else if (mode === 'settings') renderSoundSettings(false);
          } finally {
            window._a11yQuiet = false;
          }
        });

        // ใส่ลำดับให้ TalkBack อ่านชัด
        var pos = 0, total = 0;
        for (var j = 0; j < menuOptions.length; j++) {
          if (menuOptions[j].kind !== 'separator') total++;
        }
        for (var j = 0; j <= i; j++) {
          if (menuOptions[j].kind !== 'separator') pos++;
        }
        btn.textContent = pos + ' จาก ' + total + '. ' + label;
        function activateOption(e) {
          if (e) { e.preventDefault(); e.stopPropagation(); }
          // กันแตะซ้ำ touchend+click
          var now = Date.now();
          if (btn._lastAct && now - btn._lastAct < 350) return;
          btn._lastAct = now;
          var idx = parseInt(btn.getAttribute('data-index'), 10);
          if (isNaN(idx)) return;
          menuCursor = idx;
          if (mode === 'settings') {
            // ทางลัด: ปรับเสียงตรง ๆ ไม่ผ่าน handleConfirm ซ้อน
            if (typeof handleSoundSetting === 'function') {
              handleSoundSetting(menuOptions[idx].id);
            }
            return;
          }
          if (mode === 'inventory') renderInventoryMenu(false);
          else if (mode === 'shop') renderMenu(menuTitle || 'ร้านค้า', null, false);
          else if (mode === 'catch_select' || mode === 'arena_select') renderPetSelectMenu(menuTitle);
          else if (mode === 'battle') renderBattleMenu();
          else if (mode === 'inventory_action') renderInvActionMenu(false);
          else if (mode === 'inventory_feed_select') renderFeedSelectMenu(false);
          else if (mode === 'inventory_evo_select') renderEvoSelectMenu(false);
          if (typeof handleConfirm === 'function') handleConfirm();
          if (mode === 'explore') {
            if (typeof hideA11yList === 'function') hideA11yList();
            if (typeof updateMobileControlsForMode === 'function') updateMobileControlsForMode();
          }
        }
        btn.addEventListener('click', activateOption);
        btn.addEventListener('touchend', activateOption, { passive: false });
      }
      list.appendChild(btn);
    });
  }

  // ตั้ง selected + focus ตาม menuCursor
  var activeId = '';
  for (var i = 0; i < list.children.length; i++) {
    var el = list.children[i];
    var selected = (i === menuCursor);
    el.setAttribute('aria-selected', selected ? 'true' : 'false');
    if (selected) {
      activeId = el.id;
      if (preferFocus && !el.disabled) {
        // โฟกัสรายการเพื่อให้ TalkBack ปัดต่อได้ทันที ไม่ต้องไปที่ปุ่มเดิน
        try { el.focus({ preventScroll: true }); } catch (e) { try { el.focus(); } catch (e2) {} }
      }
    }
  }
  if (activeId) list.setAttribute('aria-activedescendant', activeId);
}

function focusA11ySelected() {
  var list = document.getElementById('a11yList');
  if (!list) return;
  var el = list.children[menuCursor];
  if (el && !el.disabled) {
    try { el.focus({ preventScroll: false }); } catch (e) { try { el.focus(); } catch (e2) {} }
  }
}

function setupJoystick() {
  document.querySelectorAll('.mc-dir[data-dir]').forEach(function(btn) {
    const dir = dirFromName(btn.getAttribute('data-dir'));
    let usedTouch = false;

    function onDown(e) {
      // ไม่ preventDefault ทุกกรณี — ให้ TalkBack เปิดใช้งานปุ่มได้
      if (e.type === 'touchstart') {
        usedTouch = true;
        e.preventDefault();
      } else {
        usedTouch = false;
      }
      startBGM();
      btn.classList.add('pressed');
      startDirHold(dir.dr, dir.dc);
    }
    function onUp(e) {
      btn.classList.remove('pressed');
      stopDirHold();
    }
    function onClick(e) {
      e.preventDefault();
      // ถ้าเพิ่งใช้ touch ไปแล้ว อย่าเดินซ้ำจาก click
      if (usedTouch) {
        usedTouch = false;
        return;
      }
      // TalkBack / เมาส์: เดินทีละก้าว
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
  document.querySelectorAll('.mc-btn[data-action], .tab-btn[data-action]').forEach(function(btn) {
    const action = btn.getAttribute('data-action');
    let lastFire = 0;
    function fire(e) {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      // กันกดซ้ำจาก touchend + click
      const now = Date.now();
      if (now - lastFire < 120) return;
      lastFire = now;

      startBGM();
      btn.classList.add('pressed');
      setTimeout(function() { btn.classList.remove('pressed'); }, 120);

      if (action === 'enter') {
        if (mode === 'explore') tryInteract();
        else handleConfirm();
      } else if (action === 'esc') {
        handleEsc();
      } else if (action === 'c' || action === 'tab-search') {
        if (mode !== 'explore') {
          mode = 'explore';
          menuOptions = [];
          if (typeof hideA11yList === 'function') hideA11yList();
          if (typeof updateMobileControlsForMode === 'function') updateMobileControlsForMode();
        }
        startSearch();
        setActiveTab('search');
      } else if (action === 'i' || action === 'tab-bag') {
        if (mode === 'inventory' || mode === 'inventory_action' || mode === 'inventory_feed_select' || mode === 'inventory_evo_select') {
          /* อยู่คลังแล้ว — กลับหน้าแรกของคลัง */
          showInventory();
        } else {
          if (mode !== 'explore' && mode !== 'inventory') {
            mode = 'explore';
            battleState = null;
            menuOptions = [];
          }
          showInventory();
        }
        setActiveTab('bag');
      } else if (action === 'b') {
        if (mode === 'explore') checkCurrentPosition();
        else if (typeof rereadCurrentMenuItem === 'function') rereadCurrentMenuItem();
      } else if (action === 'tab-map') {
        if (mode !== 'explore') {
          mode = 'explore';
          battleState = null;
          menuOptions = [];
          if (typeof hideA11yList === 'function') hideA11yList();
          announce('กลับสู่หน้าแผนที่');
        }
        setActiveTab('map');
        if (typeof updateMobileControlsForMode === 'function') updateMobileControlsForMode();
      } else if (action === 'm' || action === 'tab-more') {
        setActiveTab('more');
        openSoundSettings();
      }
      // หลังใช้คำสั่ง: เดสก์ท็อปดึงโฟกัสกลับเกม / มือถือปล่อยไว้ที่ปุ่ม (TalkBack)
      if (!isTouchDevice()) {
        setTimeout(focusGame, 30);
      }
    }
    btn.addEventListener('click', fire);
    btn.addEventListener('touchend', function(e) {
      if (e.cancelable) e.preventDefault();
      fire(e);
    }, { passive: false });
  });
}


function setupSheetBack() {
  var btn = document.getElementById('sheetBackBtn');
  if (!btn) return;
  btn.addEventListener('click', function(e) {
    e.preventDefault();
    if (typeof handleEsc === 'function') handleEsc();
    if (typeof updateMobileControlsForMode === 'function') updateMobileControlsForMode();
  });
}


// ===== เมนูตั้งค่าเสียง =====
function openSoundSettings() {
  mode = 'settings';
  menuCursor = 0;
  menuTitle = 'ตั้งค่าเสียง';
  buildSoundSettingsOptions();
  if (typeof updateMobileControlsForMode === 'function') updateMobileControlsForMode();
  renderSoundSettings(true);
  // บังคับโชว์แผง + สร้างปุ่มใหม่เสมอ
  var panel = document.getElementById('a11yListPanel');
  var list = document.getElementById('a11yList');
  if (list) list.innerHTML = '';
  if (typeof syncA11yList === 'function') syncA11yList('ตั้งค่าเสียง', true);
  if (panel) {
    panel.style.display = 'block';
    panel.style.visibility = 'visible';
    panel.style.pointerEvents = 'auto';
    panel.style.zIndex = '6000';
    panel.classList.add('visible');
    panel.removeAttribute('aria-hidden');
  }
  if (typeof enterListNavigation === 'function') enterListNavigation('ตั้งค่าเสียง');
  speakOnly('ตั้งค่าเสียง. แตะรายการเพื่อปรับระดับเสียง');
}

function buildSoundSettingsOptions() {
  menuOptions = [
    { id: 'bgm', label: 'เพลงพื้นหลัง: ' + volumeLabel(audioSettings.bgm), speak: 'เพลงพื้นหลัง. ' + volumeLabel(audioSettings.bgm) + '. แตะเพื่อเปลี่ยนระดับ' },
    { id: 'sfx', label: 'เสียงเอฟเฟกต์: ' + volumeLabel(audioSettings.sfx), speak: 'เสียงเอฟเฟกต์. ' + volumeLabel(audioSettings.sfx) + '. แตะเพื่อเปลี่ยนระดับ' },
    { id: 'ambient', label: 'เสียงบรรยากาศ: ' + volumeLabel(audioSettings.ambient), speak: 'เสียงบรรยากาศ. ' + volumeLabel(audioSettings.ambient) + '. แตะเพื่อเปลี่ยนระดับ' },
    { id: 'test', label: 'ทดลองเสียงเอฟเฟกต์', speak: 'ทดลองเสียงเอฟเฟกต์' },
    { id: 'back', label: 'กลับ', speak: 'กลับ' }
  ];
}

function renderSoundSettings(isOpen) {
  var t = '=== ตั้งค่าเสียง ===\n\n';
  menuOptions.forEach(function(opt, i) {
    t += (i === menuCursor ? '▶ ' : '  ') + opt.label + '\n';
  });
  t += '\nแตะรายการเพื่อปรับระดับ · กลับเพื่อออก';
  announce(t, false);
  if (menuOptions[menuCursor]) {
    var line = menuOptions[menuCursor].speak || menuOptions[menuCursor].label;
    if (isOpen) speakOnly('ตั้งค่าเสียง. ' + line);
    else speakOnly(line);
  }
  if (typeof syncA11yList === 'function') syncA11yList('ตั้งค่าเสียง', !!isOpen);
}

function handleSoundSetting(id) {
  function refreshSettingsList() {
    buildSoundSettingsOptions();
    renderSoundSettings(false);
    // บังคับสร้างปุ่มใหม่เพราะป้ายระดับเสียงเปลี่ยน
    var list = document.getElementById('a11yList');
    if (list) list.innerHTML = '';
    if (typeof syncA11yList === 'function') syncA11yList('ตั้งค่าเสียง', true);
  }
  if (id === 'bgm') {
    audioSettings.bgm = nextVolume(audioSettings.bgm);
    applyAudioSettings();
    saveAudioSettings();
    if (typeof startBGM === 'function') startBGM();
    playSfx('menu');
    refreshSettingsList();
    speakOnly('เพลงพื้นหลัง. ' + volumeLabel(audioSettings.bgm));
  } else if (id === 'sfx') {
    audioSettings.sfx = nextVolume(audioSettings.sfx);
    applyAudioSettings();
    saveAudioSettings();
    playSfx('confirm');
    refreshSettingsList();
    speakOnly('เสียงเอฟเฟกต์. ' + volumeLabel(audioSettings.sfx));
  } else if (id === 'ambient') {
    audioSettings.ambient = nextVolume(audioSettings.ambient);
    applyAudioSettings();
    saveAudioSettings();
    playSfx('menu');
    refreshSettingsList();
    speakOnly('เสียงบรรยากาศ. ' + volumeLabel(audioSettings.ambient));
  } else if (id === 'test') {
    playSfx('hit');
    setTimeout(function() { playSfx('win'); }, 200);
    speakOnly('ทดลองเสียง');
  } else if (id === 'back') {
    mode = 'explore';
    menuOptions = [];
    if (typeof hideA11yList === 'function') hideA11yList();
    if (typeof updateMobileControlsForMode === 'function') updateMobileControlsForMode();
    if (typeof setActiveTab === 'function') setActiveTab('map');
    announce('ปิดตั้งค่าเสียง');
  }
}
