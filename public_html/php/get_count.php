<?php
require_once __DIR__ . '/db_config.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-cache, must-revalidate, max-age=0');

$pageName = 'index';
$count = 0;

try {
    $pdo = getDbConnection();
    
    if ($pdo) {
        // インデックスを活用したシンプルなクエリ
        $stmt = $pdo->prepare("SELECT visit_count FROM page_counters WHERE page_name = ? LIMIT 1");
        $stmt->execute([$pageName]);
        $result = $stmt->fetch(PDO::FETCH_NUM);
        
        if ($result) {
            $count = (int)$result[0];
        }
    }
} catch (Exception $e) {
    // エラー時は0を返す
    $count = 0;
}

echo json_encode(['count' => $count], JSON_UNESCAPED_UNICODE);
?>
