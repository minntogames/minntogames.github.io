# キャラクター画像エディタ

キャラクターデータの画像関連プロパティを視覚的に編集できるツールです。

## 機能

- 画像サイズ (imgsize, imgsize_mobile) の編集
- 画像位置 (imageZoomPosition, imageZoomPosition_mobile) の調整
- サムネイル設定 (imgThumbsize, imageThumbPosition) の編集
- リアルタイムプレビュー (PC: 200px, モバイル: 120px)
- 位置調整ボタンによる直感的な編集

## セットアップ

### 1. 必要なライブラリのインストール

PowerShellを管理者として実行し、以下のコマンドを実行：

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
./setup_image_editor.ps1
```

または、手動でインストール：

```bash
pip install Pillow
```

### 2. 起動方法

`image_editor_launcher.bat` をダブルクリックするか、コマンドラインで：

```bash
python image_editor.py
```

## 使用方法

1. **キャラクター選択**: 左側のリストからキャラクターを選択
2. **スタイル選択**: スタイルドロップダウンから編集したいスタイルを選択
3. **画像設定編集**:
   - PC用サイズ・位置設定
   - モバイル用サイズ・位置設定
   - サムネイル設定
4. **プレビュー確認**: 右側でリアルタイムプレビューを確認
5. **保存**: 「保存」ボタンでcha.jsonに変更を保存

## 編集可能なフィールド

- `img`: 画像ファイル名
- `imgsize`: PC表示時の画像サイズ (例: "200%", "150%")
- `imageZoomPosition`: PC表示時の画像位置 (例: "-40px -80px")
- `imgsize_mobile`: モバイル表示時の画像サイズ
- `imageZoomPosition_mobile`: モバイル表示時の画像位置
- `imgThumbsize`: サムネイル画像サイズ (複数行対応)
- `imageThumbPosition`: サムネイル画像位置 (複数行対応)

## プレビューサイズ

- PC表示: 200px × 200px (実際のカードサイズ)
- モバイル表示: 120px × 120px (実際のカードサイズ)
- 詳細表示: 300px × 300px (拡大表示)

## 位置調整

- **方向ボタン**: 10px単位での移動
- **微調整ボタン**: 1px単位での移動
- **○ボタン**: 中央位置にリセット (center)
- **プリセットボタン**: CSS object-position キーワード
  - `center`: 中央 (デフォルト)
  - `top`: 上端
  - `bottom`: 下端
  - `left`: 左端
  - `right`: 右端

## プレビューの仕組み

エディタのプレビューは、実際のウェブサイトでの表示を正確に再現します：

- **imgframe**: 固定サイズのフレーム (PC: 200×200px, モバイル: 120×120px)
- **object-fit: cover**: 画像がフレーム全体を覆うように表示
- **object-position**: フレーム内での画像の位置を調整
- **imgsize**: 画像の幅（%指定）
- **赤い枠**: 実際の表示領域を示す

## 注意事項

- 画像ファイルは `../img/` フォルダに配置してください
- サイズは "%"、位置は "px" 単位で指定してください
- 変更は「保存」ボタンを押すまで反映されません
- プレビューは自動更新されますが、「プレビュー更新」ボタンで手動更新も可能です
