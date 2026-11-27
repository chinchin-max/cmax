// ============================================================
// 1. แผนที่ + เสียง
// ============================================================
const size = 100;
let r = 49;
let c = 49;
let lastMoveTime = 0;
const MOVE_COOLDOWN = 450; // มิลลิวินาที (ยิ่งมากยิ่งเดินช้า)

const bgm = new Audio('music-bg.wav');
bgm.loop = true; bgm.volume = 0.50;

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

function announce(text) {
  const disp = document.getElementById('display');
  const sr = document.getElementById('srAnnouncer');
  if (disp) disp.innerText = text;
  // เคลียร์แล้วใส่ใหม่ เพื่อให้ screen reader อ่านซ้ำได้
  if (sr) {
    sr.innerText = '';
    setTimeout(function() { sr.innerText = text; }, 20);
  }
}
