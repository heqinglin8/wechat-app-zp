## Why

小程序需要一个独立于现有招聘列表和求职列表的职场讨论入口，视觉效果参考已提供的“职言”帖子流截图。该能力让用户可以浏览、搜索、分享、评论和点赞职场帖子，同时复用项目已有的 Bmob 与留言板基础设施。

## What Changes

- 新增“职言”帖子 feed 页面，页面包含三个区域：搜索行、只包含“职言”的单类目 tabbar、以及参考截图风格的职场帖子列表。
- 在 `app.json` 原生 tabBar 中新增名为“职言”的入口，入口位于“今日招聘”右侧；新增后的展示顺序为：首页、今日招聘、职言、个人中心；打开后展示帖子列表页。
- 搜索行包含搜索输入框，以及右侧一个居中的圆形加号发布入口。
- 列表数据从 Bmob `Post` 表加载，至少使用 `title`、`content`、`commitUid` 字段；通过 `commitUid` 查询 `_User` 并展示发布者信息。
- 当作者信息或帖子展示字段缺失时，使用 `<字段名>未填写` 风格的兜底文本。
- 每条列表 item 底部新增分享、评论、点赞操作：
  - 分享：打开微信原生分享弹窗；
  - 评论：跳转到“职言详情”页面；
  - 点赞：在已点赞和未点赞之间切换，已点赞使用 `#fc3`，未点赞使用浅灰色。
- 列表页图片最多展示 3 张；帖子图片超过 3 张时只展示前 3 张。
- 列表页标题最多展示 3 行；超过 3 行时展示省略号和“全文”入口，点击后进入详情页。
- 新增“职言详情”页面，视觉参考 `local_source/zhiyan-detail.jpg`，展示发布者信息、帖子标题、完整内容，以及帖子末尾最多 6 张图片。
- 详情页包含分享、评论、点赞图标；互动图标下方展示该帖子的评论列表。
- 评论复用 `MessageBoardMessage`，查询条件为 `targetType=post` 且 `targetId=<当前帖子 objectId>`。

## Capabilities

### New Capabilities
- `zhiyan-post-feed`：基于 Bmob `Post` 表的职场帖子列表与详情能力，覆盖帖子浏览、搜索、分享、评论、点赞和详情查看。

### Modified Capabilities
- 无。

## Impact

- 新增页面：预计为 `pages/zhiyan/zhiyan` 和 `pages/zhiyanDetail/zhiyanDetail`；同时需要在 `app.json` 注册路由并新增“职言”tabBar 入口。
- 新增或扩展 Bmob 数据使用：
  - `Post` 表：存储帖子记录；
  - `_User` 表：通过帖子记录的 `commitUid` 查询发布者信息；
  - `PostLike` 等点赞持久化表：记录用户对帖子的点赞状态；
  - 现有 `MessageBoardMessage` 表：通过 `targetType=post` 存储帖子评论。
- 预计复用现有工具和组件：`utils/util.js` 用于图片展示 URL，`components/message-board` 或 `utils/messageBoard.js` 用于评论，沿用现有登录和用户查询模式。
- 不破坏现有招聘、求职、个人中心或通用留言板行为。
