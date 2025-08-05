import json
import shutil
from datetime import datetime

def convert_group_to_array():
    json_file = '../cha.json'
    
    # バックアップを作成
    backup_file = f"{json_file}.backup"
    shutil.copy2(json_file, backup_file)
    print(f"バックアップを作成しました: {backup_file}")
    
    # JSONファイルを読み込み
    with open(json_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    converted_count = 0
    
    # 各キャラクターを処理
    for character in data:
        if 'id' in character and 'group' in character:
            char_id = character['id']
            group_value = character['group']
            
            # groupが文字列の場合のみ配列に変換
            if isinstance(group_value, str) and group_value.strip():
                character['group'] = [group_value]
                print(f"キャラクター{char_id} (ID: {char_id}): group = '{group_value}' → ['{group_value}']")
                converted_count += 1
            elif isinstance(group_value, list):
                # 既に配列の場合は無視
                print(f"キャラクター{char_id} (ID: {char_id}): group は既に配列形式です: {group_value}")
            elif not group_value or (isinstance(group_value, str) and not group_value.strip()):
                # 空の場合は空配列に変換
                character['group'] = ['']
                print(f"キャラクター{char_id} (ID: {char_id}): group = 空 → ['']")
                converted_count += 1
    
    # JSONファイルに書き戻し
    with open(json_file, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    print(f"\n変換完了: {converted_count}個のgroupフィールドを配列に変換しました")

if __name__ == "__main__":
    convert_group_to_array()
