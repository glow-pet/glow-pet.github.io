// common.js

// 1. <head> 영역 공통 설정 (안전한 생성 및 주입 방식)
if (!document.querySelector('link[href="styles.css"]')) {
    const metaCharset = document.createElement('meta');
    metaCharset.setAttribute('charset', 'UTF-8');
    
    const metaView = document.createElement('meta');
    metaView.setAttribute('name', 'viewport');
    metaView.setAttribute('content', 'width=device-width, initial-scale=1.0');
    
    const linkCss = document.createElement('link');
    linkCss.setAttribute('rel', 'stylesheet');
    linkCss.setAttribute('href', 'styles.css');

    // title은 기본값 설정 (페이지에서 정의 안 했을 때만)
    if (!document.title) {
        document.title = "2차 창작";
    }

    document.head.appendChild(metaCharset);
    document.head.appendChild(metaView);
    document.head.appendChild(linkCss);
}

// 2. 통합 레이아웃 컴포넌트 정의
class CommonLayout extends HTMLElement {
    connectedCallback() {
        // 타이밍 오류 방지: 브라우저가 자식 노드들을 다 읽을 때까지 미세하게 대기합니다.
        setTimeout(() => {
            // HTML에 적혀있던 본문 노드(알맹이)들을 안전하게 배열로 복사합니다.
            const originalChildren = Array.from(this.childNodes);
            
            // 기존 내용을 전부 비우고 고정 구조를 렌더링합니다.
            this.innerHTML = `
                <!-- 공통 네비게이션 바 -->
                <nav class="navbar">
                    <div class="logo"><a href="index.html">2차창작</a></div>
                    <ul class="nav-links">
                        <li><a href="index.html">그림 모음</a></li>
                        <li><a href="category-b.html">내역</a></li>
                    </ul>
                    <div class="nav-right"></div>
                </nav>

                <!-- 개별 본문 내용이 안전하게 들어갈 가상 공간 -->
                <main class="content-body"></main>

                <!-- 공통 푸터 -->
                <footer class="footer">
                    <p>© 2026 2차창작 공간. All rights reserved.</p>
                </footer>
            `;

            // 가상 공간(.content-body)을 찾아 보관해둔 본문 노드들을 순서대로 안전하게 이사시킵니다.
            const mainContent = this.querySelector('.content-body');
            originalChildren.forEach(node => {
                mainContent.appendChild(node);
            });
        }, 0);
    }
}

// <common-layout>이라는 커스텀 태그로 등록합니다.
customElements.define('common-layout', CommonLayout);