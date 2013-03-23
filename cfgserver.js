var cfg = { host: "phato.iriscouch.com"
          , port: "80"
          , ssl:  false
          , user: "phatograph"
          , pass: "password"
          };

cfg.credentials = function credentials() {
  if (cfg.user && cfg.pass) {
    return cfg.user + ":" + cfg.pass + "@";
  }
  else { return ""; }
}();

cfg.url = function () {
  return "http" + (cfg.ssl ? "s" : "") + "://" + cfg.credentials + cfg.host +
    ":" + cfg.port;
}();

module.exports = exports = cfg;