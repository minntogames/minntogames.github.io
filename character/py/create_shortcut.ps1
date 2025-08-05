# デスクトップショートカット作成スクリプト
$desktopPath = [Environment]::GetFolderPath("Desktop")
$shortcutPath = Join-Path $desktopPath "キャラエディタ.lnk"
$targetPath = "c:\main\minntogithub\minntogames.github.io\character\py\cha_editor_launcher.bat"
$workingDirectory = "c:\main\minntogithub\minntogames.github.io\character\py"

# WScript.Shellオブジェクトを作成
$WshShell = New-Object -comObject WScript.Shell

# ショートカットオブジェクトを作成
$Shortcut = $WshShell.CreateShortcut($shortcutPath)
$Shortcut.TargetPath = $targetPath
$Shortcut.WorkingDirectory = $workingDirectory
$Shortcut.Description = "キャラクターJSONエディタ"
$Shortcut.WindowStyle = 1  # 通常ウィンドウ

# アイコンを設定（オプション）
# $Shortcut.IconLocation = "c:\path\to\icon.ico"

# ショートカットを保存
$Shortcut.Save()

Write-Host "デスクトップにショートカットを作成しました: $shortcutPath"
