# -*- coding: utf-8 -*-
import tkinter as tk
from tkinter import ttk, messagebox
import json
import os

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
        """現在のフィールド内容を編集バッファに反映"""
        char = self._get_buffer(char_idx)
        
        for key, entry in self.fields.items():
            if isinstance(entry, tk.Text):
                text = entry.get('1.0', tk.END).strip()
            else:
                text = entry.get()
            
            if key in self.style_array_fields:
                val = [x.strip() for x in text.split('\n') if x.strip()]
                arr = char.get(key, [])
                
                # arrが文字列の場合は配列に変換
                if isinstance(arr, str):
                    arr = [arr] if arr else ['']
                elif not isinstance(arr, list):
                    arr = ['']
                
                if arr and isinstance(arr[0], list):
                    while len(arr) <= style_idx:
                        arr.append([])
                    arr[style_idx] = val if len(val) > 1 else (val[0] if val else '')
                    char[key] = arr
                else:
                    if style_idx == 0:
                        if len(arr) > 1:
                            # arrがリストであることを確認してから代入
                            if isinstance(arr, list):
                                arr[0] = val if len(val) > 1 else (val[0] if val else '')
                                char[key] = arr
                            else:
                                char[key] = [val if len(val) > 1 else (val[0] if val else '')]
                        else:
                            char[key] = [val if len(val) > 1 else (val[0] if val else '')]
                    else:
                        new_arr = []
                        for i in range(style_idx+1):
                            if isinstance(arr, list) and i < len(arr):
                                new_arr.append(arr[i])
                            else:
                                new_arr.append('')
                        new_arr[style_idx] = val if len(val) > 1 else (val[0] if val else '')
                        char[key] = new_arr
            elif key in self.multi_line_fields:
                val = [x.strip() for x in text.split('\n') if x.strip()]
                char[key] = val if len(val) > 1 else (val[0] if val else '')
            elif key == 'id' or key == 'height':
                try:
                    val = int(text)
                except Exception:
                    val = text
                char[key] = val
            else:
                char[key] = text
        
        # birthdayフィールドの処理
        b = {}
        for part in ['year', 'month', 'day']:
            v = self.birthday_fields[part].get().strip()
            if v == '':
                b[part] = None
            else:
                try:
                    b[part] = int(v)
                except Exception:
                    b[part] = v
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
        filemenu.add_command(label='デスクトップショートカット作成', command=self.create_desktop_shortcut)
        filemenu.add_separator()
        filemenu.add_command(label='終了', command=self.quit)
        menubar.add_cascade(label='ファイル', menu=filemenu)
        self.config(menu=menubar)

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

    def _validate_json(self):
        # 必須項目や型チェック（例: id, name, img など）
        errors = []
        for i, char in enumerate(self.characters):
            if 'id' not in char or not isinstance(char['id'], int):
                errors.append(f"{i+1}番目のキャラ: idが整数で未設定")
            if 'name' not in char or not char['name']:
                errors.append(f"{i+1}番目のキャラ: nameが未設定")
            if 'img' not in char or not char['img']:
                errors.append(f"{i+1}番目のキャラ: imgが未設定")
        return errors
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

        # 画像表示用キャンバス
        self.img_canvas = tk.Canvas(self.detail_frame, width=320, height=320, bg='#eee', bd=2, relief=tk.SUNKEN)
        self.img_canvas.grid(row=0, column=0, columnspan=2, pady=(0, 10))
        self.tk_img = None  # 画像参照保持用

        self.fields = {}
        self.labels = ['id', 'name', 'name_en', 'name_Kana', 'description', 'world', 'race', 'fightingStyle', 'attribute', 'height', 'age', 'personality', 'group', 'img', 'imgsize', 'imageZoomPosition', 'imgsize_mobile', 'imageZoomPosition_mobile']
        self.style_array_fields = ['name', 'name_en', 'description', 'race', 'fightingStyle', 'attribute', 'img', 'imgsize', 'imageZoomPosition', 'imgsize_mobile', 'imageZoomPosition_mobile']
        self.multi_line_fields = ['description', 'fightingStyle', 'attribute', 'race', 'group']
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
            # 編集検知
            if isinstance(entry, tk.Text):
                entry.bind('<KeyRelease>', self._set_edited)
            else:
                entry.bind('<KeyRelease>', self._set_edited)
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
                combo.bind('<<ComboboxSelected>>', self._set_edited)
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
            with open(JSON_PATH, 'w', encoding='utf-8') as f:
                json.dump(self.data, f, ensure_ascii=False, indent=4)
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
        
        # dataの更新
        self.data[1:] = self.characters
        
        # JSON保存
        try:
            with open(JSON_PATH, 'w', encoding='utf-8') as f:
                json.dump(self.data, f, ensure_ascii=False, indent=4)
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

    def on_select(self, event):
        sel = self.listbox.curselection()
        if not sel:
            return
        idx = sel[0]
        
        # 前のキャラクターの編集内容を一時保存
        if hasattr(self, 'selected_index') and self.selected_index is not None and self.selected_index != idx:
            prev_char_idx, prev_style_idx = self.listbox_items[self.selected_index]
            self._update_buffer_from_fields(prev_char_idx, prev_style_idx)
        
        self.selected_index = idx
        char_idx, style_idx = self.listbox_items[idx]
        
        # 編集バッファからデータを取得（なければ元データをコピー）
        char = self._get_buffer(char_idx)
        
        # スタイルごとに分岐
        for key, entry in self.fields.items():
            val = char.get(key, '')
            if key in self.style_array_fields:
                # 多次元配列対応
                v = ''
                if isinstance(val, list):
                    # [[...], [...]] or [...] or ''
                    if val and len(val) > 0 and isinstance(val[0], list):
                        if style_idx is not None and style_idx < len(val):
                            v = val[style_idx]
                        else:
                            v = ''
                    else:
                        v = val[style_idx] if style_idx is not None and style_idx < len(val) else ''
                elif isinstance(val, str):
                    # 文字列の場合は最初のスタイルのみ表示
                    v = val if style_idx == 0 else ''
                else:
                    v = val if style_idx == 0 else ''
                
                if isinstance(entry, tk.Text):
                    entry.delete('1.0', tk.END)
                    if isinstance(v, list):
                        entry.insert('1.0', '\n'.join(str(x) for x in v))
                    else:
                        entry.insert('1.0', str(v))
                else:
                    entry.delete(0, tk.END)
                    entry.insert(0, str(v))
            elif key in self.multi_line_fields and isinstance(entry, tk.Text):
                if isinstance(val, list):
                    entry.delete('1.0', tk.END)
                    entry.insert('1.0', '\n'.join(str(x) for x in val))
                else:
                    entry.delete('1.0', tk.END)
                    entry.insert('1.0', str(val))
            else:
                if isinstance(entry, tk.Text):
                    entry.delete('1.0', tk.END)
                    entry.insert('1.0', str(val))
                else:
                    entry.delete(0, tk.END)
                    entry.insert(0, str(val))
        # birthday object対応
        b = char.get('birthday', {})
        if isinstance(b, dict):
            for part in ['year', 'month', 'day']:
                v = b.get(part, '')
                self.birthday_fields[part].delete(0, tk.END)
                self.birthday_fields[part].insert(0, str(v) if v is not None else '')
        elif isinstance(b, str):
            self.birthday_fields['year'].delete(0, tk.END)
            self.birthday_fields['year'].insert(0, b)
            self.birthday_fields['month'].delete(0, tk.END)
            self.birthday_fields['day'].delete(0, tk.END)
        else:
            for part in ['year', 'month', 'day']:
                self.birthday_fields[part].delete(0, tk.END)
        self.selected_char_idx = char_idx
        self.selected_style_idx = style_idx

        # 画像表示処理
        self.show_character_image(char, style_idx)

    def show_character_image(self, char, style_idx):
        # 画像ファイル名を取得
        img_val = char.get('img', '')
        img_file = None
        if isinstance(img_val, list):
            if img_val:
                if style_idx is not None and style_idx < len(img_val):
                    img_file = img_val[style_idx]
                else:
                    img_file = img_val[0]
        elif isinstance(img_val, str):
            img_file = img_val
        # 画像パスを決定
        if img_file and isinstance(img_file, str) and img_file.strip():
            img_path = os.path.join(os.path.dirname(__file__), '../img', img_file)
            if not os.path.exists(img_path):
                img_path = os.path.join(os.path.dirname(__file__), '../img/placeholder.png')
        else:
            img_path = os.path.join(os.path.dirname(__file__), '../img/placeholder.png')
        # 画像表示（縦横比維持で中央に表示）
        try:
            from PIL import Image, ImageTk
            img = Image.open(img_path)
            max_w, max_h = 300, 300
            w, h = img.size
            scale = min(max_w / w, max_h / h)
            new_w, new_h = int(w * scale), int(h * scale)
            img = img.resize((new_w, new_h), Image.LANCZOS)
            self.tk_img = ImageTk.PhotoImage(img)
            self.img_canvas.delete('all')
            # キャンバス中央に配置
            x = (max_w // 2) + 10  # gridの余白分微調整
            y = (max_h // 2) + 10
            self.img_canvas.create_image(x, y, image=self.tk_img)
        except Exception as e:
            self.img_canvas.delete('all')
            self.img_canvas.create_text(160, 160, text='画像なし', fill='gray')

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
            with open(JSON_PATH, 'w', encoding='utf-8') as f:
                json.dump(self.data, f, ensure_ascii=False, indent=4)
            self.build_listbox_items(preserve_selection=True)  # 選択状態を保持
            self._editing = False
            self._update_edit_indicator()
            messagebox.showinfo('保存', 'cha.jsonを保存しました')
        except Exception as e:
            messagebox.showerror('エラー', f'保存に失敗しました\n{e}')

    def add_character(self):
        new_id = self._get_next_id()
        new_char = {
            'id': new_id,
            'name': ['新規キャラ'],
            'name_en': [''],
            'name_Kana': '',
            'description': [''],
            'world': '',
            'race': [''],
            'fightingStyle': [''],
            'attribute': [''],
            'height': '',
            'age': '',
            'birthday': {'year': '', 'month': '', 'day': ''},
            'personality': '',
            'group': '',
            'img': [f'{new_id}.webp'],  # IDに基づいた初期画像ファイル名
            'imgsize': [''],
            'imageZoomPosition': [''],
            'imgsize_mobile': [''],
            'imageZoomPosition_mobile': ['']
        }
        new_char_idx = len(self.characters)
        self.characters.append(new_char)
        self.data[1:] = self.characters
        self.build_listbox_items(preserve_selection=False)  # 新規作成時は選択状態をクリア
        
        # 新しく作成されたキャラクターを選択
        for i, (char_idx, style_idx) in enumerate(self.listbox_items):
            if char_idx == new_char_idx and style_idx == 0:
                self.listbox.selection_clear(0, tk.END)
                self.listbox.selection_set(i)
                self.listbox.see(i)  # スクロール位置も調整
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
        # name, name_en, description, race, fightingStyle, attribute, img など配列に追加
        for key in self.style_array_fields:
            arr = char.get(key, [])
            # 多次元配列化
            if arr and isinstance(arr[0], list):
                arr.insert(style_idx+1 if style_idx is not None else len(arr), [''])
            else:
                # 1次元→2次元
                arr2 = []
                if isinstance(arr, list) and arr:
                    for v in arr:
                        arr2.append([v] if not isinstance(v, list) else v)
                else:
                    arr2 = [['']]
                arr2.insert(style_idx+1 if style_idx is not None else len(arr2), [''])
                arr = arr2
            char[key] = arr
        self.data[1:] = self.characters
        self.build_listbox_items(preserve_selection=False)  # 新規スタイル追加時は選択状態をクリア
        
        # 新スタイルを選択
        target_style_idx = style_idx + 1 if style_idx is not None else 1
        for i, (cidx, sidx) in enumerate(self.listbox_items):
            if cidx == char_idx and sidx == target_style_idx:
                self.listbox.selection_clear(0, tk.END)
                self.listbox.selection_set(i)
                self.listbox.see(i)  # スクロール位置も調整
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


if __name__ == '__main__':
    app = ChaEditor()
    app.mainloop()
