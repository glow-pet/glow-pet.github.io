let postsData = [];
let tagsData = { works: [] };
let currentImages = [];
let initialFormState = '';
let activeTagFilters = {}; 
let currentSelectedCategory = null;

let editingWorks = []; 
let modalWorkEyeStates = {}; 
let modalCharEyeStates = {}; 
let workToDelete = null;

const GENRE_FOLDER_MAP = {
    "델타룬": "deltarune",
    "이거 그리고 죽어": "draw-this-then-die",
    "레뷰 스타라이트": "revue-starlight",
    "안녕 라라": "goodbye-lara",
    "언더테일": "undertale"
};

async function loadData() {
    try {
        const [postsRes, tagsRes] = await Promise.all([
            fetch('posts.json'),
            fetch('tags.json')
        ]);
        if (postsRes.ok) postsData = await postsRes.json();
        if (tagsRes.ok) tagsData = await tagsRes.json();
    } catch (e) {
        console.error('데이터 로드 실패', e);
        alert('posts.json 또는 tags.json 파일을 불러오지 못했습니다. Live Server 환경을 확인해주세요.');
    }
}

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
        
        const tagsHtml = (post.tags || []).map(t => `<span style="font-size: 0.8rem; color: #666; margin-right: 6px;">#${t}</span>`).join('');
        const metaText = [post.category || '기타', post.date || ''].filter(Boolean).join(' | ');

        return `
            <div class="admin-card-item">
                <div style="position: absolute; top: 12px; right: 10px; display: flex; gap: 16px; align-items: center;">
                    <button class="admin-action-btn" onclick="openEditEditor(${post.id})" style="background: transparent; color: #888; padding: 0; font-size: 0.75rem; border: none; cursor: pointer;">수정</button>
                    <button class="admin-action-btn" onclick="deleteCard(${post.id})" style="background: transparent; color: #888; padding: 0; font-size: 0.75rem; border: none; cursor: pointer;">삭제</button>
                </div>
                <div class="admin-thumb-preview">
                    ${badge}
                    ${firstImg ? `<img src="${firstImg}" loading="lazy" onerror="this.src=''">` : '<span style="font-size:0.7rem; color:#aaa; display:flex; align-items:center; justify-content:center; height:100%;">없음</span>'}
                </div>
                <div class="admin-card-info" style="flex: 1; min-width: 0; padding-top: 2px;">
                    <div class="admin-card-meta" style="font-size: 0.8rem; color: #666; margin-bottom: 4px; font-weight: 500;">${metaText}</div>
                    <div class="admin-card-tags" style="display: flex; flex-wrap: wrap; gap: 2px;">${tagsHtml}</div>
                </div>
            </div>
        `;
    }).join('');
}

window.openEditEditor = function(id) {
    const post = postsData.find(p => p.id === id);

    if (post) {
        document.getElementById('editorTitle').innerHTML = `카드 수정 &nbsp;&nbsp;&nbsp; ID:${post.id}`;
        document.getElementById('cardId').value = post.id;
        document.getElementById('cardCategory').value = post.category || currentSelectedCategory;
        document.getElementById('cardTags').value = (post.tags || []).join(', ');
        document.getElementById('cardAlt').value = post.alt || '';
        document.getElementById('cardDate').value = post.date || '';
        currentImages = (post.images && post.images.length > 0) ? [...post.images] : (post['thumbnail-image'] ? [post['thumbnail-image']] : []);
    } else {
        document.getElementById('editorTitle').innerHTML = `새 카드 추가`;
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

function renderAdminTagSelector() {
    const box = document.getElementById('tagSelectorBox');
    if (!box) return;

    const works = tagsData.works.map(w => w.name);
    const sortedWorks = Array.from(new Set(works)).sort((a, b) => a.localeCompare(b, 'ko'));

    const includedWorks = Object.keys(activeTagFilters).filter(tag => 
        sortedWorks.includes(tag) && activeTagFilters[tag] === 'include'
    );

    const characters = new Set();
    const relationships = new Set();

    tagsData.works.forEach(w => {
        if (includedWorks.includes(w.name)) {
            w.characters.forEach(c => {
                characters.add(c.name);
                if (c.relations) {
                    c.relations.forEach(r => relationships.add(r));
                }
            });
        }
    });

    const sortedChars = Array.from(characters).sort((a, b) => a.localeCompare(b, 'ko'));
    const sortedRels = Array.from(relationships).sort((a, b) => a.localeCompare(b, 'ko'));

    box.innerHTML = `
        <div class="filter-columns-wrapper" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; padding: 0;">
            <div class="filter-col">
                <div class="filter-col-header-dark" style="justify-content: center;">
                    <span>작품</span>
                </div>
                <div class="filter-col-scrollable" style="display: flex; flex-direction: column; gap: 4px;">
                    ${sortedWorks.map(tag => renderTagRow(tag)).join('')}
                </div>
            </div>
            <div class="filter-col">
                <div class="filter-col-header-dark" style="justify-content: center;">
                    <span>캐릭터</span>
                </div>
                <div class="filter-col-scrollable" style="display: flex; flex-direction: column; gap: 4px;">
                    ${includedWorks.length === 0 ? '<span style="color:#aaa; font-size:0.75rem;">작품 선택 필요</span>' :
                      sortedChars.length === 0 ? '<span style="color:#aaa; font-size:0.75rem;">해당 태그 없음</span>' :
                      sortedChars.map(tag => renderTagRow(tag)).join('')}
                </div>
            </div>
            <div class="filter-col">
                <div class="filter-col-header-dark" style="justify-content: center;">
                    <span>관계</span>
                </div>
                <div class="filter-col-scrollable" style="display: flex; flex-direction: column; gap: 4px;">
                    ${includedWorks.length === 0 ? '<span style="color:#aaa; font-size:0.75rem;">작품 선택 필요</span>' :
                      sortedRels.length === 0 ? '<span style="color:#aaa; font-size:0.75rem;">해당 태그 없음</span>' :
                      sortedRels.map(tag => renderTagRow(tag)).join('')}
                </div>
            </div>
        </div>
    `;

    const selectedTags = Object.keys(activeTagFilters).filter(tag => activeTagFilters[tag] === 'include');
    document.getElementById('cardTags').value = selectedTags.join(', ');
    updateImagePathPreview();
}

window.openTagHierarchyModal = function() {
    editingWorks = JSON.parse(JSON.stringify(tagsData.works));

    editingWorks.forEach(w => { 
        if (modalWorkEyeStates[w.name] === undefined) modalWorkEyeStates[w.name] = false; 
        w.characters.forEach(c => {
            if (modalCharEyeStates[c.name] === undefined) modalCharEyeStates[c.name] = false;
        });
    });

    renderTagFilterModalContent();
    document.getElementById('tagEditModal').classList.add('active');
};

function renderTagFilterModalContent() {
    const colWorks = document.getElementById('editColWorks');
    const colChars = document.getElementById('editColChars');
    const colRels = document.getElementById('editColRels');
    if (!colWorks || !colChars || !colRels) return;

    // 1열: 작품 렌더링 + 하단 [+] 버튼
    const worksHtml = editingWorks.map(w => {
        const isOpen = !!modalWorkEyeStates[w.name];
        return `
            <div class="tag-edit-row">
                <span>${w.name}</span>
                <div class="tag-edit-actions">
                    <button type="button" class="eye-btn ${isOpen ? '' : 'closed'}" onclick="toggleModalWorkEye('${w.name}')">${isOpen ? '눈뜸' : '눈감음'}</button>
                    <button type="button" class="tag-delete-btn" onclick="openWorkDeleteModal('${w.name}')">✕</button>
                </div>
            </div>
        `;
    }).join('');

    colWorks.innerHTML = worksHtml + `<div class="tag-add-btn-box" id="addWorkBox" onclick="initInlineAdd('work', this)" title="새 작품 추가">+</div>`;

    // 눈 뜬 작품들에 속하는 캐릭터들 수집
    const activeWorks = editingWorks.filter(w => modalWorkEyeStates[w.name]);
    const charsToShow = [];

    if (activeWorks.length > 0) {
        activeWorks.forEach(w => {
            w.characters.forEach(c => {
                if (!charsToShow.some(item => item.name === c.name)) {
                    charsToShow.push(c);
                }
            });
        });
    }

    // 2열: 캐릭터 렌더링 + 하단 [+] 버튼
    if (activeWorks.length === 0) {
        colChars.innerHTML = '<span style="color:#aaa; font-size:0.8rem;">작품의 눈을 떠주세요</span>';
    } else {
        const charsHtml = charsToShow.map(c => {
            const isOpen = !!modalCharEyeStates[c.name];
            return `
                <div class="tag-edit-row">
                    <span>${c.name}</span>
                    <div class="tag-edit-actions">
                        <button type="button" class="eye-btn ${isOpen ? '' : 'closed'}" onclick="toggleModalCharEye('${c.name}')">${isOpen ? '눈뜸' : '눈감음'}</button>
                        <button type="button" class="tag-delete-btn" onclick="deleteCharTag('${c.name}')">✕</button>
                    </div>
                </div>
            `;
        }).join('');
        colChars.innerHTML = charsHtml + `<div class="tag-add-btn-box" id="addCharBox" onclick="initInlineAdd('char', this)" title="선택된 작품에 캐릭터 추가">+</div>`;
    }

    // 눈 뜬 캐릭터들 이름 목록
    const activeCharNames = editingWorks.flatMap(w => w.characters).filter(c => modalCharEyeStates[c.name]).map(c => c.name);

    // 3열: 관계 렌더링 + 하단 [+] 버튼
    const relsToShow = new Set();
    if (activeCharNames.length > 0) {
        activeWorks.forEach(w => {
            w.characters.forEach(c => {
                if (c.relations) {
                    c.relations.forEach(rel => {
                        const parts = rel.split(/[\+x]/).map(s => s.trim()).filter(Boolean);
                        if (parts.length >= 2 && parts.every(p => activeCharNames.includes(p))) {
                            relsToShow.add(rel);
                        }
                    });
                }
            });
        });
    }

    const sortedRelsToShow = Array.from(relsToShow);

    if (activeCharNames.length === 0) {
        colRels.innerHTML = '<span style="color:#aaa; font-size:0.8rem;">캐릭터의 눈을 떠주세요</span>';
    } else {
        const relsHtml = sortedRelsToShow.map(rel => `
            <div class="tag-edit-row">
                <span>${rel}</span>
                <button type="button" class="tag-delete-btn" onclick="deleteRelTag('${rel}')">✕</button>
            </div>
        `).join('');
        colRels.innerHTML = relsHtml + `<div class="tag-add-btn-box" id="addRelBox" onclick="initInlineAdd('rel', this)" title="선택된 캐릭터들에 관계 추가">+</div>`;
    }
}

window.initInlineAdd = function(type, boxEl) {
    if (boxEl.querySelector('input')) return;

    const originalHtml = boxEl.innerHTML;
    boxEl.innerHTML = `<input type="text" class="tag-add-input" placeholder="입력 후 엔터" autofocus>`;
    const inputEl = boxEl.querySelector('input');

    inputEl.focus();

    inputEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.stopPropagation();
            applyInlineAdd(type, inputEl.value);
        } else if (e.key === 'Escape') {
            boxEl.innerHTML = originalHtml;
        }
    });

    inputEl.addEventListener('blur', () => {
        setTimeout(() => {
            if (inputEl && inputEl.parentNode) {
                applyInlineAdd(type, inputEl.value);
            }
        }, 150);
    });
};

function applyInlineAdd(type, val) {
    if (!val || !val.trim()) {
        renderTagFilterModalContent();
        return;
    }
    const trimmed = val.trim();

    if (type === 'work') {
        if (!editingWorks.some(w => w.name === trimmed)) {
            editingWorks.push({ name: trimmed, characters: [] });
            modalWorkEyeStates[trimmed] = true;
        }
    } else if (type === 'char') {
        const activeWorks = editingWorks.filter(w => modalWorkEyeStates[w.name]);
        if (activeWorks.length > 0) {
            activeWorks.forEach(w => {
                if (!w.characters.some(c => c.name === trimmed)) {
                    w.characters.push({ name: trimmed, relations: [] });
                }
            });
            modalCharEyeStates[trimmed] = true;
        }
    } else if (type === 'rel') {
        const activeWorks = editingWorks.filter(w => modalWorkEyeStates[w.name]);
        if (activeWorks.length > 0 && activeWorks[0].characters.length > 0) {
            const activeCharNames = activeWorks.flatMap(w => w.characters).filter(c => modalCharEyeStates[c.name]).map(c => c.name);
            if (activeCharNames.length >= 2) {
                const targetChar = activeWorks[0].characters.find(c => c.name === activeCharNames[0]);
                if (targetChar) {
                    if (!targetChar.relations) targetChar.relations = [];
                    if (!targetChar.relations.includes(trimmed)) {
                        targetChar.relations.push(trimmed);
                    }
                }
            }
        }
    }

    renderTagFilterModalContent();
}

window.toggleModalWorkEye = function(workName) {
    modalWorkEyeStates[workName] = !modalWorkEyeStates[workName];
    renderTagFilterModalContent();
};

window.toggleModalCharEye = function(charName) {
    modalCharEyeStates[charName] = !modalCharEyeStates[charName];
    renderTagFilterModalContent();
};

window.deleteCharTag = function(charName) {
    editingWorks.forEach(w => {
        w.characters = w.characters.filter(c => c.name !== charName);
    });
    delete modalCharEyeStates[charName];
    renderTagFilterModalContent();
};

window.deleteRelTag = function(relName) {
    editingWorks.forEach(w => {
        w.characters.forEach(c => {
            if (c.relations) {
                c.relations = c.relations.filter(r => r !== relName);
            }
        });
    });
    renderTagFilterModalContent();
};

window.openWorkDeleteModal = function(workName) {
    workToDelete = workName;
    document.getElementById('workDeleteModal').classList.add('active');
};

window.closeWorkDeleteModal = function() {
    workToDelete = null;
    document.getElementById('workDeleteModal').classList.remove('active');
};

window.confirmDeleteWork = function() {
    if (workToDelete) {
        editingWorks = editingWorks.filter(w => w.name !== workToDelete);
        delete modalWorkEyeStates[workToDelete];
        renderTagFilterModalContent();
    }
    closeWorkDeleteModal();
};

// 모달 안의 '적용 및 저장' 버튼: tags.json 파일만 다운로드 저장
window.applyTagHierarchyModal = function() {
    tagsData.works = editingWorks;
    document.getElementById('tagEditModal').classList.remove('active');
    renderAdminTagSelector();

    // tags.json 파일 다운로드 저장
    const tagsStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(tagsData, null, 4));
    const a = document.createElement('a');
    a.setAttribute("href", tagsStr);
    a.setAttribute("download", "tags.json");
    document.body.appendChild(a);
    a.click();
    a.remove();
};

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
        
        const allWorks = new Set(tagsData.works.map(w => w.name));
        if (allWorks.has(tag)) {
            const targetWork = tagsData.works.find(w => w.name === tag);
            if (targetWork) {
                targetWork.characters.forEach(c => {
                    delete activeTagFilters[c.name];
                    if (c.relations) {
                        c.relations.forEach(r => delete activeTagFilters[r]);
                    }
                });
            }
        }
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

document.addEventListener('DOMContentLoaded', async () => {
    await loadData();

    const categorySelect = document.getElementById('cardCategory');
    if (categorySelect) {
        categorySelect.addEventListener('change', () => {
            updateImagePathPreview();
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

    const tagEditModal = document.getElementById('tagEditModal');
    if (tagEditModal) {
        tagEditModal.addEventListener('click', (e) => {
            if (e.target === tagEditModal) {
                tagEditModal.classList.remove('active');
            }
        });
    }

    const workDeleteModal = document.getElementById('workDeleteModal');
    if (workDeleteModal) {
        workDeleteModal.addEventListener('click', (e) => {
            if (e.target === workDeleteModal) {
                closeWorkDeleteModal();
            }
        });
    }
});

window.deleteCard = function(id) {
    if (confirm('정말 이 카드를 삭제하시겠습니까?')) {
        postsData = postsData.filter(p => p.id !== id);
        renderGrid();
    }
};

// 사이드바의 저장 버튼: posts.json 파일만 다운로드 저장
window.downloadJson = function() {
    const postsStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(postsData, null, 4));
    const a = document.createElement('a');
    a.setAttribute("href", postsStr);
    a.setAttribute("download", "posts.json");
    document.body.appendChild(a);
    a.click();
    a.remove();
};