# Cloudflare Workers 部署

网站通过 Workers Static Assets 托管，配置位于仓库根目录的 `wrangler.jsonc`。

在 Cloudflare 的 Git 构建设置中填写：

| 设置 | 值 |
| --- | --- |
| 根目录 | 仓库根目录（留空或 `/`） |
| 构建命令 | `node build-site.mjs` |
| 部署命令 | `npx wrangler deploy` |
| Worker 名称 | `mimi` |

`build-site.mjs` 先调用现有 `build-single-file.mjs` 更新自包含的 `mimi.html`，然后重建 `site/`，只输出 `site/index.html` 和 `site/mimi.html`。首页使用 `/`，旧的 `/mimi.html` 地址仍可访问。样式与运行脚本已内嵌，无需上传源文件、SDK 压缩包或依赖目录。

本地仅打包可运行 `npm run build:site`。从仓库根目录执行 `npx wrangler deploy` 时，Wrangler 的 `build.command` 会先运行同一构建脚本。Cloudflare Workers Builds 当前不遵从这项自定义构建配置，因此在控制台中也必须填写上表的构建命令。参见 [Custom builds](https://developers.cloudflare.com/workers/wrangler/custom-builds/) 与 [Workers Builds 配置](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/)。

此前失败是因为自动配置将 `assets.directory` 设为 `.`，把仓库根目录当作网站资源上传，包含约 127 MiB 的 `node_modules` 下 `workerd` 文件，超过单文件 25 MiB 限制。现配置明确指定 `./site`，部署时只上传上述两个 HTML 文件。不要把资源目录改回 `.`，或用 `--assets .` 覆盖配置。配置字段依据 [Static Assets 配置](https://developers.cloudflare.com/workers/static-assets/binding/)。

`site/` 和 `.wrangler/` 均为本地生成目录，已加入 `.gitignore`。这是纯静态网站，不需要 Worker 入口文件或 `main` 配置。
