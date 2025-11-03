const { Client, fetchRandom } = require("nekos-best.js");

const nekosBest = new Client();

module.exports.getimg = async function(id) {
  const response = await fetchRandom("cirno")
  
  return response
}