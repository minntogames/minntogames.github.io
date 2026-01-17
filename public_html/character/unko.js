const oldjson = [
    {
        "id": 1,
        "name": ["Xドクター", "W.D.ドクター", "W.D.RED.ドクター"],
        "name_en": ["X Doctor", "W.D.Doctor", "W.D.RED.Doctor"],
        "name_Kana": "くろすどくたー",
        "description": [
            "超天才の科学者で発明家。さまざまな発明品を作って遊んでいる。敵的に仲間を困らせている。<br>ただ本当に天才で高度なものを作るのでやめろとはいえない。<br>彼は群を抜いて戦闘センスが高く適応量力が高い。<br>そしてすごくタフで多分どんなに攻撃を受けても平然としている。四代目の代理。", 
            "自身の邪気が溜まりすぎて邪気に呑まれてしまった姿。この状態のは、常に挙動が不安定で、彼が言っていることは理解不能(言語的に)であり、近くにあるものを無差別に破壊し尽くす。体のどこからでも鎖が出てくる。そのうえ、出てくる鎖の数には際限がない",
            "自身の悪を強引に押し込め力に変えた姿。魔法の双剣で対象を切り裂く。ただし悪を封じ込めれるのは一定時間だけなので長時間この状態でいると自我が消え暴走する。"
        ],
        "world": "1",
        "race": ["棒人間"],
        "fightingStyle": [["Sword", "Magic"], ["Magic"], ["Sword", "Magic"]],
        "weapon": [
            {
                "name": ["浄冥の宝珠", "Magic Ball of Creation Destruction","じょうめいのほうじゅ"],
                "description": "創生と破壊の力を持ち、魔法の力を増大させる補助型魔法具。<br>お互いがお互いの力を中和しているが、万が一お互いが融合した場合、混ざり合った創生破壊の力が強大すぎるあまりカオスが発生する、<br>周辺の環境は歪み、すべてを無に還す。そこには一定期間「何もない」ができる。",
                "img": "weapons/1.webp"
            }
        ],
        "attribute": [["Electricity"], ["Darkness"], ["Darkness", "Fire"]],
        "height": 190,
        "age": "不明",
        "birthday": {
            "year": "-3 580300389",
            "month": 4,
            "day": 9
        },
        "personality": "意地悪",
        "group": ["Main Group"],
        "img": ["1-0.webp", "1-1.webp", "1-2.webp"],
        "imgsize": "300%",
        "imgThumbsize": ["150%", "200%"],
        "imageZoomPosition": "-190px -150px",
        "imageThumbPosition": ["0px 0px", "0px 0px"],
        "imgsize_mobile": "300%",
        "imageZoomPosition_mobile": "-120px -100px"
    },
]

const newjson = [
    {
        "NameJa": "Xドクター",
        "NameEn": "X Doctor",
        "nameKana": "くろすどくたー",
        "id": 1, // 一応残しとく
        "uniId": "yhB06Nd54q",
        "world": 1,
        "race": ["棒人間"],
        "group": ["Main Group"],
        "physicalInfo": {
            "height": 190,
            "age": "不明",
            "birthday": {
                "year": "-3 580300389",
                "month": 4,
                "day": 9
            }
        },
        "personality": "意地悪",
        "forms": [
            {
                "formId": 0,
                "formName": "", //通常形態は未記入
                "formNameEn": "",
                "description": "超天才の科学者で発明家。さまざまな発明品を作って遊んでいる。敵的に仲間を困らせている。<br>ただ本当に天才で高度なものを作るのでやめろとはいえない。<br>彼は群を抜いて戦闘センスが高く適応量力が高い。<br>そしてすごくタフで多分どんなに攻撃を受けても平然としている。四代目の代理。",
                "fightingStyle": ["Sword", "Magic"],
                "attributes": ["Electricity"],
                "weapons": [
                    {
                        "nameJa": "浄冥の宝珠",
                        "nameEn": "Magic Ball of Creation Destruction",
                        "nameKana": "じょうめいのほうじゅ",
                        "description": "創生と破壊の力を持ち、魔法の力を増大させる補助型魔法具。<br>お互いがお互いの力を中和しているが、万が一お互いが融合した場合、混ざり合った創生破壊の力が強大すぎるあまりカオスが発生する、<br>周辺の環境は歪み、すべてを無に還す。そこには一定期間「何もない」ができる。",
                        "img": "weapons/1.webp"
                    }
                ],
                "image": {
                    "src": "1-0.webp",
                    "size": "300%",
                    "sizeMobile": "300%",
                    "thumbSize": "150%",
                    "zoomPosition": { x: -190, y: -150 },
                    "zoomPositionMobile": { x: -120, y: -100 },
                    "thumbPosition": { x: 0, y: 0 }
                }
            },
        ]
    }
]