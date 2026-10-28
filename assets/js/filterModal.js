// assets/js/filterModal.js
export class TagFilterModal {
    constructor(onApplyCallback, options = {}) {
        this.onApplyCallback = onApplyCallback;
        this.filterState = {}; 
        this.options = options;
        this.allPosts = [];
        this.showSensitive = false;

        this.initDOM();
        this.initEvents();
    }

    initDOM() {
        if (!document.getElementById('tag-filter-modal')) {
            const modalHTML = `
                <div id="tag-filter-modal" class="filter-modal-overlay" style="display: none;">
                    <div class="filter-modal-content" style="padding: 1.5rem; display: flex; flex-direction: column;">
                        <div class="filter-modal-header" style="color: #fff; padding-bottom: 0.8rem; border-bottom: 1px solid #222;">
                            <h3>필터</h3>
                            <button type="button" id="filter-modal-close-btn" class="filter-close-btn">&times;</button>
                        </div>
                        <!-- 태그 컬럼 영역 -->
                        <div class="filter-columns-wrapper" id="filterColumnsArea" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; padding: 1.2rem 0; overflow-y: auto; flex-grow: 1;">
                            <div class="filter-col">
                                <h4>작품</h4>
                                <div id="filter-col-work" class="filter-item-list"></div>
                            </div>
                            <div class="filter-col">
                                <h4>캐릭터</h4>
                                <div id="filter-col-char" class="filter-item-list"></div>
                            </div>
                            <div class="filter-col">
                                <h4>관계</h4>
                                <div id="filter-col-rel" class="filter-item-list"></div>
                            </div>
                        </div>
                        <!-- 공통 구분선 및 민감한 콘텐츠 스위치 영역 -->
                        <div id="filterBottomSection" style="border-top: 1px solid #eaeaea; padding-top: 1.2rem; margin-top: 0.5rem; display: flex; align-items: center; gap: 1rem;">
                            <label class="switch">
                                <input type="checkbox" id="filterSensitiveSwitch">
                                <span class="slider"></span>
                            </label>
                            <span style="font-size: 0.9rem; font-weight: 600; color: #333; cursor: pointer;" onclick="document.getElementById('filterSensitiveSwitch').click();">민감한 콘텐츠</span>
                        </div>
                        <div class="filter-modal-footer" style="border-top: none; padding-top: 1.2rem; display: flex; justify-content: flex-end; margin-bottom: 0;">
                            <button type="button" id="filter-modal-apply-btn" class="filter-apply-btn">확인</button>
                        </div>
                    </div>
                </div>
            `;
            document.body.insertAdjacentHTML('beforeend', modalHTML);
        }

        this.modal = document.getElementById('tag-filter-modal');
        this.closeBtn = document.getElementById('filter-modal-close-btn');
        this.applyBtn = document.getElementById('filter-modal-apply-btn');
        this.workListEl = document.getElementById('filter-col-work');
        this.charListEl = document.getElementById('filter-col-char');
        this.relListEl = document.getElementById('filter-col-rel');
        this.sensitiveToggle = document.getElementById('filterSensitiveSwitch');
        this.columnsArea = document.getElementById('filterColumnsArea');
        this.bottomSection = document.getElementById('filterBottomSection');
    }

    initEvents() {
        this.closeBtn.addEventListener('click', () => this.close());
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) this.close();
        });
        this.applyBtn.addEventListener('click', () => {
            this.showSensitive = this.sensitiveToggle ? this.sensitiveToggle.checked : false;
            this.onApplyCallback(this.filterState, { showSensitive: this.showSensitive });
            this.close();
        });
    }

    open() {
        this.modal.style.display = 'flex';
    }

    close() {
        this.modal.style.display = 'none';
    }

    renderTags(posts) {
        if (this.options.hideTags) {
            // ocs.html: 태그 영역 자체를 완전히 숨겨서 공간을 차지하지 않도록 처리
            if (this.columnsArea) this.columnsArea.style.display = 'none';
            // 태그가 없을 때는 상단 구분선을 제거하고 상단 여백만 깔끔하게 부여
            if (this.bottomSection) {
                this.bottomSection.style.borderTop = 'none';
                this.bottomSection.style.paddingTop = '0.5rem';
                this.bottomSection.style.marginTop = '1rem';
            }
            return;
        }

        // fanworks.html: 태그 영역 표시 및 표준 구분선 적용
        if (this.columnsArea) this.columnsArea.style.display = 'grid';
        if (this.bottomSection) {
            this.bottomSection.style.borderTop = '1px solid #eaeaea';
            this.bottomSection.style.paddingTop = '1.2rem';
            this.bottomSection.style.marginTop = '0.5rem';
        }

        this.allPosts = posts || [];
        const works = new Set();

        this.allPosts.forEach(p => {
            const tags = p.tags || [];
            if (tags.length > 0) {
                works.add(tags[0]);
            }
        });

        const sortedWorks = Array.from(works).sort((a, b) => a.localeCompare(b, 'ko'));
        this.populateWorkColumn(sortedWorks);
        this.renderSubColumns();
    }

    populateWorkColumn(workList) {
        this.workListEl.innerHTML = '';
        workList.forEach(tag => {
            const row = document.createElement('div');
            row.className = 'filter-row-item';

            const label = document.createElement('span');
            label.textContent = tag;
            label.className = 'filter-tag-label';

            const checkbox = document.createElement('button');
            checkbox.type = 'button';
            checkbox.className = 'tri-state-checkbox';
            checkbox.dataset.tag = tag;
            
            const currentState = this.filterState[tag] || 'none';
            checkbox.dataset.state = currentState;

            if (currentState === 'include') {
                checkbox.textContent = '✔';
                checkbox.classList.add('include');
            } else if (currentState === 'exclude') {
                checkbox.textContent = '✕';
                checkbox.classList.add('exclude');
            } else {
                checkbox.textContent = '';
            }

            checkbox.addEventListener('click', () => {
                this.cycleWorkState(checkbox, tag, workList);
            });

            row.appendChild(label);
            row.appendChild(checkbox);
            this.workListEl.appendChild(row);
        });
    }

    cycleWorkState(btn, tag, workList) {
        const currentState = btn.dataset.state;

        if (currentState === 'none') {
            btn.dataset.state = 'include';
            btn.textContent = '✔';
            btn.classList.add('include');
            btn.classList.remove('exclude');
            this.filterState[tag] = 'include';
        } else if (currentState === 'include') {
            btn.dataset.state = 'exclude';
            btn.textContent = '✕';
            btn.classList.add('exclude');
            btn.classList.remove('include');
            this.filterState[tag] = 'exclude';
        } else {
            btn.dataset.state = 'none';
            btn.textContent = '';
            btn.classList.remove('include', 'exclude');
            delete this.filterState[tag];
        }

        this.renderSubColumns();
    }

    renderSubColumns() {
        const includedWorks = Object.keys(this.filterState).filter(tag => {
            const isWork = Array.from(this.workListEl.querySelectorAll('.tri-state-checkbox')).some(el => el.dataset.tag === tag);
            return isWork && this.filterState[tag] === 'include';
        });

        if (includedWorks.length === 0) {
            this.charListEl.innerHTML = '<p style="color:#aaa; font-size:0.85rem;">장르를 "포함(✔)" 상태로 선택해주세요.</p>';
            this.relListEl.innerHTML = '<p style="color:#aaa; font-size:0.85rem;">장르를 "포함(✔)" 상태로 선택해주세요.</p>';
            return;
        }

        const characters = new Set();
        const relationships = new Set();

        this.allPosts.forEach(p => {
            const tags = p.tags || [];
            if (tags.length > 0 && includedWorks.includes(tags[0])) {
                tags.slice(1).forEach(t => {
                    if (t.includes('x')) {
                        relationships.add(t);
                    } else {
                        characters.add(t);
                    }
                });
            }
        });

        const sortedChars = Array.from(characters).sort((a, b) => a.localeCompare(b, 'ko'));
        const sortedRels = Array.from(relationships).sort((a, b) => a.localeCompare(b, 'ko'));

        this.populateTriStateColumn(this.charListEl, sortedChars);
        this.populateTriStateColumn(this.relListEl, sortedRels);
    }

    populateTriStateColumn(container, tagList) {
        container.innerHTML = '';
        if (tagList.length === 0) {
            container.innerHTML = '<p style="color:#aaa; font-size:0.85rem;">해당 태그가 없습니다.</p>';
            return;
        }

        tagList.forEach(tag => {
            const row = document.createElement('div');
            row.className = 'filter-row-item';

            const label = document.createElement('span');
            label.textContent = tag;
            label.className = 'filter-tag-label';

            const checkbox = document.createElement('button');
            checkbox.type = 'button';
            checkbox.className = 'tri-state-checkbox';
            checkbox.dataset.tag = tag;
            
            const currentState = this.filterState[tag] || 'none';
            checkbox.dataset.state = currentState;

            if (currentState === 'include') {
                checkbox.textContent = '✔';
                checkbox.classList.add('include');
            } else if (currentState === 'exclude') {
                checkbox.textContent = '✕';
                checkbox.classList.add('exclude');
            } else {
                checkbox.textContent = '';
            }

            checkbox.addEventListener('click', () => {
                this.cycleState(checkbox, tag);
            });

            row.appendChild(label);
            row.appendChild(checkbox);
            container.appendChild(row);
        });
    }

    cycleState(btn, tag) {
        const currentState = btn.dataset.state;

        if (currentState === 'none') {
            btn.dataset.state = 'include';
            btn.textContent = '✔';
            btn.classList.add('include');
            btn.classList.remove('exclude');
            this.filterState[tag] = 'include';
        } else if (currentState === 'include') {
            btn.dataset.state = 'exclude';
            btn.textContent = '✕';
            btn.classList.add('exclude');
            btn.classList.remove('include');
            this.filterState[tag] = 'exclude';
        } else {
            btn.dataset.state = 'none';
            btn.textContent = '';
            btn.classList.remove('include', 'exclude');
            delete this.filterState[tag];
        }
    }
}