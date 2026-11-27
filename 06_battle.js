// ============================================================
// 6. ระบบต่อสู้ + เลือกสกิล
// ============================================================
function showBattleUI(extraMsg) {
  if (!battleState) return;
  buildBattleOptions();
  menuCursor = 0;
  renderBattleMenu(extraMsg);
  if (typeof enterListNavigation === 'function') enterListNavigation('การต่อสู้');
  else if (typeof updateMobileControlsForMode === 'function') updateMobileControlsForMode();
}

function buildBattleOptions() {
  menuOptions = [];
  if (battleState.myPet) {
    menuOptions.push({ id: 'normal', label: 'โจมตีปกติ' });
    menuOptions.push({ id: 'heavy', label: 'โจมตีหนัก (แรงขึ้น แต่อาจพลาด)' });
    menuOptions.push({ id: 'element', label: 'สกิลธาตุ ' + battleState.myPet.element + ' (ได้เปรียบธาตุ)' });
  }
  if (battleState.canCatch && battleState.isWild) {
    menuOptions.push({ id: 'pokeball', label: 'โยน Pokeball' });
    menuOptions.push({ id: 'greatball', label: 'โยน Great Ball' });
    menuOptions.push({ id: 'ultraball', label: 'โยน Ultra Ball' });
  }
  menuOptions.push({ id: 'flee', label: 'หนี' });
}

function renderBattleMenu(extraMsg) {
  if (!battleState) return;
  const myPet = battleState.myPet;
  const enemy = battleState.enemy;
  let t = (extraMsg ? extraMsg + '\n\n' : '') + '=== การต่อสู้ ===\n\n';
  if (myPet) {
    t += 'คุณ: ' + myPet.name + ' Lv.' + myPet.level + ' (' + myPet.element + ')\n';
    t += 'HP ' + myPet.hp + '/' + myPet.maxHp + ' | ATK ' + myPet.atk + '\n\n';
  } else {
    t += 'คุณ: (ยังไม่มีสัตว์เลี้ยง)\n\n';
  }
  t += 'ศัตรู: ' + enemy.name + ' Lv.' + enemy.level + ' (' + enemy.element + ')\n';
  t += 'HP ' + Math.max(0, enemy.hp) + '/' + enemy.maxHp + ' | ATK ' + enemy.atk + '\n\n';
  t += 'เลือกสกิล (ลูกศรขึ้น/ลง | Enter ใช้):\n\n';
  menuOptions.forEach(function(opt, i) {
    const mark = (i === menuCursor ? '▶ ' : '  ');
    t += mark + opt.label + '\n\n';
  });
  announce(t, false);
  if (menuOptions[menuCursor]) {
    speakOnly((menuCursor + 1) + ' จาก ' + menuOptions.length + '. ' + menuOptions[menuCursor].label);
  }
  if (typeof syncA11yList === 'function') syncA11yList('การต่อสู้', false);
}



// ปิดหน้าเลือกสกิล/เมนูต่อสู้ กลับหน้าสำรวจ (มือถือจะซ่อนแผงรายการ)
function endBattleToExplore() {
  mode = 'explore';
  battleState = null;
  menuOptions = [];
  menuCursor = 0;
  if (typeof hideA11yList === 'function') hideA11yList();
  if (typeof updateMobileControlsForMode === 'function') updateMobileControlsForMode();
}

function doSkill(skill) {
  if (mode !== 'battle' || !battleState) return;
  const myPet = battleState.myPet;
  const enemy = battleState.enemy;
  const isWild = battleState.isWild;
  const canCatch = battleState.canCatch;
  let log = "";

  if (skill === 'normal' || skill === 'heavy' || skill === 'element') {
    if (!myPet) {
      announce("คุณยังไม่มีสัตว์เลี้ยง ให้ใช้การโยนบอลแทน");
      return;
    }

    let dmg = myPet.atk;
    let miss = 0;

    if (skill === 'heavy') {
      dmg = Math.floor(dmg * 1.55);
      miss = 0.22;
    }
    if (skill === 'element') {
      dmg = Math.floor(dmg * 1.25);
      if (ELEMENT_WEAKNESS[enemy.element] === myPet.element) {
        dmg = Math.floor(dmg * 1.45);
        log += "สกิลธาตุได้เปรียบ! ";
      }
    }

    playSfx('attack');
    if (Math.random() < miss) {
      playSfx('miss');
      log += "โจมตีพลาด!\n";
    } else {
      playSfx('hit');
      enemy.hp -= dmg;
      log += "สร้างความเสียหาย " + dmg + " แต้ม!\n";
      log += "HP ศัตรูเหลือ " + Math.max(0, enemy.hp) + "\n";
    }

    if (enemy.hp <= 0) {
      const reward = isWild ? (30 + enemy.level * 12) : (80 + enemy.level * 25);
      playerData.money += reward;
      if (!isWild) playerData.arenaWins = (playerData.arenaWins || 0) + 1;
      saveGame();
      updateStatusBar();
      playSfx('win');
      announce(
        "ชนะแล้ว!\nได้รับ " + reward + " G\n" +
        (isWild ? "(มอนป่าถูกเอาชนะ)\n" : "ชัยชนะลานประลอง: " + playerData.arenaWins + "\n") +
        "\nกด C หรือ R เพื่อหาต่อสู้ต่อ"
      );
      endBattleToExplore();
      return;
    }

    log += enemyCounterAttack();
    if (battleState && battleState.myPet && battleState.myPet.hp <= 0) {
      playSfx('lose');
      announce(log + "\nสัตว์เลี้ยงของคุณหมดแรง!\nคุณแพ้การต่อสู้ครั้งนี้");
      endBattleToExplore();
      return;
    }
    announce(log + "\n" + getSkillPrompt());
    return;
  }

  if (skill === 'pokeball' || skill === 'greatball' || skill === 'ultraball') {
    if (!canCatch || !isWild) {
      playSfx('error');
      announce("ตอนนี้โยนบอลไม่ได้");
      return;
    }
    throwBallInBattle(skill);
    return;
  }

  if (skill === 'flee') {
    playSfx('flee');
    announce("คุณหนีออกมาอย่างปลอดภัย");
    endBattleToExplore();
  }
}

function enemyCounterAttack() {
  if (!battleState || !battleState.myPet) return "";
  const myPet = battleState.myPet;
  const enemy = battleState.enemy;
  let dmg = enemy.atk;
  if (ELEMENT_WEAKNESS[myPet.element] === enemy.element) {
    dmg = Math.floor(dmg * 1.4);
  }
  dmg = Math.floor(dmg * (0.8 + Math.random() * 0.4));
  myPet.hp -= dmg;
  playSfx('hit');
  return "\n" + enemy.name + " โจมตีกลับ! ความเสียหาย " + dmg + "\nHP ของคุณเหลือ " + Math.max(0, myPet.hp) + "\n";
}

function getSkillPrompt() {
  let t = "เลือกสกิล: 1 ปกติ | 2 หนัก | 3 ธาตุ";
  if (battleState && battleState.canCatch) t += " | 4/5/6 โยนบอล";
  t += " | F หนี";
  return t;
}

function throwBallInBattle(type) {
  const inv = playerData.inventory;
  if ((inv[type] || 0) <= 0) {
    playSfx('error');
    announce("ไม่มี " + (SHOP_ITEMS[type] ? SHOP_ITEMS[type].name : type) + " เหลือแล้ว");
    return;
  }
  inv[type]--;
  updateStatusBar();
  saveGame();
  playSfx('throw_ball');

  const enemy = battleState.enemy;
  const base = Math.max(12, Math.round(88 - ((enemy.level - 1) / 49) * 70));
  let bonus = type === 'greatball' ? 20 : type === 'ultraball' ? 42 : 0;
  const hpRatio = Math.max(0.2, enemy.hp / enemy.maxHp);
  const rate = Math.min(93, Math.floor((base + bonus) * (1.35 - hpRatio * 0.6)));
  const roll = Math.random() * 100;

  if (roll < rate) {
    petInventory.push({
      id: Date.now(),
      name: enemy.name,
      level: enemy.level,
      element: enemy.element,
      atk: enemy.atk,
      hp: enemy.maxHp,
      maxHp: enemy.maxHp,
      weakness: enemy.weakness,
      sellPrice: enemy.sellPrice,
      evolved: false
    });
    saveGame();
    playSfx('catch_ok');
    announce("จับสำเร็จ!\n" + enemy.name + " Lv." + enemy.level + " เข้าคลังแล้ว\n(จากโซน: " + enemy.zoneName + ")");
    endBattleToExplore();
  } else {
    playSfx('catch_fail');
    let log = "โยนบอลพลาด! " + enemy.name + " ดิ้นหลุด\n";
    if (Math.random() < 0.28) {
      playSfx('flee');
      announce(log + enemy.name + " วิ่งหนีไปแล้ว");
      endBattleToExplore();
      return;
    }
    if (battleState.myPet) {
      log += enemyCounterAttack();
      if (battleState.myPet.hp <= 0) {
        playSfx('lose');
        announce(log + "\nสัตว์เลี้ยงหมดแรง! คุณแพ้");
        endBattleToExplore();
        return;
      }
    }
    announce(log + "\n" + getSkillPrompt());
  }
}
