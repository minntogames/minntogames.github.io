# -*- coding: utf-8 -*-
"""
JSONフォーマッタ - スタンドアロン版

使用方法:
python format_json_standalone.py
"""

import json
import os
from json_formatter import save_json_with_custom_format

def main():
    """メイン関数"""
    JSON_PATH = os.path.join(os.path.dirname(__file__), '../cha.json')
    
    print("=== JSON 1行形式フォーマッタ ===")
    print(f"対象ファイル: {JSON_PATH}")
    
    if not os.path.exists(JSON_PATH):
        print("エラー: cha.jsonファイルが見つかりません")
        return
    
    try:
        # 現在のJSONファイルを読み込み
        with open(JSON_PATH, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        print(f"読み込み完了: {len(data)}個の要素")
        
        # バックアップを作成
        backup_path = JSON_PATH + '.backup'
        with open(backup_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=4)
        print(f"バックアップ作成: {backup_path}")
        
        # 1行形式にするフィールドを指定
        compact_fields = {
            'en', 'ja',  # settings内の配列
            'name', 'name_en', 'race', 'fightingStyle', 'attribute', 
            'imgThumbsize', 'imageThumbPosition'  # キャラ内の配列
        }
        
        # カスタム形式で保存
        save_json_with_custom_format(data, JSON_PATH, compact_fields)
        print("フォーマット完了!")
        
        print("\n=== フォーマット対象フィールド ===")
        print("settings内: en, ja")
        print("キャラ内: name, name_en, race, fightingStyle, attribute, imgThumbsize, imageThumbPosition")
        
        print("\n処理が完了しました。")
        
    except Exception as e:
        print(f"エラーが発生しました: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
    input("Enterキーを押して終了...")
