const uri = "あ";
const Keyv = require("keyv");

const chadata = require("./chara.json")

// グローバルにKeyvインスタンスを作成
const userKeyv = new Keyv(uri, { collection: "USER2" });
const dayDataKeyv = new Keyv(uri, { collection: "daydata" });
const daysKeyv = new Keyv(uri, { collection: "days" });
const bagKeyv = new Keyv(uri, { collection: "BAG" });
const coolKeyv = new Keyv(uri, { collection: "cooldowns" })
const roles = new Keyv(uri, { collection: "giveroles" })
const security = new Keyv(uri, { collection: "security" });

const json = {
    Out_words: [],
    warn_words: []
}

module.exports.get = async function(con, id) {
  try {
    if (!id) return { type: "err", data: "idを指定してください！" };
    let data;

    switch (con) {
      case "user":
        data = await userKeyv.get(id) || chadata
        break;
      case "daydata":
        data = await dayDataKeyv.get(id);
        break;
      case "day":
        data = await daysKeyv.get(id) || { ping_day: 0, shst_day: 0, login_day: 0, task: [] };
        break;
      case "bag":
        data = await bagKeyv.get(id) || { items: [] };
        break;
      case "cool":
        data = await coolKeyv.get(id) || { downtime: false };
        break;
      case "role":
        data = await roles.get(id) || { reactions: [] };
        break;
    　case "security":
        data = await security.get(id) || json
        break;
      default:
        throw new Error("err: optionを指定してください！");
    }

    return { type: con, data };
  } catch (error) {
    return { type: "err", data: error.message };
  }
};

module.exports.save = async function(data, id) {
  try {
    if (!id) return { type: "err", data: "idを指定してください！" };
    switch (data.type) {
      case "user":
        await userKeyv.set(id, data.data);
        break;
      case "daydata":
        await dayDataKeyv.set(id, data.data);
        break;
      case "day":
        await daysKeyv.set(id, data.data);
        break;
      case "bag":
        await bagKeyv.set(id, data.data);
        break;
      case "cool":
        await coolKeyv.set(id, data.data, 15000)
        break;
      case "role":
        await roles.set(id, data.data);
        break;
      case "security":
        await security.set(id, data.data);
        break;
      default:
        throw new Error("err: dataを指定してください！");
    }
  } catch (error) {
    return console.log(error.message)
  }
}