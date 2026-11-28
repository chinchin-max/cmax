// ============================================================
// 3. การเดิน
// ============================================================
function move(dr, dc) {
  if (mode !== 'explore') return;
  const now = Date.now();
  if (now - lastMoveTime < MOVE_COOLDOWN) return;
  lastMoveTime = now;
  const newR = r + dr;
  const newC = c + dc;

  if (newR >= 0 && newR < size && newC >= 0 && newC < size) {
    const wallReason = isWall(newR, newC);
    if (wallReason) {
      playWallSound();
      announce("เดินไปไม่ได้! ชนเข้ากับ: " + wallReason);
      return;
    }
    r = newR; c = newC;
    const zone = getZoneName(r, c);

    let soundType = 'dirt';
    if (zone.includes("ป่าหิมพานต์") || zone.includes("ทุ่งราบ") || zone.includes("ป่ากว้าง")) soundType = 'grass';
    else if (zone.includes("เมืองหลวง")) soundType = 'stone';
    else if (zone.includes("เขาพระสุเมรุ")) soundType = 'mountain';
    else if (zone.includes("มหาสมุทร")) soundType = 'water';

    playStepSound(soundType);
    updateAmbientSound(zone);

    const shop = getShopAt(r, c);
    if (shop) {
      announce("คุณยืนอยู่หน้า" + shop.name + "\n" + shop.desc + "\n\nกด Enter เพื่อเข้าใช้บริการ");
      return;
    }

    // มอนโผล่เองตอนเดินนอกเมือง (โอกาส ~18%)
    const catchZone = getCatchZone(zone);
    if (catchZone && Math.random() < 0.18) {
      startSearch(true);
      return;
    }

    if (isCityGate(r, c)) {
      announce("คุณกำลังผ่านประตูเมืองหลวงไตรภูมิ | โซน: " + zone);
    } else {
      announce("");
    }
  } else {
    playEdgeSound();
    announce("ชนขอบแผนที่ ไปต่อไม่ได้");
  }
}

function checkCurrentPosition() {
  const zone = getZoneName(r, c);
  const shop = getShopAt(r, c);
  const catchable = getCatchZone(zone) ? "มอนโผล่ได้ตอนเดิน / กด C ค้นหา" : "เขตปลอดภัย (มีร้าน + ลานประลอง)";
  let text = "พิกัด: " + (r+1) + ", " + (c+1) + "\nโซน: " + zone + "\n" + catchable + "\nชัยชนะลานประลอง: " + (playerData.arenaWins || 0);
  if (shop) text += "\n\nคุณยืนอยู่หน้า: " + shop.name + "\nกด Enter เพื่อเปิด";
  announce(text);
}

function tryInteract() {
  if (mode !== 'explore') return;
  const shop = getShopAt(r, c);
  if (!shop) {
    announce("ไม่มีอะไรให้โต้ตอบที่นี่\nเดินไปยืนหน้าร้านในเมืองแล้วกด Enter");
    return;
  }
  openShopById(shop.id);
}
