// 한글 듣고 찾기 — 게임 로직
// 단어를 음성으로 들려주고, 비슷한 단어들 중에서 고르게 합니다.

(function () {
  "use strict";

  // ---- 화면 요소 ----
  const startScreen = document.getElementById("start-screen");
  const gameScreen = document.getElementById("game-screen");
  const levelRow = document.getElementById("level-row");
  const startBtn = document.getElementById("start-btn");
  const homeBtn = document.getElementById("home-btn");
  const listenBtn = document.getElementById("listen-btn");
  const choicesEl = document.getElementById("choices");
  const starsEl = document.getElementById("stars");
  const ttsWarn = document.getElementById("tts-warn");
  const chromeLink = document.getElementById("chrome-link");
  const reward = document.getElementById("reward");
  const rewardEmoji = document.getElementById("reward-emoji");
  const rewardWord = document.getElementById("reward-word");
  const rewardMsg = document.getElementById("reward-msg");

  // ---- 상태 ----
  let numChoices = 3;
  let stars = 0;
  let current = null; // 현재 정답 단어 객체
  let locked = false; // 중복 터치 방지
  let lastIndex = -1; // 같은 단어 연속 출제 방지

  const PRAISE = ["잘했어요!", "정답이에요!", "최고예요!", "멋져요!", "참 잘했어요!", "와, 똑똑해요!"];

  // ---- 음성 (Web Speech API) ----
  let koVoice = null;
  function loadVoices() {
    const voices = window.speechSynthesis ? speechSynthesis.getVoices() : [];
    koVoice =
      voices.find((v) => v.lang === "ko-KR") ||
      voices.find((v) => v.lang && v.lang.toLowerCase().indexOf("ko") === 0) ||
      null;
  }
  if (window.speechSynthesis) {
    loadVoices();
    speechSynthesis.onvoiceschanged = loadVoices;
  } else {
    // 인앱 브라우저(카카오톡/네이버 등)는 음성 읽기를 지원하지 않음 → 크롬으로 열기 안내
    ttsWarn.textContent = "소리가 안 나와요 😢 아래 버튼으로 크롬에서 열어주세요!";
    showChromeLink();
  }

  // 안드로이드에서 현재 페이지를 크롬으로 다시 여는 intent 링크를 만든다.
  function showChromeLink() {
    if (!chromeLink) return;
    const host = location.host;
    const path = location.pathname + location.search;
    chromeLink.href =
      "intent://" + host + path + "#Intent;scheme=https;package=com.android.chrome;end";
    chromeLink.classList.remove("hidden");
  }

  function speak(text, opts) {
    if (!window.speechSynthesis) return;
    opts = opts || {};
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "ko-KR";
    if (koVoice) u.voice = koVoice;
    u.rate = opts.rate || 0.8; // 아이가 듣기 좋게 천천히
    u.pitch = opts.pitch || 1.15;
    speechSynthesis.speak(u);
  }

  // ---- 유틸 ----
  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function pickWord() {
    let idx;
    do {
      idx = Math.floor(Math.random() * WORDS.length);
    } while (WORDS.length > 1 && idx === lastIndex);
    lastIndex = idx;
    return WORDS[idx];
  }

  // ---- 라운드 ----
  function nextRound() {
    locked = false;
    current = pickWord();

    // 정답 1개 + 비슷한 단어 (numChoices - 1)개
    const distractors = shuffle(current.similar).slice(0, numChoices - 1);
    const options = shuffle([current.word].concat(distractors));

    choicesEl.innerHTML = "";
    options.forEach((text) => {
      const btn = document.createElement("button");
      btn.className = "choice";
      btn.textContent = text;
      btn.addEventListener("click", () => onChoice(btn, text));
      choicesEl.appendChild(btn);
    });

    // 살짝 텀을 두고 단어 들려주기
    setTimeout(() => speak(current.word), 350);
  }

  function onChoice(btn, text) {
    if (locked) return;

    if (text === current.word) {
      locked = true;
      btn.classList.add("correct");
      stars++;
      starsEl.textContent = "⭐ " + stars;
      showReward();
    } else {
      // 오답: 가볍게 흔들고 다시 듣게 해줌 (점수 깎지 않음)
      btn.classList.add("wrong");
      btn.disabled = true;
      speak("다시 들어볼까요? " + current.word, { rate: 0.78 });
      setTimeout(() => btn.classList.remove("wrong"), 450);
    }
  }

  function showReward() {
    const praise = PRAISE[Math.floor(Math.random() * PRAISE.length)];
    rewardEmoji.textContent = current.emoji;
    rewardWord.textContent = current.word;
    rewardMsg.textContent = praise;
    reward.classList.remove("hidden");

    // "곰! 잘했어요!" 처럼 정답 단어와 칭찬을 읽어줌
    speak(current.word + ". " + praise, { rate: 0.85 });

    setTimeout(() => {
      reward.classList.add("hidden");
      nextRound();
    }, 1800);
  }

  // ---- 화면 전환 ----
  function startGame() {
    startScreen.classList.add("hidden");
    gameScreen.classList.remove("hidden");
    stars = 0;
    starsEl.textContent = "⭐ 0";
    // 첫 사용자 터치(시작 버튼)로 음성을 깨워둔다 (모바일 자동재생 제한 대응)
    speak("시작해요!");
    nextRound();
  }

  function goHome() {
    if (window.speechSynthesis) speechSynthesis.cancel();
    reward.classList.add("hidden");
    gameScreen.classList.add("hidden");
    startScreen.classList.remove("hidden");
  }

  // ---- 이벤트 ----
  levelRow.addEventListener("click", (e) => {
    const b = e.target.closest(".level-btn");
    if (!b) return;
    numChoices = parseInt(b.dataset.choices, 10);
    levelRow.querySelectorAll(".level-btn").forEach((x) => x.classList.remove("active"));
    b.classList.add("active");
  });

  startBtn.addEventListener("click", startGame);
  homeBtn.addEventListener("click", goHome);
  listenBtn.addEventListener("click", () => {
    if (current) speak(current.word);
  });
})();
