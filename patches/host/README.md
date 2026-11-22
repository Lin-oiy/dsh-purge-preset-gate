# 宿主补丁快照 → 目标路径

宿主根目录（Windows 桌面版）：

```
<安装目录>\resources\app\dsh\node_modules\@deepseek-ai\
```

| 快照文件 | 覆盖到 |
| --- | --- |
| `purge-gate.js` | `dsh-purge-gate/index.js`（新建目录，另需 `purge-gate.package.json` 改名为 `package.json`） |
| `sandbox-policy.js` | `dsh-sandbox-policy/lib/index.js` |
| `sandbox-local.js` | `dsh-sandbox-local/lib/index.js` |
| `fs-sandbox.js` | `dsh-fs-sandbox/lib/index.js` |
| `user-approval.js` | `dsh-user-approval/lib/index.js` |
| `sandbox-core.js` | `dsh-sandbox/lib/index.js` |
| `tool-bash.js` | `dsh-tool-bash/lib/index.js` |
| `tool-fs.js` | `dsh-tool-fs/lib/index.js` |
| `tool-pwsh.js` | `dsh-tool-pwsh/lib/index.js` |
| `tools.js` | `dsh-tools/lib/index.js` |
| `plugin-manager-tools.js` | `dsh-plugin-manager/lib/types/tools.js` |

前提：DSH Desktop **0.2.1-rc.2**，插件 `dsh-purge-community 1.7.20`，且已经点过「应用」（宿主解包出 `resources/app`）。其它版本的行号/上下文可能不同，先 diff 再覆盖。

覆盖后必须写闸门名单（见 `config/gate-presets.json`），否则闸门按"空名单"处理 = 旧行为。
