# vie Loon Config

这是基于可莉 Loon 进阶配置整理出的个人 Loon 配置。目标是保留可莉配置的 DNS、防泄漏、插件和基础规则，同时加入按应用分流，让 iPad 上的 Loon 接近 PC 上 Clash 的使用体验。

当前主配置文件：

- `vie.lcf`
- Raw 导入地址：`https://raw.githubusercontent.com/viellenz/vie/main/vie.lcf`

> 仓库版配置不包含机场订阅、本地节点、MITM 证书和私有参数。订阅和本地节点请在 Loon 内自行添加。

## 当前版本

- 配置版本：`2026-06-07-short-policy-v4`
- 主入口策略：`Proxies`
- 兜底规则：`FINAL,Proxies`
- IP 模式：`ipv4-only`
- 策略切换断开旧连接：`disconnect-on-policy-change = true`

## Final 为什么不显示

`Final` 不是一个可见策略组，而是 Loon 规则里的兜底规则。

配置中实际写法是：

```ini
[Rule]
FINAL,Proxies
```

含义是：如果一个请求没有命中前面的远程规则、本地规则、国内直连规则或插件规则，就交给 `Proxies` 处理。

所以在 Loon 的策略页面里看不到 `Final` 是正常的。策略页面只显示 `[Proxy Group]` 里的分组；`FINAL,Proxies` 只是规则，不会生成单独卡片。

## 策略组顺序

当前可见策略组共 18 个，顺序如下：

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

其中：

- `Proxies` 是全局主入口，默认显示所有有效节点。
- `US/HK/JP/TW/SG/KR` 是地区筛选组。
- `Telegram/Google/Gemini/AI/TikTok/Social/YouTube/Spotify/Netflix/Microsoft/Apple` 是应用分流组。
- `其余节点` 只作为 `[Remote Filter]` 筛选器存在，被应用分流组引用，不作为单独策略组显示。

## 流量走向

整体逻辑：

```text
请求
  -> Remote Rule / Rule 命中
  -> 对应应用策略组
  -> Proxies 或地区组
  -> 节点

未命中任何规则
  -> FINAL
  -> Proxies
  -> 当前手选节点
```

例子：

- 访问 Telegram：命中 Telegram 规则，走 `Telegram` 策略组。
- 访问 YouTube：命中 YouTube 规则，走 `YouTube` 策略组。
- 访问 Netflix：命中 Netflix 规则，走 `Netflix` 策略组。
- 访问 GitHub：命中 GitHub 规则，走 `Proxies`。
- 访问一个没有被规则覆盖的国外网站：命中 `FINAL,Proxies`，走 `Proxies`。
- 访问微信、淘宝、B 站等国内应用：命中国内应用规则，走 `DIRECT`。

## 策略组用途

### Proxies

全局默认代理入口。一般情况下只需要切这个组里的具体节点。

如果一个网站没有命中任何应用分流规则，最终会走：

```ini
FINAL,Proxies
```

### Google 和 Gemini

`Gemini` 的第一项是 `Google`：

```ini
Gemini = select,Google,Proxies,US,HK,JP,TW,SG,KR,其余节点
```

这样做是为了让 Gemini 默认跟随 Google。Gemini 登录、验证、账号风控会牵涉 Google 相关域名，如果 Google 和 Gemini 分到不同地区，可能出现登录异常、地区异常或风控。

### AI

`AI` 使用可莉的 `AI.lsr`：

```ini
https://kelee.one/Tool/Loon/Lsr/AI.lsr, policy=AI
```

适合覆盖常见 AI 服务。后续如果发现某个 AI 域名没命中，可以再单独补规则。

### TikTok

`TikTok` 使用可莉规则：

```ini
https://kelee.one/Tool/Loon/Lsr/TikTok.lsr, policy=TikTok
```

TikTok 解锁通常还和节点原生地区、SIM/系统地区、DNS、App 缓存有关。规则只负责把 TikTok 流量导向指定策略组。

### Netflix

`Netflix` 使用可莉规则：

```ini
https://git.repcz.link/rule.kelee.one/Loon/Netflix.lsr, policy=Netflix
```

`Netflix` 策略组默认跟随 `Proxies`，也可以手动切到 `US/HK/JP/TW/SG/KR/其余节点`。Netflix 解锁结果取决于节点本身是否支持对应地区的流媒体解锁，规则只负责把 Netflix 流量导向这个策略组。这里使用的是可莉 Netflix 规则的镜像地址，避免直连 `rule.kelee.one` 时偶发 403。

### Microsoft 和 Apple

默认第一项是 `DIRECT`：

```ini
Microsoft = select,DIRECT,Proxies,US,HK,JP,TW,SG,KR,其余节点
Apple = select,DIRECT,Proxies,US,HK,JP,TW,SG,KR,其余节点
```

这样可以减少系统更新、iCloud、微软服务等大量基础流量走代理。需要代理时可以手动切到 `Proxies` 或地区组。

## 规则来源

### blackmatrix7

用于主要应用分流：

- Gemini
- YouTube
- Google
- Telegram
- Microsoft
- Apple
- Spotify
- Twitter
- Instagram
- WhatsApp
- Discord
- Line
- Facebook
- Reddit
- 国内应用直连规则

### 可莉规则

保留可莉相关规则：

- TikTok
- AI
- SpeedtestInternational
- LAN_SPLITTER
- REGION_SPLITTER
- Netflix

## 插件

当前插件包含：

```text
Block_HTTPDNS
BlockAdvertisers
QuickSearch
Prevent_DNS_Leaks
Node_detection_tool
AppleWeatherEnhancer
iRingo Maps
TestFlightRegionUnlock
BoxJs
Sub-Store
Script-Hub
```

说明：

- `Block_HTTPDNS`：拦截常见 HTTPDNS，减少应用绕过 Loon DNS 的情况。
- `BlockAdvertisers`：广告平台拦截基础插件。
- `Prevent_DNS_Leaks`：DNS 防泄漏相关插件，走 `Proxies`。
- `Node_detection_tool`：节点解锁测试工具。
- `AppleWeatherEnhancer`：Apple 天气增强。
- `iRingo Maps`：地图增强。
- `BoxJs`：脚本数据管理。
- `Sub-Store`：订阅管理工具。
- `Script-Hub`：脚本转换和管理工具。
- `TestFlightRegionUnlock`：默认禁用，需要时再手动开启。

## Loon 内需要打开的开关

建议检查：

- 复写：开启
- 脚本：开启
- MITM：开启并安装、信任证书
- 插件：开启

注意：`[Script]` 里没有单独脚本时，Loon 首页脚本数量显示为 `0` 是正常的。很多脚本来自插件内部，不一定会显示在 `[Script]` 数量里。

## 节点和订阅

仓库版配置的 `[Remote Proxy]` 保持为空：

```ini
[Remote Proxy]
```

这是故意的。机场订阅和本地节点建议在 Loon 内添加，避免把私有链接提交到 GitHub。

推荐方式：

1. 在 Loon 里导入 `vie.lcf`。
2. 到节点页面添加机场订阅。
3. 如有自建节点，在 Loon 里添加本地节点。
4. 回到策略页，在 `Proxies` 里手动选择当前要使用的节点。

## 自建 VLESS 节点建议

如果使用 VLESS + REALITY + Vision：

- 地址可以填域名，也可以填 IP。
- 如果域名只是为了指向 VPS，且不需要 Cloudflare DNS，可以直接填 IP。
- `sni` 应保持服务端配置要求的值。
- `flow` 使用服务端匹配的 `xtls-rprx-vision`。
- `udp` 是否开启按节点能力决定。
- `block-quic` 可以开启，减少 Google/YouTube QUIC 造成的异常。
- `skip-cert-verify` 不建议长期依赖，能正常验证就关闭。

## QUIC 说明

Google、YouTube 等服务会优先尝试 QUIC，也就是 UDP 443。某些代理协议、节点或网络环境对 QUIC 支持不好时，可能出现：

- YouTube 卡加载
- Google 服务连接慢
- 测速显示异常
- 请求记录里出现被拦截的 QUIC

当前配置和节点可按需启用 `block-quic`。如果 TCP 访问稳定，拦截 QUIC 通常没问题。

## 常见排查

### 切换节点后 IP 没变

先确认你切的是 `Proxies` 里的具体节点，而不是只切了某个应用组或地区组。

建议步骤：

1. 进入策略页。
2. 打开 `Proxies`。
3. 选择具体节点。
4. 回浏览器刷新 IP 测试页面。

当前配置开启了：

```ini
disconnect-on-policy-change = true
```

切换策略后旧连接会断开，新请求应更快走新节点。

### 看不到 Final

正常。`Final` 是规则，不是策略组。

兜底规则是：

```ini
FINAL,Proxies
```

### 微信或国内应用走代理

先看请求记录命中的规则。如果命中 `FINAL,Proxies`，说明对应域名没有被国内规则覆盖。可以把域名补进本地规则，或等待上游规则更新。

当前已加入常见国内应用直连规则，包括：

- WeChat
- Tencent
- Alibaba
- ByteDance
- Baidu
- BiliBili
- NetEase
- MeiTuan
- Weibo
- XiaoMi
- JingDong
- Pinduoduo
- KuaiShou
- GaoDe
- DiDi
- Zhihu
- XiaoHongShu
- Eleme
- DingTalk

### 插件脚本数量为 0

如果 `[Script]` 为空，脚本数量显示 `0` 是正常的。插件内部包含的脚本不一定计入这里。

### Raw 链接更新不及时

GitHub raw 可能有短时间缓存。仓库内容已经更新时，raw 链接偶尔还会显示旧版，等一会儿或重新刷新资源即可。

## 文件维护原则

- `vie.lcf` 是唯一正式入口。
- 不再保留 `vie_stable.lcf` 之类备用文件。
- 私有订阅、本地节点、MITM 证书不提交到 GitHub。
- 调试脚本和历史版本只保留在本地归档目录，不写入正式配置。

## 当前确认状态

- 可见策略组数量：18
- 策略顺序：基于 iPad 当前可用版，新增 `Netflix` 并放在 `Spotify` 后面，第一项使用 `Proxies`
- `Final` 行为：未命中流量默认走 `Proxies`
- 切换 `Proxies` 内节点：已确认可正常改变出口 IP
