// update-gallery.js
const fs = require('fs');
const path = require('path');

const mainImgDir = path.join(__dirname, 'assets/images/main');
const fanworksImgDir = path.join(__dirname, 'assets/images/fanworks');
const outputFile = path.join(__dirname, 'assets/js/galleryData.json');
const validExts = ['.webp', '.png', '.jpg', '.jpeg', '.gif'];

function buildGalleryData() {
  const result = {
    mainCards: [],
    details: {}
  };

  // 1. 메인 카드 데이터 (assets/images/main)
  if (fs.existsSync(mainImgDir)) {
    const files = fs.readdirSync(mainImgDir);
    result.mainCards = files
      .filter(file => validExts.includes(path.extname(file).toLowerCase()))
      .map(file => {
        const filePath = path.join(mainImgDir, file);
        const stats = fs.statSync(filePath);
        const date = new Date(stats.mtime).toISOString().split('T')[0];
        
        // 파일명 형식: "식별자_작품명_캐릭터_태그.webp"
        // 예시: "rara-risa_안녕, 라라_리사_드림주+리사, 코타x리사.webp"
        const fileNameWithoutExt = path.basename(file, path.extname(file));
        const parts = fileNameWithoutExt.split('_');
        
        const slug = parts[0] || 'card';
        const infos = parts.slice(1);

        return {
          id: slug,
          link: `pages/fanworks-${slug}.html`,
          imgSrc: `assets/images/main/${file}`,
          infos: infos.length > 0 ? infos : [fileNameWithoutExt],
          date: date
        };
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date)); // 최신 날짜 내림차순 정렬
  }

  // 2. 서브페이지 본문 이미지 데이터 (assets/images/fanworks/식별자/)
  if (fs.existsSync(fanworksImgDir)) {
    const folders = fs.readdirSync(fanworksImgDir, { withFileTypes: true });
    folders.forEach(dir => {
      if (dir.isDirectory()) {
        const folderName = dir.name;
        const folderPath = path.join(fanworksImgDir, folderName);
        const detailFiles = fs.readdirSync(folderPath);

        const images = detailFiles
          .filter(f => validExts.includes(path.extname(f).toLowerCase()))
          .map(f => `../assets/images/fanworks/${folderName}/${f}`);

        result.details[folderName] = images;
      }
    });
  }

  // assets/js/galleryData.json 으로 저장
  fs.writeFileSync(outputFile, JSON.stringify(result, null, 2), 'utf-8');
  console.log('✅ galleryData.json 생성 완료!');
}

buildGalleryData();