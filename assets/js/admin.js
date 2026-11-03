let fanworksData = [];
let profilesData = [];
let favsData = [];
let tagsData = { works: [] };
let currentOcThumbnails = [];
let currentOcPortraits = [];
let currentImages = [];
let initialFormState = '';
let activeTagFilters = {}; 
let currentSelectedCategory = null;
let currentAdminPage = 1;
const adminItemsPerPage = 10;

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
        const [fanworksRes, profilesRes, favsRes, tagsRes] = await Promise.all([
            fetch('fanworks.json'),
            fetch('profiles.json').catch(() => ({ ok: false })),
            fetch('favs.json').catch(() => ({ ok: false })),
            fetch('tags.json')
        ]);
        if (fanworksRes.ok) fanworksData = await fanworksRes.json();
        if (profilesRes && profilesRes.ok) profilesData = await profilesRes.json();
        if (favsRes && favsRes.ok) favsData = await favsRes.json();
        if (tagsRes.ok) tagsData = await tagsRes.json();
    } catch (e) {
        console.error('데이터 로드 실패', e);
        alert('데이터 파일을 불러오지 못했습니다. Live Server 환경을 확인해주세요.');
    }
}

window.selectCategory = function(category) {
    currentSelectedCategory = category ? category.replace(/\s+/g, '') : '';
    currentAdminPage = 1;

    document.querySelectorAll('.admin-menu-btn').forEach(btn => {
        const btnText = btn.textContent.replace(/\s+/g, '');
        if (btnText.includes(currentSelectedCategory)) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    document.getElementById('currentTabTitle').innerText = `목록`;
    
    document.getElementById('contentPaneInner').style.display = 'flex';
    document.getElementById('contentPanePlaceholder').style.display = 'none';

    const orderBtn = document.getElementById('orderBtn');
    if (orderBtn) {
        if (currentSelectedCategory === '2차창작') {
            orderBtn.style.display = 'none';
        } else {
            orderBtn.style.display = 'inline-block';
        }
    }

    closeEditor();
    renderGrid();
};

function renderGrid() {
    const grid = document.getElementById('cardGrid');
    if (!grid || !currentSelectedCategory) return;

    const activeCategory = currentSelectedCategory.replace(/\s+/g, '');
    let targetData = [];

    if (activeCategory === '1차창작') {
        targetData = [...profilesData].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    } else if (activeCategory === '관심작품') {
        targetData = [...favsData].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    } else {
        targetData = [...fanworksData].sort((a, b) => {
            const dateA = new Date(a.date || 0);
            const dateB = new Date(b.date || 0);
            if (dateB - dateA !== 0) {
                return dateB - dateA;
            }
            return (b.id || 0) - (a.id || 0);
        });
    }

    if (targetData.length === 0) {
        grid.innerHTML = '<p style="text-align:center; color:#888; padding:2rem;">등록된 데이터가 없습니다.</p>';
        renderAdminPagination(0);
        return;
    }

    const totalPages = Math.ceil(targetData.length / adminItemsPerPage) || 1;
    if (currentAdminPage > totalPages) currentAdminPage = totalPages;

    const startIndex = (currentAdminPage - 1) * adminItemsPerPage;
    const slicedData = targetData.slice(startIndex, startIndex + adminItemsPerPage);

    if (activeCategory === '1차창작') {
        grid.innerHTML = slicedData.map(item => {
            const thumb = item.thumbnail || item.portrait || '';
            const statusBadges = [];
            if (item.private) statusBadges.push('비공개');
            if (item.rating === 'warning') statusBadges.push('성인물(경고)');
            if (item.rating === 'external') statusBadges.push('성인물(외부링크)');
            if (!item.rating && item.sensitive) statusBadges.push('성인물(경고)');
            const statusHtml = statusBadges.length > 0 ? `<div style="font-size: 0.75rem; color: #e74c3c; font-weight: 500; margin-top: 2px;">${statusBadges.join(' • ')}</div>` : '';

            return `
                <div class="admin-card-item">
                    <div style="position: absolute; top: 14px; right: 1rem; display: flex; gap: 16px; align-items: center; z-index: 5;">
                        <button class="admin-action-btn" onclick="openEditEditor(${item.id})" style="background: transparent; color: #888; padding: 0; font-size: 0.75rem; border: none; cursor: pointer;">수정</button>
                        <button class="admin-action-btn" onclick="deleteCard(${item.id})" style="background: transparent; color: #888; padding: 0; font-size: 0.75rem; border: none; cursor: pointer;">삭제</button>
                    </div>
                    <div class="admin-thumb-preview">
                        ${thumb ? `<img src="${thumb}" loading="lazy" onerror="this.src=''">` : '<span style="font-size:0.85rem; color:#aaa; display:flex; align-items:center; justify-content:center; height:100%;">없음</span>'}
                    </div>
                    <div class="admin-card-info">
                        <div>${item.name || ''}</div>
                        <div class="admin-card-meta">${item.title || ''}</div>
                        ${statusHtml}
                    </div>
                </div>
            `;
        }).join('');
    } else if (activeCategory === '관심작품') {
        grid.innerHTML = slicedData.map(item => {
            const details = [item.media, item.character, item.relation].filter(Boolean).join(' / ');
            return `
                <div class="admin-card-item">
                    <div style="position: absolute; top: 14px; right: 1rem; display: flex; gap: 16px; align-items: center; z-index: 5;">
                        <button class="admin-action-btn" onclick="openEditEditor(${item.id})" style="background: transparent; color: #888; padding: 0; font-size: 0.75rem; border: none; cursor: pointer;">수정</button>
                        <button class="admin-action-btn" onclick="deleteCard(${item.id})" style="background: transparent; color: #888; padding: 0; font-size: 0.75rem; border: none; cursor: pointer;">삭제</button>
                    </div>
                    <div class="admin-card-info" style="flex: 1; min-width: 0;">
                        <div style="font-weight: bold; font-size: 0.95rem; margin-bottom: 4px;">${item.title || ''}</div>
                        <div class="admin-card-meta" style="font-size: 0.8rem; color: #666;">${details}</div>
                    </div>
                </div>
            `;
        }).join('');
    } else {
        grid.innerHTML = slicedData.map(post => {
            const images = (post.images && post.images.length > 0) ? post.images : [post['thumbnail-image'] || ''];
            const firstImg = images[0] || '';
            const badge = images.length > 1 ? `<div class="admin-badge">${images.length}p</div>` : '';
            const tagsHtml = (post.tags || []).map(t => `<span style="font-size: 0.8rem; color: #666; margin-right: 6px;">#${t}</span>`).join('');
            const dateText = post.date || '';
            
            const statusBadges = [];
            if (post.private) statusBadges.push('비공개');
            if (post.rating === 'warning') statusBadges.push('성인물(경고)');
            if (post.rating === 'external') statusBadges.push('성인물(외부링크)');
            if (!post.rating && post.sensitive) statusBadges.push('성인물(경고)');
            const statusHtml = statusBadges.length > 0 ? `<div style="font-size: 0.75rem; color: #e74c3c; font-weight: 500; margin-top: 2px;">${statusBadges.join(' | ')}</div>` : '';

            return `
                <div class="admin-card-item">
                    <div style="position: absolute; top: 14px; right: 1rem; display: flex; gap: 16px; align-items: center; z-index: 5;">
                        <button class="admin-action-btn" onclick="openEditEditor(${post.id})" style="background: transparent; color: #888; padding: 0; font-size: 0.75rem; border: none; cursor: pointer;">수정</button>
                        <button class="admin-action-btn" onclick="deleteCard(${post.id})" style="background: transparent; color: #888; padding: 0; font-size: 0.75rem; border: none; cursor: pointer;">삭제</button>
                    </div>
                    <div class="admin-thumb-preview">
                        ${badge}
                        ${firstImg ? `<img src="${firstImg}" loading="lazy" onerror="this.src=''">` : '<span style="font-size:0.7rem; color:#aaa; display:flex; align-items:center; justify-content:center; height:100%;">없음</span>'}
                    </div>
                    <div class="admin-card-info" style="flex: 1; min-width: 0;">
                        <div class="admin-card-meta" style="font-size: 0.8rem; color: #666; margin-bottom: 2px; font-weight: 500; line-height: 1;">${dateText}</div>
                        <div class="admin-card-tags" style="display: flex; flex-wrap: wrap; gap: 2px; row-gap: 0.2rem; margin-top: 6px;">${tagsHtml}</div>
                        ${statusHtml}
                    </div>
                </div>
            `;
        }).join('');
    }

    renderAdminPagination(targetData.length);
}

function renderAdminPagination(totalItems) {
    const paginationEl = document.getElementById('adminPagination');
    if (!paginationEl) return;

    const totalPages = Math.ceil(totalItems / adminItemsPerPage) || 1;
    
    // [수정] totalPages <= 1 조건문(return)을 제거하여 1페이지만 있어도 페이지네이션이 표시되도록 함

    let html = `<button type="button" class="page-arrow" ${currentAdminPage === 1 ? 'disabled' : ''} data-page="${currentAdminPage - 1}">&lt;</button>`;
    for (let i = 1; i <= totalPages; i++) {
        html += `<button type="button" class="page-num ${i === currentAdminPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
    }
    html += `<button type="button" class="page-arrow" ${currentAdminPage === totalPages ? 'disabled' : ''} data-page="${currentAdminPage + 1}">&gt;</button>`;
    paginationEl.innerHTML = html;

    paginationEl.querySelectorAll('button').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const targetPage = parseInt(e.currentTarget.dataset.page);
            if (!isNaN(targetPage)) {
                currentAdminPage = targetPage;
                renderGrid();
            }
        });
    });
}

function updateRatingStatesBasedOnInputs() {}
function updateOcRatingStatesBasedOnInputs() {}

function getFormState() {
    const warningContentInput = document.getElementById('cardWarningContent');
    const externalLinkInput = document.getElementById('cardExternalLink');
    const warningVal = warningContentInput ? warningContentInput.value.trim() : '';
    const linkVal = externalLinkInput ? externalLinkInput.value.trim() : '';
    
    // name="admin-rating" 라디오 버튼 중 체크된 값 가져오기
    const checkedRating = document.querySelector('input[name="admin-rating"]:checked');
    const ratingVal = checkedRating ? checkedRating.value : 'all';

    return JSON.stringify({
        category: document.getElementById('cardCategory').value,
        tags: document.getElementById('cardTags').value,
        alt: document.getElementById('cardAlt').value,
        date: document.getElementById('cardDate').value,
        images: [...currentImages],
        private: document.getElementById('cardPrivate').checked,
        rating: ratingVal,
        warningContent: warningVal,
        link: linkVal
    });
}

function getOcFormState() {
    const privateEl = document.getElementById('ocPrivate');
    const warningContentInput = document.getElementById('ocWarningContent');
    const warningVal = warningContentInput ? warningContentInput.value.trim() : '';
    
    const checkedRating = document.querySelector('input[name="oc-admin-rating"]:checked');
    const ratingVal = checkedRating ? checkedRating.value : 'all';

    return JSON.stringify({
        name: document.getElementById('ocName') ? document.getElementById('ocName').value : '',
        foreignName: document.getElementById('ocForeignName') ? document.getElementById('ocForeignName').value : '',
        title: document.getElementById('ocTitle') ? document.getElementById('ocTitle').value : '',
        age: document.getElementById('ocAge') ? document.getElementById('ocAge').value : '',
        gender: document.getElementById('ocGender') ? document.getElementById('ocGender').value : '',
        height: document.getElementById('ocHeight') ? document.getElementById('ocHeight').value : '',
        thumbnails: [...currentOcThumbnails],
        portraits: [...currentOcPortraits],
        description: document.getElementById('ocDescription') ? document.getElementById('ocDescription').value : '',
        private: privateEl ? privateEl.checked : false,
        rating: ratingVal,
        warningContent: warningVal
    });
}

function getFavFormState() {
    return JSON.stringify({
        title: document.getElementById('favTitle').value,
        media: document.getElementById('favMedia').value,
        character: document.getElementById('favCharacter').value,
        relation: document.getElementById('favRelation').value
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

function checkOcFormChanges() {
    const saveBtn = document.getElementById('ocSaveBtn');
    if (!saveBtn) return;
    if (getOcFormState() !== initialFormState) {
        saveBtn.removeAttribute('disabled');
        saveBtn.style.opacity = '1';
    } else {
        saveBtn.setAttribute('disabled', 'true');
        saveBtn.style.opacity = '0.5';
    }
}

function checkFavFormChanges() {
    const saveBtn = document.getElementById('favSaveBtn');
    if (!saveBtn) return;
    if (getFavFormState() !== initialFormState) {
        saveBtn.removeAttribute('disabled');
        saveBtn.style.opacity = '1';
    } else {
        saveBtn.setAttribute('disabled', 'true');
        saveBtn.style.opacity = '0.5';
    }
}

window.openEditEditor = function(id) {
    const fanworkForm = document.getElementById('fanworkForm');
    const ocForm = document.getElementById('ocForm');
    const favForm = document.getElementById('favForm');
    const saveBtn = document.getElementById('saveBtn');
    const ocSaveBtn = document.getElementById('ocSaveBtn');
    const favSaveBtn = document.getElementById('favSaveBtn');
    const idDisplay = document.getElementById('editorIdDisplay');

    if (currentSelectedCategory === '1차창작') {
        if (fanworkForm) fanworkForm.style.display = 'none';
        if (ocForm) ocForm.style.display = 'flex';
        if (favForm) favForm.style.display = 'none';
        if (saveBtn) saveBtn.style.display = 'none';
        if (ocSaveBtn) ocSaveBtn.style.display = 'inline-block';
        if (favSaveBtn) favSaveBtn.style.display = 'none';

        const item = profilesData.find(p => p.id === id);
        const ocPrivateEl = document.getElementById('ocPrivate');

        if (item) {
            document.getElementById('editorTitle').innerText = `수정`;
            if (idDisplay) idDisplay.innerText = `(ID: ${id})`;
            window.editingTargetId = item.id;
            
            document.getElementById('ocName').value = item.name || '';
            document.getElementById('ocForeignName').value = item.foreignName || '';
            document.getElementById('ocTitle').value = item.title || '';
            document.getElementById('ocAge').value = item.age || '';
            document.getElementById('ocGender').value = item.gender || '';
            document.getElementById('ocHeight').value = item.height || '';
            currentOcThumbnails = item.thumbnails ? [...item.thumbnails] : (item.thumbnail ? [item.thumbnail] : []);
            currentOcPortraits = item.portraits ? [...item.portraits] : (item.portrait ? [item.portrait] : []);
            renderOcThumbnails();
            renderOcPortraits();
            document.getElementById('ocDescription').value = item.description || '';
            if (ocPrivateEl) ocPrivateEl.checked = !!item.private;

            const warningInput = document.getElementById('ocWarningContent');
            if (warningInput) warningInput.value = item.warningContent || '';
            
            const ratingToSelect = item.rating || 'all';
            const targetRadio = document.querySelector(`input[name="oc-admin-rating"][value="${ratingToSelect}"]`);
            if (targetRadio) targetRadio.checked = true;

        } else {
            document.getElementById('editorTitle').innerText = `새 캐릭터 프로필 추가`;
            const maxId = profilesData.reduce((max, p) => Math.max(max, p.id || 0), 0);
            const newId = maxId + 1;
            if (idDisplay) idDisplay.innerText = `(ID: ${newId})`;
            window.editingTargetId = null;

            if (ocForm) ocForm.reset();
            currentOcThumbnails = item.thumbnails ? [...item.thumbnails] : (item.thumbnail ? [item.thumbnail] : []);
            currentOcPortraits = item.portraits ? [...item.portraits] : (item.portrait ? [item.portrait] : []);
            renderOcThumbnails();
            renderOcPortraits();
            if (ocPrivateEl) ocPrivateEl.checked = false;
            document.querySelector('input[name="oc-admin-rating"][value="all"]').checked = true;
        }

        initialFormState = getOcFormState();
        checkOcFormChanges();
    } else if (currentSelectedCategory === '관심작품') {
        if (fanworkForm) fanworkForm.style.display = 'none';
        if (ocForm) ocForm.style.display = 'none';
        if (favForm) favForm.style.display = 'flex';
        if (saveBtn) saveBtn.style.display = 'none';
        if (ocSaveBtn) ocSaveBtn.style.display = 'none';
        if (favSaveBtn) favSaveBtn.style.display = 'inline-block';

        const item = favsData.find(p => p.id === id);

        if (item) {
            document.getElementById('editorTitle').innerText = `수정`;
            if (idDisplay) idDisplay.innerText = `(ID: ${item.id})`;
            window.editingTargetId = item.id;

            document.getElementById('favTitle').value = item.title || '';
            document.getElementById('favMedia').value = item.media || '';
            document.getElementById('favCharacter').value = item.character || '';
            document.getElementById('favRelation').value = item.relation || '';
        } else {
            document.getElementById('editorTitle').innerText = `새 관심 작품 추가`;
            const maxId = favsData.reduce((max, p) => Math.max(max, p.id || 0), 0);
            const newId = maxId + 1;
            if (idDisplay) idDisplay.innerText = `(ID: ${newId})`;
            window.editingTargetId = null;

            if (favForm) favForm.reset();
        }

        initialFormState = getFavFormState();
        checkFavFormChanges();
    } else {
        if (ocForm) ocForm.style.display = 'none';
        if (favForm) favForm.style.display = 'none';
        if (fanworkForm) fanworkForm.style.display = 'flex';
        if (ocSaveBtn) ocSaveBtn.style.display = 'none';
        if (favSaveBtn) favSaveBtn.style.display = 'none';
        if (saveBtn) saveBtn.style.display = 'inline-block';

        const post = fanworksData.find(p => p.id === id);
        const cardPrivateEl = document.getElementById('cardPrivate');
        const externalLinkInput = document.getElementById('cardExternalLink');
        const warningContentInput = document.getElementById('cardWarningContent');

        if (post) {
            document.getElementById('editorTitle').innerText = `수정`;
            if (idDisplay) idDisplay.innerText = `(ID: ${post.id})`;
            window.editingTargetId = post.id;

            document.getElementById('cardCategory').value = post.category || currentSelectedCategory;
            document.getElementById('cardTags').value = (post.tags || []).join(', ');
            document.getElementById('cardAlt').value = post.alt || '';
            document.getElementById('cardDate').value = post.date || '';
            if (cardPrivateEl) cardPrivateEl.checked = !!post.private;
            
            if (warningContentInput) warningContentInput.value = post.warningContent || '';
            if (externalLinkInput) externalLinkInput.value = post.link || '';
            
            // rating 값에 따라 올바른 라디오 버튼 체크 (all, warning, external)
            const ratingToSelect = post.rating || (post.sensitive ? 'warning' : 'all');
            const targetRadio = document.querySelector(`input[name="admin-rating"][value="${ratingToSelect}"]`);
            if (targetRadio) {
                targetRadio.checked = true;
            } else {
                document.getElementById('cardRadioAll').checked = true;
            }

            currentImages = post.images ? [...post.images] : (post['thumbnail-image'] ? [post['thumbnail-image']] : []);
        } else {
            document.getElementById('editorTitle').innerText = `새 카드 추가`;
            const maxId = fanworksData.reduce((max, p) => Math.max(max, p.id || 0), 0);
            const newId = maxId + 1;
            if (idDisplay) idDisplay.innerText = `(ID: ${newId})`;
            window.editingTargetId = null;

            document.getElementById('cardCategory').value = currentSelectedCategory || '2차창작';
            document.getElementById('cardTags').value = '';
            document.getElementById('cardAlt').value = '';
            document.getElementById('cardDate').value = new Date().toISOString().split('T')[0];
            if (cardPrivateEl) cardPrivateEl.checked = false;
            if (warningContentInput) warningContentInput.value = '';
            if (externalLinkInput) externalLinkInput.value = '';
            document.getElementById('cardRadioAll').checked = true;

            currentImages = [];
        }

        renderImages();
        syncFilterStateFromInput();
        initialFormState = getFormState();
        checkFormChanges();
    }
    
    const editorInner = document.getElementById('editorPaneInner');
    const editorPlaceholder = document.getElementById('editorPanePlaceholder');
    if (editorInner) editorInner.style.display = 'flex';
    if (editorPlaceholder) editorPlaceholder.style.display = 'none';
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

let currentOrderCategory = null;
let tempOrderData = []; 

window.openOrderModal = function() {
    const activeCategory = currentSelectedCategory ? currentSelectedCategory.replace(/\s+/g, '') : '';
    if (activeCategory === '2차창작' || !activeCategory) return;
    
    currentOrderCategory = activeCategory;
    const targetData = (currentOrderCategory === '1차창작') ? profilesData : favsData;
    tempOrderData = [...targetData];

    const modal = document.getElementById('orderModal');
    const titleEl = document.getElementById('orderModalTitle');

    if (!modal) return;
    if (titleEl) titleEl.innerText = '정렬';

    renderOrderList();
    modal.classList.add('active');
};

window.closeOrderModal = function() {
    const modal = document.getElementById('orderModal');
    if (modal) modal.classList.remove('active');
    currentOrderCategory = null;
    tempOrderData = [];
};

function renderOrderList() {
    const container = document.getElementById('orderListContainer');
    if (!container) return;

    if (!tempOrderData || tempOrderData.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:#888; padding:1rem;">항목이 없습니다.</p>';
        return;
    }

    container.innerHTML = tempOrderData.map((item, index) => {
        const label = currentOrderCategory === '1차창작' 
            ? `${item.name || '무명'} (${item.title || '칭호 없음'})` 
            : item.title || '제목 없음';

        return `
            <div class="tag-edit-row" draggable="true" data-index="${index}" style="display: flex; align-items: center; justify-content: space-between; background: #fff; padding: 8px 12px; border: 1px solid #eee; border-radius: 4px; cursor: move;">
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="font-size: 0.9rem; font-weight: 500;">${label}</span>
                </div>
                <div style="display: flex; gap: 4px;" onclick="event.stopPropagation()">
                    <button type="button" class="dark-btn" onclick="moveOrderItem(${index}, -1)" ${index === 0 ? 'disabled style="opacity:0.3; cursor:not-allowed;"' : 'style="cursor:pointer;"'}>▲</button>
                    <button type="button" class="dark-btn" onclick="moveOrderItem(${index}, 1)" ${index === tempOrderData.length - 1 ? 'disabled style="opacity:0.3; cursor:not-allowed;"' : 'style="cursor:pointer;"'}>▼</button>
                </div>
            </div>
        `;
    }).join('');

    let draggedIndex = null;
    const rows = container.querySelectorAll('.tag-edit-row');
    rows.forEach(row => {
        row.addEventListener('dragstart', (e) => {
            draggedIndex = parseInt(row.dataset.index);
            e.dataTransfer.effectAllowed = 'move';
            row.style.opacity = '0.5';
        });

        row.addEventListener('dragend', () => {
            row.style.opacity = '1';
        });

        row.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
        });

        row.addEventListener('drop', (e) => {
            e.preventDefault();
            const targetIndex = parseInt(row.dataset.index);
            if (draggedIndex !== null && draggedIndex !== targetIndex) {
                const movedItem = tempOrderData.splice(draggedIndex, 1)[0];
                tempOrderData.splice(targetIndex, 0, movedItem);
                renderOrderList();
            }
        });
    });
}

window.moveOrderItem = function(index, direction) {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= tempOrderData.length) return;

    const temp = tempOrderData[index];
    tempOrderData[index] = tempOrderData[newIndex];
    tempOrderData[newIndex] = temp;

    renderOrderList();
};

window.applyOrderChanges = function() {
    const updatedData = tempOrderData.map((item, index) => ({
        ...item,
        order: index
    }));

    if (currentOrderCategory === '1차창작') {
        profilesData = updatedData;
    } else if (currentOrderCategory === '관심작품') {
        favsData = updatedData;
    }

    renderGrid(); 
    closeOrderModal(); 
};

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

    const activeWorks = editingWorks.filter(w => modalWorkEyeStates[w.name]);
    const charsToShow = [];

    if (activeWorks.length > 0) {
        activeWorks.forEach(w => {
            w.characters.forEach(c => {
                const isRel = c.name.includes('+') || c.name.includes('x');
                if (!isRel && !charsToShow.some(item => item.name === c.name)) {
                    charsToShow.push(c);
                }
            });
        });
    }

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

    const activeCharNames = editingWorks.flatMap(w => w.characters).filter(c => modalCharEyeStates[c.name]).map(c => c.name);

    const relsToShow = new Set();
    if (activeCharNames.length > 0) {
        activeWorks.forEach(w => {
            w.characters.forEach(c => {
                if (c.relations) {
                    c.relations.forEach(rel => {
                        relsToShow.add(rel);
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

window.applyTagHierarchyModal = function() {
    tagsData.works = editingWorks;
    document.getElementById('tagEditModal').classList.remove('active');
    renderAdminTagSelector();

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

function renderImages() {
    const listEl = document.getElementById('imageList');
    if (!listEl) return;
    listEl.innerHTML = currentImages.map((img, idx) => `
        <div class="image-item" style="position: relative;">
            <div class="image-item-index">${idx + 1}</div>
            <img src="${img}" loading="lazy" style="width: 100%; height: 100%; object-fit: cover;">
            <div class="remove-btn" onclick="removeImage(${idx})">✕</div>
        </div>
    `).join('');
    checkFormChanges();
}
window.addOcThumbnailImage = function() {
    const inputEl = document.getElementById('ocNewThumbnailInput');
    const filename = inputEl ? inputEl.value.trim() : '';
    if (filename) {
        const fullPath = `assets/images/ocs/${filename.replace(/\.[^/.]+$/, '')}.webp`;
        currentOcThumbnails.push(fullPath);
        inputEl.value = ''; // 입력칸 리셋
        renderOcThumbnails();
        checkOcFormChanges();
    } else {
        alert('파일명을 입력해주세요.');
    }
};

window.removeOcThumbnailImage = function(idx) {
    currentOcThumbnails.splice(idx, 1);
    renderOcThumbnails();
    checkOcFormChanges();
};

function renderOcThumbnails() {
    const listEl = document.getElementById('ocThumbnailList');
    if (!listEl) return;
    listEl.innerHTML = currentOcThumbnails.map((img, idx) => `
        <div class="image-item" style="position: relative;">
            <div class="image-item-index">${idx + 1}</div>
            <img src="${img}" loading="lazy" style="width: 100%; height: 100%; object-fit: cover;">
            <div class="remove-btn" onclick="removeOcThumbnailImage(${idx})">✕</div>
        </div>
    `).join('');
}

window.addOcPortraitImage = function() {
    const inputEl = document.getElementById('ocNewPortraitInput');
    const filename = inputEl ? inputEl.value.trim() : '';
    if (filename) {
        const fullPath = `assets/images/ocs/${filename.replace(/\.[^/.]+$/, '')}.webp`;
        currentOcPortraits.push(fullPath);
        inputEl.value = ''; // 입력칸 리셋
        renderOcPortraits();
        checkOcFormChanges();
    } else {
        alert('파일명을 입력해주세요.');
    }
};

window.removeOcPortraitImage = function(idx) {
    currentOcPortraits.splice(idx, 1);
    renderOcPortraits();
    checkOcFormChanges();
};

function renderOcPortraits() {
    const listEl = document.getElementById('ocPortraitList');
    if (!listEl) return;
    listEl.innerHTML = currentOcPortraits.map((img, idx) => `
        <div class="image-item" style="position: relative;">
            <div class="image-item-index">${idx + 1}</div>
            <img src="${img}" loading="lazy" style="width: 100%; height: 100%; object-fit: cover;">
            <div class="remove-btn" onclick="removeOcPortraitImage(${idx})">✕</div>
        </div>
    `).join('');
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

    ['cardAlt', 'cardDate', 'cardPrivate', 'cardWarningContent', 'cardExternalLink'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('input', checkFormChanges);
            el.addEventListener('change', checkFormChanges);
        }
    });

    ['ocName', 'ocForeignName', 'ocTitle', 'ocAge', 'ocGender', 'ocHeight', 'ocThumbnail', 'ocPortrait', 'ocDescription', 'ocPrivate', 'ocWarningContent'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('input', checkOcFormChanges);
            el.addEventListener('change', checkOcFormChanges);
        }
    });

    ['favTitle', 'favMedia', 'favCharacter', 'favRelation'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('input', checkFavFormChanges);
            el.addEventListener('change', checkFavFormChanges);
        }
    });

    // 라디오 버튼 수동 클릭 변경 감지 이벤트 추가
    document.querySelectorAll('input[name="admin-rating"]').forEach(radio => {
        radio.addEventListener('change', () => {
            checkFormChanges();
        });
    });

    document.querySelectorAll('input[name="oc-admin-rating"]').forEach(radio => {
        radio.addEventListener('change', () => {
            checkOcFormChanges();
        });
    });

    const fanworkForm = document.getElementById('fanworkForm');
    if (fanworkForm) {
        fanworkForm.onsubmit = (e) => {
            e.preventDefault();
            const checkedRating = document.querySelector('input[name="admin-rating"]:checked');
            const selectedRating = checkedRating ? checkedRating.value : 'all';
            const warningVal = document.getElementById('cardWarningContent') ? document.getElementById('cardWarningContent').value.trim() : '';
            const linkVal = document.getElementById('cardExternalLink') ? document.getElementById('cardExternalLink').value.trim() : '';

            const fanworkData = {
                id: window.editingTargetId !== null ? window.editingTargetId : (fanworksData.reduce((max, p) => Math.max(max, p.id || 0), 0) + 1),
                category: document.getElementById('cardCategory').value,
                tags: document.getElementById('cardTags').value.split(',').map(t => t.trim()).filter(Boolean),
                alt: document.getElementById('cardAlt').value,
                date: document.getElementById('cardDate').value,
                private: document.getElementById('cardPrivate').checked,
                rating: selectedRating,
                warningContent: warningVal,
                link: linkVal,
                sensitive: (selectedRating === 'warning' || selectedRating === 'external'),
                status: "public"
            };

            if (currentImages.length > 0) {
                fanworkData['thumbnail-image'] = currentImages[0];
                if (currentImages.length > 1) {
                    fanworkData.images = [...currentImages];
                }
            }

            const existingIdx = fanworksData.findIndex(p => p.id === fanworkData.id);
            if (existingIdx !== -1) {
                fanworksData[existingIdx] = fanworkData;
            } else {
                fanworksData.unshift(fanworkData);
            }

            window.editingTargetId = null;
            closeEditor();
            renderGrid();
        };
    }

    const ocForm = document.getElementById('ocForm');
    if (ocForm) {
        ocForm.onsubmit = (e) => {
            e.preventDefault();
            const formatOcImgPath = (val) => {
                if (!val) return '';
                const cleanName = val.trim().replace(/^assets\/images\/ocs\//, '').replace(/\.[^/.]+$/, '');
                return `assets/images/ocs/${cleanName}.webp`;
            };

            const checkedOcRating = document.querySelector('input[name="oc-admin-rating"]:checked');
            const selectedOcRating = checkedOcRating ? checkedOcRating.value : 'all';
            const warningVal = document.getElementById('ocWarningContent') ? document.getElementById('ocWarningContent').value.trim() : '';

            const ocData = {
                id: window.editingTargetId !== null ? window.editingTargetId : (profilesData.reduce((max, p) => Math.max(max, p.id || 0), 0) + 1),
                name: document.getElementById('ocName').value,
                foreignName: document.getElementById('ocForeignName').value,
                title: document.getElementById('ocTitle').value,
                age: document.getElementById('ocAge').value,
                gender: document.getElementById('ocGender').value,
                height: document.getElementById('ocHeight').value,
                thumbnail: currentOcThumbnails.length > 0 ? currentOcThumbnails[0] : '',
                thumbnails: currentOcThumbnails,
                portrait: currentOcPortraits.length > 0 ? currentOcPortraits[0] : '',
                portraits: currentOcPortraits,
                description: document.getElementById('ocDescription').value,
                private: document.getElementById('ocPrivate').checked,
                rating: selectedOcRating,
                warningContent: warningVal,
                sensitive: (selectedOcRating === 'warning')
            };

            const existingIdx = profilesData.findIndex(p => p.id === ocData.id);
            if (existingIdx !== -1) {
                profilesData[existingIdx] = ocData;
            } else {
                profilesData.unshift(ocData);
                profilesData.forEach((item, index) => {
                    item.order = index;
                });
            }

            window.editingTargetId = null;
            closeEditor();
            renderGrid();
        };
    }

    const favForm = document.getElementById('favForm');
    if (favForm) {
        favForm.onsubmit = (e) => {
            e.preventDefault();
            const favData = {
                id: window.editingTargetId !== null ? window.editingTargetId : (favsData.reduce((max, p) => Math.max(max, p.id || 0), 0) + 1),
                title: document.getElementById('favTitle').value,
                media: document.getElementById('favMedia').value,
                character: document.getElementById('favCharacter').value,
                relation: document.getElementById('favRelation').value
            };

            const existingIdx = favsData.findIndex(p => p.id === favData.id);
            if (existingIdx !== -1) {
                favsData[existingIdx] = favData;
            } else {
                favsData.unshift(favData);
                favsData.forEach((item, index) => {
                    item.order = index;
                });
            }

            window.editingTargetId = null;
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

window.addEventListener('beforeunload', (e) => {
    const isFanworkChanged = (document.getElementById('fanworkForm')?.style.display !== 'none') && (getFormState() !== initialFormState);
    const isOcChanged = (document.getElementById('ocForm')?.style.display !== 'none') && (getOcFormState() !== initialFormState);
    const isFavChanged = (document.getElementById('favForm')?.style.display !== 'none') && (getFavFormState() !== initialFormState);

    if (isFanworkChanged || isOcChanged || isFavChanged) {
        e.preventDefault();
        e.returnValue = ''; 
    }
});

window.deleteCard = function(id) {
    if (confirm('정말 이 항목을 삭제하시겠습니까?')) {
        if (currentSelectedCategory === '1차창작') {
            profilesData = profilesData.filter(p => p.id !== id);
        } else if (currentSelectedCategory === '관심작품') {
            favsData = favsData.filter(p => p.id !== id);
        } else {
            fanworksData.splice(fanworksData.findIndex(p => p.id === id), 1);
        }
        renderGrid();
    }
};

window.downloadJson = function() {
    const fanworksStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(fanworksData, null, 4));
    const a = document.createElement('a');
    a.setAttribute("href", fanworksStr);
    a.setAttribute("download", "fanworks.json");
    document.body.appendChild(a);
    a.click();
    a.remove();
};

window.downloadProfileJson = function() {
    const profilesStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(profilesData, null, 4));
    const a = document.createElement('a');
    a.setAttribute("href", profilesStr);
    a.setAttribute("download", "profiles.json");
    document.body.appendChild(a);
    a.click();
    a.remove();
};

window.downloadFavsJson = function() {
    const favsStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(favsData, null, 4));
    const a = document.createElement('a');
    a.setAttribute("href", favsStr);
    a.setAttribute("download", "favs.json");
    document.body.appendChild(a);
    a.click();
    a.remove();
};