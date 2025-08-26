# -*- coding: utf-8 -*-
import json
import os

def format_json_custom(data, compact_fields=None):
    """
    JSONデータを特定のフィールドのみ1行形式で保存するカスタム形式に変換
    
    Args:
        data: JSONデータ
        compact_fields: 1行形式にするフィールド名のセット
    """
    if compact_fields is None:
        compact_fields = {
            'en', 'ja',  # settings内の配列
            'name', 'name_en', 'race', 'fightingStyle', 'attribute', 
            'imgThumbsize', 'imageThumbPosition'  # キャラ内の配列
        }
    
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
            
            if key in compact_fields:
                # 指定されたフィールドは1行形式
                return json.dumps(value, ensure_ascii=False, separators=(', ', ': '))
            else:
                # その他のリストは通常の整形
                if all(isinstance(item, (str, int, float, bool)) or item is None for item in value):
                    # プリミティブ要素のみの場合は適切に整形
                    if len(value) == 1 or (len(value) <= 3 and all(isinstance(item, (str, int)) for item in value)):
                        # 短い配列は1行に
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

def save_json_with_custom_format(data, file_path, compact_fields=None):
    """
    JSONを特定フィールドが1行形式のカスタム形式で保存
    """
    formatted_json = format_json_custom(data, compact_fields)
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(formatted_json)

if __name__ == "__main__":
    # テスト用
    JSON_PATH = os.path.join(os.path.dirname(__file__), '../cha.json')
    
    try:
        with open(JSON_PATH, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        # バックアップを作成
        backup_path = JSON_PATH + '.backup'
        with open(backup_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=4)
        print(f"バックアップを作成しました: {backup_path}")
        
        # カスタム形式で保存
        save_json_with_custom_format(data, JSON_PATH)
        print(f"カスタム形式で保存しました: {JSON_PATH}")
        
    except Exception as e:
        print(f"エラー: {e}")