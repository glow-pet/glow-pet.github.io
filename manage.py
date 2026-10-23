import os
import json
from datetime import datetime

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
JSON_FILE = os.path.join(BASE_DIR, "posts.json")
IMAGE_DIR = os.path.join(BASE_DIR, "assets", "images", "fanworks")

def load_posts():
    if not os.path.exists(JSON_FILE):
        return []
    try:
        with open(JSON_FILE, "r", encoding="utf-8") as f:
            content = f.read().strip()
            if content:
                return json.loads(content)
    except Exception:
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

GENRE_FOLDERS = [
    "deltarune",
    "draw-this-then-die",
    "goodbye-lara",
    "revue-starlight",
]

def select_category():
    while True:
        print("\n" + "=" * 35)
        print("카테고리 선택")
        print("1. 1차창작")
        print("2. 2차창작")
        print("b. 이전 단계 / q. 종료")
        
        choice = get_input("\n번호 선택: ")
        if choice == 'back':
            return 'back'
        if choice == "1":
            return "1차창작"
        elif choice == "2":
            return "2차창작"
        else:
            print("\n잘못된 입력입니다. 1 또는 2를 선택해주세요.")

def display_card_list(filtered_posts):
    print("\n" + "-" * 35)
    print("기존 카드 목록")
    if not filtered_posts:
        print("[등록된 카드가 없습니다.]")
        return False
    
    for p in filtered_posts:
        preview_tag = ', '.join(p.get('tags', [])) if p.get('tags') else '[없음]'
        print(f"ID: {p.get('id')} | 카테고리: {p.get('category')} | 태그: {preview_tag} | 상태: {p.get('status', 'public')}")
    print("-" * 35)
    return True

def parse_multi_selection(input_str, max_len):
    selected_indices = []
    has_zero = False
    for token in input_str.split(','):
        token = token.strip()
        if token == '0':
            has_zero = True
        elif token.isdigit():
            idx = int(token) - 1
            if 0 <= idx < max_len:
                selected_indices.append(idx)
    return list(dict.fromkeys(selected_indices)), has_zero

def workflow_select_tags(posts):
    works = sorted(list(set(p['tags'][0] for p in posts if p.get('tags') and len(p['tags']) > 0)))
    if not works:
        works = ["안녕 라라", "델타룬", "이거 그리고 죽어", "레뷰 스타라이트"]

    print("\n" + "=" * 35)
    print("[1/3] 장르(작품) 선택 (복수 선택 시 쉼표 구분, 예: 1, 3)")
    for idx, w in enumerate(works, 1):
        print(f"{idx}. {w}")
    print("0. 직접 입력")
    
    w_choice = get_input("\n장르 번호 선택: ")
    if w_choice == 'back': return 'back'
    
    chosen_works = []
    if w_choice:
        indices, has_zero = parse_multi_selection(w_choice, len(works))
        for i in indices:
            chosen_works.append(works[i])
        if has_zero:
            custom_w = get_input("직접 입력할 장르명 (쉼표 구분 가능): ")
            if custom_w and custom_w != 'back':
                chosen_works.extend([w.strip() for w in custom_w.split(',') if w.strip()])

    chars = sorted(list(set(
        t for p in posts for t in p.get('tags', [])[1:] 
        if 'x' not in t and (not chosen_works or (p.get('tags') and p['tags'][0] in chosen_works))
    )))
    if not chars:
        chars = sorted(list(set(t for p in posts for t in p.get('tags', [])[1:] if 'x' not in t)))

    print("\n" + "=" * 35)
    print("[2/3] 캐릭터 선택 (복수 선택 시 쉼표 구분, 없으면 엔터)")
    for idx, c in enumerate(chars, 1):
        print(f"{idx}. {c}")
    print("0. 직접 입력")

    c_choice = get_input("\n캐릭터 번호 선택: ")
    if c_choice == 'back': return 'back'

    chosen_chars = []
    if c_choice:
        indices, has_zero = parse_multi_selection(c_choice, len(chars))
        for i in indices:
            chosen_chars.append(chars[i])
        if has_zero:
            custom_c = get_input("직접 입력할 캐릭터명 (쉼표 구분 가능): ")
            if custom_c and custom_c != 'back':
                chosen_chars.extend([c.strip() for c in custom_c.split(',') if c.strip()])

    rels = sorted(list(set(
        t for p in posts for t in p.get('tags', [])[1:] 
        if 'x' in t and (not chosen_works or (p.get('tags') and p['tags'][0] in chosen_works))
    )))
    if not rels:
        rels = sorted(list(set(t for p in posts for t in p.get('tags', [])[1:] if 'x' in t)))

    print("\n" + "=" * 35)
    print("[3/3] 관계 선택 (복수 선택 시 쉼표 구분, 없으면 엔터)")
    for idx, r in enumerate(rels, 1):
        print(f"{idx}. {r}")
    print("0. 직접 입력")

    r_choice = get_input("\n관계 번호 선택: ")
    if r_choice == 'back': return 'back'

    chosen_rels = []
    if r_choice:
        indices, has_zero = parse_multi_selection(r_choice, len(rels))
        for i in indices:
            chosen_rels.append(rels[i])
        if has_zero:
            custom_r = get_input("직접 입력할 관계명 (쉼표 구분 가능): ")
            if custom_r and custom_r != 'back':
                chosen_rels.extend([r.strip() for r in custom_r.split(',') if r.strip()])

    final_tags = chosen_works + chosen_chars + chosen_rels
    print(f"\n[안내] 최종 선택된 태그: {final_tags}")
    return final_tags

def select_genre_folder():
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

def workflow_input_thumbnail(posts):
    while True:
        choice = get_input("\n썸네일 유형 선택 (1: 이미지, 2: 텍스트): ")
        if choice == 'back':
            return 'back', None
        if choice in ["1", "2"]:
            break
        print("\n잘못된 입력입니다. 1 또는 2를 선택해주세요.")

    if choice == "1":
        genre = select_genre_folder()
        if genre == 'back':
            return 'back', None

        target_dir = os.path.join(IMAGE_DIR, genre)
        raw_names = get_input(f"\n[{genre}] 이미지 파일 이름 입력 (복수 선택 시 쉼표 구분, 예: img1, img2): ")
        if raw_names == 'back':
            return 'back', None

        file_list = [n.strip() for n in raw_names.split(",") if n.strip()]
        built_paths = []
        for fname in file_list:
            base_name = os.path.splitext(fname)[0]
            filename = f"{base_name}.webp"
            built_paths.append(f"assets/images/fanworks/{genre}/{filename}")

        if len(built_paths) == 1:
            return "image_single", built_paths[0]
        elif len(built_paths) > 1:
            return "image_multiple", built_paths
        else:
            print("\n파일을 입력하지 않았습니다.")
            return 'back', None
    else:
        text_val = get_input("\n텍스트 내용 입력: ")
        if text_val == 'back':
            return 'back', None
        return "text", text_val

def add_post_flow(posts, category):
    next_id = max([p.get("id", 0) for p in posts], default=0) + 1
    print("\n" + "=" * 35)
    print(f"새 카드 등록 (ID: {next_id}, 카테고리: {category})")

    tags = workflow_select_tags(posts)
    if tags == 'back': return None

    thumb_type, thumb_val = workflow_input_thumbnail(posts)
    if thumb_type == 'back': return None

    post_link = get_input("\n링크 입력 (없으면 엔터): ")
    if post_link == 'back': return None

    alt_text = get_input("\nalt (캡션) 입력: ")
    if alt_text == 'back': return None

    today = datetime.today().strftime("%Y-%m-%d")
    date_input = get_input(f"\n날짜 입력 (기본값 {today}): ")
    if date_input == 'back': return None
    date_str = date_input if date_input else today

    new_card = {
        "category": category,
        "id": next_id,
        "date": date_str,
        "status": "public",
        "tags": tags,
        "link": post_link,
        "alt": alt_text,
    }

    if thumb_type == "image_single":
        new_card["thumbnail-image"] = thumb_val
    elif thumb_type == "image_multiple":
        new_card["thumbnail-image"] = thumb_val[0]
        new_card["images"] = thumb_val
    elif thumb_type == "text":
        new_card["thumbnail-text"] = thumb_val

    return new_card

def edit_post_flow(posts, category):
    while True:
        current_posts = load_posts()
        filtered_posts = [p for p in current_posts if p.get("category") == category]
        
        if not display_card_list(filtered_posts):
            return

        target_id_str = get_input("\n수정할 게시물 ID 선택 (뒤로 가기: b): ")
        if target_id_str == 'back': return
        
        try:
            target_id = int(target_id_str)
        except ValueError:
            print("\n올바른 숫자를 입력해주세요.")
            continue

        target = next((p for p in current_posts if p.get("id") == target_id), None)
        if not target:
            print("\n존재하지 않는 ID입니다.")
            continue

        while True:
            print("\n" + "=" * 35)
            print(f"[게시물 ID: {target_id}] 수정 항목 선택")
            print("1. 카테고리")
            print("2. 태그 (장르부터 캐릭터, 관계 순서대로 다시 선택)")
            print("3. 썸네일 (해당 카드의 썸네일 수정/교체/삭제/추가)")
            print("4. 링크")
            print("5. alt (캡션)")
            print("6. 날짜")
            print("7. 이전 메뉴로")

            sub_choice = get_input("\n번호 선택: ")
            if sub_choice == 'back' or sub_choice == '7':
                break

            if sub_choice == "1":
                new_cat = select_category()
                if new_cat != 'back':
                    target['category'] = new_cat
                    save_posts(current_posts)
                    print(f"\n카테고리가 [{new_cat}](으)로 변경되었습니다.")
            elif sub_choice == "2":
                new_tags = workflow_select_tags(current_posts)
                if new_tags != 'back':
                    target['tags'] = new_tags
                    save_posts(current_posts)
                    print("\n태그가 성공적으로 수정되었습니다.")
            elif sub_choice == "3":
                while True:
                    current_thumbs = []
                    if target.get('images') and isinstance(target.get('images'), list):
                        for idx_m, img_path in enumerate(target['images']):
                            current_thumbs.append(("multi", img_path, idx_m))
                    elif target.get('thumbnail-image'):
                        current_thumbs.append(("single", target['thumbnail-image'], 0))
                    
                    if target.get('thumbnail-text'):
                        current_thumbs.append(("text", target['thumbnail-text'], 0))

                    print("\n" + "=" * 35)
                    print(f"[카드 ID {target_id}] 등록된 썸네일 목록")
                    if not current_thumbs:
                        print("등록된 썸네일이 없습니다.")
                    else:
                        for idx, item in enumerate(current_thumbs, 1):
                            if item[0] == "single":
                                print(f"{idx}. [단일 이미지] {item[1]}")
                            elif item[0] == "multi":
                                print(f"{idx}. [다중 이미지 ({item[2]+1}번째)] {item[1]}")
                            elif item[0] == "text":
                                print(f"{idx}. [텍스트] {item[1]}")
                    
                    print("0. 새 썸네일 추가하기")
                    print("b. 이전 메뉴로 돌아가기")

                    t_choice = get_input("\n선택할 썸네일 번호 (복수 선택 시 쉼표 구분, 예: 1, 2 / 추가는 0): ")
                    if t_choice == 'back' or t_choice.lower() == 'b':
                        break

                    if t_choice == '0':
                        thumb_type, thumb_val = workflow_input_thumbnail(current_posts)
                        if thumb_type != 'back':
                            # 기존에 images 배열이 있거나 단일 이미지가 있는 경우 통합
                            existing_images = []
                            if target.get('images') and isinstance(target.get('images'), list):
                                existing_images = target['images']
                            elif target.get('thumbnail-image'):
                                existing_images = [target['thumbnail-image']]

                            if thumb_type == "image_single":
                                existing_images.append(thumb_val)
                            elif thumb_type == "image_multiple":
                                existing_images.extend(thumb_val)
                            elif thumb_type == "text":
                                target['thumbnail-text'] = thumb_val

                            if existing_images:
                                target['images'] = existing_images
                                # 항상 첫 번째 이미지가 카드 목록에 뜨는 대표 썸네일이 되도록 설정
                                target['thumbnail-image'] = existing_images[0]
                                target.pop('thumbnail-text', None) # 텍스트와 혼용 방지

                            save_posts(current_posts)
                            print("\n새 썸네일이 성공적으로 추가되었습니다!")
                        continue

                    selected_indices, _ = parse_multi_selection(t_choice, len(current_thumbs))
                    if not selected_indices:
                        print("\n올바른 번호를 선택해주세요.")
                        continue

                    selected_items = [current_thumbs[i] for i in selected_indices]
                    
                    print("\n" + "-" * 25)
                    print(f"선택한 항목 개수: {len(selected_items)}개")
                    print("1. 교체하기")
                    print("2. 삭제하기")
                    action = get_input("작업 선택: ")

                    if action == "1":
                        genre = select_genre_folder()
                        if genre == 'back': continue

                        for s_idx, item in enumerate(selected_items, 1):
                            fname = get_input(f"\n[{s_idx}/{len(selected_items)}] 교체할 새 파일 이름 (확장자 제외): ")
                            if fname == 'back': break
                            
                            base_name = os.path.splitext(fname)[0]
                            new_path = f"assets/images/fanworks/{genre}/{base_name}.webp"
                            
                            item_type, _, m_idx = item
                            if item_type == "single":
                                target['thumbnail-image'] = new_path
                            elif item_type == "multi":
                                if 'images' in target and len(target['images']) > m_idx:
                                    target['images'][m_idx] = new_path
                            elif item_type == "text":
                                target['thumbnail-text'] = new_path

                        if target.get('images') and len(target['images']) > 0:
                            target['thumbnail-image'] = target['images'][0]

                        save_posts(current_posts)
                        print("\n선택한 썸네일 교체가 완료되었습니다.")

                    elif action == "2":
                        confirm_del = get_input(f"\n선택한 {len(selected_items)}개 썸네일을 정말 삭제하시겠습니까? (1: 네, 2: 아니오): ")
                        if confirm_del == "1":
                            selected_items_sorted = sorted(selected_items, key=lambda x: x[2], reverse=True)
                            for item in selected_items_sorted:
                                item_type, _, m_idx = item
                                if item_type == "single":
                                    target.pop('thumbnail-image', None)
                                elif item_type == "multi":
                                    if 'images' in target and len(target['images']) > m_idx:
                                        target['images'].pop(m_idx)
                                        if len(target['images']) == 1:
                                            # 1개만 남으면 단일 이미지 형태로 전환
                                            target['thumbnail-image'] = target['images'][0]
                                            target.pop('images', None)
                                        elif len(target['images']) == 0:
                                            target.pop('images', None)
                                            target.pop('thumbnail-image', None)
                                elif item_type == "text":
                                    target.pop('thumbnail-text', None)

                            if target.get('images') and len(target['images']) > 0:
                                target['thumbnail-image'] = target['images'][0]

                            save_posts(current_posts)
                            print("\n선택한 썸네일이 삭제되었습니다.")
                        else:
                            print("\n삭제가 취소되었습니다.")

            elif sub_choice == "4":
                curr = target.get('link', '')
                val = get_input(f"\n새 링크 (기존: {curr}): ")
                if val != 'back':
                    target['link'] = val
                    save_posts(current_posts)
                    print("\n링크가 수정되었습니다.")
            elif sub_choice == "5":
                curr = target.get('alt', '')
                val = get_input(f"\n새 alt (기존: {curr}): ")
                if val != 'back':
                    target['alt'] = val
                    save_posts(current_posts)
                    print("\nalt가 수정되었습니다.")
            elif sub_choice == "6":
                curr = target.get('date', '')
                val = get_input(f"\n새 날짜 (기존: {curr}): ")
                if val != 'back':
                    target['date'] = val
                    save_posts(current_posts)
                    print("\n날짜가 수정되었습니다.")

def delete_post_flow(posts, category):
    while True:
        current_posts = load_posts()
        filtered_posts = [p for p in current_posts if p.get("category") == category]
        
        if not display_card_list(filtered_posts):
            return

        target_id_str = get_input("\n삭제할 게시물 ID 선택 (뒤로 가기: b): ")
        if target_id_str == 'back': return
        
        try:
            target_id = int(target_id_str)
        except ValueError:
            print("\n올바른 숫자를 입력해주세요.")
            continue

        target = next((p for p in current_posts if p.get("id") == target_id), None)
        if target:
            confirm = get_input(f"\nID {target_id} 카드를 정말 삭제하시겠습니까? (1: 네, 2: 아니오): ")
            if confirm == '1':
                current_posts.remove(target)
                save_posts(current_posts)
                print(f"\nID {target_id} 카드가 성공적으로 삭제되었습니다.")
            else:
                print("\n삭제가 취소되었습니다.")
            break
        else:
            print("\n해당 ID를 찾을 수 없습니다.")

def main():
    while True:
        print("\n" + "=" * 40)
        print(" [ 메인 메뉴 ] ")
        print("1. 등록")
        print("2. 수정")
        print("3. 삭제")
        print("q. 프로그램 종료")
        
        main_choice = get_input("\n작업 선택: ")
        if main_choice.lower() == 'q':
            print("\n프로그램이 종료되었습니다.")
            exit(0)
        
        if main_choice not in ["1", "2", "3"]:
            print("\n잘못된 입력입니다. 1, 2, 3 중 선택해주세요.")
            continue

        category = select_category()
        if category == 'back':
            continue

        posts = load_posts()

        if main_choice == "1":
            new_item = add_post_flow(posts, category)
            if new_item:
                posts.insert(0, new_item)
                save_posts(posts)
                print(f"\n[성공] ID {new_item['id']} 카드가 성공적으로 등록되었습니다.")
        elif main_choice == "2":
            edit_post_flow(posts, category)
        elif main_choice == "3":
            delete_post_flow(posts, category)

if __name__ == "__main__":
    main()