# vie.lcf

`vie.lcf` 是一份 Loon 远端配置文件，基于可莉 Loon 进阶配置整理，保留原配置的 DNS、防泄漏、MITM、复写、插件与基础直连规则，并补充常用服务分流策略。

正式入口只有一个：

```text
https://raw.githubusercontent.com/viellenz/vie/main/vie.lcf
```

仓库版不包含机场订阅、本地节点、MITM 证书、私有参数。节点订阅和本地节点应在 Loon 内单独添加。

## 配置摘要

| 项目 | 当前值 |
| --- | --- |
| 文件 | `vie.lcf` |
| 配置版本 | `2026-06-07-short-policy-v4` |
| Loon 模式 | 分流配置 |
| 主策略 | `Proxies` |
| 兜底规则 | `FINAL,Proxies` |
| IP 模式 | `ipv4-only` |
| 策略切换 | `disconnect-on-policy-change = true` |
| 可见策略组 | 18 个 |
| 订阅节点 | 不写入仓库版 |

## 文件结构

`vie.lcf` 使用 Loon 标准配置段：

```ini
[General]
[Proxy]
[Remote Proxy]
[Remote Filter]
[Proxy Group]
[Rule]
[Remote Rule]
[Host]
[Rewrite]
[Script]
[Plugin]
[Mitm]
```

结构来源：

- 主体配置、DNS、插件、MITM、复写结构：可莉 Loon 进阶配置。
- 策略组显示结构：短命名手动策略结构，使用 `Proxies`、服务组、地区组。
- 规则补充：按服务拆分到独立策略组。
- 节点来源：不写在仓库配置内，由 Loon 本地订阅或本地节点提供。

## 导入方式

在 Loon 中导入远端配置：

```text
https://raw.githubusercontent.com/viellenz/vie/main/vie.lcf
```

导入后建议确认：

1. 添加机场订阅或本地节点。
2. 更新远端资源。
3. 进入策略页，确认 `Proxies` 中能看到节点。
4. 选择 `Proxies` 内的具体节点。
5. 打开请求记录或 IP 检测页面确认出口变化。

## 策略组

当前 `[Proxy Group]` 可见策略组顺序：

```text
1. Proxies
2. Telegram
3. Google
4. Gemini
5. AI
6. TikTok
7. Social
8. YouTube
9. Spotify
10. Netflix
11. Microsoft
12. Apple
13. US
14. HK
15. JP
16. TW
17. SG
18. KR
```

策略组说明：

| 策略组 | 用途 | 默认候选 |
| --- | --- | --- |
| `Proxies` | 全局代理入口 | `全球节点` |
| `Telegram` | Telegram 分流 | `Proxies`、地区组、`其余节点`、`DIRECT` |
| `Google` | Google 分流 | `Proxies`、地区组、`其余节点`、`DIRECT` |
| `Gemini` | Gemini 分流 | `Google`、`Proxies`、地区组、`其余节点` |
| `AI` | AI 服务分流 | `Proxies`、地区组、`其余节点` |
| `TikTok` | TikTok 分流 | `Proxies`、地区组、`其余节点` |
| `Social` | 社交服务分流 | `Proxies`、地区组、`其余节点`、`DIRECT` |
| `YouTube` | YouTube 分流 | `Proxies`、地区组、`其余节点`、`DIRECT` |
| `Spotify` | Spotify 分流 | `Proxies`、地区组、`其余节点` |
| `Netflix` | Netflix 分流 | `Proxies`、地区组、`其余节点` |
| `Microsoft` | Microsoft 分流 | `DIRECT`、`Proxies`、地区组、`其余节点` |
| `Apple` | Apple 分流 | `DIRECT`、`Proxies`、地区组、`其余节点` |
| `US/HK/JP/TW/SG/KR` | 地区节点手选 | 对应地区筛选器 |

`其余节点` 不是可见策略组，它只存在于 `[Remote Filter]`，供服务策略组选用。

## 流量路径

Loon 的基本流量路径是：

```text
请求
  -> 规则匹配
  -> 规则指定策略
  -> 策略组选中的节点或内置策略
```

本配置的典型路径：

```text
Google 请求
  -> Google 规则
  -> Google 策略组
  -> Proxies / 地区组 / DIRECT

Netflix 请求
  -> Netflix 规则
  -> Netflix 策略组
  -> Proxies / 地区组

未命中请求
  -> FINAL
  -> Proxies
```

`Final` 不会显示为策略组。它是 `[Rule]` 中的兜底规则：

```ini
FINAL,Proxies
```

含义是：所有未命中前置规则的请求默认交给 `Proxies`。

## 规则来源

### blackmatrix7

主要应用分流与国内应用直连规则来自 `blackmatrix7/ios_rule_script` 的 Loon 规则目录：

| 类型 | 策略 |
| --- | --- |
| Gemini | `Gemini` |
| YouTube | `YouTube` |
| Google | `Google` |
| Telegram | `Telegram` |
| Microsoft | `Microsoft` |
| Apple | `Apple` |
| Spotify | `Spotify` |
| Twitter / Instagram / WhatsApp / Discord / Line / Facebook / Reddit | `Social` |
| WeChat / Tencent / Alibaba / ByteDance / Baidu / BiliBili 等 | `DIRECT` |

### 可莉规则

以下规则保留可莉规则源或可莉规则镜像：

| 规则 | 策略 | 地址 |
| --- | --- | --- |
| TikTok | `TikTok` | `https://kelee.one/Tool/Loon/Lsr/TikTok.lsr` |
| AI | `AI` | `https://kelee.one/Tool/Loon/Lsr/AI.lsr` |
| Speedtest International | `Proxies` | `https://kelee.one/Tool/Loon/Lsr/SpeedtestInternational.lsr` |
| Netflix | `Netflix` | `https://git.repcz.link/rule.kelee.one/Loon/Netflix.lsr` |
| LAN | `DIRECT` | `https://kelee.one/Tool/Loon/Lsr/LAN_SPLITTER.lsr` |
| CN REGION | `DIRECT` | `https://kelee.one/Tool/Loon/Lsr/REGION_SPLITTER.lsr` |

Netflix 使用镜像地址是因为直连 `rule.kelee.one` 在部分网络环境可能返回 403；镜像地址已验证可拉取规则内容。

## 图标来源

| 类型 | 来源 |
| --- | --- |
| Proxies | `shindgewongxj/WHATSINStash` |
| Telegram / Apple | `blackmatrix7/ios_rule_script` Qure 图标 |
| Google / YouTube | `Semporia/Hand-Painted-icon` |
| Gemini | `lige47/QuanX-icon-rule` |
| AI | `Orz-3/mini` |
| TikTok / Social / Spotify / Netflix | `luestr/IconResource` |
| Microsoft / 地区图标 | `Koolson/Qure` |

## 插件

当前 `[Plugin]` 包含：

| 插件 | 状态 | 用途 |
| --- | --- | --- |
| `Block_HTTPDNS` | 启用 | 拦截常见 HTTPDNS |
| `BlockAdvertisers` | 启用 | 广告平台拦截基础插件 |
| `QuickSearch` | 启用 | Safari 快捷搜索 |
| `Prevent_DNS_Leaks` | 启用 | DNS 防泄漏，策略为 `Proxies` |
| `Node_detection_tool` | 启用 | 节点检测工具 |
| `AppleWeatherEnhancer` | 启用 | Apple 天气增强 |
| `iRingo Maps` | 启用 | 地图增强 |
| `TestFlightRegionUnlock` | 禁用 | TestFlight 区域解锁，需要时手动启用 |
| `BoxJs` | 启用 | 脚本数据管理 |
| `Sub-Store` | 启用 | 订阅管理 |
| `Script-Hub` | 启用 | 脚本转换和管理 |

## Loon 开关建议

建议在 Loon 中开启：

- 复写
- 脚本
- 插件
- MITM

MITM 需要安装并信任证书。仓库版不会保存证书内容。

`[Script]` 为空时，Loon 首页脚本数量显示 `0` 是正常现象。插件内部脚本不一定计入这里。

## 常见问题

### 看不到 Final

正常。`Final` 是规则，不是策略组。

当前兜底规则：

```ini
FINAL,Proxies
```

未命中的流量默认走 `Proxies`。

### 切换节点后出口 IP 不变

优先检查：

1. 是否切换了 `Proxies` 内的具体节点。
2. 当前请求是否命中了某个服务策略组，而该服务策略组被手动锁到地区组。
3. 请求是否复用了旧连接。
4. Loon 是否已更新远端资源。

当前配置启用：

```ini
disconnect-on-policy-change = true
```

策略切换后旧连接会被断开，新请求应更快使用新节点。

### Google 与 Gemini 分流异常

`Gemini` 默认第一项是 `Google`：

```ini
Gemini = select,Google,Proxies,US,HK,JP,TW,SG,KR,其余节点
```

这样可以让 Gemini 与 Google 登录、验证相关请求尽量保持同一出口。若需要单独指定 Gemini 出口，可在 `Gemini` 策略组中手动切换。

### 国内应用偶发走代理

先查看请求记录命中的规则。

如果命中 `FINAL,Proxies`，说明该域名未被当前国内规则覆盖。可以临时补本地规则，或等待上游规则更新。

### Netflix 无法解锁

规则只能把 Netflix 流量导向 `Netflix` 策略组，不能保证节点本身具备解锁能力。

排查顺序：

1. 在 `Netflix` 策略组手动选择一个支持 Netflix 的节点。
2. 使用节点检测工具确认 Netflix 状态。
3. 检查 DNS、缓存、App 登录地区和节点原生地区。
4. 重新打开 Netflix App 或清理相关缓存。

### TikTok 无法解锁

TikTok 解锁通常同时受节点地区、系统地区、SIM 状态、DNS、App 缓存影响。规则只负责流量分流。

### QUIC 相关问题

Google、YouTube 等服务可能使用 QUIC，也就是 UDP 443。节点或网络不稳定时，可能出现加载慢、测速异常、请求记录中出现 QUIC 被拦截。

如果 TCP 访问正常，按节点情况开启 `block-quic` 通常可以降低异常。

### GitHub Raw 链接延迟

GitHub Raw 可能短时间缓存旧内容。仓库内容已更新但 Raw 仍显示旧版时，等待一段时间或刷新资源即可。

## 维护规则

- 只维护 `vie.lcf` 一个正式配置文件。
- 不提交机场订阅、本地节点、MITM 证书、个人密钥。
- 新增策略组后必须同步 `[Remote Rule]` 中的 `policy=`。
- 新增图标后必须验证 URL 可访问。
- 调整策略组顺序后必须重新检查 Loon 策略页显示顺序。
- 修改 README 时必须同步版本号、策略组数量和规则来源。

## 审查清单

每次修改后至少检查：

```text
Proxy Group 数量与顺序
policy= 是否都指向有效策略组或内置策略
策略组成员是否存在于策略组、Remote Filter 或内置策略
Netflix / AI / TikTok 等远程规则是否只有一条有效入口
FINAL 是否仍为 FINAL,Proxies
README 版本号与 vie.lcf 一致
```

当前已确认：

```text
GROUP_COUNT=18
GROUP_ORDER_CHECK=OK
MISSING_POLICY=none
MISSING_MEMBERS=none
NETFLIX_RULE_COUNT=1
NETFLIX_RULE_CHECK=OK
FINAL=Proxies
```

## 参考资料

- Loon 官方文档：`https://nsloon.app/docs/intro/`
- Loon 策略说明：`https://nsloon.app/docs/Policy/`
- Loon 规则说明：`https://nsloon.app/docs/category/%E8%A7%84%E5%88%99/`
- Loon 插件说明：`https://nsloon.app/docs/Plugin/`
- Loon Scheme / 统一链接：`https://nsloon.app/docs/Scheme/`
- 可莉 Loon 资源：`https://hub.kelee.one/`
- blackmatrix7 规则：`https://github.com/blackmatrix7/ios_rule_script`
- luestr 图标与规则资源：`https://github.com/luestr/IconResource`
- Qure 图标：`https://github.com/Koolson/Qure`
- GitHub README 文档建议：`https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-readmes`
- Write the Docs 文档写作指南：`https://www.writethedocs.org/guide/writing/beginners-guide-to-docs/`
