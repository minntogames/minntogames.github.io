document.addEventListener("scroll", function() {
    const header = document.querySelector(".fixed-header");
    if (window.scrollY > 150) { // スクロール位置が150pxを超えたら表示
        header.style.top = "0";
    } else {
        header.style.top = "-150px"; // スクロール位置が150px未満の場合は非表示
    }
});
