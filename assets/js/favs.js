// assets/js/favs.js
let favsData = [];
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

    document.getElementById('load-more-btn').addEventListener('click', () => {
      currentDisplayLimit += itemsPerBatch;
      renderFavsData();
    });
  }

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

  const slicedBlocks = favsData.slice(0, currentDisplayLimit);

  const html = slicedBlocks.map(item => {
    const title = item.title || '';
    const details = [];

    if (item.media) details.push(item.media);
    if (item.character) details.push(item.character);
    if (item.relation) details.push(item.relation);

    const contentHtml = details.join('<br>');

    return `
      <article class="favs-block">
        <h2 class="title">${title}</h2>
        <p class="line">${contentHtml}</p>
      </article>
    `;
  }).join('');

  container.innerHTML = html;
  setupFavsLoadMore(favsData.length);
}

async function initFavs() {
  try {
    const jsonPath = window.location.pathname.includes('/pages/') ? '../favs.json' : 'favs.json';
    const res = await fetch(jsonPath);
    if (res.ok) {
      favsData = await res.json();
      renderFavsData();
    }
  } catch (e) {
    console.error('favs.json 로드 실패', e);
  }
}

document.addEventListener("DOMContentLoaded", initFavs);