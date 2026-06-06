// Vie Loon full policy/node audit.
// Runs inside Loon. It tests current policy groups and every concrete node visible under 节点选择.
(function () {
  var VERSION = "2026-06-06-full-audit-v1";
  var TEST_URL = "https://www.cloudflare.com/cdn-cgi/trace";
  var TIMEOUT_MS = 9000;
  var CONCURRENCY = 4;
  var MAX_NODES = 220;

  var policyGroups = [
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

  var regionGroups = ["US", "HK", "JP", "TW", "SG", "KR", "其余节点"];
  var lines = [];
  var startedAt = Date.now();
  var finished = false;

  function safeJson(text, fallback) {
    try {
      return JSON.parse(text);
    } catch (e) {
      return fallback;
    }
  }

  function parseConfig() {
    return safeJson($config.getConfig(), {});
  }

  function normalizeChildren(value) {
    var parsed = value;
    for (var i = 0; i < 3; i++) {
      if (typeof parsed === "string") {
        parsed = safeJson(parsed, parsed);
      }
    }
    if (!Array.isArray(parsed)) return [];
    return parsed.map(function (item) {
      if (typeof item === "string") return { type: "node", name: item };
      return item || {};
    }).filter(function (item) {
      return item.name;
    });
  }

  function getChildren(name, callback) {
    try {
      $config.getSubPolicies(name, function (children) {
        callback(null, normalizeChildren(children));
      });
    } catch (e) {
      callback(String(e), []);
    }
  }

  function expectedCountry(name) {
    var n = String(name);
    if (/🇺🇸|美国|\b(US|USA|United States)\b/i.test(n)) return "US";
    if (/🇭🇰|香港|\b(HK|HKG|Hong)\b/i.test(n)) return "HK";
    if (/🇯🇵|日本|东京|大阪|\b(JP|JPN|Japan)\b/i.test(n)) return "JP";
    if (/🇹🇼|台湾|\b(TW|TWN|Taiwan|Tai)\b/i.test(n)) return "TW";
    if (/🇸🇬|新加坡|狮|\b(SG|SGP|Singapore)\b/i.test(n)) return "SG";
    if (/🇰🇷|韩国|韓|首尔|\b(KR|KOR|Korea)\b/i.test(n)) return "KR";
    if (/🇲🇾|\b(MY|Malaysia)\b/i.test(n)) return "MY";
    if (/🇦🇺|\b(AU|Australia)\b/i.test(n)) return "AU";
    if (/🇩🇪|\b(DE|Germany)\b/i.test(n)) return "DE";
    if (/🇬🇧|\b(UK|GB|Britain)\b/i.test(n)) return "GB";
    if (/🇳🇱|\b(NL|Netherlands)\b/i.test(n)) return "NL";
    if (/🇹🇷|\b(TR|Turkey)\b/i.test(n)) return "TR";
    return "";
  }

  function csvCell(value) {
    var s = String(value == null ? "" : value);
    return '"' + s.replace(/"/g, '""') + '"';
  }

  function csvRow(values) {
    return values.map(csvCell).join(",");
  }

  function parseTrace(data) {
    var out = {};
    String(data || "").split(/\r?\n/).forEach(function (line) {
      var idx = line.indexOf("=");
      if (idx > 0) out[line.slice(0, idx)] = line.slice(idx + 1);
    });
    return out;
  }

  function testByNode(name, callback) {
    var t0 = Date.now();
    $httpClient.get({
      url: TEST_URL,
      timeout: TIMEOUT_MS,
      node: name
    }, function (err, response, data) {
      var elapsed = Date.now() - t0;
      if (err) {
        callback({
          target: name,
          ok: false,
          elapsed: elapsed,
          error: String(err)
        });
        return;
      }
      var trace = parseTrace(data);
      callback({
        target: name,
        ok: true,
        status: response && response.status ? response.status : "",
        elapsed: elapsed,
        ip: trace.ip || "",
        loc: trace.loc || "",
        colo: trace.colo || "",
        warp: trace.warp || "",
        raw: String(data || "").replace(/\r?\n/g, ";")
      });
    });
  }

  function runPool(items, worker, done) {
    var index = 0;
    var active = 0;
    var results = [];

    function pump() {
      if (finished) return;
      while (active < CONCURRENCY && index < items.length) {
        var item = items[index++];
        active += 1;
        worker(item, function (result) {
          results.push(result);
          active -= 1;
          pump();
        });
      }
      if (index >= items.length && active === 0) {
        done(results);
      }
    }

    pump();
  }

  function finish() {
    if (finished) return;
    finished = true;
    lines.push("");
    lines.push("elapsed_ms=" + (Date.now() - startedAt));
    var output = lines.join("\n");
    console.log(output);
    try {
      $notification.post("Vie 全量节点审计完成", "请导出脚本日志发给我", "我会按 CSV 找出固定出口/错标节点/策略锁定原因");
    } catch (e) {}
    $done();
  }

  function appendConfigInfo(cfg) {
    lines.push("=== Vie Loon Full Audit ===");
    lines.push("version=" + VERSION);
    lines.push("time=" + new Date().toISOString());
    try {
      lines.push("loon=" + JSON.stringify($loon));
    } catch (e) {
      lines.push("loon=unavailable");
    }
    lines.push("running_model=" + cfg.running_model + " final=" + cfg.final + " global_proxy=" + cfg.global_proxy + " ssid=" + cfg.ssid);
    lines.push("");
    lines.push("--- selected policy ---");
    lines.push(csvRow(["policy", "selected_now", "stored"]));
    policyGroups.forEach(function (name) {
      var selected = "";
      try {
        selected = $config.getSelectedPolicy(name);
      } catch (e) {
        selected = "ERR:" + String(e);
      }
      var stored = cfg.policy_select && cfg.policy_select[name] ? cfg.policy_select[name] : "";
      lines.push(csvRow([name, selected, stored]));
    });
  }

  function uniqueNodes(childrenByGroup) {
    var seen = {};
    var nodes = [];

    function add(item, source) {
      if (!item || !item.name) return;
      if (item.name === "DIRECT" || item.name.indexOf("REJECT") === 0) return;
      if (item.type && item.type !== "node") return;
      if (seen[item.name]) return;
      seen[item.name] = true;
      nodes.push({
        name: item.name,
        source: source,
        expected: expectedCountry(item.name)
      });
    }

    (childrenByGroup["节点选择"] || []).forEach(function (item) {
      add(item, "节点选择");
    });

    regionGroups.forEach(function (group) {
      (childrenByGroup[group] || []).forEach(function (item) {
        add(item, group);
      });
    });

    return nodes.slice(0, MAX_NODES);
  }

  function collectChildren(callback) {
    var groups = ["节点选择"].concat(regionGroups);
    var pending = groups.length;
    var byGroup = {};

    lines.push("");
    lines.push("--- children summary ---");
    lines.push(csvRow(["group", "count", "first_items_or_error"]));

    groups.forEach(function (group) {
      getChildren(group, function (err, children) {
        byGroup[group] = children;
        var preview = err ? err : children.slice(0, 12).map(function (item) {
          return item.type + ":" + item.name;
        }).join(" | ");
        lines.push(csvRow([group, children.length, preview]));
        pending -= 1;
        if (pending === 0) callback(byGroup);
      });
    });
  }

  function auditPolicyOutputs(callback) {
    lines.push("");
    lines.push("--- policy output test ---");
    lines.push(csvRow(["policy", "ok", "ip", "loc", "colo", "elapsed_ms", "error"]));
    runPool(policyGroups, function (name, done) {
      testByNode(name, function (res) {
        lines.push(csvRow([name, res.ok, res.ip || "", res.loc || "", res.colo || "", res.elapsed, res.error || ""]));
        done(res);
      });
    }, function () {
      callback();
    });
  }

  function auditConcreteNodes(nodes) {
    lines.push("");
    lines.push("--- concrete node output test ---");
    lines.push(csvRow(["node", "source_group", "expected", "actual_loc", "match", "ip", "colo", "elapsed_ms", "error"]));

    var mismatches = [];
    var failures = [];
    runPool(nodes, function (node, done) {
      testByNode(node.name, function (res) {
        var match = "";
        if (node.expected && res.loc) match = node.expected === res.loc ? "yes" : "NO";
        if (!res.ok) failures.push(node.name + " => " + (res.error || "failed"));
        if (match === "NO") mismatches.push(node.name + " expected=" + node.expected + " actual=" + res.loc + " ip=" + res.ip);
        lines.push(csvRow([node.name, node.source, node.expected, res.loc || "", match, res.ip || "", res.colo || "", res.elapsed, res.error || ""]));
        done(res);
      });
    }, function () {
      lines.push("");
      lines.push("--- summary ---");
      lines.push("tested_nodes=" + nodes.length);
      lines.push("mismatch_count=" + mismatches.length);
      mismatches.slice(0, 80).forEach(function (item) {
        lines.push("MISMATCH " + item);
      });
      lines.push("failure_count=" + failures.length);
      failures.slice(0, 80).forEach(function (item) {
        lines.push("FAILED " + item);
      });
      finish();
    });
  }

  try {
    var cfg = parseConfig();
    appendConfigInfo(cfg);
    collectChildren(function (childrenByGroup) {
      var nodes = uniqueNodes(childrenByGroup);
      lines.push("");
      lines.push("node_test_count=" + nodes.length);
      auditPolicyOutputs(function () {
        auditConcreteNodes(nodes);
      });
    });
  } catch (e) {
    lines.push("fatal_error=" + String(e));
    finish();
  }

  setTimeout(function () {
    lines.push("");
    lines.push("timeout_guard=hit");
    finish();
  }, 280000);
})();
