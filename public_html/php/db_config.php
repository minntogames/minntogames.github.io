<?php
// 設定ファイルを読み込み (public_htmlと同階層のconfig/secretkey.php)
$configPath = dirname(__DIR__, 2) . '/config/secretkey.php';

if (!file_exists($configPath)) {
    error_log("Config file not found: " . $configPath);
    die("Database configuration file not found.");
}

$config = require $configPath;

// データベース接続設定
define('DB_HOST', $config['DB_HOST'] ?? 'localhost');
define('DB_NAME', $config['DB_NAME'] ?? 'minntelia_db');
define('DB_USER', $config['DB_USER'] ?? '');
define('DB_PASS', $config['DB_PASS'] ?? '');
define('DB_CHARSET', $config['DB_CHARSET'] ?? 'utf8mb4');

// データベース接続を取得する関数
function getDbConnection() {
    try {
        // 文字セットをDSNから除外
        $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME;
        $options = [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
            PDO::MYSQL_ATTR_USE_BUFFERED_QUERY => true,
        ];
        
        $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
        
        // 接続後に文字セットを設定
        $pdo->exec("SET NAMES " . DB_CHARSET);
        
        return $pdo;
    } catch (PDOException $e) {
        error_log("Database connection failed: " . $e->getMessage());
        return null;
    }
}
?>
