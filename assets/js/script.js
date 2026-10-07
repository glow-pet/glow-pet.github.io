// assets/js/script.js

// 1. 메인 갤러리 카드 렌더링
function renderMainGallery(dataList) {
  const container = document.querySelector('.gallery-grid.main-grid');
  if (!container || !dataList) return;

  const html = dataList.map((item) => {
    const thumbContent = item.imgSrc 
      ? `<img src="${item.imgSrc}" alt="${item.infos[0] || '카드 이미지'}" loading="lazy">`
      : `<div class="color-placeholder" style="background-color: #c9c9c9; width: 100%; height: 100%;"></div>`;

    const infoHTML = (item.infos || []).map((info, idx) => `
      <p class="card-info-item info-${idx + 1}">${info}</p>
    `).join('');

    const dateHTML = item.date ? `<p class="card-date">${item.date}</p>` : '';

    return `
      <article class="main-card">
        <a href="${item.link || '#'}" class="main-card-link">
          <div class="main-card-thumb">
            ${thumbContent}
          </div>
          <div class="main-card-info">
            ${infoHTML}
            ${dateHTML}
          </div>
        </a>
      </article>
    `;
  }).join('');

  container.innerHTML = html;
}

// 2. 서브페이지 본문 이미지 렌더링
function renderDetailGallery(detailsData) {
  const detailContainer = document.querySelector('.fanworks-grid[data-page-id]');
  if (!detailContainer || !detailsData) return;

  const pageId = detailContainer.getAttribute('data-page-id');
  const images = detailsData[pageId] || [];

  if (images.length === 0) {
    detailContainer.innerHTML = '<p>등록된 이미지가 없습니다.</p>';
    return;
  }

  const html = images.map(imgSrc => `
    <div class="fanworks-card">
      <img src="${imgSrc}" alt="상세 이미지">
    </div>
  `).join('');

  detailContainer.innerHTML = html;
}

// 3. JSON 데이터 불러오기 및 통합 로드
async function loadGallery() {
  const isPagesFolder = window.location.pathname.includes('/pages/');
  const jsonPath = isPagesFolder ? '../assets/js/galleryData.json' : 'assets/js/galleryData.json';

  try {
    const response = await fetch(jsonPath);
    if (!response.ok) throw new Error('galleryData.json 로드 실패');
    const data = await response.json();

    renderMainGallery(data.mainCards);
    renderDetailGallery(data.details);
  } catch (err) {
    console.warn('갤러리 데이터를 불러오는 중 오류가 발생했거나 파일이 없습니다.', err);
  }
}

// 4. 라이트박스 팝업 이벤트
document.addEventListener("DOMContentLoaded", () => {
  loadGallery();

  const detailContainer = document.querySelector(".fanworks-grid");
  if (!detailContainer) return;

  const modal = document.createElement("div");
  modal.className = "image-modal";
  
  const modalImg = document.createElement("img");
  modalImg.className = "image-modal-content";
  
  modal.appendChild(modalImg);
  document.body.appendChild(modal);

  detailContainer.addEventListener("click", (e) => {
    if (e.target.tagName === "IMG") {
      modalImg.src = e.target.src;
      modalImg.alt = e.target.alt || "";
      modal.classList.add("active");
      document.body.style.overflow = "hidden";
    }
  });

  modal.addEventListener("click", () => {
    modal.classList.remove("active");
    document.body.style.overflow = "";
  });

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.classList.contains("active")) {
      modal.classList.remove("active");
      document.body.style.overflow = "";
    }
  });
});