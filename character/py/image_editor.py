# -*- coding: utf-8 -*-
import tkinter as tk
from tkinter import ttk, messagebox
import json
import os

try:
    from PIL import Image, ImageTk
    PIL_AVAILABLE = True
except ImportError:
    PIL_AVAILABLE = False
    messagebox.showwarning('警告', 'PIL (Pillow) がインストールされていません。\n画像プレビュー機能が利用できません。\n\npip install Pillow でインストールしてください。')

JSON_PATH = os.path.join(os.path.dirname(__file__), '../cha.json')

class ImageEditor(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title('キャラクター画像エディタ')
        self.geometry('1200x800')
        self.resizable(True, True)
        
        self.data = []
        self.characters = []
        self.selected_char_idx = None
        self.selected_style_idx = None
        
        self.create_widgets()
        self.load_json()
        
    def create_widgets(self):
        # メインフレーム
        main_frame = tk.PanedWindow(self, orient=tk.HORIZONTAL, sashrelief=tk.RAISED, sashwidth=8)
        main_frame.pack(fill=tk.BOTH, expand=True)
        
        # 左側: キャラクターリスト
        left_frame = tk.Frame(main_frame)
        main_frame.add(left_frame, minsize=250)
        
        tk.Label(left_frame, text="キャラクター一覧", font=('Arial', 12, 'bold')).pack(pady=5)
        
        # キャラクターリストボックス
        list_frame = tk.Frame(left_frame)
        list_frame.pack(fill=tk.BOTH, expand=True, padx=5, pady=5)
        
        self.char_listbox = tk.Listbox(list_frame)
        char_scrollbar = tk.Scrollbar(list_frame, orient=tk.VERTICAL, command=self.char_listbox.yview)
        self.char_listbox.configure(yscrollcommand=char_scrollbar.set)
        
        self.char_listbox.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        char_scrollbar.pack(side=tk.RIGHT, fill=tk.Y)
        
        self.char_listbox.bind('<<ListboxSelect>>', self.on_char_select)
        
        # 中央: 編集エリア
        center_frame = tk.Frame(main_frame)
        main_frame.add(center_frame, minsize=400)
        
        # 編集エリアのスクロール
        canvas = tk.Canvas(center_frame)
        scrollbar = tk.Scrollbar(center_frame, orient="vertical", command=canvas.yview)
        scrollable_frame = tk.Frame(canvas)
        
        scrollable_frame.bind(
            "<Configure>",
            lambda e: canvas.configure(scrollregion=canvas.bbox("all"))
        )
        
        canvas.create_window((0, 0), window=scrollable_frame, anchor="nw")
        canvas.configure(yscrollcommand=scrollbar.set)
        
        canvas.pack(side="left", fill="both", expand=True)
        scrollbar.pack(side="right", fill="y")
        
        # 編集フィールド
        self.create_edit_fields(scrollable_frame)
        
        # 右側: プレビューエリア
        right_frame = tk.Frame(main_frame)
        main_frame.add(right_frame, minsize=500)
        
        self.create_preview_area(right_frame)
        
        # 下部: 保存ボタン
        bottom_frame = tk.Frame(self)
        bottom_frame.pack(side=tk.BOTTOM, fill=tk.X, pady=5)
        
        tk.Button(bottom_frame, text='保存', command=self.save_changes, 
                 bg='#4CAF50', fg='white', font=('Arial', 12, 'bold')).pack(side=tk.RIGHT, padx=10)
        tk.Button(bottom_frame, text='リセット', command=self.reset_fields,
                 bg='#f44336', fg='white', font=('Arial', 12)).pack(side=tk.RIGHT, padx=5)
    
    def create_edit_fields(self, parent):
        tk.Label(parent, text="画像設定", font=('Arial', 14, 'bold')).grid(row=0, column=0, columnspan=3, pady=10)
        
        self.fields = {}
        row = 1
        
        # スタイル選択
        tk.Label(parent, text="スタイル:").grid(row=row, column=0, sticky=tk.W, padx=5, pady=2)
        self.style_var = tk.StringVar()
        self.style_combo = ttk.Combobox(parent, textvariable=self.style_var, state='readonly', width=20)
        self.style_combo.grid(row=row, column=1, sticky=tk.W, padx=5, pady=2)
        self.style_combo.bind('<<ComboboxSelected>>', self.on_style_change)
        row += 1
        
        # 画像ファイル
        tk.Label(parent, text="画像ファイル:").grid(row=row, column=0, sticky=tk.W, padx=5, pady=2)
        self.fields['img'] = tk.Entry(parent, width=40)
        self.fields['img'].grid(row=row, column=1, sticky=tk.W, padx=5, pady=2)
        self.fields['img'].bind('<KeyRelease>', self.on_field_change)
        row += 1
        
        # PCサイズ設定
        tk.Label(parent, text="PC画像サイズ:", font=('Arial', 12, 'bold')).grid(row=row, column=0, columnspan=2, sticky=tk.W, padx=5, pady=(15, 5))
        row += 1
        
        tk.Label(parent, text="サイズ (imgsize):").grid(row=row, column=0, sticky=tk.W, padx=5, pady=2)
        size_frame = tk.Frame(parent)
        size_frame.grid(row=row, column=1, sticky=tk.W, padx=5, pady=2)
        
        self.fields['imgsize'] = tk.Entry(size_frame, width=15)
        self.fields['imgsize'].pack(side=tk.LEFT)
        self.fields['imgsize'].bind('<KeyRelease>', self.on_field_change)
        
        # サイズプリセットボタン
        for size in ['100%', '150%', '200%', '250%', '300%']:
            btn = tk.Button(size_frame, text=size, width=6,
                           command=lambda s=size: self.set_field_value('imgsize', s))
            btn.pack(side=tk.LEFT, padx=2)
        row += 1
        
        # PCサイズ用コントロールボタン (サイズ入力フォームの直下)
        self.create_size_controls_below(parent, 'imgsize', row)
        row += 1
        
        tk.Label(parent, text="位置 (imageZoomPosition):").grid(row=row, column=0, sticky=tk.W, padx=5, pady=2)
        pos_frame = tk.Frame(parent)
        pos_frame.grid(row=row, column=1, sticky=tk.W, padx=5, pady=2)
        
        self.fields['imageZoomPosition'] = tk.Entry(pos_frame, width=15)
        self.fields['imageZoomPosition'].pack(side=tk.LEFT)
        self.fields['imageZoomPosition'].bind('<KeyRelease>', self.on_field_change)
        row += 1
        
        # PC位置調整ボタン (フォームの直下)
        self.create_position_controls_below(parent, 'imageZoomPosition', row)
        row += 1
        
        # モバイルサイズ設定
        tk.Label(parent, text="モバイル画像サイズ:", font=('Arial', 12, 'bold')).grid(row=row, column=0, columnspan=2, sticky=tk.W, padx=5, pady=(15, 5))
        row += 1
        
        tk.Label(parent, text="サイズ (imgsize_mobile):").grid(row=row, column=0, sticky=tk.W, padx=5, pady=2)
        mobile_size_frame = tk.Frame(parent)
        mobile_size_frame.grid(row=row, column=1, sticky=tk.W, padx=5, pady=2)
        
        self.fields['imgsize_mobile'] = tk.Entry(mobile_size_frame, width=15)
        self.fields['imgsize_mobile'].pack(side=tk.LEFT)
        self.fields['imgsize_mobile'].bind('<KeyRelease>', self.on_field_change)
        
        # モバイルサイズプリセットボタン
        for size in ['100%', '150%', '200%', '250%', '300%']:
            btn = tk.Button(mobile_size_frame, text=size, width=6,
                           command=lambda s=size: self.set_field_value('imgsize_mobile', s))
            btn.pack(side=tk.LEFT, padx=2)
        row += 1
        
        # モバイルサイズ用コントロールボタン (サイズ入力フォームの直下)
        self.create_size_controls_below(parent, 'imgsize_mobile', row)
        row += 1
        
        tk.Label(parent, text="位置 (imageZoomPosition_mobile):").grid(row=row, column=0, sticky=tk.W, padx=5, pady=2)
        mobile_pos_frame = tk.Frame(parent)
        mobile_pos_frame.grid(row=row, column=1, sticky=tk.W, padx=5, pady=2)
        
        self.fields['imageZoomPosition_mobile'] = tk.Entry(mobile_pos_frame, width=15)
        self.fields['imageZoomPosition_mobile'].pack(side=tk.LEFT)
        self.fields['imageZoomPosition_mobile'].bind('<KeyRelease>', self.on_field_change)
        row += 1
        
        # モバイル位置調整ボタン (フォームの直下)
        self.create_position_controls_below(parent, 'imageZoomPosition_mobile', row)
        row += 1
        
        # サムネイル設定
        tk.Label(parent, text="サムネイル設定:", font=('Arial', 12, 'bold')).grid(row=row, column=0, columnspan=2, sticky=tk.W, padx=5, pady=(15, 5))
        row += 1
        
        tk.Label(parent, text="サムネイルサイズ:").grid(row=row, column=0, sticky=tk.W, padx=5, pady=2)
        self.fields['imgThumbsize'] = tk.Text(parent, width=40, height=3)
        self.fields['imgThumbsize'].grid(row=row, column=1, sticky=tk.W, padx=5, pady=2)
        self.fields['imgThumbsize'].bind('<KeyRelease>', self.on_field_change)
        row += 1
        
        tk.Label(parent, text="サムネイル位置:").grid(row=row, column=0, sticky=tk.W, padx=5, pady=2)
        self.fields['imageThumbPosition'] = tk.Text(parent, width=40, height=3)
        self.fields['imageThumbPosition'].grid(row=row, column=1, sticky=tk.W, padx=5, pady=2)
        self.fields['imageThumbPosition'].bind('<KeyRelease>', self.on_field_change)
        row += 1
    
    def create_position_controls_below(self, parent, field_name, row):
        """位置調整ボタンをフォームの直下に作成"""
        # 横並びコントロールフレーム (ラベル位置から開始)
        horizontal_control_frame = tk.Frame(parent)
        horizontal_control_frame.grid(row=row, column=0, columnspan=2, sticky=tk.W, padx=5, pady=2)
        
        # 方向ボタン (十字キー) - 左側
        direction_frame = tk.Frame(horizontal_control_frame)
        direction_frame.pack(side=tk.LEFT, padx=(0, 10))
        tk.Label(direction_frame, text="方向", font=('Arial', 8)).pack()
        
        btn_frame = tk.Frame(direction_frame)
        btn_frame.pack()
        
        tk.Button(btn_frame, text='↑', width=3,
                 command=lambda: self.adjust_position(field_name, 0, -10)).grid(row=0, column=1)
        tk.Button(btn_frame, text='←', width=3,
                 command=lambda: self.adjust_position(field_name, -10, 0)).grid(row=1, column=0)
        tk.Button(btn_frame, text='○', width=3,
                 command=lambda: self.set_field_value(field_name, 'center')).grid(row=1, column=1)
        tk.Button(btn_frame, text='→', width=3,
                 command=lambda: self.adjust_position(field_name, 10, 0)).grid(row=1, column=2)
        tk.Button(btn_frame, text='↓', width=3,
                 command=lambda: self.adjust_position(field_name, 0, 10)).grid(row=2, column=1)
        
        # 微調整 - 中央
        fine_frame = tk.Frame(horizontal_control_frame)
        fine_frame.pack(side=tk.LEFT, padx=(0, 10))
        tk.Label(fine_frame, text="微調整", font=('Arial', 8)).pack()
        
        fine_btn_frame = tk.Frame(fine_frame)
        fine_btn_frame.pack()
        tk.Button(fine_btn_frame, text='X+1', width=3,
                 command=lambda: self.adjust_position(field_name, 1, 0)).grid(row=0, column=0)
        tk.Button(fine_btn_frame, text='X-1', width=3,
                 command=lambda: self.adjust_position(field_name, -1, 0)).grid(row=0, column=1)
        tk.Button(fine_btn_frame, text='Y+1', width=3,
                 command=lambda: self.adjust_position(field_name, 0, 1)).grid(row=1, column=0)
        tk.Button(fine_btn_frame, text='Y-1', width=3,
                 command=lambda: self.adjust_position(field_name, 0, -1)).grid(row=1, column=1)
        
        # CSSキーワードボタン (プリセット) - 右側
        keyword_frame = tk.Frame(horizontal_control_frame)
        keyword_frame.pack(side=tk.LEFT, padx=(0, 10))
        tk.Label(keyword_frame, text="プリセット", font=('Arial', 8)).pack()
        
        keyword_btn_frame = tk.Frame(keyword_frame)
        keyword_btn_frame.pack()
        tk.Button(keyword_btn_frame, text='top', width=5,
                 command=lambda: self.set_field_value(field_name, 'top')).grid(row=0, column=0, padx=1)
        tk.Button(keyword_btn_frame, text='bottom', width=5,
                 command=lambda: self.set_field_value(field_name, 'bottom')).grid(row=0, column=1, padx=1)
        tk.Button(keyword_btn_frame, text='left', width=5,
                 command=lambda: self.set_field_value(field_name, 'left')).grid(row=1, column=0, padx=1)
        tk.Button(keyword_btn_frame, text='right', width=5,
                 command=lambda: self.set_field_value(field_name, 'right')).grid(row=1, column=1, padx=1)
        
        # 座標変換ボタン
        convert_frame = tk.Frame(horizontal_control_frame)
        convert_frame.pack(side=tk.LEFT, padx=(0, 10))
        tk.Label(convert_frame, text="座標変換", font=('Arial', 8)).pack()
        
        is_mobile = field_name.endswith('_mobile')
        
        convert_btn_frame = tk.Frame(convert_frame)
        convert_btn_frame.pack()
        tk.Button(convert_btn_frame, text='ウェブ→エディター', width=12, font=('Arial', 8),
                 command=lambda: self.convert_web_to_editor(field_name, is_mobile)).grid(row=0, column=0, pady=1)
        tk.Button(convert_btn_frame, text='エディター→ウェブ', width=12, font=('Arial', 8),
                 command=lambda: self.convert_editor_to_web(field_name, is_mobile)).grid(row=1, column=0, pady=1)
        tk.Button(convert_btn_frame, text='リセット', width=12, font=('Arial', 8),
                 command=lambda: self.set_field_value(field_name, 'center')).grid(row=2, column=0, pady=1)
        tk.Button(convert_btn_frame, text='テスト変換', width=12, font=('Arial', 8),
                 command=lambda: self.test_conversion(field_name, is_mobile)).grid(row=3, column=0, pady=1)
        
        # 精密調整フレーム
        precise_frame = tk.Frame(horizontal_control_frame)
        precise_frame.pack(side=tk.LEFT, padx=(0, 10))
        tk.Label(precise_frame, text="精密調整", font=('Arial', 8)).pack()
        
        precise_btn_frame = tk.Frame(precise_frame)
        precise_btn_frame.pack()
        tk.Button(precise_btn_frame, text='↑', width=2,
                 command=lambda: self.adjust_position(field_name, 0, -1)).grid(row=0, column=1)
        tk.Button(precise_btn_frame, text='←', width=2,
                 command=lambda: self.adjust_position(field_name, -1, 0)).grid(row=1, column=0)
        tk.Button(precise_btn_frame, text='●', width=2,
                 command=lambda: self.set_field_value(field_name, '0px 0px')).grid(row=1, column=1)
        tk.Button(precise_btn_frame, text='→', width=2,
                 command=lambda: self.adjust_position(field_name, 1, 0)).grid(row=1, column=2)
        tk.Button(precise_btn_frame, text='↓', width=2,
                 command=lambda: self.adjust_position(field_name, 0, 1)).grid(row=2, column=1)
    
    def create_size_controls_below(self, parent, field_name, row):
        """サイズ調整ボタンをフォームの直下に作成"""
        # 横並びコントロールフレーム (ラベル位置から開始)
        horizontal_control_frame = tk.Frame(parent)
        horizontal_control_frame.grid(row=row, column=0, columnspan=2, sticky=tk.W, padx=5, pady=2)
        
        # サイズ調整ボタン - 左側
        size_frame = tk.Frame(horizontal_control_frame)
        size_frame.pack(side=tk.LEFT, padx=(0, 10))
        tk.Label(size_frame, text="サイズ調整", font=('Arial', 8)).pack()
        
        size_btn_frame = tk.Frame(size_frame)
        size_btn_frame.pack()
        tk.Button(size_btn_frame, text='+10%', width=4,
                 command=lambda: self.adjust_size(field_name, 10)).grid(row=0, column=0)
        tk.Button(size_btn_frame, text='-10%', width=4,
                 command=lambda: self.adjust_size(field_name, -10)).grid(row=0, column=1)
        tk.Button(size_btn_frame, text='+1%', width=4,
                 command=lambda: self.adjust_size(field_name, 1)).grid(row=1, column=0)
        tk.Button(size_btn_frame, text='-1%', width=4,
                 command=lambda: self.adjust_size(field_name, -1)).grid(row=1, column=1)

    def create_position_controls(self, parent, field_name):
        """位置調整ボタンを作成"""
        control_frame = tk.Frame(parent)
        control_frame.pack(side=tk.LEFT, padx=10)
        
        # 横並びコントロールフレーム (左寄せ)
        horizontal_control_frame = tk.Frame(control_frame)
        horizontal_control_frame.pack(pady=5, anchor='w')
        
        # 方向ボタン (十字キー) - 左側
        direction_frame = tk.Frame(horizontal_control_frame)
        direction_frame.pack(side=tk.LEFT, padx=(0, 10))
        tk.Label(direction_frame, text="方向", font=('Arial', 8)).pack()
        
        btn_frame = tk.Frame(direction_frame)
        btn_frame.pack()
        
        tk.Button(btn_frame, text='↑', width=3,
                 command=lambda: self.adjust_position(field_name, 0, -10)).grid(row=0, column=1)
        tk.Button(btn_frame, text='←', width=3,
                 command=lambda: self.adjust_position(field_name, -10, 0)).grid(row=1, column=0)
        tk.Button(btn_frame, text='○', width=3,
                 command=lambda: self.set_field_value(field_name, 'center')).grid(row=1, column=1)
        tk.Button(btn_frame, text='→', width=3,
                 command=lambda: self.adjust_position(field_name, 10, 0)).grid(row=1, column=2)
        tk.Button(btn_frame, text='↓', width=3,
                 command=lambda: self.adjust_position(field_name, 0, 10)).grid(row=2, column=1)
        
        # 微調整 - 中央
        fine_frame = tk.Frame(horizontal_control_frame)
        fine_frame.pack(side=tk.LEFT, padx=(0, 10))
        tk.Label(fine_frame, text="微調整", font=('Arial', 8)).pack()
        
        fine_btn_frame = tk.Frame(fine_frame)
        fine_btn_frame.pack()
        tk.Button(fine_btn_frame, text='X+1', width=3,
                 command=lambda: self.adjust_position(field_name, 1, 0)).grid(row=0, column=0)
        tk.Button(fine_btn_frame, text='X-1', width=3,
                 command=lambda: self.adjust_position(field_name, -1, 0)).grid(row=0, column=1)
        tk.Button(fine_btn_frame, text='Y+1', width=3,
                 command=lambda: self.adjust_position(field_name, 0, 1)).grid(row=1, column=0)
        tk.Button(fine_btn_frame, text='Y-1', width=3,
                 command=lambda: self.adjust_position(field_name, 0, -1)).grid(row=1, column=1)
        
        # CSSキーワードボタン (プリセット) - 右側
        keyword_frame = tk.Frame(horizontal_control_frame)
        keyword_frame.pack(side=tk.LEFT, padx=(0, 10))
        tk.Label(keyword_frame, text="プリセット", font=('Arial', 8)).pack()
        
        keyword_btn_frame = tk.Frame(keyword_frame)
        keyword_btn_frame.pack()
        tk.Button(keyword_btn_frame, text='top', width=5,
                 command=lambda: self.set_field_value(field_name, 'top')).grid(row=0, column=0, padx=1)
        tk.Button(keyword_btn_frame, text='bottom', width=5,
                 command=lambda: self.set_field_value(field_name, 'bottom')).grid(row=0, column=1, padx=1)
        tk.Button(keyword_btn_frame, text='left', width=5,
                 command=lambda: self.set_field_value(field_name, 'left')).grid(row=1, column=0, padx=1)
        tk.Button(keyword_btn_frame, text='right', width=5,
                 command=lambda: self.set_field_value(field_name, 'right')).grid(row=1, column=1, padx=1)
        fine_btn_frame.pack()
        tk.Button(fine_btn_frame, text='X+1', width=3,
                 command=lambda: self.adjust_position(field_name, 1, 0)).grid(row=0, column=0)
        tk.Button(fine_btn_frame, text='X-1', width=3,
                 command=lambda: self.adjust_position(field_name, -1, 0)).grid(row=0, column=1)
        tk.Button(fine_btn_frame, text='Y+1', width=3,
                 command=lambda: self.adjust_position(field_name, 0, 1)).grid(row=1, column=0)
        tk.Button(fine_btn_frame, text='Y-1', width=3,
                 command=lambda: self.adjust_position(field_name, 0, -1)).grid(row=1, column=1)
        
        # 座標変換ボタン
        convert_frame = tk.Frame(control_frame)
        convert_frame.pack(pady=5)
        tk.Label(convert_frame, text="座標変換", font=('Arial', 8)).pack()
        
        is_mobile = field_name.endswith('_mobile')
        
        tk.Button(convert_frame, text='ウェブ→エディター', width=12, font=('Arial', 8),
                 command=lambda: self.convert_web_to_editor(field_name, is_mobile)).pack(pady=1)
        tk.Button(convert_frame, text='エディター→ウェブ', width=12, font=('Arial', 8),
                 command=lambda: self.convert_editor_to_web(field_name, is_mobile)).pack(pady=1)
        tk.Button(convert_frame, text='リセット', width=12, font=('Arial', 8),
                 command=lambda: self.set_field_value(field_name, 'center')).pack(pady=1)
        tk.Button(convert_frame, text='テスト変換', width=12, font=('Arial', 8),
                 command=lambda: self.test_conversion(field_name, is_mobile)).pack(pady=1)
        
        # 精密調整フレーム
        precise_frame = tk.Frame(control_frame)
        precise_frame.pack(pady=5)
        tk.Label(precise_frame, text="精密調整", font=('Arial', 8)).pack()
        
        precise_btn_frame = tk.Frame(precise_frame)
        precise_btn_frame.pack()
        tk.Button(precise_btn_frame, text='↑', width=2,
                 command=lambda: self.adjust_position(field_name, 0, -1)).grid(row=0, column=1)
        tk.Button(precise_btn_frame, text='←', width=2,
                 command=lambda: self.adjust_position(field_name, -1, 0)).grid(row=1, column=0)
        tk.Button(precise_btn_frame, text='●', width=2,
                 command=lambda: self.set_field_value(field_name, '0px 0px')).grid(row=1, column=1)
        tk.Button(precise_btn_frame, text='→', width=2,
                 command=lambda: self.adjust_position(field_name, 1, 0)).grid(row=1, column=2)
        tk.Button(precise_btn_frame, text='↓', width=2,
                 command=lambda: self.adjust_position(field_name, 0, 1)).grid(row=2, column=1)
    
    def create_preview_area(self, parent):
        tk.Label(parent, text="プレビュー", font=('Arial', 14, 'bold')).pack(pady=5)
        
        # プレビューコントロール
        control_frame = tk.Frame(parent)
        control_frame.pack(fill=tk.X, padx=10, pady=5)
        
        tk.Button(control_frame, text="プレビュー更新", command=self.update_preview,
                 bg='#2196F3', fg='white').pack(side=tk.RIGHT)
        
        # プレビューキャンバス
        preview_frame = tk.Frame(parent)
        preview_frame.pack(fill=tk.BOTH, expand=True, padx=10, pady=5)
        
        # PCプレビュー
        pc_frame = tk.LabelFrame(preview_frame, text="PC表示 (200px)", padx=5, pady=5)
        pc_frame.pack(side=tk.LEFT, padx=5)
        self.pc_canvas = tk.Canvas(pc_frame, width=200, height=200, bg='white', bd=1, relief=tk.SUNKEN)
        self.pc_canvas.pack()
        
        # モバイルプレビュー
        mobile_frame = tk.LabelFrame(preview_frame, text="モバイル表示 (120px)", padx=5, pady=5)
        mobile_frame.pack(side=tk.LEFT, padx=5)
        self.mobile_canvas = tk.Canvas(mobile_frame, width=120, height=120, bg='white', bd=1, relief=tk.SUNKEN)
        self.mobile_canvas.pack()
        
        # 詳細プレビュー
        detail_frame = tk.LabelFrame(preview_frame, text="詳細表示", padx=5, pady=5)
        detail_frame.pack(side=tk.LEFT, padx=5, fill=tk.BOTH, expand=True)
        self.detail_canvas = tk.Canvas(detail_frame, width=300, height=300, bg='#f0f0f0', bd=1, relief=tk.SUNKEN)
        self.detail_canvas.pack()
        
        self.preview_images = {}  # 画像参照保持用
    
    def load_json(self):
        try:
            with open(JSON_PATH, 'r', encoding='utf-8') as f:
                self.data = json.load(f)
            self.characters = self.data[1:]
            self.populate_char_list()
        except Exception as e:
            messagebox.showerror('エラー', f'cha.jsonの読み込みに失敗しました\n{e}')
    
    def populate_char_list(self):
        self.char_listbox.delete(0, tk.END)
        for i, char in enumerate(self.characters):
            name = char.get('name', '')
            if isinstance(name, list) and name:
                display_name = name[0] if isinstance(name[0], str) else str(name[0])
            else:
                display_name = str(name) if name else '(名前なし)'
            
            self.char_listbox.insert(tk.END, f"{char.get('id', '?')}: {display_name}")
    
    def on_char_select(self, event):
        selection = self.char_listbox.curselection()
        if not selection:
            return
        
        self.selected_char_idx = selection[0]
        char = self.characters[self.selected_char_idx]
        
        # スタイル一覧を更新
        self.update_style_list(char)
        
        # 最初のスタイルを選択
        if self.style_combo['values']:
            self.style_combo.current(0)
            self.on_style_change()
    
    def update_style_list(self, char):
        """スタイル一覧を更新"""
        styles = []
        name = char.get('name', '')
        
        if isinstance(name, list):
            if name and isinstance(name[0], list):
                # 2次元配列の場合
                for i, style_names in enumerate(name):
                    if isinstance(style_names, list) and style_names:
                        styles.append(f"スタイル{i+1}: {style_names[0]}")
                    else:
                        styles.append(f"スタイル{i+1}: {style_names}")
            else:
                # 1次元配列の場合
                for i, style_name in enumerate(name):
                    styles.append(f"スタイル{i+1}: {style_name}")
        else:
            styles.append(f"スタイル1: {name}")
        
        self.style_combo['values'] = styles
    
    def on_style_change(self, event=None):
        """スタイル変更時の処理"""
        if not hasattr(self, 'selected_char_idx') or self.selected_char_idx is None:
            return
        
        style_selection = self.style_combo.current()
        if style_selection < 0:
            return
        
        self.selected_style_idx = style_selection
        self.load_char_data()
        self.update_preview()
    
    def load_char_data(self):
        """選択されたキャラクターとスタイルのデータを読み込み"""
        if self.selected_char_idx is None or self.selected_style_idx is None:
            return
        
        char = self.characters[self.selected_char_idx]
        style_idx = self.selected_style_idx
        
        # 各フィールドの値を設定
        for field_name, widget in self.fields.items():
            value = char.get(field_name, '')
            display_value = self.get_style_value(value, style_idx)
            
            if isinstance(widget, tk.Text):
                widget.delete('1.0', tk.END)
                if isinstance(display_value, list):
                    widget.insert('1.0', '\n'.join(str(v) for v in display_value))
                else:
                    widget.insert('1.0', str(display_value) if display_value else '')
            else:
                widget.delete(0, tk.END)
                widget.insert(0, str(display_value) if display_value else '')
    
    def get_style_value(self, value, style_idx):
        """スタイルに対応する値を取得"""
        if isinstance(value, list):
            if style_idx < len(value):
                return value[style_idx]
            else:
                return '' if len(value) == 0 else value[0]
        else:
            return value if style_idx == 0 else ''
    
    def on_field_change(self, event=None):
        """フィールド変更時の処理"""
        self.schedule_preview_update()
    
    def schedule_preview_update(self):
        """プレビュー更新をスケジュール"""
        if hasattr(self, '_preview_after'):
            self.after_cancel(self._preview_after)
        self._preview_after = self.after(300, self.update_preview)
    
    def set_field_value(self, field_name, value):
        """フィールドに値を設定"""
        widget = self.fields[field_name]
        if isinstance(widget, tk.Text):
            widget.delete('1.0', tk.END)
            widget.insert('1.0', value)
        else:
            widget.delete(0, tk.END)
            widget.insert(0, value)
        self.schedule_preview_update()
    
    def adjust_position(self, field_name, dx, dy):
        """位置を調整"""
        widget = self.fields[field_name]
        current = widget.get()
        
        # 現在の位置を解析
        x, y = self.parse_position(current)
        
        # 新しい位置
        new_x = x + dx
        new_y = y + dy
        
        # 特別な値（centerなど）から数値に変換された場合はpx単位で表記
        new_value = f"{int(new_x)}px {int(new_y)}px"
        self.set_field_value(field_name, new_value)
    
    def parse_position(self, value):
        """位置文字列を解析（CSS object-position形式に対応）"""
        if not value:
            return 0, 0
        
        value = str(value).strip().lower()
        
        # CSS object-position キーワードの処理
        if value == 'center':
            return 0, 0
        elif value == 'top':
            return 0, -50
        elif value == 'bottom':
            return 0, 50
        elif value == 'left':
            return -50, 0
        elif value == 'right':
            return 50, 0
        elif value == 'top left':
            return -50, -50
        elif value == 'top right':
            return 50, -50
        elif value == 'bottom left':
            return -50, 50
        elif value == 'bottom right':
            return 50, 50
        
        # 数値形式の処理
        parts = value.split()
        if len(parts) >= 2:
            try:
                x = float(parts[0].replace('px', ''))
                y = float(parts[1].replace('px', ''))
                return x, y
            except:
                return 0, 0
        elif len(parts) == 1:
            try:
                # 単一値の場合はX座標のみ
                x = float(parts[0].replace('px', ''))
                return x, 0
            except:
                return 0, 0
        
        return 0, 0
    
    def parse_size(self, value):
        """サイズ文字列を解析"""
        if not value:
            return 100
        
        value = str(value).strip()
        if value.endswith('%'):
            try:
                return float(value[:-1])
            except:
                return 100
        elif value.endswith('px'):
            try:
                return float(value[:-2])
            except:
                return 100
        else:
            try:
                return float(value)
            except:
                return 100
    
    def editor_to_web_position(self, editor_x, editor_y, is_mobile=False):
        """エディターの位置をウェブサイトの位置に変換（全画像768x900統一版）"""
        # 全画像が768x900に統一されたため、画像サイズによる調整は不要
        if is_mobile:
            # モバイル用の変換係数
            web_x = -48 * editor_x - 2
            web_y = -2.8 * editor_y + 88
        else:
            # PC用の変換係数（実測データから）
            web_x = -47 * editor_x - 2
            web_y = -2.76 * editor_y + 85
        
        return int(web_x), int(web_y)
    
    def web_to_editor_position(self, web_x, web_y, is_mobile=False):
        """ウェブサイトの位置をエディターの位置に変換（全画像768x900統一版）"""
        # 全画像が768x900に統一されたため、画像サイズによる調整は不要
        if is_mobile:
            # モバイル座標からエディター座標へ
            editor_x = -(web_x + 2) / 48
            editor_y = (web_y - 88) / (-2.8)
        else:
            # PC座標からエディター座標へ
            editor_x = -(web_x + 2) / 47
            editor_y = (web_y - 85) / (-2.76)
        
        return int(editor_x), int(editor_y)
    
    def get_current_image_size(self):
        """現在選択されている画像のサイズを取得（全画像768x900統一版）"""
        # 全画像が768x900に統一されたため、固定値を返す
        return (768, 900)
    
    def convert_web_to_editor(self, field_name, is_mobile):
        """ウェブサイトの座標をエディター座標に変換して設定（全画像768x900統一版）"""
        current_value = self.fields[field_name].get().strip()
        if not current_value:
            return
        
        # 現在の値を解析
        web_x, web_y = self.parse_position(current_value)
        
        # エディター座標に変換
        editor_x, editor_y = self.web_to_editor_position(web_x, web_y, is_mobile)
        
        # 新しい値を設定
        new_value = f"{editor_x}px {editor_y}px"
        self.set_field_value(field_name, new_value)
        
        device_type = "モバイル" if is_mobile else "PC"
        print(f"[{device_type}] 変換: ウェブ({web_x}, {web_y}) → エディター({editor_x}, {editor_y})")
    
    def convert_editor_to_web(self, field_name, is_mobile):
        """エディターの座標をウェブサイト座標に変換して設定（全画像768x900統一版）"""
        current_value = self.fields[field_name].get().strip()
        if not current_value:
            return
        
        # 現在の値を解析
        editor_x, editor_y = self.parse_position(current_value)
        
        # ウェブ座標に変換
        web_x, web_y = self.editor_to_web_position(editor_x, editor_y, is_mobile)
        
        # 新しい値を設定
        new_value = f"{web_x}px {web_y}px"
        self.set_field_value(field_name, new_value)
        
        device_type = "モバイル" if is_mobile else "PC"
        print(f"[{device_type}] 変換: エディター({editor_x}, {editor_y}) → ウェブ({web_x}, {web_y})")
        
        # 検証: 逆変換して元の値に戻るかチェック
        check_x, check_y = self.web_to_editor_position(web_x, web_y, is_mobile)
        if abs(check_x - editor_x) <= 1 and abs(check_y - editor_y) <= 1:
            print(f"[{device_type}] 変換検証: OK (逆変換: {check_x}, {check_y})")
        else:
            print(f"[{device_type}] 変換検証: 誤差あり (逆変換: {check_x}, {check_y})")
    
    def test_conversion(self, field_name, is_mobile):
        """変換係数をテストする（全画像768x900統一版）"""
        device_type = "モバイル" if is_mobile else "PC"
        
        print(f"\n=== [{device_type}] 変換テスト開始 ===")
        print("全画像が768x900に統一されました")
        
        # テストケース1: 実測データ（ID1用）
        test_web_x, test_web_y = -190, -150
        editor_x, editor_y = self.web_to_editor_position(test_web_x, test_web_y, is_mobile)
        back_web_x, back_web_y = self.editor_to_web_position(editor_x, editor_y, is_mobile)
        
        print(f"実測テスト: ウェブ({test_web_x}, {test_web_y}) → エディター({editor_x}, {editor_y}) → ウェブ({back_web_x}, {back_web_y})")
        
        # テストケース2: center
        test_web_x, test_web_y = 0, 0
        editor_x, editor_y = self.web_to_editor_position(test_web_x, test_web_y, is_mobile)
        back_web_x, back_web_y = self.editor_to_web_position(editor_x, editor_y, is_mobile)
        
        print(f"centerテスト: ウェブ({test_web_x}, {test_web_y}) → エディター({editor_x}, {editor_y}) → ウェブ({back_web_x}, {back_web_y})")
        
        # テストケース3: よく使われる座標
        common_coords = [(-100, -100), (-50, -50), (50, 50), (100, 100)]
        for test_web_x, test_web_y in common_coords:
            editor_x, editor_y = self.web_to_editor_position(test_web_x, test_web_y, is_mobile)
            back_web_x, back_web_y = self.editor_to_web_position(editor_x, editor_y, is_mobile)
            error_x = abs(back_web_x - test_web_x)
            error_y = abs(back_web_y - test_web_y)
            status = "OK" if error_x <= 1 and error_y <= 1 else "誤差あり"
            print(f"座標({test_web_x: >4}, {test_web_y: >4}) → ({editor_x: >3}, {editor_y: >3}) → ({back_web_x: >4}, {back_web_y: >4}) [{status}]")
        
        print(f"=== [{device_type}] 変換テスト終了 ===\n")
    
    def update_preview(self):
        """プレビューを更新"""
        if not PIL_AVAILABLE:
            return
        
        if self.selected_char_idx is None or self.selected_style_idx is None:
            self.clear_previews()
            return
        
        # 画像ファイル名を取得
        img_field = self.fields['img'].get().strip()
        if not img_field:
            self.clear_previews()
            return
        
        # 画像パス
        img_path = os.path.join(os.path.dirname(__file__), '../img', img_field)
        if not os.path.exists(img_path):
            self.clear_previews()
            return
        
        try:
            # 元画像を読み込み
            original_img = Image.open(img_path)
            
            # 各設定値を取得
            pc_size = self.fields['imgsize'].get()
            pc_pos = self.fields['imageZoomPosition'].get()
            mobile_size = self.fields['imgsize_mobile'].get()
            mobile_pos = self.fields['imageZoomPosition_mobile'].get()
            
            # PCプレビュー
            self.create_preview(original_img, self.pc_canvas, 200, 200, pc_size, pc_pos, "PC")
            
            # モバイルプレビュー
            self.create_preview(original_img, self.mobile_canvas, 120, 120, mobile_size, mobile_pos, "mobile")
            
            # 詳細プレビュー（PCサイズベース）
            self.create_preview(original_img, self.detail_canvas, 300, 300, pc_size, pc_pos, "detail")
            
        except Exception as e:
            print(f"プレビューエラー: {e}")
            self.clear_previews()
    
    def create_preview(self, original_img, canvas, canvas_w, canvas_h, size_val, pos_val, preview_type):
        """プレビュー画像を作成（ウェブサイトの実際の表示を正確に再現）"""
        canvas.delete('all')
        
        try:
            # デバッグ出力
            print(f"Creating preview for {preview_type}: size={size_val}, pos={pos_val}")
            
            # フレームサイズの決定
            if preview_type == "mobile":
                frame_w, frame_h = 120, 120
            else:
                frame_w, frame_h = 200, 200
            
            # 詳細表示の場合は拡大
            if preview_type == "detail":
                frame_w = int(frame_w * 1.5)
                frame_h = int(frame_h * 1.5)
            
            # サイズ解析
            size_percent = self.parse_size(size_val) if size_val else 100
            
            # 元画像サイズ
            orig_w, orig_h = original_img.size
            print(f"Original image: {orig_w}x{orig_h}")
            
            # object-fit: cover を正確にシミュレート
            # ウェブサイトでは画像はフレーム全体を覆うようにスケールされる
            frame_aspect = frame_w / frame_h  # 1.0 (正方形)
            img_aspect = orig_w / orig_h
            
            if img_aspect > frame_aspect:
                # 画像が横長：高さを基準にスケール
                scaled_h = frame_h
                scaled_w = int(frame_h * img_aspect)
            else:
                # 画像が縦長：幅を基準にスケール
                scaled_w = frame_w
                scaled_h = int(frame_w / img_aspect)
            
            # imgsizeを適用
            scaled_w = int(scaled_w * size_percent / 100)
            scaled_h = int(scaled_h * size_percent / 100)
            
            print(f"Scaled size (after imgsize): {scaled_w}x{scaled_h}")
            
            # 画像をリサイズ
            if scaled_w > 0 and scaled_h > 0:
                resized_img = original_img.resize((scaled_w, scaled_h), Image.LANCZOS)
            else:
                resized_img = original_img.resize((50, 50), Image.LANCZOS)
                scaled_w, scaled_h = 50, 50
            
            # 位置解析
            pos_x, pos_y = self.parse_position(pos_val)
            print(f"Position offset: {pos_x}, {pos_y}")
            
            # キャンバス中央（フレーム中央）
            center_x = canvas_w // 2
            center_y = canvas_h // 2
            
            # object-position の効果をシミュレート
            # ウェブサイトでは、imageZoomPositionは画像の表示位置を調整する
            # 負の値は画像を左上方向に移動（クロップ効果）
            
            # 画像の配置位置を計算
            # object-position: -190px -150px は、画像を左に190px、上に150px移動
            img_x = center_x - scaled_w // 2 + pos_x
            img_y = center_y - scaled_h // 2 + pos_y
            
            print(f"Image position: ({img_x}, {img_y})")
            
            # フレーム領域の定義
            frame_left = center_x - frame_w // 2
            frame_top = center_y - frame_h // 2
            frame_right = frame_left + frame_w
            frame_bottom = frame_top + frame_h
            
            # 表示される画像部分を計算（フレーム内のみ）
            # 画像のどの部分がフレーム内に見えるかを計算
            visible_left = max(0, frame_left - img_x)
            visible_top = max(0, frame_top - img_y)
            visible_right = min(scaled_w, visible_left + frame_w)
            visible_bottom = min(scaled_h, visible_top + frame_h)
            
            # 画像部分をクロップ
            if visible_right > visible_left and visible_bottom > visible_top:
                try:
                    crop_box = (
                        int(visible_left), 
                        int(visible_top), 
                        int(visible_right), 
                        int(visible_bottom)
                    )
                    print(f"Cropping: {crop_box}")
                    cropped_img = resized_img.crop(crop_box)
                    
                    # PhotoImageに変換
                    tk_img = ImageTk.PhotoImage(cropped_img)
                    self.preview_images[preview_type] = tk_img
                    
                    # クロップされた画像の表示位置
                    draw_x = max(frame_left, img_x) + (cropped_img.size[0] // 2)
                    draw_y = max(frame_top, img_y) + (cropped_img.size[1] // 2)
                    
                    # 画像を描画
                    canvas.create_image(draw_x, draw_y, image=tk_img)
                    print(f"Drew cropped image at: {draw_x}, {draw_y}")
                    
                except Exception as e:
                    print(f"Crop error: {e}")
                    # フォールバック：小さい画像を中央に表示
                    small_img = resized_img.resize((50, 50), Image.LANCZOS)
                    tk_img = ImageTk.PhotoImage(small_img)
                    self.preview_images[preview_type] = tk_img
                    canvas.create_image(center_x, center_y, image=tk_img)
            else:
                # フレーム外の場合は何も表示しない
                print("Image is completely outside frame")
            
            # フレーム枠を描画（赤い枠）
            canvas.create_rectangle(frame_left, frame_top, frame_right, frame_bottom,
                                  outline="#ff0000", width=2, fill="")
            
            # 中央線
            canvas.create_line(center_x, 0, center_x, canvas_h, fill="#ddd", width=1)
            canvas.create_line(0, center_y, canvas_w, center_y, fill="#ddd", width=1)
            
            # 詳細情報の表示
            info_text = f"Size: {size_percent}%"
            if pos_val:
                info_text += f"\nPos: {pos_val}"
            
            canvas.create_text(10, 10, text=info_text, fill='black', anchor='nw', font=('Arial', 8))
            
            # 外枠
            canvas.create_rectangle(1, 1, canvas_w-1, canvas_h-1, outline="#ccc", width=1)
            
            print(f"Preview {preview_type} completed successfully")
            
        except Exception as e:
            print(f"Error in create_preview: {e}")
            import traceback
            traceback.print_exc()
            
            # エラー時の表示
            canvas.create_text(canvas_w//2, canvas_h//2, text=f"エラー: {str(e)[:50]}", fill='red')
            canvas.create_rectangle(1, 1, canvas_w-1, canvas_h-1, outline="#ccc", width=1)
    
    def clear_previews(self):
        """プレビューをクリア"""
        for canvas in [self.pc_canvas, self.mobile_canvas, self.detail_canvas]:
            canvas.delete('all')
            canvas.create_text(canvas.winfo_reqwidth()//2, canvas.winfo_reqheight()//2, 
                             text='画像なし', fill='gray')
    
    def save_changes(self):
        """変更を保存"""
        if self.selected_char_idx is None or self.selected_style_idx is None:
            messagebox.showwarning('警告', 'キャラクターが選択されていません')
            return
        
        char = self.characters[self.selected_char_idx]
        style_idx = self.selected_style_idx
        
        # 各フィールドの値を更新
        for field_name, widget in self.fields.items():
            if isinstance(widget, tk.Text):
                new_value = widget.get('1.0', tk.END).strip()
                if '\n' in new_value:
                    new_value = [line.strip() for line in new_value.split('\n') if line.strip()]
            else:
                new_value = widget.get().strip()
            
            # 既存の値を取得
            current_value = char.get(field_name, '')
            
            # スタイル対応値として設定
            updated_value = self.set_style_value(current_value, style_idx, new_value)
            char[field_name] = updated_value
        
        # JSONファイルに保存
        try:
            self.data[1:] = self.characters
            with open(JSON_PATH, 'w', encoding='utf-8') as f:
                json.dump(self.data, f, ensure_ascii=False, indent=4)
            messagebox.showinfo('保存', '変更を保存しました')
        except Exception as e:
            messagebox.showerror('エラー', f'保存に失敗しました\n{e}')
    
    def set_style_value(self, current_value, style_idx, new_value):
        """スタイル対応値として設定"""
        if isinstance(current_value, list):
            # 既に配列の場合
            while len(current_value) <= style_idx:
                current_value.append('')
            current_value[style_idx] = new_value
            return current_value
        else:
            # 単一値の場合
            if style_idx == 0:
                return new_value
            else:
                # 配列に変換
                result = [current_value]
                while len(result) <= style_idx:
                    result.append('')
                result[style_idx] = new_value
                return result
    
    def adjust_size(self, field_name, delta):
        """サイズを調整"""
        if self.selected_char_idx is None or self.selected_style_idx is None:
            return
        
        current_value = self.fields[field_name].get().strip()
        
        # パーセント値を抽出
        if current_value.endswith('%'):
            try:
                current_percent = int(current_value[:-1])
                new_percent = max(10, current_percent + delta)  # 最小10%
                new_value = f'{new_percent}%'
                self.set_field_value(field_name, new_value)
            except ValueError:
                pass
    
    def reset_fields(self):
        """フィールドをリセット"""
        if self.selected_char_idx is not None and self.selected_style_idx is not None:
            self.load_char_data()
            self.update_preview()

if __name__ == '__main__':
    app = ImageEditor()
    app.mainloop()
