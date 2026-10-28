// assets/js/script.js
import { TagFilterModal } from './filterModal.js';

let allPosts = [];
let filteredPosts = [];
let currentPage = 1;
const itemsPerPage = 12;
let tagFilterModal = null;
let profilesData = [];

// [공통 유틸리티] 이미지 리사이징 경로 처리
function getResizedImageUrl(src, targetWidth = 400) {
  if (!src || src.startsWith('http')) return src;
  return src;
}

// [공통 유틸리티] 정렬 로직 (최신순)
window.currentSortMode = 'latest';
function getSortedData(dataArray) {
  if (!Array.isArray(dataArray)) return [];
  const list = [...dataArray];

  return list.sort((a, b) => {
    const dateA = new Date(a.date || 0);
    const dateB = new Date(b.date || 0);
    if (dateB - dateA !== 0) {
      return dateB - dateA;
    }
    return (b.id || 0) - (a.id || 0);
  });
}

// [핵심 통합 함수] fanworks 및 ocs 공통 필터링 로직
// 규칙:
// 1. private === true 인 게시물은 민감한 콘텐츠 토글 여부와 상관없이 항상 제외
// 2. sensitive === true 인 게시물은 window.showSensitiveGlobal 이 false일 때 썸네일을 가리거나 필터링 조건에 맞춰 처리
// 3. activeFilters (태그 조건) 적용
function getFilteredAndProcessedData(rawData, activeFilters = {}) {
  return (rawData || []).filter(item => {
    // 1. 비공개 게시물(private)은 토글 상관없이 항상 제외
    if (item.private) return false;

    // 2. 태그 필터링 (include / exclude)
    const postTags = item.tags || [];
    for (const [tag, state] of Object.entries(activeFilters)) {
      const hasTag = postTags.includes(tag);
      if (state === 'include' && !hasTag) return false;
      if (state === 'exclude' && hasTag) return false;
    }

    return true;
  });
}

// 1. 헤더 및 필터 열기 버튼 (컨테이너 오른쪽 정렬)
// 1. 헤더 및 필터 열기 버튼 (스타일을 CSS로 분리 및 우측 정렬)
function renderHeader() {
  const headerEl = document.querySelector('.header');
  const mainGrid = document.querySelector('.grid-cols-4, .grid-cols-5, .grid-cols-3');

  if (headerEl && mainGrid && !document.querySelector('.controls-wrapper')) {
    const controlsWrapper = document.createElement('div');
    controlsWrapper.className = 'controls-wrapper';
    controlsWrapper.style.display = 'flex';
    controlsWrapper.style.justifyContent = 'flex-end'; // 오른쪽 정렬
    controlsWrapper.style.alignItems = 'center';
    controlsWrapper.style.marginBottom = '1.5rem';

    controlsWrapper.innerHTML = `
      <button type="button" id="open-filter-modal-btn" class="filter-open-btn">필터</button>
    `;
    headerEl.insertAdjacentElement('afterend', controlsWrapper);

    document.getElementById('open-filter-modal-btn').addEventListener('click', () => {
      if (tagFilterModal) tagFilterModal.open();
    });
  }
}

// 2. OCs 카드 HTML 생성 (비공개 및 민감 콘텐츠 썸네일 보안 통합)
function createOcCardHTML(item, showSensitiveOverride = false) {
  const isPrivate = item.private;
  const isSensitive = item.sensitive;
  const thumbSrc = getResizedImageUrl(item.thumbnail || item.portrait || '', 300);

  let thumbsHTML = '';
  let cardClasses = "card";
  let datasetAttr = "";

  // 비공개이거나, 민감한 콘텐츠이면서 토글이 꺼져 있는 경우
  if (isPrivate || (isSensitive && !showSensitiveOverride)) {
    const labelText = isPrivate ? '비공개' : '민감한 콘텐츠';
    thumbsHTML = `
      <div class="card-thumb text-thumb" style="background-color: #555; color: #fff; aspect-ratio: 1/1; display: flex; align-items: center; justify-content: center; font-weight: 600; cursor: default;">
        <span>${labelText}</span>
      </div>
    `;
  } else {
    cardClasses += " open-oc-modal";
    datasetAttr = `data-oc-id="${item.id}"`;
    thumbsHTML = `
      <div class="card-thumb">
        <img src="${thumbSrc}" alt="${item.name || ''}" loading="lazy" onerror="this.style.display='none';">
      </div>
    `;
  }

  return `
    <article class="${cardClasses}" ${datasetAttr} style="cursor: ${(isPrivate || (isSensitive && !showSensitiveOverride)) ? 'default' : 'pointer'};">
      ${thumbsHTML}
    </article>
  `;
}

// 3. OCs 모달 초기화 (어디든 클릭 시 자연스럽게 닫히도록 수정)
function initOcLightbox() {
  let ocModal = document.querySelector('.oc-modal');
  if (!ocModal) {
    ocModal = document.createElement('div');
    ocModal.className = 'oc-modal';
    ocModal.innerHTML = `
      <button type="button" class="oc-modal-close-btn" aria-label="닫기">✕</button>
      <div class="oc-modal-body">
        <div class="oc-modal-left-pane">
          <div class="oc-modal-basic-info">
            <div class="oc-info-name" id="ocName"></div>
            <div class="oc-info-foreign-name" id="ocForeignName"></div>
            <div class="oc-info-title" id="ocTitle"></div>
            <div class="oc-info-stats">
              <span id="ocAge"></span>
              <span id="ocGender"></span>
              <span id="ocHeight"></span>
            </div>
          </div>
          <img class="oc-modal-portrait" id="ocPortrait" src="" alt="초상화">
        </div>
        <div class="oc-modal-right-pane">
          <div class="oc-modal-right-pane-scrollable">
            <div class="oc-modal-detail-text" id="ocDetailText"></div>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(ocModal);
  }

  const closeBtn = ocModal.querySelector('.oc-modal-close-btn');

  function openOcModal(character) {
    document.getElementById('ocName').innerText = character.name || '';
    document.getElementById('ocForeignName').innerText = character.foreignName || '';
    document.getElementById('ocTitle').innerText = character.title || '';
    
    document.getElementById('ocAge').innerText = character.age ? `${character.age}세` : '';
    document.getElementById('ocGender').innerText = character.gender || '';
    document.getElementById('ocHeight').innerText = character.height ? `${character.height}cm` : '';

    document.getElementById('ocPortrait').src = getResizedImageUrl(character.portrait || character.thumbnail || '', 800);
    document.getElementById('ocDetailText').innerText = character.description || '';

    ocModal.classList.add('active');
    document.body.classList.add('modal-open');
  }

  function closeOcModal() {
    ocModal.classList.remove('active');
    document.body.classList.remove('modal-open');
  }

  closeBtn.onclick = (e) => {
    e.stopPropagation();
    closeOcModal();
  };
  
  // 모달 영역 어디든 클릭하면 닫기
  ocModal.onclick = (e) => {
    closeOcModal();
  };

  const gridContainer = document.querySelector('.grid-cols-5');
  if (gridContainer) {
    gridContainer.onclick = (e) => {
      const card = e.target.closest('.open-oc-modal');
      if (!card) return;
      const ocId = parseInt(card.dataset.ocId);
      const targetChar = profilesData.find(p => p.id === ocId);
      if (targetChar) openOcModal(targetChar);
    };
  }
}

async function initOcApp() {
  const isProfilePage = document.querySelector('.grid-cols-5');
  if (isProfilePage) {
    renderHeader();
    try {
      const jsonPath = window.location.pathname.includes('/pages/') ? '../profiles.json' : 'profiles.json';
      const res = await fetch(jsonPath);
      if (res.ok) {
        profilesData = await res.json();
        isProfilePage.classList.add('crop-square');
        const showSens = window.showSensitiveGlobal || false;
        
        // 공통 필터 함수 적용
        const activeOcData = getFilteredAndProcessedData(profilesData);
        isProfilePage.innerHTML = activeOcData.map(item => createOcCardHTML(item, showSens)).join('');
        initOcLightbox();
      }
    } catch (e) {
      console.error('profiles.json 로드 실패', e);
    }
  }
}

// 4. Fanworks 카드 HTML 생성
function createCardHTML(item, isPagesFolder, showSensitiveOverride = false) {
  let thumbSrc = '';
  if (item.images && Array.isArray(item.images) && item.images.length > 0) {
    thumbSrc = item.images[0];
  } else {
    thumbSrc = item['thumbnail-image'] || '';
  }
  
  thumbSrc = getResizedImageUrl(thumbSrc, 400);

  const textThumb = item['thumbnail-text'] || '';
  let linkSrc = item.link || '';
  const altText = item.alt || '';
  const dateStr = item.date || '';
  const tags = item.tags || [];

  const isPrivate = item.private;
  const isSensitive = item.sensitive;

  if (isPagesFolder) {
    if (thumbSrc && !thumbSrc.startsWith('../') && !thumbSrc.startsWith('http')) {
      thumbSrc = '../' + thumbSrc;
    }
  }

  let thumbsHTML = '';
  // 비공개이거나, 민감한 콘텐츠이면서 토글이 꺼져 있는 경우
  if (isPrivate || (isSensitive && !showSensitiveOverride)) {
    const labelText = isPrivate ? '비공개' : '민감한 콘텐츠';
    thumbsHTML = `
      <div class="card-thumb text-thumb" style="background-color: #555; color: #fff; aspect-ratio: 1/1; display: flex; align-items: center; justify-content: center; font-weight: 600;">
        <span>${labelText}</span>
      </div>
    `;
  } else if (textThumb) {
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
      let processed = getResizedImageUrl(img, 400);
      if (isPagesFolder && processed && !processed.startsWith('../') && !processed.startsWith('http')) {
        return '../' + processed;
      }
      return processed;
    });

    const modalAttrs = `
      data-images='${JSON.stringify(processedImages)}' 
      data-caption="${encodeURIComponent(altText)}" 
      data-date="${encodeURIComponent(dateStr)}" 
      data-tags='${JSON.stringify(tags)}'
    `;

    thumbsHTML = `
      <div class="card-thumb" ${modalAttrs}>
        <img src="${processedImages[0]}" alt="" loading="lazy" srcset="${processedImages[0]} 400w" sizes="(max-width: 600px) 100vw, 400px">
      </div>
    `;
  }

  if (linkSrc && !(isPrivate || (isSensitive && !showSensitiveOverride))) {
    const isExternal = linkSrc.startsWith('http') || linkSrc.startsWith('https');
    const targetAttr = isExternal ? 'target="_blank" rel="noopener noreferrer"' : '';
    thumbsHTML = `<a href="${linkSrc}" class="card-thumb-link" ${targetAttr}>${thumbsHTML}</a>`;
  }

  return `
    <article class="card">
      ${thumbsHTML}
    </article>
  `;
}

// 5. 페이지네이션 렌더링
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

// 6. Fanworks 렌더링 실행
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
    
    mainContainer.innerHTML = slicedData.map(item => createCardHTML(item, isPagesFolder, window.showSensitiveGlobal)).join('');
    renderPagination(dataList.length);
  }
}

// 7. Fanworks 라이트박스 모달
function initLightbox() {
  const gridContainer = document.querySelector('.grid-cols-4, .grid-cols-5');
  if (!gridContainer) return;

  let modal = document.querySelector('.image-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.className = 'image-modal';
    modal.innerHTML = `
      <button type="button" class="modal-close-btn" aria-label="모달 닫기">✕</button>
      <div class="modal-body-container">
        <div class="modal-image-container">
          <button type="button" class="modal-arrow modal-prev" aria-label="이전 이미지">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
          </button>
          <img class="image-modal-content" src="" alt="확대 이미지" tabindex="0">
          <button type="button" class="modal-arrow modal-next" aria-label="다음 이미지">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </button>
        </div>
        <div class="modal-caption-container">
          <div class="modal-meta-top"></div>
          <p class="modal-caption-text"></p>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }

  const modalImg = modal.querySelector('.image-modal-content');
  const captionTextEl = modal.querySelector('.modal-caption-text');
  const modalMetaTop = modal.querySelector('.modal-meta-top');
  const prevBtn = modal.querySelector('.modal-prev');
  const nextBtn = modal.querySelector('.modal-next');
  const closeBtn = modal.querySelector('.modal-close-btn');

  let currentImages = [];
  let currentIndex = 0;

  function updateModalImage() {
    if (currentImages.length > 0) {
      modalImg.src = getResizedImageUrl(currentImages[currentIndex], 1200);
      
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

  gridContainer.onclick = (e) => {
    const thumbContainer = e.target.closest('.card-thumb');
    if (!thumbContainer) return;
    e.stopPropagation();

    try {
      const imagesAttr = thumbContainer.getAttribute('data-images');
      currentImages = imagesAttr ? JSON.parse(imagesAttr) : [];
      const currentCaption = decodeURIComponent(thumbContainer.getAttribute('data-caption') || '');
      const currentDate = decodeURIComponent(thumbContainer.getAttribute('data-date') || '');
      const currentTags = JSON.parse(thumbContainer.getAttribute('data-tags') || '[]');

      if (currentImages.length > 0) {
        currentIndex = 0;
        updateModalImage();

        const dateHtml = `<div class="modal-meta-date">${currentDate || '날짜 없음'}</div>`;
        const tagsText = currentTags.length > 0 ? currentTags.map(t => `#${t}`).join(' ') : '태그 없음';
        const tagsHtml = `<div class="modal-meta-tags">${tagsText}</div>`;
        const pageCountHtml = `<div class="modal-meta-pages">${currentImages.length}쪽</div>`;

        modalMetaTop.innerHTML = dateHtml + tagsHtml + pageCountHtml;

        if (currentCaption.trim()) {
          captionTextEl.innerText = currentCaption;
          captionTextEl.style.display = 'block';
        } else {
          captionTextEl.innerText = '';
          captionTextEl.style.display = 'none';
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

  // 모달 영역 어디든 클릭하면 닫기
  modal.onclick = (e) => {
    closeModal();
  };
}

// 8. 메인 애플리케이션 초기화
async function initApp() {
  const isProfilePage = document.querySelector('.grid-cols-5');
  if (isProfilePage) {
    await initOcApp();
  }

  renderHeader();

  const isPagesFolder = window.location.pathname.includes('/pages/');
  const jsonPath = isProfilePage 
    ? (isPagesFolder ? '../profiles.json' : 'profiles.json')
    : (isPagesFolder ? '../posts.json' : 'posts.json');

  try {
    const response = await fetch(jsonPath);
    if (response.ok) {
      const data = await response.json();
      if (isProfilePage) {
        window.ocData = getFilteredAndProcessedData(data);
      } else {
        window.galleryData = getFilteredAndProcessedData(data);
      }
    }
  } catch (e) {
    console.error('데이터 로드 실패', e);
  }

  window.showSensitiveGlobal = false;

  const filterOptions = isProfilePage ? { hideTags: true } : {};

  // 태그 필터 모달 이벤트 콜백
  tagFilterModal = new TagFilterModal((activeFilters, options) => {
    window.isFiltered = true;
    window.showSensitiveGlobal = options.showSensitive || false;

    if (isProfilePage) {
      // OCs 페이지: 공통 필터 함수로 정제 후 렌더링
      const mainContainer = document.querySelector('.grid-cols-5');
      if (mainContainer) {
        const processedOcData = getFilteredAndProcessedData(profilesData, activeFilters);
        mainContainer.innerHTML = processedOcData.map(item => createOcCardHTML(item, window.showSensitiveGlobal)).join('');
      }
    } else {
      // Fanworks 페이지: 공통 필터 함수로 정제 후 렌더링
      filteredPosts = getFilteredAndProcessedData(window.galleryData, activeFilters);
      currentPage = 1;
      executeRender();
    }
  }, filterOptions);

  if (!isProfilePage && window.galleryData) {
    tagFilterModal.renderTags(window.galleryData);
  } else if (isProfilePage && window.ocData) {
    tagFilterModal.renderTags([]);
  }

  if (!isProfilePage) {
    executeRender();
    initLightbox();
  }
}

window.loadGallery = initApp;

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}