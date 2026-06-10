// ===== 과일 자동차 — 6세 어린이용 레이싱 게임 =====

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

// 운전자 사진 불러오기
const driverImg = new Image();
let driverReady = false;
driverImg.onload = () => { driverReady = true; };
driverImg.src = "assets/driver.jpg";

// 난이도 설정 (천천히 = 아주 쉬움)
const SPEEDS = {
  slow:   { fall: 2.2, spawn: 1100, obstacle: 0.22 },
  normal: { fall: 3.2, spawn: 850,  obstacle: 0.30 },
  fast:   { fall: 4.4, spawn: 650,  obstacle: 0.38 },
};
let chosenSpeed = "slow";

const FRUITS = ["🍎", "🍌", "🍓", "🍇", "🍊", "🍉", "🍑", "🍒", "🥝", "🍍"];
const OBSTACLES = ["🪨", "🚧", "🛢️", "🦔"];

// 게임 상태
let W = 0, H = 0, dpr = 1;
let road = { x: 0, w: 0 };
let player, items, score, hearts, running, lastSpawn, animId, roadOffset, shake;

// 자동차가 도로 안에서만 움직이도록 좌우 경계 계산
function playerBounds() {
  return {
    min: road.x + player.w / 2 + 4,
    max: road.x + road.w - player.w / 2 - 4,
  };
}

// ---- 캔버스 크기 맞추기 ----
function resize() {
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  // 안드로이드 크롬 주소창을 고려해 보이는 영역 기준으로 크기 결정
  const vv = window.visualViewport;
  W = Math.round(vv ? vv.width : window.innerWidth);
  H = Math.round(vv ? vv.height : window.innerHeight);
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  canvas.style.width = W + "px";
  canvas.style.height = H + "px";
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  // 도로: 화면 폭에 맞춰 넓히되 너무 넓지 않게 (가로 태블릿 대응)
  road.w = Math.min(W * 0.92, 760);
  road.x = (W - road.w) / 2;

  if (player) {
    player.y = H - player.h - 30;
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
  const carW = Math.min(120, road.w * 0.22, W * 0.3);
  player = {
    w: carW,
    h: carW * 1.4,
    x: W / 2,
    y: H - carW * 1.4 - 30,
    targetX: W / 2,
  };
  items = [];
  score = 0;
  hearts = 3;
  running = true;
  roadOffset = 0;
  shake = 0;
  lastSpawn = 0;
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

// ---- 업데이트 ----
function update(dt, now) {
  const cfg = SPEEDS[chosenSpeed];

  // 도로 흐름
  roadOffset = (roadOffset + cfg.fall * dt * 0.06) % 80;

  // 자동차가 손가락 위치로 부드럽게 이동 (도로 안에서만)
  const b = playerBounds();
  player.targetX = Math.max(b.min, Math.min(b.max, player.targetX));
  player.x += (player.targetX - player.x) * 0.2;
  player.x = Math.max(b.min, Math.min(b.max, player.x));

  // 아이템 생성
  if (now - lastSpawn > cfg.spawn) {
    lastSpawn = now;
    spawnItem(cfg);
  }

  // 아이템 이동 + 충돌
  const fallPx = cfg.fall * dt * 0.16 + cfg.fall;
  for (let i = items.length - 1; i >= 0; i--) {
    const it = items[i];
    it.y += fallPx;
    it.spin += 0.02;

    // 충돌 판정 (관대하게)
    const dx = Math.abs(it.x - player.x);
    const dy = Math.abs(it.y - (player.y + player.h * 0.35));
    if (dx < player.w * 0.55 && dy < player.h * 0.45) {
      if (it.bad) {
        hearts--;
        shake = 14;
        beep(140, 0.18, "sawtooth");
        updateHud();
        if (hearts <= 0) return endGame();
      } else {
        score++;
        beep(660, 0.08, "sine");
        beep(880, 0.08, "sine", 0.06);
        updateHud();
      }
      items.splice(i, 1);
      continue;
    }

    if (it.y > H + 60) items.splice(i, 1);
  }

  if (shake > 0) shake *= 0.85;
}

function spawnItem(cfg) {
  const bad = Math.random() < cfg.obstacle;
  const emoji = bad
    ? OBSTACLES[(Math.random() * OBSTACLES.length) | 0]
    : FRUITS[(Math.random() * FRUITS.length) | 0];
  const size = bad ? 56 : 52;
  const margin = size * 0.7;
  const lo = road.x + margin;
  const hi = road.x + road.w - margin;
  items.push({
    x: lo + Math.random() * (hi - lo),
    y: -60,
    emoji,
    bad,
    size,
    spin: Math.random() * Math.PI,
  });
}

// ---- 그리기 ----
function draw() {
  ctx.save();
  if (shake > 0.5) {
    ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
  }

  // 풀밭 배경
  ctx.fillStyle = "#7cc66b";
  ctx.fillRect(-20, 0, W + 40, H);

  // 도로
  const roadW = road.w;
  const roadX = road.x;
  ctx.fillStyle = "#555b66";
  ctx.fillRect(roadX, 0, roadW, H);
  // 도로 가장자리
  ctx.fillStyle = "#f4d35e";
  ctx.fillRect(roadX - 8, 0, 8, H);
  ctx.fillRect(roadX + roadW, 0, 8, H);

  // 가운데 점선 (흐르는 효과)
  ctx.fillStyle = "#ffffff";
  const dashW = 12;
  for (let y = -80 + roadOffset; y < H; y += 80) {
    ctx.fillRect(W / 2 - dashW / 2, y, dashW, 44);
  }

  // 아이템
  for (const it of items) {
    ctx.save();
    ctx.translate(it.x, it.y);
    ctx.rotate(Math.sin(it.spin) * 0.15);
    ctx.font = `${it.size}px serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(it.emoji, 0, 0);
    ctx.restore();
  }

  // 자동차
  drawCar(player.x, player.y, player.w, player.h);

  ctx.restore();
}

function drawCar(cx, top, w, h) {
  const x = cx - w / 2;
  ctx.save();

  // 그림자
  ctx.fillStyle = "rgba(0,0,0,0.18)";
  roundRect(x + 6, top + 10, w, h, 16);
  ctx.fill();

  // 차체
  const grad = ctx.createLinearGradient(x, top, x + w, top);
  grad.addColorStop(0, "#ff5d73");
  grad.addColorStop(1, "#ef476f");
  ctx.fillStyle = grad;
  roundRect(x, top, w, h, 16);
  ctx.fill();

  // 바퀴
  ctx.fillStyle = "#222";
  const wheelW = w * 0.16, wheelH = h * 0.26;
  roundRect(x - wheelW * 0.5, top + h * 0.12, wheelW, wheelH, 5); ctx.fill();
  roundRect(x + w - wheelW * 0.5, top + h * 0.12, wheelW, wheelH, 5); ctx.fill();
  roundRect(x - wheelW * 0.5, top + h * 0.62, wheelW, wheelH, 5); ctx.fill();
  roundRect(x + w - wheelW * 0.5, top + h * 0.62, wheelW, wheelH, 5); ctx.fill();

  // 앞 유리(운전자 얼굴) 원
  const faceR = w * 0.32;
  const faceX = cx;
  const faceY = top + h * 0.33;

  ctx.fillStyle = "#bfe6ff";
  ctx.beginPath();
  ctx.arc(faceX, faceY, faceR + 4, 0, Math.PI * 2);
  ctx.fill();

  if (driverReady) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(faceX, faceY, faceR, 0, Math.PI * 2);
    ctx.clip();
    // 사진을 원 안에 꽉 차게(cover)
    const iw = driverImg.width, ih = driverImg.height;
    const scale = Math.max((faceR * 2) / iw, (faceR * 2) / ih);
    const dw = iw * scale, dh = ih * scale;
    ctx.drawImage(driverImg, faceX - dw / 2, faceY - dh / 2, dw, dh);
    ctx.restore();
  }

  // 얼굴 테두리
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(faceX, faceY, faceR, 0, Math.PI * 2);
  ctx.stroke();

  // 헤드라이트
  ctx.fillStyle = "#ffe66d";
  roundRect(x + w * 0.1, top + h - 14, w * 0.22, 10, 4); ctx.fill();
  roundRect(x + w * 0.68, top + h - 14, w * 0.22, 10, 4); ctx.fill();

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
  scoreEl.textContent = "🍎 " + score;
  heartsEl.textContent = "❤️".repeat(Math.max(0, hearts)) || "💔";
}

// ---- 게임 종료 ----
function endGame() {
  running = false;
  cancelAnimationFrame(animId);
  stopMusic();
  beep(330, 0.2, "triangle");
  overScoreEl.textContent = `🍎 ${score}개 모았어요!`;
  overTitleEl.textContent = score >= 15 ? "와! 최고예요! 🏆" : "참 잘했어요!";
  gameScreen.classList.add("hidden");
  overScreen.classList.remove("hidden");
}

// ---- 조작: 손가락/마우스로 이동 ----
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
canvas.addEventListener("mousedown", (e) => pointerMove(e.clientX));
canvas.addEventListener("mousemove", (e) => {
  if (e.buttons) pointerMove(e.clientX);
});
// 키보드(데스크톱)
window.addEventListener("keydown", (e) => {
  if (!player || !running) return;
  const b = playerBounds();
  if (e.key === "ArrowLeft") player.targetX = Math.max(b.min, player.x - 70);
  if (e.key === "ArrowRight") player.targetX = Math.min(b.max, player.x + 70);
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
    gain.gain.exponentialRampToValueAtTime(0.25, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(gain).connect(sfxGain);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  } catch (e) { /* 무시 */ }
}

// ---- 배경음악 (밝고 경쾌한 멜로디 반복) ----
let musicOn = localStorage.getItem("carMusic") !== "off";
let musicTimer = null, nextNoteTime = 0, musicStep = 0;
const TEMPO = 138;                 // bpm
const STEP_DUR = 60 / TEMPO / 2;   // 8분음표 길이(초)

// C장조 동요풍 멜로디 (MIDI 음높이, 0 = 쉼표) — 4마디 반복
const MELODY = [
  72, 0, 76, 0, 79, 0, 76, 0,  74, 0, 77, 0, 79, 0, 0, 0,
  72, 0, 76, 0, 79, 0, 84, 0,  83, 79, 76, 0, 74, 0, 72, 0,
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
  localStorage.setItem("carMusic", musicOn ? "on" : "off");
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
