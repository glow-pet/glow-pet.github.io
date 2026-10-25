// favs.js
const favsRawText = `

소녀★가극 레뷰 스타라이트
애니(TVA, 신극장판)
나나
나나+카렌

안녕, 라라
애니
리사
드림주+리사

서머타임 렌더링
애니

델타룬
게임(챕터1-4)
노엘
노엘+디셈버

하이바네 연맹
애니
레키
드림주+레키

아포칼립스 호텔
애니
야치요
야치요x폰코

이거 그리고 죽어
애니(1기) / 만화
레이
레이+아이

주식회사 마지루미에
만화
히토미

언더테일 옐로우
게임
마틀렛

동굴 이야기
게임(2004)

`;

// assets/js/favs.js

let currentDisplayLimit = 12; // 초기 표시 개수 12개
const itemsPerBatch = 12;     // 더보기 클릭 시 추가되는 개수 12개

function setupFavsLoadMore(totalItems) {
  const containerEl = document.querySelector('.container') || document.querySelector('main.container');
  if (!containerEl) return;

  let loadMoreWrapper = containerEl.querySelector('.load-more-wrapper');

  if (!loadMoreWrapper) {
    loadMoreWrapper = document.createElement('div');
    loadMoreWrapper.className = 'load-more-wrapper';
    loadMoreWrapper.innerHTML = `
      <button id="load-more-btn" class="load-more-btn" aria-label="콘텐츠 더보기">
        <span>더보기</span>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
      </button>
    `;
    containerEl.appendChild(loadMoreWrapper);

    // 오직 더보기 버튼을 클릭할 때만 실행되도록 설정 (무한 스크롤 제거)
    document.getElementById('load-more-btn').addEventListener('click', () => {
      currentDisplayLimit += itemsPerBatch;
      renderFavsData();
    });
  }

  // 모든 항목이 표시된 경우 '더보기' 버튼 숨김
  const btn = document.getElementById('load-more-btn');
  if (btn) {
    if (currentDisplayLimit >= totalItems) {
      btn.style.display = 'none';
    } else {
      btn.style.display = 'inline-flex';
    }
  }
}

function renderFavsData() {
  const container = document.getElementById('favs-list');
  if (!container) return;

  if (typeof favsRawText === 'undefined') {
    console.error("favsRawText 데이터를 찾을 수 없습니다. favs.js를 확인해 주세요.");
    return;
  }

  const cleanText = favsRawText.replace(/\r/g, '');
  const blocks = cleanText.split(/\n\s*\n/).filter(block => block.trim() !== '');

  // 현재 제한된 개수까지만 잘라내어 렌더링
  const slicedBlocks = blocks.slice(0, currentDisplayLimit);

  const html = slicedBlocks.map(block => {
    const lines = block.trim().split('\n');
    const title = lines[0] || '';
    const content = lines.slice(1).map(line => line.trim()).join('<br>');

    return `
      <article class="favs-block">
        <h2 class="title">${title}</h2>
        <p class="line">${content}</p>
      </article>
    `;
  }).join('');

  container.innerHTML = html;
  setupFavsLoadMore(blocks.length);
}

document.addEventListener("DOMContentLoaded", renderFavsData);