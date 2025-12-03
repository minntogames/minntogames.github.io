<?php
// --------------------------------------------------
// 設定
// --------------------------------------------------
$rareRate = 0.1; // レアが出る確率（％）例: 0.5 = 0.5%, 0.1 = 0.1%

// ★ここを変更：レアもリスト（配列）にします
$rareFiles = [
    __DIR__ . '/../../random_r/6666jaksdjakshdahdhsakjhdhadbcmnzc.php',
    __DIR__ . '/../../random_r/falied.php'
];

$normalFiles = [
    __DIR__ . '/../../random/1999s.php',
    __DIR__ . '/../../random/ToDeepsnow.php',
    __DIR__ . '/../../random/pixelactions.php',
    __DIR__ . '/../../random/galaxy.php',
    __DIR__ . '/../../random/black.php',
    __DIR__ . '/../../random/cyber.php',
    __DIR__ . '/../../random/relax.php'
];

// --------------------------------------------------
// 1. 運命のダイス (1〜10000) より精密な確率判定
// --------------------------------------------------
$dice = mt_rand(1, 10000);

// --------------------------------------------------
// 2. 判定ロジック
// --------------------------------------------------
if ($dice <= $rareRate * 100) { // %を10000分率に変換
    // 【レア当選！】(1%)
    // ★ここでレアリストの中からランダムに1つ選ぶ
    $key = array_rand($rareFiles);
    $targetFile = $rareFiles[$key];
    
} else {
    // 【通常】(95%)
    // 通常リストの中からランダムに1つ選ぶ
    $key = array_rand($normalFiles);
    $targetFile = $normalFiles[$key];
}

// --------------------------------------------------
// 3. 表示
// --------------------------------------------------

?>

<head>
    <meta property="og:title" content="繝溘メ繝弱そ繧ｫ繧､">
    <meta property="og:description" content="ここより先は時空が歪んでおりどこへ飛ぶかわかりません。あなたの目でその先の世界を確認してみてください...">
    <meta property="og:image" content="https://youtube.minntelia.com/image/ass.webp">
</head>
<?php 
    require_once($targetFile); 
?>