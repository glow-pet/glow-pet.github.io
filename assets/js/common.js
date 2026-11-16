// assets/js/common.js

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

class CommonLayout extends HTMLElement {
    connectedCallback() {
        const originalChildren = Array.from(this.childNodes);
        const isPagesFolder = window.location.pathname.includes('/pages/');

        const indexPath = isPagesFolder ? '../index.html' : 'index.html';
        const logoPath = isPagesFolder ? '../assets/images/banana.png' : 'assets/images/banana.png';

        const worldsPath = isPagesFolder ? 'worlds.html' : 'pages/worlds.html';
        const ocsPath = isPagesFolder ? 'ocs.html' : 'pages/ocs.html';
        const fanworksPath = isPagesFolder ? 'fanworks.html' : 'pages/fanworks.html';
        const favsPath = isPagesFolder ? 'favs.html' : 'pages/favs.html';

        const navItems = [
            { name: '홈', href: indexPath },
            {
                name: '1차 창작',
                children: [
                    { name: 'OC', href: ocsPath },
                    { name: '세계관', href: worldsPath }
                ]                
            },
            {
                name: '2차 창작',
                children: [
                    { name: '관심 작품', href: favsPath },
                    { name: '갤러리', href: fanworksPath }
                ]                
            }
        ];
        
        const currentFileName = window.location.pathname.split('/').pop() || 'index.html';
        const pageSlug = currentFileName.replace('.html', '') || 'index';
        document.body.classList.add(`page-${pageSlug}`);

        const navLinksHTML = navItems.map(item => {
            const hasChildren = item.children && item.children.length > 0;
            const isChildActive = hasChildren && item.children.some(child => child.href.includes(currentFileName));
            // 자식이 없더라도 현재 페이지가 본인 href와 일치하면 active 처리
            const isSelfActive = !hasChildren && item.href && item.href.includes(currentFileName);
            const isParentActive = isChildActive || isSelfActive;

            const childrenHTML = hasChildren ? `
                <ul class="nav-sub-links">
                    ${item.children.map(child => {
                        const isSubActive = child.href.includes(currentFileName);
                        return `
                            <li>
                                <a href="${child.href}" class="nav-sub-link ${isSubActive ? 'active' : ''}">${child.name}</a>
                            </li>
                        `;
                    }).join('')}
                </ul>
            ` : '';

            // item.href가 있으면 <a> 태그, 없으면 <span> 태그로 생성
            const parentElementHTML = item.href
                ? `<a href="${item.href}" class="nav-parent-link ${isParentActive ? 'active' : ''}">${item.name}</a>`
                : `<span class="nav-parent-link ${isParentActive ? 'active' : ''}">${item.name}</span>`;

            return `
                <li class="${hasChildren ? 'has-children' : ''} ${isParentActive ? 'active-parent' : ''}" data-name="${item.name}">
                    ${parentElementHTML}
                    ${childrenHTML}
                </li>
            `;
        }).join('');

        this.innerHTML = `
            <div class="layout-container">
                <nav class="navbar">
                    <div class="menu-bg-overlay"></div>
                    <div class="sidebar-top">
                        <button type="button" class="menu-toggle-btn" aria-label="메뉴 토글">
                            <div class="logo">
                                <img src="${logoPath}" alt="로고" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
                                <span class="logo-fallback-text">창작</span>
                            </div>
                            <div class="hamburger-icon-box">
                                <span class="icon-hamburger">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
                                </span>
                                <span class="icon-close">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                </span>
                            </div>
                        </button>
                    </div>
                    <div class="nav-links-wrapper">
                        <ul class="nav-links">
                            ${navLinksHTML}
                        </ul>
                    </div>
                </nav>

                <div class="main-wrapper">
                    <div class="content-body"></div>
                    <footer class="footer">
                        <p>© 2026. All rights reserved.</p>
                    </footer>
                </div>
            </div>
        `;

        // 메뉴 토글 이벤트 리스너 연결
        const navbar = this.querySelector('.navbar');
        const menuToggleBtn = this.querySelector('.menu-toggle-btn');
        if (menuToggleBtn && navbar) {
            menuToggleBtn.addEventListener('click', () => {
                navbar.classList.toggle('menu-open');
            });
        }

        const mainContent = this.querySelector('.content-body');
        originalChildren.forEach(node => {
            mainContent.appendChild(node);
        });

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