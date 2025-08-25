# PowerShell script to install required packages for image editor
Write-Host "キャラクター画像エディタのセットアップ" -ForegroundColor Green
Write-Host "必要なライブラリをインストールします..." -ForegroundColor Yellow

try {
    # Check if Python is available
    $pythonVersion = python --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Python が見つかりました: $pythonVersion" -ForegroundColor Green
    } else {
        Write-Host "Python が見つかりません。Pythonをインストールしてください。" -ForegroundColor Red
        exit 1
    }

    # Install Pillow
    Write-Host "Pillow (PIL) をインストール中..." -ForegroundColor Yellow
    pip install Pillow

    if ($LASTEXITCODE -eq 0) {
        Write-Host "Pillow のインストールが完了しました。" -ForegroundColor Green
    } else {
        Write-Host "Pillow のインストールに失敗しました。" -ForegroundColor Red
        exit 1
    }

    Write-Host "セットアップが完了しました！" -ForegroundColor Green
    Write-Host "image_editor_launcher.bat をダブルクリックして画像エディタを起動してください。" -ForegroundColor Cyan

} catch {
    Write-Host "エラーが発生しました: $_" -ForegroundColor Red
    exit 1
}

Read-Host "続行するには Enter キーを押してください"
