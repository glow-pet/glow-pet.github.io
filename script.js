// script.js
function renderGalleryCards(dataList) {
  const container = document.querySelector('.gallery-grid');
  if (!container) return;

  if (!dataList || dataList.length === 0) {
    console.warn("갤러리 데이터가 비어 있습니다.");
    return;
  }

  const defaultColors = ['#c9c9c9'];

  const html = dataList.map((item, index) => {
    // 1. 썸네일 처리
    const color = item.color || defaultColors[index % defaultColors.length];
    const thumbContent = item.imgSrc 
      ? `<img src="${item.imgSrc}" alt="${item.infos ? item.infos[0] : (item.title || '카드 이미지')}" loading="lazy">`
      : `<div class="color-placeholder" style="background-color: ${color}; width: 100%; height: 100%;"></div>`;

    // 2. 가변 정보 처리 (infos 배열 우선, 없으면 기존 title/character/tag 활용)
    const infos = item.infos || [item.title, item.character, item.tag].filter(Boolean);
    const infoHTML = infos.map((info, idx) => `
      <p class="card-info-item info-${idx + 1}">${info}</p>
    `).join('');

    return `
      <article class="main-card">
        <a href="${item.link || '#'}" class="main-card-link">
          <div class="main-card-thumb">
            ${thumbContent}
          </div>
          <div class="main-card-info">
            ${infoHTML}
          </div>
        </a>
      </article>
    `;
  }).join('');

  container.innerHTML = html;
}