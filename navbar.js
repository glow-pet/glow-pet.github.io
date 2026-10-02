// navbar.js
class CommonNavbar extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `
            <nav class="navbar">
                <div class="logo"><a href="index.html">2차창작</a></div>
                    <ul class="nav-links">
                        <li><a href="index.html">그림 모음</a></li>
                        <li><a href="category-b.html">내역</a></li>
                    </ul>
            </nav>
        `;
    }
}

// <common-navbar>라는 커스텀 태그로 등록합니다.
customElements.define('common-navbar', CommonNavbar);