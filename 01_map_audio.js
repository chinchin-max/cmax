// ============================================================
// 1. แผนที่ + เสียง
// ============================================================
const size = 100;
let r = 49;
let c = 49;
let lastMoveTime = 0;
const MOVE_COOLDOWN = 220; // มิลลิวินาที (ยิ่งมากยิ่งเดินช้า)

const bgm = new Audio('music-bg.wav');
bgm.loop = true; bgm.volume = 0.40;

const sounds = {
  // เดิน
  grass:    [new Audio('step_grass1.wav'), new Audio('step_grass2.wav'), new Audio('step_grass3.wav')],
  mountain: [new Audio('step_mountain.wav')],
  stone:    [new Audio('step_stone1.wav'), new Audio('step_stone2.wav')],
  dirt:     [new Audio('step_dirt1.wav'), new Audio('step_dirt2.wav')],
  water:    [new Audio('step_water1.wav'), new Audio('step_water2.wav')],
  wall: new Audio('wall_hit.wav'),
  edge: new Audio('edge_hit.wav'),
  // ambient
  ocean: new Audio('ocean_ambient.wav'),
  forest: new Audio('forest_ambient.wav'),
  // ต่อสู้ / มอน
  encounter: new Audio('sfx_encounter.wav'),
  attack:    new Audio('sfx_attack.wav'),
  hit:       new Audio('sfx_hit.wav'),
  miss:      new Audio('sfx_miss.wav'),
  win:       new Audio('sfx_win.wav'),
  lose:      new Audio('sfx_lose.wav'),
  flee:      new Audio('sfx_flee.wav'),
  // บอล
  throw_ball: new Audio('sfx_throw_ball.wav'),
  catch_ok:   new Audio('sfx_catch_ok.wav'),
  catch_fail: new Audio('sfx_catch_fail.wav'),
  // ร้าน / คลัง
  shop_open:  new Audio('sfx_shop_open.wav'),
  buy:        new Audio('sfx_buy.wav'),
  no_money:   new Audio('sfx_no_money.wav'),
  sell:       new Audio('sfx_sell.wav'),
  feed:       new Audio('sfx_feed.wav'),
  evolve:     new Audio('sfx_evolve.wav'),
  menu:       new Audio('sfx_menu.wav'),
  // อื่นๆ
  chat:       new Audio('sfx_chat.wav'),
  error:      new Audio('sfx_error.wav'),
  confirm:    new Audio('sfx_confirm.wav')
};

Object.values(sounds).forEach(item => {
  if (Array.isArray(item)) item.forEach(s => s.volume = 0.45);
  else if (item === sounds.ocean || item === sounds.forest) { /* set below */ }
  else item.volume = 0.55;
});
sounds.ocean.loop = true;  sounds.ocean.volume = 0.35;
sounds.forest.loop = true; sounds.forest.volume = 0.42;
// ปรับระดับ SFX บางตัว
['encounter','win','evolve','catch_ok'].forEach(function(k) {
  if (sounds[k]) sounds[k].volume = 0.65;
});

// ===== ระดับเสียง (บันทึก localStorage) =====
const STORAGE_KEY_VOLUME = 'tri_monster_volume_v1';
const VOLUME_STEPS = [0, 0.25, 0.5, 0.75, 1];
const VOLUME_LABELS = ['ปิด', 'เบา', 'ปานกลาง', 'ค่อนข้างดัง', 'ดังสุด'];

var audioSettings = {
  bgm: 0.4,
  sfx: 0.55,
  ambient: 0.35
};

function loadAudioSettings() {
  try {
    var raw = localStorage.getItem(STORAGE_KEY_VOLUME);
    if (!raw) return;
    var o = JSON.parse(raw);
    if (typeof o.bgm === 'number') audioSettings.bgm = o.bgm;
    if (typeof o.sfx === 'number') audioSettings.sfx = o.sfx;
    if (typeof o.ambient === 'number') audioSettings.ambient = o.ambient;
  } catch (e) {}
}

function saveAudioSettings() {
  try {
    localStorage.setItem(STORAGE_KEY_VOLUME, JSON.stringify(audioSettings));
  } catch (e) {}
}

function volumeLabel(v) {
  var best = 0, bestDiff = 99;
  for (var i = 0; i < VOLUME_STEPS.length; i++) {
    var d = Math.abs(VOLUME_STEPS[i] - v);
    if (d < bestDiff) { bestDiff = d; best = i; }
  }
  return VOLUME_LABELS[best] + ' ' + Math.round(v * 100) + '%';
}

function nextVolume(v) {
  var idx = 0, bestDiff = 99;
  for (var i = 0; i < VOLUME_STEPS.length; i++) {
    var d = Math.abs(VOLUME_STEPS[i] - v);
    if (d < bestDiff) { bestDiff = d; idx = i; }
  }
  return VOLUME_STEPS[(idx + 1) % VOLUME_STEPS.length];
}

function applyAudioSettings() {
  try {
    if (bgm) bgm.volume = audioSettings.bgm;
  } catch (e) {}
  Object.keys(sounds).forEach(function(k) {
    var item = sounds[k];
    if (k === 'ocean' || k === 'forest') {
      if (item) item.volume = audioSettings.ambient;
      return;
    }
    if (Array.isArray(item)) {
      item.forEach(function(s) { s.volume = audioSettings.sfx * 0.85; });
    } else if (item) {
      item.volume = audioSettings.sfx;
    }
  });
  // บางเสียงดังหน่อยตามเดิม
  ['encounter','win','evolve','catch_ok'].forEach(function(k) {
    if (sounds[k]) sounds[k].volume = Math.min(1, audioSettings.sfx * 1.15);
  });
}

loadAudioSettings();
applyAudioSettings();



function playSfx(key) {
  const s = sounds[key];
  if (!s) return;
  try {
    s.currentTime = 0;
    s.play().catch(function() {});
  } catch (e) {}
}

function playStepSound(type = 'dirt') {
  const list = sounds[type];
  if (!list || !list.length) return;
  const sound = list[Math.floor(Math.random() * list.length)];
  sound.currentTime = 0;
  sound.play().catch(() => {});
}
function playWallSound() { playSfx('wall'); }
function playEdgeSound() { playSfx('edge'); }

function updateAmbientSound(zone) {
  const isOcean  = zone.includes("มหาสมุทร");
  const isForest = zone.includes("ป่าหิมพานต์");
  if (isOcean)  { if (sounds.ocean.paused)  { sounds.ocean.currentTime = 0;  sounds.ocean.play().catch(() => {}); } }
  else if (!sounds.ocean.paused)  sounds.ocean.pause();
  if (isForest) { if (sounds.forest.paused) { sounds.forest.currentTime = 0; sounds.forest.play().catch(() => {}); } }
  else if (!sounds.forest.paused) sounds.forest.pause();
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

// announce(text, speakAll)
// speakAll === false → อัปเดตหน้าจออย่างเดียว ไม่อ่านออกเสียง
// speakAll ปกติ → อ่านข้อความผ่าน srAnnouncer เท่านั้น (ไม่ผ่าน #display)
function announce(text, speakAll) {
  const disp = document.getElementById('display');
  if (disp) disp.innerText = text;
  if (speakAll === false) return;
  speakOnly(text);
}

// อ่านเฉพาะข้อความที่ส่งมา — ใช้ทุกครั้งที่ต้องการให้อ่านจอพูด
// เคลียร์ก่อนใส่ใหม่ เพื่อบังคับให้อ่านซ้ำได้
var _speakTimer = null;
var _lastSpeak = '';
function speakOnly(line) {
  if (window._a11yQuiet) return;
  const sr = document.getElementById('srAnnouncer');
  if (!sr) return;
  var t = String(line || '').replace(/^\s*▶\s*/g, '').replace(/\n+/g, '. ').trim();
  if (!t) return;
  // กันพูดซ้ำข้อความเดิมถี่ ๆ
  if (t === _lastSpeak && _speakTimer) return;
  _lastSpeak = t;
  if (_speakTimer) clearTimeout(_speakTimer);
  sr.textContent = '';
  _speakTimer = setTimeout(function() {
    sr.textContent = t;
    _speakTimer = null;
  }, 16);
}
