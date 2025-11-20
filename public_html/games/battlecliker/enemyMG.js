class EnemyManager {
    constructor() {
        this._enemies = [];
        this._catchEnemy = null;
    }

    get enemies() { return this._enemies; }
    set enemies(i) {
        if (!Array.isArray(i)) {
            throw new Error('Enemies must be an array');
        }
        this._enemies = i;
    }

    get catchEnemy() { return this._catchEnemy; }
    set catchEnemy(value) { this._catchEnemy = value; }

    async init() {
        try {
            const response = await fetch('src/data/enemyData.json');
            if (!response.ok) {
                throw new Error('ネットワーク応答に問題があります');
            }
            this._enemies = await response.json();
            
            this.checkErrorData(this._enemies);
            console.log('Enemy catched');
        } catch (e) {
            console.error('initに問題が発生：', e);
        }
    }

    checkErrorData(data) {
        let iserror = false;
        for (const i in data) {
            if (iserror) break;

            if (typeof data[i][0] !== 'string' || data[i][0].length === 0) {
                new Error(`ID${i}のに問題があります`);
                iserror = true;
            }

            if (typeof data[i][1] !== 'number' || data[i][1] <= 0) {
                new Error(`ID${i}のHPに問題があります`);
                iserror = true;
            }

            if (typeof data[i][2] !== 'number' || data[i][2] <= 0) {
                new Error(`ID${i}のCoinに問題があります`);
                iserror = true;
            }

            if (typeof data[i][3] !== 'string' || data[i][3].length === 0) {
                new Error(`ID${i}の画像名に問題があります`);
                iserror = true;
            }
        }
        return iserror;
    }

    getEnemy(id) {
        if (!this._enemies || this._enemies[id] === undefined) {
            console.warn(`Enemy not found: id=${id}`);
            return null;
        }   

        const data = this.createEnemyData(this._enemies[id]);
        this.catchdata = data
        return this.catchdata
    }

    createEnemyData(data){
        return {
            name: data[0],
            hp: data[1],
            coin: data[2],
            img: `src/img/enemy/${data[3]}.png` || `img/enemy/slime.png`
        }
    }
}

window.enemyManager = EnemyManager;