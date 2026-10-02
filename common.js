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
  }
}

customElements.define('common-layout', CommonLayout);