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
        
        // 폴더 위치에 따른 로고 이미지 경로 분기 처리
        const logoPath = isPagesFolder ? '../assets/images/banana.gif' : 'assets/images/banana.gif';

        const worldsPath = isPagesFolder ? 'worlds.html' : 'pages/worlds.html';
        const ocsPath = isPagesFolder ? 'ocs.html' : 'pages/ocs.html';
        const fanworksPath = isPagesFolder ? 'fanworks.html' : 'pages/fanworks.html';
        const favsPath = isPagesFolder ? 'favs.html' : 'pages/favs.html';

        const navItems = [
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

        const navLinksHTML = navItems.map(item => {
            const hasChildren = item.children && item.children.length > 0;
            const isChildActive = hasChildren && item.children.some(child => child.href.includes(currentFileName));
            const isParentActive = isChildActive; // 상위 카테고리는 하위 메뉴가 활성화되었을 때만 활성화

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

            return `
                <li class="${hasChildren ? 'has-children' : ''} ${isParentActive ? 'active-parent' : ''}" data-name="${item.name}">
                    <span class="nav-parent-link ${isParentActive ? 'active' : ''}">${item.name}</span>
                    ${childrenHTML}
                </li>
            `;
        }).join('');

        this.innerHTML = `
            <div class="layout-container">
                <nav class="navbar">
                    <div class="sidebar-top">
                        <div class="logo">
                            <a href="${indexPath}">
                                <img src="${logoPath}" alt="로고" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
                                <span class="logo-fallback-text">창작</span>
                            </a>
                        </div>
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