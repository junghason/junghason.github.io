// ===== 대포 탱크 — 앵그리버드 스타일 발사각 게임 (6세용) =====
// 탱크를 손가락으로 "쭈욱" 당겼다 놓으면(슬링샷), 포탄이 포물선을 그리며
// 날아가 장애물(나무 상자 탑)을 와르르 무너뜨리고 풍선을 펑! 터뜨립니다.
// 점선 미리보기로 발사각과 힘을 보며 조준할 수 있어요.

// ---- 화면 요소 ----
const startScreen = document.getElementById("start-screen");
const gameScreen  = document.getElementById("game-screen");
const overScreen  = document.getElementById("over-screen");
const startBtn    = document.getElementById("start-btn");
const homeBtn     = document.getElementById("home-btn");
const againBtn    = document.getElementById("again-btn");
const nextBtn     = document.getElementById("next-btn");
const overHomeBtn = document.getElementById("over-home-btn");
const levelRow    = document.getElementById("level-row");
const stageEl     = document.getElementById("stage");
const ammoEl      = document.getElementById("ammo");
const overEmojiEl = document.getElementById("over-emoji");
const overScoreEl = document.getElementById("over-score");
const overTitleEl = document.getElementById("over-title");

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

// 꼬마 대장(아이) 사진
const faceImg = new Image();
let faceReady = false;
faceImg.onload = () => { faceReady = true; };
faceImg.src = "assets/commander.jpg";

// ---- 물리 상수 ----
// 6살이 다루기 쉽도록 살짝 둥실하고(중력↓) 과하지 않은(최대힘↓) 포물선.
const GRAV = 1450;        // 중력 (px/s^2)
const BALL_BOUNCE = 0.35; // 포탄이 튕기는 정도
const MAX_POWER = 1250;   // 최대 발사 속도 (px/s)
const BALLOON_COLORS = [
  "#ff5d73", "#ffb703", "#06d6a0", "#4cc9f0",
  "#b56cff", "#ff8fab", "#52d273",
];

// 난이도: 발사 횟수(ammo)
const DIFF = { easy: 9, normal: 7, hard: 5 };
let chosenDiff = "easy";

// ---- 스테이지 설계 ----
// cx: 화면 가로 위치(0~1), col/row: 상자 격자, base: 바닥에서 떨어진 단위
// 좌표·크기는 단위 U(상자 한 변)에 비례 → 어떤 화면에서도 잘 맞아요.
const STAGES = [
  { // 1. 아주 쉬운 탑 하나
    boxes: [
      { cx: 0.74, base: 0, w: 1, h: 1 },
      { cx: 0.74, base: 1, w: 1, h: 1 },
      { cx: 0.74, base: 2, w: 1, h: 1 },
    ],
    balloons: [ { cx: 0.74, base: 3.2 } ],
  },
  { // 2. 두 기둥과 지붕
    boxes: [
      { cx: 0.66, base: 0, w: 1, h: 1 },
      { cx: 0.66, base: 1, w: 1, h: 1 },
      { cx: 0.82, base: 0, w: 1, h: 1 },
      { cx: 0.82, base: 1, w: 1, h: 1 },
      { cx: 0.74, base: 2, w: 2.4, h: 0.6 },
    ],
    balloons: [ { cx: 0.66, base: 3 }, { cx: 0.82, base: 3 } ],
  },
  { // 3. 큰 성벽
    boxes: [
      { cx: 0.60, base: 0, w: 1, h: 2 },
      { cx: 0.72, base: 0, w: 1, h: 1 },
      { cx: 0.72, base: 1, w: 1, h: 1 },
      { cx: 0.84, base: 0, w: 1, h: 2 },
      { cx: 0.72, base: 2, w: 3, h: 0.6 },
      { cx: 0.72, base: 2.9, w: 1, h: 1 },
    ],
    balloons: [
      { cx: 0.60, base: 2.3 }, { cx: 0.84, base: 2.3 }, { cx: 0.72, base: 4 },
    ],
  },
  { // 4. 멀고 가까운 두 탑 (거리 조절 연습)
    boxes: [
      { cx: 0.60, base: 0, w: 1, h: 1 },
      { cx: 0.60, base: 1, w: 1, h: 1 },
      { cx: 0.86, base: 0, w: 1, h: 1 },
      { cx: 0.86, base: 1, w: 1, h: 1 },
      { cx: 0.86, base: 2, w: 1, h: 1 },
    ],
    balloons: [ { cx: 0.60, base: 2.2 }, { cx: 0.86, base: 3.2 } ],
  },
  { // 5. 피라미드
    boxes: [
      { cx: 0.60, base: 0, w: 1, h: 1 },
      { cx: 0.72, base: 0, w: 1, h: 1 },
      { cx: 0.84, base: 0, w: 1, h: 1 },
      { cx: 0.66, base: 1, w: 1, h: 1 },
      { cx: 0.78, base: 1, w: 1, h: 1 },
      { cx: 0.72, base: 2, w: 1, h: 1 },
    ],
    balloons: [
      { cx: 0.60, base: 1.1 }, { cx: 0.84, base: 1.1 }, { cx: 0.72, base: 3.1 },
    ],
  },
  { // 6. 높은 성벽 요새 — 벽 뒤 풍선은 둥실 넘겨서 맞혀요
    boxes: [
      { cx: 0.56, base: 0, w: 1, h: 3 },
      { cx: 0.80, base: 0, w: 1, h: 1 },
      { cx: 0.80, base: 1, w: 1, h: 1 },
      { cx: 0.80, base: 2, w: 1, h: 1 },
      { cx: 0.80, base: 3, w: 1.8, h: 0.5 },
    ],
    balloons: [
      { cx: 0.56, base: 3.2 }, { cx: 0.80, base: 3.8 }, { cx: 0.92, base: 0.1 },
    ],
  },
];

// ---- 게임 상태 ----
let W = 0, H = 0, dpr = 1, groundY = 0, U = 48;
let tank, ball, boxes, balloons, confetti;
let stageIdx, ammo, popped, running, shake;
let aiming = false, aimStart = null, aimNow = null;
let animId;
let cleared = false;

// ---- 캔버스 크기 ----
function resize() {
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  const vv = window.visualViewport;
  W = Math.round(vv ? vv.width : window.innerWidth);
  H = Math.round(vv ? vv.height : window.innerHeight);
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  canvas.style.width = W + "px";
  canvas.style.height = H + "px";
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  groundY = H - Math.max(50, H * 0.10);
  U = Math.max(34, Math.min(62, W * 0.075));
}
window.addEventListener("resize", () => { resize(); if (running) layoutStage(); });
window.addEventListener("orientationchange", () => setTimeout(() => { resize(); if (running) layoutStage(); }, 150));
if (window.visualViewport) window.visualViewport.addEventListener("resize", resize);

// ---- 탱크 포신 끝(발사 위치) ----
function barrelTip() {
  const ang = tank.angle;
  return {
    x: tank.x + Math.cos(ang) * tank.barrelLen,
    y: tank.y - tank.h * 0.35 - Math.sin(ang) * tank.barrelLen,
  };
}

// ---- 스테이지 배치 ----
function layoutStage() {
  const def = STAGES[stageIdx % STAGES.length];
  boxes = [];
  balloons = [];
  for (const b of def.boxes) {
    const w = b.w * U, h = b.h * U;
    boxes.push(makeBox(W * b.cx, groundY - b.base * U - h / 2, w, h));
  }
  for (const p of def.balloons) {
    const r = U * 0.5;
    balloons.push(makeBalloon(W * p.cx, groundY - p.base * U - r, r));
  }
}

function makeBox(x, y, w, h) {
  return { x, y, w, h, vx: 0, vy: 0, static: false, hit: 0 };
}
function makeBalloon(x, y, r) {
  return {
    x, y, r, vx: 0, vy: 0,
    color: BALLOON_COLORS[(Math.random() * BALLOON_COLORS.length) | 0],
    sway: Math.random() * Math.PI * 2,
  };
}

// ---- 게임 시작 ----
function startGame() {
  resize();
  stageIdx = 0;
  beginStage();
  startScreen.classList.add("hidden");
  overScreen.classList.add("hidden");
  gameScreen.classList.remove("hidden");
  startLoop();
}

function startLoop() {
  cancelAnimationFrame(animId);
  let prev = performance.now();
  function loop(now) {
    const dt = Math.min((now - prev) / 1000, 0.032);
    prev = now;
    update(dt);
    draw();
    if (running) animId = requestAnimationFrame(loop);
  }
  animId = requestAnimationFrame(loop);
}

function beginStage() {
  running = true;
  cleared = false;
  shake = 0;
  ball = null;
  confetti = [];
  ammo = DIFF[chosenDiff];
  popped = 0;
  aiming = false; aimStart = null; aimNow = null;
  tank = {
    x: W * 0.17,
    y: groundY,
    w: Math.min(120, W * 0.26),
    h: Math.min(120, W * 0.26) * 0.8,
    angle: Math.PI / 4,   // 45도
    barrelLen: Math.min(120, W * 0.26) * 0.6,
  };
  layoutStage();
  updateHud();
}

// ---- 발사 ----
function launch(vx, vy) {
  if (ball || ammo <= 0) return;
  const tip = barrelTip();
  ball = { x: tip.x, y: tip.y, vx, vy, r: U * 0.34, rest: 0, life: 0 };
  ammo--;
  tank.recoil = 10;
  updateHud();
  beep(180, 0.12, "sawtooth");
  beep(120, 0.18, "triangle", 0.02);
}

// 조준 벡터(당긴 만큼 반대로 발사) → 발사 속도
// 6살용: 당김 범위를 넓혀 민감도를 낮추고, 항상 "오른쪽 위" 안전한 각도로 보정.
function aimVelocity() {
  if (!aimStart || !aimNow) return null;
  const dx = aimStart.x - aimNow.x;   // +면 오른쪽으로 발사
  const dy = aimStart.y - aimNow.y;   // 화면 y는 아래가 +, 위로 쏘려면 음수
  const len = Math.hypot(dx, dy);
  if (len < 16) return null;          // 작은 데드존 → 실수로 톡 쳐도 발사 안 됨

  // 힘: 당김 범위(MIN~MAX)를 화면에 맞춰 넓게 → 1px당 힘 변화가 작아 덜 예민.
  // 살짝만 당겨도 최소 40%는 나가고, 거기서부터 완만하게 세짐.
  const MIN_DRAG = 16;
  const MAX_DRAG = Math.max(200, Math.min(W, H) * 0.6);
  const t = Math.max(0, Math.min(1, (len - MIN_DRAG) / (MAX_DRAG - MIN_DRAG)));
  const power = (0.4 + 0.6 * t) * MAX_POWER;

  // 방향: 무조건 오른쪽(|dx|) + 위(up>0)로, 각도는 약 15°~80°로 제한.
  const up = Math.max(-dy, 0.001);    // 위 성분(항상 양수 → 절대 땅으로 안 쏨)
  let ang = Math.atan2(up, Math.abs(dx));
  ang = Math.max(0.26, Math.min(1.40, ang)); // 15°~80°
  return { vx: Math.cos(ang) * power, vy: -Math.sin(ang) * power, power };
}

// ---- 업데이트 ----
function update(dt) {
  // 탱크 포신 각도(조준 중에는 발사 방향을 향함)
  if (aiming) {
    const av = aimVelocity();
    if (av) tank.angle = Math.atan2(-av.vy, av.vx);
  }
  if (tank.recoil > 0) tank.recoil *= 0.82;

  // 포탄
  if (ball) {
    ball.life += dt;
    ball.vy += GRAV * dt;
    ball.x += ball.vx * dt;
    ball.y += ball.vy * dt;

    // 바닥
    if (ball.y + ball.r > groundY) {
      ball.y = groundY - ball.r;
      if (ball.vy > 0) ball.vy *= -BALL_BOUNCE;
      ball.vx *= 0.7;
    }
    // 상자와 충돌
    for (const bx of boxes) resolveBallBox(ball, bx);
    // 풍선과 충돌 → 펑!
    for (let i = balloons.length - 1; i >= 0; i--) {
      const ba = balloons[i];
      if (Math.hypot(ball.x - ba.x, ball.y - ba.y) < ball.r + ba.r) {
        popBalloon(i);
      }
    }
    // 멈췄거나 화면 밖 → 포탄 제거 후 다음 발사 가능
    // 바닥/상자 가리지 않고 "느려지면" 바로 정리해서 다음 발사가 빨리 켜지도록.
    const speed = Math.hypot(ball.vx, ball.vy);
    if (speed < 70) ball.rest += dt; else ball.rest = 0;
    if (ball.x < -80 || ball.x > W + 200 || ball.y > H + 200 || ball.rest > 0.4 || ball.life > 4) {
      ball = null;
    }
  }

  stepBoxes(dt);
  stepBalloons(dt);

  // 색종이
  for (let i = confetti.length - 1; i >= 0; i--) {
    const p = confetti[i];
    p.x += p.vx; p.y += p.vy; p.vy += 0.25;
    p.life -= dt * 1000; p.rot += p.vr;
    if (p.life <= 0) confetti.splice(i, 1);
  }

  if (shake > 0.5) shake *= 0.85;

  // 승패 판정
  if (running && balloons.length === 0) return winStage();
  if (running && ammo <= 0 && !ball && settled()) return failStage();
}

// 모든 물체가 거의 멈췄는지(다음 결과 판정용)
function settled() {
  for (const bx of boxes) if (Math.hypot(bx.vx, bx.vy) > 25) return false;
  for (const ba of balloons) if (Math.hypot(ba.vx, ba.vy) > 25) return false;
  return true;
}

// ---- 상자 물리 (회전 없는 AABB, 안정적) ----
function stepBoxes(dt) {
  for (const bx of boxes) {
    if (bx.static) continue;
    bx.vy += GRAV * dt;
    bx.x += bx.vx * dt;
    bx.y += bx.vy * dt;
    if (bx.hit > 0) bx.hit -= dt;
  }
  for (let iter = 0; iter < 5; iter++) {
    for (const bx of boxes) {
      if (bx.static) continue;
      const bottom = bx.y + bx.h / 2;
      if (bottom > groundY) {
        bx.y = groundY - bx.h / 2;
        if (bx.vy > 0) bx.vy *= -0.05;
        bx.vx *= 0.8;
      }
    }
    for (let i = 0; i < boxes.length; i++)
      for (let j = i + 1; j < boxes.length; j++)
        resolveBoxBox(boxes[i], boxes[j]);
  }
}

function resolveBoxBox(a, b) {
  const ima = a.static ? 0 : 1, imb = b.static ? 0 : 1, tot = ima + imb;
  if (tot === 0) return;
  const dx = b.x - a.x;
  const px = (a.w + b.w) / 2 - Math.abs(dx);
  if (px <= 0) return;
  const dy = b.y - a.y;
  const py = (a.h + b.h) / 2 - Math.abs(dy);
  if (py <= 0) return;
  if (px < py) {
    const dir = dx < 0 ? -1 : 1;
    a.x -= dir * px * (ima / tot);
    b.x += dir * px * (imb / tot);
    if (!a.static && !b.static) {
      const m = (a.vx + b.vx) / 2;
      a.vx = m * 0.6; b.vx = m * 0.6;
    } else { if (!a.static) a.vx *= 0.4; if (!b.static) b.vx *= 0.4; }
  } else {
    const dir = dy < 0 ? -1 : 1;
    a.y -= dir * py * (ima / tot);
    b.y += dir * py * (imb / tot);
    if (!a.static && !b.static) {
      const m = (a.vy + b.vy) / 2;
      a.vy = m; b.vy = m;
    } else { if (!a.static) a.vy = 0; if (!b.static) b.vy = 0; }
    if (!a.static) a.vx *= 0.9;
    if (!b.static) b.vx *= 0.9;
  }
}

// 포탄(원)이 상자(AABB)에 부딪힘 → 튕기고, 상자를 밀어냄
function resolveBallBox(ball, bx) {
  const hw = bx.w / 2, hh = bx.h / 2;
  const nx = Math.max(bx.x - hw, Math.min(ball.x, bx.x + hw));
  const ny = Math.max(bx.y - hh, Math.min(ball.y, bx.y + hh));
  let dx = ball.x - nx, dy = ball.y - ny;
  let d2 = dx * dx + dy * dy;
  if (d2 > ball.r * ball.r) return;

  let d = Math.sqrt(d2);
  let normX, normY;
  if (d > 0.0001) {
    normX = dx / d; normY = dy / d;
  } else {
    // 중심이 상자 안 → 가장 가까운 면으로 밀어냄
    const ox = hw - Math.abs(ball.x - bx.x);
    const oy = hh - Math.abs(ball.y - bx.y);
    if (ox < oy) { normX = ball.x < bx.x ? -1 : 1; normY = 0; d = -ox; }
    else { normX = 0; normY = ball.y < bx.y ? -1 : 1; d = -oy; }
  }
  const pen = ball.r - d;
  ball.x += normX * pen;
  ball.y += normY * pen;

  const vn = ball.vx * normX + ball.vy * normY;
  if (!bx.static && Math.abs(vn) > 60) {
    bx.vx += -normX * Math.abs(vn) * 0.55 + ball.vx * 0.12;
    bx.vy += -normY * Math.abs(vn) * 0.55 - 30; // 살짝 들썩
    bx.hit = 0.25;
    if (Math.abs(vn) > 250) { shake = 7; beep(140, 0.07, "square"); }
  }
  ball.vx -= (1 + BALL_BOUNCE) * vn * normX;
  ball.vy -= (1 + BALL_BOUNCE) * vn * normY;
  ball.vx *= 0.82; ball.vy *= 0.82;
}

// ---- 풍선 물리: 중력으로 떨어지고 상자/바닥에 얹힘, 세게 부딪히면 펑 ----
function stepBalloons(dt) {
  for (let i = balloons.length - 1; i >= 0; i--) {
    const ba = balloons[i];
    ba.sway += dt * 3;
    ba.vy += GRAV * 0.55 * dt; // 풍선이라 천천히
    ba.x += ba.vx * dt;
    ba.y += ba.vy * dt;
    ba.vx *= 0.99;

    // 바닥: 너무 세게 떨어지면 펑, 아니면 살짝 통통
    if (ba.y + ba.r > groundY) {
      ba.y = groundY - ba.r;
      if (ba.vy > 520) { popBalloon(i); continue; }
      ba.vy *= -0.25; ba.vx *= 0.7;
    }
    // 상자 위에 얹히기 / 움직이는 상자에 맞으면 펑
    for (const bx of boxes) {
      const hw = bx.w / 2, hh = bx.h / 2;
      const cx = Math.max(bx.x - hw, Math.min(ba.x, bx.x + hw));
      const cy = Math.max(bx.y - hh, Math.min(ba.y, bx.y + hh));
      const dx = ba.x - cx, dy = ba.y - cy;
      const dist = Math.hypot(dx, dy);
      if (dist < ba.r) {
        const boxSpd = Math.hypot(bx.vx, bx.vy);
        if (boxSpd > 230) { popBalloon(i); break; }
        const n = dist > 0.001 ? [dx / dist, dy / dist] : [0, -1];
        const pen = ba.r - dist;
        ba.x += n[0] * pen; ba.y += n[1] * pen;
        const vn = ba.vx * n[0] + ba.vy * n[1];
        if (vn < 0) { ba.vx -= vn * n[0]; ba.vy -= vn * n[1]; }
      }
    }
    // 화면 밖으로 굴러떨어짐 → 펑
    if (ba.x < -ba.r || ba.x > W + ba.r) popBalloon(i);
  }
}

function popBalloon(i) {
  const ba = balloons[i];
  if (!ba) return;
  balloons.splice(i, 1);
  popped++;
  updateHud();
  beep(660, 0.07, "sine");
  beep(990, 0.07, "sine", 0.05);
  for (let k = 0; k < 14; k++) {
    const ang = (Math.PI * 2 * k) / 14 + Math.random() * 0.4;
    const sp = 2 + Math.random() * 3.5;
    confetti.push({
      x: ba.x, y: ba.y,
      vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp - 1.5,
      size: 6 + Math.random() * 5,
      color: BALLOON_COLORS[(Math.random() * BALLOON_COLORS.length) | 0],
      life: 700 + Math.random() * 400,
      rot: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 0.4,
    });
  }
  shake = Math.max(shake, 5);
}

// ---- 그리기 ----
function draw() {
  ctx.save();
  if (shake > 0.5) ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);

  // 하늘
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, "#6ec6f0");
  sky.addColorStop(1, "#cdeefd");
  ctx.fillStyle = sky;
  ctx.fillRect(-20, 0, W + 40, H);

  drawCloud(W * 0.25, H * 0.16, 1);
  drawCloud(W * 0.7, H * 0.1, 0.8);
  drawCloud(W * 0.5, H * 0.28, 0.6);

  // 땅
  ctx.fillStyle = "#7cc66b";
  ctx.fillRect(-20, groundY, W + 40, H - groundY + 20);
  ctx.fillStyle = "#69b35a";
  ctx.fillRect(-20, groundY, W + 40, 8);

  // 상자
  for (const bx of boxes) drawBox(bx);
  // 풍선
  for (const ba of balloons) drawBalloon(ba);

  // 포탄
  if (ball) {
    ctx.fillStyle = "#3a3a3a";
    ctx.beginPath(); ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.beginPath(); ctx.arc(ball.x - ball.r * 0.3, ball.y - ball.r * 0.3, ball.r * 0.32, 0, Math.PI * 2); ctx.fill();
  }

  // 조준 점선 미리보기
  if (aiming) drawAim();

  // 탱크
  drawTank();

  // 색종이
  for (const p of confetti) {
    ctx.save();
    ctx.translate(p.x, p.y); ctx.rotate(p.rot);
    ctx.globalAlpha = Math.max(0, Math.min(1, p.life / 400));
    ctx.fillStyle = p.color;
    ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
    ctx.restore();
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}

function drawCloud(cx, cy, s) {
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.beginPath();
  ctx.arc(cx, cy, 26 * s, 0, Math.PI * 2);
  ctx.arc(cx + 28 * s, cy + 6 * s, 22 * s, 0, Math.PI * 2);
  ctx.arc(cx - 28 * s, cy + 6 * s, 20 * s, 0, Math.PI * 2);
  ctx.arc(cx, cy + 12 * s, 24 * s, 0, Math.PI * 2);
  ctx.fill();
}

function drawBox(bx) {
  ctx.save();
  ctx.translate(bx.x, bx.y);
  const w = bx.w, h = bx.h;
  // 나무 상자
  ctx.fillStyle = bx.hit > 0 ? "#e0a35a" : "#c8893f";
  roundRect(-w / 2, -h / 2, w, h, 6); ctx.fill();
  ctx.strokeStyle = "#8a5a22";
  ctx.lineWidth = Math.max(3, w * 0.06);
  roundRect(-w / 2, -h / 2, w, h, 6); ctx.stroke();
  // X 무늬
  ctx.lineWidth = Math.max(2, w * 0.04);
  ctx.beginPath();
  ctx.moveTo(-w / 2 + 4, -h / 2 + 4); ctx.lineTo(w / 2 - 4, h / 2 - 4);
  ctx.moveTo(w / 2 - 4, -h / 2 + 4); ctx.lineTo(-w / 2 + 4, h / 2 - 4);
  ctx.stroke();
  ctx.restore();
}

function drawBalloon(ba) {
  const x = ba.x, y = ba.y + Math.sin(ba.sway) * 1.5;
  ctx.save();
  ctx.fillStyle = ba.color;
  ctx.beginPath();
  ctx.ellipse(x, y, ba.r * 0.85, ba.r, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.beginPath();
  ctx.ellipse(x - ba.r * 0.28, y - ba.r * 0.32, ba.r * 0.18, ba.r * 0.28, -0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = ba.color;
  ctx.beginPath();
  ctx.moveTo(x - 5, y + ba.r); ctx.lineTo(x + 5, y + ba.r); ctx.lineTo(x, y + ba.r + 8);
  ctx.closePath(); ctx.fill();
  ctx.restore();
}

function drawTank() {
  const cx = tank.x, baseY = tank.y, w = tank.w, h = tank.h;
  const recoil = tank.recoil || 0;
  ctx.save();

  // 그림자
  ctx.fillStyle = "rgba(0,0,0,0.18)";
  ctx.beginPath();
  ctx.ellipse(cx, baseY - 2, w * 0.55, 9, 0, 0, Math.PI * 2);
  ctx.fill();

  // 포신 (조준 각도로 회전)
  const pivotY = baseY - h * 0.35;
  ctx.save();
  ctx.translate(cx, pivotY);
  ctx.rotate(-tank.angle);
  ctx.translate(-recoil, 0);
  ctx.fillStyle = "#3a4a5a";
  roundRect(0, -w * 0.06, tank.barrelLen, w * 0.12, 5); ctx.fill();
  ctx.fillStyle = "#2a3744";
  roundRect(tank.barrelLen - 8, -w * 0.08, 12, w * 0.16, 4); ctx.fill();
  ctx.restore();

  // 무한궤도
  const bodyY = baseY - h * 0.5;
  ctx.fillStyle = "#333a44";
  roundRect(cx - w / 2, baseY - h * 0.28, w, h * 0.28, 12); ctx.fill();
  ctx.fillStyle = "#5a6675";
  for (let i = 0; i < 4; i++) {
    const wx = cx - w / 2 + w * (0.16 + (0.68 * i) / 3);
    ctx.beginPath();
    ctx.arc(wx, baseY - h * 0.14, h * 0.11, 0, Math.PI * 2);
    ctx.fill();
  }
  // 차체
  const grad = ctx.createLinearGradient(cx - w / 2, 0, cx + w / 2, 0);
  grad.addColorStop(0, "#52d273"); grad.addColorStop(1, "#06d6a0");
  ctx.fillStyle = grad;
  roundRect(cx - w * 0.46, baseY - h * 0.55, w * 0.92, h * 0.32, 12); ctx.fill();

  // 포탑 — 아이 얼굴
  const faceR = w * 0.28;
  const faceX = cx, faceY = baseY - h * 0.62;
  ctx.fillStyle = "#04a77c";
  roundRect(faceX - faceR - 6, faceY, (faceR + 6) * 2, faceR + 6, 12); ctx.fill();
  ctx.fillStyle = "#bfe6ff";
  ctx.beginPath(); ctx.arc(faceX, faceY, faceR + 4, 0, Math.PI * 2); ctx.fill();
  if (faceReady) {
    ctx.save();
    ctx.beginPath(); ctx.arc(faceX, faceY, faceR, 0, Math.PI * 2); ctx.clip();
    const iw = faceImg.width, ih = faceImg.height;
    const scale = Math.max((faceR * 2) / iw, (faceR * 2) / ih);
    ctx.drawImage(faceImg, faceX - iw * scale / 2, faceY - ih * scale / 2, iw * scale, ih * scale);
    ctx.restore();
  }
  ctx.strokeStyle = "#fff"; ctx.lineWidth = 5;
  ctx.beginPath(); ctx.arc(faceX, faceY, faceR, 0, Math.PI * 2); ctx.stroke();
  ctx.restore();
}

// 조준 점선 + 힘 게이지
function drawAim() {
  const av = aimVelocity();
  if (!av) return;
  const tip = barrelTip();
  let x = tip.x, y = tip.y, vx = av.vx, vy = av.vy;
  const dt = 1 / 60;
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  for (let i = 0; i < 40; i++) {
    vy += GRAV * dt;
    x += vx * dt; y += vy * dt;
    if (y > groundY || x > W + 40 || x < -40) break;
    if (i % 2 === 0) {
      ctx.beginPath();
      ctx.arc(x, y, Math.max(3, 6 - i * 0.08), 0, Math.PI * 2);
      ctx.fill();
    }
  }
  // 힘 게이지(당김선)
  ctx.strokeStyle = "rgba(255,255,255,0.6)";
  ctx.lineWidth = 4;
  ctx.setLineDash([6, 6]);
  ctx.beginPath();
  ctx.moveTo(aimStart.x, aimStart.y);
  ctx.lineTo(aimNow.x, aimNow.y);
  ctx.stroke();
  ctx.setLineDash([]);
}

function roundRect(x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// ---- HUD ----
function updateHud() {
  stageEl.textContent = "스테이지 " + (stageIdx + 1);
  ammoEl.textContent = ammo > 0 ? "⚪".repeat(ammo) : "💨";
}

// ---- 결과 ----
function winStage() {
  running = false;
  cancelAnimationFrame(animId);
  stopMusic();
  cleared = true;
  beep(523, 0.12, "triangle");
  beep(659, 0.12, "triangle", 0.12);
  beep(784, 0.2, "triangle", 0.24);
  const hasNext = stageIdx < STAGES.length - 1;
  overEmojiEl.textContent = "🎉";
  overTitleEl.textContent = hasNext ? "스테이지 통과! 🏆" : "전부 깼어요! 🥇";
  overScoreEl.textContent = `🎈 ${popped}개 터뜨렸어요!  (포탄 ${ammo}개 남음)`;
  nextBtn.classList.toggle("hidden", !hasNext);
  gameScreen.classList.add("hidden");
  overScreen.classList.remove("hidden");
}

function failStage() {
  running = false;
  cancelAnimationFrame(animId);
  stopMusic();
  cleared = false;
  beep(300, 0.18, "sine");
  overEmojiEl.textContent = "💨";
  overTitleEl.textContent = "아쉬워요! 다시 해볼까요?";
  overScoreEl.textContent = `🎈 ${popped}개 터뜨렸어요`;
  nextBtn.classList.add("hidden");
  gameScreen.classList.add("hidden");
  overScreen.classList.remove("hidden");
}

// ---- 조작: 당겼다 놓기(슬링샷) ----
function pointerDown(x, y) {
  if (!running || ball) return;
  aiming = true;
  aimStart = { x, y };
  aimNow = { x, y };
}
function pointerMove(x, y) {
  if (!aiming) return;
  aimNow = { x, y };
}
function pointerUp() {
  if (!aiming) return;
  aiming = false;
  const av = aimVelocity();
  aimStart = null; aimNow = null;
  if (av) launch(av.vx, av.vy);
}

canvas.addEventListener("touchstart", (e) => {
  e.preventDefault();
  const t = e.touches[0];
  pointerDown(t.clientX, t.clientY);
}, { passive: false });
canvas.addEventListener("touchmove", (e) => {
  e.preventDefault();
  const t = e.touches[0];
  pointerMove(t.clientX, t.clientY);
}, { passive: false });
canvas.addEventListener("touchend", (e) => { e.preventDefault(); pointerUp(); }, { passive: false });
canvas.addEventListener("mousedown", (e) => pointerDown(e.clientX, e.clientY));
canvas.addEventListener("mousemove", (e) => { if (aiming) pointerMove(e.clientX, e.clientY); });
window.addEventListener("mouseup", pointerUp);

// 키보드(데스크톱): ←→ 각도, ↑↓ 힘, 스페이스 발사
let kbPower = 0.7;
window.addEventListener("keydown", (e) => {
  if (!running || ball) return;
  if (e.key === "ArrowLeft")  tank.angle = Math.min(Math.PI * 0.49, tank.angle + 0.05);
  if (e.key === "ArrowRight") tank.angle = Math.max(0.05, tank.angle - 0.05);
  if (e.key === "ArrowUp")    kbPower = Math.min(1, kbPower + 0.06);
  if (e.key === "ArrowDown")  kbPower = Math.max(0.2, kbPower - 0.06);
  if (e.key === " " || e.key === "Enter") {
    e.preventDefault();
    const p = kbPower * MAX_POWER;
    launch(Math.cos(tank.angle) * p, -Math.sin(tank.angle) * p);
  }
});

// ---- 소리 (효과음 + 배경음악) ----
let audioCtx, sfxGain, musicGain;
function ensureAudio() {
  if (audioCtx) return;
  try {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    sfxGain = audioCtx.createGain(); sfxGain.gain.value = 1; sfxGain.connect(audioCtx.destination);
    musicGain = audioCtx.createGain(); musicGain.gain.value = musicOn ? 0.5 : 0; musicGain.connect(audioCtx.destination);
  } catch (e) { /* 소리 없어도 게임은 계속 */ }
}
function beep(freq, dur, type = "sine", delay = 0) {
  ensureAudio();
  if (!audioCtx) return;
  try {
    const t = audioCtx.currentTime + delay;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type; osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.22, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(gain).connect(sfxGain);
    osc.start(t); osc.stop(t + dur + 0.02);
  } catch (e) { /* 무시 */ }
}

let musicOn = localStorage.getItem("tankMusic") !== "off";
let musicTimer = null, nextNoteTime = 0, musicStep = 0;
const TEMPO = 124;
const STEP_DUR = 60 / TEMPO / 2;
const MELODY = [
  72, 0, 74, 0, 76, 0, 72, 0,  79, 0, 79, 0, 77, 0, 0, 0,
  76, 0, 77, 0, 79, 0, 81, 0,  79, 76, 72, 0, 74, 0, 72, 0,
];
const BASS = [
  48, 0, 0, 0, 55, 0, 0, 0,  53, 0, 0, 0, 55, 0, 0, 0,
  48, 0, 0, 0, 55, 0, 0, 0,  50, 0, 0, 0, 55, 0, 43, 0,
];
function midiToFreq(m) { return 440 * Math.pow(2, (m - 69) / 12); }
function musicNote(midi, time, dur, type, vol) {
  if (!midi) return;
  const osc = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  osc.type = type; osc.frequency.value = midiToFreq(midi);
  g.gain.setValueAtTime(0.0001, time);
  g.gain.exponentialRampToValueAtTime(vol, time + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, time + dur);
  osc.connect(g).connect(musicGain);
  osc.start(time); osc.stop(time + dur + 0.02);
}
function musicScheduler() {
  if (!audioCtx) return;
  while (nextNoteTime < audioCtx.currentTime + 0.15) {
    const i = musicStep % MELODY.length;
    musicNote(MELODY[i], nextNoteTime, STEP_DUR * 0.9, "triangle", 0.4);
    musicNote(BASS[i], nextNoteTime, STEP_DUR * 1.7, "sine", 0.5);
    nextNoteTime += STEP_DUR; musicStep++;
  }
}
function startMusic() {
  ensureAudio();
  if (!audioCtx) return;
  audioCtx.resume();
  musicGain.gain.value = musicOn ? 0.5 : 0;
  if (!musicOn) return;
  musicStep = 0; nextNoteTime = audioCtx.currentTime + 0.1;
  clearInterval(musicTimer);
  musicTimer = setInterval(musicScheduler, 40);
}
function stopMusic() { clearInterval(musicTimer); musicTimer = null; }
function toggleMusic() {
  musicOn = !musicOn;
  localStorage.setItem("tankMusic", musicOn ? "on" : "off");
  updateMusicBtns();
  if (musicOn) { if (running) startMusic(); }
  else { if (musicGain) musicGain.gain.value = 0; stopMusic(); }
}
function updateMusicBtns() {
  const label = musicOn ? "🎵" : "🔇";
  document.querySelectorAll(".music-btn").forEach((b) => (b.textContent = label));
}

// ---- 버튼 이벤트 ----
levelRow.addEventListener("click", (e) => {
  const btn = e.target.closest(".level-btn");
  if (!btn) return;
  [...levelRow.children].forEach((b) => b.classList.remove("active"));
  btn.classList.add("active");
  chosenDiff = btn.dataset.diff;
});

startBtn.addEventListener("click", () => { ensureAudio(); if (audioCtx) audioCtx.resume(); startGame(); startMusic(); });
function restartStage() {
  overScreen.classList.add("hidden");
  gameScreen.classList.remove("hidden");
  beginStage();
  startMusic();
  startLoop();
}
// 같은 스테이지 다시(실패 재도전 / 통과 후 한 번 더)
againBtn.addEventListener("click", restartStage);
// 다음 스테이지로
nextBtn.addEventListener("click", () => { stageIdx++; restartStage(); });
function goHome() {
  running = false;
  cancelAnimationFrame(animId);
  stopMusic();
  gameScreen.classList.add("hidden");
  overScreen.classList.add("hidden");
  startScreen.classList.remove("hidden");
}
homeBtn.addEventListener("click", goHome);
overHomeBtn.addEventListener("click", goHome);

document.querySelectorAll(".music-btn").forEach((b) =>
  b.addEventListener("click", (e) => { e.stopPropagation(); ensureAudio(); toggleMusic(); })
);
updateMusicBtns();
