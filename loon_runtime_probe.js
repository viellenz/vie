// Vie Loon runtime probe.
// Run manually from Loon script tasks. It only reads policy state and runs small IP checks.
(function () {
  var groups = [
    "节点选择",
    "Telegram",
    "Google",
    "Gemini",
    "AI",
    "TikTok",
    "Social",
    "YouTube",
    "Spotify",
    "Microsoft",
    "Apple",
    "US",
    "HK",
    "JP",
    "TW",
    "SG",
    "KR",
    "其余节点"
  ];

  var subGroups = ["节点选择", "US", "HK", "JP", "TW", "SG", "KR", "其余节点"];
  var testGroups = ["节点选择", "US", "HK", "JP", "TW", "SG", "KR"];
  var lines = [];
  var finished = false;
  var pending = subGroups.length + testGroups.length;

  function parseConfig() {
    try {
      return JSON.parse($config.getConfig());
    } catch (e) {
      return { parse_error: String(e), raw: String($config.getConfig()) };
    }
  }

  function logConfig(cfg) {
    lines.push("=== Vie Loon Runtime Probe ===");
    lines.push("time: " + new Date().toISOString());
    try {
      lines.push("loon: " + JSON.stringify($loon));
    } catch (e) {
      lines.push("loon: unavailable");
    }
    lines.push(
      "running_model=" + cfg.running_model +
      " final=" + cfg.final +
      " global_proxy=" + cfg.global_proxy +
      " ssid=" + cfg.ssid
    );
    lines.push("");
    lines.push("--- selected policy ---");
    for (var i = 0; i < groups.length; i++) {
      var name = groups[i];
      var selected = "";
      try {
        selected = $config.getSelectedPolicy(name);
      } catch (e1) {
        selected = "ERR: " + String(e1);
      }
      var stored = cfg.policy_select && cfg.policy_select[name] ? cfg.policy_select[name] : "";
      lines.push(name + " => selected=" + selected + " / stored=" + stored);
    }
    lines.push("");
  }

  function doneOne() {
    pending -= 1;
    if (pending <= 0) finish();
  }

  function finish() {
    if (finished) return;
    finished = true;
    var output = lines.join("\n");
    console.log(output);
    try {
      $notification.post("Vie 策略诊断完成", "请打开脚本日志复制结果", "重点看 selected policy 和 ip check");
    } catch (e) {}
    $done();
  }

  function inspectChildren(name) {
    try {
      $config.getSubPolicies(name, function (children) {
        lines.push(name + " children => " + JSON.stringify(children));
        doneOne();
      });
    } catch (e) {
      lines.push(name + " children => ERR: " + String(e));
      doneOne();
    }
  }

  function ipCheck(name) {
    var params = {
      url: "http://ip-api.com/json/?fields=status,country,regionName,city,query,isp",
      timeout: 8000,
      node: name
    };
    $httpClient.get(params, function (err, response, data) {
      if (err) {
        lines.push(name + " ip => ERR: " + String(err));
      } else {
        var status = response && response.status ? response.status : "";
        lines.push(name + " ip => HTTP " + status + " " + String(data));
      }
      doneOne();
    });
  }

  var cfg = parseConfig();
  logConfig(cfg);
  lines.push("--- children ---");
  for (var a = 0; a < subGroups.length; a++) inspectChildren(subGroups[a]);
  lines.push("");
  lines.push("--- ip check by policy group ---");
  for (var b = 0; b < testGroups.length; b++) ipCheck(testGroups[b]);

  setTimeout(finish, 25000);
})();
