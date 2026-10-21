import os
import json
import shutil
from datetime import datetime

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
JSON_FILE = os.path.join(BASE_DIR, "posts.json")
# 기본 이미지 경로를 fanworks 폴더까지 확장
IMAGE_DIR = os.path.join(BASE_DIR, "assets", "images", "fanworks")

def load_posts():
    if not os.path.exists(JSON_FILE):
        return []
    try:
        with open(JSON_FILE, "r", encoding="utf-8") as f:
            content = f.read().strip()
            if content:
                return json.loads(content)
    except:
        pass
    return []

def save_posts(posts):
    with open(JSON_FILE, "w", encoding="utf-8") as f:
        json.dump(posts, f, ensure_ascii=False, indent=4)

def get_input(prompt_msg):
    val = input(prompt_msg).strip()
    if val.lower() == 'q':
        print("\n프로그램이 종료되었습니다.")
        exit(0)
    elif val.lower() == 'b':
        print("\n취소되었습니다.")
        return 'back'
    return val

# 코드 상에서 수동으로 관리할 장르 폴더 목록
GENRE_FOLDERS = [
    "deltarune",
    "draw-this-then-die",
    "goodbye-lara",
    "revue-starlight",
    # 필요한 장르 폴더명을 여기에 계속 추가하시면 됩니다.
]

def select_genre_folder():
    """수동으로 정의된 장르 목록 중에서 번호로 선택"""
    if not GENRE_FOLDERS:
        print("\n[안내] 코드 상에 등록된 장르 폴더가 없습니다.")
        return None

    while True:
        print("\n장르 폴더 선택")
        for idx, genre in enumerate(GENRE_FOLDERS, 1):
            print(f"{idx}. {genre}")
        print("b. 취소")

        choice = get_input("\n장르 번호를 선택하세요: ")
        if choice == 'back':
            return 'back'
        
        try:
            choice_idx = int(choice) - 1
            if 0 <= choice_idx < len(GENRE_FOLDERS):
                return GENRE_FOLDERS[choice_idx]
            print("\n잘못된 번호입니다.")
        except ValueError:
            print("\n숫자를 입력해주세요.")

def select_card_level():
    """작업할 카드가 상위 카드인지 하위 카드인지 선택"""
    while True:
        print("\n" + "=" * 35)
        print("카드 레벨 선택")
        print("1. 상위 카드 (메인 페이지용)")
        print("2. 하위 카드 (상세 페이지용)")
        print("q. 프로그램 종료")
        
        choice = get_input("\n번호 선택: ")
        if choice.lower() == 'q':
            print("\n프로그램이 종료되었습니다.")
            exit(0)
        if choice == "1":
            return "parent"
        elif choice == "2":
            return "child"
        else:
            print("\n잘못된 입력입니다. 1 또는 2를 선택해주세요.")

def input_card_item():
    """썸네일 유형 선택 및 순수 파일명 입력 처리 (확장자 .webp 자동 고정)"""
    while True:
        choice = get_input("\n썸네일 유형 선택 (1: 이미지 파일, 2: 텍스트 내용): ")
        if choice == 'back':
            return 'back'
        
        if choice == "1":
            # 1. 장르 폴더 선택
            selected_genre = select_genre_folder()
            if selected_genre == 'back':
                continue
            if not selected_genre:
                return 'back'

            target_dir = os.path.join(IMAGE_DIR, selected_genre)

            # 2. 순수 파일명 입력 받기 (.webp 자동 고정)
            while True:
                raw_name = get_input(f"\n[{selected_genre}] 이미지 파일 이름만 입력 (예: sample, 취소: b): ").strip('"\'/')
                if raw_name == 'back':
                    break
                if raw_name == "":
                    print("\n파일 이름을 입력해주세요.")
                    continue
                
                # 사용자가 확장자까지 입력했거나 안 했어도 .webp로 안전하게 고정
                base_name = os.path.splitext(raw_name)[0]
                filename = f"{base_name}.webp"
                
                full_path = os.path.join(target_dir, filename)
                if os.path.exists(full_path):
                    path_rel = f"assets/images/fanworks/{selected_genre}/{filename}"
                    return {"type": "image", "path": path_rel}
                
                print(f"\n잘못된 입력입니다. 파일을 찾을 수 없습니다: {full_path}")
                
        elif choice == "2":
            text_val = get_input("\n텍스트 내용 입력: ")
            if text_val == 'back':
                continue
            if text_val:
                return {"type": "text", "content": text_val}
            print("\n내용을 입력해주세요.")
        else:
            print("\n잘못된 입력입니다. 1 또는 2를 선택해주세요.")

def add_post(posts):
    next_id = max([p.get("id", 0) for p in posts], default=0) + 1
    print("\n" + "=" * 35)
    print(f"새 카드 등록 (ID: {next_id})")

    # 1. 태그
    while True:
        tags_input = get_input("\n1. 태그 (쉼표로 구분): ")
        if tags_input == 'back':
            return None
        tags = [t.strip() for t in tags_input.split(",") if t.strip()]
        break

    # 2. 날짜
    today = datetime.today().strftime("%Y-%m-%d")
    while True:
        date_input = get_input(f"\n2. 날짜 (기본값 {today}): ")
        if date_input == 'back':
            return None
        date_str = date_input if date_input else today
        break

    # 3. 썸네일 링크
    while True:
        post_link = get_input("\n3. 썸네일 링크: ")
        if post_link == 'back':
            return None
        break

    # 4. 캡션
    while True:
        caption = get_input("\n4. 캡션: ")
        if caption == 'back':
            return None
        break

    # 5. 썸네일 (이미지 또는 텍스트 중 택1)
    print("\n5. 썸네일 설정")
    thumb_item = input_card_item()
    if thumb_item == 'back':
        return None
    
    thumb_path_rel = thumb_item.get("path", "") if thumb_item.get("type") == "image" else ""
    images_list = []
    if thumb_item.get("type") == "text":
        images_list.append({"type": "text", "content": thumb_item.get("content"), "link": post_link})
    else:
        images_list.append({"type": "image", "path": thumb_path_rel, "alt": caption, "link": post_link})

    # 6. 공개 여부
    while True:
        status_input = get_input("\n6. 공개 여부 (1: 공개 [기본], 2: 비공개): ")
        if status_input == 'back':
            return None
        if status_input == "" or status_input == "1":
            status = "public"
            break
        elif status_input == "2":
            status = "private"
            break
        else:
            print("\n잘못된 입력입니다.")

    return {
        "id": next_id,
        "tags": tags,
        "date": date_str,
        "link": post_link,
        "caption": caption,
        "thumbnail": thumb_path_rel,
        "images": images_list,
        "status": status
    }

def edit_post_item(target):
    while True:
        print("\n" + "=" * 35)
        print("수정 속성 선택")
        print("1. 태그")
        print("2. 날짜")
        print("3. 썸네일 링크")
        print("4. 캡션")
        print("5. 썸네일 (이미지/텍스트)")
        print("6. 공개/비공개 전환")
        print("7. 이전 메뉴로")
        
        choice = get_input("\n번호 선택: ")
        if choice == 'back' or choice == '7':
            break

        if choice == "1":
            curr = ', '.join(target.get('tags', []))
            val = get_input(f"\n새 태그 (기존: {curr}, 쉼표 구분): ")
            if val != 'back':
                target['tags'] = [t.strip() for t in val.split(",") if t.strip()]
                print("\n수정되었습니다.")
                return True

        elif choice == "2":
            curr = target.get('date', '')
            val = get_input(f"\n새 날짜 (기존: {curr}): ")
            if val != 'back':
                target['date'] = val
                print("\n수정되었습니다.")
                return True

        elif choice == "3":
            curr = target.get('link', '')
            val = get_input(f"\n새 썸네일 링크 (기존: {curr}): ")
            if val != 'back':
                target['link'] = val
                if target.get('images'):
                    for img in target['images']:
                        img['link'] = val
                print("\n수정되었습니다.")
                return True

        elif choice == "4":
            curr = target.get('caption', '')
            val = get_input(f"\n새 캡션 (기존: {curr}): ")
            if val != 'back':
                target['caption'] = val
                if target.get('images'):
                    for img in target['images']:
                        if img.get('type') == 'image':
                            img['alt'] = val
                print("\n수정되었습니다.")
                return True

        elif choice == "5":
            print("\n새로운 썸네일을 설정합니다.")
            item = input_card_item()
            if item != 'back':
                link_val = target.get('link', '')
                if item.get('type') == 'image':
                    target['thumbnail'] = item.get('path')
                    target['images'] = [{"type": "image", "path": item.get('path'), "alt": target.get('caption', ''), "link": link_val}]
                else:
                    target['thumbnail'] = ""
                    target['images'] = [{"type": "text", "content": item.get('content'), "link": link_val}]
                print("\n썸네일이 수정되었습니다.")
                return True

        elif choice == "6":
            curr = target.get('status', 'public')
            new_status = "private" if curr == "public" else "public"
            target['status'] = new_status
            print(f"\n상태가 [{new_status.upper()}]로 변경되었습니다.")
            return True
        else:
            print("\n잘못된 번호입니다.")
    return False

def edit_post(posts, level):
    while True:
        posts = load_posts()
        filtered_posts = [p for p in posts if p.get("level", "parent") == level]
        
        if not filtered_posts:
            print("\n등록된 카드가 없습니다.")
            return

        print("\n" + "=" * 35)
        print("카드 수정")
        for p in filtered_posts[:10]:
            preview_tag = ', '.join(p.get('tags', [])) if p.get('tags') else '[없음]'
            print(f"ID: {p.get('id')} / 태그: {preview_tag} / 상태: {p.get('status', 'public')}")

        while True:
            target_id_str = get_input("\n수정할 카드 ID (뒤로 가기: b): ")
            if target_id_str == 'back':
                return
            try:
                target_id = int(target_id_str)
                target = next((p for p in posts if p.get("id") == target_id and p.get("level", "parent") == level), None)
                if target:
                    break
                print("\n존재하지 않는 ID이거나 해당 레벨의 카드가 아닙니다.")
            except ValueError:
                print("\n올바른 숫자를 입력해주세요.")

        if edit_post_item(target):
            save_posts(posts)

def delete_post(posts, level):
    while True:
        posts = load_posts()
        filtered_posts = [p for p in posts if p.get("level", "parent") == level]
        
        if not filtered_posts:
            print("\n등록된 카드가 없습니다.")
            return
        
        print("\n" + "=" * 35)
        print("카드 삭제")
        for p in filtered_posts[:10]:
            preview_tag = ', '.join(p.get('tags', [])) if p.get('tags') else ''
            print(f"ID: {p.get('id')} / 태그: {preview_tag}")

        while True:
            target_id_str = get_input("\n삭제할 카드 ID (뒤로 가기: b): ")
            if target_id_str == 'back':
                return
            try:
                target_id = int(target_id_str)
                target = next((p for p in filtered_posts if p.get("id") == target_id and p.get("level", "parent") == level), None)
                if target:
                    break
                print("\n해당 ID를 찾을 수 없습니다.")
            except ValueError:
                print("\n올바른 숫자를 입력해주세요.")

        confirm = get_input(f"\nID {target_id} 카드를 정말 삭제하시겠습니까? (1: 네, 2: 아니오): ")
        if confirm == '1':
            posts.remove(target)
            save_posts(posts)
            print(f"\nID {target_id} 카드가 삭제되었습니다.")
        else:
            print("\n취소되었습니다.")

def main():
    while True:
        level = select_card_level()
        
        while True:
            print("\n" + "=" * 35)
            print("카드 관리 시스템 (상위 메뉴로: b / 종료: q)")
            print("1. 등록")
            print("2. 수정")
            print("3. 삭제")
            
            sel = get_input("\n작업 번호 선택: ")
            if sel == 'back':
                break

            posts = load_posts()

            if sel == "1":
                new_item = add_post(posts)
                if new_item:
                    new_item["level"] = level
                    posts.insert(0, new_item)
                    save_posts(posts)
                    print(f"\nID {new_item['id']} 카드가 성공적으로 등록되었습니다.")
            elif sel == "2":
                edit_post(posts, level)
            elif sel == "3":
                delete_post(posts, level)
            else:
                print("\n잘못된 입력입니다.")

if __name__ == "__main__":
    main()