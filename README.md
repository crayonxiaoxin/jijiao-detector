# 🦶 小黑子鉴定中心（自封）

> 全国首个（自封）「AI 鸡脚露出自动鉴定系统」——用最正经的政务系统外壳，装一个最不正经的梗。

一个纯静态单页整活站：红头滚动公告、公章、机读卡问卷、黑色扫描终端、盖章鉴定报告，全套流程一本正经，结论全靠随机数。为 **GitHub Pages / Cloudflare Pages** 设计：零依赖、零构建、零外部请求。

## ✨ 玩法

| 环节 | 说明 |
| --- | --- |
| 首屏 | 红头公告、故障艺术大标题、实时（假的）在线人数、偷偷探出来的鸡脚、中分头篮球小黄鸡吉祥物 |
| 鉴定问卷 | 4 道机读卡选择题：中分发型 / 篮球 / 鸡你太＿ / 两年半 |
| 扫描终端 | 逐行打印 10 条荒诞日志 + 进度条走到 100%，音效由 Web Audio 实时合成 |
| 鉴定报告 | 随机结论、四项指标条、专家评语、慢慢升起的鸡脚、嫌疑人快照、红色印章 |
| 结果操作 | 一键复制整活文案、下载 Canvas 生成的 PNG 证书（900×1340）、重新鉴定 |

另有实时假播报、抽象指数柱状图、词汇百科，以及一个永远进不去的「管理员入口」。

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

## 🛠 想改点什么

主要都集中在 `script.js`，改完刷新即可：

| 位置 | 作用 |
| --- | --- |
| `SCAN_LINES` | 扫描终端逐行打印的日志文案 |
| `VERDICTS` / `COMMENTS` | 随机鉴定结论与专家评语 |
| `MASCOT_LINES` | 戳吉祥物时的吐槽 |
| `KONAMI` | 秘籍按键序列 |
| `index.html` 里 `#bgmVolume` 的 `value` | BGM 初始音量（默认 35） |
| `assets/chick.png` / `assets/jinitaimei.mp3` | 直接替换同名文件即可换素材 |

`localStorage` 只用了两个键：`jijiao-bgm-off`（记住手动暂停）和 `jijiao-poke`（戳吉祥物的次数）。不上传任何数据、无 Cookie、无追踪。

## 🥚 彩蛋

- 右下角「一键露出鸡脚」：六只脚全屏齐发
- 首屏右下探出的鸡脚：鼠标凑近会缩回去，还说「别看我」
- 点小黄鸡会抖一下并回嘴，**连戳 5 下**触发「全员露出」
- Konami Code：`↑ ↑ ↓ ↓ ← → ← → B A`
- 跟随鼠标转的篮球（左下角可关）、管理员入口的拒绝提示

## ⚠️ 素材与免责

- 本站为**纯娱乐整活作品**，不隶属于任何机构、不针对任何真实个人；所有鉴定结果、播报与统计数据均为随机生成，请勿当真。页脚已附同样声明。
- `assets/jinitaimei.mp3` 与 `assets/chick.png` 为项目素材，后者是按用户提供的梗图风格重绘并去背的 PNG。**若要公开传播，请先确认相关录音、形象与梗图的授权**。
