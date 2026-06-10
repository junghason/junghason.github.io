// ===== 별·하트 모으기 — 초등학생용 받기 게임 =====
// 캐릭터를 좌우로 움직여서, 하늘에서 콩콩 떨어지는
// 별·하트·사탕·꽃을 모아요. 받을 때마다 캐릭터가 통통 점프!
// 무지개(🌈)는 보너스 점수 + 하트를 충전해 줘요.
// 연속으로 받으면 콤보 점수가 쌓여요. 놓치면 하트가 하나 줄어요.

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

// 주인공 얼굴(동그란 캐릭터) 불러오기
const faceImg = new Image();
let faceReady = false;
faceImg.onload = () => { faceReady = true; };
faceImg.src = "assets/player.png";

// 난이도 (천천히 = 아주 쉬움)
// fall: 떨어지는 속도, spawn: 새 보물이 나오는 간격(ms)
const SPEEDS = {
  slow:   { fall: 1.5, spawn: 1100 },
  normal: { fall: 2.3, spawn: 820 },
  fast:   { fall: 3.2, spawn: 620 },
};
let chosenSpeed = "slow";

// 떨어지는 보물들 (이모지 + 점수)
const TREASURES = [
  { e: "⭐", p: 1 },
  { e: "💖", p: 1 },
  { e: "🍬", p: 1 },
  { e: "🌸", p: 1 },
  { e: "🍭", p: 1 },
  { e: "🎀", p: 1 },
];
// 가끔(드물게) 나오는 무지개 — 보너스 + 하트 충전
const RAINBOW = { e: "🌈", p: 5, heal: true };

// 게임 상태
let W = 0, H = 0, dpr = 1;
let player, items, sparkles, floats, score, hearts, combo, bestCombo, running;
let lastSpawn, animId, shake, sparkleSeeds;

// 캐릭터가 화면 안에서만 움직이도록 좌우 경계
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
    player.baseY = H - player.w * 0.5 - 36;
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

// 배경 반짝이 별 위치 (정적)
function makeSparkleSeeds() {
  sparkleSeeds = [];
  for (let i = 0; i < 18; i++) {
    sparkleSeeds.push({
      x: Math.random(),
      y: Math.random() * 0.7,
      r: 1.5 + Math.random() * 2.5,
      ph: Math.random() * Math.PI * 2,
    });
  }
}

// ---- 게임 시작 ----
function startGame() {
  resize();
  const faceW = Math.min(120, W * 0.3);
  player = {
    w: faceW,
    x: W / 2,
    targetX: W / 2,
    baseY: H - faceW * 0.5 - 36,
    hopV: 0,      // 점프 속도
    hopY: 0,      // 점프 높이(오프셋)
    bob: 0,       // 통통 흔들기 위상
    squash: 0,    // 받을 때 살짝 눌리는 효과
  };
  items = [];
  sparkles = [];
  floats = [];
  score = 0;
  hearts = 3;
  combo = 0;
  bestCombo = 0;
  running = true;
  shake = 0;
  lastSpawn = 0;
  makeSparkleSeeds();
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
    draw(now);
    if (running) animId = requestAnimationFrame(loop);
  }
  animId = requestAnimationFrame(loop);
}

// ---- 보물 생성 ----
function spawnItem() {
  const isRainbow = Math.random() < 0.08; // 드물게 무지개
  const t = isRainbow ? RAINBOW : TREASURES[(Math.random() * TREASURES.length) | 0];
  const size = 40 + Math.random() * 12;
  const margin = size + 6;
  const baseX = margin + Math.random() * (W - margin * 2);
  items.push({
    e: t.e,
    p: t.p,
    heal: !!t.heal,
    rainbow: isRainbow,
    x: baseX,
    baseX,
    y: -size,
    size,
    sway: Math.random() * Math.PI * 2,
    swayAmt: 10 + Math.random() * 20,
    rot: (Math.random() - 0.5) * 0.4,
    vr: (Math.random() - 0.5) * 0.04,
  });
}

// ---- 업데이트 ----
function update(dt, now) {
  const cfg = SPEEDS[chosenSpeed];

  // 캐릭터가 손가락 위치로 부드럽게 이동
  const b = playerBounds();
  player.targetX = Math.max(b.min, Math.min(b.max, player.targetX));
  player.x += (player.targetX - player.x) * 0.25;
  player.x = Math.max(b.min, Math.min(b.max, player.x));

  // 통통 튀는 기본 움직임 + 점프 물리
  player.bob += dt * 0.008;
  player.hopV += 0.9;            // 중력
  player.hopY += player.hopV;
  if (player.hopY > 0) { player.hopY = 0; player.hopV = 0; }
  if (player.squash > 0) player.squash *= 0.82;

  // 보물 생성
  if (now - lastSpawn > cfg.spawn) {
    lastSpawn = now;
    spawnItem();
  }

  // 캐릭터 중심(받는 지점)
  const py = player.baseY + player.hopY;
  const catchR = player.w * 0.62;

  // 보물 이동 + 받기 판정
  const fallPx = cfg.fall * dt * 0.16 + cfg.fall * 0.5;
  for (let i = items.length - 1; i >= 0; i--) {
    const it = items[i];
    it.y += fallPx;
    it.sway += 0.04;
    it.x = it.baseX + Math.sin(it.sway) * it.swayAmt;
    it.rot += it.vr;

    // 받았다!
    const dx = it.x - player.x;
    const dy = it.y - py;
    if (dx * dx + dy * dy < catchR * catchR) {
      catchItem(it);
      items.splice(i, 1);
      continue;
    }

    // 놓침 (바닥 아래로) → 하트 감소
    if (it.y - it.size > H) {
      items.splice(i, 1);
      combo = 0;
      hearts--;
      shake = 8;
      beep(200, 0.16, "sine");
      updateHud();
      if (hearts <= 0) return endGame();
    }
  }

  // 반짝이 입자
  for (let i = sparkles.length - 1; i >= 0; i--) {
    const s = sparkles[i];
    s.x += s.vx;
    s.y += s.vy;
    s.vy += 0.18;
    s.life -= dt;
    s.rot += s.vr;
    if (s.life <= 0) sparkles.splice(i, 1);
  }

  // 떠오르는 점수 글자
  for (let i = floats.length - 1; i >= 0; i--) {
    const f = floats[i];
    f.y -= 0.7;
    f.life -= dt;
    if (f.life <= 0) floats.splice(i, 1);
  }

  if (shake > 0.5) shake *= 0.85;
}

function catchItem(it) {
  combo++;
  if (combo > bestCombo) bestCombo = combo;
  // 콤보 보너스: 3콤보부터 점수 +1씩 추가
  const bonus = combo >= 3 ? Math.min(5, combo - 2) : 0;
  const gained = it.p + bonus;
  score += gained;

  // 점프 + 눌림 효과
  player.hopV = -13;
  player.squash = 0.35;

  if (it.heal) {
    if (hearts < 5) hearts++;
    happySound(true);
    addFloat(player.x, player.baseY - player.w * 0.7, "🌈 +" + gained, "#a06bff");
  } else {
    happySound(false);
    const label = bonus > 0 ? "+" + gained + " 콤보!" : "+" + gained;
    addFloat(player.x, player.baseY - player.w * 0.7, label, "#ff4f8b");
  }

  burstSparkles(it.x, it.y, it.rainbow);
  updateHud();

  // 점수 잔치
  if (score === 20 || score === 50 || score === 100) {
    addFloat(W / 2, H * 0.35, "최고예요! 🎉", "#ff8a00");
    bigSparkles();
  }
}

function addFloat(x, y, text, color) {
  floats.push({ x, y, text, color, life: 900 });
}

function burstSparkles(x, y, rainbow) {
  const colors = rainbow
    ? ["#ff5d73", "#ffb703", "#06d6a0", "#4cc9f0", "#b56cff", "#ff8fab"]
    : ["#ffd166", "#ff8fab", "#fff7b0", "#ffffff"];
  const n = rainbow ? 22 : 12;
  for (let k = 0; k < n; k++) {
    const ang = (Math.PI * 2 * k) / n + Math.random() * 0.5;
    const sp = 2 + Math.random() * 3.5;
    sparkles.push({
      x, y,
      vx: Math.cos(ang) * sp,
      vy: Math.sin(ang) * sp - 2,
      size: 5 + Math.random() * 5,
      color: colors[(Math.random() * colors.length) | 0],
      life: 600 + Math.random() * 400,
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.4,
      star: Math.random() < 0.5,
    });
  }
}

function bigSparkles() {
  for (let k = 0; k < 40; k++) {
    sparkles.push({
      x: Math.random() * W,
      y: -10,
      vx: (Math.random() - 0.5) * 3,
      vy: 2 + Math.random() * 3,
      size: 6 + Math.random() * 6,
      color: ["#ff5d73", "#ffb703", "#06d6a0", "#4cc9f0", "#b56cff"][(Math.random() * 5) | 0],
      life: 1400,
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.4,
      star: Math.random() < 0.6,
    });
  }
}

// ---- 그리기 ----
function draw(now) {
  ctx.save();
  if (shake > 0.5) {
    ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
  }

  // 파스텔 하늘
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, "#ffd6ec");
  sky.addColorStop(1, "#e7d8ff");
  ctx.fillStyle = sky;
  ctx.fillRect(-20, 0, W + 40, H);

  // 반짝이는 배경 별
  for (const s of sparkleSeeds) {
    const a = 0.4 + 0.5 * Math.abs(Math.sin(now * 0.002 + s.ph));
    ctx.fillStyle = `rgba(255,255,255,${a})`;
    drawStar(s.x * W, s.y * H, s.r, s.r * 0.5, 5);
  }

  // 솜털 구름
  drawCloud(W * 0.2, H * 0.16, 1);
  drawCloud(W * 0.75, H * 0.1, 0.8);
  drawCloud(W * 0.52, H * 0.26, 0.6);

  // 풀밭 바닥 + 꽃
  ctx.fillStyle = "#9be08a";
  ctx.fillRect(-20, H - 44, W + 40, 64);
  ctx.font = "20px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (let i = 0; i < 8; i++) {
    ctx.fillText("🌷", (i + 0.5) * (W / 8), H - 22);
  }

  // 떨어지는 보물
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (const it of items) {
    ctx.save();
    ctx.translate(it.x, it.y);
    ctx.rotate(it.rot);
    if (it.rainbow) {
      const g = 0.5 + 0.5 * Math.abs(Math.sin(now * 0.006));
      ctx.shadowColor = "rgba(255,120,200,0.9)";
      ctx.shadowBlur = 12 + g * 12;
    }
    ctx.font = it.size + "px sans-serif";
    ctx.fillText(it.e, 0, 0);
    ctx.restore();
  }

  // 주인공 캐릭터
  drawPlayer(now);

  // 반짝이 입자
  for (const s of sparkles) {
    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.rotate(s.rot);
    ctx.globalAlpha = Math.max(0, Math.min(1, s.life / 400));
    ctx.fillStyle = s.color;
    if (s.star) {
      drawStar(0, 0, s.size, s.size * 0.45, 5);
    } else {
      ctx.fillRect(-s.size / 2, -s.size / 2, s.size, s.size);
    }
    ctx.restore();
  }
  ctx.globalAlpha = 1;

  // 떠오르는 점수 글자
  for (const f of floats) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, f.life / 500));
    ctx.fillStyle = f.color;
    ctx.font = "900 26px 'Apple SD Gothic Neo', sans-serif";
    ctx.textAlign = "center";
    ctx.lineWidth = 4;
    ctx.strokeStyle = "rgba(255,255,255,0.9)";
    ctx.strokeText(f.text, f.x, f.y);
    ctx.fillText(f.text, f.x, f.y);
    ctx.restore();
  }

  // 콤보 표시
  if (combo >= 3) {
    ctx.save();
    ctx.globalAlpha = 0.92;
    ctx.fillStyle = "#ff4f8b";
    ctx.font = "900 30px 'Apple SD Gothic Neo', sans-serif";
    ctx.textAlign = "center";
    ctx.lineWidth = 5;
    ctx.strokeStyle = "#fff";
    const txt = combo + " 콤보! 🔥";
    ctx.strokeText(txt, W / 2, 88);
    ctx.fillText(txt, W / 2, 88);
    ctx.restore();
  }

  ctx.restore();
}

function drawPlayer(now) {
  const py = player.baseY + player.hopY;
  const r = player.w / 2;
  // 눌림(squash) — 받을 때 살짝 납작
  const sx = 1 + player.squash * 0.5;
  const sy = 1 - player.squash * 0.5;

  // 그림자 (점프하면 작아짐)
  const shadowScale = 1 - Math.min(0.5, -player.hopY / 120);
  ctx.fillStyle = "rgba(120,60,110,0.18)";
  ctx.beginPath();
  ctx.ellipse(player.x, player.baseY + r * 0.95, r * 0.8 * shadowScale, 9 * shadowScale, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  ctx.translate(player.x, py);
  ctx.scale(sx, sy);

  if (faceReady) {
    const d = player.w;
    ctx.drawImage(faceImg, -d / 2, -d / 2, d, d);
  } else {
    // 사진이 아직 안 떴을 때 임시 동그라미
    ctx.fillStyle = "#ffb3d1";
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // 양옆에 살랑이는 작은 손 (보물 받는 느낌)
  const wave = Math.sin(player.bob) * 4;
  ctx.font = (r * 0.5) + "px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("✨", player.x - r * 0.95, py - r * 0.2 + wave);
  ctx.fillText("✨", player.x + r * 0.95, py - r * 0.2 - wave);
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

// 별 모양 그리기
function drawStar(cx, cy, outer, inner, points) {
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const rad = i % 2 === 0 ? outer : inner;
    const ang = (Math.PI * i) / points - Math.PI / 2;
    const x = cx + Math.cos(ang) * rad;
    const y = cy + Math.sin(ang) * rad;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
}

// ---- HUD ----
function updateHud() {
  scoreEl.textContent = "⭐ " + score;
  heartsEl.textContent = "❤️".repeat(Math.max(0, hearts)) || "💔";
}

// ---- 게임 종료 ----
function endGame() {
  running = false;
  cancelAnimationFrame(animId);
  stopMusic();
  beep(330, 0.2, "triangle");
  overScoreEl.textContent = `⭐ ${score}개 모았어요! (최고 콤보 ${bestCombo})`;
  overTitleEl.textContent = score >= 30 ? "와! 최고예요! 🏆" : "참 잘했어요!";
  gameScreen.classList.add("hidden");
  overScreen.classList.remove("hidden");
}

// ---- 조작: 손가락으로 좌우 이동 ----
function pointerMove(clientX) {
  if (!player) return;
  player.targetX = clientX;
}
canvas.addEventListener("touchstart", (e) => {
  e.preventDefault();
  pointerMove(e.touches[0].clientX);
}, { passive: false });
canvas.addEventListener("touchmove", (e) => {
  e.preventDefault();
  pointerMove(e.touches[0].clientX);
}, { passive: false });
canvas.addEventListener("mousedown", (e) => { pointerMove(e.clientX); });
canvas.addEventListener("mousemove", (e) => {
  if (e.buttons) pointerMove(e.clientX);
});
// 키보드(데스크톱)
window.addEventListener("keydown", (e) => {
  if (!player || !running) return;
  const b = playerBounds();
  if (e.key === "ArrowLeft") player.targetX = Math.max(b.min, player.targetX - 80);
  if (e.key === "ArrowRight") player.targetX = Math.min(b.max, player.targetX + 80);
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
    musicGain.gain.value = musicOn ? 0.5 : 0;
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

// 받았을 때 기분 좋은 소리 (콤보가 높을수록 음이 올라감)
function happySound(rainbow) {
  if (rainbow) {
    beep(784, 0.08, "triangle");
    beep(988, 0.08, "triangle", 0.07);
    beep(1319, 0.12, "triangle", 0.14);
    return;
  }
  const base = 660 + Math.min(8, combo) * 40;
  beep(base, 0.06, "sine");
  beep(base * 1.5, 0.06, "sine", 0.04);
}

// ---- 배경음악 (밝고 경쾌한 멜로디 반복) ----
let musicOn = localStorage.getItem("starMusic") !== "off";
let musicTimer = null, nextNoteTime = 0, musicStep = 0;
const TEMPO = 128;
const STEP_DUR = 60 / TEMPO / 2;

// C장조 동요풍 멜로디 (MIDI 음높이, 0 = 쉼표)
const MELODY = [
  72, 0, 76, 0, 79, 0, 76, 0,  74, 0, 77, 0, 74, 0, 0, 0,
  72, 0, 76, 0, 79, 0, 84, 0,  81, 79, 77, 0, 76, 0, 72, 0,
];
const BASS = [
  48, 0, 0, 0, 55, 0, 0, 0,  50, 0, 0, 0, 55, 0, 0, 0,
  48, 0, 0, 0, 55, 0, 0, 0,  53, 0, 0, 0, 55, 0, 43, 0,
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
  localStorage.setItem("starMusic", musicOn ? "on" : "off");
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
