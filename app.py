import os
import re
import shutil
from datetime import datetime

# --- 실제 프로젝트의 모든 페이지 파일 구조 완벽 반영 ---
PAGES_CONFIG = {
    "1": ("2차 창작 메인 (fanworks.html)", "fanworks.html", "galleryData"),
    "2": ("1차 창작 메인 (ocs.html)", "ocs.html", "galleryData"),
    "3": ("관심 작품 메인 (favs.html)", "favs.html", "galleryData"),
    "4": ("델타룬 노엘 x 디셈버 상세", "pages/fanworks-deltarune-noelle-december.html", "fanworksImages"),
    "5": ("이거 그리고 죽어 레이 x 아이 상세", "pages/fanworks-draw-this-then-die-rei-ai.html", "fanworksImages"),
    "6": ("안녕 라라 그레이스 x 리그모어 상세", "pages/fanworks-goodbye-lara-grace-rigmor.html", "fanworksImages"),
    "7": ("안녕 라라 리사 드림 상세", "pages/fanworks-goodbye-lara-lisa-dream.html", "fanworksImages"),
    "8": ("안녕 라라 마리 x 라라 상세", "pages/fanworks-goodbye-lara-mari-lara.html", "fanworksImages"),
    "9": ("레뷰 스타라이트 나나 x 카렌 상세", "pages/fanworks-revue-starlight-nana-karen.html", "fanworksImages"),
    "10": ("OC 프리더릭 상세", "pages/ocs-frederike.html", "fanworksImages"),
    "11": ("OC 고든 상세", "pages/ocs-gordon.html", "fanworksImages"),
    "12": ("OC 진 상세", "pages/ocs-jin.html", "fanworksImages"),
    "13": ("OC 마켈라 상세", "pages/ocs-makella.html", "fanworksImages"),
    "14": ("OC 이란 상세", "pages/ocs-yiran.html", "fanworksImages"),
}

IMAGE_DIR = "assets/images"

def main():
    print("=" * 65)
    print("        아카이브 포스트 터미널(CLI) 통합 자동 등록기")
    print("=" * 65)

    # 1. 대상 페이지 선택
    print("\n[등록 가능한 페이지 목록]")
    for key, (name, path, var_type) in PAGES_CONFIG.items():
        print(f"  {key:>2}. {name}")

    choice = input("\n등록할 페이지 번호를 선택하세요: ").strip()
    if choice not in PAGES_CONFIG:
        print("❌ 잘못된 선택입니다. 프로그램을 종료합니다.")
        return

    page_name, file_path, var_type = PAGES_CONFIG[choice]
    print(f"👉 선택된 페이지: {page_name}")

    if not os.path.exists(file_path):
        print(f"❌ 오류: 해당 파일 경로를 찾을 수 없습니다 ({file_path})")
        return

    # 2. 이미지 경로 입력 (드래그 앤 드롭 또는 경로 복사)
    img_input = input("\n이미지 파일 경로를 입력하거나 터미널에 끌어다 놓으세요: ").strip()
    img_path = img_input.strip('"\'')

    if not os.path.exists(img_path):
        print(f"❌ 오류: 해당 경로에 이미지 파일이 없습니다: {img_path}")
        return

    # 이미지 폴더 자동 생성 및 원본 이름으로 복사
    if not os.path.exists(IMAGE_DIR):
        os.makedirs(IMAGE_DIR)

    filename = os.path.basename(img_path)
    dest_path = os.path.join(IMAGE_DIR, filename)
    shutil.copy(img_path, dest_path)

    # 폴더 위치에 따른 상대 경로 자동 계산
    is_sub_page = "pages/" in file_path
    if is_sub_page:
        final_img_val = f"../assets/images/{filename}"
    else:
        final_img_val = f"assets/images/{filename}"

    print(f"✅ 이미지 복사 완료: {dest_path}")

    # 3. 날짜 입력 (2026년 고정, 월/일 입력)
    today = datetime.today()
    default_m = f"{today.month:02d}"
    default_d = f"{today.day:02d}"

    m_input = input(f"\n월 입력 (기본값 {default_m}): ").strip() or default_m
    d_input = input(f"일 입력 (기본값 {default_d}): ").strip() or default_d
    date_str = f"2026-{m_input.zfill(2)}-{d_input.zfill(2)}"

    # 4. 캡션 입력
    print("\n캡션 내용을 입력하세요. 입력을 마치려면 빈 줄에서 엔터를 두 번 치세요:")
    caption_lines = []
    while True:
        line = input()
        if not line:
            break
        caption_lines.append(line)
    caption_str = "\n".join(caption_lines)

    # 5. HTML 데이터 구조에 맞는 엔트리 생성
    if var_type == "galleryData":
        link_input = input("\n상세 페이지 링크 주소 입력 (예: pages/sub.html 또는 공백): ").strip()
        new_entry = f"""            {{
                link: "{link_input}",
                image: "{final_img_val}",
                caption:
`{caption_str}`,
                date: "{date_str}"
            }},"""
        target_pattern = r"(window\.galleryData\s*=\s*\[)"
    else:
        new_entry = f"""            {{
                image: "{final_img_val}",
                caption: "{caption_str}"
            }},"""
        target_pattern = r"(window\.fanworksImages\s*=\s*\[)"

    # 6. 파일 수정 반영
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()

        match = re.search(target_pattern, content)
        if not match:
            print(f"❌ 오류: 파일 내에서 해당 데이터 배열 변수를 찾을 수 없습니다.")
            return

        insert_pos = match.end()
        updated_content = content[:insert_pos] + "\n" + new_entry + content[insert_pos:]

        with open(file_path, "w", encoding="utf-8") as f:
            f.write(updated_content)

        print(f"\n🎉 성공! [{page_name}] 파일에 포스트가 안전하게 추가되었습니다!")

    except Exception as e:
        print(f"\n❌ 파일 수정 중 오류 발생: {e}")

if __name__ == "__main__":
    main()