# -*- coding: utf-8 -*-
"""
cha.jsonの配列化されたフィールドを文字列に変換するスクリプト
imgsize, imageZoomPosition, imgsize_mobile, imageZoomPosition_mobileの[]を外す
"""
import json
import os

JSON_PATH = os.path.join(os.path.dirname(__file__), '../cha.json')

def convert_array_to_string(value):
    """配列を文字列に変換する関数"""
    if isinstance(value, list):
        if len(value) > 0:
            # 最初の要素を取得
            return value[0] if value[0] is not None else ''
        else:
            # 空の配列の場合は空文字列
            return ''
    else:
        # 既に文字列の場合はそのまま返す
        return value

def main():
    try:
        # JSONファイルを読み込み
        with open(JSON_PATH, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        # settings部分はスキップ（data[0]）
        characters = data[1:]
        
        # 変換対象のフィールド
        target_fields = ['imgsize', 'imageZoomPosition', 'imgsize_mobile', 'imageZoomPosition_mobile']
        
        conversion_count = 0
        
        # 各キャラクターのデータを変換
        for i, char in enumerate(characters):
            for field in target_fields:
                if field in char:
                    old_value = char[field]
                    new_value = convert_array_to_string(old_value)
                    
                    if old_value != new_value:
                        char[field] = new_value
                        conversion_count += 1
                        print(f"キャラクター{i+1} (ID: {char.get('id', '?')}): {field} = {old_value} → {new_value}")
        
        # 変更されたデータを保存
        if conversion_count > 0:
            # バックアップを作成
            backup_path = JSON_PATH + '.backup'
            with open(backup_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=4)
            print(f"\nバックアップを作成しました: {backup_path}")
            
            # 変更されたデータを保存
            with open(JSON_PATH, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=4)
            
            print(f"\n変換完了: {conversion_count}個のフィールドを変換しました")
        else:
            print("変換対象のフィールドが見つかりませんでした")
            
    except Exception as e:
        print(f"エラーが発生しました: {e}")

if __name__ == '__main__':
    main()
