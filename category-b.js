// category-b.js
function renderHistoryData() {
  const container = document.getElementById('fav-list');
  if (!container) return;

  if (typeof historyRawText === 'undefined') {
    console.error("historyRawText 데이터를 찾을 수 없습니다. data.js를 확인해 주세요.");
    return;
  }

  const cleanText = historyRawText.replace(/\r/g, '');

  // 연속된 빈 줄 기준으로 분리 후 빈 블록 제거
  const blocks = cleanText.split(/\n\s*\n/).filter(block => block.trim() !== '');

  const html = blocks.map(block => {
    const lines = block.trim().split('\n');
    const title = lines[0] || '';
    const content = lines.slice(1).map(line => line.trim()).join('<br>');

    return `
      <article class="fav-block">
        <h2 class="title">${title}</h2>
        <p class="line">${content}</p>
      </article>
    `;
  }).join('');

  container.innerHTML = html;
}

document.addEventListener("DOMContentLoaded", renderHistoryData);