# -*- coding: utf-8 -*-
import tkinter as tk
from tkinter import ttk, messagebox
import json
import os
from json_formatter import save_json_with_custom_format

JSON_PATH = os.path.join(os.path.dirname(__file__), '../cha.json')

class ChaEditor(tk.Tk):
    def _init_undo_redo(self):
        self._undo_stack = []
        self._redo_stack = []
        self._editing = False
    def _init_edit_buffers(self):
        self._edit_buffers = {}  # {char_id: 編集中データ}
        self._dirty_chars = set()  # idセット

    def _get_char_id(self, char_idx):
        try:
            return self.characters[char_idx]['id']
        except Exception:
            return None

    def _get_buffer(self, char_idx):
        cid = self._get_char_id(char_idx)
        if cid in self._edit_buffers:
            return self._edit_buffers[cid]
        # バッファがなければ現在のキャラのdeepcopy
        import copy
        buf = copy.deepcopy(self.characters[char_idx])
        self._edit_buffers[cid] = buf
        return buf

    def _set_dirty(self, char_idx):
        cid = self._get_char_id(char_idx)
        if cid is not None:
            self._dirty_chars.add(cid)
            self._update_edit_indicator()

    def _clear_dirty(self, char_idx):
        cid = self._get_char_id(char_idx)
        if cid in self._dirty_chars:
            self._dirty_chars.remove(cid)
            self._update_edit_indicator()

    def _is_dirty(self, char_idx):
        cid = self._get_char_id(char_idx)
        return cid in self._dirty_chars

    def _save_buffer_to_char(self, char_idx):
        cid = self._get_char_id(char_idx)
        if cid in self._edit_buffers:
            self.characters[char_idx] = self._edit_buffers[cid]
            self._clear_dirty(char_idx)

    def _save_all_buffers(self):
        for i in range(len(self.characters)):
            self._save_buffer_to_char(i)
        self._edit_buffers.clear()
        self._dirty_chars.clear()
        self._update_edit_indicator()

    def _update_buffer_from_fields(self, char_idx, style_idx):
        """現在のフィールド内容を編集バッファに反映（条件式準拠）"""
        char = self._get_buffer(char_idx)
        
        for key, entry in self.fields.items():
            if isinstance(entry, tk.Text):
                text = entry.get('1.0', tk.END).strip()
            else:
                text = entry.get()
            
            # 条件式に基づくフィールド処理
            if key in self.never_array_fields:
                # 未配列フィールド：常に単一値
                if key == 'id':
                    try:
                        char[key] = int(text) if text else 0
                    except:
                        char[key] = 0
                elif key == 'height':
                    try:
                        char[key] = int(text) if text else None
                    except:
                        char[key] = None
                else:
                    char[key] = text
                    
            elif key in self.style_array_fields:
                # スタイル配列対応フィールド
                val = [x.strip() for x in text.split('\n') if x.strip()]
                current_value = char.get(key, '')
                
                if key in self.nested_array_fields:
                    # 配列内配列フィールド（race, fightingStyle, attribute）
                    if not isinstance(current_value, list):
                        current_value = [[current_value]] if current_value else [['']]
                    
                    # 必要な要素数まで拡張
                    while len(current_value) <= style_idx:
                        current_value.append([''])
                    
                    # 値の設定
                    if len(val) > 1:
                        current_value[style_idx] = val
                    else:
                        current_value[style_idx] = val if val else ['']
                        
                    char[key] = current_value
                else:
                    # その他のスタイル配列対応フィールド
                    if not isinstance(current_value, list):
                        current_value = [current_value] if current_value else ['']
                    
                    # 必要な要素数まで拡張
                    while len(current_value) <= style_idx:
                        current_value.append('')
                    
                    # 値の設定
                    if len(val) > 1:
                        current_value[style_idx] = val
                    else:
                        current_value[style_idx] = val[0] if val else ''
                        
                    char[key] = current_value
                    
            elif key in self.array_fields:
                # 常に配列のフィールド（group等）
                val = [x.strip() for x in text.split('\n') if x.strip()]
                char[key] = val if val else ['']
                
            elif key in self.multi_line_fields:
                # 複数行フィールド
                val = [x.strip() for x in text.split('\n') if x.strip()]
                char[key] = val if len(val) > 1 else (val[0] if val else '')
                
            else:
                # その他のフィールド
                char[key] = text
        
        # birthdayフィールドの処理（条件式準拠）
        b = {}
        for part in ['year', 'month', 'day']:
            v = self.birthday_fields[part].get().strip()
            if v == '':
                b[part] = None
            else:
                try:
                    if part == 'year':
                        # yearは文字列型
                        b[part] = v
                    else:
                        # month, dayは数値型
                        b[part] = int(v)
                except Exception:
                    if part == 'year':
                        b[part] = v
                    else:
                        b[part] = None
        char['birthday'] = b
        
        # 編集バッファを更新
        cid = self._get_char_id(char_idx)
        if cid is not None:
            self._edit_buffers[cid] = char
            self._set_dirty(char_idx)

    def _push_undo(self):
        import copy
        self._undo_stack.append(copy.deepcopy(self.data))
        if len(self._undo_stack) > 50:
            self._undo_stack.pop(0)
        self._redo_stack.clear()

    def _undo(self, event=None):
        if self._undo_stack:
            import copy
            self._redo_stack.append(copy.deepcopy(self.data))
            self.data = self._undo_stack.pop()
            self.characters = self.data[1:]
            self.build_listbox_items(preserve_selection=False)  # undo時は選択状態をリセット
            self._editing = True
            self._update_edit_indicator()

    def _redo(self, event=None):
        if self._redo_stack:
            import copy
            self._undo_stack.append(copy.deepcopy(self.data))
            self.data = self._redo_stack.pop()
            self.characters = self.data[1:]
            self.build_listbox_items(preserve_selection=False)  # redo時は選択状態をリセット
            self._editing = True
            self._update_edit_indicator()

    def _create_menu(self):
        menubar = tk.Menu(self)
        filemenu = tk.Menu(menubar, tearoff=0)
        filemenu.add_command(label='キャラ保存 (Ctrl+S)', command=self.save_current_buffer)
        filemenu.add_command(label='全体保存 (Ctrl+Shift+S)', command=self.save_all_buffers_and_json)
        filemenu.add_separator()
        filemenu.add_command(label='JSONを1行形式で再フォーマット', command=self.reformat_json_compact)
        filemenu.add_separator()
        filemenu.add_command(label='Pillowライブラリインストール', command=self.install_pillow)
        filemenu.add_command(label='デスクトップショートカット作成', command=self.create_desktop_shortcut)
        filemenu.add_separator()
        filemenu.add_command(label='終了', command=self.quit)
        menubar.add_cascade(label='ファイル', menu=filemenu)
        self.config(menu=menubar)

    def install_pillow(self):
        """Pillowライブラリのインストールを支援"""
        try:
            import subprocess
            import sys
            
            result = messagebox.askyesno(
                'Pillowインストール', 
                'Pillow (PIL) ライブラリをインストールしますか？\n'
                '画像プレビュー機能に必要です。\n\n'
                '実行コマンド: pip install Pillow'
            )
            
            if result:
                try:
                    # pipでPillowをインストール
                    process = subprocess.Popen(
                        [sys.executable, '-m', 'pip', 'install', 'Pillow'],
                        stdout=subprocess.PIPE,
                        stderr=subprocess.PIPE,
                        text=True
                    )
                    stdout, stderr = process.communicate()
                    
                    if process.returncode == 0:
                        messagebox.showinfo(
                            'インストール完了', 
                            'Pillowのインストールが完了しました。\n'
                            'アプリケーションを再起動してください。'
                        )
                    else:
                        messagebox.showerror(
                            'インストールエラー', 
                            f'Pillowのインストールに失敗しました:\n{stderr}'
                        )
                except Exception as e:
                    messagebox.showerror(
                        'インストールエラー', 
                        f'インストール中にエラーが発生しました:\n{e}\n\n'
                        '手動でインストールしてください:\n'
                        'pip install Pillow'
                    )
        except Exception as e:
            messagebox.showerror(
                'エラー', 
                f'インストール機能でエラーが発生しました:\n{e}\n\n'
                '手動でインストールしてください:\n'
                'pip install Pillow'
            )

    def reformat_json_compact(self):
        """現在のJSONファイルを1行形式で再フォーマット"""
        try:
            # 現在の編集内容をすべて保存
            if self.selected_index is not None:
                char_idx, style_idx = self.listbox_items[self.selected_index]
                self._update_buffer_from_fields(char_idx, style_idx)
            self._save_all_buffers()
            self.data[1:] = self.characters
            
            # バックアップを作成
            backup_path = JSON_PATH + '.backup'
            with open(backup_path, 'w', encoding='utf-8') as f:
                json.dump(self.data, f, ensure_ascii=False, indent=4)
            
            # カスタム形式で再フォーマット
            compact_fields = {
                'en', 'ja',  # settings内の配列
                'name', 'name_en', 'race', 'fightingStyle', 'attribute', 
                'imgThumbsize', 'imageThumbPosition'  # キャラ内の配列
            }
            save_json_with_custom_format(self.data, JSON_PATH, compact_fields)
            
            messagebox.showinfo('フォーマット完了', 
                              f'JSONファイルを1行形式で再フォーマットしました。\n'
                              f'バックアップ: {backup_path}')
            self._editing = False
            self._update_edit_indicator()
            
        except Exception as e:
            messagebox.showerror('エラー', f'再フォーマットに失敗しました\n{e}')

    def create_desktop_shortcut(self):
        """デスクトップにアプリのショートカットを作成"""
        try:
            import winshell
            import win32com.client
            from pathlib import Path
            
            # デスクトップパスを取得
            desktop_path = winshell.desktop()
            shortcut_path = os.path.join(desktop_path, "キャラエディタ.lnk")
            
            # 現在のスクリプトパス
            script_path = os.path.abspath(__file__)
            working_dir = os.path.dirname(script_path)
            
            # バッチファイルパス
            bat_path = os.path.join(working_dir, "cha_editor_launcher.bat")
            
            # バッチファイルが存在しない場合は作成
            if not os.path.exists(bat_path):
                bat_content = f'''@echo off
cd /d "{working_dir}"
"C:/Python312/python.exe" cha_json_editor.py
pause'''
                with open(bat_path, 'w', encoding='utf-8') as f:
                    f.write(bat_content)
            
            # ショートカット作成
            shell = win32com.client.Dispatch("WScript.Shell")
            shortcut = shell.CreateShortCut(shortcut_path)
            shortcut.Targetpath = bat_path
            shortcut.WorkingDirectory = working_dir
            shortcut.Description = "キャラクターJSONエディタ"
            shortcut.save()
            
            messagebox.showinfo('成功', f'デスクトップにショートカットを作成しました:\n{shortcut_path}')
            
        except ImportError:
            # winshellやwin32comがない場合の代替方法
            try:
                import subprocess
                desktop_path = os.path.join(os.path.expanduser("~"), "Desktop")
                shortcut_path = os.path.join(desktop_path, "キャラエディタ.lnk")
                script_path = os.path.abspath(__file__)
                working_dir = os.path.dirname(script_path)
                
                # PowerShellスクリプトで作成
                ps_script = f'''
$desktopPath = "{desktop_path}"
$shortcutPath = Join-Path $desktopPath "キャラエディタ.lnk"
$targetPath = "C:/Python312/python.exe"
$arguments = '"{script_path}"'
$workingDirectory = "{working_dir}"

$WshShell = New-Object -comObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut($shortcutPath)
$Shortcut.TargetPath = $targetPath
$Shortcut.Arguments = $arguments
$Shortcut.WorkingDirectory = $workingDirectory
$Shortcut.Description = "キャラクターJSONエディタ"
$Shortcut.Save()
'''
                
                # PowerShellを実行
                result = subprocess.run(['powershell', '-Command', ps_script], 
                                      capture_output=True, text=True)
                
                if result.returncode == 0:
                    messagebox.showinfo('成功', f'デスクトップにショートカットを作成しました:\n{shortcut_path}')
                else:
                    messagebox.showerror('エラー', f'ショートカット作成に失敗しました:\n{result.stderr}')
                    
            except Exception as e:
                messagebox.showerror('エラー', f'ショートカット作成に失敗しました:\n{e}')
        except Exception as e:
            messagebox.showerror('エラー', f'ショートカット作成に失敗しました:\n{e}')

    def _save_current_shortcut(self, event=None):
        self.save_current_buffer()
        return 'break'

    def _save_all_shortcut(self, event=None):
        self.save_all_buffers_and_json()
        return 'break'

    def _update_edit_indicator(self):
        # 編集中はタイトルバー色を変える
        if self._editing or self._dirty_chars:
            self.configure(bg='#ffe4e1')
            self.title('cha.jsonエディタ*')
        else:
            self.configure(bg='SystemButtonFace')
            self.title('cha.jsonエディタ')
        # listbox生成済みならリストボックスの表示も更新（選択状態を保持）
        if hasattr(self, 'listbox'):
            self.build_listbox_items(preserve_selection=True)

    def _set_edited(self, event=None):
        # キャラクター移動中の場合は編集状態を変更しない
        if hasattr(self, '_changing_character') and self._changing_character:
            return
            
        if not self._editing:
            self._editing = True
            self._update_edit_indicator()
        
        # 現在選択されているキャラを編集状態にマーク
        if hasattr(self, 'selected_index') and self.selected_index is not None:
            char_idx, style_idx = self.listbox_items[self.selected_index]
            self._set_dirty(char_idx)
            
            # リアルタイムで編集内容をバッファに反映
            try:
                self._update_buffer_from_fields(char_idx, style_idx)
            except Exception:
                # エラーが発生した場合は無視（入力途中など）
                pass

    def _on_user_input(self, event=None):
        """ユーザーの手動入力のみを検知"""
        # キャラクター変更中は無視
        if hasattr(self, '_changing_character') and self._changing_character:
            return
        
        # 明示的なユーザー操作のみ処理
        if event and hasattr(event, 'widget'):
            widget = event.widget
            # フォーカスがあり、実際にキー入力があった場合のみ
            if widget.focus_get() == widget:
                self._set_edited(event)

    def _on_user_select(self, event=None):
        """ユーザーの手動選択のみを検知（Combobox用）"""
        if hasattr(self, '_changing_character') and self._changing_character:
            return
        
        # Comboboxの値変更時のみ
        if event and hasattr(event, 'widget'):
            self._set_edited(event)

    def create_image_preview_area(self):
        """画像プレビューエリアを作成"""
        # 画像プレビューフレーム
        self.image_frame = tk.LabelFrame(self.detail_frame, text="画像プレビュー", padx=5, pady=5)
        self.image_frame.grid(row=0, column=0, columnspan=2, pady=(0, 10), sticky="ew")
        
        # プレビューコントロール
        control_frame = tk.Frame(self.image_frame)
        control_frame.pack(fill=tk.X, pady=(0, 10))
        
        tk.Label(control_frame, text="プレビューモード:").pack(side=tk.LEFT)
        self.preview_mode = tk.StringVar(value="PC")
        tk.Radiobutton(control_frame, text="PC (200px)", variable=self.preview_mode, 
                      value="PC", command=self.update_image_preview).pack(side=tk.LEFT, padx=5)
        tk.Radiobutton(control_frame, text="モバイル (120px)", variable=self.preview_mode, 
                      value="mobile", command=self.update_image_preview).pack(side=tk.LEFT, padx=5)
        
        # 🆕 最小化/最大化ボタンを追加
        self.preview_minimized = False
        self.toggle_preview_btn = tk.Button(control_frame, text="▼ 最小化", 
                                          command=self.toggle_preview_size)
        self.toggle_preview_btn.pack(side=tk.RIGHT, padx=5)
        
        tk.Button(control_frame, text="プレビュー更新", 
                 command=self.update_image_preview).pack(side=tk.RIGHT, padx=5)
        
        # プレビューキャンバス（PCサイズとモバイルサイズ）
        self.canvas_frame = tk.Frame(self.image_frame)
        self.canvas_frame.pack(fill=tk.BOTH, expand=True)
        
        # PCプレビュー
        pc_frame = tk.LabelFrame(self.canvas_frame, text="PC表示 (200px)", padx=5, pady=5)
        pc_frame.pack(side=tk.LEFT, padx=5)
        self.pc_preview_canvas = tk.Canvas(pc_frame, width=200, height=200, bg='white', bd=1, relief=tk.SUNKEN)
        self.pc_preview_canvas.pack()
        
        # モバイルプレビュー
        mobile_frame = tk.LabelFrame(self.canvas_frame, text="モバイル表示 (120px)", padx=5, pady=5)
        mobile_frame.pack(side=tk.LEFT, padx=5)
        self.mobile_preview_canvas = tk.Canvas(mobile_frame, width=120, height=120, bg='white', bd=1, relief=tk.SUNKEN)
        self.mobile_preview_canvas.pack()
        
        # 詳細表示用キャンバス
        detail_frame = tk.LabelFrame(self.canvas_frame, text="詳細表示", padx=5, pady=5)
        detail_frame.pack(side=tk.LEFT, padx=5, fill=tk.BOTH, expand=True)
        self.detail_preview_canvas = tk.Canvas(detail_frame, width=300, height=300, bg='#f0f0f0', bd=1, relief=tk.SUNKEN)
        self.detail_preview_canvas.pack()
        
        self.tk_images = {}  # 画像参照保持用

    def toggle_preview_size(self):
        """プレビューエリアの最小化/最大化を切り替え"""
        if self.preview_minimized:
            # 最大化
            self.canvas_frame.pack(fill=tk.BOTH, expand=True)
            self.toggle_preview_btn.config(text="▼ 最小化")
            self.preview_minimized = False
        else:
            # 最小化
            self.canvas_frame.pack_forget()
            self.toggle_preview_btn.config(text="▲ 最大化")
            self.preview_minimized = True
    def _get_next_id(self):
        ids = [c.get('id', 0) for c in self.characters if isinstance(c.get('id', 0), int)]
        return max(ids, default=0) + 1
    def __init__(self):
        super().__init__()
        self.title('cha.jsonエディタ')
        self.geometry('850x600')
        self.resizable(True, True)
        self.data = []
        self.selected_index = None
        self._changing_character = False  # 🔧 キャラクター切り替え中フラグを追加
        self._init_undo_redo()
        self._init_edit_buffers()
        self._create_menu()
        self.create_widgets()
        self.load_json()
        self._update_edit_indicator()  # characters初期化後に呼び出し
        # undo/redoショートカット
        self.bind('<Control-z>', self._undo)
        self.bind('<Control-y>', self._redo)
        # 保存ショートカット
        self.bind('<Control-s>', self._save_current_shortcut)
        self.bind('<Control-S>', self._save_all_shortcut)
        self.bind('<Control-Shift-S>', self._save_all_shortcut)
        
        # ウィンドウ閉じる時の処理
        self.protocol("WM_DELETE_WINDOW", self._on_closing)

    def _on_closing(self):
        """アプリケーション終了時の処理"""
        # 現在の編集内容を一時保存
        if hasattr(self, 'selected_index') and self.selected_index is not None:
            try:
                char_idx, style_idx = self.listbox_items[self.selected_index]
                self._update_buffer_from_fields(char_idx, style_idx)
            except Exception:
                pass
        
        # 編集中データがある場合は確認
        if self._editing or self._dirty_chars:
            result = messagebox.askyesnocancel(
                '終了確認', 
                '未保存の編集内容があります。保存してから終了しますか？\n'
                'はい: 保存して終了\n'
                'いいえ: 保存せずに終了\n'
                'キャンセル: 終了をキャンセル'
            )
            if result is True:  # はい
                self.save_all_buffers_and_json()
                self.destroy()
            elif result is False:  # いいえ
                self.destroy()
            # result is None (キャンセル) の場合は何もしない
        else:
            self.destroy()

    def create_widgets(self):
        # PanedWindowで左右を分割
        paned = tk.PanedWindow(self, orient=tk.HORIZONTAL, sashrelief=tk.RAISED, sashwidth=8, showhandle=True)
        paned.pack(fill=tk.BOTH, expand=True)

        # 左側: キャラクター＋スタイルリスト
        left_frame = tk.Frame(paned)
        paned.add(left_frame, minsize=180)
        self.listbox = tk.Listbox(left_frame, width=40)
        self.listbox.pack(fill=tk.BOTH, expand=True)
        self.listbox.bind('<<ListboxSelect>>', self.on_select)
        self.listbox.bind('<Button-1>', self.on_listbox_click)

        # フッターメニューをウィンドウ全体の下部に配置
        footer_frame = tk.Frame(self)
        footer_frame.pack(side=tk.BOTTOM, fill=tk.X, pady=5)
        self.add_char_btn = tk.Button(footer_frame, text='キャラ追加', command=self.add_character)
        self.add_char_btn.pack(side=tk.LEFT, fill=tk.X, expand=True, padx=2)
        self.del_char_btn = tk.Button(footer_frame, text='キャラ削除', command=self.delete_character)
        self.del_char_btn.pack(side=tk.LEFT, fill=tk.X, expand=True, padx=2)
        self.add_style_btn = tk.Button(footer_frame, text='スタイル追加', command=self.add_style)
        self.add_style_btn.pack(side=tk.LEFT, fill=tk.X, expand=True, padx=2)
        self.del_style_btn = tk.Button(footer_frame, text='スタイル削除', command=self.delete_style)
        self.del_style_btn.pack(side=tk.LEFT, fill=tk.X, expand=True, padx=2)

        # 右側: 詳細表示（スクロール可能）
        right_frame = tk.Frame(paned)
        paned.add(right_frame, minsize=300)

        # スクロールバー付きCanvas
        self.detail_canvas = tk.Canvas(right_frame, borderwidth=0, background="#f8f8f8")
        vscroll = tk.Scrollbar(right_frame, orient="vertical", command=self.detail_canvas.yview)
        self.detail_canvas.configure(yscrollcommand=vscroll.set)
        vscroll.pack(side="right", fill="y")
        self.detail_canvas.pack(side="left", fill="both", expand=True)

        # 実際の編集Frame
        self.detail_frame = tk.Frame(self.detail_canvas, background="#f8f8f8")
        self.detail_canvas.create_window((0, 0), window=self.detail_frame, anchor="nw")

        # スクロール領域の自動調整
        def _on_frame_configure(event):
            self.detail_canvas.configure(scrollregion=self.detail_canvas.bbox("all"))
        self.detail_frame.bind("<Configure>", _on_frame_configure)
        # マウスホイール対応（詳細編集エリア内でのみ有効）
        def _on_mousewheel(event):
            self.detail_canvas.yview_scroll(int(-1*(event.delta/120)), "units")
        self.detail_canvas.bind("<MouseWheel>", _on_mousewheel)
        self.detail_frame.bind("<MouseWheel>", _on_mousewheel)

        # 画像プレビューエリア
        self.create_image_preview_area()

        self.fields = {}
        self.labels = ['id', 'name', 'name_en', 'name_Kana', 'description', 'world', 'race', 'fightingStyle', 'attribute', 'height', 'age', 'personality', 'group', 'img', 'imgsize', 'imgThumbsize', 'imageZoomPosition', 'imageThumbPosition', 'imgsize_mobile', 'imageZoomPosition_mobile']
        
        # 条件式に基づくフィールド分類
        self.never_array_fields = ['id', 'name_Kana', 'world', 'height', 'age', 'personality', 'imgsize', 'imageZoomPosition', 'imgsize_mobile', 'imageZoomPosition_mobile']  # 未配列
        self.style_array_fields = ['name', 'name_en', 'description', 'race', 'fightingStyle', 'attribute', 'img', 'imgThumbsize', 'imageThumbPosition']  # 複数スタイル対応
        self.array_fields = ['race', 'fightingStyle', 'attribute', 'group', 'img', 'imgThumbsize', 'imageThumbPosition']  # 常に配列
        self.nested_array_fields = ['race', 'fightingStyle', 'attribute']  # 配列内配列
        self.multi_line_fields = ['description', 'fightingStyle', 'attribute', 'race', 'group', 'imgThumbsize', 'imageThumbPosition']
        # settingsから選択肢取得
        self.choices = {}
        try:
            with open(JSON_PATH, 'r', encoding='utf-8') as f:
                data = json.load(f)
            settings = data[0].get('settings', {})
            for key in ['race', 'fightingStyle', 'attribute', 'group']:
                self.choices[key] = settings.get(key, {}).get('ja', [])
        except Exception:
            for key in ['race', 'fightingStyle', 'attribute', 'group']:
                self.choices[key] = []

        row = 1  # 画像の下から開始
        self.select_widgets = {}
        for label in self.labels:
            tk.Label(self.detail_frame, text=label).grid(row=row, column=0, sticky=tk.W)
            if label in self.multi_line_fields:
                entry = tk.Text(self.detail_frame, width=60, height=3)
            else:
                entry = tk.Entry(self.detail_frame, width=60)
            entry.grid(row=row, column=1, sticky=tk.W)
            self.fields[label] = entry
            # ユーザー入力のみを検知する新しい方式
            if isinstance(entry, tk.Text):
                # キー入力と貼り付けのみ検知
                entry.bind('<KeyPress>', self._on_user_input)
                entry.bind('<Button-2>', self._on_user_input)  # 中クリック貼り付け
                entry.bind('<Control-v>', self._on_user_input)  # Ctrl+V貼り付け
                # 画像関連フィールドは即座にプレビュー更新
                if label in ['imgsize', 'imgThumbsize', 'imageZoomPosition', 'imageThumbPosition', 'imgsize_mobile', 'imageZoomPosition_mobile', 'img']:
                    entry.bind('<KeyPress>', lambda e, l=label: [self._on_user_input(e), self.schedule_preview_update()])
                    entry.bind('<Button-2>', lambda e, l=label: [self._on_user_input(e), self.schedule_preview_update()])
                    entry.bind('<Control-v>', lambda e, l=label: [self._on_user_input(e), self.schedule_preview_update()])
            else:
                # キー入力と貼り付けのみ検知
                entry.bind('<KeyPress>', self._on_user_input)
                entry.bind('<Button-2>', self._on_user_input)  # 中クリック貼り付け
                entry.bind('<Control-v>', self._on_user_input)  # Ctrl+V貼り付け
                # 画像関連フィールドは即座にプレビュー更新
                if label in ['imgsize', 'imgThumbsize', 'imageZoomPosition', 'imageThumbPosition', 'imgsize_mobile', 'imageZoomPosition_mobile', 'img']:
                    entry.bind('<KeyPress>', lambda e, l=label: [self._on_user_input(e), self.schedule_preview_update()])
                    entry.bind('<Button-2>', lambda e, l=label: [self._on_user_input(e), self.schedule_preview_update()])
                    entry.bind('<Control-v>', lambda e, l=label: [self._on_user_input(e), self.schedule_preview_update()])
                    
            # 画像関連フィールドに専用コントロールを追加
            if label in ['imgsize', 'imgsize_mobile']:
                control_frame = tk.Frame(self.detail_frame)
                control_frame.grid(row=row+1, column=1, sticky=tk.W)
                
                # よく使うサイズのボタン
                sizes = ['100%', '150%', '200%', '250%', '300%']
                for size in sizes:
                    btn = tk.Button(control_frame, text=size, width=6,
                                  command=lambda s=size, e=entry: self.set_field_value(e, s))
                    btn.pack(side=tk.LEFT, padx=2)
                row += 1
                    
            elif label in ['imageZoomPosition', 'imageZoomPosition_mobile']:
                control_frame = tk.Frame(self.detail_frame)
                control_frame.grid(row=row+1, column=1, sticky=tk.W)
                
                # 位置調整ボタン
                pos_frame = tk.Frame(control_frame)
                pos_frame.pack(side=tk.LEFT)
                
                # 上下左右ボタン配置
                tk.Button(pos_frame, text='↑', width=3,
                         command=lambda e=entry: self.adjust_position(e, 0, -10)).grid(row=0, column=1)
                tk.Button(pos_frame, text='←', width=3,
                         command=lambda e=entry: self.adjust_position(e, -10, 0)).grid(row=1, column=0)
                tk.Button(pos_frame, text='○', width=3,
                         command=lambda e=entry: self.set_field_value(e, '0px 0px')).grid(row=1, column=1)
                tk.Button(pos_frame, text='→', width=3,
                         command=lambda e=entry: self.adjust_position(e, 10, 0)).grid(row=1, column=2)
                tk.Button(pos_frame, text='↓', width=3,
                         command=lambda e=entry: self.adjust_position(e, 0, 10)).grid(row=2, column=1)
                
                # 微調整ボタン
                fine_frame = tk.Frame(control_frame)
                fine_frame.pack(side=tk.LEFT, padx=20)
                tk.Label(fine_frame, text="微調整:").pack()
                
                adj_frame = tk.Frame(fine_frame)
                adj_frame.pack()
                tk.Button(adj_frame, text='+1', width=3,
                         command=lambda e=entry: self.adjust_position(e, 1, 0)).grid(row=0, column=0)
                tk.Button(adj_frame, text='-1', width=3,
                         command=lambda e=entry: self.adjust_position(e, -1, 0)).grid(row=0, column=1)
                tk.Button(adj_frame, text='+1', width=3,
                         command=lambda e=entry: self.adjust_position(e, 0, 1)).grid(row=1, column=0)
                tk.Button(adj_frame, text='-1', width=3,
                         command=lambda e=entry: self.adjust_position(e, 0, -1)).grid(row=1, column=1)
                
                row += 1
            # 選択肢ドロップダウン＋追加ボタン
            if label in ['race', 'fightingStyle', 'attribute', 'group']:
                sframe = tk.Frame(self.detail_frame)
                sframe.grid(row=row+1, column=1, sticky=tk.W)
                from tkinter import ttk
                combo = ttk.Combobox(sframe, values=self.choices[label], state='readonly', width=20)
                combo.pack(side=tk.LEFT)
                add_btn = tk.Button(sframe, text='追加', command=lambda l=label: self.add_choice_to_field(l))
                add_btn.pack(side=tk.LEFT, padx=2)
                self.select_widgets[label] = (combo, add_btn)
                # --- ドロップダウン展開時はスクロール無効 ---
                def on_dropdown(event, canvas=self.detail_canvas):
                    canvas.unbind('<MouseWheel>')
                def on_close(event, canvas=self.detail_canvas, mwheel=None):
                    def _on_mousewheel(event):
                        canvas.yview_scroll(int(-1*(event.delta/120)), "units")
                    canvas.bind('<MouseWheel>', _on_mousewheel)
                combo.bind('<<ComboboxSelected>>', on_close)
                combo.bind('<Button-1>', on_dropdown)
                combo.bind('<FocusOut>', on_close)
                combo.bind('<<ComboboxSelected>>', self._on_user_select)
                row += 1
            row += 1
        # birthday専用フィールド
        tk.Label(self.detail_frame, text='birthday').grid(row=row, column=0, sticky=tk.W)
        b_frame = tk.Frame(self.detail_frame)
        b_frame.grid(row=row, column=1, sticky=tk.W)
        self.birthday_fields = {}
        for i, part in enumerate(['year', 'month', 'day']):
            tk.Label(b_frame, text=part).grid(row=0, column=i*2, sticky=tk.W)
            entry = tk.Entry(b_frame, width=8)
            entry.grid(row=0, column=i*2+1, sticky=tk.W)
            # ユーザー入力のみを検知
            entry.bind('<KeyPress>', self._on_user_input)
            entry.bind('<Button-2>', self._on_user_input)  # 中クリック貼り付け
            entry.bind('<Control-v>', self._on_user_input)  # Ctrl+V貼り付け
            self.birthday_fields[part] = entry
        row += 1
        self.save_btn = tk.Button(self.detail_frame, text='保存', command=self.save_changes)
    def save_current_buffer(self):
        """現在選択中のキャラの編集バッファを保存し、jsonにも反映"""
        if self.selected_index is None:
            messagebox.showwarning('警告', 'キャラクターが選択されていません')
            return
        char_idx, style_idx = self.listbox_items[self.selected_index]
        
        # 現在の編集内容をバッファに反映
        self._update_buffer_from_fields(char_idx, style_idx)
        
        # 編集バッファを実際のデータに反映
        self._save_buffer_to_char(char_idx)
        
        # dataの更新
        self.data[1:] = self.characters
        
        try:
            # カスタム形式で保存（指定フィールドを1行形式に）
            compact_fields = {
                'en', 'ja',  # settings内の配列
                'name', 'name_en', 'race', 'fightingStyle', 'attribute', 
                'imgThumbsize', 'imageThumbPosition'  # キャラ内の配列
            }
            save_json_with_custom_format(self.data, JSON_PATH, compact_fields)
            messagebox.showinfo('保存', f'キャラ{char_idx+1}の編集内容を保存しました')
            self._editing = False
            self._update_edit_indicator()
        except Exception as e:
            messagebox.showerror('エラー', f'JSONファイルの保存に失敗しました\n{e}')

    def save_all_buffers_and_json(self):
        """すべての編集バッファを保存してJSONファイルに書き込み"""
        # 現在の編集内容をバッファに反映（選択中のキャラがある場合）
        if self.selected_index is not None:
            char_idx, style_idx = self.listbox_items[self.selected_index]
            self._update_buffer_from_fields(char_idx, style_idx)
        
        # すべての編集バッファを実際のデータに反映
        self._save_all_buffers()
        
        # 条件式に基づくデータ正規化
        self._normalize_characters_data()
        
        # dataの更新
        self.data[1:] = self.characters
        
        # JSON保存
        try:
            # カスタム形式で保存（指定フィールドを1行形式に）
            compact_fields = {
                'en', 'ja',  # settings内の配列
                'name', 'name_en', 'race', 'fightingStyle', 'attribute', 
                'imgThumbsize', 'imageThumbPosition'  # キャラ内の配列
            }
            save_json_with_custom_format(self.data, JSON_PATH, compact_fields)
            messagebox.showinfo('保存', 'すべての編集内容をJSONファイルに保存しました')
            self._editing = False
            self._update_edit_indicator()
        except Exception as e:
            messagebox.showerror('エラー', f'JSONファイルの保存に失敗しました\n{e}')
    def add_choice_to_field(self, label):
        # ドロップダウンから選択してテキスト欄に追加
        combo, _ = self.select_widgets[label]
        val = combo.get()
        if not val:
            return
        entry = self.fields[label]
        if isinstance(entry, tk.Text):
            current = entry.get('1.0', tk.END).strip()
            lines = current.split('\n') if current else []
            if val not in lines:
                lines.append(val)
            entry.delete('1.0', tk.END)
            entry.insert('1.0', '\n'.join([x for x in lines if x]))
        else:
            current = entry.get().strip()
            if val and val not in current.split(','):
                if current:
                    entry.insert(tk.END, ','+val)
                else:
                    entry.insert(0, val)

    def build_listbox_items(self, preserve_selection=True):
        # キャラ＋スタイルのリストを作る
        if not hasattr(self, 'listbox'):
            return
        
        # 現在の選択状態を保存
        selected_char_idx = None
        selected_style_idx = None
        if preserve_selection and hasattr(self, 'selected_index') and self.selected_index is not None:
            try:
                selected_char_idx, selected_style_idx = self.listbox_items[self.selected_index]
            except (IndexError, AttributeError):
                pass
        
        self.listbox_items = []  # (char_idx, style_idx or None)
        self.listbox.delete(0, tk.END)
        new_selection_index = None
        
        for i, char in enumerate(self.characters):
            name = char.get('name', '')
            # スタイル数を決定
            style_count = 1
            if isinstance(name, list):
                if name and isinstance(name[0], list):
                    style_count = len(name)
                else:
                    style_count = len(name)
            # キャラが編集されているかチェック
            char_id = char.get('id')
            is_dirty = hasattr(self, '_dirty_chars') and char_id in self._dirty_chars
            dirty_mark = '*' if is_dirty else ''
            for j in range(style_count):
                # スタイル名取得
                style_name = ''
                n = char.get('name', '')
                if isinstance(n, list):
                    if n and isinstance(n[0], list):
                        style_name = n[j][0] if n[j] and isinstance(n[j], list) else str(n[j])
                    else:
                        style_name = n[j] if j < len(n) else ''
                else:
                    style_name = n if j == 0 else ''
                if j == 0:
                    self.listbox.insert(tk.END, f"{char.get('id', '?')}: {style_name if style_name else '(no name)'}{dirty_mark}")
                else:
                    # スタイル行にも編集マークを表示
                    self.listbox.insert(tk.END, f"  - {style_name if style_name else '(no name)'}{dirty_mark}")
                self.listbox_items.append((i, j))
                
                # 選択位置を復元
                if (preserve_selection and selected_char_idx == i and selected_style_idx == j):
                    new_selection_index = len(self.listbox_items) - 1
        
        # 選択状態を復元
        if new_selection_index is not None:
            self.listbox.selection_clear(0, tk.END)
            self.listbox.selection_set(new_selection_index)
            self.listbox.see(new_selection_index)  # スクロール位置も調整
            self.selected_index = new_selection_index

    def load_json(self):
        try:
            with open(JSON_PATH, 'r', encoding='utf-8') as f:
                self.data = json.load(f)
            # 1つ目はsettingsなのでスキップ
            self.characters = self.data[1:]
            self.build_listbox_items(preserve_selection=False)  # 初期読み込み時は選択状態なし
        except Exception as e:
            messagebox.showerror('エラー', f'cha.jsonの読み込みに失敗しました\n{e}')

    def on_listbox_click(self, event):
        """リストボックスクリック時の処理"""
        # クリックされた位置のアイテムを確実に選択
        index = self.listbox.nearest(event.y)
        if 0 <= index < self.listbox.size():
            self.listbox.selection_clear(0, tk.END)
            self.listbox.selection_set(index)
            self.listbox.activate(index)
            # 手動選択フラグを設定
            self._manual_selection = True
            # 即座にSelectイベントを発生（遅延なし）
            self.listbox.event_generate('<<ListboxSelect>>')

    def on_select(self, event):
        sel = self.listbox.curselection()
        if not sel:
            return
        idx = sel[0]
        
        # 重複選択を防ぐ（ただし、手動クリックの場合は許可）
        if (hasattr(self, 'selected_index') and self.selected_index == idx 
            and not hasattr(self, '_manual_selection')):
            return
        
        # 手動選択フラグをリセット
        if hasattr(self, '_manual_selection'):
            delattr(self, '_manual_selection')
        
        # キャラクター変更中フラグを設定（編集判定を無効化）
        self._changing_character = True
        
        try:
            # 前のキャラクターの編集内容を一時保存
            if hasattr(self, 'selected_index') and self.selected_index is not None and self.selected_index != idx:
                prev_char_idx, prev_style_idx = self.listbox_items[self.selected_index]
                self._update_buffer_from_fields(prev_char_idx, prev_style_idx)
            
            self.selected_index = idx
            char_idx, style_idx = self.listbox_items[idx]
            
            # 編集バッファからデータを取得
            char = self._get_buffer(char_idx)
            
            # 条件式に基づくフィールド表示
            for key, entry in self.fields.items():
                val = char.get(key, '')
                
                if key in self.never_array_fields:
                    # 未配列フィールド：常に単一値表示
                    display_val = str(val) if val is not None else ''
                    
                elif key in self.style_array_fields:
                    # スタイル配列対応フィールド
                    display_val = ''
                    
                    if key in self.nested_array_fields:
                        # 配列内配列フィールド（race, fightingStyle, attribute）
                        if isinstance(val, list):
                            if style_idx is not None and style_idx < len(val):
                                style_data = val[style_idx]
                                if isinstance(style_data, list):
                                    display_val = '\n'.join(str(x) for x in style_data if x)
                                else:
                                    display_val = str(style_data) if style_data else ''
                            else:
                                display_val = ''
                        else:
                            # 文字列の場合、最初のスタイルのみ表示
                            display_val = str(val) if style_idx == 0 and val else ''
                    else:
                        # その他のスタイル配列対応フィールド
                        if isinstance(val, list):
                            if style_idx is not None and style_idx < len(val):
                                style_data = val[style_idx]
                                if isinstance(style_data, list):
                                    display_val = '\n'.join(str(x) for x in style_data if x)
                                else:
                                    display_val = str(style_data) if style_data else ''
                            else:
                                display_val = ''
                        else:
                            # 文字列の場合、最初のスタイルのみ表示
                            display_val = str(val) if style_idx == 0 and val else ''
                            
                elif key in self.array_fields:
                    # 常に配列のフィールド
                    if isinstance(val, list):
                        display_val = '\n'.join(str(x) for x in val if x)
                    else:
                        display_val = str(val) if val else ''
                        
                else:
                    # その他のフィールド
                    display_val = str(val) if val is not None else ''
                
                # 表示（_changing_characterフラグで保護されているので、単純に値を設定）
                if isinstance(entry, tk.Text):
                    entry.delete('1.0', tk.END)
                    entry.insert('1.0', display_val)
                else:
                    entry.delete(0, tk.END)
                    entry.insert(0, display_val)
                        
            # birthday object対応（条件式準拠）
            b = char.get('birthday', {})
            if isinstance(b, dict):
                for part in ['year', 'month', 'day']:
                    v = b.get(part, None)
                    entry = self.birthday_fields[part]
                    entry.delete(0, tk.END)
                    if v is not None:
                        entry.insert(0, str(v))
            else:
                for part in ['year', 'month', 'day']:
                    entry = self.birthday_fields[part]
                    entry.delete(0, tk.END)
                    
            self.selected_char_idx = char_idx
            self.selected_style_idx = style_idx

            # 画像表示処理
            self.show_character_image(char, style_idx)
            
        finally:
            # キャラクター変更中フラグを解除
            self._changing_character = False
            
        # フラグ解除後にプレビュー更新
        self.update_image_preview()

    def parse_size_value(self, value):
        """サイズ値を解析してピクセル値を返す"""
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

    def parse_position_value(self, value):
        """位置値を解析してx, y座標を返す"""
        if not value:
            return 0, 0
        value = str(value).strip()
        parts = value.split()
        if len(parts) >= 2:
            try:
                x = float(parts[0].replace('px', ''))
                y = float(parts[1].replace('px', ''))
                return x, y
            except:
                return 0, 0
        return 0, 0

    def update_image_preview(self):
        """画像プレビューを更新"""
        if not hasattr(self, 'selected_index') or self.selected_index is None:
            return
        if not hasattr(self, 'pc_preview_canvas'):
            return
            
        char_idx, style_idx = self.listbox_items[self.selected_index]
        char = self._get_buffer(char_idx)
        
        # 現在のフィールド値を取得
        current_values = {}
        for key in ['imgsize', 'imgThumbsize', 'imageZoomPosition', 'imageThumbPosition', 'imgsize_mobile', 'imageZoomPosition_mobile']:
            entry = self.fields.get(key)
            if entry:
                if isinstance(entry, tk.Text):
                    current_values[key] = entry.get('1.0', tk.END).strip()
                else:
                    current_values[key] = entry.get().strip()
            else:
                current_values[key] = ''
        
        # 画像ファイル名を取得
        img_val = char.get('img', '')
        img_file = None
        if isinstance(img_val, list) and img_val:
            if style_idx is not None and style_idx < len(img_val):
                img_file = img_val[style_idx]
            else:
                img_file = img_val[0]
        elif isinstance(img_val, str):
            img_file = img_val

        if not img_file or not isinstance(img_file, str) or not img_file.strip():
            # 画像がない場合はプレースホルダーを表示
            self.clear_preview_canvases('画像なし')
            return

        # 画像パス
        img_path = os.path.join(os.path.dirname(__file__), '../img', img_file)
        if not os.path.exists(img_path):
            # プレースホルダー画像
            self.clear_preview_canvases('画像ファイルなし')
            return

        try:
            from PIL import Image, ImageTk
        except ImportError:
            # Pillowがインストールされていない場合
            print("警告: PIL (Pillow) がインストールされていません。画像プレビュー機能を使用するにはインストールしてください。")
            self.clear_preview_canvases('PIL未インストール')
            return

        try:
            # 元画像を読み込み
            original_img = Image.open(img_path)
            
            # PCプレビュー
            self.create_preview_image(original_img, self.pc_preview_canvas, 200, 200,
                                    current_values.get('imgsize', ''), 
                                    current_values.get('imageZoomPosition', ''),
                                    "PC")
            
            # モバイルプレビュー
            self.create_preview_image(original_img, self.mobile_preview_canvas, 120, 120,
                                    current_values.get('imgsize_mobile', ''), 
                                    current_values.get('imageZoomPosition_mobile', ''),
                                    "mobile")
            
            # 詳細プレビュー（現在のモードに合わせて）
            if hasattr(self, 'preview_mode') and self.preview_mode.get() == "mobile":
                self.create_preview_image(original_img, self.detail_preview_canvas, 300, 300,
                                        current_values.get('imgsize_mobile', ''), 
                                        current_values.get('imageZoomPosition_mobile', ''),
                                        "detail_mobile")
            else:
                self.create_preview_image(original_img, self.detail_preview_canvas, 300, 300,
                                        current_values.get('imgsize', ''), 
                                        current_values.get('imageZoomPosition', ''),
                                        "detail_pc")
            
        except ImportError:
            # Pillowがインストールされていない場合
            print("警告: PIL (Pillow) がインストールされていません。画像プレビュー機能を使用するにはインストールしてください。")
            self.clear_preview_canvases()
            # 簡易メッセージを表示
            if hasattr(self, 'pc_preview_canvas'):
                self.pc_preview_canvas.delete('all')
                self.pc_preview_canvas.create_text(100, 100, text='PIL未インストール', fill='red')
        except Exception as e:
            print(f"画像プレビューエラー: {e}")
            self.clear_preview_canvases('画像エラー')

    def create_preview_image(self, original_img, canvas, canvas_width, canvas_height, size_value, position_value, preview_type):
        """指定されたキャンバスに画像プレビューを作成"""
        try:
            from PIL import Image, ImageTk
        except ImportError:
            # Pillowがない場合は何もしない
            canvas.delete('all')
            canvas.create_text(canvas_width//2, canvas_height//2, text='PIL未インストール', fill='red')
            return
            
        canvas.delete('all')
        
        # サイズ計算
        size_percent = self.parse_size_value(size_value) if size_value else 100
        
        # 元画像サイズ
        orig_w, orig_h = original_img.size
        
        # 基準サイズを決定（PCは200px、モバイルは120px）
        if "mobile" in preview_type:
            base_size = 120
        else:
            base_size = 200
            
        # 詳細表示の場合は拡大
        if "detail" in preview_type:
            scale_factor = 300 / base_size
        else:
            scale_factor = 1.0
        
        # 実際の表示サイズ
        display_size = (base_size * size_percent / 100) * scale_factor
        
        # 画像をリサイズ
        aspect_ratio = orig_w / orig_h
        if aspect_ratio > 1:  # 横長
            new_w = int(display_size)
            new_h = int(display_size / aspect_ratio)
        else:  # 縦長または正方形
            new_w = int(display_size * aspect_ratio)
            new_h = int(display_size)
        
        try:
            if new_w > 0 and new_h > 0:
                resized_img = original_img.resize((new_w, new_h), Image.LANCZOS)
            else:
                resized_img = original_img.resize((50, 50), Image.LANCZOS)
                new_w, new_h = 50, 50
        except Exception:
            # リサイズに失敗した場合
            canvas.create_text(canvas_width//2, canvas_height//2, text='画像エラー', fill='red')
            return
        
        # 位置計算
        pos_x, pos_y = self.parse_position_value(position_value)
        if "detail" in preview_type:
            pos_x *= scale_factor
            pos_y *= scale_factor
        
        # キャンバス中央を基準とした位置
        center_x = canvas_width // 2
        center_y = canvas_height // 2
        
        # 最終位置
        final_x = center_x + pos_x
        final_y = center_y + pos_y
        
        try:
            # PhotoImageに変換
            tk_img = ImageTk.PhotoImage(resized_img)
            self.tk_images[preview_type] = tk_img  # 参照を保持
            
            # キャンバスに描画
            canvas.create_image(final_x, final_y, image=tk_img)
        except Exception:
            canvas.create_text(canvas_width//2, canvas_height//2, text='描画エラー', fill='red')
            return
        
        # 枠線を描画（表示領域を示す）
        border_color = "#cccccc"
        canvas.create_rectangle(2, 2, canvas_width-2, canvas_height-2, outline=border_color, width=1)
        
        # 中央線を描画
        canvas.create_line(center_x, 0, center_x, canvas_height, fill="#e0e0e0", width=1)
        canvas.create_line(0, center_y, canvas_width, center_y, fill="#e0e0e0", width=1)

    def clear_preview_canvases(self, message='画像なし'):
        """すべてのプレビューキャンバスをクリア"""
        if not hasattr(self, 'pc_preview_canvas'):
            return
        for canvas in [self.pc_preview_canvas, self.mobile_preview_canvas, self.detail_preview_canvas]:
            canvas.delete('all')
            # キャンバスサイズを取得
            width = canvas.winfo_reqwidth() if canvas.winfo_reqwidth() > 1 else 200
            height = canvas.winfo_reqheight() if canvas.winfo_reqheight() > 1 else 200
            
            # メッセージの色を決定
            text_color = 'red' if 'PIL' in message or 'エラー' in message else 'gray'
            canvas.create_text(width//2, height//2, text=message, fill=text_color)

    def schedule_preview_update(self):
        """プレビュー更新をスケジュール（連続入力時の負荷軽減）"""
        # キャラクター変更中は無視
        if hasattr(self, '_changing_character') and self._changing_character:
            return
            
        if hasattr(self, '_preview_update_after'):
            self.after_cancel(self._preview_update_after)
        self._preview_update_after = self.after(300, self.update_image_preview)

    def set_field_value(self, entry, value):
        """フィールドに値を設定"""
        if isinstance(entry, tk.Text):
            entry.delete('1.0', tk.END)
            entry.insert('1.0', value)
        else:
            entry.delete(0, tk.END)
            entry.insert(0, value)
        self._set_edited()
        self.schedule_preview_update()

    def adjust_position(self, entry, dx, dy):
        """位置を調整"""
        current = entry.get() if hasattr(entry, 'get') else entry.get('1.0', tk.END).strip()
        
        # 現在の位置を解析
        x, y = self.parse_position_value(current)
        
        # 新しい位置
        new_x = x + dx
        new_y = y + dy
        
        # 新しい値を設定
        new_value = f"{int(new_x)}px {int(new_y)}px"
        self.set_field_value(entry, new_value)

    def show_character_image(self, char, style_idx):
        """キャラクター画像の表示処理（新しいプレビューシステム用に最適化）"""
        # 既存の画像プレビュー更新機能を使用
        self.update_image_preview()

    def _validate_json(self):
        """JSONデータのバリデーション"""
        errors = []
        
        try:
            # 基本的なJSONシリアライズテスト
            json.dumps(self.data, ensure_ascii=False)
        except Exception as e:
            errors.append(f"JSONシリアライズエラー: {e}")
        
        # キャラクターデータの基本チェック
        for i, char in enumerate(self.characters):
            if 'id' not in char:
                errors.append(f"キャラ{i+1}: IDが設定されていません")
            elif not isinstance(char['id'], int):
                errors.append(f"キャラ{i+1}: IDは数値である必要があります")
        
        return errors

    def save_changes(self):
        if self.selected_index is None:
            return
        self._push_undo()
        char_idx, style_idx = self.listbox_items[self.selected_index]
        
        # 現在のフィールド内容をバッファに反映
        self._update_buffer_from_fields(char_idx, style_idx)
        
        # バリデーション
        errors = self._validate_json()
        if errors:
            messagebox.showerror('バリデーションエラー', '\n'.join(errors))
            return
        
        # 保存
        try:
            # 編集バッファを実際のデータに反映
            self._save_buffer_to_char(char_idx)
            # charactersの内容をdataに反映
            self.data[1:] = self.characters
            # カスタム形式で保存（指定フィールドを1行形式に）
            compact_fields = {
                'en', 'ja',  # settings内の配列
                'name', 'name_en', 'race', 'fightingStyle', 'attribute', 
                'imgThumbsize', 'imageThumbPosition'  # キャラ内の配列
            }
            save_json_with_custom_format(self.data, JSON_PATH, compact_fields)
            self.build_listbox_items(preserve_selection=True)  # 選択状態を保持
            self._editing = False
            self._update_edit_indicator()
            messagebox.showinfo('保存', 'cha.jsonを保存しました')
        except Exception as e:
            messagebox.showerror('エラー', f'保存に失敗しました\n{e}')

    def add_character(self):
        new_id = self._get_next_id()
        # 条件式に基づく新規キャラクター作成
        new_char = {
            'id': new_id,                                    # number型(未配列)
            'name': '新規キャラ',                           # string型(複数は配列)
            'name_en': '',                                   # string型(複数は配列)
            'name_Kana': '',                                 # string型(未配列)
            'description': '',                               # string型(複数は配列)
            'world': '',                                     # string型(未配列)
            'race': [''],                                    # 配列(string型)(複数は配列内配列)
            'fightingStyle': [''],                           # 配列(string型)(複数は配列内配列)
            'attribute': [''],                               # 配列(string型)(複数は配列内配列)
            'height': None,                                  # number型(未配列)
            'age': '',                                       # string型(未配列)
            'birthday': {                                    # オブジェクト
                'year': None,                                # string型(未配列)
                'month': None,                               # number型(未配列)
                'day': None                                  # number型(未配列)
            },
            'personality': '',                               # string型(未配列)
            'group': [''],                                   # 配列(string型)(未配列)
            'img': [f'{new_id}.webp'],                      # 配列(string型)(複数は配列)
            'imgsize': '',                                   # string型(未配列)
            'imgThumbsize': [''],                           # 配列(string型)(複数は配列)
            'imageZoomPosition': '',                         # string型(未配列)
            'imageThumbPosition': [''],                     # 配列(string型)(複数は配列)
            'imgsize_mobile': '',                           # string型(未配列)
            'imageZoomPosition_mobile': ''                  # string型(未配列)
        }
        new_char_idx = len(self.characters)
        self.characters.append(new_char)
        self.data[1:] = self.characters
        self.build_listbox_items(preserve_selection=False)
        
        # 新しく作成されたキャラクターを選択
        for i, (char_idx, style_idx) in enumerate(self.listbox_items):
            if char_idx == new_char_idx and style_idx == 0:
                self.listbox.selection_clear(0, tk.END)
                self.listbox.selection_set(i)
                self.listbox.see(i)
                self.selected_index = i
                self.listbox.event_generate('<<ListboxSelect>>')
                break

    def delete_character(self):
        sel = self.listbox.curselection()
        if not sel:
            return
        idx = sel[0]
        char_idx, style_idx = self.listbox_items[idx]
        if messagebox.askyesno('削除確認', '本当にキャラごと削除しますか？'):
            # 削除前に次に選択する位置を決定
            next_selection_char_idx = None
            next_selection_style_idx = None
            
            # 削除対象より後のキャラクターがあれば、その最初のスタイルを選択
            if char_idx + 1 < len(self.characters):
                next_selection_char_idx = char_idx  # 削除後はインデックスがずれるので同じ値
                next_selection_style_idx = 0
            # なければ削除対象より前のキャラクターの最初のスタイルを選択
            elif char_idx > 0:
                next_selection_char_idx = char_idx - 1
                next_selection_style_idx = 0
            
            del self.characters[char_idx]
            self.data[1:] = self.characters
            self.build_listbox_items(preserve_selection=False)
            
            # 適切な位置を選択
            if next_selection_char_idx is not None and self.characters:
                for i, (c_idx, s_idx) in enumerate(self.listbox_items):
                    if c_idx == next_selection_char_idx and s_idx == next_selection_style_idx:
                        self.listbox.selection_clear(0, tk.END)
                        self.listbox.selection_set(i)
                        self.listbox.see(i)
                        self.selected_index = i
                        self.listbox.event_generate('<<ListboxSelect>>')
                        break
            else:
                # キャラクターが全て削除された場合
                self.selected_index = None
                for entry in self.fields.values():
                    if isinstance(entry, tk.Text):
                        entry.delete('1.0', tk.END)
                    else:
                        entry.delete(0, tk.END)
            
            self.save_changes()

    def add_style(self):
        sel = self.listbox.curselection()
        if not sel:
            return
        idx = sel[0]
        char_idx, style_idx = self.listbox_items[idx]
        char = self.characters[char_idx]
        
        # 条件式に基づくスタイル追加
        for key in self.style_array_fields:
            current_value = char.get(key, '')
            
            if key in self.nested_array_fields:
                # 配列内配列フィールド（race, fightingStyle, attribute）
                if isinstance(current_value, list):
                    if len(current_value) > 0 and isinstance(current_value[0], list):
                        # 既に配列内配列の場合
                        current_value.insert(style_idx+1 if style_idx is not None else len(current_value), [''])
                    else:
                        # 1次元配列の場合は2次元配列に変換
                        arr2 = []
                        for v in current_value:
                            arr2.append([v] if v else [''])
                        arr2.insert(style_idx+1 if style_idx is not None else len(arr2), [''])
                        char[key] = arr2
                else:
                    # 文字列の場合は配列内配列に変換
                    if current_value:
                        char[key] = [[current_value], ['']]
                    else:
                        char[key] = [[''], ['']]
            else:
                # その他のスタイル配列対応フィールド
                if isinstance(current_value, list):
                    current_value.insert(style_idx+1 if style_idx is not None else len(current_value), '')
                else:
                    # 文字列の場合は配列に変換
                    char[key] = [current_value, '']
                    
        self.data[1:] = self.characters
        self.build_listbox_items(preserve_selection=False)
        
        # 新スタイルを選択
        target_style_idx = style_idx + 1 if style_idx is not None else 1
        for i, (cidx, sidx) in enumerate(self.listbox_items):
            if cidx == char_idx and sidx == target_style_idx:
                self.listbox.selection_clear(0, tk.END)
                self.listbox.selection_set(i)
                self.listbox.see(i)
                self.selected_index = i
                self.listbox.event_generate('<<ListboxSelect>>')
                break

    def delete_style(self):
        sel = self.listbox.curselection()
        if not sel:
            return
        idx = sel[0]
        char_idx, style_idx = self.listbox_items[idx]
        char = self.characters[char_idx]
        if style_idx == 0:
            messagebox.showwarning('警告', 'メインスタイルは削除できません')
            return
        if messagebox.askyesno('削除確認', 'このスタイルを削除しますか？'):
            # 削除後に選択する位置を決定（削除対象の前のスタイル、または最初のスタイル）
            next_style_idx = max(0, style_idx - 1)
            
            for key in self.style_array_fields:
                arr = char.get(key, [])
                if arr and isinstance(arr[0], list) and len(arr) > style_idx:
                    arr.pop(style_idx)
                    char[key] = arr
            self.data[1:] = self.characters
            self.build_listbox_items(preserve_selection=False)
            
            # 適切な位置を選択
            for i, (cidx, sidx) in enumerate(self.listbox_items):
                if cidx == char_idx and sidx == next_style_idx:
                    self.listbox.selection_clear(0, tk.END)
                    self.listbox.selection_set(i)
                    self.listbox.see(i)
                    self.selected_index = i
                    self.listbox.event_generate('<<ListboxSelect>>')
                    break
            
            self.save_changes()

    def _normalize_characters_data(self):
        """条件式に基づくキャラクターデータの正規化（別スタイルがない場合は配列化しない）"""
        for char in self.characters:
            # 未配列フィールドの正規化（常に文字列または単一値）
            for field in self.never_array_fields:
                if field in char:
                    value = char[field]
                    if isinstance(value, list):
                        if len(value) == 1:
                            char[field] = value[0]
                        elif len(value) == 0:
                            if field == 'height':
                                char[field] = None
                            else:
                                char[field] = ''
            
            # スタイル配列対応フィールドの正規化（別スタイルがない場合は単一値に変換）
            for field in self.style_array_fields:
                if field in char:
                    value = char[field]
                    
                    if field in self.nested_array_fields:
                        # 配列内配列フィールドの正規化（race, fightingStyle, attribute）
                        if isinstance(value, list):
                            if len(value) == 1:
                                inner_array = value[0]
                                if isinstance(inner_array, list):
                                    if len(inner_array) == 1:
                                        # [[value]] -> value（単一スタイルの場合）
                                        char[field] = inner_array[0] if inner_array[0] else ''
                                    elif len(inner_array) == 0:
                                        # [[]] -> ''
                                        char[field] = ''
                                    # else: 複数要素がある場合は配列のまま保持
                                else:
                                    # [value] -> value
                                    char[field] = inner_array if inner_array else ''
                            elif len(value) == 0:
                                char[field] = ''
                            # else: 複数スタイルがある場合は配列のまま保持
                    else:
                        # その他のスタイル配列対応フィールドの正規化
                        if isinstance(value, list):
                            if len(value) == 1:
                                # [value] -> value（単一スタイルの場合）
                                char[field] = value[0] if value[0] else ''
                            elif len(value) == 0:
                                char[field] = ''
                            # else: 複数スタイルがある場合は配列のまま保持
            
            # 常に配列フィールドの正規化（group等は常に配列のまま）
            for field in self.array_fields:
                if field in char and field not in self.style_array_fields:
                    # style_array_fieldsに含まれていない配列フィールドのみ処理
                    value = char[field]
                    if isinstance(value, list):
                        if len(value) == 0 or (len(value) == 1 and value[0] == ''):
                            char[field] = ['']
                    elif not value:
                        char[field] = ['']
            
            # 多重配列フィールドの特別処理（imgThumbsize, imageThumbPosition）
            for field in ['imgThumbsize', 'imageThumbPosition']:
                if field in char:
                    value = char[field]
                    if isinstance(value, list):
                        if len(value) == 1:
                            # 単一スタイルの場合
                            inner_value = value[0]
                            if isinstance(inner_value, list):
                                if len(inner_value) == 1:
                                    # [[value]] -> [value]（一層削除）
                                    char[field] = inner_value
                                elif len(inner_value) == 0:
                                    # [[]] -> ['']
                                    char[field] = ['']
                                # else: 複数要素がある場合は [inner_value] のまま保持
                            else:
                                # [value] の場合はそのまま保持
                                pass
                        elif len(value) == 0:
                            char[field] = ['']
                        # else: 複数スタイルがある場合は配列のまま保持
            
            # 数値フィールドの正規化
            if 'height' in char:
                if char['height'] == '' or char['height'] == 0:
                    char['height'] = None
            
            # birthday フィールドの正規化
            if 'birthday' in char and isinstance(char['birthday'], dict):
                birthday = char['birthday']
                for part in ['year', 'month', 'day']:
                    if part in birthday:
                        if birthday[part] == '' or birthday[part] == 0:
                            birthday[part] = None


if __name__ == '__main__':
    app = ChaEditor()
    app.mainloop()
