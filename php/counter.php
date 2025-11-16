<?php
// counter_image.php
$counterFile = './php/counter.txt';

if (!file_exists($counterFile)) {
    file_put_contents($counterFile, '0');
}

// セッションで重複カウント防止
session_start();
if (!isset($_SESSION['counted'])) {
    $count = (int)file_get_contents($counterFile);
    $count++;
    file_put_contents($counterFile, $count);
    $_SESSION['counted'] = true;
}

$count = (int)file_get_contents($counterFile);
$digits = str_split(str_pad($count, 9, '0', STR_PAD_LEFT)); // 6桁表示

foreach ($digits as $digit) {
    echo '<img src="./images/counter/' . $digit . '.png" alt="' . $digit . '" class="counter-digit" width="20" height="30">';
}
?>