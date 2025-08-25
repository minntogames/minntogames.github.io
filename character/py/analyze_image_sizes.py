#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
画像サイズ分析スクリプト
768x900以外の画像をリストアップします
"""

import os
from PIL import Image
import json

def analyze_image_sizes():
    """画像サイズを分析してリストアップ"""
    
    # 画像フォルダのパス
    img_folder = os.path.join(os.path.dirname(__file__), '..', 'img')
    
    # 基準サイズ
    base_size = (768, 900)
    
    # 結果を格納するリスト
    different_sizes = []
    same_sizes = []
    errors = []
    
    print("=== 画像サイズ分析開始 ===")
    print(f"基準サイズ: {base_size[0]}x{base_size[1]}")
    print()
    
    # 画像ファイルを処理
    image_files = [f for f in os.listdir(img_folder) if f.lower().endswith(('.webp', '.png', '.jpg', '.jpeg'))]
    image_files.sort()
    
    for filename in image_files:
        filepath = os.path.join(img_folder, filename)
        
        try:
            with Image.open(filepath) as img:
                size = img.size
                
                if size != base_size:
                    different_sizes.append({
                        'filename': filename,
                        'size': size,
                        'ratio_x': size[0] / base_size[0],
                        'ratio_y': size[1] / base_size[1]
                    })
                else:
                    same_sizes.append(filename)
                    
        except Exception as e:
            errors.append({
                'filename': filename,
                'error': str(e)
            })
    
    # 結果を表示
    print(f"=== 分析結果 ===")
    print(f"総ファイル数: {len(image_files)}")
    print(f"基準サイズ(768x900): {len(same_sizes)}ファイル")
    print(f"異なるサイズ: {len(different_sizes)}ファイル")
    print(f"エラー: {len(errors)}ファイル")
    print()
    
    if different_sizes:
        print("=== 768x900以外の画像 ===")
        for item in different_sizes:
            print(f"{item['filename']: <15} {item['size'][0]: >4}x{item['size'][1]: <4} (比率: X={item['ratio_x']:.2f}, Y={item['ratio_y']:.2f})")
        print()
    
    if errors:
        print("=== エラーファイル ===")
        for item in errors:
            print(f"{item['filename']}: {item['error']}")
        print()
    
    # JSONファイルとして保存
    result_data = {
        'base_size': base_size,
        'analysis_date': '2025-08-26',
        'total_files': len(image_files),
        'base_size_count': len(same_sizes),
        'different_size_count': len(different_sizes),
        'error_count': len(errors),
        'base_size_files': same_sizes,
        'different_size_files': different_sizes,
        'errors': errors
    }
    
    result_file = os.path.join(os.path.dirname(__file__), 'image_size_analysis.json')
    with open(result_file, 'w', encoding='utf-8') as f:
        json.dump(result_data, f, ensure_ascii=False, indent=2)
    
    print(f"分析結果を保存しました: {result_file}")
    
    return different_sizes

def generate_conversion_factors():
    """異なるサイズの画像用の変換係数を生成"""
    different_sizes = analyze_image_sizes()
    
    if not different_sizes:
        print("すべての画像が基準サイズです。")
        return
    
    print("\n=== 推奨変換係数 ===")
    print("以下の係数をimage_editor.pyで使用してください：")
    print()
    
    for item in different_sizes:
        filename = item['filename']
        size = item['size']
        ratio_x = item['ratio_x']
        ratio_y = item['ratio_y']
        
        print(f"# {filename} ({size[0]}x{size[1]})")
        print(f"if img_filename == '{filename}':")
        print(f"    size_factor_x = {ratio_x:.3f}")
        print(f"    size_factor_y = {ratio_y:.3f}")
        print()

if __name__ == "__main__":
    try:
        generate_conversion_factors()
    except Exception as e:
        print(f"エラーが発生しました: {e}")
        import traceback
        traceback.print_exc()
