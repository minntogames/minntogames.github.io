import json
import shutil
from datetime import datetime

def merge_cha_and_a_with_conditions():
    cha_file = '../cha.json'
    a_file = '../a.json'
    merged_file = '../merged_characters.json'
    
    # バックアップを作成
    shutil.copy2(cha_file, f"{cha_file}.backup")
    print(f"バックアップを作成しました: {cha_file}.backup")
    
    # JSONファイルを読み込み
    try:
        with open(cha_file, 'r', encoding='utf-8') as f:
            cha_data = json.load(f)
        print(f"cha.json読み込み成功: {len(cha_data)}項目")
    except Exception as e:
        print(f"cha.json読み込みエラー: {e}")
        return
    
    try:
        with open(a_file, 'r', encoding='utf-8') as f:
            a_data = json.load(f)
        print(f"a.json読み込み成功: {len(a_data)}項目")
    except Exception as e:
        print(f"a.json読み込みエラー: {e}")
        return
    
    # settingsを保持（cha.jsonの最初の要素）
    settings = cha_data[0] if cha_data and 'settings' in cha_data[0] else None
    
    # キャラクターデータのみを抽出
    cha_characters = [char for char in cha_data if 'id' in char and isinstance(char['id'], int)]
    a_characters = a_data
    
    # 合体後のデータリスト
    merged_data = []
    
    # settingsを最初に追加
    if settings:
        merged_data.append(settings)
    
    def normalize_character(char):
        """条件式に基づいてキャラクターデータを正規化"""
        normalized = {}
        
        # id: number型(未配列)
        normalized['id'] = char.get('id', 0)
        
        # name: string型(複数は配列(String型))
        name = char.get('name', [])
        if isinstance(name, list):
            if len(name) == 1:
                normalized['name'] = name[0]  # 単体の場合はstring
            else:
                normalized['name'] = name     # 複数の場合は配列
        else:
            normalized['name'] = name
        
        # name_en: string型(複数は配列(String型))
        name_en = char.get('name_en', [])
        if isinstance(name_en, list):
            if len(name_en) == 1:
                normalized['name_en'] = name_en[0]  # 単体の場合はstring
            else:
                normalized['name_en'] = name_en     # 複数の場合は配列
        else:
            normalized['name_en'] = name_en
        
        # name_Kana: string型(未配列)
        normalized['name_Kana'] = char.get('name_Kana', '')
        
        # description: string型(複数は配列(String型))
        description = char.get('description', [])
        if isinstance(description, list):
            if len(description) == 1:
                normalized['description'] = description[0]  # 単体の場合はstring
            else:
                normalized['description'] = description     # 複数の場合は配列
        else:
            normalized['description'] = description
        
        # world: string型(未配列)
        normalized['world'] = char.get('world', '')
        
        # race: 配列(string型)(複数は配列内配列(string型))
        race = char.get('race', [])
        if isinstance(race, list):
            # 空の配列や空文字を除去
            clean_race = []
            for r in race:
                if isinstance(r, list):
                    # ネストした配列を平坦化
                    clean_subrace = [item for item in r if item and item.strip()]
                    if clean_subrace:
                        clean_race.extend(clean_subrace)
                elif r and r.strip():
                    clean_race.append(r)
            normalized['race'] = clean_race if clean_race else []
        else:
            normalized['race'] = [race] if race and race.strip() else []
        
        # fightingStyle: 配列(string型)(複数は配列内配列(string型))
        fighting_style = char.get('fightingStyle', [])
        if isinstance(fighting_style, list) and fighting_style:
            # 既に正しい形式か確認
            if all(isinstance(fs, list) for fs in fighting_style):
                # 配列内配列形式 - 空要素を除去
                clean_fighting = []
                for fs_list in fighting_style:
                    clean_fs = [fs for fs in fs_list if fs and (isinstance(fs, str) and fs.strip())]
                    if clean_fs:
                        clean_fighting.append(clean_fs)
                normalized['fightingStyle'] = clean_fighting if clean_fighting else [[]]
            else:
                # 単一配列形式 - 配列内配列に変換
                clean_fs = [fs for fs in fighting_style if fs and (isinstance(fs, str) and fs.strip())]
                normalized['fightingStyle'] = [clean_fs] if clean_fs else [[]]
        else:
            normalized['fightingStyle'] = [[]]
        
        # attribute: 配列(string型)(複数は配列内配列(string型))
        attribute = char.get('attribute', [])
        if isinstance(attribute, list) and attribute:
            # 既に正しい形式か確認
            if all(isinstance(attr, list) for attr in attribute):
                # 配列内配列形式 - 空要素を除去
                clean_attributes = []
                for attr_list in attribute:
                    clean_attr = [attr for attr in attr_list if attr and (isinstance(attr, str) and attr.strip())]
                    if clean_attr:
                        clean_attributes.append(clean_attr)
                normalized['attribute'] = clean_attributes if clean_attributes else [[]]
            else:
                # 単一配列形式 - 配列内配列に変換
                clean_attr = [attr for attr in attribute if attr and (isinstance(attr, str) and attr.strip())]
                normalized['attribute'] = [clean_attr] if clean_attr else [[]]
        else:
            normalized['attribute'] = [[]]
        
        # height: number型(未配列)
        height = char.get('height', '')
        if isinstance(height, (int, float)):
            normalized['height'] = height
        elif isinstance(height, str) and height.replace('.', '').isdigit():
            normalized['height'] = float(height) if '.' in height else int(height)
        else:
            normalized['height'] = None
        
        # age: string型(未配列)
        normalized['age'] = str(char.get('age', ''))
        
        # birthday: object
        birthday = char.get('birthday', {})
        normalized['birthday'] = {
            'year': str(birthday.get('year', '')) if birthday.get('year') is not None else '',
            'month': birthday.get('month', None),
            'day': birthday.get('day', None)
        }
        
        # personality: string型(未配列)
        normalized['personality'] = char.get('personality', '')
        
        # group: 配列(string型)(未配列) - 常に配列
        group = char.get('group', [])
        if isinstance(group, list):
            normalized['group'] = group
        else:
            normalized['group'] = [group] if group else []
        
        # img: 配列(string型)(複数は配列(string型)) - 常に配列
        img = char.get('img', [])
        if isinstance(img, list):
            normalized['img'] = img
        else:
            normalized['img'] = [img] if img else []
        
        # imgsize: string型(未配列)
        imgsize = char.get('imgsize', '')
        if isinstance(imgsize, list):
            normalized['imgsize'] = imgsize[0] if imgsize else ''
        else:
            normalized['imgsize'] = imgsize
        
        # imgThumbsize: 配列(string型)(複数は配列(string型)) - 常に配列
        normalized['imgThumbsize'] = char.get('imgThumbsize', [])
        
        # imageZoomPosition: string型(未配列)
        zoom_pos = char.get('imageZoomPosition', '')
        if isinstance(zoom_pos, list):
            normalized['imageZoomPosition'] = zoom_pos[0] if zoom_pos else ''
        else:
            normalized['imageZoomPosition'] = zoom_pos
        
        # imageThumbPosition: 配列(string型)(複数は配列(string型)) - 常に配列
        normalized['imageThumbPosition'] = char.get('imageThumbPosition', [])
        
        # imgsize_mobile: string型(未配列)
        imgsize_mobile = char.get('imgsize_mobile', '')
        if isinstance(imgsize_mobile, list):
            normalized['imgsize_mobile'] = imgsize_mobile[0] if imgsize_mobile else ''
        else:
            normalized['imgsize_mobile'] = imgsize_mobile
        
        # imageZoomPosition_mobile: string型(未配列)
        zoom_pos_mobile = char.get('imageZoomPosition_mobile', '')
        if isinstance(zoom_pos_mobile, list):
            normalized['imageZoomPosition_mobile'] = zoom_pos_mobile[0] if zoom_pos_mobile else ''
        else:
            normalized['imageZoomPosition_mobile'] = zoom_pos_mobile
        
        return normalized
    
    print("キャラクターデータを条件式に基づいて正規化中...")
    
    # cha.jsonのキャラクターを正規化
    for char in cha_characters:
        normalized = normalize_character(char)
        merged_data.append(normalized)
        name_display = normalized.get('name', 'Unknown')
        if isinstance(name_display, list):
            name_display = name_display[0] if name_display else 'Unknown'
        print(f"正規化完了: キャラクター{normalized['id']} ({name_display})")
    
    # a.jsonのキャラクターを正規化
    for char in a_characters:
        normalized = normalize_character(char)
        merged_data.append(normalized)
        name_display = normalized.get('name', 'Unknown')
        if isinstance(name_display, list):
            name_display = name_display[0] if name_display else 'Unknown'
        print(f"正規化完了: キャラクター{normalized['id']} ({name_display})")
    
    # IDでソート
    characters_only = [item for item in merged_data if 'id' in item and isinstance(item['id'], int)]
    characters_only.sort(key=lambda x: x['id'])
    
    # settingsを先頭に、その後にソート済みキャラクター
    final_data = []
    if settings:
        final_data.append(settings)
    final_data.extend(characters_only)
    
    # 合体したJSONファイルに書き込み
    with open(merged_file, 'w', encoding='utf-8') as f:
        json.dump(final_data, f, ensure_ascii=False, indent=2)
    
    print(f"\n条件式に基づく合体完了: {len(characters_only)}個のキャラクターを {merged_file} に保存しました")
    print(f"合体したキャラクター数: cha.json={len(cha_characters)}, a.json={len(a_characters)}")

if __name__ == "__main__":
    merge_cha_and_a_with_conditions()
