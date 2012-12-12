var initConfig = require("./initial-config");

var listToObject = function(lst) {
  var o = {};
  lst.forEach(function(v,i,l) {
    o[v] = true;
  });
  return o;
};

getLandingPages = function() {
  return listToObject(initConfig.landingPages);
};

getServers = function() {
  return initConfig.servers;
}

exports.getLandingPages = getLandingPages;
exports.getServers = getServers;

