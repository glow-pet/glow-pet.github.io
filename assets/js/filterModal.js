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
                    <div class="filter-modal-content">
                        <div class="filter-modal-header">
                            <h3>필터</h3>
                            <button type="button" id="filter-modal-close-btn" class="filter-close-btn">&times;</button>
                        </div>
                        <div class="filter-columns-wrapper" id="filterColumnsArea">
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
                        <!-- 상호작용 가능한 민감한 콘텐츠 토글 스위치 -->
                        <div style="margin-top: 1rem; border-top: 1px solid #eaeaea; padding-top: 1rem; display: flex; justify-content: space-between; align-items: center;">
                            <span style="font-size: 0.9rem; font-weight: 600; color: #333;">민감한 콘텐츠 표시</span>
                            <label class="switch" style="position: relative; display: inline-block; width: 40px; height: 22px; cursor: pointer;">
                                <input type="checkbox" id="filterSensitiveSwitch" style="opacity: 0; width: 0; height: 0;">
                                <span class="slider" style="position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #ccc; transition: .4s; border-radius: 22px;"></span>
                            </label>
                        </div>
                        <div class="filter-modal-footer">
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
        if (this.options.hideTags) return;
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