class CommonLayout extends HTMLElement {
  connectedCallback() {
    // 1. 기존 HTML 내용을 가져오고 레이아웃 뼈대 심기
    const originalHTML = this.innerHTML;
    this.innerHTML = `
      <nav class="navbar">
        <div class="logo"><a href="index.html">창작</a></div>
        <ul class="nav-links">
          <li><a href="index.html">그림 모음</a></li>
          <li><a href="category-b.html">내역</a></li>
        </ul>
      </nav>
      <main class="content-body">
        ${originalHTML}
      </main>
      <footer class="footer">
        <p>© 2026. All rights reserved.</p>
      </footer>
    `;

    // 2. 탭 이름 자동 변경 및 네비게이션 활성화 기능 실행
    this.updateTitle();
    this.setActiveNav();
  }

  // 브라우저 탭 이름을 동적으로 변경하는 메서드
  updateTitle() {
    const contentTitle = this.querySelector('h1')?.innerText?.trim();
    document.title = contentTitle ? `${contentTitle} | 창작` : "창작";
  }

  // 현재 URL 경로를 파악하여 링크를 강조하는 메서드
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

// 웹 컴포넌트 등록
customElements.define('common-layout', CommonLayout);
