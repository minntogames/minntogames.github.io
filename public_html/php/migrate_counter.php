<?php
require_once __DIR__ . '/db_config.php';

// counter.txtから既存のカウントを読み込む
$counterFile = __DIR__ . '/counter.txt';
$currentCount = 0;

if (file_exists($counterFile)) {
    $currentCount = (int)file_get_contents($counterFile);
    echo "counter.txtから読み込んだ値: $currentCount\n";
} else {
    echo "counter.txtが見つかりません。\n";
    exit;
}

try {
    $pdo = getDbConnection();
    
    if ($pdo) {
        // データベースに移行
        $stmt = $pdo->prepare("
            INSERT INTO page_counters (page_name, visit_count) 
            VALUES ('index', :count)
            ON DUPLICATE KEY UPDATE visit_count = :count
        ");
        $stmt->execute(['count' => $currentCount]);
        
        echo "データベースへの移行が完了しました！\n";
        echo "移行した値: $currentCount\n";
        
        // バックアップを作成
        $backupFile = __DIR__ . '/counter.txt.backup';
        copy($counterFile, $backupFile);
        echo "counter.txtのバックアップを作成しました: $backupFile\n";
    } else {
        echo "データベース接続に失敗しました。\n";
    }
} catch (PDOException $e) {
    echo "エラー: " . $e->getMessage() . "\n";
}
?>
