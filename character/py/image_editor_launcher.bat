@echo off
cd /d "%~dp0"
echo キャラクター画像エディタを起動しています...
python image_editor.py
if %errorlevel% neq 0 (
    echo.
    echo エラーが発生しました。Pythonがインストールされているか確認してください。
    echo また、Pillowライブラリが必要です: pip install Pillow
    pause
)
