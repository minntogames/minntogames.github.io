/**
 * `FixedHeader` Web Component
 * 
 * スクロールで表示されるヘッダーを設置します。
 * 
 * @example
 * <fixed-header></fixed-header>
 * 
 */

class FixedHeader extends HTMLElement {
    constructor() {
      super();
      // Shadow DOMを作成し、openモードにする
      const shadow = this.attachShadow({ mode: 'open' });
  
      // Shadow DOM内にHTML構造を追加
      shadow.innerHTML = `
        <style>
          .header {
            background-color: #66cdaa;
            color: #ffffff;
            text-align: center;
            padding: 40px 0;
            border-bottom-left-radius: 20px; /* 左下の角を丸くする */
            border-bottom-right-radius: 20px; /* 右下の角を丸くする */
          }
          .header-content {
            display: flex;
            flex-direction: column;
            align-items: center;
          }
          .logo img {
            width: 100px; /* ロゴのサイズを適宜調整 */
          }
          .header-text {
            margin-top: 20px;
            font-size: 30px; /* ヘッダーテキストのフォントサイズを調整 */
          }
          /* 固定ヘッダー */
          .fixed-header {
            position: fixed;
            top: -150px; /* 初期状態では非表示にする */
            left: 0;
            width: 100%;
            background-color: #66cdaa;
            color: #ffffff;
            padding: 20px 0;
            text-align: center;
            transition: top 0.3s; /* スクロール時のアニメーションを追加 */
            border-bottom-left-radius: 20px; /* 左下の角を丸くする */
            border-bottom-right-radius: 20px; /* 右下の角を丸くする */
          }
          nav ul {
            list-style-type: none;
            margin: 0;
            padding: 0;
            display: flex;
            justify-content: space-around; /* リンクを均等に配置 */
          }
          nav a {
            text-decoration: none;
            color: black;
            font-weight: bold;
            padding: 10px 20px; /* リンクのパディングを追加 */
          }
        </style>
        <div class="fixed-header" id="header">
          <nav>
            <ul>
                <li><a href="#">home</a></li>
                <li><a href="chara.html">chara</a></li>
                <li><a href="#">近日公開</a></li>
                <li><a href="menu.html">menu</a></li>
            </ul>
          </nav>
        </div>
      `;
    }
  
    connectedCallback() {
      const header = this.shadowRoot.querySelector(".fixed-header");
  
      // スクロールイベントのリスナーを追加
      document.addEventListener("scroll", function () {
        if (window.scrollY > 150) { // スクロール位置が150pxを超えたら表示
          header.style.top = "0";
        } else {
          header.style.top = "-150px"; // スクロール位置が150px未満の場合は非表示
        }
      });
    }
  }
  
  // カスタム要素を登録
  customElements.define('fixed-header', FixedHeader);
  