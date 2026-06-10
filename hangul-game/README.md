# 한글 듣고 찾기 🦊

만 4~5세 아이를 위한 한글 학습 게임입니다. 한글 단어를 소리로 들려주고,
**비슷하게 생긴 단어 여러 개** 중에서 맞는 글자를 고르게 합니다.
안드로이드 태블릿의 크롬 브라우저에서 바로 실행됩니다.

## 특징
- 🔊 한글 단어를 음성으로 읽어줌 (브라우저 내장 음성, 설치 불필요)
- 🔤 정답과 헷갈리기 쉬운 비슷한 단어를 보기로 제시 → 글자 구분 연습
- ⭐ 정답을 맞히면 그림과 칭찬 음성, 별 모으기 보상
- 👶 큰 버튼·큰 글씨, 난이도(보기 2/3/4개) 선택
- 60여 개 단어 (동물·과일·음식·탈것·사물·자연)

## 파일
- `index.html` — 화면
- `style.css` — 스타일
- `game.js` — 게임 로직
- `words.js` — 단어 데이터 (여기서 단어를 추가/수정하세요)

## 로컬에서 실행
```bash
python3 -m http.server 8000
# 브라우저에서 http://localhost:8000 접속
```

## 별도 저장소로 발행하기 (GitHub Pages)

1. GitHub에서 빈 저장소 `hangul-game` 를 만든다 (README 없이 비어 있어도 됨).
2. 이 폴더에서 아래 명령을 실행한다:
   ```bash
   cd hangul-game
   git init -b main
   git add .
   git commit -m "한글 듣고 찾기 게임"
   git remote add origin https://github.com/junghason/hangul-game.git
   git push -u origin main
   ```
3. 저장소 → **Settings → Pages** → Source 를 `Deploy from a branch`,
   Branch 를 `main` / `/(root)` 로 설정하고 저장.
4. 잠시 후 아래 주소로 접속:
   ```
   https://junghason.github.io/hangul-game/
   ```

> 태블릿에서는 크롬으로 위 주소를 연 뒤, 메뉴 → **홈 화면에 추가**를 하면
> 앱처럼 아이콘으로 실행할 수 있습니다.

## 단어 추가하는 법
`words.js` 에 한 줄 추가하면 됩니다. `similar` 는 정답과 비슷하게 생긴 단어예요.
```js
{ word: "구름", emoji: "☁️", cat: "자연", similar: ["구늠", "그름", "구룸"] },
```
