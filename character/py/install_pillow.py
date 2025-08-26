# -*- coding: utf-8 -*-
"""
Pillowライブラリのインストール確認とインストールスクリプト
"""

import subprocess
import sys

def check_pillow():
    """Pillowがインストールされているかチェック"""
    try:
        import PIL
        print("✅ Pillow (PIL) はインストールされています")
        print(f"   バージョン: {PIL.__version__}")
        return True
    except ImportError:
        print("❌ Pillow (PIL) がインストールされていません")
        return False

def install_pillow():
    """Pillowをインストール"""
    print("Pillowをインストールしています...")
    try:
        result = subprocess.run(
            [sys.executable, '-m', 'pip', 'install', 'Pillow'],
            capture_output=True,
            text=True,
            check=True
        )
        print("✅ Pillowのインストールが完了しました")
        print(result.stdout)
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Pillowのインストールに失敗しました: {e}")
        print(f"エラー出力: {e.stderr}")
        return False
    except Exception as e:
        print(f"❌ インストール中にエラーが発生しました: {e}")
        return False

def main():
    print("=== Pillow (PIL) インストール確認 ===")
    
    if check_pillow():
        print("\n画像プレビュー機能が利用可能です。")
        return
    
    print("\n画像プレビュー機能を使用するにはPillowが必要です。")
    response = input("Pillowをインストールしますか？ (y/n): ")
    
    if response.lower() in ['y', 'yes', 'はい']:
        if install_pillow():
            print("\nインストール完了！ エディタを再起動してください。")
        else:
            print("\n手動でインストールしてください:")
            print("pip install Pillow")
    else:
        print("インストールをスキップしました。")
        print("後でインストールする場合:")
        print("pip install Pillow")

if __name__ == "__main__":
    main()
    input("\nEnterキーを押して終了...")
