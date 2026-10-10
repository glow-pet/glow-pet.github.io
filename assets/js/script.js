// assets/js/script.js

// 1. 헤더 설명 렌더링
function renderHeader() {
  const headerDescEl = document.querySelector('.header-desc');
  const headerInfos = window.headerInfos || [];
  if (!headerDescEl || headerInfos.length === 0) return;

  headerDescEl.innerHTML = headerInfos.join('<br>');
}

// 2. 공통 카드 HTML 생성 헬퍼 함수
function createCardHTML(item, isPagesFolder) {
  let imgVal = item.image || item.src || item.img || '';
  let linkSrc = item.link || '';
  const caption = item.caption || '';

  const isImagePath = imgVal.includes('/') || imgVal.includes('.');

  if (isPagesFolder) {
      if (isImagePath) {
        if (!imgVal.startsWith('../') && !imgVal.startsWith('http')) {
          imgVal = '../' + imgVal;
        }
      }
      // 링크는 pages/ 폴더 내부에 있으므로, 상대 경로(파일명) 그대로 유지되도록 처리
      if (linkSrc.startsWith('pages/')) {
        linkSrc = linkSrc.replace('pages/', '');
      }
    }

  let thumbHTML = '';
  if (!isImagePath && imgVal !== '') {
    thumbHTML = `
      <div class="card-thumb text-thumb" role="img" aria-label="${imgVal}">
        <span>${imgVal}</span>
      </div>
    `;
  } else {
    thumbHTML = `
      <div class="card-thumb">
        <img src="${encodeURI(imgVal)}" 
             alt="${caption.split('\n')[0] || ''}" 
             loading="lazy" 
             onerror="this.style.display='none';">
      </div>
    `;
  }

  const captionHTML = caption 
    ? `<div class="card-info"><p class="card-info-item">${caption}</p></div>` 
    : '';

  const isExternal = linkSrc.startsWith('http') || linkSrc.startsWith('https');
  const targetAttr = isExternal ? 'target="_blank" rel="noopener noreferrer" aria-label="외부 링크 (새 창)"' : '';

  if (linkSrc || (!isImagePath && imgVal !== '')) {
    return `
      <article class="card">
        <a href="${linkSrc || '#'}" class="card-link" ${targetAttr}>
          ${thumbHTML}
          ${captionHTML}
        </a>
      </article>
    `;
  } else {
    return `
      <article class="card">
        ${thumbHTML}
        ${captionHTML}
      </article>
    `;
  }
}

// 3. 페이지네이션 및 그리드 렌더링 통합 관리
let currentPage = 1;
const itemsPerPage = 12; // 페이지당 표시할 아이템 수 (조정 가능)

function setupPagination(totalItems) {
  let paginationEl = document.querySelector('.floating-pagination');
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;

  // 범위 이탈 방지
  if (currentPage > totalPages) currentPage = totalPages;
  if (currentPage < 1) currentPage = 1;

  // 플로팅 UI가 없으면 동적으로 생성하여 body에 주입
  if (!paginationEl) {
    paginationEl = document.createElement('nav');
    paginationEl.className = 'floating-pagination';
    paginationEl.setAttribute('aria-label', '갤러리 페이지 네비게이션');
    paginationEl.innerHTML = `
      <button id="prev-btn" class="page-btn arrow-btn" aria-label="이전 페이지">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
      </button>
      <div class="page-indicator" aria-live="polite">
        <span id="current-page">1</span>/<span id="total-pages">1</span>
      </div>
      <button id="next-btn" class="page-btn arrow-btn" aria-label="다음 페이지">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
      </button>
    `;
    document.body.appendChild(paginationEl);

    // 이벤트 리스너 등록 (최초 1회)
    document.getElementById('prev-btn').addEventListener('click', () => {
      if (currentPage > 1) {
        currentPage--;
        executeRender();
      }
    });

    document.getElementById('next-btn').addEventListener('click', () => {
      const activeData = window.galleryData || window.fanworksImages || [];
      const maxPages = Math.ceil(activeData.length / itemsPerPage) || 1;
      if (currentPage < maxPages) {
        currentPage++;
        executeRender();
      }
    });
  }

  // 상태 업데이트 및 끝 도달 시 버튼 비활성화 (아무 일도 일어나지 않음)
  document.getElementById('current-page').textContent = currentPage;
  document.getElementById('total-pages').textContent = totalPages;
  document.getElementById('prev-btn').disabled = (currentPage === 1);
  document.getElementById('next-btn').disabled = (currentPage >= totalPages);
}

function executeRender() {
  const mainContainer = document.querySelector('.grid-cols-4, .grid-cols-5');
  const subContainer = document.querySelector('.grid-cols-3');
  const isPagesFolder = window.location.pathname.includes('/pages/');

  if (mainContainer) {
    const dataList = window.galleryData || [];
    if (dataList.length === 0) {
      mainContainer.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #888; padding: 2rem 0;">등록된 데이터가 없습니다.</p>';
      return;
    }
    mainContainer.classList.add('crop-square');
    const paginatedData = dataList.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    mainContainer.innerHTML = paginatedData.map(item => createCardHTML(item, isPagesFolder)).join('');
    setupPagination(dataList.length);
  } 
  else if (subContainer) {
    const items = window.fanworksImages || [];
    if (items.length === 0) return;
    const paginatedItems = items.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    subContainer.innerHTML = paginatedItems.map(item => {
      const dataItem = typeof item === 'string' ? { image: item, caption: '' } : item;
      return createCardHTML(dataItem, isPagesFolder);
    }).join('');
    setupPagination(items.length);
  }
}

// 4. 서브페이지 라이트박스 모달
function initLightbox() {
  const detailContainer = document.querySelector('.grid-cols-3');
  if (!detailContainer) return;

  const modal = document.createElement('div');
  modal.className = 'image-modal';
  
  const modalImg = document.createElement('img');
  modalImg.className = 'image-modal-content';
  
  modal.appendChild(modalImg);
  document.body.appendChild(modal);

  detailContainer.addEventListener('click', (e) => {
    if (e.target.tagName === 'IMG' && !e.target.closest('a')) {
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
  executeRender();
  initLightbox();
}

window.loadGallery = init;

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}