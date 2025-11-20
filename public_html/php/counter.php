<?php
require_once __DIR__ . '/db_config.php';

session_start();

$pageName = 'index'; // ページごとに変更可能
$count = 0;

try {
    $pdo = getDbConnection();
    
    if ($pdo) {
        // セッションで重複カウント防止
        if (!isset($_SESSION['counted'])) {
            // カウントを増やす
            $stmt = $pdo->prepare("
                INSERT INTO page_counters (page_name, visit_count) 
                VALUES (:page_name, 1)
                ON DUPLICATE KEY UPDATE visit_count = visit_count + 1
            ");
            $stmt->execute(['page_name' => $pageName]);
            $stmt = null; // ステートメントを明示的に解放
            $_SESSION['counted'] = true;
        }
        
        // 現在のカウントを取得
        $stmt = $pdo->prepare("SELECT visit_count FROM page_counters WHERE page_name = :page_name");
        $stmt->execute(['page_name' => $pageName]);
        $result = $stmt->fetch();
        $stmt = null; // ステートメントを明示的に解放
        
        if ($result) {
            $count = (int)$result['visit_count'];
        }
    }
} catch (PDOException $e) {
    error_log("Counter error: " . $e->getMessage());
    // エラー時はデフォルト値を表示
    $count = 0;
}

// 9桁表示
$digits = str_split(str_pad($count, 9, '0', STR_PAD_LEFT));

foreach ($digits as $index => $digit) {
    echo '<span class="counter-digit-wrapper" data-index="' . $index . '">';
    echo '<img src="./images/counter/' . $digit . '.png" alt="' . $digit . '" class="counter-digit" width="20" height="30">';
    echo '</span>';
}
?>