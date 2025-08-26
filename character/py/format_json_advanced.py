# -*- coding: utf-8 -*-
"""
JSONフォーマッタ設定スクリプト
フォーマット対象フィールドをカスタマイズ可能
"""

import json
import os
from json_formatter import save_json_with_custom_format

# フォーマット設定
FORMAT_SETTINGS = {
    # 常に1行にするフィールド（完全に1行形式）
    'always_compact': {
        'en', 'ja',  # settings内の配列
        'name', 'name_en', 'race', 'fightingStyle', 'attribute', 
        'imgThumbsize', 'imageThumbPosition'  # キャラ内の配列
    },
    
    # 条件によって1行にするフィールド（短い場合のみ）
    'conditional_compact': {
        'img', 'group'
    }
}

def format_json_advanced(data, settings=None):
    """
    高度なJSONフォーマッタ
    
    Args:
        data: JSONデータ
        settings: フォーマット設定辞書
    """
    if settings is None:
        settings = FORMAT_SETTINGS
    
    always_compact = settings.get('always_compact', set())
    conditional_compact = settings.get('conditional_compact', set())
    
    def format_value(value, key=None, depth=0):
        indent = "    " * depth
        next_indent = "    " * (depth + 1)
        
        if isinstance(value, dict):
            if not value:
                return "{}"
            items = []
            for k, v in value.items():
                formatted_value = format_value(v, k, depth + 1)
                items.append(f'{next_indent}"{k}": {formatted_value}')
            return "{\n" + ",\n".join(items) + "\n" + indent + "}"
                
        elif isinstance(value, list):
            if not value:
                return "[]"
            
            # 常に1行形式のフィールド
            if key in always_compact:
                return json.dumps(value, ensure_ascii=False, separators=(', ', ': '))
            
            # 条件によって1行形式のフィールド
            elif key in conditional_compact:
                # 要素数が少なく、すべてプリミティブな場合は1行に
                if len(value) <= 3 and all(isinstance(item, (str, int, float, bool)) or item is None for item in value):
                    return json.dumps(value, ensure_ascii=False, separators=(', ', ': '))
            
            # 通常のリスト処理
            if all(isinstance(item, (str, int, float, bool)) or item is None for item in value):
                # プリミティブ要素のみの場合
                if len(value) == 1:
                    # 単一要素は1行に
                    return json.dumps(value, ensure_ascii=False, separators=(', ', ': '))
                elif len(value) <= 5 and all(isinstance(item, (str, int)) and len(str(item)) <= 10 for item in value):
                    # 短い要素の少ない配列は1行に
                    return json.dumps(value, ensure_ascii=False, separators=(', ', ': '))
                else:
                    # 長い配列は複数行に
                    items = [f'{next_indent}{json.dumps(item, ensure_ascii=False)}' for item in value]
                    return "[\n" + ",\n".join(items) + "\n" + indent + "]"
            else:
                # 複雑な要素を含む場合
                items = [f'{next_indent}{format_value(item, None, depth + 1)}' for item in value]
                return "[\n" + ",\n".join(items) + "\n" + indent + "]"
        else:
            return json.dumps(value, ensure_ascii=False)
    
    return format_value(data)

def main():
    """メイン関数"""
    JSON_PATH = os.path.join(os.path.dirname(__file__), '../cha.json')
    
    print("=== 高度なJSONフォーマッタ ===")
    print(f"対象ファイル: {JSON_PATH}")
    
    if not os.path.exists(JSON_PATH):
        print("エラー: cha.jsonファイルが見つかりません")
        return
    
    print("\n現在の設定:")
    print(f"常に1行形式: {', '.join(FORMAT_SETTINGS['always_compact'])}")
    print(f"条件によって1行形式: {', '.join(FORMAT_SETTINGS['conditional_compact'])}")
    
    try:
        # 現在のJSONファイルを読み込み
        with open(JSON_PATH, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        print(f"\n読み込み完了: {len(data)}個の要素")
        
        # バックアップを作成
        backup_path = JSON_PATH + '.advanced_backup'
        with open(backup_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=4)
        print(f"バックアップ作成: {backup_path}")
        
        # 高度なフォーマットで保存
        formatted_json = format_json_advanced(data, FORMAT_SETTINGS)
        
        with open(JSON_PATH, 'w', encoding='utf-8') as f:
            f.write(formatted_json)
        
        print("高度なフォーマット完了!")
        print("\n処理が完了しました。")
        
    except Exception as e:
        print(f"エラーが発生しました: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
    input("Enterキーを押して終了...")
