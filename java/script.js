document.addEventListener("scroll", function() {
    const header = document.querySelector(".fixed-header");
    if (window.scrollY > 150) { // スクロール位置が100pxを超えたら表示
        header.style.top = "0";
    } else {
        header.style.top = "-150px"; // スクロール位置が100px未満の場合は非表示
    }
});

// 初期ロード時とウィンドウリサイズ時に iframe を調整
window.addEventListener('load', resizeIframe);
window.addEventListener('resize', resizeIframe);