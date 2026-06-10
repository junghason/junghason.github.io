// ===== 풍선 탱크 — 6세 어린이용 슈팅 게임 =====
// 탱크를 좌우로 움직이고(드래그), 화면을 톡 누르면 솜사탕 포탄을 쏴서
// 하늘에서 내려오는 알록달록 풍선을 펑! 터뜨립니다.
// 무서운 적이나 전투는 전혀 없어요. 풍선을 놓치면 하트가 줄어듭니다.

// 화면 요소
const startScreen = document.getElementById("start-screen");
const gameScreen = document.getElementById("game-screen");
const overScreen = document.getElementById("over-screen");
const startBtn = document.getElementById("start-btn");
const homeBtn = document.getElementById("home-btn");
const againBtn = document.getElementById("again-btn");
const overHomeBtn = document.getElementById("over-home-btn");
const levelRow = document.getElementById("level-row");
const scoreEl = document.getElementById("score");
const heartsEl = document.getElementById("hearts");
const overScoreEl = document.getElementById("over-score");
const overTitleEl = document.getElementById("over-title");

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

// 꼬마 대장(아이) 사진 불러오기
const faceImg = new Image();
let faceReady = false;
faceImg.onload = () => { faceReady = true; };
faceImg.src = "assets/commander.jpg";

// 난이도 설정 (천천히 = 아주 쉬움)
// fall: 풍선이 내려오는 속도, spawn: 새 풍선이 나오는 간격(ms), fire: 자동 발사 간격(ms)
const SPEEDS = {
  slow:   { fall: 0.9, spawn: 1300, fire: 520 },
  normal: { fall: 1.4, spawn: 950,  fire: 480 },
  fast:   { fall: 2.0, spawn: 720,  fire: 440 },
};
let chosenSpeed = "slow";

// 풍선 색깔(알록달록)
const BALLOON_COLORS = [
  "#ff5d73", "#ffb703", "#06d6a0", "#4cc9f0",
  "#b56cff", "#ff8fab", "#ffd166", "#52d273",
];

// 게임 상태
let W = 0, H = 0, dpr = 1;
let player, balloons, bullets, confetti, score, hearts, running;
let lastSpawn, lastFire, animId, shake;

// 탱크가 화면 안에서만 움직이도록 좌우 경계
function playerBounds() {
  return {
    min: player.w / 2 + 6,
    max: W - player.w / 2 - 6,
  };
}

// ---- 캔버스 크기 맞추기 ----
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

  if (player) {
    player.y = H - player.h - 24;
    const b = playerBounds();
    player.x = Math.max(b.min, Math.min(b.max, player.x));
    player.targetX = Math.max(b.min, Math.min(b.max, player.targetX));
  }
}
window.addEventListener("resize", resize);
window.addEventListener("orientationchange", () => setTimeout(resize, 150));
if (window.visualViewport) {
  window.visualViewport.addEventListener("resize", resize);
}

// ---- 게임 시작 ----
function startGame() {
  resize();
  const tankW = Math.min(140, W * 0.34);
  player = {
    w: tankW,
    h: tankW * 0.92,
    x: W / 2,
    y: H - tankW * 0.92 - 24,
    targetX: W / 2,
    recoil: 0,
  };
  balloons = [];
  bullets = [];
  confetti = [];
  score = 0;
  hearts = 3;
  running = true;
  shake = 0;
  lastSpawn = 0;
  lastFire = 0;
  updateHud();

  startScreen.classList.add("hidden");
  overScreen.classList.add("hidden");
  gameScreen.classList.remove("hidden");

  cancelAnimationFrame(animId);
  let prev = performance.now();
  function loop(now) {
    const dt = Math.min(now - prev, 50);
    prev = now;
    update(dt, now);
    draw();
    if (running) animId = requestAnimationFrame(loop);
  }
  animId = requestAnimationFrame(loop);
}

// ---- 발사 ----
function fire() {
  if (!running || !player) return;
  const barrelY = player.y - player.h * 0.2;
  bullets.push({ x: player.x, y: barrelY, r: 12 });
  player.recoil = 8;
  beep(880, 0.06, "square");
  beep(1320, 0.05, "square", 0.04);
}

// ---- 업데이트 ----
function update(dt, now) {
  const cfg = SPEEDS[chosenSpeed];

  // 탱크가 손가락 위치로 부드럽게 이동
  const b = playerBounds();
  player.targetX = Math.max(b.min, Math.min(b.max, player.targetX));
  player.x += (player.targetX - player.x) * 0.22;
  player.x = Math.max(b.min, Math.min(b.max, player.x));
  if (player.recoil > 0) player.recoil *= 0.8;

  // 자동 발사 (6살도 움직이기만 하면 풍선이 펑펑 터지도록)
  if (now - lastFire > cfg.fire) {
    lastFire = now;
    fire();
  }

  // 풍선 생성
  if (now - lastSpawn > cfg.spawn) {
    lastSpawn = now;
    spawnBalloon();
  }

  // 풍선 이동
  const fallPx = cfg.fall * dt * 0.18 + cfg.fall * 0.4;
  for (let i = balloons.length - 1; i >= 0; i--) {
    const ba = balloons[i];
    ba.y += fallPx;
    ba.sway += 0.03;
    ba.x = ba.baseX + Math.sin(ba.sway) * ba.swayAmt;

    // 풍선을 놓침 (화면 아래로 빠져나감) → 하트 감소
    if (ba.y - ba.r > H) {
      balloons.splice(i, 1);
      hearts--;
      shake = 8;
      beep(180, 0.16, "sine");
      updateHud();
      if (hearts <= 0) return endGame();
    }
  }

  // 포탄 이동 + 풍선 충돌
  for (let i = bullets.length - 1; i >= 0; i--) {
    const bu = bullets[i];
    bu.y -= 9 + cfg.fall * 1.2;

    let hit = false;
    for (let j = balloons.length - 1; j >= 0; j--) {
      const ba = balloons[j];
      const dx = bu.x - ba.x;
      const dy = bu.y - ba.y;
      // 충돌 판정을 아주 관대하게 (작은 손도 잘 맞도록)
      const reach = ba.r + bu.r + 14;
      if (dx * dx + dy * dy < reach * reach) {
        popBalloon(ba);
        balloons.splice(j, 1);
        hit = true;
        break;
      }
    }

    if (hit || bu.y < -20) bullets.splice(i, 1);
  }

  // 색종이(confetti) 이동
  for (let i = confetti.length - 1; i >= 0; i--) {
    const p = confetti[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.25;
    p.life -= dt;
    p.rot += p.vr;
    if (p.life <= 0) confetti.splice(i, 1);
  }

  if (shake > 0.5) shake *= 0.85;
}

function spawnBalloon() {
  const r = 30 + Math.random() * 14;
  const margin = r + 8;
  const baseX = margin + Math.random() * (W - margin * 2);
  balloons.push({
    x: baseX,
    baseX,
    y: -r - 10,
    r,
    color: BALLOON_COLORS[(Math.random() * BALLOON_COLORS.length) | 0],
    sway: Math.random() * Math.PI * 2,
    swayAmt: 12 + Math.random() * 22,
  });
}

function popBalloon(ba) {
  score++;
  updateHud();
  // 기분 좋은 "펑!" 소리
  beep(660, 0.07, "sine");
  beep(990, 0.07, "sine", 0.05);
  // 색종이 터뜨리기
  const n = 12;
  for (let k = 0; k < n; k++) {
    const ang = (Math.PI * 2 * k) / n + Math.random() * 0.4;
    const sp = 2 + Math.random() * 3.5;
    confetti.push({
      x: ba.x,
      y: ba.y,
      vx: Math.cos(ang) * sp,
      vy: Math.sin(ang) * sp - 1.5,
      size: 6 + Math.random() * 5,
      color: BALLOON_COLORS[(Math.random() * BALLOON_COLORS.length) | 0],
      life: 700 + Math.random() * 400,
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.4,
    });
  }
}

// ---- 그리기 ----
function draw() {
  ctx.save();
  if (shake > 0.5) {
    ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
  }

  // 하늘 배경
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, "#6ec6f0");
  sky.addColorStop(1, "#cdeefd");
  ctx.fillStyle = sky;
  ctx.fillRect(-20, 0, W + 40, H);

  // 솜털 구름 몇 개 (정적이라 부담 없음)
  drawCloud(W * 0.2, H * 0.16, 1);
  drawCloud(W * 0.72, H * 0.1, 0.8);
  drawCloud(W * 0.5, H * 0.3, 0.6);

  // 풀밭 바닥
  ctx.fillStyle = "#7cc66b";
  ctx.fillRect(-20, H - 50, W + 40, 70);

  // 풍선
  for (const ba of balloons) drawBalloon(ba);

  // 포탄 (솜사탕 같은 동그란 탄)
  for (const bu of bullets) {
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(bu.x, bu.y, bu.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffd166";
    ctx.beginPath();
    ctx.arc(bu.x, bu.y, bu.r * 0.55, 0, Math.PI * 2);
    ctx.fill();
  }

  // 탱크
  drawTank(player.x, player.y, player.w, player.h);

  // 색종이
  for (const p of confetti) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
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

function drawBalloon(ba) {
  ctx.save();
  // 풍선 몸통
  ctx.fillStyle = ba.color;
  ctx.beginPath();
  ctx.ellipse(ba.x, ba.y, ba.r * 0.85, ba.r, 0, 0, Math.PI * 2);
  ctx.fill();
  // 반짝이는 하이라이트
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.beginPath();
  ctx.ellipse(ba.x - ba.r * 0.28, ba.y - ba.r * 0.32, ba.r * 0.18, ba.r * 0.28, -0.4, 0, Math.PI * 2);
  ctx.fill();
  // 묶음 매듭
  ctx.fillStyle = ba.color;
  ctx.beginPath();
  ctx.moveTo(ba.x - 5, ba.y + ba.r);
  ctx.lineTo(ba.x + 5, ba.y + ba.r);
  ctx.lineTo(ba.x, ba.y + ba.r + 8);
  ctx.closePath();
  ctx.fill();
  // 실
  ctx.strokeStyle = "rgba(255,255,255,0.7)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(ba.x, ba.y + ba.r + 8);
  ctx.quadraticCurveTo(ba.x + 8, ba.y + ba.r + 22, ba.x, ba.y + ba.r + 34);
  ctx.stroke();
  ctx.restore();
}

function drawTank(cx, top, w, h) {
  const x = cx - w / 2;
  const recoil = player.recoil || 0;
  ctx.save();

  // 그림자
  ctx.fillStyle = "rgba(0,0,0,0.18)";
  ctx.beginPath();
  ctx.ellipse(cx, top + h - 2, w * 0.5, 10, 0, 0, Math.PI * 2);
  ctx.fill();

  // 포신 (위로 향함) — 발사할 때 살짝 뒤로 밀림
  const barrelW = w * 0.14;
  const barrelH = h * 0.42;
  ctx.fillStyle = "#3a4a5a";
  roundRect(cx - barrelW / 2, top - barrelH * 0.5 + recoil, barrelW, barrelH + h * 0.2, 6);
  ctx.fill();
  // 포구
  ctx.fillStyle = "#2a3744";
  roundRect(cx - barrelW * 0.7, top - barrelH * 0.5 + recoil, barrelW * 1.4, 10, 5);
  ctx.fill();

  // 차체(treads 포함)
  const bodyY = top + h * 0.42;
  const bodyH = h * 0.5;
  // 무한궤도(바퀴)
  ctx.fillStyle = "#333a44";
  roundRect(x, bodyY + bodyH * 0.55, w, bodyH * 0.55, 12);
  ctx.fill();
  // 바퀴 동그라미
  ctx.fillStyle = "#5a6675";
  const wheels = 4;
  for (let i = 0; i < wheels; i++) {
    const wx = x + w * (0.16 + (0.68 * i) / (wheels - 1));
    ctx.beginPath();
    ctx.arc(wx, bodyY + bodyH * 0.82, bodyH * 0.2, 0, Math.PI * 2);
    ctx.fill();
  }
  // 차체 상부 (밝은 색)
  const grad = ctx.createLinearGradient(x, bodyY, x + w, bodyY);
  grad.addColorStop(0, "#52d273");
  grad.addColorStop(1, "#06d6a0");
  ctx.fillStyle = grad;
  roundRect(x + w * 0.04, bodyY, w * 0.92, bodyH * 0.7, 12);
  ctx.fill();

  // 포탑(turret) — 아이 얼굴이 빼꼼
  const faceR = w * 0.27;
  const faceX = cx;
  const faceY = top + h * 0.4;

  // 포탑 받침
  ctx.fillStyle = "#04a77c";
  roundRect(faceX - faceR - 8, faceY, (faceR + 8) * 2, faceR + 6, 14);
  ctx.fill();

  // 얼굴 배경 원
  ctx.fillStyle = "#bfe6ff";
  ctx.beginPath();
  ctx.arc(faceX, faceY, faceR + 4, 0, Math.PI * 2);
  ctx.fill();

  if (faceReady) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(faceX, faceY, faceR, 0, Math.PI * 2);
    ctx.clip();
    // 사진을 원 안에 꽉 차게(cover)
    const iw = faceImg.width, ih = faceImg.height;
    const scale = Math.max((faceR * 2) / iw, (faceR * 2) / ih);
    const dw = iw * scale, dh = ih * scale;
    ctx.drawImage(faceImg, faceX - dw / 2, faceY - dh / 2, dw, dh);
    ctx.restore();
  }

  // 얼굴 테두리 (헬멧 느낌)
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(faceX, faceY, faceR, 0, Math.PI * 2);
  ctx.stroke();

  ctx.restore();
}

function roundRect(x, y, w, h, r) {
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
  scoreEl.textContent = "🎈 " + score;
  heartsEl.textContent = "❤️".repeat(Math.max(0, hearts)) || "💔";
}

// ---- 게임 종료 ----
function endGame() {
  running = false;
  cancelAnimationFrame(animId);
  stopMusic();
  beep(330, 0.2, "triangle");
  overScoreEl.textContent = `🎈 ${score}개 터뜨렸어요!`;
  overTitleEl.textContent = score >= 15 ? "와! 최고예요! 🏆" : "참 잘했어요!";
  gameScreen.classList.add("hidden");
  overScreen.classList.remove("hidden");
}

// ---- 조작: 손가락으로 이동 + 톡 누르면 발사 ----
function pointerMove(clientX) {
  if (!player) return;
  player.targetX = clientX;
}
canvas.addEventListener("touchstart", (e) => {
  e.preventDefault();
  pointerMove(e.touches[0].clientX);
  fire(); // 누르는 순간 바로 발사 (즉각적인 재미)
}, { passive: false });
canvas.addEventListener("touchmove", (e) => {
  e.preventDefault();
  pointerMove(e.touches[0].clientX);
}, { passive: false });
canvas.addEventListener("mousedown", (e) => { pointerMove(e.clientX); fire(); });
canvas.addEventListener("mousemove", (e) => {
  if (e.buttons) pointerMove(e.clientX);
});
// 키보드(데스크톱)
window.addEventListener("keydown", (e) => {
  if (!player || !running) return;
  const b = playerBounds();
  if (e.key === "ArrowLeft") player.targetX = Math.max(b.min, player.x - 70);
  if (e.key === "ArrowRight") player.targetX = Math.min(b.max, player.x + 70);
  if (e.key === " " || e.key === "ArrowUp") { e.preventDefault(); fire(); }
});

// ---- 소리 (효과음 + 배경음악) ----
let audioCtx, sfxGain, musicGain;

function ensureAudio() {
  if (audioCtx) return;
  try {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    sfxGain = audioCtx.createGain();
    sfxGain.gain.value = 1;
    sfxGain.connect(audioCtx.destination);
    musicGain = audioCtx.createGain();
    musicGain.gain.value = musicOn ? 0.5 : 0; // 음악은 효과음보다 작게
    musicGain.connect(audioCtx.destination);
  } catch (e) { /* 소리 못 내도 게임은 계속 */ }
}

function beep(freq, dur, type = "sine", delay = 0) {
  ensureAudio();
  if (!audioCtx) return;
  try {
    const t = audioCtx.currentTime + delay;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.22, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(gain).connect(sfxGain);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  } catch (e) { /* 무시 */ }
}

// ---- 배경음악 (밝고 경쾌한 멜로디 반복) ----
let musicOn = localStorage.getItem("tankMusic") !== "off";
let musicTimer = null, nextNoteTime = 0, musicStep = 0;
const TEMPO = 132;                 // bpm
const STEP_DUR = 60 / TEMPO / 2;   // 8분음표 길이(초)

// C장조 동요풍 멜로디 (MIDI 음높이, 0 = 쉼표) — 4마디 반복
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
  osc.type = type;
  osc.frequency.value = midiToFreq(midi);
  g.gain.setValueAtTime(0.0001, time);
  g.gain.exponentialRampToValueAtTime(vol, time + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, time + dur);
  osc.connect(g).connect(musicGain);
  osc.start(time);
  osc.stop(time + dur + 0.02);
}

function musicScheduler() {
  if (!audioCtx) return;
  while (nextNoteTime < audioCtx.currentTime + 0.15) {
    const i = musicStep % MELODY.length;
    musicNote(MELODY[i], nextNoteTime, STEP_DUR * 0.9, "triangle", 0.4);
    musicNote(BASS[i], nextNoteTime, STEP_DUR * 1.7, "sine", 0.5);
    nextNoteTime += STEP_DUR;
    musicStep++;
  }
}

function startMusic() {
  ensureAudio();
  if (!audioCtx) return;
  audioCtx.resume();
  musicGain.gain.value = musicOn ? 0.5 : 0;
  if (!musicOn) return;
  musicStep = 0;
  nextNoteTime = audioCtx.currentTime + 0.1;
  clearInterval(musicTimer);
  musicTimer = setInterval(musicScheduler, 40);
}

function stopMusic() {
  clearInterval(musicTimer);
  musicTimer = null;
}

function toggleMusic() {
  musicOn = !musicOn;
  localStorage.setItem("tankMusic", musicOn ? "on" : "off");
  updateMusicBtns();
  if (musicOn) {
    if (running) startMusic();
  } else {
    if (musicGain) musicGain.gain.value = 0;
    stopMusic();
  }
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
  chosenSpeed = btn.dataset.speed;
});

startBtn.addEventListener("click", () => { ensureAudio(); if (audioCtx) audioCtx.resume(); startGame(); startMusic(); });
againBtn.addEventListener("click", () => { startGame(); startMusic(); });
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

// 음악 켜기/끄기 버튼
document.querySelectorAll(".music-btn").forEach((b) =>
  b.addEventListener("click", (e) => { e.stopPropagation(); ensureAudio(); toggleMusic(); })
);
updateMusicBtns();
