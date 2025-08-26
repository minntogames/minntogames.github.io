# JSON フォーマッタ

キャラクターJSONファイルの特定フィールドを1行形式で保存するためのツール群です。

## ファイル構成

- `json_formatter.py` - 基本的なJSONフォーマッタライブラリ
- `format_json_standalone.py` - スタンドアロン実行用スクリプト
- `format_json_advanced.py` - 高度な設定が可能なフォーマッタ
- `cha_json_editor.py` - メインエディタ（フォーマッタ機能付き）

## 使用方法

### 1. スタンドアロン実行

```bash
python format_json_standalone.py
```

### 2. 高度なフォーマッタ

```bash
python format_json_advanced.py
```

### 3. エディタのメニューから

1. `cha_json_editor.py` を実行
2. メニューバー > ファイル > "JSONを1行形式で再フォーマット"

## 1行形式になるフィールド

### settings内の配列
- `en` - 英語設定配列
- `ja` - 日本語設定配列

### キャラクター内の配列
- `name` - キャラクター名
- `name_en` - 英語名
- `race` - 種族
- `fightingStyle` - 戦闘スタイル
- `attribute` - 属性
- `imgThumbsize` - サムネイル画像サイズ
- `imageThumbPosition` - サムネイル画像位置

## フォーマット例

### 変更前（複数行形式）
```json
"name": [
    "Xドクター",
    "W.D.ドクター"
]
```

### 変更後（1行形式）
```json
"name": ["Xドクター", "W.D.ドクター"]
```

## バックアップ

フォーマット実行時に自動的にバックアップファイルが作成されます：
- `cha.json.backup` - 標準バックアップ
- `cha.json.advanced_backup` - 高度なフォーマッタ用バックアップ

## 注意事項

- 実行前に必要に応じて手動でバックアップを作成してください
- JSONの構造は変更されませんが、可読性は変わります
- エディタで編集後に保存すると自動的に1行形式で保存されます

## カスタマイズ

`format_json_advanced.py` の `FORMAT_SETTINGS` を編集することで、どのフィールドを1行形式にするかを変更できます。

```python
FORMAT_SETTINGS = {
    'always_compact': {
        'name', 'name_en', 'race'  # 常に1行形式
    },
    'conditional_compact': {
        'img', 'group'  # 条件によって1行形式
    }
}
```
