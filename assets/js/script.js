// assets/js/script.js

// 1. 헤더 설명 렌더링
function renderHeader() {
  const headerDescEl = document.querySelector('.header-desc');
  const headerInfos = window.headerInfos || [];
  if (!headerDescEl || headerInfos.length === 0) return;

  headerDescEl.innerHTML = headerInfos.join('<br>');
}

// 2. 갤러리 카드 렌더링 (메인 & OC 공통)
function renderGallery() {
  const container = document.querySelector('.grid-main, .grid-oc');
  const dataList = window.galleryData || [];
  if (!container) return;

  if (dataList.length === 0) {
    container.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #888; padding: 2rem 0;">등록된 데이터가 없습니다.</p>';
    return;
  }

  container.classList.add('crop-square');

  const isPagesFolder = window.location.pathname.includes('/pages/');

  const html = dataList.map(item => {
    let imgSrc = item.image || item.src || item.img || '';
    let linkSrc = item.link || '#';
    const caption = item.caption || '';

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

    const captionHTML = caption 
      ? `<div class="card-info"><p class="card-info-item">${caption}</p></div>` 
      : '';

    return `
      <article class="card">
        <a href="${linkSrc}" class="card-link">
          <div class="card-thumb">
            <img src="${encodeURI(imgSrc)}" 
                 alt="${caption.split('\n')[0] || ''}" 
                 loading="lazy" 
                 onerror="this.style.display='none';">
          </div>
          ${captionHTML}
        </a>
      </article>
    `;
  }).join('');

  container.innerHTML = html;
}

// 3. 서브페이지 상세 이미지 및 캡션 자동 생성
function renderFanworksDetail() {
  const container = document.querySelector('.grid-fanworks');
  const items = window.fanworksImages || [];
  if (!container || items.length === 0) return;

  const html = items.map(item => {
    let imgSrc = typeof item === 'string' ? item : (item.image || item.src || '');
    const caption = typeof item === 'object' && item.caption ? item.caption : '';

    const captionHTML = caption 
      ? `<div class="card-info"><p class="card-info-item">${caption}</p></div>` 
      : '';

    return `
      <div class="card">
        <div class="card-thumb">
          <img src="${encodeURI(imgSrc)}" 
               alt="${caption.split('\n')[0] || '상세 이미지'}" 
               loading="lazy" 
               onerror="this.style.display='none';">
        </div>
        ${captionHTML}
      </div>
    `;
  }).join('');

  container.innerHTML = html;
}

// 4. 서브페이지 라이트박스 모달
function initLightbox() {
  const detailContainer = document.querySelector('.grid-fanworks');
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

window.loadGallery = init;

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}