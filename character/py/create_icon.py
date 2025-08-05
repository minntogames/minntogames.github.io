# -*- coding: utf-8 -*-
"""
簡単なアイコン作成スクリプト
PIL（Pillow）を使用してアプリ用のアイコンを作成
"""
try:
    from PIL import Image, ImageDraw, ImageFont
    import os
    
    # 32x32のアイコンを作成
    size = 32
    img = Image.new('RGBA', (size, size), (70, 130, 180, 255))  # Steel Blue
    draw = ImageDraw.Draw(img)
    
    # 文字を描画
    try:
        # システムフォントを試す
        font = ImageFont.truetype("arial.ttf", 16)
    except:
        font = ImageFont.load_default()
    
    # "CHA" を描画
    text = "CHA"
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    
    x = (size - text_width) // 2
    y = (size - text_height) // 2 - 2
    
    draw.text((x, y), text, fill=(255, 255, 255, 255), font=font)
    
    # ICOファイルとして保存
    icon_path = os.path.join(os.path.dirname(__file__), 'cha_editor.ico')
    img.save(icon_path, format='ICO', sizes=[(32, 32)])
    print(f"アイコンを作成しました: {icon_path}")
    
except ImportError:
    print("PIL（Pillow）がインストールされていません。")
    print("pip install Pillow でインストールしてください。")
except Exception as e:
    print(f"アイコン作成エラー: {e}")
