// assets/js/script.js
import { TagFilterModal } from './filterModal.js';

let filteredPosts = [];
let currentPage = 1;
const itemsPerPage = 12;
let tagFilterModal = null;
let profilesData = [];
let isAppInitialized = false;

function resolveAssetPath(src) {
  if (!src) return '';
  if (src.startsWith('http') || src.startsWith('/') || src.startsWith('../') || src.startsWith('data:')) {
    return src;
  }
  const isPagesFolder = window.location.pathname.includes('pages');
  if (isPagesFolder && src.startsWith('assets/')) {
    return '../' + src;
  }
  return src;
}

function updateScrollbarWidth() {
  const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
  document.documentElement.style.setProperty('--scrollbar-width', `${scrollbarWidth}px`);
}

window.currentSortMode = 'latest';
function getSortedData(dataArray) {
  if (!Array.isArray(dataArray)) return [];
  const list = [...dataArray];
  return list.sort((a, b) => {
    const dateA = new Date(a.date || 0);
    const dateB = new Date(b.date || 0);
    if (dateB - dateA !== 0) return dateB - dateA;
    return (b.id || 0) - (a.id || 0);
  });
}

function getFilteredAndProcessedData(rawData, activeFilters = {}) {
  return (rawData || []).filter(item => {
    if (item.private) return false;
    const postTags = item.tags || [];
    for (const [tag, state] of Object.entries(activeFilters)) {
      const hasTag = postTags.includes(tag);
      if (state === 'include' && !hasTag) return false;
      if (state === 'exclude' && hasTag) return false;
    }
    return true;
  });
}

function renderHeader() {
  const headerEl = document.querySelector('.header');
  const gridEl = document.querySelector('.fanworks-grid, .ocs-grid, .worlds-grid');

  if (headerEl && gridEl && !document.querySelector('.controls-wrapper')) {
    const controlsWrapper = document.createElement('div');
    controlsWrapper.className = 'controls-wrapper';
    controlsWrapper.innerHTML = `<button type="button" id="open-filter-modal-btn" class="btn-dark-long">필터</button>`;
    headerEl.insertAdjacentElement('afterend', controlsWrapper);

    const filterBtn = document.getElementById('open-filter-modal-btn');
    if (filterBtn) {
      filterBtn.addEventListener('click', () => {
        if (tagFilterModal) tagFilterModal.open();
      });
    }
  }
}

// OCs 카드 생성
function createOcCardHTML(item, showSensitiveOverride = false) {
  const isPrivate = item.private;
  const isSensitive = item.rating === 'warning' || item.rating === 'external' || item.sensitive;
  const rawSrc = item.thumbnail || item.portrait || '';
  const thumbSrc = resolveAssetPath(rawSrc);

  let thumbsHTML = '';
  if (isPrivate) {
    thumbsHTML = `<div class="card-thumb text-thumb private-thumb"><span>비공개</span></div>`;
  } else if (isSensitive && !showSensitiveOverride) {
    thumbsHTML = `<div class="card-thumb text-thumb sensitive-thumb"><span>민감한 콘텐츠</span></div>`;
  } else if (!thumbSrc) {
    thumbsHTML = `<div class="card-thumb text-thumb placeholder-thumb"><span>이미지 준비 중</span></div>`;
  } else {
    thumbsHTML = `<div class="card-thumb"><img src="${thumbSrc}" alt="${item.name || ''}" loading="lazy" onerror="this.parentNode.innerHTML='<div class=\\'card-thumb text-thumb placeholder-thumb\\'><span>이미지 준비 중</span></div>';"></div>`;
  }

  return `
    <article class="card open-oc-modal" data-oc-id="${item.id}">
      ${thumbsHTML}
      <div class="oc-card-info">
        <div class="oc-card-name">${item.name || ''}</div>
        ${item.foreignName ? `<div class="oc-card-foreign-name">${item.foreignName}</div>` : ''}
      </div>
    </article>
  `;
}

// OCs 모달 제어
function initOcLightbox() {
  let ocModal = document.querySelector('.oc-modal');
  if (!ocModal) {
    ocModal = document.createElement('div');
    ocModal.className = 'oc-modal fanworks-modal';
    ocModal.innerHTML = `
      <button type="button" class="modal-close-btn" aria-label="닫기">✕</button>
      <div class="modal-body-container">
        <div class="modal-image-container" id="ocImageWrapper"></div>
        <div class="modal-caption-container oc-caption-container">
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
          <div class="modal-meta-top" id="ocDetailMetaTop"></div>
          <p class="modal-caption-text" id="ocDetailText"></p>
        </div>
      </div>
    `;
    document.body.appendChild(ocModal);
  }

  const closeBtn = ocModal.querySelector('.modal-close-btn');

  function closeOcModal() {
    ocModal.classList.remove('active');
    const existingMask = ocModal.querySelector('.oc-full-warning-mask');
    if (existingMask) existingMask.remove();
  }

  function openOcModal(character) {
    updateScrollbarWidth();
    closeOcModal();

    document.getElementById('ocName').innerText = character.name || '';
    document.getElementById('ocForeignName').innerText = character.foreignName || '';
    document.getElementById('ocTitle').innerText = character.title || '';
    document.getElementById('ocAge').innerText = character.age ? `${character.age}` : '';
    document.getElementById('ocGender').innerText = character.gender || '';
    document.getElementById('ocHeight').innerText = character.height ? `${character.height}cm` : '';

    const detailMetaTop = document.getElementById('ocDetailMetaTop');
    if (detailMetaTop) {
      detailMetaTop.innerHTML = `<div class="modal-meta-date">${character.description || ''}</div>`;
    }

    const imageWrapper = document.getElementById('ocImageWrapper');
    imageWrapper.innerHTML = '';

    const portraitRaw = character.portrait || '';
    const imgUrl = resolveAssetPath(portraitRaw);

    if (!portraitRaw) {
      const placeholder = document.createElement('div');
      placeholder.className = 'oc-portrait-placeholder text-thumb';
      placeholder.innerHTML = '<span>이미지 준비 중</span>';
      imageWrapper.appendChild(placeholder);
    } else {
      const portraitImg = document.createElement('img');
      portraitImg.className = 'fanworks-modal-content';
      portraitImg.id = 'ocPortrait';
      portraitImg.src = imgUrl;
      portraitImg.alt = '초상화';
      portraitImg.onerror = function() {
        const fallback = document.createElement('div');
        fallback.className = 'oc-portrait-placeholder text-thumb';
        fallback.innerHTML = '<span>이미지 준비 중</span>';
        this.replaceWith(fallback);
      };
      imageWrapper.appendChild(portraitImg);
    }

    const isSensitive = character.rating === 'warning' || character.rating === 'external' || character.sensitive;
    const warningText = character.warningContent ? character.warningContent : '민감한 소재가 포함되어 있습니다.';
    const linkUrl = character.link || (character.rating === 'external' ? character.externalLink : '');

    if (isSensitive && !window.showSensitiveGlobal) {
      const mask = document.createElement('div');
      mask.className = 'oc-full-warning-mask';

      let actionBtnHTML = linkUrl 
        ? `<a href="${linkUrl}" target="_blank" rel="noopener noreferrer" class="btn-dark-long">외부 링크</a>`
        : `<button type="button" id="oc-reveal-btn" class="btn-dark-long">보기</button>`;

      mask.innerHTML = `
        <div class="oc-warning-title">콘텐츠 경고</div>
        <div class="oc-warning-desc">${warningText}</div>
        ${actionBtnHTML}
      `;

      const revealBtn = mask.querySelector('#oc-reveal-btn');
      if (revealBtn) {
        revealBtn.onclick = () => { mask.remove(); };
      }
      imageWrapper.appendChild(mask);
    }

    ocModal.classList.add('active');
  }

  if (closeBtn) {
    closeBtn.onclick = (e) => { e.stopPropagation(); closeOcModal(); };
  }
  ocModal.onclick = (e) => { if (e.target === ocModal) closeOcModal(); };

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && ocModal.classList.contains('active')) closeOcModal();
  });

  const gridContainer = document.querySelector('.ocs-grid');
  if (gridContainer) {
    gridContainer.onclick = (e) => {
      const card = e.target.closest('.open-oc-modal');
      if (!card) return;
      const ocId = parseInt(card.dataset.ocId, 10);
      const targetChar = profilesData.find(p => p.id === ocId);
      if (targetChar) openOcModal(targetChar);
    };
  }
}

async function initOcApp() {
  const isProfileContainer = document.querySelector('.ocs-grid');
  if (!isProfileContainer) return;

  renderHeader();

  try {
    const isPagesFolder = window.location.pathname.includes('pages');
    const jsonPath = isPagesFolder ? '../profiles.json' : 'profiles.json';
    const res = await fetch(jsonPath);
    if (res.ok) {
      profilesData = await res.json();
      profilesData.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

      const showSens = window.showSensitiveGlobal || false;
      const activeOcData = getFilteredAndProcessedData(profilesData);
      isProfileContainer.innerHTML = activeOcData.map(item => createOcCardHTML(item, showSens)).join('');
      initOcLightbox();
    }
  } catch (e) {
    console.error('profiles.json 로드 실패', e);
  }
}

// Fanworks 카드 생성
function createFanworksCardHTML(item, showSensitiveOverride = false) {
  const rawList = (item.images && Array.isArray(item.images) && item.images.length > 0)
    ? item.images
    : (item['thumbnail-image'] ? [item['thumbnail-image']] : []);

  const processedImages = rawList.map(img => resolveAssetPath(img));
  const thumbSrc = processedImages[0] || '';

  const textThumb = item['thumbnail-text'] || '';
  const altText = item.alt || '';
  const dateStr = item.date || '';
  const tags = item.tags || [];

  const isPrivate = item.private;
  const isSensitive = item.rating === 'warning' || item.rating === 'external' || item.sensitive;

  const modalAttrs = `
    data-images='${JSON.stringify(processedImages)}' 
    data-caption="${encodeURIComponent(altText)}" 
    data-date="${encodeURIComponent(dateStr)}" 
    data-tags='${JSON.stringify(tags)}'
    data-sensitive="${isSensitive ? 'true' : 'false'}"
    data-warning="${encodeURIComponent(item.warningContent || '')}"
    data-link="${encodeURIComponent(item.link || '')}"
  `;

  let thumbsHTML = '';
  if (isPrivate) {
    thumbsHTML = `<div class="card-thumb text-thumb private-thumb"><span>비공개</span></div>`;
  } else if (isSensitive && !showSensitiveOverride) {
    thumbsHTML = `<div class="card-thumb text-thumb sensitive-thumb" ${modalAttrs}><span>민감한 콘텐츠</span></div>`;
  } else if (textThumb) {
    thumbsHTML = `<div class="card-thumb text-thumb" ${modalAttrs} role="img" aria-label="${textThumb}"><span>${textThumb}</span></div>`;
  } else if (!thumbSrc) {
    thumbsHTML = `<div class="card-thumb text-thumb placeholder-thumb" ${modalAttrs}><span>이미지 준비 중</span></div>`;
  } else {
    thumbsHTML = `<div class="card-thumb" ${modalAttrs}><img src="${thumbSrc}" alt="" loading="lazy" onerror="this.parentNode.innerHTML='<div class=\\'card-thumb text-thumb placeholder-thumb\\'><span>이미지 준비 중</span></div>';"></div>`;
  }

  return `<article class="card">${thumbsHTML}</article>`;
}

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

  let html = `<button type="button" class="page-arrow" ${currentPage === 1 ? 'disabled' : ''} data-page="${currentPage - 1}">&lt;</button>`;
  for (let i = 1; i <= totalPages; i++) {
    html += `<button type="button" class="page-num ${i === currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
  }
  html += `<button type="button" class="page-arrow" ${currentPage === totalPages ? 'disabled' : ''} data-page="${currentPage + 1}">&gt;</button>`;
  paginationEl.innerHTML = html;

  paginationEl.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const targetPage = parseInt(e.currentTarget.dataset.page, 10);
      if (!isNaN(targetPage)) {
        currentPage = targetPage;
        executeRender();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  });
}

function executeRender() {
  const mainContainer = document.querySelector('.fanworks-grid');
  if (!mainContainer) return;

  let dataList = filteredPosts.length > 0 || window.isFiltered ? filteredPosts : (window.galleryData || []);
  dataList = getSortedData(dataList);

  if (dataList.length === 0) {
    mainContainer.innerHTML = '<p class="empty-grid-message">등록된 데이터가 없습니다.</p>';
    renderPagination(0);
    return;
  }

  const startIndex = (currentPage - 1) * itemsPerPage;
  const slicedData = dataList.slice(startIndex, startIndex + itemsPerPage);

  mainContainer.innerHTML = slicedData.map(item => createFanworksCardHTML(item, window.showSensitiveGlobal)).join('');
  renderPagination(dataList.length);
}

function initLightbox() {
  const gridContainer = document.querySelector('.fanworks-grid');
  if (!gridContainer) return;

  let modal = document.querySelector('.fanworks-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.className = 'fanworks-modal';
    modal.innerHTML = `
      <button type="button" class="modal-close-btn" aria-label="모달 닫기">✕</button>
      <div class="modal-body-container">
        <div class="modal-image-container" id="modalImageWrapper">
          <button type="button" class="modal-arrow modal-prev" aria-label="이전 이미지">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
          </button>
          <img class="fanworks-modal-content" src="" alt="확대 이미지" tabindex="0">
          <button type="button" class="modal-arrow modal-next" aria-label="다음 이미지">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
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

  const modalImg = modal.querySelector('.fanworks-modal-content');
  const captionTextEl = modal.querySelector('.modal-caption-text');
  const modalMetaTop = modal.querySelector('.modal-meta-top');
  const prevBtn = modal.querySelector('.modal-prev');
  const nextBtn = modal.querySelector('.modal-next');
  const closeBtn = modal.querySelector('.modal-close-btn');

  let currentImages = [];
  let currentIndex = 0;

  function updateModalImage(isSensitiveActive = false) {
    if (currentImages.length > 0) {
      modalImg.src = resolveAssetPath(currentImages[currentIndex]);

      if (isSensitiveActive || currentImages.length <= 1) {
        prevBtn.style.display = 'none';
        nextBtn.style.display = 'none';
      } else {
        prevBtn.style.display = (currentIndex === 0) ? 'none' : 'flex';
        nextBtn.style.display = (currentIndex === currentImages.length - 1) ? 'none' : 'flex';
      }
    }
  }

  function openModal() {
    updateScrollbarWidth();
    modal.classList.add('active');
  }

  function closeModal() {
    modal.classList.remove('active');
    const existingMask = modal.querySelector('.oc-full-warning-mask');
    if (existingMask) existingMask.remove();
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
      const isSensitive = thumbContainer.getAttribute('data-sensitive') === 'true';
      const warningContent = decodeURIComponent(thumbContainer.getAttribute('data-warning') || '');
      const linkUrl = decodeURIComponent(thumbContainer.getAttribute('data-link') || '');

      if (currentImages.length > 0) {
        currentIndex = 0;
        const existingMask = modal.querySelector('.oc-full-warning-mask');
        if (existingMask) existingMask.remove();

        modalImg.style.display = 'block';
        updateModalImage(false);

        if (isSensitive && !window.showSensitiveGlobal) {
          updateModalImage(true);
          const mask = document.createElement('div');
          mask.className = 'oc-full-warning-mask';

          const displayText = warningContent ? warningContent : '민감한 콘텐츠';
          let actionBtnHTML = linkUrl 
            ? `<a href="${linkUrl}" target="_blank" rel="noopener noreferrer" class="btn-dark-long">외부 링크</a>`
            : `<button type="button" class="fanwork-reveal-btn btn-dark-long">보기</button>`;

          mask.innerHTML = `
            <div class="oc-warning-title">콘텐츠 경고</div>
            <div class="oc-warning-desc">${displayText}</div>
            ${actionBtnHTML}
          `;

          const revealBtn = mask.querySelector('.fanwork-reveal-btn');
          if (revealBtn) {
            revealBtn.onclick = () => { updateModalImage(false); mask.remove(); };
          }
          modal.appendChild(mask);
        }

        modalMetaTop.innerHTML = `
          <div class="modal-meta-date">${currentDate || '날짜 없음'}</div>
          <div class="modal-meta-tags">${currentTags.length > 0 ? currentTags.map(t => `#${t}`).join(' ') : '태그 없음'}</div>
          <div class="modal-meta-pages">${currentImages.length}쪽</div>
        `;

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

  prevBtn.onclick = (e) => { e.stopPropagation(); if (currentImages.length > 1 && currentIndex > 0) { currentIndex--; updateModalImage(false); } };
  nextBtn.onclick = (e) => { e.stopPropagation(); if (currentImages.length > 1 && currentIndex < currentImages.length - 1) { currentIndex++; updateModalImage(false); } };
  closeBtn.onclick = (e) => { e.stopPropagation(); closeModal(); };
  modal.onclick = (e) => { if (e.target === modal) closeModal(); };

  document.addEventListener('keydown', (e) => {
    if (!modal.classList.contains('active')) return;
    if (e.key === 'Escape') closeModal();
    else if (e.key === 'ArrowLeft' && currentImages.length > 1 && currentIndex > 0) { currentIndex--; updateModalImage(false); }
    else if (e.key === 'ArrowRight' && currentImages.length > 1 && currentIndex < currentImages.length - 1) { currentIndex++; updateModalImage(false); }
  });
}

async function initApp() {
  const isProfileContainer = document.querySelector('.ocs-grid');
  const isFanworksContainer = document.querySelector('.fanworks-grid');

  if (isProfileContainer) {
    await initOcApp();
    return;
  }

  if (!isFanworksContainer) {
    return;
  }

  if (isAppInitialized) return;
  isAppInitialized = true;

  renderHeader();

  const isPagesFolder = window.location.pathname.includes('pages');
  const jsonPath = isPagesFolder ? '../fanworks.json' : 'fanworks.json';

  try {
    const response = await fetch(jsonPath);
    if (response.ok) {
      const data = await response.json();
      window.galleryData = getFilteredAndProcessedData(data);
    }
  } catch (e) {
    console.error('fanworks.json 로드 실패', e);
  }

  window.showSensitiveGlobal = false;

  tagFilterModal = new TagFilterModal((activeFilters, options) => {
    window.isFiltered = true;
    window.showSensitiveGlobal = options.showSensitive || false;

    filteredPosts = getFilteredAndProcessedData(window.galleryData, activeFilters);
    currentPage = 1;
    executeRender();
  }, {});

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