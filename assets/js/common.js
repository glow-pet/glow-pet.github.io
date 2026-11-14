// assets/js/common.js

// 1. <head> 필수 CSS 동적 주입
if (!document.querySelector('link[href*="styles.css"]')) {
    const isPagesFolder = window.location.pathname.includes('/pages/');
    const cssPath = isPagesFolder ? '../assets/css/styles.css' : 'assets/css/styles.css';

    const metaCharset = document.createElement('meta');
    metaCharset.setAttribute('charset', 'UTF-8');
    
    const metaView = document.createElement('meta');
    metaView.setAttribute('name', 'viewport');
    metaView.setAttribute('content', 'width=device-width, initial-scale=1.0');
    
    const linkCss = document.createElement('link');
    linkCss.setAttribute('rel', 'stylesheet');
    linkCss.setAttribute('href', cssPath);

    document.head.appendChild(metaCharset);
    document.head.appendChild(metaView);
    document.head.appendChild(linkCss);
}

// 2. 통합 레이아웃 컴포넌트
class CommonLayout extends HTMLElement {
    connectedCallback() {
        const originalChildren = Array.from(this.childNodes);
        const isPagesFolder = window.location.pathname.includes('/pages/');

        // 루트 경로 및 하위 pages 폴더 경로 설정
        const indexPath = isPagesFolder ? '../index.html' : 'index.html';
        const worldsPath = isPagesFolder ? 'worlds.html' : 'pages/worlds.html';
        const ocsPath = isPagesFolder ? 'ocs.html' : 'pages/ocs.html';
        const fanworksPath = isPagesFolder ? 'fanworks.html' : 'pages/fanworks.html';
        const favsPath = isPagesFolder ? 'favs.html' : 'pages/favs.html';

        // 네비게이션 메뉴 구조 (하위 요소가 필요한 경우 children 추가)
        const navItems = [
            { name: '홈', href: indexPath },
            {
                name: '1차 창작',
                href: ocsPath,
                children: [
                    { name: '세계관', href: worldsPath },
                    { name: 'OC', href: ocsPath }
                ]                
            },
            {
                name: '2차 창작',
                href: fanworksPath,
                children: [
                    { name: '관심 작품', href: favsPath },
                    { name: '갤러리', href: fanworksPath }
                ]                
            }
        ];

        const navLinksHTML = navItems.map(item => {
            const hasChildren = item.children && item.children.length > 0;
            return `
                <li class="${hasChildren ? 'has-children' : ''}" data-name="${item.name}">
                    <a href="${item.href}" ${hasChildren ? 'data-has-children="true"' : ''}>${item.name}</a>
                </li>
            `;
        }).join('');

        this.innerHTML = `
            <div class="nav-dim-overlay"></div>
            <nav class="navbar" style="display: flex; justify-content: space-between; align-items: center; position: sticky; top: 0;">
                <button class="sidebar-toggle-btn" aria-label="메뉴 열기/닫기">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="3" y1="12" x2="21" y2="12"></line>
                        <line x1="3" y1="6" x2="21" y2="6"></line>
                        <line x1="3" y1="18" x2="21" y2="18"></line>
                    </svg>
                </button>
                <div class="logo"><a href="${indexPath}"></a></div>
                <div class="nav-links-wrapper" style="position: absolute; left: 50%; transform: translateX(-50%);">
                    <button class="sidebar-close-btn" aria-label="메뉴 닫기">✕</button>
                    <ul class="nav-links">
                        ${navLinksHTML}
                    </ul>
                </div>
                <!-- 드롭다운 패널 -->
                <div class="nav-dropdown-pane">
                    <div class="nav-dropdown-inner"></div>
                </div>
            </nav>

            <div class="content-body"></div>

            <footer class="footer">
                <p>© 2026. All rights reserved.</p>
            </footer>
        `;

        const mainContent = this.querySelector('.content-body');
        originalChildren.forEach(node => {
            mainContent.appendChild(node);
        });

        this.updateTitle();
        this.setActiveNav();
        this.initSidebar();
        this.initDropdownMenu(navItems);

        if (typeof window.loadGallery === 'function') {
            window.loadGallery();
        }
    }

    initSidebar() {
        const toggleBtn = this.querySelector('.sidebar-toggle-btn');
        const closeBtn = this.querySelector('.sidebar-close-btn');
        const navWrapper = this.querySelector('.nav-links-wrapper');

        if (toggleBtn && navWrapper) {
            toggleBtn.addEventListener('click', () => {
                navWrapper.classList.toggle('active');
            });
        }
        if (closeBtn && navWrapper) {
            closeBtn.addEventListener('click', () => {
                navWrapper.classList.remove('active');
            });
        }
    }

    initDropdownMenu(navItems) {
        const navLinks = this.querySelectorAll('.nav-links a');
        const dropdownPane = this.querySelector('.nav-dropdown-pane');
        const dropdownInner = this.querySelector('.nav-dropdown-inner');
        const dimOverlay = this.querySelector('.nav-dim-overlay');
        const navbar = this.querySelector('.navbar');

        const closeDropdown = () => {
            dropdownPane.classList.remove('active');
            dimOverlay.classList.remove('active');
            navLinks.forEach(l => l.classList.remove('dropdown-open'));
        };

        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                const parentLi = link.closest('li');
                const itemName = parentLi.getAttribute('data-name');
                const matchedItem = navItems.find(item => item.name === itemName);

                if (matchedItem && matchedItem.children && matchedItem.children.length > 0) {
                    e.preventDefault();
                    
                    if (dropdownPane.classList.contains('active') && link.classList.contains('dropdown-open')) {
                        closeDropdown();
                        return;
                    }

                    navLinks.forEach(l => l.classList.remove('dropdown-open'));
                    link.classList.add('dropdown-open');

                    // 하위 요소 리스트 렌더링 (세로 방향)
                    dropdownInner.innerHTML = `
                        <ul class="nav-sub-list">
                            ${matchedItem.children.map(child => `<li><a href="${child.href}">${child.name}</a></li>`).join('')}
                        </ul>
                    `;

                    // 상위 카테고리 <a> 태그의 왼쪽 시작 위치를 기준으로 드롭다운 위치 설정
                    const linkRect = link.getBoundingClientRect();
                    const navRect = navbar.getBoundingClientRect();
                    const leftOffset = linkRect.left - navRect.left;

                    dropdownPane.style.left = `${leftOffset}px`;
                    dropdownPane.style.width = 'auto'; // 하위 내용에 맞게 너비 조절

                    dropdownPane.classList.add('active');
                    dimOverlay.classList.add('active');
                } else {
                    closeDropdown();
                }
            });
        });

        if (dimOverlay) {
            dimOverlay.addEventListener('click', closeDropdown);
        }
    }

    updateTitle() {
        const contentTitle = this.querySelector('h1')?.innerText?.trim();
        document.title = contentTitle ? `${contentTitle} | 창작` : "창작";
    }

    setActiveNav() {
        const currentFileName = window.location.pathname.split('/').pop() || 'index.html';
        const navLinks = this.querySelectorAll('.nav-links a');

        navLinks.forEach(link => {
            const hrefFileName = link.getAttribute('href').split('/').pop();
            if (currentFileName === hrefFileName) {
                link.classList.add('active');
            }
        });
    }
}

customElements.define('common-layout', CommonLayout);