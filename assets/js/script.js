// assets/js/script.js
import { TagFilterModal } from './filterModal.js';

let allPosts = [];
let filteredPosts = [];
let currentPage = 1;
const itemsPerPage = 12;
let tagFilterModal = null;
let profilesData = [];

function getResizedImageUrl(src, targetWidth = 400) {
  if (!src) return '';
  if (src.startsWith('http') || src.startsWith('/') || src.startsWith('../') || src.startsWith('data:')) {
    return src;
  }
  if (window.location.pathname.includes('/pages/') && src.startsWith('assets/')) {
    return '../' + src;
  }
  return src;
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
  const mainGrid = document.querySelector('.grid-cols-4, .grid-cols-5, .grid-cols-3');

  if (headerEl && mainGrid && !document.querySelector('.controls-wrapper')) {
    const controlsWrapper = document.createElement('div');
    controlsWrapper.className = 'controls-wrapper';
    controlsWrapper.style.display = 'flex';
    controlsWrapper.style.justifyContent = 'flex-end';
    controlsWrapper.style.alignItems = 'center';
    controlsWrapper.style.marginBottom = '1.5rem';

    controlsWrapper.innerHTML = `<button type="button" id="open-filter-modal-btn" class="dark-btn">필터</button>`;
    headerEl.insertAdjacentElement('afterend', controlsWrapper);

    document.getElementById('open-filter-modal-btn').addEventListener('click', () => {
      if (tagFilterModal) tagFilterModal.open();
    });
  }
}

// OCs 카드 HTML 생성
function createOcCardHTML(item, showSensitiveOverride = false) {
  const isPrivate = item.private;
  const isSensitive = item.rating === 'warning' || item.rating === 'external' || item.sensitive;
  const rawSrc = item.thumbnail || item.portrait || '';
  const thumbSrc = getResizedImageUrl(rawSrc, 300);

  let thumbsHTML = '';
  if (isPrivate) {
    thumbsHTML = `
      <div class="card-thumb text-thumb" style="background: #333; border: 1px solid rgba(255, 255, 255, 0.15); color: #fff; aspect-ratio: 1/1; display: flex; align-items: center; justify-content: center; font-weight: 600;">
        <span>비공개</span>
      </div>
    `;
  } else if (isSensitive && !showSensitiveOverride) {
    const warningText = '민감한 콘텐츠';
    thumbsHTML = `
      <div class="card-thumb" style="position: relative; aspect-ratio: 1/1; overflow: hidden;">
        ${thumbSrc ? `<img src="${thumbSrc}" alt="" loading="lazy" style="width: 100%; height: 100%; object-fit: cover; filter: blur(30px); transform: scale(1.1);" onerror="this.style.display='none';">` : ''}
        <div style="position: absolute; inset: 0; background: #333; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 1rem; text-align: center; color: #ccc;">
          <div style="font-size: 0.9rem; opacity: 0.95; word-break: keep-all; font-weight: 500;">${warningText}</div>
        </div>
      </div>
    `;
  } else if (!thumbSrc) {
    thumbsHTML = `
      <div class="card-thumb text-thumb" style="background: #eee; color: #888; aspect-ratio: 1/1; display: flex; align-items: center; justify-content: center; font-size: 0.9rem; text-align: center;">
        <span>이미지 준비 중</span>
      </div>
    `;
  } else {
    thumbsHTML = `
      <div class="card-thumb">
        <img src="${thumbSrc}" alt="${item.name || ''}" loading="lazy" onerror="this.parentNode.innerHTML='<div class=\\'card-thumb text-thumb\\' style=\\'background:#eee;color:#888;aspect-ratio:1/1;display:flex;align-items:center;justify-content:center;font-size:0.75rem;\\'>이미지 준비 중</div>';">
      </div>
    `;
  }

  return `
    <article class="card open-oc-modal" data-oc-id="${item.id}">
      ${thumbsHTML}
    </article>
  `;
}

function initOcLightbox() {
  let ocModal = document.querySelector('.oc-modal');
  if (!ocModal) {
    ocModal = document.createElement('div');
    ocModal.className = 'oc-modal fanworks-modal';
    ocModal.innerHTML = `
      <button type="button" class="modal-close-btn" aria-label="닫기">✕</button>
      <div class="modal-body-container">
        <div class="modal-image-container" id="ocImageWrapper">
          <!-- 캐릭터 이름과 정보를 이미지 위 왼쪽 상단으로 더 바짝 끌어올림 -->
          <div class="oc-modal-basic-info" style="top: 24px; left: 15px;">
            <div class="oc-info-name" id="ocName"></div>
            <div class="oc-info-foreign-name" id="ocForeignName"></div>
            <div class="oc-info-title" id="ocTitle"></div>
            <div class="oc-info-stats">
              <span id="ocAge"></span>
              <span id="ocGender"></span>
              <span id="ocHeight"></span>
            </div>
          </div>
          <img class="fanworks-modal-content" id="ocPortrait" src="" alt="초상화">
        </div>
        <div class="modal-caption-container" style="padding-top: 24px;">
          <div class="modal-meta-top" id="ocDetailMetaTop"></div>
          <p class="modal-caption-text" id="ocDetailText"></p>
        </div>
      </div>
    `;
    document.body.appendChild(ocModal);
  }

  const closeBtn = ocModal.querySelector('.modal-close-btn');

  function openOcModal(character) {
    document.getElementById('ocName').innerText = character.name || '';
    document.getElementById('ocForeignName').innerText = character.foreignName || '';
    document.getElementById('ocTitle').innerText = character.title || '';
    document.getElementById('ocAge').innerText = character.age ? `${character.age}` : '';
    document.getElementById('ocGender').innerText = character.gender || '';
    document.getElementById('ocHeight').innerText = character.height ? `${character.height}cm` : '';
    
    const detailMetaTop = document.getElementById('ocDetailMetaTop');
    if (detailMetaTop) {
      detailMetaTop.innerHTML = `<div class="modal-meta-date" style="white-space: pre-wrap; word-break: break-all;">${character.description || ''}</div>`;
    }

    const portraitImg = document.getElementById('ocPortrait');
    const existingMask = ocModal.querySelector('.oc-full-warning-mask');
    if (existingMask) existingMask.remove();

    const imgUrl = getResizedImageUrl(character.portrait || character.thumbnail || '', 800);
    if (portraitImg) {
      portraitImg.style.display = 'block';
      portraitImg.src = imgUrl;
    }

    const isSensitive = character.rating === 'warning' || character.rating === 'external' || character.sensitive;
    const warningText = character.warningContent ? character.warningContent : '민감한 소재가 포함되어 있습니다.';
    const linkUrl = character.link || (character.rating === 'external' ? character.externalLink : '');

    if (isSensitive && !window.showSensitiveGlobal) {
      const mask = document.createElement('div');
      mask.className = 'oc-full-warning-mask';
      mask.style.cssText = 'position: absolute; inset: 0; width: 100%; height: 100%; background: rgba(10, 10, 10, 0.98); color: #ffffff; z-index: 10005; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 14px; padding: 2rem; text-align: center; box-sizing: border-box;';

      let actionBtnHTML = '';
      if (linkUrl) {
        actionBtnHTML = `<a href="${linkUrl}" target="_blank" rel="noopener noreferrer" class="oc-warning-action-btn">외부 링크</a>`;
      } else {
        actionBtnHTML = `<button type="button" class="oc-reveal-btn oc-warning-action-btn">보기</button>`;
      }

      mask.innerHTML = `
        <div class="oc-warning-title">콘텐츠 경고</div>
        <div class="oc-warning-desc">${warningText}</div>
        ${actionBtnHTML}
      `;

      const revealBtn = mask.querySelector('.oc-reveal-btn');
      if (revealBtn) {
        revealBtn.onclick = () => {
          mask.remove();
        };
      }

      ocModal.appendChild(mask);
    }

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
  
  ocModal.onclick = (e) => {
    if (e.target === ocModal) {
      closeOcModal();
    }
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
        profilesData.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

        isProfilePage.classList.add('crop-square');
        const showSens = window.showSensitiveGlobal || false;
        
        const activeOcData = getFilteredAndProcessedData(profilesData);
        isProfilePage.innerHTML = activeOcData.map(item => createOcCardHTML(item, showSens)).join('');
        initOcLightbox();
      }
    } catch (e) {
      console.error('profiles.json 로드 실패', e);
    }
  }
}

// Fanworks 카드 HTML 생성
function createCardHTML(item, isPagesFolder, showSensitiveOverride = false) {
  let thumbSrc = '';
  if (item.images && Array.isArray(item.images) && item.images.length > 0) {
    thumbSrc = item.images[0];
  } else {
    thumbSrc = item['thumbnail-image'] || '';
  }
  thumbSrc = getResizedImageUrl(thumbSrc, 400);

  const textThumb = item['thumbnail-text'] || '';
  const altText = item.alt || '';
  const dateStr = item.date || '';
  const tags = item.tags || [];

  const isPrivate = item.private;
  const isSensitive = item.rating === 'warning' || item.rating === 'external' || item.sensitive;

  if (isPagesFolder) {
    if (thumbSrc && !thumbSrc.startsWith('../') && !thumbSrc.startsWith('http')) {
      thumbSrc = '../' + thumbSrc;
    }
  }

  let rawImages = (item.images && Array.isArray(item.images) && item.images.length > 0) ? item.images : [thumbSrc];
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
    data-sensitive="${isSensitive ? 'true' : 'false'}"
    data-warning="${encodeURIComponent(item.warningContent || '')}"
    data-link="${encodeURIComponent(item.link || '')}"
  `;

  let thumbsHTML = '';
  if (isPrivate) {
    thumbsHTML = `
      <div class="card-thumb text-thumb" style="background: #333; border: 1px solid rgba(255, 255, 255, 0.15); color: #fff; aspect-ratio: 1/1; display: flex; align-items: center; justify-content: center; font-weight: 600;">
        <span>비공개</span>
      </div>
    `;
  } else if (isSensitive && !showSensitiveOverride) {
    const warningText = '민감한 콘텐츠';
    thumbsHTML = `
      <div class="card-thumb" ${modalAttrs} style="position: relative; aspect-ratio: 1/1; overflow: hidden; cursor: pointer;">
        ${processedImages[0] ? `<img src="${processedImages[0]}" alt="" loading="lazy" style="width: 100%; height: 100%; object-fit: cover; filter: blur(30px); transform: scale(1.1);">` : ''}
        <div style="position: absolute; inset: 0; background: #333; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 1rem; text-align: center; color: #ccc;">
          <div style="font-size: 0.9rem; opacity: 0.95; word-break: keep-all; font-weight: 500;">${warningText}</div>
        </div>
      </div>
    `;
  } else if (textThumb) {
    thumbsHTML = `
      <div class="card-thumb text-thumb" ${modalAttrs} role="img" aria-label="${textThumb}" style="cursor: pointer;">
        <span>${textThumb}</span>
      </div>
    `;
  } else if (!processedImages[0]) {
    thumbsHTML = `
      <div class="card-thumb text-thumb" ${modalAttrs} style="background: #eee; color: #888; aspect-ratio: 1/1; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; cursor: pointer;">
        <span>이미지 준비 중</span>
      </div>
    `;
  } else {
    thumbsHTML = `
      <div class="card-thumb" ${modalAttrs} style="cursor: pointer;">
        <img src="${processedImages[0]}" alt="" loading="lazy" srcset="${processedImages[0]} 400w" sizes="(max-width: 600px) 100vw, 400px" onerror="this.parentNode.innerHTML='<div class=\\'card-thumb text-thumb\\' style=\\'background:#eee;color:#888;aspect-ratio:1/1;display:flex;align-items:center;justify-content:center;font-size:0.75rem;\\'>이미지 준비 중</div>';">
      </div>
    `;
  }

  return `
    <article class="card">
      ${thumbsHTML}
    </article>
  `;
}

// 총 페이지수가 1이어도 페이지네이션이 상시 표시되도록 수정
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
    
    mainContainer.innerHTML = slicedData.map(item => createCardHTML(item, isPagesFolder, window.showSensitiveGlobal)).join('');
    renderPagination(dataList.length);
  }
}

// Fanworks 라이트박스 모달
function initLightbox() {
  const gridContainer = document.querySelector('.grid-cols-4, .grid-cols-5');
  if (!gridContainer) return;

  let modal = document.querySelector('.fanworks-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.className = 'fanworks-modal';
    modal.innerHTML = `
      <button type="button" class="modal-close-btn" aria-label="모달 닫기">✕</button>
      <div class="modal-body-container">
        <div class="modal-image-container" id="modalImageWrapper" style="position:relative;">
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
      modalImg.src = getResizedImageUrl(currentImages[currentIndex], 1200);
      
      if (isSensitiveActive || currentImages.length <= 1) {
        prevBtn.style.display = 'none';
        nextBtn.style.display = 'none';
      } else {
        // 첫 페이지(0)에서는 왼쪽(이전) 화살표 숨김, 오른쪽(다음) 화살표 표시
        // 마지막 페이지에서는 왼쪽(이전) 화살표 표시, 오른쪽(다음) 화살표 숨김
        prevBtn.style.display = (currentIndex === 0) ? 'none' : 'flex';
        nextBtn.style.display = (currentIndex === currentImages.length - 1) ? 'none' : 'flex';
      }
    }
  }

  function openModal() {
    modal.classList.add('active');
    document.body.classList.add('modal-open');
  }

  function closeModal() {
    modal.classList.remove('active');
    document.body.classList.remove('modal-open');
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
          updateModalImage(true); // 경고 레이어가 뜰 때는 화살표 숨김

          const mask = document.createElement('div');
          mask.className = 'oc-full-warning-mask';
          mask.style.cssText = 'position: absolute; inset: 0; width: 100%; height: 100%; background: rgba(10, 10, 10, 0.98); color: #ffffff; z-index: 10005; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 14px; padding: 2rem; text-align: center; box-sizing: border-box;';

          const displayText = warningContent ? warningContent : '민감한 콘텐츠';
          let actionBtnHTML = '';

          if (linkUrl) {
            actionBtnHTML = `<a href="${linkUrl}" target="_blank" rel="noopener noreferrer" class="oc-warning-action-btn">외부 링크</a>`;
          } else {
            actionBtnHTML = `<button type="button" class="fanwork-reveal-btn oc-warning-action-btn">보기</button>`;
          }

          mask.innerHTML = `
            <div class="oc-warning-title">콘텐츠 경고</div>
            <div class="oc-warning-desc">${displayText}</div>
            ${actionBtnHTML}
          `;

          const revealBtn = mask.querySelector('.fanwork-reveal-btn');
          if (revealBtn) {
            revealBtn.onclick = () => {
              updateModalImage(false);
              mask.remove();
            };
          }

          modal.appendChild(mask);
        }

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
      updateModalImage(false);
    }
  };

  nextBtn.onclick = (e) => {
    e.stopPropagation();
    if (currentImages.length > 1 && currentIndex < currentImages.length - 1) {
      currentIndex++;
      updateModalImage(false);
    }
  };

  closeBtn.onclick = (e) => {
    e.stopPropagation();
    closeModal();
  };

  modal.onclick = (e) => {
    if (e.target === modal) {
      closeModal();
    }
  };
}

// 메인 애플리케이션 초기화
async function initApp() {
  const isProfilePage = document.querySelector('.grid-cols-5');
  if (isProfilePage) {
    await initOcApp();
  }

  renderHeader();

  const isPagesFolder = window.location.pathname.includes('/pages/');
  const jsonPath = isProfilePage 
    ? (isPagesFolder ? '../profiles.json' : 'profiles.json')
    : (isPagesFolder ? '../fanworks.json' : 'fanworks.json');

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

  tagFilterModal = new TagFilterModal((activeFilters, options) => {
    window.isFiltered = true;
    window.showSensitiveGlobal = options.showSensitive || false;

    if (isProfilePage) {
      const mainContainer = document.querySelector('.grid-cols-5');
      if (mainContainer) {
        const processedOcData = getFilteredAndProcessedData(profilesData, activeFilters);
        mainContainer.innerHTML = processedOcData.map(item => createOcCardHTML(item, window.showSensitiveGlobal)).join('');
      }
    } else {
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