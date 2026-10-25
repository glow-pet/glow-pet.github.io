let postsData = [];
let currentImages = [];
let initialFormState = '';
let activeTagFilters = {}; 
let currentSelectedCategory = null;

// 장르 태그별 폴더명 매핑 사전
const GENRE_FOLDER_MAP = {
    "델타룬": "deltarune",
    "이거 그리고 죽어": "draw-this-then-die",
    "레뷰 스타라이트": "revue-starlight",
    "안녕 라라": "goodbye-lara"
};

async function loadPosts() {
    try {
        const res = await fetch('posts.json');
        postsData = await res.json();
    } catch (e) {
        console.error('posts.json 로드 실패', e);
        alert('posts.json 파일을 불러오지 못했습니다. Live Server 환경에서 열려있는지 확인해주세요.');
    }
}

// 1열 카테고리 클릭 -> 2열 콘텐츠 영역 표시
window.selectCategory = function(category) {
    currentSelectedCategory = category;

    document.querySelectorAll('.admin-menu-btn').forEach(btn => {
        if (btn.textContent.includes(category)) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    document.getElementById('currentTabTitle').innerText = `${category} 목록`;
    
    document.getElementById('contentPaneInner').style.display = 'flex';
    document.getElementById('contentPanePlaceholder').style.display = 'none';

    closeEditor();
    renderGrid();
};

function renderGrid() {
    const grid = document.getElementById('cardGrid');
    if (!grid || !currentSelectedCategory) return;

    const filtered = postsData.filter(p => (p.category || '2차창작') === currentSelectedCategory);

    if (filtered.length === 0) {
        grid.innerHTML = '<p style="text-align:center; color:#888; padding:2rem;">등록된 데이터가 없습니다.</p>';
        return;
    }

    grid.innerHTML = filtered.map(post => {
        const images = (post.images && post.images.length > 0) ? post.images : [post['thumbnail-image'] || ''];
        const firstImg = images[0] || '';
        const badge = images.length > 1 ? `<div class="admin-badge">${images.length}p</div>` : '';
        const tagsHtml = (post.tags || []).map(t => `<span class="admin-tag-badge">${t}</span>`).join('');
        
        const metaText = [post.category || '기타', post.date || ''].filter(Boolean).join(' | ');

        return `
            <div class="admin-card" style="display: flex; align-items: center; gap: 12px; padding: 10px; background: #fff; border: 1px solid #eaeaea; border-radius: 6px; margin-bottom: 8px;">
                <div class="admin-thumb-preview">
                    ${badge}
                    ${firstImg ? `<img src="${firstImg}" loading="lazy" onerror="this.src=''">` : '<span style="font-size:0.7rem; color:#aaa; display:flex; align-items:center; justify-content:center; height:100%;">없음</span>'}
                </div>
                <div class="admin-card-info" style="flex: 1; min-width: 0;">
                    <div class="admin-card-meta" style="font-size: 0.75rem; color: #888; margin-bottom: 2px;">${metaText}</div>
                    <div class="admin-card-tags" style="display: flex; flex-wrap: wrap; gap: 4px;">${tagsHtml}</div>
                </div>
                <div class="admin-card-actions" style="display: flex; gap: 4px;">
                    <button class="admin-action-btn admin-btn-edit" onclick="openEditEditor(${post.id})" style="padding: 4px 8px; font-size: 0.8rem; cursor: pointer;">수정</button>
                    <button class="admin-action-btn admin-btn-del" onclick="deleteCard(${post.id})" style="padding: 4px 8px; font-size: 0.8rem; color: #e74c3c; cursor: pointer;">삭제</button>
                </div>
            </div>
        `;
    }).join('');
}

// 2열 콘텐츠에서 '수정' 또는 '+ 새 카드 추가' 클릭 -> 3열 에디터 영역 표시
window.openEditEditor = function(id) {
    const post = postsData.find(p => p.id === id);

    if (post) {
        document.getElementById('editorTitle').innerText = `카드 수정 (ID: ${post.id})`;
        document.getElementById('cardId').value = post.id;
        document.getElementById('cardCategory').value = post.category || currentSelectedCategory;
        document.getElementById('cardTags').value = (post.tags || []).join(', ');
        document.getElementById('cardAlt').value = post.alt || '';
        document.getElementById('cardDate').value = post.date || '';
        currentImages = (post.images && post.images.length > 0) ? [...post.images] : (post['thumbnail-image'] ? [post['thumbnail-image']] : []);
    } else {
        document.getElementById('editorTitle').innerText = '새 카드 추가';
        document.getElementById('cardId').value = '';
        document.getElementById('cardCategory').value = currentSelectedCategory || '2차창작';
        document.getElementById('cardTags').value = '';
        document.getElementById('cardAlt').value = '';
        document.getElementById('cardDate').value = new Date().toISOString().split('T')[0];
        currentImages = [];
    }

    renderImages();
    syncFilterStateFromInput();
    
    document.getElementById('editorPaneInner').style.display = 'flex';
    document.getElementById('editorPanePlaceholder').style.display = 'none';

    initialFormState = getFormState();
    checkFormChanges();
};

function closeEditor() {
    document.getElementById('editorPaneInner').style.display = 'none';
    document.getElementById('editorPanePlaceholder').style.display = 'flex';
}

// 3열 내부 태그 선택기 (작품, 캐릭터, 관계 분류 및 +, x 관계열 포함)
function renderAdminTagSelector() {
    const box = document.getElementById('tagSelectorBox');
    if (!box) return;

    const works = new Set();
    postsData.forEach(p => {
        const tags = p.tags || [];
        if (tags.length > 0) works.add(tags[0]);
    });
    works.add("이거 그리고 죽어");
    const sortedWorks = Array.from(works).sort((a, b) => a.localeCompare(b, 'ko'));

    const includedWorks = Object.keys(activeTagFilters).filter(tag => 
        sortedWorks.includes(tag) && activeTagFilters[tag] === 'include'
    );

    const characters = new Set();
    const relationships = new Set();

    characters.add("레이");
    characters.add("아이");
    relationships.add("아이x레이");

    postsData.forEach(p => {
        const tags = p.tags || [];
        if (tags.length > 0 && (includedWorks.length === 0 || includedWorks.includes(tags[0]))) {
            tags.slice(1).forEach(t => {
                if (t.includes('x') || t.includes('+')) {
                    relationships.add(t);
                } else {
                    characters.add(t);
                }
            });
        }
    });

    const sortedChars = Array.from(characters).sort((a, b) => a.localeCompare(b, 'ko'));
    const sortedRels = Array.from(relationships).sort((a, b) => a.localeCompare(b, 'ko'));

    box.innerHTML = `
        <div class="filter-columns-wrapper" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; padding: 0; box-shadow: none; max-height: none;">
            <div class="filter-col">
                <h4 style="font-size:0.8rem; font-weight:600; border-bottom:2px solid #333; padding-bottom:3px; margin-bottom:6px;">작품</h4>
                <div class="filter-item-list" style="display: flex; flex-direction: column; gap: 4px;">
                    ${sortedWorks.map(tag => renderTagRow(tag)).join('')}
                </div>
            </div>
            <div class="filter-col">
                <h4 style="font-size:0.8rem; font-weight:600; border-bottom:2px solid #333; padding-bottom:3px; margin-bottom:6px;">캐릭터</h4>
                <div class="filter-item-list" style="display: flex; flex-direction: column; gap: 4px;">
                    ${includedWorks.length === 0 ? '<span style="color:#aaa; font-size:0.75rem;">작품 선택 필요</span>' :
                      sortedChars.map(tag => renderTagRow(tag)).join('')}
                </div>
            </div>
            <div class="filter-col">
                <h4 style="font-size:0.8rem; font-weight:600; border-bottom:2px solid #333; padding-bottom:3px; margin-bottom:6px;">관계</h4>
                <div class="filter-item-list" style="display: flex; flex-direction: column; gap: 4px;">
                    ${includedWorks.length === 0 ? '<span style="color:#aaa; font-size:0.75rem;">작품 선택 필요</span>' :
                      sortedRels.map(tag => renderTagRow(tag)).join('')}
                </div>
            </div>
        </div>
    `;

    const selectedTags = Object.keys(activeTagFilters).filter(tag => activeTagFilters[tag] === 'include');
    document.getElementById('cardTags').value = selectedTags.join(', ');
    updateImagePathPreview();
}

function renderTagRow(tag) {
    const isIncluded = activeTagFilters[tag] === 'include';
    return `
        <div class="filter-row-item" style="cursor: pointer; padding: 2px 4px; border-radius: 4px; display: flex; justify-content: space-between; align-items: center;" onclick="toggleAdminTag('${tag}')">
            <span class="filter-tag-label" style="font-size: 0.8rem; ${isIncluded ? 'font-weight: 600; color: #000;' : ''}">${tag}</span>
            <button type="button" class="tri-state-checkbox ${isIncluded ? 'include' : ''}" style="width: 16px; height: 16px; font-size: 0.7rem; pointer-events: none;">${isIncluded ? '✔' : ''}</button>
        </div>
    `;
}

window.toggleAdminTag = function(tag) {
    if (activeTagFilters[tag] === 'include') {
        delete activeTagFilters[tag];
    } else {
        activeTagFilters[tag] = 'include';
    }
    renderAdminTagSelector();
    checkFormChanges();
};

function updateImagePathPreview() {
    const previewEl = document.getElementById('imagePathPreview');
    if (!previewEl) return;

    const category = document.getElementById('cardCategory').value;
    const baseFolder = (category === '1차창작') ? 'ocs' : 'fanworks';

    const selectedTags = Object.keys(activeTagFilters).filter(tag => activeTagFilters[tag] === 'include');
    const firstTag = selectedTags.length > 0 ? selectedTags[0] : '';

    let genreFolder = '';
    if (firstTag) {
        genreFolder = GENRE_FOLDER_MAP[firstTag] || firstTag.toLowerCase().replace(/\s+/g, '-');
    }

    if (baseFolder === 'fanworks' && genreFolder) {
        previewEl.innerText = `assets/images/${baseFolder}/${genreFolder}/`;
    } else {
        previewEl.innerText = `assets/images/${baseFolder}/`;
    }
}

function syncFilterStateFromInput() {
    const currentTagsInput = document.getElementById('cardTags').value;
    const selectedTags = currentTagsInput.split(',').map(t => t.trim()).filter(Boolean);

    activeTagFilters = {};
    selectedTags.forEach(tag => {
        activeTagFilters[tag] = 'include';
    });
    renderAdminTagSelector();
}

function getFormState() {
    return JSON.stringify({
        category: document.getElementById('cardCategory').value,
        tags: document.getElementById('cardTags').value,
        alt: document.getElementById('cardAlt').value,
        date: document.getElementById('cardDate').value,
        images: currentImages
    });
}

function checkFormChanges() {
    const saveBtn = document.getElementById('saveBtn');
    if (!saveBtn) return;
    if (getFormState() !== initialFormState) {
        saveBtn.removeAttribute('disabled');
        saveBtn.style.opacity = '1';
    } else {
        saveBtn.setAttribute('disabled', 'true');
        saveBtn.style.opacity = '0.5';
    }
}

function renderImages() {
    const listEl = document.getElementById('imageList');
    if (!listEl) return;
    listEl.innerHTML = currentImages.map((img, idx) => `
        <div class="image-item" style="width: 70px; height: 70px; position: relative; border: 1px solid #ccc; border-radius: 4px; overflow: hidden;">
            <img src="${img}" loading="lazy" style="width: 100%; height: 100%; object-fit: cover;">
            <div class="remove-btn" onclick="removeImage(${idx})" style="position: absolute; top: 2px; right: 2px; background: rgba(231,76,60,0.9); color: #fff; border-radius: 50%; width: 16px; height: 16px; display: flex; align-items: center; justify-content: center; font-size: 9px; cursor: pointer;">✕</div>
        </div>
    `).join('');
    checkFormChanges();
}

window.addImagePath = function() {
    const category = document.getElementById('cardCategory').value;
    const baseFolder = (category === '1차창작') ? 'ocs' : 'fanworks';
    const selectedTags = Object.keys(activeTagFilters).filter(tag => activeTagFilters[tag] === 'include');
    const firstTag = selectedTags.length > 0 ? selectedTags[0] : '';

    let genreFolder = '';
    if (firstTag) {
        genreFolder = GENRE_FOLDER_MAP[firstTag] || firstTag.toLowerCase().replace(/\s+/g, '-');
    }

    const filename = document.getElementById('newImgFilename').value.trim();
    
    if (filename) {
        let fullPath = '';
        if (baseFolder === 'fanworks' && genreFolder) {
            fullPath = `assets/images/${baseFolder}/${genreFolder}/${filename}.webp`;
        } else {
            fullPath = `assets/images/${baseFolder}/${filename}.webp`;
        }
        currentImages.push(fullPath);
        document.getElementById('newImgFilename').value = '';
        renderImages();
    } else {
        alert('파일명을 입력해주세요.');
    }
};

window.removeImage = function(idx) {
    currentImages.splice(idx, 1);
    renderImages();
};

window.tryCloseEditor = function() {
    if (getFormState() !== initialFormState) {
        if (confirm('저장되지 않았습니다. 닫으시겠습니까?')) {
            closeEditor();
        }
    } else {
        closeEditor();
    }
};

document.addEventListener('DOMContentLoaded', () => {
    const categorySelect = document.getElementById('cardCategory');
    if (categorySelect) {
        categorySelect.addEventListener('change', () => {
            updateImagePathPreview();
            checkFormChanges();
        });
    }

    const tagsInput = document.getElementById('cardTags');
    if (tagsInput) {
        tagsInput.addEventListener('input', () => {
            syncFilterStateFromInput();
            checkFormChanges();
        });
    }

    ['cardAlt', 'cardDate'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('input', checkFormChanges);
            el.addEventListener('change', checkFormChanges);
        }
    });

    const editForm = document.getElementById('editForm');
    if (editForm) {
        editForm.onsubmit = (e) => {
            e.preventDefault();
            const idVal = document.getElementById('cardId').value;
            const cardData = {
                id: idVal ? parseInt(idVal) : (Math.max(...postsData.map(p => p.id || 0), 0) + 1),
                category: document.getElementById('cardCategory').value,
                tags: document.getElementById('cardTags').value.split(',').map(t => t.trim()).filter(Boolean),
                alt: document.getElementById('cardAlt').value,
                date: document.getElementById('cardDate').value,
                status: "public"
            };

            if (currentImages.length > 0) {
                cardData['thumbnail-image'] = currentImages[0];
                if (currentImages.length > 1) {
                    cardData.images = currentImages;
                }
            }

            const existingIdx = postsData.findIndex(p => p.id === cardData.id);
            if (existingIdx !== -1) {
                postsData[existingIdx] = cardData;
            } else {
                postsData.unshift(cardData);
            }

            closeEditor();
            renderGrid();
        };
    }

    loadPosts();
});

window.deleteCard = function(id) {
    if (confirm('정말 이 카드를 삭제하시겠습니까?')) {
        postsData = postsData.filter(p => p.id !== id);
        renderGrid();
    }
};

window.downloadJson = function() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(postsData, null, 4));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "posts.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
};