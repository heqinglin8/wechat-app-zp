## Context

当前项目是基于 Bmob 的微信原生小程序。现有页面通常在 Page 模块内直接查询 Bmob，使用 `wx.getStorageSync('objectId')` / `Bmob.User.current()` 识别当前用户，并通过 `targetType + targetId` 复用 `components/message-board` 展示详情页留言。

新增的“职言”体验是职场帖子 feed，不是招聘岗位列表。列表页视觉参考 `local_source/zhiyan-list.jpg`，详情页视觉参考 `local_source/zhiyan-detail.jpg`，实现方式需要贴合项目现有约定：页面级 JS/WXML/WXSS、Bmob 查询，以及少量共享工具。

## Goals / Non-Goals

**Goals:**
- 新增“职言”feed 页面，包含搜索、单个“职言”类目 tab、帖子卡片，以及每条卡片的分享/评论/点赞操作。
- 在 `app.json` 中新增原生“职言”入口，使用户可以从底部导航进入帖子列表；该入口位于当前“今日招聘”右侧，新增后的 tabBar 顺序为：首页、今日招聘、职言、个人中心。
- 新增“职言详情”页面，展示作者信息、帖子标题、完整内容、最多 6 张图片、互动操作和评论。
- 将帖子数据绑定到 Bmob `Post` 表，并通过帖子记录的 `commitUid` 关联 `_User` 作者信息。
- 持久化每个用户的点赞状态，使列表页和详情页都能区分已点赞/未点赞。
- 复用 `MessageBoardMessage` 存储帖子评论，使用 `targetType=post`。

**Non-Goals:**
- 完整的帖子发布表单不在本次范围内，除非项目中已存在发布页面。feed 必须提供发布入口，并在目标路由不存在时优雅提示。
- 帖子审核、推荐排序或管理后台不在本次范围内。
- 不改变现有招聘、求职、个人中心或通用留言板行为。

## Decisions

### 1. 为帖子域新增独立页面

新增页面建议为 `pages/zhiyan/zhiyan` 和 `pages/zhiyanDetail/zhiyanDetail`，并在 `app.json` 中注册。

理由：帖子 feed 的布局和数据模型与 `pages/today`、`pages/index` 不同。独立页面可以避免把帖子 UI 与招聘列表逻辑耦合在一起。

备选方案：在 `pages/today/today` 中新增另一种模式。该方案会把角色切换、招聘列表和职场帖子混在同一个页面里，维护成本更高。

### 2. 通过原生 tabBar 暴露帖子列表

在 `app.json` 的 `tabBar.list` 中新增名为“职言”的项，`pagePath` 指向 `pages/zhiyan/zhiyan`。该入口放在现有“今日招聘”入口右侧，使用户可以从应用级底部导航直接进入帖子列表。新增后的 tabBar 展示顺序必须为：首页、今日招聘、职言、个人中心。

理由：用户明确要求在 `app.json` 的“今日招聘”附近增加“职言”入口，而原生 tabBar 正是由 `app.json` 控制的应用级导航。

取舍：新增原生 tabBar 项需要图标资源。若最终图标暂时不可用，实现时可以临时复用项目中已有的中性图标，但必须保证 `app.json` 图标路径有效，且选中/未选中状态可读。

### 3. 先查询 `Post`，再补全 `_User` 作者信息

列表页应先按有效状态和时间倒序查询 `Post`，然后收集去重后的 `commitUid`，再查询 `_User` 中对应作者记录。每条规范化后的帖子视图数据应包含：
- 帖子标识：`objectId`
- 帖子文本：`title`、`content`
- 图片：从 `photoImgs` 或兼容图片字段解析
- 作者展示信息：来自 `_User`
- 互动数据：点赞数、当前用户是否已点赞

理由：需求明确要求使用帖子记录的 `commitUid` 绑定发布者；项目现有代码也普遍使用 `_User.objectId` 作为用户锚点。

取舍：Bmob 在本地没有关系型 join，因此列表加载需要额外查询。实现时应保持较小分页量；如果 SDK 支持批量条件则按去重作者 ID 批量查询，否则回退到逐作者查询。

### 4. 使用独立 `PostLike` 表记录点赞

新增或使用类似 `PostLike` 的 Bmob 表，字段包括：
- `postId`
- `userId`
- 可选的作者/帖子冗余元数据，仅在后续确实需要时添加

UI 可以通过 `PostLike.count()` 计算 `likeCount`，并通过 `(postId, userId)` 查询当前用户是否已点赞。未来可以把 `likeCount` 冗余到 `Post` 上做性能优化，但点赞切换的事实来源应仍是 `PostLike`。

理由：点赞需要按用户持久化状态，并支持切换和颜色区分。独立表符合现有 `MyCollectInfo` 的模式，也避免在 `Post` 中维护可变用户数组。

备选方案：只在 `Post` 上存 `likedUserIds` 或 `likeCount`。该方案读取更简单，但并发切换时更脆弱，且不利于可靠判断“当前用户是否已点赞”。

### 5. 复用现有留言板模型作为评论

详情页应通过 `components/message-board` 或基于 `utils/messageBoard.js` 的等价页面级调用展示评论，并传入：
- `targetType="post"`
- `targetId="<当前帖子 objectId>"`

理由：`MessageBoardMessage` 已支持通用的 `targetType + targetId` 挂载模型，包含作者元数据、图片、回复、敏感词隐藏和分页。

取舍：默认留言板 UI 可能无法完全贴合截图。如果视觉一致性优先，建议先复用数据模型，再在详情页宿主区域或帖子专用评论展示层上调整样式。

### 6. 使用微信原生分享

列表页和详情页的分享操作使用 `button open-type="share"` 与 `onShareAppMessage` 实现，并通过按钮 dataset 区分当前分享的帖子。

理由：用户要求点击分享后弹出分享弹窗，而微信小程序原生分享面板是平台支持的分享弹窗；项目中已有同类用法。

### 7. 检测标题溢出后展示“全文”

列表页标题显示限制为 3 行。为了避免每条帖子都展示“全文”，数据渲染后应使用隐藏的未截断测量节点，比较实际高度和 `3 * lineHeight`，仅对溢出的帖子设置 `showTitleFullAction=true`。

理由：纯 CSS 可以截断文本，但无法可靠判断是否真的发生溢出。测量逻辑能更准确满足“超出才展示全文”的要求。

降级方案：如果旧客户端测量失败，则使用保守的文本长度阈值，让明显较长的标题仍能提供详情入口。

### 8. 图片解析沿用现有约定

使用 `photoImgs` 作为主要图片字段，格式为半角 `|` 分隔的字符串，与现有招聘/求职图片存储方式一致。每个路径通过 `utils/util.toDisplayUrl` 规范化。列表页取前 3 张，详情页取前 6 张。

## Risks / Trade-offs

- [风险] 作者补全在大分页下可能产生较多 Bmob 请求。-> 控制 feed 分页大小，并在 SDK 支持时按去重 `commitUid` 批量查询。
- [风险] 点赞写入成功但刷新失败时，点赞数可能短暂不一致。-> 仅在 save/destroy 成功后更新 UI，并在后台刷新该帖子的点赞状态和数量。
- [风险] `Post` 图片字段缺失或格式不一致会导致图片为空。-> 明确 `photoImgs` 为主字段，其他图片字段只作为兼容兜底。
- [风险] 发布图标可能指向尚未实现的页面。-> 导航失败时显示“发布功能开发中”，避免路由错误或白屏。
- [风险] 新 tabBar 入口可能缺少最终图标资源。-> 必要时临时使用项目已有图标，并确保 `app.json` 路径有效。
- [风险] 留言板组件默认样式可能与截图不完全一致。-> 优先复用数据模型，实施时再调整详情页评论宿主区域视觉。

## Migration Plan

1. 在 Bmob 中增加表/字段：
   - `Post`：`title`（String）、`content`（String）、`commitUid`（String）、`photoImgs`（String）、可选 `active`（Number/Boolean）。
   - `PostLike`：`postId`（String）、`userId`（String）。
   - 现有 `MessageBoardMessage` 可直接支持评论；无需新增 schema，只需写入 `targetType=post`。
2. 在 `app.json` 中注册新页面，并新增名为“职言”的原生 tabBar 项，打开 `pages/zhiyan/zhiyan`；tabBar 展示顺序为：首页、今日招聘、职言、个人中心。
3. 发布页面代码后，用已有或种子 `Post` 数据验证 feed 可加载。
4. 回滚时移除新增页面入口和路由；新增数据表不影响现有功能。

## Open Questions

- 本次变更中发布图标应跳转完整发布页，还是先作为入口/占位，等后续单独提出发布功能变更？
