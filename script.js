document.addEventListener("scroll", function() {
    const header = document.querySelector(".fixed-header");
    if (window.scrollY > 150) { // スクロール位置が150pxを超えたら表示
        header.style.top = "0";
    } else {
        header.style.top = "-150px"; // スクロール位置が150px未満の場合は非表示
    }
});

function resizeIframe() {
    const iframe = document.getElementById('youtube-iframe');
    const windowWidth = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;

    // サイズの上限と下限を設定
    const minWidth = 100; // 最小幅
    const maxWidth = 400; // 最大幅

    // ウィンドウの幅に合わせて iframe の幅を設定
    let newWidth = windowWidth;

    // サイズの下限をチェック
    if (newWidth < minWidth) {
        newWidth = minWidth;
    }

    // サイズの上限をチェック
    if (newWidth > maxWidth) {
        newWidth = maxWidth;
    }

    iframe.style.width = newWidth + 'px';

    // 高さを計算して設定
    const aspectRatio = 16 / 9;
    const iframeHeight = newWidth / aspectRatio;
    iframe.style.height = iframeHeight + 'px';
}

// 初期ロード時とウィンドウリサイズ時に iframe を調整
window.addEventListener('load', resizeIframe);
window.addEventListener('resize', resizeIframe);
