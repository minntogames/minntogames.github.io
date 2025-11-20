<?php
/**
 * データベース最適化スクリプト
 * page_nameカラムにインデックスを追加してクエリを高速化
 */

require_once __DIR__ . '/db_config.php';

echo "=== データベース最適化 ===\n\n";

try {
    $pdo = getDbConnection();
    
    if (!$pdo) {
        die("データベース接続に失敗しました。\n");
    }
    
    echo "データベースに接続しました。\n\n";
    
    // 既存のインデックスを確認
    echo "既存のインデックスを確認中...\n";
    $stmt = $pdo->query("SHOW INDEX FROM page_counters");
    $indexes = $stmt->fetchAll();
    
    $hasPageNameIndex = false;
    foreach ($indexes as $index) {
        echo "- {$index['Key_name']} on {$index['Column_name']}\n";
        if ($index['Column_name'] === 'page_name' && $index['Key_name'] !== 'PRIMARY') {
            $hasPageNameIndex = true;
        }
    }
    
    echo "\n";
    
    // page_nameにインデックスがない場合は追加
    if (!$hasPageNameIndex) {
        echo "page_nameカラムにインデックスを追加中...\n";
        $pdo->exec("ALTER TABLE page_counters ADD INDEX idx_page_name (page_name)");
        echo "✓ インデックスを追加しました。\n\n";
    } else {
        echo "✓ page_nameのインデックスは既に存在します。\n\n";
    }
    
    // テーブルを最適化
    echo "テーブルを最適化中...\n";
    $pdo->exec("OPTIMIZE TABLE page_counters");
    echo "✓ テーブルの最適化が完了しました。\n\n";
    
    // クエリのパフォーマンステスト
    echo "パフォーマンステスト中...\n";
    $start = microtime(true);
    
    for ($i = 0; $i < 100; $i++) {
        $stmt = $pdo->prepare("SELECT visit_count FROM page_counters WHERE page_name = ? LIMIT 1");
        $stmt->execute(['index']);
        $stmt->fetch();
    }
    
    $end = microtime(true);
    $elapsed = ($end - $start) * 1000; // ミリ秒
    $avg = $elapsed / 100;
    
    echo "100回のクエリ実行時間: " . number_format($elapsed, 2) . " ms\n";
    echo "平均クエリ時間: " . number_format($avg, 2) . " ms\n\n";
    
    echo "=== 最適化完了 ===\n";
    
} catch (PDOException $e) {
    echo "エラー: " . $e->getMessage() . "\n";
    exit(1);
}
