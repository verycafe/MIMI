# Mimi · 八只低多边形纸猫

Mimi 现在包含猫咪选择、产品内使用效果与开发接入三个部分。展示页和组件使用同一套 SDK，原生 JavaScript 与 React 均可接入。

网页、SDK 源码、示例、文档与分发文件均放在项目根目录；参考代码、历史版本及本地构建暂存文件位于 `work/`，详见 [工作资料说明](work/README.md)。

启动本地 HTTP 服务后，可预览 [mimi.html](http://127.0.0.1:8765/mimi.html)，具体命令见下方“构建与本地预览”。组件接入说明见 [DISTRIBUTION.md](DISTRIBUTION.md)。

## 页面信息结构

页面将黑猫放在第一位，每次打开默认选中黑猫；其他猫咪保持原有相对顺序。

页面采用纯白背景、微暖白头像展示面、深色文字与浅色细边框，以黑色按钮和选中态突出操作；演示区保持白色，代码区使用中性炭黑，移除绿色界面配色与猫咪周围的彩色光晕，让视觉重点落在猫咪头像上。

1. **挑选猫咪**：大头像、当前猫咪介绍、好奇 / 开心 / 困困状态与暂停；下方八张卡片只显示头像和名称，不再显示毛色小字或颜色选择器。
2. **查看使用效果**：助手列表同时呈现待命、工作与休眠；聊天窗口演示思考后回应；32、48、64、96 px 尺寸预览。选择猫咪后，示例头像同步切换。
3. **带回产品**：JavaScript / React 代码示例随当前选择变化，提供复制、参数说明，并统一通过 [GitHub 入口](https://github.com/verycafe/MIMI) 引导至项目仓库。

助手列表、聊天和尺寸预览都调用实际 SDK 绘制，不使用预先生成的演示截图。聊天进入页面后自动循环：思考 1.8 秒 → 显示固定回复并停留 5 秒 → 下一轮，无需重播按钮。全局暂停或页面隐藏时暂停计时，恢复后继续。聊天**没有接入真实 AI 或聊天后端**。

## 八只固定外观

| ID | 猫咪 | 固定毛色 |
| --- | --- | --- |
| `american` | 美短 | 银色经典虎斑 |
| `ginger` | 橘猫 | 暖橘条纹 |
| `black` | 黑猫 | 纯炭黑 |
| `tabby` | 虎斑猫 | 棕色鱼骨纹 |
| `cream` | 奶白猫 | 奶白浅奶油色 |
| `ragdoll` | 布偶猫 | 海豹双色 |
| `calico` | 三色梨花猫 | 三花带狸花纹 |
| `cow` | 黑白奶牛猫 | 黑白不对称斑块 |

每只猫只有一套设定好的毛色与花纹。名称与外形依据见 [CAT-REFERENCES.md](CAT-REFERENCES.md)；“三色梨花猫”保留用户写法，造型按三花带狸花纹制作。

造型继续保留当前设定：

- 头部采用连续的低多边形网格，保留大块折面，没有第二个头部外壳或叠片边框。
- 宽颊、常规、窄楔、布偶颊毛四种基础轮廓，搭配不同耳朵、眼睛和口鼻比例。
- 条纹、白斑与不对称色块由程序绘制；金字塔耳朵、平面眼圈和凸起的折纸鼻口保持纸模风格。
- 使用温暖漫反射、阴影与细微纸纤维表现哑光纸感，不添加塑料反射或清漆高光。
- 奶白猫沿用橘猫的常规基础头型，维持自然宽高比和适中三角耳；整体比例固定，保留朝向、跳动、眨眼，取消整体挤压与拉伸，不再按异国短毛猫定义。

形体、毛色、纸张纹理与阴影均由代码生成，不使用外部图片、3D 模型、HDR 或图像生成服务。

## 使用与分发

展示网站统一引导至 [GitHub 项目仓库](https://github.com/verycafe/MIMI)，不再提供 JS、TGZ、ZIP 或 PNG 下载入口。SDK 仍保留 `exportPNG()` 与 `renderImage()`，可由接入方生成静态头像；图片使用稳定姿态与居中留白，不捕捉动画中的拉伸帧。

需要互动或业务状态变化时，使用组件包：

| 本地分发文件 | 用途 |
| --- | --- |
| `downloads/mimi-cat-avatars-0.1.0.tgz` | 安装到现有前端项目，含 ESM、React 组件和 TypeScript 声明 |
| `dist/mimi-cat-avatars.js` | 直接通过浏览器脚本使用 `MimiAvatars` |
| `downloads/mimi-distribution.zip` | 分发文件、原生 / React 示例、开发接入说明与许可证 |

**版本 0.1.0 仅在本地生成，尚未注册或发布到 npm。** 将本地生成的 `.tgz` 复制到目标项目当前目录后安装：

```sh
npm install ./mimi-cat-avatars-0.1.0.tgz
```

原生版本没有外部运行依赖；React 入口使用宿主已有的 React 18+。完整参数、方法、生命周期与错误处理见 [DISTRIBUTION.md](DISTRIBUTION.md)。

`mimi.html` 仅内嵌运行所需的 CSS、JavaScript 与许可证，可作为单文件分享，不再以 base64 内嵌分发档案。`index.html` 是开发版，需要同目录的源文件与 `dist/`。本地分发文件及构建流程仍保留。

## 开发文件

| 文件 | 内容 |
| --- | --- |
| `index.html`、`styles.css` | 展示站结构与桌面 / 手机排版 |
| `app.js` | 猫咪选择、真实 SDK 示例、代码切换与复制 |
| `src/avatar-runtime.js` | 公开 API、共享渲染器、实例生命周期与交互 |
| `src/react-adapter.js` | React 生命周期适配 |
| `src/index.d.ts`、`src/react.d.ts` | 原生与 React 类型源文件 |
| `src/cat-catalog.js` | 八只猫的固定外观、文案与比例 |
| `src/cat-coats.js` | 程序毛色花纹 |
| `src/cat-3d.js` | 低多边形几何、纸张材质、光照与阴影 |
| `src/engine.js` | 状态与姿态动画引擎 |
| `examples/vanilla.html`、`examples/react-example.jsx` | 接入示例 |
| `build-package.mjs` | 生成浏览器 / ESM / React 入口、类型、TGZ 与 ZIP |
| `build-single-file.mjs` | 内嵌运行所需的样式、脚本与许可证，生成 `mimi.html` |
| `CAT-REFERENCES.md` | 外形与毛色资料来源 |
| `DISTRIBUTION.md` | 开发者说明，打包时作为分发包的 `README.md` |

SDK 中的头像共用一个 WebGL 2 渲染器，每个可见实例有独立的 2D Canvas；会处理离开视口、页面隐藏和系统减少动态偏好。原生接入卸载时须调用 `destroy()`；React 组件会自行清理。

## 构建与本地预览

首次获取项目：

```sh
git clone https://github.com/verycafe/MIMI.git
cd MIMI
```

以下命令均在项目根目录运行。构建脚本使用 Node.js 和 `python3`，不安装依赖；打包暂存目录为 `work/mimi-distribution-stage/`，由脚本在本地生成，不纳入版本控制。

```sh
node build-package.mjs
node build-single-file.mjs
```

然后启动本地 HTTP 服务：

```sh
python3 -m http.server 8765 --bind 127.0.0.1
```

打开 [http://127.0.0.1:8765/mimi.html](http://127.0.0.1:8765/mimi.html)。若该端口已有本项目的服务，重新构建后刷新页面即可。原生示例可从 `/examples/vanilla.html` 打开；React 示例需要加入已有 React 工程。

## 来源与验证状态

动画引擎改编自 Jakub Antalik 的 [Libraries.dev / bot-avatars](https://github.com/Jakubantalik/Libraries.dev/tree/main/packages/bot-avatars)，保留 MIT 许可证。猫咪几何、花纹、纸张材质、公开 API、React 适配和演示界面在本项目中实现。分发时保留 `LICENSE` 与 `NOTICE.md`。

当前版本**已完成本地打包，未运行应用测试、语法检查、浏览器检查或截图验收**。实际外观、交互和接入兼容性仍待验证；打包成功不代表上述行为已通过测试。
