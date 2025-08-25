$WshShell = New-Object -comObject WScript.Shell
$Desktop = $WshShell.SpecialFolders("Desktop")
$Shortcut = $WshShell.CreateShortcut("$Desktop\キャラクター画像エディタ.lnk")
$Shortcut.TargetPath = "$PSScriptRoot\image_editor_launcher.bat"
$Shortcut.WorkingDirectory = $PSScriptRoot
$Shortcut.Description = "キャラクター画像エディタ"
$Shortcut.Save()

Write-Host "デスクトップにショートカットを作成しました: キャラクター画像エディタ.lnk" -ForegroundColor Green
