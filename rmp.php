<?php
$urls = [
    "1999s",
    "ToDeepsnow",
    "pixelactions",
];

global $urls;
$randomIndex = array_rand($urls);
$selectedUrl = $urls[$randomIndex];
$fullUrl = "./randoms/{$selectedUrl}.html";

$response = ["url" => $fullUrl];
echo json_encode($response);
?>