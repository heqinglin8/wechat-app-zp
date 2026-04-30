## Context

推荐页 `pages/award/award` 已通过 Bmob 写入 `MyRecommend`，字段包含 `recoSalaryRange` 等；页面加载时已用 `wx.getStorageSync('objectId')` 校验登录；小程序已集成 `wx.Bmob`。本条变更将提交人姓名字段统一为 **`commitUsername`**（不再使用列名 `userName` 表示提交人）；并写入 `photoImgs`、`commitUid`。控制台须具备对应列。

## Goals / Non-Goals

**Goals:**

- 在「期望薪资」输入行下方提供多图选择与上传能力；上传成功后持有可提交的 URL 列表；**提交前**列表合计 **最多 6 张**。
- 任一配图槽位在用户提交整条推荐之前均可 **替换**（覆盖待上传临时文件或已有云端 URL 对应项）。
- 提交推荐时将多张图的 URL 用半角竖线 `|` 拼成一条字符串写入 `photoImgs`。
- 每张图在上传至 Bmob 之前完成体积与类型校验（见 Decisions）。
- 每次提交将当前登录用户的 `objectId` 写入 `commitUid`（与通过 `objectId` 拉取 `_User` 的会话一致）。
- 未选择图片时行为与今日一致（不把无效占位写入数据库，或写入空字符串，与现有可选字段策略一致）。
- 上传实现遵循 Bmob 官方在微信小程序中的用法：`wx.chooseImage` → 对每个本地临时路径构造 `Bmob.File` → `save()`，收集返回的文件 URL。

**Non-Goals:**

- 不要求改版「我的推荐」列表页的展示（若后续要展示图片可单独迭代）。
- 不要求服务端图片压缩、水印或异步审核流程。
- 不要求修改现有必填校验规则（图片始终选填）。

## Decisions

1. **分隔符**：使用半角竖线 `|`（U+007C）拼接多个 URL；读写侧解析 `photoImgs` 时按 `|` 拆分。若个别 CDN URL 在未编码片段中含 `|`（少见），可能影响拆分——业务上以当前存储格式为准。
2. **上传前校验**：对每张本地临时路径在上传前 MUST：（a）用 `wx.getFileSystemManager().getFileInfo`（或等价 API）读取大小，**小于等于 3MB**（即小于等于 `3145728` 字节），超出则 Toast 提示并跳过该文件或中止本轮；（b）**仅允许图片类型**——在 `wx.chooseImage` 来源基础上，再以扩展名白名单（如 `.jpg`/`.jpeg`/`.png`/`.gif`/`.webp`/`.bmp`，大小写不敏感）或小程序可得的类型信息校验，不匹配则拒绝上传并提示。
3. **多文件上传**：对用户选的每张临时路径在校验通过后分别创建 `Bmob.File`；文件名使用唯一前缀（例如时间戳 + 索引 + `.jpg`），避免云端同名覆盖。各 `save()` 完成后汇总 `url`（或 SDK 返回结构中可用的永久访问地址），再拼接写入表单状态。
4. **数量上限**：提交前「有效配图槽位」总数 MUST **≤ 6**。调用 `wx.chooseImage` 时 `count`（或等价参数）取 **剩余槽位数**（`6 - 当前已占槽位数`），避免单次或累计超出；已达 6 张时隐藏或禁用「添加」入口并提示。
5. **替换**：每个槽位提供明确交互（如缩略图上的「替换」）；替换时对目标槽位重新走选图 → 体积/类型校验 → 上传（若采用即选即传）；用新结果覆盖该槽位在内存中的本地路径或 URL。**不要求**删除被替换的旧文件在云存储中的副本（可作为后续清理需求）。
6. **交互**：一次 `wx.chooseImage` 可多选，但新增张数不得超过剩余槽位；仍可提供删除某一槽位或「清空全部配图」。替换与删除互斥规则以实现 UX 为准。
7. **提交顺序**：在用户点击「确定」且表单校验通过后，若仍有待上传的本地文件则先完成上传再调用现有的 `MyRecommend` 查询/新建/更新逻辑；或在用户选图后立即上传仅缓存 URL——优先 **选图后异步上传 + 提交时仅写 URL**，降低用户在提交按钮上长时间阻塞的概率；若采用「提交时再上传」，须展示 loading 并禁用重复提交。
8. **推荐**：采用 **选择后立即上传**（或后台队列），提交时只校验 URL 列表是否就绪；上传失败时用 Toast 提示并阻止不完整提交。
9. **commitUsername / commitUid**：在 `applyMyRecommendFields`（或等价路径）中 `row.set('commitUsername', …)` 写入提交人姓名（与页面当前使用的提交人名字串一致），`row.set('commitUid', objectId)`；`objectId` 来源同 `onReady` 登录检查（如 `wx.getStorageSync('objectId')`）。既有按提交人查询/去重的条件 MUST 改为字段 **`commitUsername`**（不再使用 `userName` 列）。

## Risks / Trade-offs

- **[Risk]** 用户选择 HEIF 等相册原生格式导致扩展名校验误判 → **Mitigation**：白名单与 `wx.chooseImage` 文档约定对齐；必要时按基础库补充 MIME / `tempFiles` 信息。
- **[Risk]** 弱网或大图导致上传慢或失败 → **Mitigation**：每张图上传显示进度或全局 loading；失败允许重试或移除该图；超限文件已在本地校验阶段拦截。
- **[Risk]** 示例代码中对多张图只保留了最后一个 `file` 实例 → **Mitigation**：实现中对每张路径单独 `save()` 并收集全部结果，禁止复用单个变量覆盖。
- **[Trade-off]** 替换后旧图文件可能留在 Bmob 文件存储中 → **Mitigation**：可接受；若需节省存储再迭代后台清理任务。
- **[Trade-off]** `photoImgs` 为拼接字符串，查询侧不便按单图检索 → 当前业务仅需存储与展示串，可接受。
- **[Trade-off]** 分隔符选用 `|` 时，若未来某张图的 URL 内含未编码的 `|`，拆分展示可能失真 → 依赖上游 URL 不含裸分隔符或使用编码 URL。

## Migration Plan

1. 在 Bmob 控制台为 `MyRecommend` 确认或新增列：`commitUsername`（String）、`photoImgs`（String）、`commitUid`（String）；弃用或迁移旧列 `userName`（若曾用于提交人）。
2. 发布小程序新版本；旧客户端不写新字段时服务端可为空。
3. 回滚：下架新版本即可；已写入的新字段数据保留无损。

## Open Questions

- 是否在「我的推荐」详情中展示图片：待定（本变更可不实现）。
