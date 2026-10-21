document.addEventListener("DOMContentLoaded", async () => {
    try {
        const response = await fetch('../posts.json');
        if (!response.ok) {
            throw new Error('데이터를 불러오지 못했습니다.');
        }
        
        const posts = await response.json();
        
        // 공개된 포스트만 필터링하여 공통 갤러리 데이터에 할당
        window.galleryData = posts.filter(post => post.status !== 'private');

        // 직접 렌더링 함수 실행 (정렬 및 카드 생성)
        if (typeof executeRender === 'function') {
            executeRender(true);
        } else if (typeof window.loadGallery === 'function') {
            window.loadGallery();
        }
    } catch (error) {
        console.error('오류 발생:', error);
    }
});