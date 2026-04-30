## Context

现有 `pages/award/award` 仅从 `_User` 读取登录用户姓名、手机，再通过输入框写入 `recoName`，提交时对 `MyRecommend` 按 `(userName, recoName)` 查询并更新或新增后直接 `save()`（不再写入 `userPhone`）。产品与「推荐求职者」定位一致时，`recoName` 语义为**被推荐的求职者姓名**；用户需求是在此基础上补足简历式字段，并让姓名、联系方式可被登录者一键预填（典型场景：自荐或代填自己与本人一致的联系方式）。

## Goals / Non-Goals

**Goals:**

- 在推荐页采集：学历（单选）、联系方式、求职意向、期待薪资范围、自我介绍、其他补充。
- 进入页面并成功拿到 `_User` 时，将与「求职者身份」对应的 **姓名、联系方式** 预填为登录用户昵称与手机号（沿用现有数据源：`onReady`/首次展示时 `_User` 查询，与退出登录前逻辑一致）。
- 点击「确定」后把所有约定字段写入 Bmob **`MyRecommend`**。

**Non-Goals:**

- 不改变未登录或未查询到 `_User` 时的整体产品结构（是否与现网一致仅用 Toast/拦截可由实现阶段按产品决定，本次设计不强制新登录编排）。
- 不在此变更中重写 `pages/myaward` 展示列；若需在列表展出新字段可作为后续迭代。

## Decisions

1. **`MyRecommend` 字段建模**  
   - **保留**：`userName`（提交操作时登录用户在 `_User` 中的身份锚点）。  
   - **保留语义**：`recoName` — 被爱推荐/自荐展示的 **求职者姓名**。  
   - **新增字段**（与 Bmob 控制台 Class **列同名**，建议英文名，需在控制台添加列后再部署小程序）：  
     - `recoEducation`：学历（枚举字符串，例如 `大专` / `本科` / …，与 picker range 对齐）。  
     - `recoContact`：求职者联系方式（与预填手机号同源字段，独立于「账号手机号」时需业务确认；见 Open Questions）。  
     - `recoJobIntent`：求职意向。  
     - `recoSalaryRange`：期待薪资范围（可先存可读字符串，例如 `5k-8k`）。  
     - `recoIntro`：自我介绍。  
     - `recoExtra`：其他补充。

2. **学历控件**  
   - 使用 `picker` + `mode="selector"`，`range` 为常量数组或由设计稿给出顺序；表单层存当前选中的索引与展示文案。

3. **去重策略**  
   - **演进**：由原「仅存姓名」扩展为多维画像后，旧版 `(userPhone, userName, recoName)` 三键去重会误拦截「同一人多条更新」；且客户端已不再写入 `userPhone`。  
   - **建议**：在产品接受的前提下，使用 **`(userName, recoName)`** 查询已有行并 **更新**，或按需采用更丰富联合键（如含 `recoContact`）。**建议默认**：同一推荐人（`userName`）对同一 `recoName` **更新**上次记录而非新增第二条（实现层用查询 + `save`）。

4. **`myaward` 查询兼容性**  
   - 既有查询 `recoName == 当前用户名` 用于「谁推荐过我」一类展示逻辑；新增的求职者姓名字段若仍写入 `recoName`，则兼容性保持。**预填默认为登录用户名**不会改变该语义。

## Risks / Trade-offs

- **[Risk]** Bmob 表未预先创建列，`set` 新字段报错或静默失败 → **Mitigation**：在控制台为 `MyRecommend` 增加上述列并完成一次联调；必填项与长度限制与 Bmob 配额策略对齐。  
- **[Risk]** 去重规则变更与用户心理预期不符（以为在「修改」结果却「新增多条」） → **Mitigation**：在 UX 上对「已成功提交」「已更新档案」用语区分并在任务中单测关键路径。

## Migration Plan

1. 在 Bmob 控制台 **`MyRecommend`** Class 中添加新列（类型：**String**，长文本字段用类型支持足够长度时需确认 Bmob **String/Text**）。  
2. 发布新版本小程序；无需老数据回填，旧记录新列为空兼容展示。  
3. **Rollback**：移除小程序端对新字段的 `set`/表单项提交；保留列不影响旧客户端。

## Open Questions

- **`recoContact` 与用户账号手机号**：若产品上「联系方式」必须与账号手机一致，可只用一个字段并 UI 禁用编辑；若允许填他人微信或备用号，则依赖独立列 `recoContact`（不再在 `MyRecommend` 上冗余写入账号 `userPhone`）。
