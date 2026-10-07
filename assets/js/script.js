// assets/js/script.js

// 1. 헤더 설명 렌더링
function renderHeader() {
  const headerDescEl = document.querySelector('.header-desc');
  const headerInfos = window.headerInfos || [];
  if (!headerDescEl || headerInfos.length === 0) return;

  headerDescEl.innerHTML = headerInfos.join('<br>');
}

// 2. 갤러리 카드 렌더링 (메인 & OC)
function renderGallery() {
  const container = document.querySelector('.gallery-grid');
  let dataList = window.galleryData || [];
  if (!container) return;

  if (dataList.length === 0) {
    container.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #888; padding: 2rem 0;">등록된 데이터가 없습니다.</p>';
    return;
  }

  // date 기준 최신순(내림차순) 정렬
  dataList.sort((a, b) => new Date(b.date) - new Date(a.date));

  const isPagesFolder = window.location.pathname.includes('/pages/');

  const html = dataList.map(item => {
    let imgSrc = item.img;
    let linkSrc = item.link;

    if (isPagesFolder) {
      if (!imgSrc.startsWith('../') && !imgSrc.startsWith('http')) {
        imgSrc = '../' + imgSrc;
      }
      if (linkSrc.startsWith('pages/')) {
        linkSrc = linkSrc.replace('pages/', '');
      } else if (!linkSrc.startsWith('../') && !linkSrc.startsWith('http')) {
        linkSrc = '../' + linkSrc;
      }
    }

    const infoHTML = item.infos.map((info, idx) => 
      `<p class="card-info-item info-${idx + 1}">${info}</p>`
    ).join('');

    return `
      <article class="main-card">
        <a href="${linkSrc}" class="main-card-link">
          <div class="main-card-thumb skeleton">
            <img src="${encodeURI(imgSrc)}" alt="${item.infos[0] || ''}" loading="lazy" onload="this.classList.add('loaded'); this.parentElement.classList.remove('skeleton');">
          </div>
          <div class="main-card-info">
            ${infoHTML}
            <p class="card-date">${item.date}</p>
          </div>
        </a>
      </article>
    `;
  }).join('');

  container.innerHTML = html;
}

// 3. 서브페이지 상세 이미지 및 캡션 자동 생성 (공백 제거 & 경로 안전 보장)
function renderFanworksDetail() {
  const container = document.querySelector('.fanworks-grid');
  const items = window.fanworksImages || [];
  if (!container || items.length === 0) return;

  const html = items.map(item => {
    let imgSrc = typeof item === 'string' ? item : item.src;
    const caption = typeof item === 'object' && item.caption ? item.caption : '';

    const captionHTML = caption 
      ? `<div class="fanworks-card-caption">${caption}</div>` 
      : '';

    return `
      <div class="fanworks-card skeleton">
        <img src="${encodeURI(imgSrc)}" alt="${caption || '상세 이미지'}" loading="lazy" onload="this.classList.add('loaded'); this.parentElement.classList.remove('skeleton');">
        ${captionHTML}
      </div>
    `;
  }).join('');

  container.innerHTML = html;
}

// 4. 서브페이지 이미지 크게 보기 (라이트박스 모달)
function initLightbox() {
  const detailContainer = document.querySelector('.fanworks-grid');
  if (!detailContainer) return;

  const modal = document.createElement('div');
  modal.className = 'image-modal';
  
  const modalImg = document.createElement('img');
  modalImg.className = 'image-modal-content';
  
  modal.appendChild(modalImg);
  document.body.appendChild(modal);

  detailContainer.addEventListener('click', (e) => {
    if (e.target.tagName === 'IMG') {
      modalImg.src = e.target.src;
      modalImg.alt = e.target.alt || '';
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  });

  modal.addEventListener('click', () => {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('active')) {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    }
  });
}

// 초기화 실행
function init() {
  renderHeader();
  renderGallery();
  renderFanworksDetail();
  initLightbox();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}