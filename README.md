# dsh-purge 修复 + 预设闸门

给 [dsh-purge Community](https://github.com/kingcharleslzy-ai/dsh-purge)（DSH 桌面版插件）做的一次**修复 + 功能改动**。改完之后：

- **换包装不上的问题修好了**（Windows 上 `app.asar` 挪不走，74 条补丁等于没打）；
- **破甲和权限补丁只在指定模式生效**，其它模式（标准、ptc、极简、创造等）回到 DSH 原版；
- 每个普通模式不再每步多背约 6,100 tokens 的提示词。

> 全程由 DSH 辅助完成，特此感谢大肥鱼。

---

## 一、它到底改了什么

### 1. 修了一个会让插件白装的 bug

插件的工作方式是：把 74 条补丁写进解包后的 `resources\app`，然后把 `app.asar` 改名挪走，让 DSH 下次从解包目录启动。在 Windows 上，"挪走 `app.asar`"这一步要靠一个后台小程序（helper）在你退出 DSH 后执行。

原版这里有个参数拼装错误，导致那个 helper 启动后什么都不做就退出，于是：**补丁全写进去了，但 DSH 永远从旧的 `app.asar` 启动，一条都没生效**。面板只会显示"换包失败 / 助手意外结束"。

这份改动修好了参数拼装；另外发现有些机器上 WMI 根本拉不起 PowerShell，于是加了"计划任务兜底 + 每分钟重试"，helper 被杀掉也能自己补上。

### 2. 加了一个"预设闸门"

原来的问题是：补丁是全局的，破甲提示词也是全局的——不管你开的是标准模式还是 ptc 模式，都在享受"破甲 + 权限全开"。

现在按**会话预设**判定：

| 模式 | 破甲 | 权限补丁 |
| --- | --- | --- |
| 无限制（`unrestricted`）、红队（`redteam`） | 有 | 生效 |
| 标准、ptc、极简、其它未列出的 | 无 | 走 DSH 原版 |

名单写在 `%USERPROFILE%\.dsh\dsh-purge\gate-presets.json`，白名单式：**新加的模式默认就是原版**，不用再改代码。

> 和上游的关系：上游其实已经有 `excludePresets`，但那只管**提示词注入**；"能不能越界写文件、审批要不要弹窗、提权要不要确认"这些执行能力仍然全局放开。这份改动把闸门做到了执行层，并顺手修了换包那个 bug。两件事都不在上游仓库里（截至 1.7.20）。

### 3. 让普通模式不再背提示词成本

被排除的预设不再注入破甲段，每步省约 6,100 tokens（20 步的任务大约省 12 万 input tokens）。

---

## 二、适用版本（重要）

| 组件 | 实测版本 |
| --- | --- |
| DSH Desktop | **0.2.1-rc.2** |
| 插件 dsh-purge-community | **1.7.20** |

**其它版本没有实测。** 宿主代码一旦升级，行号和上下文会变，直接覆盖补丁文件可能出错。

推荐用法：**把本仓库整个交给 AI**，让它照 `docs/修复说明.md` 在你自己的机器上逐步复现（它会先 diff 再改，不会盲覆盖）。

---

## 三、仓库里有什么

| 路径 | 内容 |
| --- | --- |
| `docs/修复说明.md` | 完整技术记录：三个故障的根因、每处改动、验证结果、回滚步骤 |
| `patches/windows-asar-handoff.patch` | 插件换包 bug 的修复补丁 |
| `patches/host/*.js` | 宿主侧闸门的文件快照 + 覆盖路径对照表 |
| `scripts/reapply-purge-fix.mjs` | 幂等重放脚本：插件/宿主更新后跑一次 |
| `scripts/purge-handoff-task.mjs` | 换包卡住时手动拉起 helper 的工具 |
| `config/gate-presets.json` | 闸门名单示例（默认只含 `unrestricted`、`redteam`） |

---

## 四、怎么用（三步）

1. 装好 `dsh-purge-community 1.7.20`，在面板点一次「应用」，让宿主解包出 `resources\app`；
2. 按 `patches/host/README.md` 的对照表覆盖文件，写入 `config/gate-presets.json` 到 `%USERPROFILE%\.dsh\dsh-purge\`；
3. 退出并重开 DSH。

回滚方式在 `docs/修复说明.md` 的最后一节：每个改过的文件都有 `.bak-*` 备份，覆盖回去即可。

---

## 五、许可与署名

- 上游 **dsh-purge** 作者：**小杨 / YuJunZhiXue**（<https://github.com/YuJunZhiXue/dsh-purge>）
- Community 分支维护：**kingcharleslzy-ai**（<https://github.com/kingcharleslzy-ai/dsh-purge>）
- 本项目为上述 MIT 项目的**衍生修改**，同样以 MIT 发布，保留全部原始版权声明。

按上游要求：这是非官方修改版，**未获得原作者或维护者背书**，也**不用于付费转售**。原作者与维护者的名字、许可证文本均已保留，详见 [NOTICE.md](NOTICE.md)。

---

## 六、风险提示

- 改动涉及 DSH 宿主内部文件，属于"非官方补丁"，官方更新后可能需要重放；
- 闸门默认关闭（名单为空时 = 旧行为），配置错了最多是"没生效"，不会让 DSH 起不来；
- 不建议在你不了解影响的生产环境直接套用。
