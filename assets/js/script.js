// assets/js/script.js
import { TagFilterModal } from './filterModal.js';

let allPosts = [];
let filteredPosts = [];
let currentPage = 1;
const itemsPerPage = 12;
let tagFilterModal = null;

// 1. 헤더 및 필터 열기 버튼 추가 (정렬 기준 '최신순'만 남김)
function renderHeader() {
  const headerEl = document.querySelector('.header');
  const mainGrid = document.querySelector('.grid-cols-4, .grid-cols-5, .grid-cols-3');

  if (headerEl && mainGrid && !document.querySelector('.controls-wrapper')) {
    const controlsWrapper = document.createElement('div');
    controlsWrapper.className = 'controls-wrapper';
    controlsWrapper.style.display = 'flex';
    controlsWrapper.style.justifyContent = 'space-between';
    controlsWrapper.style.alignItems = 'center';
    controlsWrapper.style.marginBottom = '1.5rem';

    controlsWrapper.innerHTML = `
      <button type="button" id="open-filter-modal-btn" class="filter-open-btn" style="padding: 0.4rem 0.8rem; font-size: 0.85rem; border: 1px solid #ccc; border-radius: 4px; background: #fff; cursor: pointer;">태그 필터</button>
      <div class="sort-dropdown-wrapper" style="margin-bottom: 0;">
        <select id="sort-select" class="sort-select" aria-label="카드 정렬 기준">
          <option value="latest">최신순</option>
        </select>
      </div>
    `;
    headerEl.insertAdjacentElement('afterend', controlsWrapper);

    document.getElementById('open-filter-modal-btn').addEventListener('click', () => {
      if (tagFilterModal) tagFilterModal.open();
    });

    const selectEl = controlsWrapper.querySelector('#sort-select');
    selectEl.addEventListener('change', (e) => {
      window.currentSortMode = e.target.value;
      currentPage = 1;
      executeRender();
    });
  }
}

// 2. 카드 HTML 생성
function createCardHTML(item, isPagesFolder) {
  let thumbSrc = '';
  if (item.images && Array.isArray(item.images) && item.images.length > 0) {
    thumbSrc = item.images[0];
  } else {
    thumbSrc = item['thumbnail-image'] || '';
  }
  
  const textThumb = item['thumbnail-text'] || '';
  let linkSrc = item.link || '';
  const altText = item.alt || '';
  const dateStr = item.date || '';
  const tags = item.tags || [];

  if (isPagesFolder) {
    if (thumbSrc && !thumbSrc.startsWith('../') && !thumbSrc.startsWith('http')) {
      thumbSrc = '../' + thumbSrc;
    }
  }

  let thumbsHTML = '';
  if (textThumb) {
    thumbsHTML = `
      <div class="card-thumb text-thumb" role="img" aria-label="${textThumb}">
        <span>${textThumb}</span>
      </div>
    `;
  } else {
    let rawImages = (item.images && Array.isArray(item.images) && item.images.length > 0) 
      ? item.images 
      : [thumbSrc];

    let processedImages = rawImages.map(img => {
      if (isPagesFolder && img && !img.startsWith('../') && !img.startsWith('http')) {
        return '../' + img;
      }
      return img;
    });

    const modalAttrs = `data-images='${JSON.stringify(processedImages)}' data-caption="${encodeURIComponent(altText)}"`;
    
    // 이미지가 2개 이상일 때만 좌측 상단에 갯수 뱃지 추가
    let countBadgeHTML = '';
    if (rawImages.length > 1) {
      countBadgeHTML = `<div class="image-count-badge">${rawImages.length}</div>`;
    }

    thumbsHTML = `
      <div class="card-thumb open-modal-thumb" ${modalAttrs}>
        ${countBadgeHTML}
        <img src="${encodeURI(thumbSrc)}" alt="${altText}" loading="lazy" onerror="this.style.display='none';">
      </div>
    `;
  }
  
  if (linkSrc) {
    const isExternal = linkSrc.startsWith('http') || linkSrc.startsWith('https');
    const targetAttr = isExternal ? 'target="_blank" rel="noopener noreferrer"' : '';
    thumbsHTML = `<a href="${linkSrc}" class="card-thumb-link" ${targetAttr}>${thumbsHTML}</a>`;
  }

  const tagsHtml = tags.length > 0 
    ? `<div class="card-tags">${tags.map(tag => `<span class="tag-badge">${tag}</span>`).join('')}</div>` 
    : '';

  const infoHTML = `
    <div class="card-info">
      ${tagsHtml}
      ${dateStr ? `<div class="card-date">${dateStr}</div>` : ''}
    </div>
  `;

  return `
    <article class="card">
      ${thumbsHTML}
      ${infoHTML}
    </article>
  `;
}

window.currentSortMode = 'latest';

function getSortedData(dataArray) {
  if (!Array.isArray(dataArray)) return [];
  const list = [...dataArray];

  // 최신순 정렬 (날짜 기준 내림차순, 날짜가 없다면 id 기준 내림차순)
  return list.sort((a, b) => {
    const dateA = new Date(a.date || 0);
    const dateB = new Date(b.date || 0);
    if (dateB - dateA !== 0) {
      return dateB - dateA;
    }
    return (b.id || 0) - (a.id || 0);
  });
}

// 3. 페이지네이션 UI 렌더링
function renderPagination(totalItems) {
  const containerEl = document.querySelector('.container');
  if (!containerEl) return;

  let paginationEl = containerEl.querySelector('.pagination-container');
  if (!paginationEl) {
    paginationEl = document.createElement('nav');
    paginationEl.className = 'pagination-container';
    containerEl.appendChild(paginationEl);
  }

  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  if (totalPages <= 1) {
    paginationEl.innerHTML = '';
    return;
  }

  let html = `<button type="button" class="page-arrow" ${currentPage === 1 ? 'disabled' : ''} data-page="${currentPage - 1}">&lt;</button>`;
  
  for (let i = 1; i <= totalPages; i++) {
    html += `<button type="button" class="page-num ${i === currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
  }

  html += `<button type="button" class="page-arrow" ${currentPage === totalPages ? 'disabled' : ''} data-page="${currentPage + 1}">&gt;</button>`;
  paginationEl.innerHTML = html;

  paginationEl.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const targetPage = parseInt(e.currentTarget.dataset.page);
      if (!isNaN(targetPage)) {
        currentPage = targetPage;
        executeRender();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  });
}

function executeRender() {
  const mainContainer = document.querySelector('.grid-cols-4, .grid-cols-5');
  const isPagesFolder = window.location.pathname.includes('/pages/');

  if (mainContainer) {
    let dataList = filteredPosts.length > 0 || window.isFiltered ? filteredPosts : (window.galleryData || []);
    dataList = getSortedData(dataList);

    if (dataList.length === 0) {
      mainContainer.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #888; padding: 2rem 0;">등록된 데이터가 없습니다.</p>';
      renderPagination(0);
      return;
    }

    mainContainer.classList.add('crop-square');
    
    const startIndex = (currentPage - 1) * itemsPerPage;
    const slicedData = dataList.slice(startIndex, startIndex + itemsPerPage);
    
    mainContainer.innerHTML = slicedData.map(item => createCardHTML(item, isPagesFolder)).join('');
    renderPagination(dataList.length);
  }
}

// 4. 라이트박스 (모달창)
function initLightbox() {
  const gridContainer = document.querySelector('.grid-cols-4, .grid-cols-5');
  if (!gridContainer) return;

  let modal = document.querySelector('.image-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.className = 'image-modal';
    modal.innerHTML = `
      <button type="button" class="modal-close-btn" aria-label="모달 닫기">✕</button>
      <button type="button" class="modal-arrow modal-prev" aria-label="이전 이미지">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
      </button>
      <div class="modal-body-container">
        <div class="modal-image-container">
          <img class="image-modal-content" src="" alt="확대 이미지" tabindex="0">
        </div>
        <div class="modal-caption-container">
          <p class="modal-caption-text"></p>
        </div>
      </div>
      <button type="button" class="modal-arrow modal-next" aria-label="다음 이미지">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
      </button>
    `;
    document.body.appendChild(modal);
  }

  const modalImg = modal.querySelector('.image-modal-content');
  const captionTextEl = modal.querySelector('.modal-caption-text');
  const captionContainer = modal.querySelector('.modal-caption-container');
  const prevBtn = modal.querySelector('.modal-prev');
  const nextBtn = modal.querySelector('.modal-next');
  const closeBtn = modal.querySelector('.modal-close-btn');

  let currentImages = [];
  let currentIndex = 0;

  function updateModalImage() {
    if (currentImages.length > 0) {
      modalImg.src = currentImages[currentIndex];
      
      if (currentImages.length <= 1) {
        prevBtn.style.display = 'none';
        nextBtn.style.display = 'none';
      } else {
        prevBtn.style.display = (currentIndex === 0) ? 'none' : 'flex';
        nextBtn.style.display = (currentIndex === currentImages.length - 1) ? 'none' : 'flex';
      }
    }
  }

  function openModal() {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';
  }

  function closeModal() {
    modal.classList.remove('active');
    document.body.style.overflow = '';
    document.body.style.touchAction = '';
  }

  modal.addEventListener('wheel', (e) => {
    if (!e.target.closest('.modal-caption-container')) {
      e.preventDefault();
    }
  }, { passive: false });

  modal.addEventListener('touchmove', (e) => {
    if (!e.target.closest('.modal-caption-container')) {
      e.preventDefault();
    }
  }, { passive: false });

  gridContainer.onclick = (e) => {
    const thumbContainer = e.target.closest('.card-thumb');
    if (!thumbContainer) return;
    e.stopPropagation();

    try {
      const imagesAttr = thumbContainer.getAttribute('data-images');
      currentImages = imagesAttr ? JSON.parse(imagesAttr) : [];
      const currentCaption = decodeURIComponent(thumbContainer.getAttribute('data-caption') || '');

      if (currentImages.length > 0) {
        currentIndex = 0;
        updateModalImage();

        if (currentCaption.trim()) {
          captionTextEl.innerText = currentCaption;
          captionContainer.style.display = 'block';
        } else {
          captionTextEl.innerText = '';
          captionContainer.style.display = 'none';
        }

        openModal();
      }
    } catch (err) {
      console.error(err);
    }
  };

  prevBtn.onclick = (e) => {
    e.stopPropagation();
    if (currentImages.length > 1 && currentIndex > 0) {
      currentIndex--;
      updateModalImage();
    }
  };

  nextBtn.onclick = (e) => {
    e.stopPropagation();
    if (currentImages.length > 1 && currentIndex < currentImages.length - 1) {
      currentIndex++;
      updateModalImage();
    }
  };

  closeBtn.onclick = (e) => {
    e.stopPropagation();
    closeModal();
  };

  modal.onclick = (e) => {
    if (e.target === modal || e.target.classList.contains('modal-body-container') || e.target.classList.contains('modal-image-container')) {
      closeModal();
    }
  };
}

// 초기화 함수
async function initApp() {
  renderHeader();

  try {
    const jsonPath = window.location.pathname.includes('/pages/') ? '../posts.json' : 'posts.json';
    const response = await fetch(jsonPath);
    if (response.ok) {
      const posts = await response.json();
      window.galleryData = posts.filter(p => p.status !== 'private');
    }
  } catch (e) {
    console.error('posts.json 로드 실패', e);
  }

  tagFilterModal = new TagFilterModal((activeFilters) => {
    window.isFiltered = true;
    filteredPosts = (window.galleryData || []).filter(post => {
      const postTags = post.tags || [];
      for (const [tag, state] of Object.entries(activeFilters)) {
        const hasTag = postTags.includes(tag);
        if (state === 'include' && !hasTag) return false;
        if (state === 'exclude' && hasTag) return false;
      }
      return true;
    });
    currentPage = 1;
    executeRender();
  });

  if (window.galleryData) {
    tagFilterModal.renderTags(window.galleryData);
  }

  executeRender();
  initLightbox();
}

window.loadGallery = initApp;

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}