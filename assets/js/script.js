// assets/js/script.js

// 1. 헤더 설명 렌더링
function renderHeader() {
  const headerDescEl = document.querySelector('.header-desc');
  const headerInfos = window.headerInfos || [];
  if (!headerDescEl || headerInfos.length === 0) return;

  headerDescEl.innerHTML = headerInfos.join('<br>');
}

// 2. 공통 카드 HTML 생성 헬퍼 함수 (첫 번째 이미지만 카드에 표시, 전체 데이터는 모달용으로 전달)
function createCardHTML(item, isPagesFolder) {
  let rawImages = item.images || item.image || item.src || item.img || [];
  let imgList = Array.isArray(rawImages) ? rawImages : [rawImages];
  
  let linkSrc = item.link || '';
  const caption = item.caption || '';

  if (isPagesFolder) {
      imgList = imgList.map(imgVal => {
        const isImagePath = imgVal.includes('/') || imgVal.includes('.');
        if (isImagePath && !imgVal.startsWith('../') && !imgVal.startsWith('http')) {
          return '../' + imgVal;
        }
        return imgVal;
      });

      if (linkSrc.startsWith('pages/')) {
        linkSrc = linkSrc.replace('pages/', '');
      }
    }

  const totalCount = imgList.length;
  let thumbsHTML = '';
  
  if (imgList.length === 0 || (imgList.length === 1 && imgList[0] === '')) {
    thumbsHTML = `
      <div class="card-thumb text-thumb" role="img" aria-label="이미지 없음">
        <span>이미지 없음</span>
      </div>
    `;
  } else if (!imgList[0].includes('/') && !imgList[0].includes('.')) {
    const textVal = imgList[0];
    thumbsHTML = `
      <div class="card-thumb text-thumb" role="img" aria-label="${textVal}">
        <span>${textVal}</span>
      </div>
    `;
  } else {
    // 카드에는 맨 첫 번째 이미지만 표시하되, 전체 이미지를 모달에 넘기기 위해 data-images에 전체 리스트 주입
    const firstImgVal = imgList[0];
    const badgeHTML = (totalCount > 1) ? `<div class="image-count-badge">${totalCount}p</div>` : '';
    
    thumbsHTML = `
      <div class="card-thumb" data-images='${JSON.stringify(imgList)}'>
        ${badgeHTML}
        <img src="${encodeURI(firstImgVal)}" 
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

  if (linkSrc && totalCount <= 1 && (imgList.length === 0 || imgList[0].includes('/') || imgList[0].includes('.'))) {
    return `
      <article class="card">
        <a href="${linkSrc}" class="card-link" ${targetAttr}>
          ${thumbsHTML}
          ${captionHTML}
        </a>
      </article>
    `;
  } else {
    return `
      <article class="card multi-image-card" data-link="${linkSrc}">
        ${thumbsHTML}
        ${captionHTML}
      </article>
    `;
  }
}

// 3. 페이지네이션 및 그리드 렌더링 통합 관리
let currentPage = 1;
const itemsPerPage = 12;

function setupPagination(totalItems) {
  let paginationEl = document.querySelector('.floating-pagination');
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;

  if (currentPage > totalPages) currentPage = totalPages;
  if (currentPage < 1) currentPage = 1;

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

    document.getElementById('prev-btn').addEventListener('click', () => {
      if (currentPage > 1) {
        currentPage--;
        executeRender();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });

    document.getElementById('next-btn').addEventListener('click', () => {
      const activeData = window.galleryData || window.fanworksImages || [];
      const maxPages = Math.ceil(activeData.length / itemsPerPage) || 1;
      if (currentPage < maxPages) {
        currentPage++;
        executeRender();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  }

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

// 4. 통합 라이트박스 슬라이더 모달 (SVG 아이콘을 통한 완벽한 중앙 정렬)
function initLightbox() {
  const gridContainer = document.querySelector('.grid-cols-3, .grid-cols-4, .grid-cols-5');
  if (!gridContainer) return;

  const modal = document.createElement('div');
  modal.className = 'image-modal';
  
  modal.innerHTML = `
    <button class="modal-arrow modal-prev" aria-label="이전 이미지">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
    </button>
    <div class="modal-image-container">
      <img class="image-modal-content" src="" alt="확대 이미지">
    </div>
    <button class="modal-arrow modal-next" aria-label="다음 이미지">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
    </button>
  `;
  document.body.appendChild(modal);

  const modalImg = modal.querySelector('.image-modal-content');
  const prevBtn = modal.querySelector('.modal-prev');
  const nextBtn = modal.querySelector('.modal-next');

  let currentImages = [];
  let currentIndex = 0;

  function updateModalImage() {
    if (currentImages.length > 0) {
      modalImg.src = currentImages[currentIndex];
      
      // 이미지가 1장 이하일 경우 양쪽 모두 숨김
      if (currentImages.length <= 1) {
        prevBtn.style.display = 'none';
        nextBtn.style.display = 'none';
      } else {
        // 첫 번째 이미지인 경우 왼쪽(이전) 화살표 숨김, 마지막인 경우 보임
        prevBtn.style.display = (currentIndex === 0) ? 'none' : 'flex';
        
        // 마지막 이미지인 경우 오른쪽(다음) 화살표 숨김, 아니면 보임
        nextBtn.style.display = (currentIndex === currentImages.length - 1) ? 'none' : 'flex';
      }
    }
  }

  gridContainer.addEventListener('click', (e) => {
    const linkEl = e.target.closest('a');
    if (linkEl && linkEl.getAttribute('href') && linkEl.getAttribute('href') !== '#') {
      return;
    }

    const cardEl = e.target.closest('.card');
    if (cardEl && cardEl.hasAttribute('data-link')) {
      const linkVal = cardEl.getAttribute('data-link');
      if (linkVal && linkVal !== '') {
        window.location.href = linkVal;
        return;
      }
    }

    const thumbContainer = e.target.closest('.card-thumb');
    if (thumbContainer) {
      try {
        currentImages = JSON.parse(thumbContainer.getAttribute('data-images') || '[]');
        if (currentImages.length > 0) {
          currentIndex = 0;
          updateModalImage();
          modal.classList.add('active');
          document.body.style.overflow = 'hidden';
        }
      } catch (err) {
        console.error(err);
      }
    }
  });

  prevBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (currentImages.length > 1 && currentIndex > 0) {
      currentIndex--;
      updateModalImage();
    }
  });

  nextBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (currentImages.length > 1 && currentIndex < currentImages.length - 1) {
      currentIndex++;
      updateModalImage();
    }
  });

// 화살표 버튼을 제외한 모달 내외부(이미지 및 배경 포함) 어디를 클릭해도 닫히도록 설정
  modal.addEventListener('click', (e) => {
    // 클릭한 요소가 화살표 버튼(.modal-arrow 또는 그 내부 아이콘)이 아닐 때만 닫기 실행
    if (!e.target.closest('.modal-arrow')) {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    }
  });

  window.addEventListener('keydown', (e) => {
    if (!modal.classList.contains('active')) return;
    if (e.key === 'Escape') {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    } else if (e.key === 'ArrowLeft') {
      prevBtn.click();
    } else if (e.key === 'ArrowRight') {
      nextBtn.click();
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