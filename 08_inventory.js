// ============================================================
// 8. คลัง / กระเป๋า
// รายการใครรายการมัน กดลูกศรเลือกใช้ได้
// ============================================================

const BAG_ITEM_DEFS = [
  { key: 'pokeball',      name: 'Pokeball ธรรมดา', type: 'ball' },
  { key: 'greatball',     name: 'Great Ball',      type: 'ball' },
  { key: 'ultraball',     name: 'Ultra Ball',      type: 'ball' },
  { key: 'food_fire',     name: 'อาหารธาตุไฟ',    type: 'food', element: 'ไฟ' },
  { key: 'food_water',    name: 'อาหารธาตุน้ำ',   type: 'food', element: 'น้ำ' },
  { key: 'food_grass',    name: 'อาหารธาตุพืช',   type: 'food', element: 'พืช' },
  { key: 'food_electric', name: 'อาหารธาตุไฟฟ้า', type: 'food', element: 'ไฟฟ้า' },
  { key: 'food_rock',     name: 'อาหารธาตุหิน',   type: 'food', element: 'หิน' },
  { key: 'evo_stone',     name: 'หินวิวัฒนาการ',  type: 'evo' }
];

function showInventory() {
  mode = 'inventory';
  selectedPetIndex = -1;
  menuCursor = 0;
  buildInventoryOptions();
  // อย่าให้ cursor ตกบน separator
  if (menuOptions[menuCursor] && menuOptions[menuCursor].kind === 'separator') {
    for (let i = 0; i < menuOptions.length; i++) {
      if (menuOptions[i].kind !== 'separator') { menuCursor = i; break; }
    }
  }
  playSfx('menu');
  renderInventoryMenu(true); // true = เปิดใหม่ ให้อ่านหัวข้อกระเป๋าก่อน
}

function buildInventoryOptions() {
  const inv = playerData.inventory || {};
  menuOptions = [];

  // === ไอเทมทีละรายการ ===
  BAG_ITEM_DEFS.forEach(function(def) {
    const count = inv[def.key] || 0;
    menuOptions.push({
      kind: 'item',
      key: def.key,
      type: def.type,
      element: def.element || null,
      name: def.name,
      count: count,
      nameLine: def.name + ' × ' + count,
      label: def.name + ' มี ' + count,
      speak: def.name + '. มี ' + count
    });
  });

  // === สัตว์เลี้ยง ===
  if (petInventory.length > 0) {
    menuOptions.push({
      kind: 'separator',
      nameLine: '--- สัตว์เลี้ยง (' + petInventory.length + ' ตัว) ---',
      label: 'สัตว์เลี้ยง',
      speak: 'สัตว์เลี้ยง'
    });

    petInventory.forEach(function(p, i) {
      const line = p.name + (p.evolved ? '★' : '') + ' Lv.' + p.level + ' ' + p.element +
                   ' ATK' + p.atk + ' HP' + p.hp + '/' + (p.maxHp || p.hp);
      // พูดสั้น ชัด: ชื่อ เลเวล ธาตุ
      menuOptions.push({
        kind: 'pet',
        id: i,
        name: p.name,
        nameLine: line,
        label: line,
        speak: p.name + '. เลเวล ' + p.level + '. ธาตุ' + p.element
      });
    });
  }
}

// นับเฉพาะรายการที่เลือกได้ (ไม่นับ separator) สำหรับพูดตำแหน่ง
function inventorySelectableCount() {
  var n = 0;
  for (var i = 0; i < menuOptions.length; i++) {
    if (menuOptions[i].kind !== 'separator') n++;
  }
  return n;
}

function inventorySelectableIndex(cursor) {
  var n = 0;
  for (var i = 0; i <= cursor && i < menuOptions.length; i++) {
    if (menuOptions[i].kind !== 'separator') n++;
  }
  return n;
}

function renderInventoryMenu(isOpen) {
  var t = '=== กระเป๋า ===\n';
  t += 'เงิน: ' + playerData.money.toLocaleString() + ' G\n\n';

  menuOptions.forEach(function(opt, i) {
    if (opt.kind === 'separator') {
      t += opt.nameLine + '\n';
      return;
    }
    var mark = (i === menuCursor) ? '▶ ' : '  ';
    t += mark + opt.nameLine + '\n';
  });

  t += '\n↑↓ เลื่อนรายการ · Enter ใช้ · Esc กลับ';

  // แสดงทั้งลิสต์บนจอ แต่ให้อ่านจออ่านทีละรายการเท่านั้น
  announce(t, false);

  var opt = menuOptions[menuCursor];
  if (!opt) return;

  var pos = inventorySelectableIndex(menuCursor);
  var total = inventorySelectableCount();
  // พูดสั้น: ตำแหน่ง + ชื่อรายการ เท่านั้น
  var spoken;
  if (opt.kind === 'separator') {
    spoken = (opt.speak || 'หมวดถัดไป');
  } else {
    spoken = pos + ' จาก ' + total + '. ' + (opt.speak || opt.label);
  }

  if (isOpen) {
    speakOnly('กระเป๋า. เงิน ' + playerData.money.toLocaleString() + ' จี. ' + spoken);
  } else {
    speakOnly(spoken);
  }
}

function openInvActionMenu() {
  if (!menuOptions.length) return;
  const opt = menuOptions[menuCursor];
  if (!opt || opt.kind === 'separator') {
    // ถ้าอยู่บน separator ให้เลื่อนไปรายการถัดไปแล้วหยุด
    menuMove(1);
    return;
  }

  // ---- เลือกไอเทม ----
  if (opt.kind === 'item') {
    handleUseItem(opt);
    return;
  }

  // ---- เลือกสัตว์ ----
  if (opt.kind === 'pet') {
    selectedPetIndex = opt.id;
    mode = 'inventory_action';
    const p = petInventory[selectedPetIndex];
    const inv = playerData.inventory || {};
    const foodMap = { 'ไฟ': 'food_fire', 'น้ำ': 'food_water', 'พืช': 'food_grass', 'ไฟฟ้า': 'food_electric', 'หิน': 'food_rock' };
    const foodKey = foodMap[p.element];
    const foodCount = foodKey ? (inv[foodKey] || 0) : 0;
    const evoCount = inv.evo_stone || 0;

    menuCursor = 0;
    menuOptions = [
      { id: 'feed',   label: 'ให้อาหารธาตุ' + p.element + ' มี ' + foodCount + ' ชิ้น', speak: 'ให้อาหารธาตุ' + p.element + ' มี ' + foodCount + ' ชิ้น' },
      { id: 'evolve', label: 'วิวัฒนาการ หิน ' + evoCount + ' ต้องการเลเวล 12 ขึ้นไป', speak: 'วิวัฒนาการ หินเหลือ ' + evoCount + ' ต้องการเลเวล 12 ขึ้นไป' },
      { id: 'sell',   label: 'ขาย ' + p.name + ' ได้ ' + p.sellPrice + ' G', speak: 'ขาย ' + p.name + ' ได้ ' + p.sellPrice + ' เหรียญ' },
      { id: 'back',   label: 'กลับ', speak: 'กลับไปกระเป๋า' }
    ];
    menuTitle = p.name + ' Lv.' + p.level + ' (' + p.element + ')';
    renderInvActionMenu(true);
  }
}

function handleUseItem(opt) {
  const inv = playerData.inventory || {};
  const count = inv[opt.key] || 0;

  if (count <= 0) {
    playSfx('error');
    announce(opt.name + ' ไม่มีเหลือ\n\nEsc กลับ');
    return;
  }

  if (opt.type === 'ball') {
    playSfx('menu');
    announce(opt.name + ' มี ' + count + ' ชิ้น\nใช้ได้เฉพาะตอนต่อสู้กับมอนป่า\n\nEsc กลับ');
    return;
  }

  if (opt.type === 'food') {
    const matching = [];
    petInventory.forEach(function(p, i) {
      if (p.element === opt.element) matching.push({ index: i, pet: p });
    });
    if (matching.length === 0) {
      playSfx('error');
      announce('ไม่มีสัตว์ธาตุ' + opt.element + '\n\nEsc กลับ');
      return;
    }
    mode = 'inventory_feed_select';
    menuCursor = 0;
    menuTitle = 'ให้อาหาร ' + opt.name + ' เหลือ ' + count;
    menuOptions = matching.map(function(m) {
      const p = m.pet;
      return {
        id: m.index,
        nameLine: p.name + ' Lv.' + p.level + ' HP' + p.hp + '/' + (p.maxHp || p.hp),
        label: p.name + ' Lv.' + p.level,
        speak: p.name + ' เลเวล ' + p.level + ' เลือด ' + p.hp + ' จาก ' + (p.maxHp || p.hp)
      };
    });
    renderFeedSelectMenu(true);
    return;
  }

  if (opt.type === 'evo') {
    const evoPets = [];
    petInventory.forEach(function(p, i) {
      if (!p.evolved && EVOLUTION_MAP[p.name] && p.level >= 12) {
        evoPets.push({ index: i, pet: p });
      }
    });
    if (evoPets.length === 0) {
      playSfx('error');
      announce('ไม่มีสัตว์ที่วิวัฒนาการได้\nต้องเลเวล 12 ขึ้นไป และยังไม่เคยวิวัฒนาการ\n\nEsc กลับ');
      return;
    }
    mode = 'inventory_evo_select';
    menuCursor = 0;
    menuTitle = 'ใช้หินวิวัฒนาการ เหลือ ' + count;
    menuOptions = evoPets.map(function(m) {
      const p = m.pet;
      return {
        id: m.index,
        nameLine: p.name + ' → ' + EVOLUTION_MAP[p.name] + ' (Lv.' + p.level + ')',
        label: p.name + ' → ' + EVOLUTION_MAP[p.name],
        speak: p.name + ' วิวัฒนาการเป็น ' + EVOLUTION_MAP[p.name] + ' เลเวล ' + p.level
      };
    });
    renderEvoSelectMenu(true);
    return;
  }
}

function renderFeedSelectMenu(isOpen) {
  let t = menuTitle + '\n\n';
  menuOptions.forEach(function(opt, i) {
    const mark = (i === menuCursor) ? '▶ ' : '  ';
    t += mark + opt.nameLine + '\n';
  });
  t += '\n↑↓ เลื่อน · Enter ให้อาหาร · Esc กลับ';
  announce(t, false);
  if (!menuOptions[menuCursor]) return;
  var spoken = 'รายการ ' + (menuCursor + 1) + ' จาก ' + menuOptions.length + ' ' +
    (menuOptions[menuCursor].speak || menuOptions[menuCursor].label);
  if (isOpen) speakOnly(menuTitle + '. ' + spoken);
  else speakOnly(spoken);
}

function renderEvoSelectMenu(isOpen) {
  let t = menuTitle + '\n\n';
  menuOptions.forEach(function(opt, i) {
    const mark = (i === menuCursor) ? '▶ ' : '  ';
    t += mark + opt.nameLine + '\n';
  });
  t += '\n↑↓ เลื่อน · Enter วิวัฒนาการ · Esc กลับ';
  announce(t, false);
  if (!menuOptions[menuCursor]) return;
  var spoken = 'รายการ ' + (menuCursor + 1) + ' จาก ' + menuOptions.length + ' ' +
    (menuOptions[menuCursor].speak || menuOptions[menuCursor].label);
  if (isOpen) speakOnly(menuTitle + '. ' + spoken);
  else speakOnly(spoken);
}

function renderInvActionMenu(isOpen) {
  let t = menuTitle + '\n\n';
  menuOptions.forEach(function(opt, i) {
    const mark = (i === menuCursor) ? '▶ ' : '  ';
    t += mark + opt.label + '\n';
  });
  t += '\n↑↓ เลื่อน · Enter ยืนยัน · Esc กลับ';
  announce(t, false);
  if (!menuOptions[menuCursor]) return;
  var spoken = 'รายการ ' + (menuCursor + 1) + ' จาก ' + menuOptions.length + ' ' +
    (menuOptions[menuCursor].speak || menuOptions[menuCursor].label);
  if (isOpen) speakOnly(menuTitle + '. ' + spoken);
  else speakOnly(spoken);
}


function feedPet(index) {
  if (index < 0 || index >= petInventory.length) return;
  const pet = petInventory[index];
  const foodMap = { 'ไฟ': 'food_fire', 'น้ำ': 'food_water', 'พืช': 'food_grass', 'ไฟฟ้า': 'food_electric', 'หิน': 'food_rock' };
  const foodKey = foodMap[pet.element];
  if (!foodKey || (playerData.inventory[foodKey] || 0) <= 0) {
    announce('ไม่มีอาหารธาตุ' + pet.element);
    return;
  }
  playerData.inventory[foodKey]--;
  pet.level += 1;
  pet.atk += 4 + Math.floor(Math.random() * 3);
  const addHp = 6 + Math.floor(Math.random() * 4);
  pet.maxHp = (pet.maxHp || pet.hp) + addHp;
  pet.hp = pet.maxHp;
  pet.sellPrice = Math.floor(pet.level * 42 + 80);
  saveGame();
  updateStatusBar();
  playSfx('feed');
  announce('ให้อาหาร ' + pet.name + ' สำเร็จ\nLv.' + pet.level + ' ATK ' + pet.atk + ' HP ' + pet.hp);
}

function evolvePet(index) {
  if (index < 0 || index >= petInventory.length) return;
  const pet = petInventory[index];
  if (pet.evolved) { announce(pet.name + ' วิวัฒนาการไปแล้ว'); return; }
  if (!EVOLUTION_MAP[pet.name]) { announce(pet.name + ' วิวัฒนาการไม่ได้'); return; }
  if (pet.level < 12) { announce('เลเวลยังไม่พอ (ต้องการ ≥ 12)'); return; }
  if ((playerData.inventory.evo_stone || 0) <= 0) {
    announce('ไม่มีหินวิวัฒนาการ');
    return;
  }
  playerData.inventory.evo_stone--;
  const old = pet.name;
  pet.name = EVOLUTION_MAP[old];
  pet.evolved = true;
  pet.level += 2;
  pet.atk = Math.floor(pet.atk * 1.35) + 8;
  pet.maxHp = Math.floor((pet.maxHp || pet.hp) * 1.30) + 15;
  pet.hp = pet.maxHp;
  pet.sellPrice = Math.floor(pet.level * 55 + 150);
  saveGame();
  updateStatusBar();
  playSfx('evolve');
  announce('วิวัฒนาการ!\n' + old + ' → ' + pet.name + '\nLv.' + pet.level + ' ATK ' + pet.atk + ' HP ' + pet.hp);
}

function sellPet(index) {
  if (index < 0 || index >= petInventory.length) return;
  const pet = petInventory[index];
  playerData.money += pet.sellPrice;
  petInventory.splice(index, 1);
  saveGame();
  updateStatusBar();
  playSfx('sell');
  announce('ขาย ' + pet.name + ' ได้ ' + pet.sellPrice + ' G');
}

let bgmStarted = false;
function startBGM() {
  if (!bgmStarted) {
    bgm.play().catch(function() {});
    bgmStarted = true;
  }
}
