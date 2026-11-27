// ============================================================
// Keyboard
// ============================================================
window.addEventListener('keydown', function(e) {
  const code = e.code;
  const key = e.key;
  const inp = document.getElementById('chatInput');
  const typing = (inp && document.activeElement === inp);

  if (typing) {
    if (code === 'Enter') {
      e.preventDefault();
      sendChat();
      return;
    }
    if (code === 'Escape') {
      e.preventDefault();
      cancelChat();
      return;
    }
    return;
  }

  if (key === '/') {
    e.preventDefault();
    startChatType();
    return;
  }
  if (key === '[') {
    e.preventDefault();
    chatReadPrev();
    return;
  }
  if (key === ']') {
    e.preventDefault();
    chatReadNext();
    return;
  }

  if (["ArrowUp","ArrowDown","ArrowLeft","ArrowRight","KeyW","KeyA","KeyS","KeyD"].includes(code)) {
    e.preventDefault();
  }
  startBGM();

  if (mode === 'explore') {
    if (code === 'ArrowUp' || code === 'KeyW') move(-1, 0);
    else if (code === 'ArrowDown' || code === 'KeyS') move(1, 0);
    else if (code === 'ArrowLeft' || code === 'KeyA') move(0, -1);
    else if (code === 'ArrowRight' || code === 'KeyD') move(0, 1);
    else if (code === 'Enter') tryInteract();
    else if (code === 'KeyB') checkCurrentPosition();
    else if (code === 'KeyC') startSearch();
    else if (code === 'KeyR') showArena();
    else if (code === 'KeyI') showInventory();
    else if (code === 'KeyM') {
      announce(
        "=== เมนูช่วยเหลือ ===\n\n" +
        "ลูกศร / WASD = เดิน (หน้าสำรวจ)\n" +
        "ลูกศรขึ้น/ลง = เลือกเมนู (ร้าน/คลัง/ต่อสู้)\n" +
        "Enter = เปิดร้าน / ยืนยันเมนู\n" +
        "[ ] = อ่านแชท | / = พิมพ์แชท\n" +
        "C = ค้นหาสัตว์ป่าเอง (นอกเมือง)\n" +
        "เดินนอกเมือง = มีโอกาสเจอมอนโผล่เอง\n" +
        "I = คลังสัตว์เลี้ยง\n" +
        "B = เช็คพิกัด\n\n" +
        "ในเมือง (เดินไปยืนแล้วกด Enter):\n" +
        "• แถว 49 หลัก 51 = ร้านลูกบอล\n" +
        "• แถว 51 หลัก 49 = ร้านอาหาร\n" +
        "• แถว 53 หลัก 51 = ร้านหินวิวัฒนาการ\n" +
        "• แถว 51 หลัก 51 = ลานประลอง\n" +
        "• แถว 51 หลัก 53 = ศูนย์ข้อมูล\n\n" +
        "มือถือ: แตะค้างจอยสติ๊กเพื่อเดิน\n" +
        "ปุ่ม Enter / C / I / B / M / Esc ด้านล่าง"
      );
    }
  }
  else if (mode === 'shop' || mode === 'catch_select' || mode === 'arena_select' || mode === 'battle' || mode === 'inventory' || mode === 'inventory_action' || mode === 'inventory_feed_select' || mode === 'inventory_evo_select') {
    if (code === 'ArrowUp' || code === 'KeyW') {
      menuMove(-1);
      e.preventDefault();
    } else if (code === 'ArrowDown' || code === 'KeyS') {
      menuMove(1);
      e.preventDefault();
    } else if (code === 'Enter') {
      e.preventDefault();
      handleConfirm();
    } else if (code === 'Escape' || code === 'KeyB') {
      handleEsc();
    }
  }
});

function handleConfirm() {
  if (mode === 'shop') {
    if (menuOptions[menuCursor]) buy(menuOptions[menuCursor].id);
    const inv = playerData.inventory;
    menuOptions.forEach(function(opt) {
      if (opt.id === 'pokeball') opt.label = 'Pokeball ธรรมดา  100G  (มี ' + (inv.pokeball||0) + ')';
      if (opt.id === 'greatball') opt.label = 'Great Ball       300G  (มี ' + (inv.greatball||0) + ')';
      if (opt.id === 'ultraball') opt.label = 'Ultra Ball       800G  (มี ' + (inv.ultraball||0) + ')';
      if (opt.id === 'food_fire') opt.label = 'อาหารธาตุไฟ      80G  (มี ' + (inv.food_fire||0) + ')';
      if (opt.id === 'food_water') opt.label = 'อาหารธาตุน้ำ     80G  (มี ' + (inv.food_water||0) + ')';
      if (opt.id === 'food_grass') opt.label = 'อาหารธาตุพืช     80G  (มี ' + (inv.food_grass||0) + ')';
      if (opt.id === 'food_electric') opt.label = 'อาหารธาตุไฟฟ้า 100G  (มี ' + (inv.food_electric||0) + ')';
      if (opt.id === 'food_rock') opt.label = 'อาหารธาตุหิน     80G  (มี ' + (inv.food_rock||0) + ')';
      if (opt.id === 'evo_stone') opt.label = 'หินวิวัฒนาการ  500G  (มี ' + (inv.evo_stone||0) + ')';
    });
    renderMenu(menuTitle || 'ร้านค้า', 'ลูกศรขึ้น/ลง เลือก | Enter ซื้อ | Esc กลับ');
  } else if (mode === 'catch_select') {
    if (menuOptions[menuCursor]) selectBattlePet(menuOptions[menuCursor].id);
  } else if (mode === 'arena_select') {
    if (menuOptions[menuCursor]) selectArenaPet(menuOptions[menuCursor].id);
  } else if (mode === 'battle') {
    if (menuOptions[menuCursor]) doSkill(menuOptions[menuCursor].id);
    if (mode === 'battle') {
      buildBattleOptions();
      renderBattleMenu();
    }
  } else if (mode === 'inventory') {
    openInvActionMenu();
  } else if (mode === 'inventory_action') {
    const act = menuOptions[menuCursor] && menuOptions[menuCursor].id;
    if (act === 'feed') { feedPet(selectedPetIndex); showInventory(); }
    else if (act === 'evolve') { evolvePet(selectedPetIndex); showInventory(); }
    else if (act === 'sell') { sellPet(selectedPetIndex); showInventory(); }
    else { showInventory(); }
  } else if (mode === 'inventory_feed_select') {
    if (menuOptions[menuCursor]) {
      feedPet(menuOptions[menuCursor].id);
      showInventory();
    }
  } else if (mode === 'inventory_evo_select') {
    if (menuOptions[menuCursor]) {
      evolvePet(menuOptions[menuCursor].id);
      showInventory();
    }
  } else if (mode === 'explore') {
    tryInteract();
  }
}

function handleEsc() {
  if (mode === 'inventory_action' || mode === 'inventory_feed_select' || mode === 'inventory_evo_select') {
    showInventory();
  } else if (mode === 'catch_select') {
    mode = 'explore'; battleState = null;
    announce('คุณหนีจากสัตว์ป่า');
  } else if (mode === 'battle') {
    doSkill('flee');
  } else if (mode !== 'explore') {
    mode = 'explore';
    menuOptions = [];
    announce('กลับสู่โหมดสำรวจ');
  }
}

// ============================================================
