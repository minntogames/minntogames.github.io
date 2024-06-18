document.addEventListener("scroll", function() {
    const header = document.querySelector(".fixed-header");
    if (window.scrollY > 150) { // スクロール位置が100pxを超えたら表示
        header.style.top = "0";
    } else {
        header.style.top = "-150px"; // スクロール位置が100px未満の場合は非表示
    }
});

function resizeIframe() {
    const iframe = document.getElementById('youtube-iframe');
    const windowWidth = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;

    // サイズの下限を設定
    const maxWidth = 500; // 最大幅

    if (windowWidth > maxWidth) { // ウィンドウの幅が最大幅を超える場合は最大幅に設定
        iframe.style.width = 400 + 'px';
    } else {
        // ウィンドウの幅に合わせて iframe の幅を設定
        iframe.style.width = windowWidth - 100 + 'px';
    }

    // 高さを計算して設定
    const aspectRatio = 16 / 9;
    const iframeHeight = parseInt(iframe.style.width) / aspectRatio;
    iframe.style.height = iframeHeight + 'px';
}

document.getElementById('videoContainer').addEventListener('click', function() {
    const videoContainer = this;
    const videoID = 'SBCJj6tQDYU'; // YouTubeの動画IDをここに入力
    const iframe = document.createElement('iframe');
    iframe.setAttribute('width', '560');
    iframe.setAttribute('height', '315');
    iframe.setAttribute('src', `https://www.youtube.com/embed/${videoID}?autoplay=1`);
    iframe.setAttribute('frameborder', '0');
    iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture');
    iframe.setAttribute('allowfullscreen', 'true');

    // クリック後に埋め込みを表示するためにコンテナの内容をクリアしてiframeを追加
    videoContainer.innerHTML = '';
    videoContainer.appendChild(iframe);
});

// 初期ロード時とウィンドウリサイズ時に iframe を調整
window.addEventListener('load', resizeIframe);
window.addEventListener('resize', resizeIframe);