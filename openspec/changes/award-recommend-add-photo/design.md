## Context

推荐页 `pages/award/award` 已通过 Bmob 写入 `JobSeeker`，字段包含 `recoSalaryRange` 等；页面加载时已用 `wx.getStorageSync('objectId')` 校验登录。小程序已集成 `wx.Bmob`。用户希望薪资栏下方支持多图上传，URLs 拼入 `photoImgs`；每条推荐还须将当前登录用户 `objectId` 写入 `commitUid`。Bmob 控制台需为 `JobSeeker` 增加字符串列 `photoImgs` 与 `commitUid`。

## Goals / Non-Goals

**Goals:**

- 在「期望薪资」输入行下方提供多图选择与上传能力；上传成功后持有可提交的 URL 列表。
- 提交推荐时将多张图的 URL 用全角分隔符 `｜` 拼成一条字符串写入 `photoImgs`。
- 每次提交将当前登录用户的 `objectId` 写入 `commitUid`（与通过 `objectId` 拉取 `_User` 的会话一致）。
- 未选择图片时行为与今日一致（不把无效占位写入数据库，或写入空字符串，与现有可选字段策略一致）。
- 上传实现遵循 Bmob 官方在微信小程序中的用法：`wx.chooseImage` → 对每个本地临时路径构造 `Bmob.File` → `save()`，收集返回的文件 URL。

**Non-Goals:**

- 不要求改版「我的推荐」列表页的展示（若后续要展示图片可单独迭代）。
- 不要求服务端图片压缩、水印或异步审核流程。
- 不要求修改现有必填校验规则（图片始终选填）。

## Decisions

1. **分隔符**：使用产品约定的全角竖线 `｜`（U+FF5C）拼接多个 URL，避免与 URL 中出现的半角 `|` 混淆的概率（仍须在生成侧保证 URL 字符串本身不含该分隔符；常规 HTTP URL 不含此字符）。
2. **多文件上传**：对用户选的每张临时路径分别创建 `Bmob.File`；文件名使用唯一前缀（例如时间戳 + 索引 + `.jpg`），避免云端同名覆盖。各 `save()` 完成后汇总 `url`（或 SDK 返回结构中可用的永久访问地址），再拼接写入表单状态。
3. **交互**：一次 `wx.chooseImage` 可多选（在 `chooseImage` 能力范围内）；可提供「重新选择」清空本地已选 URL 列表（实现可选用删除单项或整体清空）。
4. **提交顺序**：在用户点击「确定」且表单校验通过后，若仍有待上传的本地文件则先完成上传再调用现有的 `JobSeeker` 查询/新建/更新逻辑；或在用户选图后立即上传仅缓存 URL——优先 **选图后异步上传 + 提交时仅写 URL**，降低用户在提交按钮上长时间阻塞的概率；若采用「提交时再上传」，须展示 loading 并禁用重复提交。
5. **推荐**：采用 **选择后立即上传**（或后台队列），提交时只校验 URL 列表是否就绪；上传失败时用 Toast 提示并阻止不完整提交。
6. **commitUid**：在 `applyJobSeekerFields`（或等价提交路径）中 `row.set('commitUid', objectId)`；`objectId` 来自与 `onReady` 登录检查相同的来源（如 `wx.getStorageSync('objectId')`），无有效 `objectId` 时不应允许进入提交流程（与现有一致）。

## Risks / Trade-offs

- **[Risk]** 弱网或大图导致上传慢或失败 → **Mitigation**：每张图上传显示进度或全局 loading；失败允许重试或移除该图。
- **[Risk]** 示例代码中对多张图只保留了最后一个 `file` 实例 → **Mitigation**：实现中对每张路径单独 `save()` 并收集全部结果，禁止复用单个变量覆盖。
- **[Trade-off]** `photoImgs` 为拼接字符串，查询侧不便按单图检索 → 当前业务仅需存储与展示串，可接受。

## Migration Plan

1. 在 Bmob 控制台为 `JobSeeker` 添加列 `photoImgs`（String）、`commitUid`（String）。
2. 发布小程序新版本；旧客户端不写新字段时服务端可为空。
3. 回滚：下架新版本即可；已写入的新字段数据保留无损。

## Open Questions

- 是否在「我的推荐」详情中展示图片：待定（本变更可不实现）。
- 单用户单次推荐的最大图片张数上限（防止滥用）：建议在实现时设常量上限（例如 9 张），需在编码前与产品确认。
