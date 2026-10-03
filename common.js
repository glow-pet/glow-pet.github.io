// common.js

// 1. <head> 필수 요소 주입
if (!document.querySelector('link[href="styles.css"]')) {
    const metaCharset = document.createElement('meta');
    metaCharset.setAttribute('charset', 'UTF-8');
    
    const metaView = document.createElement('meta');
    metaView.setAttribute('name', 'viewport');
    metaView.setAttribute('content', 'width=device-width, initial-scale=1.0');
    
    const linkCss = document.createElement('link');
    linkCss.setAttribute('rel', 'stylesheet');
    linkCss.setAttribute('href', 'styles.css');

    document.head.appendChild(metaCharset);
    document.head.appendChild(metaView);
    document.head.appendChild(linkCss);
}

// 2. 통합 레이아웃 컴포넌트
class CommonLayout extends HTMLElement {
    connectedCallback() {
        // setTimeout 제거: 자식 노드를 동기적으로 즉시 이동하여 스크립트 실행 순서 보장
        const originalChildren = Array.from(this.childNodes);
        
        this.innerHTML = `
            <nav class="navbar">
                <div class="logo"><a href="index.html">창작</a></div>
                <ul class="nav-links">
                    <li><a href="category-oc.html">OC</a></li>
                    <li><a href="index.html">그림 모음</a></li>
                    <li><a href="category-b.html">내역</a></li>
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
    }

    updateTitle() {
        const contentTitle = this.querySelector('h1')?.innerText?.trim();
        document.title = contentTitle ? `${contentTitle} | 창작` : "창작";
    }

    setActiveNav() {
        const currentPath = window.location.pathname.split('/').pop() || 'index.html';
        const navLinks = this.querySelectorAll('.nav-links a');

        navLinks.forEach(link => {
            if (link.getAttribute('href') === currentPath) {
                link.classList.add('active');
            }
        });
    }
}

customElements.define('common-layout', CommonLayout);