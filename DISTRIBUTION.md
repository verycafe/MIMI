# Mimi Cat Avatars · 0.1.0

八只由代码绘制的低多边形纸猫，提供原生 JavaScript API、React 组件、TypeScript 类型和透明 PNG 导出。每只猫有固定的形体、毛色与花纹；应用通过 `state` 控制它的状态。

**当前是本地分发版本，包名尚未注册或发布到 npm。** 使用随包提供的文件或安装本地生成的 `.tgz`，不要把远程 npm 安装命令当作当前可用入口。

展示页面统一引导至 [GitHub 项目仓库](https://github.com/verycafe/MIMI)，不再提供 JS、TGZ、ZIP 或 PNG 下载入口；SDK 的 `exportPNG()`、`renderImage()` 与本地分发构建流程仍保留。

## 安装与文件

将本地生成的 `downloads/mimi-cat-avatars-0.1.0.tgz` 复制到目标项目当前目录，再安装：

```sh
npm install ./mimi-cat-avatars-0.1.0.tgz
```

原生版本没有外部运行依赖。React 入口使用宿主项目已有的 React 18 或更新版本；分发包不内嵌 React。类型声明随包提供，React TypeScript 项目还需使用其已有的 React 类型依赖。

| 文件 / 入口 | 用途 |
| --- | --- |
| `dist/mimi-cat-avatars.js` | 浏览器脚本，提供全局 `MimiAvatars` |
| `dist/mimi-cat-avatars.mjs` / `mimi-cat-avatars` | ESM，导出 `createAvatar`、`cats` 和默认 API 对象 |
| `dist/react.mjs` / `mimi-cat-avatars/react` | React `CatAvatar` 组件 |
| `dist/*.d.mts` | 原生与 React 类型声明，由 package exports 指向 |
| `examples/vanilla.html` | 原生 HTML 接入示例 |
| `examples/react-example.jsx` | 可加入现有 React 项目的交互示例 |
| `LICENSE`、`NOTICE.md` | 许可证与来源说明 |

## 原生 JavaScript

直接使用浏览器脚本时，把 `dist/mimi-cat-avatars.js` 放在页面旁边：

```html
<div id="cat"></div>
<button id="work" type="button">开始工作</button>
<button id="rest" type="button">休息一下</button>

<script src="./mimi-cat-avatars.js"></script>
<script>
  const avatar = MimiAvatars.createAvatar(document.querySelector('#cat'), {
    cat: 'cream',
    size: 96,
    state: 'default',
    onError: error => console.error(error)
  });

  document.querySelector('#work').onclick = () => avatar.update({ state: 'working' });
  document.querySelector('#rest').onclick = () => avatar.update({ state: 'sleeping' });

  // 切换路由、移除组件或替换容器时调用 avatar.destroy()。
</script>
```

已有构建工具的项目可以使用包入口：

```js
import { cats, createAvatar } from 'mimi-cat-avatars';

const avatar = createAvatar(document.querySelector('#cat'), {
  cat: cats[0].id,
  size: 64
});
```

无构建工具时，也可在 `<script type="module">` 中从自己托管的 `./dist/mimi-cat-avatars.mjs` 导入。通过本地 HTTP 服务打开示例，避免浏览器对本地文件模块的限制。

## React

```jsx
import { CatAvatar } from 'mimi-cat-avatars/react';

export function Assistant({ busy, away }) {
  return (
    <CatAvatar
      cat="cream"
      state={away ? 'sleeping' : busy ? 'working' : 'default'}
      size={64}
      interactive
      className="assistant-avatar"
      onError={error => console.error(error)}
    />
  );
}
```

组件在客户端挂载后创建头像，参数变化时更新已有实例，卸载时释放资源。SSR 阶段只输出保留尺寸的容器；模块导入不访问 DOM，也不创建 WebGL 上下文。React Strict Mode 的挂载、清理、再挂载使用同一套生命周期处理。

可以传入 `className`、`style` 和普通 `div` 属性。组件内部由 SDK 管理，请把说明文字放在头像旁边，不传入 `children` 或 `dangerouslySetInnerHTML`。`onError` 是 SDK 错误回调，不是 DOM 合成事件。

使用 `ref` 可调用 `poke()`、`exportPNG()`、`renderImage()`，并读取 `canvas`。初始化前或初始化失败时，`canvas` 与 `renderImage()` 返回 `null`，`poke()` 不执行动作，`exportPNG()` 返回拒绝的 Promise。React 组件会自行清理资源，外部无需调用 `destroy()`。

## 猫咪与状态

| `cat` | 名称 | 固定外观 |
| --- | --- | --- |
| `american` | 美短 | 银灰经典虎斑 |
| `ginger` | 橘猫 | 暖橘条纹 |
| `black` | 黑猫 | 纯炭黑 |
| `tabby` | 虎斑猫 | 棕色鱼骨纹 |
| `cream` | 奶白猫 | 奶白浅奶油色 |
| `ragdoll` | 布偶猫 | 海豹双色、蓝眼睛 |
| `calico` | 三色梨花猫 | 三花带狸花纹 |
| `cow` | 黑白奶牛猫 | 黑白不对称斑块 |

`cats` 是冻结的只读目录，包含名称、介绍、颜色与形体设定，可用于制作选择器。`cream` 采用常规头型并固定整体比例，保留朝向、跳动和眨眼。接口不提供单独的颜色选项。

`state` 有三个取值：`default`（待命 / 好奇）、`working`（工作 / 开心）、`sleeping`（休眠 / 困困）。它只控制视觉状态；请由真实的任务开始、任务完成、用户离开等应用事件更新。组件本身不调用 AI 服务，也不推断业务状态。

## 参数

`createAvatar(target, options)` 的 `target` 必须是浏览器中独占、空的 `HTMLElement`。不要将其他内容或另一个头像挂载到同一容器。

| 参数 | 默认值 | 说明 |
| --- | --- | --- |
| `cat` | `'american'` | 上表中的猫咪 ID |
| `state` | `'default'` | 三种状态之一 |
| `size` | `96` | CSS 像素，16–2048 的整数；容器较窄时按比例缩小 |
| `paused` | `false` | 暂停自动动作；仍可更新猫咪或状态 |
| `interactive` | `true` | 启用指针跟随、点击、触摸及回车 / 空格互动 |
| `speed` | `1` | 0–4；0 停止动作 |
| `label` | 根据猫咪和状态生成 | Canvas 的无障碍标签 |
| `onError` | 输出到控制台 | `(error: Error) => void` |
| `onFrame` | 无 | `(pose: AvatarPose) => void`，接收当前绘制姿态的副本 |

错误参数会抛出异常，未知参数也会被拒绝。初始化 WebGL 等资源失败时，会先通知 `onError` 再抛出同一个错误；接入时可在创建阶段使用 `try/catch` 展示替代内容。异步绘制或上下文恢复错误通过 `onError` 通知。

## 实例方法

| 方法 / 属性 | 作用 |
| --- | --- |
| `canvas` | 该头像可见的透明 2D Canvas |
| `update(partialOptions)` | 更新指定参数，保留其他参数 |
| `poke()` | 触发问候动作；暂停、速度为 0 或减少动态时不播放 |
| `renderImage({ cat, state, size })` | 同步生成静态 Canvas；默认当前猫咪和状态、320 px，不改变已挂载头像 |
| `exportPNG({ size })` | 返回 `Promise<Blob>`；默认 1024 px，透明背景，自动居中留白 |
| `destroy()` | 移除 Canvas、事件监听与动画登记；可重复调用 |

两种图片导出的 `size` 均为 16–4096 的整数。导出使用稳定的静态姿态，并非捕捉动画中的某一帧。`destroy()` 后调用其他实例方法会抛出错误。

```js
const blob = await avatar.exportPNG({ size: 1024 });
const url = URL.createObjectURL(blob);
const link = document.createElement('a');
link.href = url;
link.download = 'mimi-cream.png';
link.textContent = '下载奶白猫';
document.querySelector('#downloads').appendChild(link);

// 下载入口不再需要时，移除 link 并调用 URL.revokeObjectURL(url)。
```

上例的 `#downloads` 由宿主页面提供。PNG 可作为静态头像分发；交互、眨眼和状态变化需要使用 JavaScript 或 React 版本。

## 运行与资源管理

- 需要支持 WebGL 2 与 Canvas 2D 的浏览器；本版本不包含 WebGL 1 渲染回退。
- 同一模块中的头像共享一个 WebGL 渲染器与动画时钟，每个实例使用独立的 2D Canvas 显示结果。多个头像仍会增加绘制工作量，应按产品实际需要设置数量和尺寸。
- 页面隐藏或头像离开视口时暂停相应动画；系统启用“减少动态效果”时使用静态姿态。该偏好变化会同步生效。
- 移除原生头像时调用 `destroy()`；最后一个实例销毁后释放共享资源。仅移除容器并不会替你销毁实例。
- 同一模块实例只能挂载到同一个 `document`。在 iframe 中使用时，应在该 frame 内单独加载模块。
- 不依赖外部图片、字体、3D 模型、HDR 或远程图像服务；猫咪形体、花纹、纸张纹理与阴影均由代码绘制。

## 来源与当前状态

动画引擎改编自 Jakub Antalik 的 [bot-avatars](https://github.com/Jakubantalik/Libraries.dev/tree/main/packages/bot-avatars)。分发时保留包内 `LICENSE`、`NOTICE.md` 和脚本中的许可证信息。猫咪形体、固定花纹、材质与接入层在本项目中实现。

当前版本已完成本地打包，**未运行应用测试、语法检查、浏览器检查或截图验收**。文档描述已实现的代码接口，不代表兼容性和运行效果已完成验证。
