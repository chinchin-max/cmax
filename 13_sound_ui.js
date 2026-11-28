// ============================================================
// 13. แผง UI ตั้งค่าเสียง (Slider + ปุ่มขั้น + คีย์บอร์ด/Screen Reader)
// ============================================================
(function() {
  const PANEL_ID = 'volumePanel';
  const STYLE_ID = 'volumePanelStyle';

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      #${PANEL_ID} {
        display: none;
        margin: 14px 0;
        padding: 16px;
        border: 2px solid #444;
        border-radius: 10px;
        background: #14171f;
        color: #f3f5f8;
        font-family: inherit;
      }
      #${PANEL_ID}.is-open {
        display: block;
      }
      #${PANEL_ID} .vp-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
        gap: 8px;
      }
      #${PANEL_ID} .vp-title {
        margin: 0;
        font-size: 1.15rem;
      }
      #${PANEL_ID} .vp-close {
        padding: 6px 12px;
        border: 1px solid #888;
        border-radius: 6px;
        background: #252a36;
        color: #fff;
        cursor: pointer;
      }
      #${PANEL_ID} .vp-row {
        padding: 10px 12px;
        margin-bottom: 10px;
        border-radius: 8px;
        background: #1d2230;
        border: 1px solid transparent;
      }
      #${PANEL_ID} .vp-row.is-selected {
        border-color: #6ea8fe;
        background: #242b3d;
      }
      #${PANEL_ID} .vp-row-top {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 6px;
        gap: 8px;
        flex-wrap: wrap;
      }
      #${PANEL_ID} .vp-controls {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      #${PANEL_ID} input[type="range"] {
        flex: 1;
        min-width: 140px;
        cursor: pointer;
      }
      #${PANEL_ID} .vp-btn {
        min-width: 34px;
        padding: 4px 10px;
        border: 1px solid #6c757d;
        border-radius: 6px;
        background: #2c3344;
        color: #fff;
        cursor: pointer;
      }
      #${PANEL_ID} .vp-presets {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-top: 12px;
      }
      #${PANEL_ID} .vp-hint {
        margin-top: 10px;
        font-size: 0.9rem;
        color: #b8c2d4;
      }
    `;
    document.head.appendChild(style);
  }

  function ensurePanelElement() {
    injectStyles();
    let panel = document.getElementById(PANEL_ID);
    if (panel) return panel;

    panel = document.createElement('section');
    panel.id = PANEL_ID;
    panel.setAttribute('aria-label', 'แผงตั้งค่าเสียง');
    panel.innerHTML = `
      <div class="vp-header">
        <h2 class="vp-title">ตั้งค่าเสียง</h2>
        <button type="button" class="vp-close" id="vpCloseBtn" aria-label="ปิดตั้งค่าเสียง">ปิด (Esc)</button>
      </div>
      <div id="vpRows"></div>
      <div class="vp-presets" role="group" aria-label="ระดับเสียงรวมทั้งหมด">
        <button type="button" class="vp-btn" data-master="0">ปิดเสียงทั้งหมด (0%)</button>
        <button type="button" class="vp-btn" data-master="0.25">เบา (25%)</button>
        <button type="button" class="vp-btn" data-master="0.5">ปานกลาง (50%)</button>
        <button type="button" class="vp-btn" data-master="0.75">ค่อนข้างดัง (75%)</button>
        <button type="button" class="vp-btn" data-master="1">ดังสุด (100%)</button>
      </div>
      <p class="vp-hint">
        เลื่อนสไลเดอร์เพื่อปรับค่าโดยตรง หรือกดปุ่ม + / − / Enter เพื่อปรับเป็นขั้น · กด Esc เพื่อปิด
      </p>
    `;

    const displayEl = document.getElementById('display');
    if (displayEl && displayEl.parentNode) {
      displayEl.parentNode.insertBefore(panel, displayEl.nextSibling);
    } else {
      document.body.appendChild(panel);
    }

    bindPanelEvents(panel);
    return panel;
  }

  function buildRowsHtml() {
    const channels = (typeof AUDIO_CHANNELS !== 'undefined') ? AUDIO_CHANNELS : ['bgm', 'sfx', 'ambient'];
    const names = (typeof AUDIO_CHANNEL_NAMES !== 'undefined')
      ? AUDIO_CHANNEL_NAMES
      : { bgm: 'เพลงพื้นหลัง (BGM)', sfx: 'เอฟเฟกต์เสียง (SFX)', ambient: 'เสียงบรรยากาศ (Ambient)' };

    return channels.map(function(ch, idx) {
      const val = (typeof audioSettings !== 'undefined' && typeof audioSettings[ch] === 'number')
        ? audioSettings[ch]
        : 0.5;
      const pct = Math.round(val * 100);
      const labelTxt = (typeof volumeLabel === 'function') ? volumeLabel(val) : (pct + '%');
      const selectedClass = (typeof menuCursor !== 'undefined' && menuCursor === idx) ? ' is-selected' : '';

      return `
        <div class="vp-row${selectedClass}" data-channel="${ch}" data-index="${idx}">
          <div class="vp-row-top">
            <label for="vpSlider_${ch}"><strong>${names[ch] || ch}</strong></label>
            <span id="vpVal_${ch}">${labelTxt}</span>
          </div>
          <div class="vp-controls">
            <button type="button" class="vp-btn vp-dec" data-ch="${ch}" aria-label="ลดเสียง ${names[ch] || ch}">−</button>
            <input
              type="range"
              id="vpSlider_${ch}"
              class="vp-slider"
              data-ch="${ch}"
              min="0"
              max="100"
              step="5"
              value="${pct}"
              aria-label="${names[ch] || ch}"
            />
            <button type="button" class="vp-btn vp-inc" data-ch="${ch}" aria-label="เพิ่มเสียง ${names[ch] || ch}">+</button>
          </div>
        </div>
      `;
    }).join('');
  }

  function syncPanelUI(noticeText) {
    const panel = ensurePanelElement();
    const rowsContainer = document.getElementById('vpRows');
    if (!rowsContainer) return;

    rowsContainer.innerHTML = buildRowsHtml();

    if (noticeText && typeof speakOnly === 'function') {
      // ไม่ซ้ำกับ renderSoundSettings ที่เรียก speakOnly อยู่แล้ว
    }
    panel.classList.toggle('is-open', typeof mode !== 'undefined' && mode === 'settings');
  }

  function bindPanelEvents(panel) {
    const closeBtn = document.getElementById('vpCloseBtn');
    if (closeBtn) {
      closeBtn.addEventListener('click', function() {
        closeVolumePanel();
        if (typeof announce === 'function') announce('ปิดตั้งค่าเสียง');
      });
    }

    panel.addEventListener('input', function(e) {
      const target = e.target;
      if (!target || !target.classList || !target.classList.contains('vp-slider')) return;
      const ch = target.getAttribute('data-ch');
      const rawPct = Number(target.value);
      if (typeof setAudioChannelVolume === 'function') {
        setAudioChannelVolume(ch, rawPct / 100);
      }
      const valSpan = document.getElementById('vpVal_' + ch);
      if (valSpan && typeof volumeLabel === 'function') {
        valSpan.textContent = volumeLabel(rawPct / 100);
      }
      if (typeof speakOnly === 'function') {
        const chName = (typeof AUDIO_CHANNEL_NAMES !== 'undefined' && AUDIO_CHANNEL_NAMES[ch]) || ch;
        speakOnly(chName + ' ' + rawPct + ' เปอร์เซ็นต์');
      }
    });

    panel.addEventListener('click', function(e) {
      const target = e.target;
      if (!target || !target.classList) return;

      if (target.classList.contains('vp-dec')) {
        const ch = target.getAttribute('data-ch');
        if (typeof stepChannelVolume === 'function') {
          stepChannelVolume(ch, -1);
          if (typeof playSfx === 'function') playSfx('confirm');
          if (typeof renderSoundSettings === 'function') {
            const chName = (typeof AUDIO_CHANNEL_NAMES !== 'undefined' && AUDIO_CHANNEL_NAMES[ch]) || ch;
            renderSoundSettings(false, chName + ' เป็น ' + volumeLabel(audioSettings[ch]));
          }
        }
        return;
      }

      if (target.classList.contains('vp-inc')) {
        const ch = target.getAttribute('data-ch');
        if (typeof stepChannelVolume === 'function') {
          stepChannelVolume(ch, 1);
          if (typeof playSfx === 'function') playSfx('confirm');
          if (typeof renderSoundSettings === 'function') {
            const chName = (typeof AUDIO_CHANNEL_NAMES !== 'undefined' && AUDIO_CHANNEL_NAMES[ch]) || ch;
            renderSoundSettings(false, chName + ' เป็น ' + volumeLabel(audioSettings[ch]));
          }
        }
        return;
      }

      if (target.hasAttribute('data-master')) {
        const masterVal = Number(target.getAttribute('data-master'));
        if (typeof setAllAudioVolume === 'function') {
          setAllAudioVolume(masterVal);
          if (typeof playSfx === 'function') playSfx('confirm');
          const msg = 'ตั้งเสียงทั้งหมดเป็น ' + Math.round(masterVal * 100) + '%';
          if (typeof renderSoundSettings === 'function') {
            renderSoundSettings(false, msg);
          } else {
            syncPanelUI();
          }
        }
      }
    });
  }

  // ผูกครอบ renderSoundSettings เดิมให้ซิงก์สไลเดอร์และปุ่มในแผง UI ทุกครั้งที่อัปเดต
  const originalRenderSoundSettings = (typeof window.renderSoundSettings === 'function')
    ? window.renderSoundSettings
    : null;

  window.renderSoundSettings = function(isOpen, noticeText) {
    if (originalRenderSoundSettings) {
      originalRenderSoundSettings(isOpen, noticeText);
    }
    syncPanelUI(noticeText);
  };

  const originalOpenSoundSettings = (typeof window.openSoundSettings === 'function')
    ? window.openSoundSettings
    : null;

  window.openSoundSettings = function() {
    ensurePanelElement();
    if (originalOpenSoundSettings) {
      originalOpenSoundSettings();
    } else {
      mode = 'settings';
      menuCursor = 0;
      window.renderSoundSettings(true);
    }
    syncPanelUI();
  };

  window.closeVolumePanel = function() {
    const panel = document.getElementById(PANEL_ID);
    if (panel) panel.classList.remove('is-open');
    if (typeof mode !== 'undefined' && mode === 'settings') {
      mode = 'explore';
      menuOptions = [];
    }
    if (typeof hideA11yList === 'function') hideA11yList();
    if (typeof focusGame === 'function') focusGame();
  };

  // เตรียมแผงไว้ตั้งแต่โหลดหน้า (ซ่อนอยู่จนกว่าจะเปิด)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ensurePanelElement);
  } else {
    ensurePanelElement();
  }
})();