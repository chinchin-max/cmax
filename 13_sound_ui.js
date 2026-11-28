// ============================================================
// 13. แผงตั้งค่าเสียงแบบปุ่มตรง (ผูกกับ #volumePanel เดิม)
// ============================================================
(function() {
  const PANEL_ID = 'volumePanel';

  function pctText(v) {
    return Math.round(clampVolume(v) * 100) + '%';
  }

  function refreshVolumePanelUI() {
    if (typeof audioSettings === 'undefined') return;
    var bgmEl = document.getElementById('volBgmVal');
    var sfxEl = document.getElementById('volSfxVal');
    var ambEl = document.getElementById('volAmbVal');

    if (bgmEl) {
      bgmEl.textContent = pctText(audioSettings.bgm);
      bgmEl.setAttribute('aria-label', 'เพลงพื้นหลัง ' + volumeLabel(audioSettings.bgm) + ' แตะเพื่อเพิ่ม');
    }
    if (sfxEl) {
      sfxEl.textContent = pctText(audioSettings.sfx);
      sfxEl.setAttribute('aria-label', 'เอฟเฟกต์ ' + volumeLabel(audioSettings.sfx) + ' แตะเพื่อเพิ่ม');
    }
    if (ambEl) {
      ambEl.textContent = pctText(audioSettings.ambient);
      ambEl.setAttribute('aria-label', 'บรรยากาศ ' + volumeLabel(audioSettings.ambient) + ' แตะเพื่อเพิ่ม');
    }
  }

  function adjustChannel(kind, dir) {
    if (typeof audioSettings === 'undefined' || typeof stepChannelVolume !== 'function') return;
    stepChannelVolume(kind, dir);
    refreshVolumePanelUI();

    if (kind === 'bgm' && typeof startBGM === 'function') startBGM();
    if (kind === 'sfx' && typeof playSfx === 'function') playSfx('confirm');
    else if (typeof playSfx === 'function') playSfx('menu');

    var label = kind === 'bgm' ? 'เพลงพื้นหลัง' : kind === 'sfx' ? 'เอฟเฟกต์' : 'บรรยากาศ';
    var val = audioSettings[kind];
    if (typeof speakOnly === 'function') {
      speakOnly(label + '. ' + volumeLabel(val));
    }
    var disp = document.getElementById('display');
    if (disp) {
      disp.innerText =
        '=== ตั้งค่าเสียง ===\n\n' +
        'เพลงพื้นหลัง: ' + volumeLabel(audioSettings.bgm) + '\n' +
        'เสียงเอฟเฟกต์: ' + volumeLabel(audioSettings.sfx) + '\n' +
        'เสียงบรรยากาศ: ' + volumeLabel(audioSettings.ambient) + '\n\n' +
        'กด + / − เพื่อปรับ · ปิด เพื่อออก';
    }
  }

  function bindVolumePanelEvents() {
    var panel = document.getElementById(PANEL_ID);
    if (!panel || panel._vpBound) return;
    panel._vpBound = true;

    function bind(el, fn) {
      if (!el) return;
      var last = 0;
      function fire(e) {
        if (e) { e.preventDefault(); e.stopPropagation(); }
        var now = Date.now();
        if (now - last < 200) return;
        last = now;
        if (typeof startBGM === 'function') startBGM();
        fn(e);
      }
      el.addEventListener('click', fire);
      el.addEventListener('touchend', fire, { passive: false });
    }

    panel.querySelectorAll('.vol-btn[data-vol]').forEach(function(btn) {
      bind(btn, function() {
        var kind = btn.getAttribute('data-vol');
        var dir = parseInt(btn.getAttribute('data-dir'), 10) || 1;
        adjustChannel(kind, dir);
      });
    });

    bind(document.getElementById('volTestBtn'), function() {
      if (typeof playSfx === 'function') {
        playSfx('hit');
        setTimeout(function() { playSfx('win'); }, 180);
      }
      if (typeof speakOnly === 'function') speakOnly('ทดลองเสียง');
    });

    bind(document.getElementById('volCloseBtn'), function() {
      window.closeVolumePanel();
      if (typeof announce === 'function') announce('ปิดตั้งค่าเสียง');
    });
  }

  window.setupVolumePanel = function() {
    bindVolumePanelEvents();
    refreshVolumePanelUI();
  };

  window.openSoundSettings = function() {
    bindVolumePanelEvents();
    mode = 'settings';
    menuOptions = [];
    if (typeof hideA11yList === 'function') hideA11yList();
    if (typeof updateMobileControlsForMode === 'function') updateMobileControlsForMode();

    var panel = document.getElementById(PANEL_ID);
    if (panel) {
      panel.style.display = 'block';
      panel.classList.add('visible');
      panel.removeAttribute('aria-hidden');
    }
    refreshVolumePanelUI();
    if (typeof speakOnly === 'function') {
      speakOnly('ตั้งค่าเสียง. ใช้ปุ่มลดหรือเพิ่มเพื่อปรับระดับ');
    }
    var first = document.querySelector('#volumePanel .vol-btn');
    if (first) {
      try { first.focus(); } catch (e) {}
    }
  };

  window.closeVolumePanel = function() {
    var panel = document.getElementById(PANEL_ID);
    if (panel) {
      panel.style.display = 'none';
      panel.classList.remove('visible');
      panel.setAttribute('aria-hidden', 'true');
    }
    if (typeof mode !== 'undefined' && mode === 'settings') {
      mode = 'explore';
      menuOptions = [];
    }
    if (typeof updateMobileControlsForMode === 'function') updateMobileControlsForMode();
    if (typeof setActiveTab === 'function') setActiveTab('map');
    if (typeof focusGame === 'function') focusGame();
  };

  window.renderSoundSettings = function() {
    refreshVolumePanelUI();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', window.setupVolumePanel);
  } else {
    window.setupVolumePanel();
  }
})();