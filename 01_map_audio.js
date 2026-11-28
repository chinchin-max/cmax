// ============================================================
// 1. แผนที่ + เสียง
// ============================================================
const size = 100;
let r = 49;
let c = 49;
let lastMoveTime = 0;
const MOVE_COOLDOWN = 900; // มิลลิวินาที (ยิ่งมากยิ่งเดินช้า)

function createSafeAudio(src, options) {
  const opts = options || {};
  const audio = new Audio();
  audio.preload = opts.preload || 'metadata';
  audio.loop = !!opts.loop;
  if (typeof opts.volume === 'number') {
    audio.volume = Math.max(0, Math.min(1, opts.volume));
  }
  audio.addEventListener('error', function() {
    audio.dataset.loadError = '1';
  }, { once: true });
  audio.src = src;
  return audio;
}

function safePlayAudio(audioEl, resetTime) {
  if (!audioEl || (audioEl.dataset && audioEl.dataset.loadError === '1')) return;
  try {
    if (resetTime) audioEl.currentTime = 0;
    const p = audioEl.play();
    if (p && typeof p.catch === 'function') p.catch(function() {});
  } catch (e) {}
}

const bgm = createSafeAudio('music-bg.wav', { loop: true, volume: 0.40 });

const sounds = {
  // เดิน
  grass:    [createSafeAudio('step_grass1.wav'), createSafeAudio('step_grass2.wav'), createSafeAudio('step_grass3.wav')],
  mountain: [createSafeAudio('step_mountain.wav')],
  stone:    [createSafeAudio('step_stone1.wav'), createSafeAudio('step_stone2.wav')],
  dirt:     [createSafeAudio('step_dirt1.wav'), createSafeAudio('step_dirt2.wav')],
  water:    [createSafeAudio('step_water1.wav'), createSafeAudio('step_water2.wav')],
  wall:     createSafeAudio('wall_hit.wav'),
  edge:     createSafeAudio('edge_hit.wav'),
  // ambient
  ocean:    createSafeAudio('ocean_ambient.wav', { loop: true, preload: 'none', volume: 0.35 }),
  forest:   createSafeAudio('forest_ambient.wav', { loop: true, preload: 'none', volume: 0.42 }),
  // ต่อสู้ / มอน
  encounter: createSafeAudio('sfx_encounter.wav'),
  attack:    createSafeAudio('sfx_attack.wav'),
  hit:       createSafeAudio('sfx_hit.wav'),
  miss:      createSafeAudio('sfx_miss.wav'),
  win:       createSafeAudio('sfx_win.wav'),
  lose:      createSafeAudio('sfx_lose.wav'),
  flee:      createSafeAudio('sfx_flee.wav'),
  // บอล
  throw_ball: createSafeAudio('sfx_throw_ball.wav'),
  catch_ok:   createSafeAudio('sfx_catch_ok.wav'),
  catch_fail: createSafeAudio('sfx_catch_fail.wav'),
  // ร้าน / คลัง
  shop_open:  createSafeAudio('sfx_shop_open.wav'),
  buy:        createSafeAudio('sfx_buy.wav'),
  no_money:   createSafeAudio('sfx_no_money.wav'),
  sell:       createSafeAudio('sfx_sell.wav'),
  feed:       createSafeAudio('sfx_feed.wav'),
  evolve:     createSafeAudio('sfx_evolve.wav'),
  menu:       createSafeAudio('sfx_menu.wav'),
  // อื่นๆ
  chat:       createSafeAudio('sfx_chat.wav'),
  error:      createSafeAudio('sfx_error.wav'),
  confirm:    createSafeAudio('sfx_confirm.wav')
};

Object.values(sounds).forEach(item => {
  if (Array.isArray(item)) item.forEach(s => s.volume = 0.45);
  else if (item === sounds.ocean || item === sounds.forest) { /* set below */ }
  else item.volume = 0.55;
});
sounds.ocean.loop = true;  sounds.ocean.volume = 0.35;
sounds.forest.loop = true; sounds.forest.volume = 0.42;
['encounter','win','evolve','catch_ok'].forEach(function(k) {
  if (sounds[k]) sounds[k].volume = 0.65;
});

// ===== ระดับเสียง (บันทึก localStorage) — ใช้ได้ทั้งแบบขั้น (steps) และแบบค่าตรง (0.0 - 1.0) =====
const STORAGE_KEY_VOLUME = 'tri_monster_volume_v1';
const VOLUME_STEPS = [0, 0.25, 0.5, 0.75, 1];
const VOLUME_LABELS = ['ปิด', 'เบา', 'ปานกลาง', 'ค่อนข้างดัง', 'ดังสุด'];
const AUDIO_CHANNELS = ['bgm', 'sfx', 'ambient'];
const AUDIO_CHANNEL_NAMES = {
  bgm: 'เพลงพื้นหลัง (BGM)',
  sfx: 'เอฟเฟกต์เสียง (SFX)',
  ambient: 'เสียงบรรยากาศ (Ambient)'
};

var audioSettings = {
  bgm: 0.4,
  sfx: 0.55,
  ambient: 0.35
};

function clampVolume(v) {
  var num = Number(v);
  if (isNaN(num)) return 0;
  return Math.max(0, Math.min(1, num));
}

function loadAudioSettings() {
  try {
    var raw = localStorage.getItem(STORAGE_KEY_VOLUME);
    if (!raw) return;
    var o = JSON.parse(raw);
    if (typeof o.bgm === 'number') audioSettings.bgm = clampVolume(o.bgm);
    if (typeof o.sfx === 'number') audioSettings.sfx = clampVolume(o.sfx);
    if (typeof o.ambient === 'number') audioSettings.ambient = clampVolume(o.ambient);
  } catch (e) {}
}

function saveAudioSettings() {
  try {
    localStorage.setItem(STORAGE_KEY_VOLUME, JSON.stringify(audioSettings));
  } catch (e) {}
}

function volumeLabel(v) {
  var val = clampVolume(v);
  var best = 0, bestDiff = 99;
  for (var i = 0; i < VOLUME_STEPS.length; i++) {
    var d = Math.abs(VOLUME_STEPS[i] - val);
    if (d < bestDiff) { bestDiff = d; best = i; }
  }
  return VOLUME_LABELS[best] + ' ' + Math.round(val * 100) + '%';
}

function nearestStepIndex(v) {
  var val = clampVolume(v);
  var idx = 0, bestDiff = 99;
  for (var i = 0; i < VOLUME_STEPS.length; i++) {
    var d = Math.abs(VOLUME_STEPS[i] - val);
    if (d < bestDiff) { bestDiff = d; idx = i; }
  }
  return idx;
}

function nextVolume(v) {
  var idx = nearestStepIndex(v);
  return VOLUME_STEPS[(idx + 1) % VOLUME_STEPS.length];
}

function stepChannelVolume(channel, deltaStep) {
  if (AUDIO_CHANNELS.indexOf(channel) === -1) return audioSettings;
  var curIdx = nearestStepIndex(audioSettings[channel]);
  var nextIdx = Math.max(0, Math.min(VOLUME_STEPS.length - 1, curIdx + (deltaStep || 1)));
  return setAudioChannelVolume(channel, VOLUME_STEPS[nextIdx]);
}

function setAudioChannelVolume(channel, value) {
  if (AUDIO_CHANNELS.indexOf(channel) === -1) return audioSettings;
  audioSettings[channel] = clampVolume(value);
  applyAudioSettings();
  saveAudioSettings();
  return audioSettings;
}

function setAllAudioVolume(value) {
  var v = clampVolume(value);
  audioSettings.bgm = v;
  audioSettings.sfx = v;
  audioSettings.ambient = v;
  applyAudioSettings();
  saveAudioSettings();
  return audioSettings;
}

function applyAudioSettings() {
  try {
    if (bgm) {
      bgm.volume = clampVolume(audioSettings.bgm);
    }
  } catch (e) {}

  var sfxVol = clampVolume(audioSettings.sfx);
  var ambVol = clampVolume(audioSettings.ambient);

  Object.keys(sounds).forEach(function(k) {
    var item = sounds[k];
    if (k === 'ocean' || k === 'forest') {
      if (item) item.volume = ambVol;
      return;
    }
    if (Array.isArray(item)) {
      item.forEach(function(s) { s.volume = clampVolume(sfxVol * 0.85); });
    } else if (item) {
      item.volume = sfxVol;
    }
  });

  ['encounter','win','evolve','catch_ok'].forEach(function(k) {
    if (sounds[k]) sounds[k].volume = clampVolume(sfxVol * 1.15);
  });
}

function buildSoundMenuOptions() {
  return AUDIO_CHANNELS.map(function(ch) {
    var labelName = AUDIO_CHANNEL_NAMES[ch] || ch;
    var lbl = volumeLabel(audioSettings[ch]);
    return {
      id: ch,
      label: labelName + ': ' + lbl,
      speak: labelName + ' ' + lbl
    };
  });
}

function renderSoundSettings(isOpen, noticeText) {
  menuOptions = buildSoundMenuOptions();
  if (menuCursor < 0 || menuCursor >= menuOptions.length) menuCursor = 0;

  var t = '=== ตั้งค่าเสียง ===\n';
  if (noticeText) t += '[' + noticeText + ']\n';
  t += '\n';

  menuOptions.forEach(function(opt, i) {
    var mark = (i === menuCursor) ? '▶ ' : '  ';
    t += mark + opt.label + '\n\n';
  });
  t += '↑↓ เลือกช่องเสียง · +/− หรือ Enter ปรับระดับ · Esc ปิด';

  announce(t, false);
  var cur = menuOptions[menuCursor];
  if (cur) {
    var line = (menuCursor + 1) + ' จาก ' + menuOptions.length + '. ' + cur.speak;
    if (noticeText) speakOnly(noticeText + '. ' + line);
    else if (isOpen) speakOnly('ตั้งค่าเสียง. ' + line);
    else speakOnly(line);
  }
  if (typeof syncA11yList === 'function') syncA11yList('ตั้งค่าเสียง', !!isOpen);
}

function openSoundSettings() {
  mode = 'settings';
  menuTitle = 'ตั้งค่าเสียง';
  menuCursor = 0;
  playSfx('menu');
  renderSoundSettings(true);
  if (typeof enterListNavigation === 'function') enterListNavigation('ตั้งค่าเสียง');
}

function adjustSelectedSound(deltaStep) {
  if (mode !== 'settings') return;
  var opts = buildSoundMenuOptions();
  var cur = opts[menuCursor];
  if (!cur) return;
  stepChannelVolume(cur.id, deltaStep);
  playSfx('confirm');
  var updatedLabel = volumeLabel(audioSettings[cur.id]);
  var msg = (AUDIO_CHANNEL_NAMES[cur.id] || cur.id) + ' เป็น ' + updatedLabel;
  renderSoundSettings(false, msg);
}

loadAudioSettings();
applyAudioSettings();

function playSfx(key) {
  const s = sounds[key];
  if (!s || Array.isArray(s)) return;
  safePlayAudio(s, true);
}

function playStepSound(type = 'dirt') {
  const list = sounds[type];
  if (!list || !list.length) return;
  const sound = list[Math.floor(Math.random() * list.length)];
  safePlayAudio(sound, true);
}
function playWallSound() { playSfx('wall'); }
function playEdgeSound() { playSfx('edge'); }

function updateAmbientSound(zone) {
  const isOcean  = zone.includes("มหาสมุทร");
  const isForest = zone.includes("ป่าหิมพานต์");
  if (isOcean) {
    if (sounds.ocean && sounds.ocean.paused) safePlayAudio(sounds.ocean, true);
  } else if (sounds.ocean && !sounds.ocean.paused) {
    sounds.ocean.pause();
  }
  if (isForest) {
    if (sounds.forest && sounds.forest.paused) safePlayAudio(sounds.forest, true);
  } else if (sounds.forest && !sounds.forest.paused) {
    sounds.forest.pause();
  }
}

function getZoneName(row, col) {
  if (row >= 40 && row <= 60 && col >= 40 && col <= 60)
    return "เมืองหลวงไตรภูมิ (เขตปลอดภัยและชุมชน)";
  if (row < 40 && col >= 30 && col <= 70)
    return "เขาพระสุเมรุ (ดินแดนศักดิ์สิทธิ์และวิหาร)";
  if (row >= 60 && col >= 30 && col <= 70)
    return "ป่าหิมพานต์ (ดินแดนลึกลับและสัตว์ป่าหิมพานต์)";
  if (col < 30)
    return "มหาสมุทรสีทันดร (คลื่นลมแรงและเกาะแก่ง)";
  if (col > 70)
    return "ป่ากว้างชายแดน (แนวเขตธรรมชาติอันไกลโพ้น)";
  return "ทุ่งราบกว้างใหญ่ (พื้นที่รกร้างและทางผ่าน)";
}

function isCityGate(row, col) {
  const onWallLine = (row === 39 || row === 61 || col === 39 || col === 61);
  const inGateRange = (col >= 48 && col <= 52) || (row >= 48 && row <= 52);
  return onWallLine && inGateRange;
}

function isWall(row, col) {
  const isCityWallRow = (row === 39 || row === 61) && (col >= 40 && col <= 60);
  const isCityWallCol = (col === 39 || col === 61) && (row >= 40 && row <= 60);
  if ((isCityWallRow || isCityWallCol) && !isCityGate(row, col))
    return "กำแพงเมืองหลวงโบราณหนาแน่น";
  if (row === 38 && (col < 35 || col > 65))
    return "แนวเทือกเขาหินสูงชัน";
  if (row === 62 && (col < 40 || col > 60))
    return "แนวต้นไม้หนาทึบและหนาม";
  return null;
}

// ร้านค้าที่วางบนพื้นเมือง (พิกัด row,col)
const CITY_SHOPS = {
  "48,50": { id: "ball_shop",   name: "ร้านลูกบอล",       desc: "ขาย Pokeball / Great Ball / Ultra Ball" },
  "50,48": { id: "food_shop",   name: "ร้านอาหารสัตว์",   desc: "ขายอาหารธาตุต่างๆ" },
  "52,50": { id: "evo_shop",    name: "ร้านหินวิวัฒนาการ", desc: "ขายหินวิวัฒนาการ" },
  "50,52": { id: "info_center", name: "ศูนย์ข้อมูล",      desc: "ดูคำแนะนำและสถานะรวม" },
  "50,50": { id: "arena",       name: "ลานประลองไตรภูมิ", desc: "ต่อสู้กับนักรบอื่นเพื่อรับรางวัล" }
};

function getShopAt(row, col) {
  return CITY_SHOPS[row + "," + col] || null;
}

function announce(text, speakAll) {
  const disp = document.getElementById('display');
  if (disp) disp.innerText = text;
  if (speakAll === false) return;
  speakOnly(text);
}

var _speakTimer = null;
var _lastSpeak = '';
function speakOnly(line) {
  if (window._a11yQuiet) return;
  const sr = document.getElementById('srAnnouncer');
  if (!sr) return;
  var t = String(line || '').replace(/^\s*▶\s*/g, '').replace(/\n+/g, '. ').trim();
  if (!t) return;
  if (t === _lastSpeak && _speakTimer) return;
  _lastSpeak = t;
  if (_speakTimer) clearTimeout(_speakTimer);
  sr.textContent = '';
  _speakTimer = setTimeout(function() {
    sr.textContent = t;
    _speakTimer = null;
  }, 16);
}

