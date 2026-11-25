// 1. กำหนดค่าเริ่มต้น
const size = 100; // ขนาดตาราง 5x5
let r = 49;      // ตำแหน่งแถวเริ่มต้นของตัวละคร (แถวที่ 1)
let c = 49;      // ตำแหน่งหลักเริ่มต้นของตัวละคร (หลักที่ 1)

// ==================== เสียงพื้นหลังหลัก (เล่นตลอดเกม) ====================
const bgm = new Audio('forest_ambient.wav');
bgm.loop = true;
bgm.volume = 0.40;

// ==================== ระบบเสียง ====================
const sounds = {
    grass: [
        new Audio('step_grass1.wav'),
        new Audio('step_grass2.wav'),
        new Audio('step_grass3.wav')
    ],
    mountain: [
        new Audio('step_mountain.wav'),
    ],
    stone: [
        new Audio('step_stone1.wav'),
        new Audio('step_stone2.wav')
    ],
    dirt: [
        new Audio('step_dirt1.wav'),
        new Audio('step_dirt2.wav')
    ],
    water: [
        new Audio('step_water1.wav'),
        new Audio('step_water2.wav')
    ],
    wall: new Audio('wall_hit.wav'),
    edge: new Audio('edge_hit.wav'),
    ocean: new Audio('ocean_ambient.wav'),   // ← เพิ่มบรรทัดนี้
    forest: new Audio('forest_ambient.wav')
};

// ตั้งค่าความดัง
Object.values(sounds).forEach(item => {
    if (Array.isArray(item)) {
        item.forEach(s => s.volume = 0.45);
    } else if (item !== sounds.ocean && item !== sounds.forest) {
        item.volume = 0.55;
    }
});

// ตั้งค่าเสียงทะเล
sounds.ocean.loop = true;
sounds.ocean.volume = 0.35;

// เสียงป่า (มาซ้อนเมื่ออยู่ในป่าหิมพานต์)
sounds.forest.loop = true;
sounds.forest.volume = 0.42;

function playStepSound(type = 'dirt') {
    const list = sounds[type];
    if (!list || list.length === 0) return;
    const sound = list[Math.floor(Math.random() * list.length)];
    sound.currentTime = 0;
    sound.play().catch(() => {});
}

function playWallSound() {
    sounds.wall.currentTime = 0;
    sounds.wall.play().catch(() => {});
}

function playEdgeSound() {
    sounds.edge.currentTime = 0;
    sounds.edge.play().catch(() => {});
}

function updateAmbientSound(zone) {
    const isOcean = zone.includes("มหาสมุทร");
    const isForest = zone.includes("ป่าหิมพานต์");

    // เสียงทะเล
    if (isOcean) {
        if (sounds.ocean.paused) {
            sounds.ocean.currentTime = 0;
            sounds.ocean.play().catch(() => {});
        }
    } else {
        if (!sounds.ocean.paused) {
            sounds.ocean.pause();
        }
    }

    // เสียงป่า
    if (isForest) {
        if (sounds.forest.paused) {
            sounds.forest.currentTime = 0;
            sounds.forest.play().catch(() => {});
        }
    } else {
        if (!sounds.forest.paused) {
            sounds.forest.pause();
        }
    }
}

// ฟังก์ชันสำหรับจำแนกโซนตามพิกัด (Row, Column)
function getZoneName(row, col) {
    // แบ่งแผนที่ 100x100 ออกเป็นโซนต่างๆ ตามช่วงพิกัด
    if (row >= 40 && row <= 60 && col >= 40 && col <= 60) {
        return "เมืองหลวงไตรภูมิ (เขตปลอดภัยและชุมชน)";
    } else if (row < 40 && col >= 30 && col <= 70) {
        return "เขาพระสุเมรุ (ดินแดนศักดิ์สิทธิ์และวิหาร)";
    } else if (row >= 60 && col >= 30 && col <= 70) {
        return "ป่าหิมพานต์ (ดินแดนลึกลับและสัตว์ป่าหิมพานต์)";
    } else if (col < 30) {
        return "มหาสมุทรสีทันดร (คลื่นลมแรงและเกาะแก่ง)";
    } else if (col > 70) {
        return "ป่ากว้างชายแดน (แนวเขตธรรมชาติอันไกลโพ้น)";
    } else {
        return "ทุ่งราบกว้างใหญ่ (พื้นที่รกร้างและทางผ่าน)";
    }
}

// ฟังก์ชันตรวจสอบสิ่งกีดขวางหรือกำแพง
// ==================== เช็กประตูเมือง ====================
function isCityGate(row, col) {
    const onWallLine = (row === 39 || row === 61 || col === 39 || col === 61);
    const inGateRange = (col >= 48 && col <= 52) || (row >= 48 && row <= 52);
    return onWallLine && inGateRange;
}

// ==================== เช็กกำแพง ====================
function isWall(row, col) {
    let isCityWallRow = (row === 39 || row === 61) && (col >= 40 && col <= 60);
    let isCityWallCol = (col === 39 || col === 61) && (row >= 40 && row <= 60);

    // กำแพงเมือง (แต่ไม่ใช่ประตู)
    if ((isCityWallRow || isCityWallCol) && !isCityGate(row, col)) {
        return "กำแพงเมืองหลวงโบราณหนาแน่น";
    }

    // แนวเทือกเขา
    if (row === 38 && (col < 35 || col > 65)) {
        return "แนวเทือกเขาหินสูงชัน";
    }

    // แนวป่าทึบ
    if (row === 62 && (col < 40 || col > 60)) {
        return "แนวต้นไม้หนาทึบและหนาม";
    }

    return null; // เดินผ่านได้
}

// 2. ฟังก์ชันสำหรับอัปเดตข้อความและส่งเสียงให้โปรแกรมอ่านหน้าจอ
function announce(text) {
    document.getElementById('display').innerText = text;
    document.getElementById('srAnnouncer').innerText = text;
}

// 3. ฟังก์ชันเช็กพื้นที่ปัจจุบัน (ทำงานเมื่อกดปุ่ม B)
function checkCurrentPosition() {
    let currentZone = getZoneName(r, c);
    announce(` คุณอยู่ที่พิกัด ${r + 1}, ${c + 1} | โซน: ${currentZone}`);
}

// 3. ฟังก์ชันควบคุมการเดิน
function move(dr, dc) {
    let newR = r + dr;
    let newC = c + dc;

    // ตรวจสอบว่าเดินชนขอบแผนที่ 100x100 หรือไม่
    if (newR >= 0 && newR < size && newC >= 0 && newC < size) {
        // ตรวจสอบว่าพิกัดใหม่มี "กำแพง" หรือไม่ ก่อนอัปเดตตำแหน่ง
        let wallReason = isWall(newR, newC);
        if (wallReason !== null) {
            playWallSound(); // เสียงชนกำแพง
            announce(`เดินไปไม่ได้! ชนเข้ากับ: ${wallReason}`);
            return;
        }

        // ถ้าไม่มีกำแพงและไม่ชนขอบ ค่อยอัปเดตตำแหน่งใหม่
        r = newR;
        c = newC;

        // เลือกเสียงตามโซน
        let zone = getZoneName(r, c);
        let soundType = 'dirt';

        if (zone.includes("ป่าหิมพานต์") || zone.includes("ทุ่งราบ")) {
            soundType = 'grass';
        } else if (zone.includes("เมืองหลวง")) {
            soundType = 'stone';
        } else if (zone.includes("เขาพระสุเมรุ")) {
            soundType = 'mountain';

        } else if (zone.includes("มหาสมุทร")) {
            soundType = 'water';
        }

        // รายงานพิกัดใหม่ให้ทราบ
        playStepSound(soundType);
updateAmbientSound(zone);          // ← เพิ่มบรรทัดนี้
// ถ้าอยู่บนประตูเมือง ให้บอกพิเศษ
if (isCityGate(r, c)) {
    announce(`คุณกำลังผ่านประตูเมืองหลวงไตรภูมิ | โซน: ${zone}`);
} else {
        announce(`เข้าสู่ ${zone}`);
} 
    } else {
        // กรณีชนขอบ
        playEdgeSound(); // เสียงชนขอบ
        announce("ชนขอบแผนที่ ไปต่อไม่ได้");
    }
}
        
// 4. เมื่อเปิดหน้าเว็บ ให้โฟกัสที่ตัวเกมและเริ่มเกมทันที
let bgmStarted = false;

function startBGM() {
    if (!bgmStarted) {
        bgm.play().catch(() => {});
        bgmStarted = true;
    }
}

window.onload = function() {
    document.getElementById('gameBody').focus();
    announce("เกมเริ่มแล้ว! ");
};

// 5. ดักจับปุ่มกดบนคีย์บอร์ด (ลูกศร และ W, A, S, D)
window.addEventListener('keydown', function(e) {
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "KeyW", "KeyA", "KeyS", "KeyD"].includes(e.code)) {
        e.preventDefault(); // ป้องกันหน้าเว็บเลื่อนขึ้นลง
    }

    // เริ่มเสียงพื้นหลังตอนกดปุ่มครั้งแรก
    startBGM();

    if (e.code === 'ArrowUp' || e.code === 'KeyW') move(-1, 0);       // ขึ้น
    else if (e.code === 'ArrowDown' || e.code === 'KeyS') move(1, 0);  // ลง
    else if (e.code === 'ArrowLeft' || e.code === 'KeyA') move(0, -1); // ซ้าย
    else if (e.code === 'ArrowRight' || e.code === 'KeyD') move(0, 1); // ขวา
    else if (e.code === 'KeyB') checkCurrentPosition();                // กดปุ่ม B เช็กพื้นที่ปัจจุบัน
});

