// ============================================================
// 4. ร้านค้า
// ============================================================
function openShopById(shopId) {
  mode = 'shop';
  const inv = playerData.inventory;
  menuCursor = 0;
  playSfx('shop_open');

  if (shopId === 'ball_shop') {
    menuOptions = [
      { id: 'pokeball', label: 'Pokeball ธรรมดา  100G  (มี ' + (inv.pokeball||0) + ')' },
      { id: 'greatball', label: 'Great Ball       300G  (มี ' + (inv.greatball||0) + ')' },
      { id: 'ultraball', label: 'Ultra Ball       800G  (มี ' + (inv.ultraball||0) + ')' }
    ];
    menuTitle = 'ร้านลูกบอล'; renderMenu(menuTitle, 'ลูกศรขึ้น/ลง เลือก | Enter ซื้อ | Esc กลับ', true);
  } else if (shopId === 'food_shop') {
    menuOptions = [
      { id: 'food_fire', label: 'อาหารธาตุไฟ      80G  (มี ' + (inv.food_fire||0) + ')' },
      { id: 'food_water', label: 'อาหารธาตุน้ำ     80G  (มี ' + (inv.food_water||0) + ')' },
      { id: 'food_grass', label: 'อาหารธาตุพืช     80G  (มี ' + (inv.food_grass||0) + ')' },
      { id: 'food_electric', label: 'อาหารธาตุไฟฟ้า 100G  (มี ' + (inv.food_electric||0) + ')' },
      { id: 'food_rock', label: 'อาหารธาตุหิน     80G  (มี ' + (inv.food_rock||0) + ')' }
    ];
    menuTitle = 'ร้านอาหารสัตว์'; renderMenu(menuTitle, 'ลูกศรขึ้น/ลง เลือก | Enter ซื้อ | Esc กลับ', true);
  } else if (shopId === 'evo_shop') {
    menuOptions = [
      { id: 'evo_stone', label: 'หินวิวัฒนาการ  500G  (มี ' + (inv.evo_stone||0) + ')' }
    ];
    menuTitle = 'ร้านหินวิวัฒนาการ'; renderMenu(menuTitle, 'Enter ซื้อ | Esc กลับ', true);
  } else if (shopId === 'info_center') {
    mode = 'explore';
    menuOptions = [];
    announce(
      "ศูนย์ข้อมูลเมืองหลวง\n\n" +
      "เงิน: " + playerData.money + " G\n" +
      "สัตว์เลี้ยง: " + petInventory.length + " ตัว\n" +
      "ชัยชนะลานประลอง: " + (playerData.arenaWins || 0) + "\n\n" +
      "ตำแหน่งในเมือง (พิกัด = แถว+1, หลัก+1):\n" +
      "• 49, 51 → ร้านลูกบอล\n" +
      "• 51, 49 → ร้านอาหารสัตว์\n" +
      "• 53, 51 → ร้านหินวิวัฒนาการ\n" +
      "• 51, 51 → ลานประลอง\n" +
      "• 51, 53 → ศูนย์ข้อมูล\n"
    );
  } else if (shopId === 'arena') {
    startArenaFromCity();
  }
}

function renderMenu(title, hint, isOpen) {
  let t = title + "\n\n";
  menuOptions.forEach(function(opt, i) {
    const mark = (i === menuCursor ? "▶ " : "  ");
    t += mark + opt.label + "\n\n";
  });
  t += (hint || "ลูกศรขึ้น/ลง เลือก | Enter ยืนยัน | Esc กลับ");
  // แสดงทั้งเมนูบนจอ ไม่อ่านทั้งก้อน
  announce(t, false);
  if (!menuOptions[menuCursor]) return;
  var line = (menuCursor + 1) + ' จาก ' + menuOptions.length + '. ' + menuOptions[menuCursor].label;
  if (isOpen) speakOnly(title + '. ' + line);
  else speakOnly(line);
}

function menuMove(delta) {
  if (!menuOptions.length) return;

  // ในโหมดกระเป๋า ให้ข้าม separator อัตโนมัติ
  if (mode === 'inventory') {
    let tries = 0;
    do {
      menuCursor = (menuCursor + delta + menuOptions.length) % menuOptions.length;
      tries++;
    } while (menuOptions[menuCursor] && menuOptions[menuCursor].kind === 'separator' && tries < menuOptions.length);
  } else {
    menuCursor = (menuCursor + delta + menuOptions.length) % menuOptions.length;
  }

  playSfx('menu');
  if (mode === 'shop') {
    renderMenu(menuTitle || 'ร้านค้า', 'ลูกศรขึ้น/ลง เลือก | Enter ซื้อ | Esc กลับ');
  } else if (mode === 'inventory') {
    renderInventoryMenu();
  } else if (mode === 'catch_select' || mode === 'arena_select') {
    renderPetSelectMenu(mode === 'arena_select' ? 'ลานประลอง — เลือกสัตว์' : 'เลือกสัตว์เลี้ยงเข้าต่อสู้');
  } else if (mode === 'battle') {
    renderBattleMenu();
  } else if (mode === 'inventory_action') {
    renderInvActionMenu();
  } else if (mode === 'inventory_feed_select') {
    renderFeedSelectMenu();
  } else if (mode === 'inventory_evo_select') {
    renderEvoSelectMenu();
  }
}


function buy(itemKey) {
  if (mode !== 'shop') return;
  const item = SHOP_ITEMS[itemKey] || PET_FOODS[itemKey] || SPECIAL_SHOP[itemKey];
  if (!item) return;
  if (playerData.money < item.price) {
    playSfx('no_money');
    announce("เงินไม่พอ! ต้องการ " + item.price + " G\n(ตอนนี้มี " + playerData.money + " G)");
    return;
  }
  playerData.money -= item.price;
  playerData.inventory[itemKey] = (playerData.inventory[itemKey] || 0) + 1;
  saveGame();
  updateStatusBar();
  playSfx('buy');
  announce("ซื้อ " + item.name + " สำเร็จ! (-" + item.price + " G)\nเงินเหลือ " + playerData.money + " G");
}
