// script.js
document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('fav-container');
  if (!container || typeof rawFavData === 'undefined') return;

  // 빈 줄(엔터 2개 이상)을 기준으로 각 단(작품 블록) 분할
  const blocks = rawFavData.trim().split(/\n\s*\n/);

  const htmlContent = blocks.map(block => {
    const lines = block.trim().split('\n');
    if (lines.length === 0) return '';

    const title = lines[0]; // 첫 줄 = 작품명
    const bodyLines = lines.slice(1); // 나머지 줄

    const bodyHTML = bodyLines.map(line => `<div class="line">${line}</div>`).join('');

    return `
      <div class="fav-block">
        <div class="title">${title}</div>
        ${bodyHTML}
      </div>
    `;
  }).join('');

  container.innerHTML = htmlContent;
});
