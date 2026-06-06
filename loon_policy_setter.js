// Vie Loon policy setter.
// Usage in [Script]: argument="policy=节点选择&select=JP"
(function () {
  function parseArg(input) {
    var out = {};
    String(input || "").split("&").forEach(function (part) {
      var idx = part.indexOf("=");
      if (idx < 0) return;
      var key = decodeURIComponent(part.slice(0, idx).trim());
      var val = decodeURIComponent(part.slice(idx + 1).trim());
      out[key] = val;
    });
    return out;
  }

  var args = parseArg(typeof $argument === "undefined" ? "" : $argument);
  var policy = args.policy || "节点选择";
  var select = args.select || "";
  var lines = [];

  lines.push("=== Vie Policy Setter ===");
  lines.push("policy=" + policy);
  lines.push("select=" + select);

  if (!select) {
    lines.push("missing select argument");
    console.log(lines.join("\n"));
    $done();
    return;
  }

  var ok = false;
  try {
    ok = $config.getConfig(policy, select);
  } catch (e) {
    lines.push("set error: " + String(e));
  }

  lines.push("set result=" + ok);
  try {
    lines.push("selected now=" + $config.getSelectedPolicy(policy));
    var cfg = JSON.parse($config.getConfig());
    lines.push("stored now=" + (cfg.policy_select && cfg.policy_select[policy] ? cfg.policy_select[policy] : ""));
  } catch (e2) {
    lines.push("verify error: " + String(e2));
  }

  var output = lines.join("\n");
  console.log(output);
  try {
    $notification.post("Vie 策略切换", policy + " -> " + select, ok ? "已请求切换，请重新测试出口 IP" : "切换失败，请查看日志");
  } catch (e3) {}
  $done();
})();
