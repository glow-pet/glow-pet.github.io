// history.js
const historyRawText = `

도시전설 해체센터
게임
재스민
한빛x재스민

소녀 가극 레뷰 스타라이트
극장판 / TVA
나나
쥰나+나나

천막의 자두가르
TVA
파티마 / 퇴레게네
실라x파티마 / 파티마x퇴레게네

안녕 라라
🔥TVA
🔥리사 / 🔥마리 / 🔥라라
마리+그레이스 / 🔥코타x리사 / 라라x리사 / 🔥라라x마리

고깔모자의 아틀리에
만화
코코
코코x애거트

디지몬 비트브레이크
TVA
울버몬
울버몬x레나

황천의 츠가이
만화
아사
유르x아사

쓰르라미 울 적에
TVA
미온

서머타임 렌더링
TVA
히즈루
류노스케x히즈루

마도정병의 슬레이브
만화
렌 / 텐카
텐카x렌

우마무스메 프리티 더비: 로드 투 더 탑
TVA
아야베 / 토뿌로
토뿌로x아야베

비스타즈
TVA
세븐

변신자동차 또봇
TVA
혜라
드림주x혜라

이나즈마 일레븐
TVA
마모루
유토x지로

루리의 보석
TVA
이마리
세토x이마리

메달리스트
만화
이루카
미카x이루카

에반게리온
극장판 / TVA
미사토

델타룬
게임
노엘
노엘x데스 / 노엘x수지

우마무스메 신데렐라 그레이
TVA
벨노 / 딕터

하이바네 연맹
TVA
레키
랏카x레키

카레이도 스타
TVA
소라
소라x레이라

아포칼립스 호텔
TVA
야치요
야치요x폰코

이거 그리고 죽어
🔥TVA / 🔥만화
🔥레이
🔥아이x레이

스킵과 로퍼
TVA
미츠미
미츠미x미카

평범한 경음부
만화
치히로
모모x치히로

마법소녀 리리컬 나노하
TVA
나노하

봇치 더 록
TVA
니지카
니지카x료

두 잇 유어셀프
TVA
세루후 / 쿠레이
쿠레이x타쿠미 / 미쿠x세루후

언데드 언럭
만화 / TVA
쥬이스
드림주x쥬이스 / 후코x쥬이스

주식회사 마지루미에
🔥만화
🔥히토미
드림주x히토미 / 메이x히토미

마법소녀 마도카 마기카
TVA / 극장판
드림주x마미

울려라 유포니엄
TVA
아스카
마유x쿠미코

던전밥
만화
라이오스
라이오스+마르실

언더테일 옐로우
게임
마틀렛(의인화) / 마틀렛
클로버x마틀렛 / 마틀렛x세로바

동굴 이야기
게임
미저리

리틀 위치 아카데미아
TVA
크로와 / 샤리오
샤리오x크로와

별의 커비
게임

디지몬 테이머즈
TVA
레나몬
레나몬x루키

프린세스 츄츄
TVA
아히루
아히루x루

기동경찰 패트레이버
만화
시노부

마법사의 신부
TVA
필로멜라
드림주x필로멜라 / 치세x필로멜라

키미가시네
게임
나오 / 사라
사라x나오

닷플로우
게임
사비츠키

임금님 랭킹
TVA
미란죠
미란죠+마신 / 아피스x미란죠

포켓몬스터 DP
게임
난천
난천x드림주

트로피컬 루즈 프리큐어
TVA
마나츠
마나츠x산고 / 마나츠x로라

허긋토 프리큐어
TVA
호마레
호마레x드림주 / 호마레x하나

소녀파이트
만화
마나부 / 마사코
타카코x마나부 / 드림주x마사코 / 마사코x후에코

하트캐치 프리큐어
소설 / TVA
츠보미 / 이츠키
츠보미x유리 / 에리카x츠보미 / 이츠키x츠보미

약속의 네버랜드
만화
길다
드림주x길다 / 아이셰x길다 / 엠마x길다

보석의 나라
만화
포스
제이드x유클 / 앤탁x포스

스티븐 유니버스
TVA
가넷x펄

하나
웹툰
제나
하나x제나

혈계젼선
TVA(1기)
블랙

어드벤처 타임
TVA

단간론파
1, 2
쿄코
하지메x치아키

홈스턱
원작(2009)
제이드 / 테레지
데이브x제이드 / 데이브x테레지 / 카르켓x테레지

카게로우 프로젝트
아야노 / 키도
키도x아야노 / 하루카x타카네

`;

// history.js
function renderHistoryData() {
  const container = document.getElementById('fav-list');
  if (!container) return;

  if (typeof historyRawText === 'undefined') {
    console.error("historyRawText 데이터를 찾을 수 없습니다. history.js를 확인해 주세요.");
    return;
  }

  const cleanText = historyRawText.replace(/\r/g, '');

  // 연속된 빈 줄 기준으로 분리 후 빈 블록 제거
  const blocks = cleanText.split(/\n\s*\n/).filter(block => block.trim() !== '');

  const html = blocks.map(block => {
    const lines = block.trim().split('\n');
    const title = lines[0] || '';
    const content = lines.slice(1).map(line => line.trim()).join('<br>');

    return `
      <article class="fav-block">
        <h2 class="title">${title}</h2>
        <p class="line">${content}</p>
      </article>
    `;
  }).join('');

  container.innerHTML = html;
}

document.addEventListener("DOMContentLoaded", renderHistoryData);