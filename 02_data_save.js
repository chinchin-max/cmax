// ============================================================
// 2. ข้อมูลเกม
// ============================================================
const STORAGE_KEY_PLAYER = 'tri_monster_player_v4';
const STORAGE_KEY_PETS   = 'tri_monster_pets_v4';

const SHOP_ITEMS = {
  pokeball:  { name: 'Pokeball ธรรมดา', price: 100 },
  greatball: { name: 'Great Ball',     price: 300 },
  ultraball: { name: 'Ultra Ball',     price: 800 }
};

const PET_FOODS = {
  food_fire:     { name: 'อาหารธาตุไฟ',   price: 80 },
  food_water:    { name: 'อาหารธาตุน้ำ',  price: 80 },
  food_grass:    { name: 'อาหารธาตุพืช',  price: 80 },
  food_electric: { name: 'อาหารธาตุไฟฟ้า', price: 100 },
  food_rock:     { name: 'อาหารธาตุหิน',  price: 80 }
};

const SPECIAL_SHOP = {
  evo_stone: { name: 'หินวิวัฒนาการ', price: 500 }
};

const ELEMENT_WEAKNESS = {
  'ไฟ': 'น้ำ', 'น้ำ': 'ไฟฟ้า', 'พืช': 'ไฟ', 'ไฟฟ้า': 'หิน', 'หิน': 'พืช'
};

const EVOLUTION_MAP = {
  'ฮิโตคาเงะ': 'ลิซาร์ดอน', 'ฟุชิกิดาเนะ': 'ฟุชิกิบาสะ', 'เซนิกาเมะ': 'คาเมล็อค',
  'กระต่ายทุ่งหญ้า': 'กระต่ายสายฟ้า', 'กบใบไม้': 'กบยักษ์พงไพร', 'หนูพงไพร': 'หนูราชา',
  'เต่าคลื่นวารี': 'เต่าเกราะโบราณ', 'จิ้งจอกสายหมอก': 'จิ้งจอกราตรี',
  'งูหลามพงไพร': 'พญานาคใบไม้', 'ค้างคาวสายฟ้า': 'ค้างคาวยักษ์สายฟ้า',
  'สิงโตหิน': 'ราชสีห์หินลาวา', 'นกสายฟ้า': 'พญาครุฑสายฟ้า',
  'มังกรน้อยภูเขา': 'มังกรภูเขาไฟ', 'เสือไฟ': 'เสือเพลิง',
  'ปลาวาฬน้อย': 'ปลาวาฬยักษ์', 'ฉลามสายฟ้า': 'ฉลามจักรพรรดิ',
  'เต่าทะเลโบราณ': 'เต่าทะเลเทพ', 'หมาป่าราชสีห์': 'หมาป่าราชา',
  'นกอินทรีหิน': 'นกอินทรีเหล็ก'
};

function getCatchZone(zoneName) {
  if (zoneName.includes("เมืองหลวง")) return null;
  if (zoneName.includes("ทุ่งราบ")) {
    return { name: "ทุ่งราบกว้างใหญ่", levelMin: 1, levelMax: 6, elements: ['พืช','น้ำ'],
      names: ['ฟุชิกิดาเนะ','เถาวัลย์พฤกษา','กระต่ายทุ่งหญ้า','กบใบไม้','หนูพงไพร','เต่าคลื่นวารี','นกทุ่ง'] };
  }
  if (zoneName.includes("ป่าหิมพานต์")) {
    return { name: "ป่าหิมพานต์", levelMin: 8, levelMax: 16, elements: ['พืช','ไฟฟ้า','น้ำ'],
      names: ['จิ้งจอกสายหมอก','งูหลามพงไพร','ค้างคาวสายฟ้า','หนูสายฟ้าฟาด','เห็ดพิษราตรี','ไดโนเสาร์ใบมีด','เสือลายเมฆ'] };
  }
  if (zoneName.includes("เขาพระสุเมรุ")) {
    return { name: "เขาพระสุเมรุ", levelMin: 14, levelMax: 26, elements: ['หิน','ไฟ','ไฟฟ้า'],
      names: ['สิงโตหิน','นกสายฟ้า','มังกรน้อยภูเขา','เสือไฟ','กบหินลาวา','พญาครุฑน้อย','ยักษ์หิน'] };
  }
  if (zoneName.includes("มหาสมุทร")) {
    return { name: "มหาสมุทรสีทันดร", levelMin: 7, levelMax: 18, elements: ['น้ำ','ไฟฟ้า'],
      names: ['ปลาวาฬน้อย','ฉลามสายฟ้า','เต่าทะเลโบราณ','หมึกยักษ์','ปูหินปะการัง','นางเงือกน้อย','พญานาคทะเล'] };
  }
  if (zoneName.includes("ป่ากว้างชายแดน")) {
    return { name: "ป่ากว้างชายแดน", levelMin: 10, levelMax: 20, elements: ['พืช','หิน','ไฟ'],
      names: ['หมาป่าราชสีห์','นกอินทรีหิน','ต้นไม้มีชีวิต','หมูป่าไฟ','กิ้งก่าหิน','หมีพงไพร'] };
  }
  return { name: "พื้นที่รกร้าง", levelMin: 1, levelMax: 5, elements: ['พืช'], names: ['หนูพงไพร','นกทุ่ง'] };
}

const ARENA_OPPONENTS = [
  { name: 'นักรบมือใหม่',   petName: 'หนูพงไพร',      level: 5,  element: 'พืช',  atk: 22, hp: 40 },
  { name: 'นักล่าทุ่งหญ้า', petName: 'กบใบไม้',       level: 8,  element: 'พืช',  atk: 30, hp: 55 },
  { name: 'นักรบสายน้ำ',   petName: 'เต่าคลื่นวารี',   level: 10, element: 'น้ำ',  atk: 35, hp: 70 },
  { name: 'นักรบสายไฟ',   petName: 'ค้างคาวสายฟ้า',  level: 13, element: 'ไฟฟ้า', atk: 45, hp: 65 },
  { name: 'นักรบภูเขา',    petName: 'สิงโตหิน',      level: 16, element: 'หิน',  atk: 55, hp: 85 },
  { name: 'จ้าวแห่งไฟ',   petName: 'เสือไฟ',        level: 20, element: 'ไฟ',   atk: 70, hp: 90 },
  { name: 'ราชาทะเล',     petName: 'ฉลามสายฟ้า',    level: 22, element: 'ไฟฟ้า', atk: 75, hp: 100 },
  { name: 'ตำนานไตรภูมิ', petName: 'มังกรน้อยภูเขา', level: 28, element: 'ไฟ',  atk: 95, hp: 120 }
];

const defaultPlayerData = {
  money: 1000,
  inventory: {
    pokeball: 6, greatball: 1, ultraball: 0,
    food_fire: 2, food_water: 2, food_grass: 2,
    food_electric: 1, food_rock: 1, evo_stone: 0
  },
  arenaWins: 0
};

const defaultPetInventory = [
  { id: 1, name: 'ฮิโตคาเงะ',   level: 5, element: 'ไฟ',  atk: 28, hp: 45, maxHp: 45, weakness: 'น้ำ',   sellPrice: 260, evolved: false },
  { id: 2, name: 'ฟุชิกิดาเนะ', level: 5, element: 'พืช', atk: 22, hp: 50, maxHp: 50, weakness: 'ไฟ',   sellPrice: 260, evolved: false },
  { id: 3, name: 'เซนิกาเมะ',   level: 4, element: 'น้ำ', atk: 20, hp: 52, maxHp: 52, weakness: 'ไฟฟ้า', sellPrice: 220, evolved: false }
];

let playerData = {};
let petInventory = [];
let mode = 'explore';
let selectedPetIndex = -1;
let battleState = null;
let menuCursor = 0;
let menuOptions = []; // {id,label} for current menu
let menuTitle = '';

function saveGame() {
  try {
    localStorage.setItem(STORAGE_KEY_PLAYER, JSON.stringify(playerData));
    localStorage.setItem(STORAGE_KEY_PETS, JSON.stringify(petInventory));
  } catch (e) {}
}

function loadGame() {
  try {
    const p = localStorage.getItem(STORAGE_KEY_PLAYER);
    const pets = localStorage.getItem(STORAGE_KEY_PETS);
    playerData = p ? JSON.parse(p) : JSON.parse(JSON.stringify(defaultPlayerData));
    petInventory = pets ? JSON.parse(pets) : JSON.parse(JSON.stringify(defaultPetInventory));
    if (!playerData.inventory) playerData.inventory = Object.assign({}, defaultPlayerData.inventory);
    if (typeof playerData.inventory.evo_stone !== 'number') playerData.inventory.evo_stone = 0;
    if (typeof playerData.arenaWins !== 'number') playerData.arenaWins = 0;
    petInventory.forEach(function(p) { if (!p.maxHp) p.maxHp = p.hp; });
  } catch (e) {
    playerData = JSON.parse(JSON.stringify(defaultPlayerData));
    petInventory = JSON.parse(JSON.stringify(defaultPetInventory));
  }
  updateStatusBar();
}

function updateStatusBar() {
  const inv = playerData.inventory || {};
  const balls = (inv.pokeball||0) + (inv.greatball||0) + (inv.ultraball||0);
  const foods = (inv.food_fire||0)+(inv.food_water||0)+(inv.food_grass||0)+(inv.food_electric||0)+(inv.food_rock||0);
  document.getElementById('ball-count').textContent = balls;
  document.getElementById('food-count').textContent = foods;
  document.getElementById('evo-count').textContent = inv.evo_stone || 0;
  document.getElementById('money').textContent = playerData.money.toLocaleString();
}
