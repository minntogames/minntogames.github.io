document.addEventListener("scroll", function() {
    const header = document.querySelector(".fixed-header");
    if (window.scrollY > 100) { // スクロール位置が100pxを超えたら表示
        header.style.top = "0";
    } else {
        header.style.top = "-100px"; // スクロール位置が100px未満の場合は非表示
    }
});
