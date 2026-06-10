// 한글 단어 데이터
// 각 단어는 정답(word), 그림(emoji), 그리고 헷갈리기 쉬운 비슷한 단어(similar) 3개를 가집니다.
// similar 단어는 글자 모양이 비슷해서, 아이가 소리를 듣고 글자를 잘 구분하도록 도와줍니다.
const WORDS = [
  // 동물
  { word: "곰", emoji: "🐻", cat: "동물", similar: ["공", "콩", "검"] },
  { word: "개", emoji: "🐶", cat: "동물", similar: ["게", "배", "깨"] },
  { word: "소", emoji: "🐮", cat: "동물", similar: ["새", "수", "시"] },
  { word: "말", emoji: "🐴", cat: "동물", similar: ["발", "물", "살"] },
  { word: "닭", emoji: "🐔", cat: "동물", similar: ["달", "닥", "담"] },
  { word: "토끼", emoji: "🐰", cat: "동물", similar: ["토기", "도끼", "토키"] },
  { word: "사자", emoji: "🦁", cat: "동물", similar: ["사지", "자사", "사차"] },
  { word: "호랑이", emoji: "🐯", cat: "동물", similar: ["호롱이", "하랑이", "호랑니"] },
  { word: "거북이", emoji: "🐢", cat: "동물", similar: ["거부기", "가북이", "거북치"] },
  { word: "코끼리", emoji: "🐘", cat: "동물", similar: ["코키리", "고끼리", "코끼지"] },
  { word: "다람쥐", emoji: "🐿️", cat: "동물", similar: ["다람지", "다람주", "따람쥐"] },
  { word: "병아리", emoji: "🐤", cat: "동물", similar: ["병알이", "뱅아리", "병아니"] },
  { word: "강아지", emoji: "🐶", cat: "동물", similar: ["강아치", "깡아지", "강아디"] },
  { word: "고양이", emoji: "🐱", cat: "동물", similar: ["고양니", "고향이", "가양이"] },
  { word: "물고기", emoji: "🐟", cat: "동물", similar: ["물거기", "불고기", "물고지"] },

  // 과일
  { word: "사과", emoji: "🍎", cat: "과일", similar: ["사가", "자과", "가사"] },
  { word: "포도", emoji: "🍇", cat: "과일", similar: ["보도", "포포", "모도"] },
  { word: "수박", emoji: "🍉", cat: "과일", similar: ["수밤", "소박", "수반"] },
  { word: "딸기", emoji: "🍓", cat: "과일", similar: ["달기", "따기", "딸지"] },
  { word: "바나나", emoji: "🍌", cat: "과일", similar: ["바나너", "마나나", "바다나"] },
  { word: "참외", emoji: "🍈", cat: "과일", similar: ["참회", "차외", "참왜"] },
  { word: "배", emoji: "🍐", cat: "과일", similar: ["베", "비", "매"] },
  { word: "복숭아", emoji: "🍑", cat: "과일", similar: ["복숭이", "보숭아", "복중아"] },
  { word: "레몬", emoji: "🍋", cat: "과일", similar: ["레먼", "래몬", "네몬"] },

  // 음식
  { word: "밥", emoji: "🍚", cat: "음식", similar: ["밤", "박", "받"] },
  { word: "빵", emoji: "🍞", cat: "음식", similar: ["방", "뺑", "빰"] },
  { word: "국", emoji: "🍲", cat: "음식", similar: ["굴", "곡", "군"] },
  { word: "김밥", emoji: "🍙", cat: "음식", similar: ["김반", "김빵", "긴밥"] },
  { word: "우유", emoji: "🥛", cat: "음식", similar: ["우요", "오유", "으유"] },
  { word: "라면", emoji: "🍜", cat: "음식", similar: ["나면", "라먼", "라명"] },
  { word: "계란", emoji: "🥚", cat: "음식", similar: ["계난", "게란", "계라"] },
  { word: "사탕", emoji: "🍬", cat: "음식", similar: ["사당", "사탈", "자탕"] },

  // 탈것
  { word: "차", emoji: "🚗", cat: "탈것", similar: ["카", "자", "처"] },
  { word: "버스", emoji: "🚌", cat: "탈것", similar: ["바스", "버수", "머스"] },
  { word: "비행기", emoji: "✈️", cat: "탈것", similar: ["비행지", "비앵기", "비행니"] },
  { word: "기차", emoji: "🚂", cat: "탈것", similar: ["기자", "기처", "가차"] },
  { word: "자전거", emoji: "🚲", cat: "탈것", similar: ["자전기", "자전저", "차전거"] },

  // 사물
  { word: "책", emoji: "📖", cat: "사물", similar: ["챙", "첵", "착"] },
  { word: "공", emoji: "⚽", cat: "사물", similar: ["콩", "곰", "강"] },
  { word: "시계", emoji: "🕐", cat: "사물", similar: ["시게", "사계", "시제"] },
  { word: "가방", emoji: "🎒", cat: "사물", similar: ["가발", "가빵", "거방"] },
  { word: "의자", emoji: "🪑", cat: "사물", similar: ["이자", "의지", "우자"] },
  { word: "모자", emoji: "🧢", cat: "사물", similar: ["모지", "보자", "무자"] },
  { word: "우산", emoji: "☂️", cat: "사물", similar: ["우상", "오산", "우잔"] },
  { word: "안경", emoji: "👓", cat: "사물", similar: ["안견", "앙경", "안성"] },
  { word: "연필", emoji: "✏️", cat: "사물", similar: ["연질", "연핀", "견필"] },
  { word: "풍선", emoji: "🎈", cat: "사물", similar: ["풍성", "퐁선", "붕선"] },

  // 자연
  { word: "해", emoji: "☀️", cat: "자연", similar: ["헤", "새", "하"] },
  { word: "달", emoji: "🌙", cat: "자연", similar: ["닭", "발", "살"] },
  { word: "별", emoji: "⭐", cat: "자연", similar: ["볼", "벌", "병"] },
  { word: "산", emoji: "⛰️", cat: "자연", similar: ["손", "신", "살"] },
  { word: "꽃", emoji: "🌸", cat: "자연", similar: ["꼭", "꽁", "콧"] },
  { word: "비", emoji: "🌧️", cat: "자연", similar: ["미", "피", "베"] },
  { word: "눈", emoji: "❄️", cat: "자연", similar: ["군", "둔", "는"] },
  { word: "나무", emoji: "🌳", cat: "자연", similar: ["나모", "다무", "나부"] },
  { word: "구름", emoji: "☁️", cat: "자연", similar: ["구늠", "그름", "구룸"] },
  { word: "바다", emoji: "🌊", cat: "자연", similar: ["바라", "마다", "바나"] },
  { word: "무지개", emoji: "🌈", cat: "자연", similar: ["무지게", "무지대", "부지개"] }
];
