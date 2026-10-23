// assets/js/filterModal.js

export class TagFilterModal {
    constructor(onApplyCallback) {
        this.onApplyCallback = onApplyCallback;
        this.filterState = {}; // { tagName: 'include' | 'exclude' }
        this.allPosts = [];

        this.initDOM();
        this.initEvents();
    }

    initDOM() {
        if (!document.getElementById('tag-filter-modal')) {
            const modalHTML = `
                <div id="tag-filter-modal" class="filter-modal-overlay" style="display: none;">
                    <div class="filter-modal-content">
                        <div class="filter-modal-header">
                            <h3>태그 필터</h3>
                            <button type="button" id="filter-modal-close-btn" class="filter-close-btn">&times;</button>
                        </div>
                        <div class="filter-columns-wrapper">
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
    }

    initEvents() {
        this.closeBtn.addEventListener('click', () => this.close());
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) this.close();
        });
        this.applyBtn.addEventListener('click', () => {
            this.onApplyCallback(this.filterState);
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
        this.allPosts = posts || [];
        const works = new Set();

        this.allPosts.forEach(p => {
            const tags = p.tags || [];
            if (tags.length > 0) {
                works.add(tags[0]);
            }
        });

        // 가나다 오름차순 정렬
        const sortedWorks = Array.from(works).sort((a, b) => a.localeCompare(b, 'ko'));
        this.populateWorkColumn(sortedWorks);
        this.renderSubColumns();
    }

    // 1열(작품): Tri-state 체크박스 적용
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
            // 장르가 제외로 바뀌면 하위 캐릭터/관계 선택도 초기화 또는 숨김 처리 필요 시 대응 가능
        } else {
            btn.dataset.state = 'none';
            btn.textContent = '';
            btn.classList.remove('include', 'exclude');
            delete this.filterState[tag];
        }

        // 장르 상태가 바뀔 때마다 하위 2, 3열 렌더링 갱신
        this.renderSubColumns();
    }

    // 장르(작품) 중 '포함(include)' 상태인 항목이 정확히 1개 이상 있을 때만 캐릭터와 관계 열을 활성화/표시
    renderSubColumns() {
        // 현재 'include' 상태인 장르들 추출
        const includedWorks = Object.keys(this.filterState).filter(tag => {
            // 이 태그가 작품(1열)에 속하는지 확인
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

        // 포함된 장르들에 속한 카드들로부터 캐릭터 및 관계 태그 수집
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

        // 가나다 오름차순 정렬
        const sortedChars = Array.from(characters).sort((a, b) => a.localeCompare(b, 'ko'));
        const sortedRels = Array.from(relationships).sort((a, b) => a.localeCompare(b, 'ko'));

        this.populateTriStateColumn(this.charListEl, sortedChars);
        this.populateTriStateColumn(this.relListEl, sortedRels);
    }

    // 2, 3열(캐릭터, 관계): Tri-state 체크박스 열 생성
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