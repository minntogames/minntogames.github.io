import os
import json

def get_dir_structure(root_dir):
    """
    指定されたディレクトリの構造を再帰的に取得し、JSON形式で表現する。
    """
    dir_structure = []
    for item in os.listdir(root_dir):
        item_path = os.path.join(root_dir, item)
        if os.path.isdir(item_path):
            dir_structure.append({
                "name": item,
                "type": "directory",
                "children": get_dir_structure(item_path)
            })
        else:
            dir_structure.append({
                "name": item,
                "type": "file",
                "path": os.path.relpath(item_path, start=os.path.dirname(__file__)).replace('\\', '/')
            })
    return dir_structure

def custom_sort(items, order_list=None):
    """
    指定された順序でアイテムをソートする関数
    order_listに含まれる名前は指定された順序で、それ以外はアルファベット順
    """
    if order_list is None:
        order_list = []
    
    def sort_key(item):
        name = item['name']
        if name in order_list:
            return (0, order_list.index(name))
        else:
            return (1, name.lower())
    
    return sorted(items, key=sort_key)

if __name__ == "__main__":
    # このスクリプトが置かれているディレクトリを基準にする
    base_dir = os.path.dirname(os.path.abspath(__file__))
    target_dir = os.path.join(base_dir, "old bots")
    
    if os.path.exists(target_dir):
        file_tree = get_dir_structure(target_dir)
        
        # トップレベルのフォルダを指定された順序でソート
        custom_order = ["tirumiru", "ataibot v13-2", "ataibot v13-6"]
        file_tree = custom_sort(file_tree, custom_order)
        
        # "old bots" をルートとする構造に変更
        output_structure = {
            "name": "old bots",
            "type": "directory",
            "children": file_tree
        }

        output_path = os.path.join(base_dir, "file_tree.json")
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(output_structure, f, indent=2, ensure_ascii=False)
        
        print(f"ファイルツリーが {output_path} に生成されました。")
    else:
        print(f"エラー: '{target_dir}' が見つかりません。")
