// assets/js/script.js
import { TagFilterModal } from './filterModal.js';

let allPosts = [];
let filteredPosts = [];
let currentPage = 1;
const itemsPerPage = 12;
let tagFilterModal = null;
let profilesData = [];

// [공통 유틸리티] 이미지 리사이징 경로 처리 (상대 경로 및 IPFS 해시 경로 예외 처리 보완)
function getResizedImageUrl(src, targetWidth = 400) {
  if (!src) return '';
  // 외부 URL, 절대 경로, 혹은 이미 올바른 상대 경로(`../` 등)인 경우 그대로 반환
  if (src.startsWith('http') || src.startsWith('/') || src.startsWith('../') || src.startsWith('data:')) {
    return src;
  }
  // 만약 pages/ 하위 폴더에서 실행 중인데 경로가 assets/...로 시작한다면 상위 폴더 경로 보정
  if (window.location.pathname.includes('/pages/') && src.startsWith('assets/')) {
    return '../' + src;
  }
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

// 1. 헤더 및 필터 열기 버튼 (컨테이너 오른쪽 정렬)
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

    controlsWrapper.innerHTML = `
      <button type="button" id="open-filter-modal-btn" class="filter-open-btn">필터</button>
    `;
    headerEl.insertAdjacentElement('afterend', controlsWrapper);

    document.getElementById('open-filter-modal-btn').addEventListener('click', () => {
      if (tagFilterModal) tagFilterModal.open();
    });
  }
}

// 2. OCs 카드 HTML 생성 (뒤에 이미지가 존재함을 인지할 수 있는 글라스모피즘 썸네일 적용)
function createOcCardHTML(item, showSensitiveOverride = false) {
  const isPrivate = item.private;
  const isSensitive = item.rating === 'warning' || item.rating === 'external' || item.sensitive;
  const thumbSrc = getResizedImageUrl(item.thumbnail || item.portrait || '', 300);

  let thumbsHTML = '';
  let cardClasses = "card open-oc-modal";
  let datasetAttr = `data-oc-id="${item.id}"`;

  if (isPrivate) {
    thumbsHTML = `
      <div class="card-thumb text-thumb" style="background: rgba(40, 40, 40, 0.55); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.15); color: #fff; aspect-ratio: 1/1; display: flex; align-items: center; justify-content: center; font-weight: 600;">
        <span>비공개</span>
      </div>
    `;
  } else if (isSensitive && !showSensitiveOverride) {
    const warningText = item.warningContent ? item.warningContent : '민감한 콘텐츠';
    thumbsHTML = `
      <div class="card-thumb" style="position: relative; aspect-ratio: 1/1; overflow: hidden;">
        <img src="${thumbSrc}" alt="" loading="lazy" style="width: 100%; height: 100%; object-fit: cover; filter: blur(14px); transform: scale(1.1);" onerror="this.style.display='none';">
        <div style="position: absolute; inset: 0; background: rgba(30, 30, 30, 0.45); backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px); display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 1rem; text-align: center; color: #fff;">
          <div style="font-size: 0.9rem; opacity: 0.95; word-break: keep-all; font-weight: 500;">${warningText}</div>
        </div>
      </div>
    `;
  } else {
    thumbsHTML = `
      <div class="card-thumb">
        <img src="${thumbSrc}" alt="${item.name || ''}" loading="lazy" onerror="this.style.display='none';">
      </div>
    `;
  }

  return `
    <article class="${cardClasses}" ${datasetAttr}>
      ${thumbsHTML}
    </article>
  `;
}

// 3. OCs 모달 초기화 (1열 이미지 영역에만 글라스모피즘 가림막 및 보기/외부링크 버튼 적용)
function initOcLightbox() {
  let ocModal = document.querySelector('.oc-modal');
  if (!ocModal) {
    ocModal = document.createElement('div');
    ocModal.className = 'oc-modal';
    ocModal.innerHTML = `
      <button type="button" class="modal-close-btn" aria-label="닫기">✕</button>
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
          <div id="ocPortraitContainer" style="width:100%; height:100%; display:flex; align-items:center; justify-content:center; position:relative;">
            <img class="oc-modal-portrait" id="ocPortrait" src="" alt="초상화">
          </div>
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

  const closeBtn = ocModal.querySelector('.modal-close-btn');

  function openOcModal(character) {
    document.getElementById('ocName').innerText = character.name || '';
    document.getElementById('ocForeignName').innerText = character.foreignName || '';
    document.getElementById('ocTitle').innerText = character.title || '';
    document.getElementById('ocAge').innerText = character.age ? `${character.age}` : '';
    document.getElementById('ocGender').innerText = character.gender || '';
    document.getElementById('ocHeight').innerText = character.height ? `${character.height}cm` : '';
    document.getElementById('ocDetailText').innerText = character.description || '';

    const portraitImg = document.getElementById('ocPortrait');
    const portraitContainer = document.getElementById('ocPortraitContainer');
    
    // 기존 1열 가림막 제거
    const existingMask = portraitContainer.querySelector('.oc-glass-mask');
    if (existingMask) existingMask.remove();

    const isSensitive = character.rating === 'warning' || character.rating === 'external' || character.sensitive;
    const warningText = character.warningContent ? character.warningContent : '민감한 콘텐츠';
    const linkUrl = character.link || (character.rating === 'external' ? character.externalLink : '');

    if (isSensitive && !window.showSensitiveGlobal) {
      portraitImg.style.display = 'none';

      // 모달 바디(.oc-modal-body) 위에 스티커처럼 얹는 1열짜리 오버레이 층
      const modalBody = ocModal.querySelector('.oc-modal-body');
      const mask = document.createElement('div');
      mask.className = 'oc-glass-mask';
      mask.style.cssText = `
        position: absolute; inset: 0; display: flex; flex-direction: column;
        align-items: center; justify-content: center; gap: 14px; text-align: center;
        background: rgba(20, 20, 20, 0.75); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
        color: #fff; z-index: 100; border-radius: inherit; box-sizing: border-box; padding: 2rem;
      `;
      modalBody.style.position = 'relative';
      modalBody.appendChild(mask);

      let actionBtnHTML = '';
      if (linkUrl) {
        actionBtnHTML = `<a href="${linkUrl}" target="_blank" rel="noopener noreferrer" style="padding: 6px 16px; background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.3); color: #fff; border-radius: 6px; text-decoration: none; font-size: 0.85rem;">외부 링크</a>`;
      } else {
        actionBtnHTML = `<button type="button" class="oc-reveal-btn" style="padding: 6px 16px; background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.3); color: #fff; border-radius: 6px; cursor: pointer; font-size: 0.85rem;">보기</button>`;
      }

      mask.innerHTML = `
        <div style="font-size: 0.9rem; opacity: 0.9; word-break: keep-all;">${warningText}</div>
        ${actionBtnHTML}
      `;

      const revealBtn = mask.querySelector('.oc-reveal-btn');
      if (revealBtn) {
        revealBtn.onclick = () => {
          portraitImg.style.display = 'block';
          portraitImg.src = getResizedImageUrl(character.portrait || character.thumbnail || '', 800);
          mask.remove();
        };
      }

      portraitContainer.appendChild(mask);
    } else {
      portraitImg.style.display = 'block';
      portraitImg.src = getResizedImageUrl(character.portrait || character.thumbnail || '', 800);
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
  
// 모달 바깥 배경(여백)을 클릭했을 때만 닫기 (내부 버튼 클릭 예외 처리)
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

// 4. Fanworks 카드 HTML 생성 (뒤에 이미지가 흐릿하게 보이는 글라스모피즘 썸네일 적용)
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
      <div class="card-thumb text-thumb" style="background: rgba(40, 40, 40, 0.55); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.15); color: #fff; aspect-ratio: 1/1; display: flex; align-items: center; justify-content: center; font-weight: 600;">
        <span>비공개</span>
      </div>
    `;
  } else if (isSensitive && !showSensitiveOverride) {
    const warningText = item.warningContent ? item.warningContent : '민감한 콘텐츠';
    thumbsHTML = `
      <div class="card-thumb" ${modalAttrs} style="position: relative; aspect-ratio: 1/1; overflow: hidden; cursor: pointer;">
        <img src="${processedImages[0]}" alt="" loading="lazy" style="width: 100%; height: 100%; object-fit: cover; filter: blur(14px); transform: scale(1.1);">
        <div style="position: absolute; inset: 0; background: rgba(30, 30, 30, 0.45); backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px); display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 1rem; text-align: center; color: #fff;">
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
  } else {
    thumbsHTML = `
      <div class="card-thumb" ${modalAttrs} style="cursor: pointer;">
        <img src="${processedImages[0]}" alt="" loading="lazy" srcset="${processedImages[0]} 400w" sizes="(max-width: 600px) 100vw, 400px">
      </div>
    `;
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

// 7. Fanworks 라이트박스 모달 (1열 이미지 영역에만 가림막 및 보기/외부링크 버튼 적용)
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
        <div class="modal-image-container" id="modalImageWrapper" style="position:relative;">
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
      const isSensitive = thumbContainer.getAttribute('data-sensitive') === 'true';
      const warningContent = decodeURIComponent(thumbContainer.getAttribute('data-warning') || '');
      const linkUrl = decodeURIComponent(thumbContainer.getAttribute('data-link') || '');

      if (currentImages.length > 0) {
        currentIndex = 0;
        
        const imgContainer = document.getElementById('modalImageWrapper');
        const existingMask = imgContainer.querySelector('.fanwork-glass-mask');
        if (existingMask) existingMask.remove();

        if (isSensitive && !window.showSensitiveGlobal) {
          modalImg.style.display = 'none';

          const mask = document.createElement('div');
          mask.className = 'fanwork-glass-mask';
          mask.style.cssText = `
            position: absolute; inset: 0; display: flex; flex-direction: column;
            align-items: center; justify-content: center; gap: 12px; padding: 1rem; text-align: center;
            background: rgba(30, 30, 30, 0.55); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
            color: #fff; z-index: 10; width: 100%; height: 100%; box-sizing: border-box;
          `;

          const displayText = warningContent ? warningContent : '민감한 콘텐츠';
          let actionBtnHTML = '';

          if (linkUrl) {
            actionBtnHTML = `<a href="${linkUrl}" target="_blank" rel="noopener noreferrer" style="padding: 6px 16px; background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.3); color: #fff; border-radius: 6px; text-decoration: none; font-size: 0.85rem;">외부 링크</a>`;
          } else {
            actionBtnHTML = `<button type="button" class="fanwork-reveal-btn" style="padding: 6px 16px; background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.3); color: #fff; border-radius: 6px; cursor: pointer; font-size: 0.85rem;">보기</button>`;
          }

          mask.innerHTML = `
            <div style="font-size: 0.95rem; opacity: 0.9; word-break: keep-all;">${displayText}</div>
            ${actionBtnHTML}
          `;

          const revealBtn = mask.querySelector('.fanwork-reveal-btn');
          if (revealBtn) {
            revealBtn.onclick = () => {
              modalImg.style.display = 'block';
              updateModalImage();
              mask.remove();
            };
          }

          imgContainer.appendChild(mask);
        } else {
          modalImg.style.display = 'block';
          updateModalImage();
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

  // 모달 바깥 배경(여백)을 클릭했을 때만 닫기 (내부 버튼 클릭 예외 처리)
  Modal.onclick = (e) => {
    if (e.target === ocModal) {
      closeOcModal();
    }
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