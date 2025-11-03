const datas = require("./mongoget.js");

class func{
  constructor(){}
  
  sort(array, order) {
    /**
    * 二次元配列または連想配列の並び替え
    * @param {*[]} array 並び替える配列
    * @param {'ASC'|'DESC'} [order] 並び替える方法
    * @param {...*} args 並び替えの基準となるキー
    * @return {*[]} 並び替えられた配列
    */
    if (!order || !order.match(/^(ASC|DESC)$/i)) order = "ASC";
    order = order.toUpperCase();

    var keys = [];
    for (var i = 2, len = arguments.length; i < len; i++) keys.push(arguments[i]);

    var targets = [].concat(array);

    targets.sort(function (a, b) {
      for (var i = 0, len = keys.length; i < len; i++) {
        if (typeof keys[i] === "string") {
          if (order === "ASC") {
            if (a[keys[i]] < b[keys[i]]) return -1;
            if (a[keys[i]] > b[keys[i]]) return 1;
          } else {
            if (a[keys[i]] > b[keys[i]]) return -1;
            if (a[keys[i]] < b[keys[i]]) return 1;
          }
        } else {
          var localOrder = keys[i].order || "ASC";
          if (!localOrder.match(/^(ASC|DESC)$/i)) order = "ASC";
          order = order.toUpperCase();

          if (localOrder === "ASC") {
            if (a[keys[i].key] < b[keys[i].key]) return -1;
            if (a[keys[i].key] > b[keys[i].key]) return 1;
          } else {
            if (a[keys[i].key] > b[keys[i].key]) return -1;
            if (a[keys[i].key] < b[keys[i].key]) return 1;
          }
        }
      }

      return 0;
    });

    return targets;
  }
}