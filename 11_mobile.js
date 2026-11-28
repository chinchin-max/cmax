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
  if (isTouchDevice() || window.innerWidth < 900) {
    el.style.display = 'block';
    el.classList.add('visible');
    el.classList.add('force-show');
    const help = document.getElementById('helpText');
    if (help) {
      help.textContent = 'ปุ่มขึ้นลงซ้ายขวา = เดิน (กดค้างได้) · ยืนยัน/กลับ/ค้นหามอน/คลัง';
    }
  }
}

function setActiveTab(tab) {
  document.querySelectorAll('.tab-btn').forEach(function(btn) {
    var on = btn.getAttribute('data-tab') === tab;
    btn.classList.toggle('active', on);
    btn.setAttribute('aria-selected', on ? 'true' : 'false');
  });
}

function updateMobileControlsForMode() {
  var inMenu = (typeof isMenuMode === 'function') ? isMenuMode() : (
    mode === 'shop' || mode === 'catch_select' || mode === 'arena_select' ||
    mode === 'battle' || mode === 'inventory' || mode === 'inventory_action' ||
    mode === 'inventory_feed_select' || mode === 'inventory_evo_select' ||
    mode === 'settings'
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
    var vp = document.getElementById('volumePanel');
    if (vp) {
      vp.style.display = 'none';
      vp.classList.remove('visible');
    }
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

function lockFocusOnInteraction(e) {
  const t = e.target;
  if (t && (t.id === 'chatInput' || t.id === 'chatCloseBtn' || t.id === 'startBtn')) return;
  if (t && t.closest && t.closest('#chatPanel') && t.tagName === 'INPUT') return;
  if (t && t.closest && t.closest('#mobileControls')) return;
  if (t && t.closest && t.closest('#a11yListPanel')) return;
  if (t && t.closest && t.closest('#volumePanel')) return;
  if (t && t.classList && (t.classList.contains('mc-btn') || t.classList.contains('a11y-option') || t.classList.contains('vol-btn'))) return;
  if (!gameStarted) {
    startGame();
    return;
  }
  if (typeof mode !== 'undefined' && mode === 'settings') return;
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
    if (dr === -1 || dc === -1) menuMove(-1);
    else if (dr === 1 || dc === 1) menuMove(1);
  }
}

function startDirHold(dr, dc) {
  dirHold = { dr: dr, dc: dc };
  applyDirection(dr, dc);
  if (dirInterval) clearInterval(dirInterval);
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

function isMenuMode() {
  return mode === 'shop' || mode === 'catch_select' || mode === 'arena_select' ||
    mode === 'battle' || mode === 'inventory' || mode === 'inventory_action' ||
    mode === 'inventory_feed_select' || mode === 'inventory_evo_select' ||
    mode === 'settings';
}

function enterListNavigation(title) {
  if (typeof updateMobileControlsForMode === 'function') updateMobileControlsForMode();
  if (mode === 'settings') return;
  if (typeof syncA11yList === 'function') {
    syncA11yList(title || menuTitle || 'รายการ', true);
  }
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
  if (mode === 'settings') {
    hideA11yList();
    return;
  }
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
        btn.addEventListener('focus', function() {
          var idx = parseInt(this.getAttribute('data-index'), 10);
          if (isNaN(idx) || idx === menuCursor) return;
          menuCursor = idx;
          window._a11yQuiet = true;
          try {
            if (mode === 'inventory') renderInventoryMenu(false);
            else if (mode === 'shop') renderMenu(menuTitle || 'ร้านค้า', null, false);
            else if (mode === 'catch_select' || mode === 'arena_select') renderPetSelectMenu(menuTitle);
            else if (mode === 'battle') renderBattleMenu();
            else if (mode === 'inventory_action') renderInvActionMenu(false);
            else if (mode === 'inventory_feed_select') renderFeedSelectMenu(false);
            else if (mode === 'inventory_evo_select') renderEvoSelectMenu(false);
          } finally {
            window._a11yQuiet = false;
          }
        });

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
          var now = Date.now();
          if (btn._lastAct && now - btn._lastAct < 350) return;
          btn._lastAct = now;
          var idx = parseInt(btn.getAttribute('data-index'), 10);
          if (isNaN(idx)) return;
          menuCursor = idx;
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

  var activeId = '';
  for (var i = 0; i < list.children.length; i++) {
    var el = list.children[i];
    var selected = (i === menuCursor);
    el.setAttribute('aria-selected', selected ? 'true' : 'false');
    if (selected) {
      activeId = el.id;
      if (preferFocus && !el.disabled) {
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
    function onUp() {
      btn.classList.remove('pressed');
      stopDirHold();
    }
    function onClick(e) {
      e.preventDefault();
      if (usedTouch) {
        usedTouch = false;
        return;
      }
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
          if (mode === 'settings' && typeof closeVolumePanel === 'function') closeVolumePanel();
          mode = 'explore';
          menuOptions = [];
          if (typeof hideA11yList === 'function') hideA11yList();
          if (typeof updateMobileControlsForMode === 'function') updateMobileControlsForMode();
        }
        startSearch();
        setActiveTab('search');
      } else if (action === 'i' || action === 'tab-bag') {
        if (mode === 'settings' && typeof closeVolumePanel === 'function') closeVolumePanel();
        if (mode === 'inventory' || mode === 'inventory_action' || mode === 'inventory_feed_select' || mode === 'inventory_evo_select') {
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
          if (typeof closeVolumePanel === 'function') closeVolumePanel();
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
        if (typeof openSoundSettings === 'function') openSoundSettings();
      }
      if (!isTouchDevice() && mode !== 'settings') {
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