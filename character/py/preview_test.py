# -*- coding: utf-8 -*-
"""
画像プレビューのテスト用スクリプト
特定のキャラクターの設定でプレビューを確認する
"""
import tkinter as tk
from tkinter import ttk
import json
import os

try:
    from PIL import Image, ImageTk
    PIL_AVAILABLE = True
except ImportError:
    PIL_AVAILABLE = False
    print("PIL not available")

JSON_PATH = os.path.join(os.path.dirname(__file__), '../cha.json')

class PreviewTest(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title('画像プレビューテスト - Xドクター')
        self.geometry('800x600')
        
        # Xドクターの設定
        self.test_data = {
            'img': '1-0.webp',
            'imgsize': '300%',
            'imageZoomPosition': '-190px -150px',
            'imgsize_mobile': '300%',
            'imageZoomPosition_mobile': '-120px -100px'
        }
        
        self.create_widgets()
        self.update_preview()
        
    def create_widgets(self):
        # 設定表示
        info_frame = tk.Frame(self)
        info_frame.pack(side=tk.TOP, fill=tk.X, padx=10, pady=10)
        
        tk.Label(info_frame, text="Xドクターの設定:", font=('Arial', 12, 'bold')).pack(anchor=tk.W)
        for key, value in self.test_data.items():
            tk.Label(info_frame, text=f"  {key}: {value}").pack(anchor=tk.W)
        
        # プレビューエリア
        preview_frame = tk.Frame(self)
        preview_frame.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        
        # PCプレビュー
        pc_frame = tk.LabelFrame(preview_frame, text="PC表示 (200px)")
        pc_frame.pack(side=tk.LEFT, padx=5)
        self.pc_canvas = tk.Canvas(pc_frame, width=250, height=250, bg='#f0f0f0')
        self.pc_canvas.pack(padx=10, pady=10)
        
        # モバイルプレビュー
        mobile_frame = tk.LabelFrame(preview_frame, text="モバイル表示 (120px)")
        mobile_frame.pack(side=tk.LEFT, padx=5)
        self.mobile_canvas = tk.Canvas(mobile_frame, width=180, height=180, bg='#f0f0f0')
        self.mobile_canvas.pack(padx=10, pady=10)
        
        self.preview_images = {}
        
    def parse_size(self, value):
        if not value:
            return 100
        value = str(value).strip()
        if value.endswith('%'):
            try:
                return float(value[:-1])
            except:
                return 100
        return 100
    
    def parse_position(self, value):
        if not value:
            return 0, 0
        value = str(value).strip().lower()
        if value == 'center':
            return 0, 0
        parts = value.split()
        if len(parts) >= 2:
            try:
                x = float(parts[0].replace('px', ''))
                y = float(parts[1].replace('px', ''))
                return x, y
            except:
                return 0, 0
        return 0, 0
    
    def create_preview(self, canvas, is_mobile=False):
        canvas.delete('all')
        
        if not PIL_AVAILABLE:
            canvas.create_text(125, 125, text="PIL not available", fill='red')
            return
            
        # 設定値を取得
        if is_mobile:
            size_val = self.test_data['imgsize_mobile']
            pos_val = self.test_data['imageZoomPosition_mobile']
            frame_w, frame_h = 120, 120
            canvas_w, canvas_h = 180, 180
        else:
            size_val = self.test_data['imgsize']
            pos_val = self.test_data['imageZoomPosition']
            frame_w, frame_h = 200, 200
            canvas_w, canvas_h = 250, 250
        
        # 画像を読み込み
        img_path = os.path.join(os.path.dirname(__file__), '../img', self.test_data['img'])
        if not os.path.exists(img_path):
            canvas.create_text(canvas_w//2, canvas_h//2, text="画像なし", fill='red')
            return
            
        try:
            original_img = Image.open(img_path)
            
            # サイズ計算
            size_percent = self.parse_size(size_val)
            orig_w, orig_h = original_img.size
            
            # ウェブサイトでの計算と同じ
            img_width = frame_w * size_percent / 100
            img_height = frame_h
            
            # object-fit: cover のシミュレーション
            img_aspect = orig_w / orig_h
            frame_aspect = frame_w / frame_h
            
            if img_aspect > frame_aspect:
                # 横長：高さを基準にスケール
                scale = img_height / orig_h
                scaled_w = int(orig_w * scale)
                scaled_h = img_height
            else:
                # 縦長：幅を基準にスケール
                scale = img_width / orig_w
                scaled_w = img_width
                scaled_h = int(orig_h * scale)
            
            # 画像をリサイズ
            resized_img = original_img.resize((int(scaled_w), int(scaled_h)), Image.LANCZOS)
            
            # object-position の適用
            pos_x, pos_y = self.parse_position(pos_val)
            
            # キャンバス中央
            canvas_center_x = canvas_w // 2
            canvas_center_y = canvas_h // 2
            
            # 画像の基準点計算
            img_anchor_x = scaled_w // 2 - pos_x
            img_anchor_y = scaled_h // 2 - pos_y
            
            # フレーム範囲でクロップ
            frame_left = canvas_center_x - frame_w // 2
            frame_top = canvas_center_y - frame_h // 2
            
            img_left = canvas_center_x - img_anchor_x
            img_top = canvas_center_y - img_anchor_y
            
            visible_left = max(0, frame_left - img_left)
            visible_top = max(0, frame_top - img_top)
            visible_right = min(scaled_w, visible_left + frame_w)
            visible_bottom = min(scaled_h, visible_top + frame_h)
            
            if visible_right > visible_left and visible_bottom > visible_top:
                crop_box = (int(visible_left), int(visible_top), int(visible_right), int(visible_bottom))
                final_img = resized_img.crop(crop_box)
            else:
                final_img = Image.new('RGB', (frame_w, frame_h), (255, 255, 255))
            
            # 表示
            tk_img = ImageTk.PhotoImage(final_img)
            self.preview_images[f"{'mobile' if is_mobile else 'pc'}"] = tk_img
            
            canvas.create_image(canvas_center_x, canvas_center_y, image=tk_img)
            
            # フレーム枠
            canvas.create_rectangle(
                canvas_center_x - frame_w // 2,
                canvas_center_y - frame_h // 2,
                canvas_center_x + frame_w // 2,
                canvas_center_y + frame_h // 2,
                outline="red", width=2
            )
            
            # 中央線
            canvas.create_line(canvas_center_x, 0, canvas_center_x, canvas_h, fill="#ddd")
            canvas.create_line(0, canvas_center_y, canvas_w, canvas_center_y, fill="#ddd")
            
            # 情報表示
            info_text = f"size: {size_percent}%, pos: {pos_x}, {pos_y}"
            canvas.create_text(10, 10, text=info_text, anchor=tk.NW, fill="blue")
            
        except Exception as e:
            canvas.create_text(canvas_w//2, canvas_h//2, text=f"Error: {e}", fill='red')
    
    def update_preview(self):
        self.create_preview(self.pc_canvas, False)
        self.create_preview(self.mobile_canvas, True)

if __name__ == '__main__':
    app = PreviewTest()
    app.mainloop()
