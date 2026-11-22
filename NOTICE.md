# Attribution / 署名与来源

本项目是 **[dsh-purge](https://github.com/YuJunZhiXue/dsh-purge)** 的衍生修改，**不是官方发行版，未获得原作者或维护者背书**。

| 角色 | 署名 |
| --- | --- |
| 原始 dsh-purge 作者 | **小杨 / YuJunZhiXue** — <https://github.com/YuJunZhiXue/dsh-purge> |
| Community 分支维护 | **kingcharleslzy-ai** — <https://github.com/kingcharleslzy-ai/dsh-purge> |
| 本仓库的修改（换包修复 + 预设闸门） | 见 `LICENSE` 第三行与提交历史 |

## 上游对本类衍生作品的要求（逐条对照）

上游 `NOTICE.md` 的原文要求，以及本仓库的落实情况：

| 要求 | 落实 |
| --- | --- |
| 保留原始版权与 MIT 许可证 | `LICENSE` 保留小杨与 kingcharleslzy-ai 两行版权，正文为 MIT 原文 |
| 保留来源与历史署名 | 本文件与 `README.md` 均注明上游仓库地址与作者 |
| 不声称是官方版本或获得背书 | `README.md` 第五节、本文件开头均明示"非官方、未背书" |
| 不用于付费转售 | 本仓库不提供任何付费版本、不接付费代装 |
| 第三方材料保留其声明 | 本仓库未包含上游的第三方素材（图标、截图、测试夹具等） |

## 改了什么

- 修复 `lib/windows-asar-handoff.js`：helper 参数从"单引号包裹的整串"改为 argv 数组；WMI 不可用时改用计划任务拉起，并分钟级重试。
- 新增运行时闸门 `@deepseek-ai/dsh-purge-gate`：按会话预设决定补丁是否生效（白名单式）。
- 在 5 处宿主中枢接入闸门：策略解析、`confine`、文件围栏、审批、提权；并让 5 个提权调用点传递闸门标记。
- 通过插件配置 `excludePresets` 收窄破甲提示词注入范围。

## 没改什么

- 未修改上游插件除 `lib/windows-asar-handoff.js` 之外的任何逻辑；
- 未修改破甲提示词正文，只改它的适用范围；
- 不包含任何用户数据、账号、凭据、会话记录；
- 未重新分发上游的图标、截图、技能包或测试夹具。

## 许可兼容

上游与社区分支均为 MIT。本项目同样以 MIT 发布，保留原始版权声明；衍生部分不改变原许可证义务。
