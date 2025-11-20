<?php
require_once __DIR__ . '/db_config.php';

echo "<h2>データベース接続診断</h2>";

// 設定ファイルのパスを確認
$configPath = dirname(__DIR__, 2) . '/config/secretkey.php';
echo "<h3>1. 設定ファイルの確認</h3>";
echo "<p>設定ファイルパス: <code>" . htmlspecialchars($configPath) . "</code></p>";

if (file_exists($configPath)) {
    echo "<p style='color:green;'>✅ 設定ファイルが見つかりました</p>";
    
    $config = require $configPath;
    echo "<h3>2. 設定内容 (パスワードは非表示)</h3>";
    echo "<ul>";
    echo "<li>DB_HOST: " . htmlspecialchars($config['DB_HOST'] ?? '未設定') . "</li>";
    echo "<li>DB_NAME: " . htmlspecialchars($config['DB_NAME'] ?? '未設定') . "</li>";
    echo "<li>DB_USER: " . htmlspecialchars($config['DB_USER'] ?? '未設定') . "</li>";
    echo "<li>DB_PASS: " . (isset($config['DB_PASS']) && !empty($config['DB_PASS']) ? '設定済み (****)' : '未設定') . "</li>";
    echo "<li>DB_CHARSET: " . htmlspecialchars($config['DB_CHARSET'] ?? '未設定') . "</li>";
    echo "</ul>";
} else {
    echo "<p style='color:red;'>❌ 設定ファイルが見つかりません</p>";
    echo "<p>以下のパスに secretkey.php を作成してください:</p>";
    echo "<pre>" . htmlspecialchars($configPath) . "</pre>";
    echo "<h3>作成例:</h3>";
    echo "<pre>&lt;?php\nreturn [\n    'DB_HOST' => 'localhost',\n    'DB_NAME' => 'minntelia_db',\n    'DB_USER' => 'your_username',\n    'DB_PASS' => 'your_password',\n    'DB_CHARSET' => 'utf8mb4'\n];\n?&gt;</pre>";
    exit;
}

// データベース接続テスト
echo "<h3>3. データベース接続テスト</h3>";

try {
    $dsn = "mysql:host=" . ($config['DB_HOST'] ?? 'localhost') . ";charset=" . ($config['DB_CHARSET'] ?? 'utf8mb4');
    $pdo = new PDO($dsn, $config['DB_USER'] ?? '', $config['DB_PASS'] ?? '', [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
    ]);
    
    echo "<p style='color:green;'>✅ MySQLサーバーへの接続成功</p>";
    
    // データベースの存在確認
    $stmt = $pdo->query("SHOW DATABASES LIKE '" . ($config['DB_NAME'] ?? 'minntelia_db') . "'");
    $dbExists = $stmt->fetch();
    
    if ($dbExists) {
        echo "<p style='color:green;'>✅ データベース '" . htmlspecialchars($config['DB_NAME']) . "' が存在します</p>";
        
        // データベースに接続
        $pdo->exec("USE " . $config['DB_NAME']);
        
        // テーブルの確認
        $stmt = $pdo->query("SHOW TABLES LIKE 'page_counters'");
        $tableExists = $stmt->fetch();
        
        if ($tableExists) {
            echo "<p style='color:green;'>✅ テーブル 'page_counters' が存在します</p>";
            echo "<p><strong>すべて正常です！</strong></p>";
        } else {
            echo "<p style='color:orange;'>⚠️ テーブル 'page_counters' が存在しません</p>";
            echo "<p><a href='setup_database.php'>setup_database.php</a> を実行してテーブルを作成してください</p>";
        }
    } else {
        echo "<p style='color:red;'>❌ データベース '" . htmlspecialchars($config['DB_NAME']) . "' が存在しません</p>";
        echo "<p>以下のSQLを実行してデータベースを作成してください:</p>";
        echo "<pre>CREATE DATABASE " . htmlspecialchars($config['DB_NAME']) . " CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;</pre>";
    }
    
} catch (PDOException $e) {
    echo "<p style='color:red;'>❌ データベース接続エラー</p>";
    echo "<pre>" . htmlspecialchars($e->getMessage()) . "</pre>";
    
    echo "<h3>よくあるエラーと対処法:</h3>";
    echo "<ul>";
    echo "<li><strong>Access denied</strong> → ユーザー名またはパスワードが間違っています</li>";
    echo "<li><strong>Unknown database</strong> → データベースが作成されていません</li>";
    echo "<li><strong>Can't connect</strong> → MySQLサーバーが起動していないか、ホスト名が間違っています</li>";
    echo "</ul>";
}

echo "<hr>";
echo "<h3>4. PHPの情報</h3>";
echo "<ul>";
echo "<li>PHPバージョン: " . phpversion() . "</li>";
echo "<li>PDO MySQL拡張: " . (extension_loaded('pdo_mysql') ? '✅ 有効' : '❌ 無効') . "</li>";
echo "</ul>";
?>
