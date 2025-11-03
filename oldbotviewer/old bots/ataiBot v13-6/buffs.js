const buff = require('./buff.json')
const datas = require("./mongoget.js");

module.exports.buff = async function(id, data, userid) {
  let result
  const Cirno = await datas.get("user", userid)
  switch(id){
    case 1: //かえる
      let num = getRandomResult();

      data *= num
      result = Math.floor(data)
      
      break;
    case 2: //至高のパフェ
      
      data *= 2
      result = Math.floor(data)
      
      break;
    case 3: //さいきょー玉
      
      Cirno.data.chara.lv.giveXp.max++
      
      result = "獲得経験値の上限が上がった！"
      
      break;
    case 4:　//天祭玉
      
      Cirno.data.chara.lv.giveXp.min++
      
      result = "獲得経験値の下限が上がった！"
      
      break;
    case 5:　//レアドロップ率
      
      data += 0.2
      result = data
      
      break;
    case 6:　//宇宙旅行キット
      if(Cirno.data.map.gotomoon == true){
        result = "しかし何も起こらなかった！"
      } else {
        Cirno.data.map.gotomoon = true
        result = "探索で月に行けるようになった！"
      }
      break;
    default:
      result === null
      break;
  }
  
  
  datas.save(Cirno, userid);
  return result
}

function getRandomResult() {
  // 0から1の範囲でランダムな数を生成
  var randomNumber = Math.random();

  // 乱数に基づいて、ランダムな結果を返す
  if (randomNumber < 0.5) {
    return 1.5
  } else {
    return 0.5
  }
}