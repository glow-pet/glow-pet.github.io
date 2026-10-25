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
        const currentFileName = window.location.pathname.split('/').pop() || 'index.html';

        // 루트 경로 및 하위 pages 폴더 경로 설정
        const indexPath = isPagesFolder ? '../index.html' : 'index.html';
        const fanworksPath = isPagesFolder ? 'fanworks.html' : 'pages/fanworks.html';
        const ocsPath = isPagesFolder ? 'ocs.html' : 'pages/ocs.html';
        const favsPath = isPagesFolder ? 'favs.html' : 'pages/favs.html';

        this.innerHTML = `
            <nav class="navbar" style="display: flex; justify-content: space-between; align-items: center;">
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
                        <li><a href="${indexPath}">홈</a></li>
                        <li><a href="${ocsPath}">1차 창작</a></li>
                        <li><a href="${fanworksPath}">2차 창작</a></li>
                        <li><a href="${favsPath}">관심 작품</a></li>
                    </ul>
                </div>
                <div class="nav-right" style="margin-left: auto;">
                    <a href="${isPagesFolder ? '../admin.html' : 'admin.html'}" class="admin-link-btn" style="font-size: 0.8rem; padding: 0.3rem 0.6rem; border: 1px solid #ccc; border-radius: 4px; color: #555; background: #fff; text-decoration: none;">관리</a>
                </div>
            </nav>

            <div class="content-body"></div>

            <footer class="footer">
                <p>© 2026. All rights reserved.</p>
            </footer>
        `;

        const mainContent = this.querySelector('.content-body');
        const containerEl = originalChildren.find(node => node.nodeType === 1 && node.classList.contains('container')) || mainContent;

        // ocs, fanworks, favs 및 메인(index.html)에서는 뒤로가기 버튼 제외
        const isExcludedPage = currentFileName.startsWith('ocs') || currentFileName.startsWith('fanworks') || currentFileName.startsWith('favs') || currentFileName.startsWith('history') || currentFileName === 'index.html' || !isPagesFolder;
        
        if (isPagesFolder && !isExcludedPage) {
            const backBtnWrapper = document.createElement('div');
            backBtnWrapper.className = 'back-button-wrapper';
            backBtnWrapper.innerHTML = `
                <button type="button" class="back-btn" onclick="history.back()">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="15 18 9 12 15 6"></polyline>
                    </svg>
                    <span>뒤로가기</span>
                </button>
            `;
            const targetContainer = containerEl.classList && containerEl.classList.contains('container') ? containerEl : containerEl.querySelector('.container');
            if (targetContainer) {
                targetContainer.prepend(backBtnWrapper);
            } else {
                containerEl.prepend(backBtnWrapper);
            }
        }

        originalChildren.forEach(node => {
            mainContent.appendChild(node);
        });

        this.updateTitle();
        this.setActiveNav();
        this.initSidebar();

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