# 🦶 小黑子鉴定中心（自封）

> 全国首个（自封）「AI 鸡脚露出自动鉴定系统」——用最正经的政务系统外壳，装一个最不正经的梗。

一个纯静态单页整活站：红头滚动公告、公章、机读卡问卷、黑色扫描终端、盖章鉴定报告，全套流程一本正经，结论全靠随机数。为 **GitHub Pages / Cloudflare Pages** 设计：零依赖、零构建、无外部字体 / CDN / 图片；仅在非 Cloudflare 环境下，为「本次访问来源」发起一次可选的公共 IP 归属地查询（可一键关闭）。

## ✨ 玩法

| 环节 | 说明 |
| --- | --- |
| 首屏 | 红头公告、故障艺术大标题、实时（假的）在线人数、偷偷探出来的鸡脚、中分头篮球小黄鸡吉祥物 |
| 鉴定问卷 | 4 道机读卡选择题：中分发型 / 篮球 / 鸡你太＿ / 两年半 |
| 扫描终端 | 逐行打印 10 条荒诞日志 + 进度条走到 100%，音效由 Web Audio 实时合成 |
| 鉴定报告 | 随机结论、四项指标条、专家评语、慢慢升起的鸡脚、嫌疑人快照、红色印章 |
| 结果操作 | 一键复制整活文案、下载 Canvas 生成的 PNG 证书（900×1340）、重新鉴定 |

另有实时播报（可显示本次访问的真实归属地）、按真实日期滚动的抽象指数柱状图（标题显示当天日期与星期，最后一根高亮为「今天」）、词汇百科，以及一个永远进不去的「管理员入口」。

## 🎵 声音

- `assets/jinitaimei.mp3`：约 23 秒的循环 BGM。浏览器禁止无手势自动出声，所以**首次点击/按键页面任意位置**才起播，默认音量 35%，右下角黑胶唱片坞可暂停 / 调音量；手动暂停会记进 `localStorage`，下次打开不再自动放。
- 顶栏「提示音」只管扫描、盖章等合成音效，和 BGM 互不影响。
- BGM 一响，鸡脚开始打节拍、篮球与圆形贴纸加速旋转、公章脉冲、吉祥物加速点头。

## 📁 文件结构

```
.
├── index.html          # 页面结构 + 内联 SVG（鸡脚 / 篮球 / 吉祥物降级版）
├── style.css           # 复古政务蓝 + 土味荧光黄，含全部响应式断点
├── script.js           # 问卷、终端、报告、证书、音效、彩蛋
├── assets/
│   ├── chick.png       # 手绘质感小黄鸡（去背透明 PNG，640×640）
│   └── jinitaimei.mp3  # 循环 BGM
├── .nojekyll           # 让 GitHub Pages 跳过 Jekyll
└── README.md
```

没有 `package.json`、没有构建产物、没有 CDN / 外部字体 / 外部图片；鸡脚、篮球、印章与证书都由内联 SVG 或 Canvas 现场生成。图片若加载失败，会自动回退到 `index.html` 里内置的那份 SVG 吉祥物。

## 🚀 本地运行

任意静态服务器都行，例如在项目根目录：

```bash
python3 -m http.server 8000
# 打开 http://localhost:8000
```

或 `npx serve .`。直接双击 `index.html`（`file://`）也能玩，但建议起个本地服务器，行为和线上一致。

## 🌐 部署

### GitHub Pages

1. 把**整个目录内容**推到仓库根目录（`assets/` 和 `.nojekyll` 都要带上）。
2. 仓库 → Settings → Pages → Build and deployment → **Deploy from a branch** → 分支 `main`、目录 `/ (root)` → Save。
3. 等几十秒，访问 `https://<用户名>.github.io/<仓库名>/`。

`.nojekyll` 已备好，避免 Jekyll 处理静态文件。

### Cloudflare Pages

- 连接 Git 仓库，构建命令**留空**、输出目录填 `/`（或 `.`），不需要 Node 环境。
- 或命令行：`npx wrangler pages deploy . --project-name jijiao-detector`

### Cloudflare Workers（可选）

纯静态站更推荐 Pages。若一定要走 Worker，在项目根加一个 `wrangler.toml`：

```toml
name = "jijiao-detector"
compatibility_date = "2026-11-05"

[assets]
directory = "./"
```

然后 `npx wrangler deploy`。

## 📍 访客归属地（可选）

打开页面后，「露出事件流」会尝试识别本次访问来自哪个省 / 国家：成功则在标题旁显示「本次访问：广东」，并插入一条专属播报；识别失败就完全静默，播报继续用随机省份，**不影响任何功能**。历史与后续播报仍为随机省份，因为那是「全网事件流」。

按部署平台自动选路，无需配置：

| 环境 | 数据源 | 说明 |
| --- | --- | --- |
| Cloudflare Pages / Workers | 同源 `/cdn-cgi/trace` | 读边缘节点返回的 `loc=`，访客 IP 不离开请求链路，**零第三方、零配额**；精度到国家 / 地区 |
| GitHub Pages 及其他静态托管 | `ipwho.is` → `get.geojs.io` | 浏览器直连，免密钥、HTTPS、带 CORS；精度通常到省；主源失败自动换备源 |

实现见 `script.js` 的 `detectVisitorRegion()`：先试一次同源 `/cdn-cgi/trace`（非 Cloudflare 环境返回 404，静默跳过），请求带 1.2–2.2 秒超时与 `no-referrer`，结果只存内存，**不写 localStorage、不落库、不回传本站**。地区名经内置映射表转中文（含中国香港 / 中国台湾 / 中国澳门）。免费库国家级准确率约 97–99.5%，城市级仅 55–78%，VPN / 移动网络会定位到出口节点，所以页面只展示到省或国家。

**彻底关闭**：把 `script.js` 的 `GEO_ENABLED` 改成 `false`，站点即回到完全零外部请求的状态。

**Cloudflare 想要省级精度**（可选）：`request.cf` 在免费套餐下 `country` 稳定可用，`region` / `city` 可能为空或需 Pro 计划。可加一个 Pages Function 并在 `detectVisitorRegion()` 里加一步同源 `/api/geo` 请求（不加也完全能跑）：

```js
// functions/api/geo.js
export function onRequest({ request }) {
  const cf = request.cf || {};
  return Response.json(
    { country_code: cf.country ?? null, region: cf.region ?? null },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
```

> 前端会自动把这里的 `country_code` / `region` 交给 `localizeGeo()` 转中文；请保留空值兜底。

## 🛠 想改点什么

主要都集中在 `script.js`，改完刷新即可：

| 位置 | 作用 |
| --- | --- |
| `SCAN_LINES` | 扫描终端逐行打印的日志文案 |
| `VERDICTS` / `COMMENTS` | 随机鉴定结论与专家评语 |
| `MASCOT_LINES` | 戳吉祥物时的吐槽 |
| `KONAMI` | 秘籍按键序列 |
| `GEO_ENABLED` | 访客归属地开关，改成 `false` 即完全关闭外部查询 |
| `CN_REGION` / `COUNTRY_CODE` | 归属地英文转中文的映射表 |
| `index.html` 里 `#bgmVolume` 的 `value` | BGM 初始音量（默认 35） |
| `assets/chick.png` / `assets/jinitaimei.mp3` | 直接替换同名文件即可换素材 |

`localStorage` 只用了两个键：`jijiao-bgm-off`（记住手动暂停）和 `jijiao-poke`（戳吉祥物的次数）。无 Cookie、无追踪、不上传任何数据。访客归属地只存在于内存变量里，不写入任何存储；它会产生一次到公共 IP 库的浏览器请求（Cloudflare 部署时改为同源请求，完全没有第三方），详见「访客归属地」一节。

## 🥚 彩蛋

- 右下角「一键露出鸡脚」：六只脚全屏齐发
- 首屏右下探出的鸡脚：鼠标凑近会缩回去，还说「别看我」
- 点小黄鸡会抖一下并回嘴，**连戳 5 下**触发「全员露出」
- Konami Code：`↑ ↑ ↓ ↓ ← → ← → B A`
- 跟随鼠标转的篮球（左下角可关）、管理员入口的拒绝提示

## ⚠️ 素材与免责

- 本站为**纯娱乐整活作品**，不隶属于任何机构、不针对任何真实个人；所有鉴定结果、播报事件与统计数据均为随机生成，请勿当真。页脚已附同样声明。
- 归属地识别只展示到省 / 国家，不展示精确坐标、不存储、不回传；若公开运营，请按适用法规在隐私说明中披露所使用的第三方 IP 库。
- `assets/jinitaimei.mp3` 与 `assets/chick.png` 为项目素材，后者是按用户提供的梗图风格重绘并去背的 PNG。**若要公开传播，请先确认相关录音、形象与梗图的授权**。
