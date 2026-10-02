// common.js

class CommonLayout extends HTMLElement {
  connectedCallback() {
    const originalHTML = this.innerHTML;

    this.innerHTML = `
      <nav class="navbar">
        <div class="logo"><a href="index.html">2차창작</a></div>
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
    // 현재 URL 경로를 파악하여 링크 강조 (.active 부여)
    this.setActiveNav();
  }

  setActiveNav() {
    const currentPath = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = this.querySelectorAll('.nav-links a');

    navLinks.forEach(link => {
      const href = link.getAttribute('href');
      // 링크의 href와 현재 경로가 동일하면 active 클래스 추가
      if (href === currentPath) {
        link.classList.add('active');
      }
    });
  }
}

customElements.define('common-layout', CommonLayout);
