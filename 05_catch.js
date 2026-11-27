// ============================================================
// 5. ค้นหาสัตว์ป่า
// ============================================================
function startSearch(fromRandom) {
  if (mode !== 'explore') return;
  const zoneName = getZoneName(r, c);
  const catchZone = getCatchZone(zoneName);

  if (!catchZone) {
    if (!fromRandom) {
      announce("เมืองหลวงเป็นเขตปลอดภัย\nไม่สามารถจับหรือต่อสู้ได้ที่นี่\nออกไปนอกเมืองก่อน");
    }
    return;
  }

  const level   = Math.floor(Math.random() * (catchZone.levelMax - catchZone.levelMin + 1)) + catchZone.levelMin;
  const name    = catchZone.names[Math.floor(Math.random() * catchZone.names.length)];
  const element = catchZone.elements[Math.floor(Math.random() * catchZone.elements.length)];
  const atk     = level * 5 + Math.floor(Math.random() * 8) + 12;
  const hp      = level * 8 + Math.floor(Math.random() * 12) + 25;

  const enemy = {
    name: name, level: level, element: element, atk: atk, hp: hp, maxHp: hp,
    weakness: ELEMENT_WEAKNESS[element] || 'น้ำ',
    sellPrice: level * 40 + 80,
    zoneName: catchZone.name,
    evolved: false
  };

  playSfx('encounter');

  if (petInventory.length === 0) {
    battleState = { myPet: null, enemy: enemy, isWild: true, canCatch: true };
    mode = 'battle';
    showBattleUI("คุณยังไม่มีสัตว์เลี้ยง\nใช้การโยนบอลเพื่อจับตัวแรก!");
    return;
  }

  battleState = { myPet: null, enemy: enemy, isWild: true, canCatch: true };
  mode = 'catch_select';
  menuTitle = (fromRandom ? '!! สัตว์ป่าโผล่มา !!' : 'พบสัตว์ป่า') + '\n' + name + ' Lv.' + level + ' (' + element + ')!\nATK ' + atk + ' | HP ' + hp;
  menuCursor = 0;
  menuOptions = petInventory.map(function(p, i) {
    return { id: i, label: p.name + ' Lv.' + p.level + ' (' + p.element + ') ATK' + p.atk + ' HP' + p.hp + '/' + (p.maxHp||p.hp) };
  });
  renderPetSelectMenu(menuTitle);
}

function renderPetSelectMenu(title) {
  let t = (title || menuTitle || 'เลือกสัตว์เลี้ยง') + '\n\n';
  menuOptions.forEach(function(opt, i) {
    const mark = (i === menuCursor ? '▶ ' : '  ');
    t += mark + opt.label + '\n\n';
  });
  t += 'ลูกศรขึ้น/ลง เลือก | Enter ยืนยัน | Esc ยกเลิก';
  announce(t);
  if (menuOptions[menuCursor]) {
    const sr = document.getElementById('srAnnouncer');
    if (sr) sr.innerText = 'เลือก ' + menuOptions[menuCursor].label;
  }
}




function selectBattlePet(index) {
  if (index < 0 || index >= petInventory.length) return;
  const pet = petInventory[index];
  battleState.myPet = {
    name: pet.name, level: pet.level, element: pet.element,
    atk: pet.atk, hp: pet.hp, maxHp: pet.maxHp || pet.hp,
    weakness: pet.weakness
  };
  mode = 'battle';
  showBattleUI();
}
