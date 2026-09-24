# 工作资料与历史版本

此目录保存参考资料、历史版本和开发中间文件。当前网页入口是项目根目录的 `mimi.html`；开发入口是 `index.html`，当前 SDK 源码在 `src/`。

| 文件或目录 | 用途 |
| --- | --- |
| `upstream/` | bot-avatars 参考源码与原始 MIT 许可证 |
| `previous-canvas-version/` | 早期 Canvas 版本、材质代码与效果图 |
| `prepare-renderer.mjs`、`cat-face.js` | 早期 Canvas 转换与猫脸适配脚本；转换输出位于 `previous-canvas-version/generated/` |
| `paper-geometry.js`、`paper-objects.js` | 纸模版本的开发中间代码 |
| `restyle-mimi.py` | 页面中性配色的一次性修改脚本，已适配当前项目根目录 |
| `mimi-distribution-stage/` | 分发包暂存目录，由根目录的 `build-package.mjs` 在本地重建，不纳入版本控制 |
| `migration-manifest.json` | 本地迁移记录，包含迁移时的 55 个文件清单、位置与 SHA-256；记录于迁移后路径适配之前，不纳入版本控制 |

2026-09-24 已将旧会话中的 `outputs/cat-avatar/` 内容迁入项目根目录，原 `work/` 整体迁入此目录。迁移后逐文件核对内容与迁移前一致，再更新构建路径与说明。未运行应用测试。

日常打包使用项目根目录的 `node build-package.mjs` 与 `node build-single-file.mjs`。此目录中的历史脚本不属于当前网页的运行依赖。
