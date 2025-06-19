const SATRT_BTN_ID = "start-btn"
const MAIN_CANVAS_ID = "main-canvas"
const NEXT_CANVAS_ID = "next-canvas"
const GAME_SPEED = 500;
const BLOCK_SIZE = 32;
const COLS_COUNT = 10;
const ROWS_COUNT = 20;
const SCREEN_WIDTH = COLS_COUNT * BLOCK_SIZE;
const SCREEN_HEIGHT = ROWS_COUNT * BLOCK_SIZE;
const NEXT_AREA_SIZE = 160;
const BLOCK_SOURCES = [
        "images/block-0.png",
        "images/block-1.png",
        "images/block-2.png",
        "images/block-3.png",
        "images/block-4.png",
        "images/block-5.png",
        "images/block-6.png"
    ]

window.onload = function(){
  Asset.init()
  let game = new Game()
  document.getElementById(SATRT_BTN_ID).onclick = function(){
      game.start()
      this.blur() // ボタンのフォーカスを外す
  }
}

// 素材を管理するクラス
// ゲーム開始前に初期化する
class Asset{
    // ブロック用Imageの配列
    static blockImages = []

    // 初期化処理
    // callback には、init完了後に行う処理を渡す
    static init(callback){
        let loadCnt = 0
        for(let i = 0; i <= 6; i++){
            let img = new Image();
            img.src = BLOCK_SOURCES[i];
            img.onload = function(){
                loadCnt++
                Asset.blockImages.push(img)

                // 全ての画像読み込みが終われば、callback実行
                if(loadCnt >= BLOCK_SOURCES.length && callback){
                    callback()
                }
            }
        }
    }
}

class Game{
    constructor(){
        this.initMainCanvas()
        this.initNextCanvas()
    }

    // メインキャンバスの初期化
    initMainCanvas(){
        this.mainCanvas = document.getElementById(MAIN_CANVAS_ID);
        this.mainCtx = this.mainCanvas.getContext("2d");
        this.mainCanvas.width = SCREEN_WIDTH;
        this.mainCanvas.height = SCREEN_HEIGHT;
        this.mainCanvas.style.border = "4px solid #555";
    }

    // ネクストキャンバスの初期化
    initNextCanvas(){
        this.nextCanvas = document.getElementById(NEXT_CANVAS_ID);
        this.nextCtx = this.nextCanvas.getContext("2d");
        this.nextCanvas.width = NEXT_AREA_SIZE
        this.nextCanvas.height = NEXT_AREA_SIZE;
        this.nextCanvas.style.border = "4px solid #555";
    }

    // ゲームの開始処理（STARTボタンクリック時）
    start(){
        // フィールドとミノの初期化
        this.field = new Field()

        // 最初のミノを読み込み
        this.popMino()

        // 初回描画
        this.drawAll()

        // 落下処理
        clearInterval(this.timer)
        this.timer = setInterval(() => this.dropMino(), 1000);

        // キーボードイベントの登録
        this.setKeyEvent()
    }

    // 新しいミノを読み込む
    popMino(){
        this.mino = this.nextMino ?? new Mino()
        this.mino.spawn()
        this.nextMino = new Mino()

        // ゲームオーバー判定
        if(!this.valid(0, 1)){
            this.drawAll()
            clearInterval(this.timer)
            alert("ゲームオーバー")
        }
    }

    // 画面の描画
    drawAll(){
        // 表示クリア
        this.mainCtx.clearRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT)
        this.nextCtx.clearRect(0, 0, NEXT_AREA_SIZE, NEXT_AREA_SIZE)

        // 落下済みのミノを描画
        this.field.drawFixedBlocks(this.mainCtx)

        // 再描画
        this.nextMino.drawNext(this.nextCtx)
        this.mino.draw(this.mainCtx)
    }

    // ミノの落下処理
    dropMino(){
        if(this.valid(0, 1)) {
            this.mino.y++;
        }else{
            // Minoを固定する（座標変換してFieldに渡す）
            this.mino.blocks.forEach( e => {
                e.x += this.mino.x
                e.y += this.mino.y
            })
            this.field.blocks = this.field.blocks.concat(this.mino.blocks)
            this.field.checkLine()
            this.popMino()
        }
        this.drawAll();
    }
    
    // 次の移動が可能かチェック
    valid(moveX, moveY, rot=0){
        let newBlocks = this.mino.getNewBlocks(moveX, moveY, rot)
        return newBlocks.every(block => {
            return (
                block.x >= 0 &&
                block.y >= -1 &&
                block.x < COLS_COUNT &&
                block.y < ROWS_COUNT &&
                !this.field.has(block.x, block.y)
            )
        })
    }

    // キーボードイベント
    setKeyEvent(){
        document.onkeydown = function(e){
            switch(e.keyCode){
                case 37: // 左
                    if( this.valid(-1, 0)) this.mino.x--;
                    break;
                case 39: // 右
                    if( this.valid(1, 0)) this.mino.x++;
                    break;
                case 40: // 下
                    if( this.valid(0, 1) ) this.mino.y++;
                    break;
                case 32: // スペース
                    if( this.valid(0, 0, 1)) this.mino.rotate();
                    break;
            }
            this.drawAll()
        }.bind(this)
    }
}

class Block{
    // 基準地点からの座標
    // 移動中 ⇒ Minoの左上
    // 配置後 ⇒ Fieldの左上
    constructor(x, y, type){
        this.x = x
        this.y = y
        
        // 描画しないときはタイプを指定しない
        if(type >= 0) this.setType(type)
    }

    setType(type){
        this.type = type
        this.image = Asset.blockImages[type]
    }

    // Minoに属するときは、Minoの位置をオフセットに指定
    // Fieldに属するときは、(0,0)を起点とするので不要
    draw(offsetX = 0, offsetY = 0, ctx){
        let drawX = this.x + offsetX
        let drawY = this.y + offsetY

        // 画面外は描画しない
        if(drawX >= 0 && drawX < COLS_COUNT &&
           drawY >= 0 && drawY < ROWS_COUNT){
            ctx.drawImage(
                this.image, 
                drawX * BLOCK_SIZE, 
                drawY * BLOCK_SIZE,
                BLOCK_SIZE, 
                BLOCK_SIZE
            )
        }
    }

    // 次のミノを描画する
    // タイプごとに余白を調整して、中央に表示
    drawNext(ctx){
        let offsetX = 0
        let offsetY = 0
        switch(this.type){
            case 0:
                offsetX = 0.5
                offsetY = 0
                break;
            case 1:
                offsetX = 0.5
                offsetY = 0.5
                break;
            default:
                offsetX = 1
                offsetY = 0.5
                break;
        }

        ctx.drawImage(
            this.image, 
            (this.x + offsetX) * BLOCK_SIZE, 
            (this.y + offsetY) * BLOCK_SIZE,
            BLOCK_SIZE, 
            BLOCK_SIZE
        )
    }
}

class Mino{
    constructor(){
        this.type = Math.floor(Math.random() * 7);
        this.initBlocks()
    }

    initBlocks(){
        let t = this.type
        switch(t){
            case 0: // I型
                this.blocks = [new Block(0,2,t),new Block(1,2,t),new Block(2,2,t),new Block(3,2,t)]
                break;
            case 1: // O型
                this.blocks = [new Block(1,1,t),new Block(2,1,t),new Block(1,2,t),new Block(2,2,t)]
                break;
            case 2: // T型
                this.blocks = [new Block(1,1,t),new Block(0,2,t),new Block(1,2,t),new Block(2,2,t)]
                break;
            case 3: // J型
                this.blocks = [new Block(1,1,t),new Block(0,2,t),new Block(1,2,t),new Block(2,2,t)]
                break;
            case 4: // L型
                this.blocks = [new Block(2,1,t),new Block(0,2,t),new Block(1,2,t),new Block(2,2,t)]
                break;
            case 5: // S型
                this.blocks = [new Block(1,1,t),new Block(2,1,t),new Block(0,2,t),new Block(1,2,t)]
                break;
            case 6: // Z型
                this.blocks = [new Block(0,1,t),new Block(1,1,t),new Block(1,2,t),new Block(2,2,t)]
                break;
            }
    }

    // フィールドに生成する
    spawn(){
        this.x = COLS_COUNT/2 - 2
        this.y = -3
    }

    // フィールドに描画する
    draw(ctx){
        this.blocks.forEach(block => {
            block.draw(this.x, this.y, ctx)
        })
    }

    // 次のミノを描画する
    drawNext(ctx){
        this.blocks.forEach(block => {
            block.drawNext(ctx)
        })
    }
    
    // 回転させる
    rotate(){
        this.blocks.forEach(block=>{
            let oldX = block.x
            block.x = block.y
            block.y = 3-oldX
        })
    }

    // 次に移動しようとしている位置の情報を持ったミノを生成
    // 描画はせず、移動が可能かどうかの判定に使用する
    getNewBlocks(moveX, moveY, rot){
        let newBlocks = this.blocks.map(block=>{
            return new Block(block.x, block.y)
        })
        newBlocks.forEach(block => {
            // 移動させる場合
            if(moveX || moveY){
                block.x += moveX
                block.y += moveY
            }

            // 回転させる場合
            if(rot){
                let oldX = block.x
                block.x = block.y
                block.y = 3-oldX
            }

            // グローバル座標に変換
            block.x += this.x
            block.y += this.y
        })
        
        return newBlocks
    }
}

class Field{
    constructor(){
        this.blocks = []
    }

    drawFixedBlocks(ctx){
        this.blocks.forEach(block => block.draw(0, 0, ctx))
    }

    checkLine(){
      for(var r = 0; r < ROWS_COUNT; r++){
        var c = this.blocks.filter(block => block.y === r).length
        if(c === COLS_COUNT){
          this.blocks = this.blocks.filter(block => block.y !== r)
          this.blocks.filter(block => block.y < r).forEach(upper => upper.y++)
        }
      }
    }

    has(x, y){
        return this.blocks.some(block => block.x == x && block.y == y)
    }
}