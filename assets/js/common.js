// common.js

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

        const indexPath = isPagesFolder ? '../index.html' : 'index.html';
        const ocsPath = isPagesFolder ? 'ocs.html' : 'pages/ocs.html';
        const historyPath = isPagesFolder ? 'history.html' : 'pages/history.html';

        this.innerHTML = `
            <nav class="navbar">
                <div class="logo"><a href="${indexPath}"></a></div>
                <ul class="nav-links">
                    <li><a href="${ocsPath}">OC</a></li>
                    <li><a href="${indexPath}">2차 창작</a></li>
                    <li><a href="${historyPath}">내역</a></li>
                </ul>
                <div class="nav-right"></div>
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

        // ★ 레이아웃 조립이 완전히 끝난 직후 갤러리를 렌더링하도록 호출 ★
        if (typeof window.loadGallery === 'function') {
            window.loadGallery();
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