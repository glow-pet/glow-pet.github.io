// assets/js/script.js

// 1. 헤더 설명 및 정렬 드롭다운 렌더링
function renderHeader() {
  const containerEl = document.querySelector('.container');
  const headerEl = document.querySelector('.header');
  const headerDescEl = document.querySelector('.header-desc');
  const headerInfos = window.headerInfos || [];
  
  if (headerDescEl && headerInfos.length > 0) {
    headerDescEl.innerHTML = headerInfos.join('<br>');
  }

  const mainGrid = document.querySelector('.grid-cols-4, .grid-cols-5, .grid-cols-3');
  if (containerEl && headerEl && mainGrid && !document.querySelector('.sort-dropdown-wrapper')) {
    const sortWrapper = document.createElement('div');
    sortWrapper.className = 'sort-dropdown-wrapper';
    sortWrapper.innerHTML = `
      <select id="sort-select" class="sort-select" aria-label="카드 정렬 기준">
        <option value="created">생성순</option>
        <option value="date">날짜순</option>
        <option value="count">콘텐츠 수량 순</option>
      </select>
    `;
    headerEl.insertAdjacentElement('afterend', sortWrapper);

    const selectEl = sortWrapper.querySelector('#sort-select');
    selectEl.addEventListener('change', (e) => {
      window.currentSortMode = e.target.value;
      currentDisplayLimit = itemsPerBatch; 
      executeRender(true); 
    });
  }
}

// 2. 공통 카드 HTML 생성 헬퍼 함수
// 수정 후
// 수정 후
function createCardHTML(item, isPagesFolder) {
  let rawImages = item.images || item.image || item.src || item.img || [];
  let rawList = Array.isArray(rawImages) ? rawImages : [rawImages];
  
  // 객체 또는 문자열 형태의 콘텐츠 안전하게 추출
  let imgList = rawList.map(itemObj => {
    if (typeof itemObj === 'object' && itemObj !== null) {
      return itemObj.path || itemObj.content || '';
    }
    return itemObj;
  }).filter(val => val !== '');

  let linkSrc = item.link || '';
  const caption = item.caption || '';
  const dateStr = item.date || item.uploadDate || item.created || '';
  const tags = item.tags || [];

  if (isPagesFolder) {
    imgList = imgList.map(imgVal => {
      const isImagePath = typeof imgVal === 'string' && (imgVal.includes('/') || imgVal.includes('.'));
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
  
  // 1. 이미지/텍스트가 없는 경우
  if (totalCount === 0) {
    thumbsHTML = `
      <div class="card-thumb text-thumb" role="img" aria-label="콘텐츠 없음">
        <span>No Image</span>
      </div>
    `;
  } 
  // 2. 첫 번째 콘텐츠가 텍스트인 경우
  else if (typeof imgList[0] === 'string' && !imgList[0].includes('/') && !imgList[0].includes('.')) {
    const textVal = imgList[0];
    thumbsHTML = `
      <div class="card-thumb text-thumb" role="img" aria-label="${textVal}">
        <span>${textVal}</span>
      </div>
    `;
  } 
  // 3. 이미지인 경우
  else {
    let firstImgVal = item.thumbnail || imgList[0];
    if (isPagesFolder && firstImgVal && !firstImgVal.startsWith('../') && !firstImgVal.startsWith('http')) {
      firstImgVal = '../' + firstImgVal;
    }

    const badgeHTML = (totalCount > 1) ? `<div class="image-count-badge">${totalCount}p</div>` : '';
    
    // 링크 유무에 따라 모달용 속성 부여 여부 결정
    const modalAttrs = !linkSrc ? `data-images='${JSON.stringify(isPagesFolder ? imgList : rawList)}' data-caption="${encodeURIComponent(caption)}"` : '';

    thumbsHTML = `
      <div class="card-thumb ${!linkSrc ? 'open-modal-thumb' : ''}" ${modalAttrs}>
        ${badgeHTML}
        <img src="${encodeURI(firstImgVal)}" 
             alt="${caption || ''}" 
             loading="lazy" 
             onerror="this.style.display='none';">
      </div>
    `;
  }

  // 링크가 존재하면 썸네일 영역만 <a> 태그로 감쌈
  if (linkSrc) {
    const isExternal = linkSrc.startsWith('http') || linkSrc.startsWith('https');
    const targetAttr = isExternal ? 'target="_blank" rel="noopener noreferrer"' : '';
    thumbsHTML = `<a href="${linkSrc}" class="card-thumb-link" ${targetAttr}>${thumbsHTML}</a>`;
  }

  // 태그 뱃지 생성
  const tagsHtml = tags.length > 0 
    ? `<div class="card-tags">${tags.map(tag => `<span class="tag-badge">${tag}</span>`).join('')}</div>` 
    : '';

  // 캡션 및 날짜 정보 영역
  const infoHTML = `
    <div class="card-info">
      ${tagsHtml}
      ${caption ? `<p class="card-info-item">${caption}</p>` : ''}
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

let currentDisplayLimit = 12; 
const itemsPerBatch = 12;     
window.currentSortMode = 'created';

function getSortedData(dataArray) {
  if (!Array.isArray(dataArray)) return [];
  const list = [...dataArray];

  if (window.currentSortMode === 'date') {
    return list.sort((a, b) => new Date(b.date || b.uploadDate || 0) - new Date(a.date || a.uploadDate || 0));
  } else if (window.currentSortMode === 'count') {
    return list.sort((a, b) => {
      const getCount = (item) => {
        const raw = item.images || item.image || item.src || item.img || [];
        return Array.isArray(raw) ? raw.length : (raw ? 1 : 0);
      };
      return getCount(b) - getCount(a);
    });
  }
  return list;
}

// '더보기' 버튼을 컨테이너 내부(푸터 위)에 생성하도록 수정
function setupInfiniteScroll(totalItems) {
  const containerEl = document.querySelector('.container');
  if (!containerEl) return;

  let loadMoreWrapper = containerEl.querySelector('.load-more-wrapper');

  if (!loadMoreWrapper) {
    loadMoreWrapper = document.createElement('div');
    loadMoreWrapper.className = 'load-more-wrapper';
    loadMoreWrapper.innerHTML = `
      <button id="load-more-btn" class="load-more-btn" aria-label="콘텐츠 더보기">
        <span>더보기</span>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
      </button>
    `;
    containerEl.appendChild(loadMoreWrapper);

    document.getElementById('load-more-btn').addEventListener('click', () => {
      currentDisplayLimit += itemsPerBatch;
      executeRender(false);
    });
  }

  const btn = document.getElementById('load-more-btn');
  if (btn) {
    if (currentDisplayLimit >= totalItems) {
      btn.style.display = 'none';
    } else {
      btn.style.display = 'inline-flex';
    }
  }
}

function executeRender(isReset = false) {
  const mainContainer = document.querySelector('.grid-cols-4, .grid-cols-5');
  const subContainer = document.querySelector('.grid-cols-3');
  const isPagesFolder = window.location.pathname.includes('/pages/');

  if (isReset) {
    currentDisplayLimit = itemsPerBatch;
  }

  if (mainContainer) {
    let dataList = window.galleryData || [];
    if (dataList.length === 0) {
      mainContainer.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #888; padding: 2rem 0;">등록된 데이터가 없습니다.</p>';
      return;
    }
    dataList = getSortedData(dataList);
    mainContainer.classList.add('crop-square');
    
    const slicedData = dataList.slice(0, currentDisplayLimit);
    mainContainer.innerHTML = slicedData.map(item => createCardHTML(item, isPagesFolder)).join('');
    setupInfiniteScroll(dataList.length);
  } 
  else if (subContainer) {
    let items = window.fanworksImages || [];
    if (items.length === 0) return;
    items = getSortedData(items);
    
    const slicedItems = items.slice(0, currentDisplayLimit);
    subContainer.innerHTML = slicedItems.map(item => {
      const dataItem = typeof item === 'string' ? { image: item, caption: '' } : item;
      return createCardHTML(dataItem, isPagesFolder);
    }).join('');
    setupInfiniteScroll(items.length);
  }
}

function initLightbox() {
  const gridContainer = document.querySelector('.grid-cols-3, .grid-cols-4, .grid-cols-5');
  if (!gridContainer) return;

  const modal = document.createElement('div');
  modal.className = 'image-modal';
  
  modal.innerHTML = `
    <button class="modal-arrow modal-prev" aria-label="이전 이미지">
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
    <button class="modal-arrow modal-next" aria-label="다음 이미지">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
    </button>
  `;
  document.body.appendChild(modal);

  const modalImg = modal.querySelector('.image-modal-content');
  const captionTextEl = modal.querySelector('.modal-caption-text');
  const captionContainer = modal.querySelector('.modal-caption-container');
  const prevBtn = modal.querySelector('.modal-prev');
  const nextBtn = modal.querySelector('.modal-next');

  let currentImages = [];
  let currentIndex = 0;
  let currentCaption = '';

  function updateModalImage() {
    if (currentImages.length > 0) {
      modalImg.src = currentImages[currentIndex];
      
      if (currentImages.length <= 1) {
        prevBtn.style.display = 'none';
        nextBtn.style.display = 'none';
      } else {
        prevBtn.style.display = (currentIndex === 0) ? 'none' : 'flex';
        prevBtn.style.display = (currentIndex === currentImages.length - 1) ? 'none' : 'flex';
      }
    }
  }

  function closeModal() {
    modal.classList.remove('active');
    document.body.style.overflow = '';
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
        currentCaption = decodeURIComponent(thumbContainer.getAttribute('data-caption') || '');

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

          modal.classList.add('active');
          document.body.style.overflow = 'hidden';

          setTimeout(() => {
            modalImg.focus();
          }, 50);
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

  modal.addEventListener('click', (e) => {
    if (!e.target.closest('.modal-arrow') && !e.target.closest('.modal-caption-container')) {
      closeModal();
    }
  });

  window.addEventListener('keydown', (e) => {
    if (!modal.classList.contains('active')) return;
    if (e.key === 'Escape') {
      closeModal();
    } else if (e.key === 'ArrowLeft') {
      prevBtn.click();
    } else if (e.key === 'ArrowRight') {
      nextBtn.click();
    }
  });
}

function init() {
  renderHeader();
  executeRender(true);
  initLightbox();
}

window.loadGallery = init;

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}