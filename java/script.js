document.addEventListener("scroll", function() {
    const header = document.querySelector(".fixed-header");
    if (window.scrollY > 150) { // スクロール位置が100pxを超えたら表示
        header.style.top = "0";
    } else {
        header.style.top = "-150px"; // スクロール位置が100px未満の場合は非表示
    }
});

//ハンバーガーメニュー
window.onload = function () {
    var nav = document.getElementById('nav-wrapper');
    var hamburger = document.getElementById('js-hamburger');
    var blackBg = document.getElementById('js-black-bg');
  
    hamburger.addEventListener('click', function () {
        nav.classList.toggle('open');
    });
    blackBg.addEventListener('click', function () {
        nav.classList.remove('open');
    });
  };