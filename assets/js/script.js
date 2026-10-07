// script.js

// 1. 갤러리 카드 동적 렌더링 및 날짜 정렬 함수
function renderGalleryCards(dataList) {
  const container = document.querySelector('.gallery-grid');
  if (!container) return;

  if (!dataList || dataList.length === 0) {
    console.warn("갤러리 데이터가 비어 있습니다.");
    return;
  }

  // 🔥 [신규] 날짜(date) 기준 내림차순 정렬 (최신날짜가 맨 앞으로)
  const sortedData = [...dataList].sort((a, b) => {
    const dateA = new Date(a.date || '1970-01-01');
    const dateB = new Date(b.date || '1970-01-01');
    return dateB - dateA;
  });

  const defaultColors = ['#c9c9c9'];

  const html = sortedData.map((item, index) => {
    // 썸네일 처리 (이미지가 비어있을 경우 색상 박스)
    const color = item.color || defaultColors[index % defaultColors.length];
    const thumbContent = item.imgSrc 
      ? `<img src="${item.imgSrc}" alt="${item.infos ? item.infos[0] : (item.title || '카드 이미지')}" loading="lazy">`
      : `<div class="color-placeholder" style="background-color: ${color}; width: 100%; height: 100%;"></div>`;

    // 가변 정보 (infos 배열 우선)
    const infos = item.infos || [item.title, item.character, item.tag].filter(Boolean);
    const infoHTML = infos.map((info, idx) => `
      <p class="card-info-item info-${idx + 1}">${info}</p>
    `).join('');

    // 🔥 [신규] 수정/작성 년월일 표시 (YYYY-MM-DD)
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

// 2. fanworks- 페이지 라이트박스 팝업 이벤트
document.addEventListener("DOMContentLoaded", () => {
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