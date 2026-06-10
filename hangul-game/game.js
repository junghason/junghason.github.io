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

  const NAME = "유안"; // 아이 이름 (정답·오답 멘트에 사용)
  const PRAISE = [
    NAME + "이 잘했어요!",
    NAME + "이 똑똑해요!",
    NAME + "이 최고예요!",
    NAME + "이 멋져요!",
    NAME + "이 참 잘했어요!",
    "와, " + NAME + "이 맞혔어요!"
  ];

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
    // 인앱 브라우저(카카오톡/네이버 등)는 음성 읽기를 지원하지 않음 → 기기별로 안내
    handleNoTTS();
  }

  function isIOS() {
    return (
      /iphone|ipad|ipod/i.test(navigator.userAgent) ||
      // 아이패드(iPadOS)는 데스크톱 모드에서 Mac으로 보고됨
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
    );
  }
  function isAndroid() {
    return /android/i.test(navigator.userAgent);
  }

  function handleNoTTS() {
    if (isAndroid()) {
      ttsWarn.textContent = "소리가 안 나와요 😢 아래 버튼으로 크롬에서 열어주세요!";
      showChromeLink(); // 안드로이드는 intent 링크로 크롬에서 다시 열 수 있음
    } else if (isIOS()) {
      // 아이폰/아이패드는 외부 브라우저를 강제로 열 수 없어 안내만 표시
      ttsWarn.innerHTML =
        "소리가 안 나와요 😢<br>메뉴(공유)에서 <b>‘Safari로 열기’</b>를 눌러주세요!";
    } else {
      ttsWarn.textContent = "이 브라우저는 소리 읽기를 지원하지 않아요. 크롬이나 사파리로 열어주세요.";
    }
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
    if (opts.onend) u.onend = opts.onend;
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
      speak(NAME + "아, 다시 들어볼까요? " + current.word, { rate: 0.78 });
      setTimeout(() => btn.classList.remove("wrong"), 450);
    }
  }

  function showReward() {
    const praise = PRAISE[Math.floor(Math.random() * PRAISE.length)];
    rewardEmoji.textContent = current.emoji;
    rewardWord.textContent = current.word;
    rewardMsg.textContent = praise;
    reward.classList.remove("hidden");

    // 칭찬 음성이 끝난 뒤에 다음 문제로 넘어가도록 한다 (음성이 잘리지 않게)
    let advanced = false;
    function advance() {
      if (advanced) return;
      advanced = true;
      reward.classList.add("hidden");
      nextRound();
    }

    // "곰. 잘했어요!" 처럼 정답 단어와 칭찬을 읽어주고, 끝나면 다음 문제로
    speak(current.word + ". " + praise, { rate: 0.85, onend: advance });

    // 안전장치: 음성이 없거나 onend가 안 울리는 브라우저를 위해 최대 대기 후 진행
    setTimeout(advance, 4000);
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
