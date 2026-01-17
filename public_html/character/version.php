<?php
header('Content-Type: application/json');
header('Cache-Control: no-cache, no-store, must-revalidate');
header('Pragma: no-cache');
header('Expires: 0');

// バージョン情報
$version = [
    'version' => '1.0.1', // 更新のたびにこのバージョン番号を変更してください
    'updated' => filemtime(__DIR__ . '/main.js'), // main.jsの最終更新時刻
    'timestamp' => time()
];

echo json_encode($version);
