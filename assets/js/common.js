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

        // 네비게이션 메뉴 구조
        const navItems = [
            {
                name: '1차 창작',
                href: worldsPath,
                children: [
                    { name: '세계관', href: worldsPath },
                    { name: 'OC', href: ocsPath }
                ]                
            },
            {
                name: '2차 창작',
                href: favsPath,
                children: [
                    { name: '관심 작품', href: favsPath },
                    { name: '갤러리', href: fanworksPath }
                ]                
            }
        ];
        
        const currentFileName = window.location.pathname.split('/').pop() || 'index.html';

        const navLinksHTML = navItems.map(item => {
            const hasChildren = item.children && item.children.length > 0;
            const isChildActive = hasChildren && item.children.some(child => child.href.includes(currentFileName));
            const isParentActive = item.href.includes(currentFileName) || isChildActive;

            return `
                <li class="${hasChildren ? 'has-children' : ''} ${isParentActive ? 'active-parent' : ''}" data-name="${item.name}">
                    <a href="${item.href}" class="nav-parent-link ${isParentActive ? 'active' : ''}">${item.name}</a>
                </li>
            `;
        }).join('');

        // 현재 활성화된 부모 메뉴의 하위 카테고리 추출
        let subNavHTML = '';
        const activeParentItem = navItems.find(item => {
            if (!item.children) return false;
            return item.href.includes(currentFileName) || item.children.some(child => child.href.includes(currentFileName));
        });

        if (activeParentItem && activeParentItem.children) {
            subNavHTML = `
                <div class="sub-nav-bar">
                    <ul class="sub-nav-links">
                        ${activeParentItem.children.map(child => {
                            const isSubActive = child.href.includes(currentFileName);
                            return `<li><a href="${child.href}" class="${isSubActive ? 'active' : ''}">${child.name}</a></li>`;
                        }).join('')}
                    </ul>
                </div>
            `;
        }

        // 좌측 상단 모바일 헤더 및 사이드바 X 버튼 제거
        this.innerHTML = `
            <div class="layout-container">
                <nav class="navbar">
                    <div class="sidebar-top">
                        <div class="logo"><a href="${indexPath}">창작</a></div>
                    </div>
                    <div class="nav-links-wrapper">
                        <ul class="nav-links">
                            ${navLinksHTML}
                        </ul>
                    </div>
                </nav>

                <div class="main-wrapper">
                    ${subNavHTML}
                    <div class="content-body"></div>
                    <footer class="footer">
                        <p>© 2026. All rights reserved.</p>
                    </footer>
                </div>
            </div>
        `;

        const mainContent = this.querySelector('.content-body');
        originalChildren.forEach(node => {
            mainContent.appendChild(node);
        });

        // 탭 타이틀 업데이트 후 본문 내 .header h1 대제목 제거
        this.updateTitle();
        const headerH1 = this.querySelector('.header h1');
        if (headerH1) {
            headerH1.remove();
        }

        if (typeof window.loadGallery === 'function') {
            window.loadGallery();
        }
    }

    updateTitle() {
        const contentTitle = this.querySelector('h1')?.innerText?.trim();
        document.title = contentTitle ? `${contentTitle} | 창작` : "창작";
    }
}

customElements.define('common-layout', CommonLayout);