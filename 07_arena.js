// ============================================================
// 7. ลานประลอง
// ============================================================
function startArenaFromCity() {
  if (petInventory.length === 0) {
    playSfx('error');
    announce("คุณยังไม่มีสัตว์เลี้ยงสำหรับต่อสู้\nไปจับมอนนอกเมืองก่อนนะ");
    mode = 'explore';
    return;
  }
  playSfx('encounter');
  mode = 'arena_select';
  menuTitle = 'ลานประลองไตรภูมิ\nชัยชนะสะสม: ' + (playerData.arenaWins || 0);
  menuCursor = 0;
  menuOptions = petInventory.map(function(p, i) {
    return { id: i, label: p.name + ' Lv.' + p.level + ' (' + p.element + ') ATK' + p.atk + ' HP' + p.hp };
  });
  renderPetSelectMenu(menuTitle);
}

function showArena() {
  const shop = getShopAt(r, c);
  if (shop && shop.id === 'arena') {
    startArenaFromCity();
  } else {
    announce("ลานประลองอยู่กลางเมืองหลวง\nเดินไปที่พิกัด 51, 51 แล้วกด Enter");
  }
}

function selectArenaPet(index) {
  if (index < 0 || index >= petInventory.length) return;
  const pet = petInventory[index];
  const win = playerData.arenaWins || 0;
  let pool = ARENA_OPPONENTS;
  if (win < 2) pool = ARENA_OPPONENTS.slice(0, 3);
  else if (win < 5) pool = ARENA_OPPONENTS.slice(0, 5);
  else if (win < 8) pool = ARENA_OPPONENTS.slice(1, 7);
  else pool = ARENA_OPPONENTS.slice(3);

  const opp = pool[Math.floor(Math.random() * pool.length)];
  const enemy = {
    name: opp.petName,
    level: opp.level,
    element: opp.element,
    atk: opp.atk,
    hp: opp.hp,
    maxHp: opp.hp,
    weakness: ELEMENT_WEAKNESS[opp.element] || 'น้ำ',
    trainer: opp.name
  };

  battleState = {
    myPet: { name: pet.name, level: pet.level, element: pet.element, atk: pet.atk, hp: pet.hp, maxHp: pet.maxHp || pet.hp, weakness: pet.weakness },
    enemy: enemy,
    isWild: false,
    canCatch: false
  };
  mode = 'battle';
  showBattleUI("พบคู่ต่อสู้: " + opp.name);
}
