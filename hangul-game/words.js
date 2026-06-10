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
  { word: "무지개", emoji: "🌈", cat: "자연", similar: ["무지게", "무지대", "부지개"] },

  // 동물 (추가)
  { word: "오리", emoji: "🦆", cat: "동물", similar: ["오니", "어리", "오디"] },
  { word: "돼지", emoji: "🐷", cat: "동물", similar: ["돼치", "대지", "되지"] },
  { word: "양", emoji: "🐑", cat: "동물", similar: ["얌", "약", "향"] },
  { word: "펭귄", emoji: "🐧", cat: "동물", similar: ["펜귄", "펭긴", "팽귄"] },
  { word: "원숭이", emoji: "🐵", cat: "동물", similar: ["원중이", "언숭이", "원숭니"] },
  { word: "기린", emoji: "🦒", cat: "동물", similar: ["기닌", "가린", "기란"] },
  { word: "악어", emoji: "🐊", cat: "동물", similar: ["아거", "악허", "안어"] },
  { word: "개구리", emoji: "🐸", cat: "동물", similar: ["개구니", "게구리", "개구디"] },
  { word: "나비", emoji: "🦋", cat: "동물", similar: ["나미", "다비", "나피"] },
  { word: "벌", emoji: "🐝", cat: "동물", similar: ["별", "발", "불"] },
  { word: "거미", emoji: "🕷️", cat: "동물", similar: ["거비", "가미", "거니"] },
  { word: "여우", emoji: "🦊", cat: "동물", similar: ["여오", "야우", "여후"] },
  { word: "사슴", emoji: "🦌", cat: "동물", similar: ["사슬", "사습", "가슴"] },
  { word: "고래", emoji: "🐳", cat: "동물", similar: ["고레", "가래", "고내"] },
  { word: "상어", emoji: "🦈", cat: "동물", similar: ["사어", "상허", "상이"] },
  { word: "문어", emoji: "🐙", cat: "동물", similar: ["무너", "문허", "문이"] },
  { word: "뱀", emoji: "🐍", cat: "동물", similar: ["밤", "뱅", "백"] },
  { word: "달팽이", emoji: "🐌", cat: "동물", similar: ["달팡이", "달펭이", "다팽이"] },

  // 과일 (추가)
  { word: "귤", emoji: "🍊", cat: "과일", similar: ["굴", "결", "귝"] },
  { word: "체리", emoji: "🍒", cat: "과일", similar: ["채리", "처리", "체니"] },
  { word: "토마토", emoji: "🍅", cat: "과일", similar: ["도마토", "토바토", "토마도"] },

  // 채소
  { word: "옥수수", emoji: "🌽", cat: "채소", similar: ["옥소수", "욕수수", "옥수주"] },
  { word: "당근", emoji: "🥕", cat: "채소", similar: ["당건", "단근", "당큰"] },
  { word: "가지", emoji: "🍆", cat: "채소", similar: ["가치", "거지", "가시"] },
  { word: "감자", emoji: "🥔", cat: "채소", similar: ["감차", "강자", "검자"] },
  { word: "버섯", emoji: "🍄", cat: "채소", similar: ["버석", "바섯", "머섯"] },
  { word: "양파", emoji: "🧅", cat: "채소", similar: ["양바", "얌파", "양카"] },
  { word: "고추", emoji: "🌶️", cat: "채소", similar: ["고초", "거추", "코추"] },

  // 음식 (추가)
  { word: "떡", emoji: "🍡", cat: "음식", similar: ["턱", "떨", "떰"] },
  { word: "만두", emoji: "🥟", cat: "음식", similar: ["만도", "반두", "만주"] },
  { word: "피자", emoji: "🍕", cat: "음식", similar: ["비자", "피차", "피잔"] },
  { word: "햄버거", emoji: "🍔", cat: "음식", similar: ["햄바거", "핸버거", "햄버구"] },
  { word: "케이크", emoji: "🍰", cat: "음식", similar: ["케이그", "게이크", "케이큰"] },
  { word: "도넛", emoji: "🍩", cat: "음식", similar: ["도넌", "두넛", "도넷"] },
  { word: "쿠키", emoji: "🍪", cat: "음식", similar: ["구키", "쿠기", "쿠치"] },
  { word: "초콜릿", emoji: "🍫", cat: "음식", similar: ["초콜렛", "초골릿", "초콜닛"] },
  { word: "주스", emoji: "🧃", cat: "음식", similar: ["주수", "조스", "즈스"] },
  { word: "꿀", emoji: "🍯", cat: "음식", similar: ["꿈", "굴", "쿨"] },
  { word: "김치", emoji: "🥬", cat: "음식", similar: ["김지", "긴치", "김차"] },

  // 탈것 (추가)
  { word: "트럭", emoji: "🚚", cat: "탈것", similar: ["트력", "드럭", "트룩"] },
  { word: "택시", emoji: "🚕", cat: "탈것", similar: ["택씨", "댁시", "택서"] },
  { word: "소방차", emoji: "🚒", cat: "탈것", similar: ["소방자", "소밤차", "사방차"] },
  { word: "경찰차", emoji: "🚓", cat: "탈것", similar: ["경찬차", "겅찰차", "경찰자"] },
  { word: "오토바이", emoji: "🏍️", cat: "탈것", similar: ["오도바이", "어토바이", "오토바니"] },
  { word: "로켓", emoji: "🚀", cat: "탈것", similar: ["로겟", "노켓", "로켇"] },

  // 사물 (추가)
  { word: "숟가락", emoji: "🥄", cat: "사물", similar: ["숫가락", "순가락", "숟가닥"] },
  { word: "포크", emoji: "🍴", cat: "사물", similar: ["보크", "포그", "코크"] },
  { word: "컵", emoji: "🥤", cat: "사물", similar: ["컴", "겁", "컽"] },
  { word: "칫솔", emoji: "🪥", cat: "사물", similar: ["칟솔", "치솔", "칫솓"] },
  { word: "비누", emoji: "🧼", cat: "사물", similar: ["비두", "미누", "비노"] },
  { word: "침대", emoji: "🛏️", cat: "사물", similar: ["친대", "침데", "짐대"] },
  { word: "거울", emoji: "🪞", cat: "사물", similar: ["거올", "가울", "거운"] },
  { word: "전화", emoji: "📞", cat: "사물", similar: ["전하", "정화", "전와"] },
  { word: "컴퓨터", emoji: "💻", cat: "사물", similar: ["컴퓨더", "컴푸터", "컨퓨터"] },
  { word: "카메라", emoji: "📷", cat: "사물", similar: ["카메나", "가메라", "카메다"] },
  { word: "선물", emoji: "🎁", cat: "사물", similar: ["선불", "섬물", "선묻"] },
  { word: "인형", emoji: "🧸", cat: "사물", similar: ["인영", "잉형", "인혐"] },
  { word: "가위", emoji: "✂️", cat: "사물", similar: ["가워", "까위", "거위"] },
  { word: "열쇠", emoji: "🔑", cat: "사물", similar: ["열세", "열쇄", "얼쇠"] },
  { word: "양말", emoji: "🧦", cat: "사물", similar: ["양발", "얌말", "향말"] },
  { word: "신발", emoji: "👟", cat: "사물", similar: ["신밤", "진발", "신팔"] },
  { word: "종", emoji: "🔔", cat: "사물", similar: ["정", "좀", "송"] },

  // 자연 (추가)
  { word: "번개", emoji: "⚡", cat: "자연", similar: ["번게", "벙개", "번대"] },
  { word: "불", emoji: "🔥", cat: "자연", similar: ["물", "풀", "발"] },
  { word: "돌", emoji: "🪨", cat: "자연", similar: ["동", "돔", "들"] },
  { word: "섬", emoji: "🏝️", cat: "자연", similar: ["점", "셤", "성"] },
  { word: "얼음", emoji: "🧊", cat: "자연", similar: ["어름", "얼믐", "엄음"] },
  { word: "바람", emoji: "💨", cat: "자연", similar: ["바담", "마람", "가람"] },
  { word: "하늘", emoji: "🌌", cat: "자연", similar: ["하눌", "허늘", "하느"] },

  // 색깔
  { word: "빨강", emoji: "🔴", cat: "색깔", similar: ["발강", "빨깡", "빨장"] },
  { word: "노랑", emoji: "🟡", cat: "색깔", similar: ["노람", "도랑", "노란"] },
  { word: "파랑", emoji: "🔵", cat: "색깔", similar: ["바랑", "파람", "파란"] },
  { word: "초록", emoji: "🟢", cat: "색깔", similar: ["조록", "초롱", "초목"] },
  { word: "보라", emoji: "🟣", cat: "색깔", similar: ["보나", "부라", "보다"] },
  { word: "검정", emoji: "⚫", cat: "색깔", similar: ["검징", "겁정", "검전"] },
  { word: "하양", emoji: "⚪", cat: "색깔", similar: ["하얌", "허양", "하얀"] },

  // 가족
  { word: "엄마", emoji: "👩", cat: "가족", similar: ["어마", "엄미", "암마"] },
  { word: "아빠", emoji: "👨", cat: "가족", similar: ["아파", "어빠", "아빼"] },
  { word: "아기", emoji: "👶", cat: "가족", similar: ["아지", "아디", "어기"] },
  { word: "할머니", emoji: "👵", cat: "가족", similar: ["할머리", "한머니", "할버니"] },
  { word: "할아버지", emoji: "👴", cat: "가족", similar: ["할아버치", "한아버지", "할아버디"] },
  { word: "친구", emoji: "🧒", cat: "가족", similar: ["친고", "칭구", "친두"] }
];
